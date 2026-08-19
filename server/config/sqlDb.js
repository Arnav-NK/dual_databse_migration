const path = require('path');
const fs = require('fs');

let sqlClient = null;
let dbEngine = null; // 'postgres' | 'sqlite'

const connectSQL = async () => {
  let databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    const { Pool } = require('pg');
    
    // Clean up Neon connection string if channel_binding is present
    let cleanUrl = databaseUrl;
    if (cleanUrl.includes('channel_binding=')) {
      cleanUrl = cleanUrl.replace(/[?&]channel_binding=[^&]+/g, '');
    }

    const isNeon = cleanUrl.includes('neon.tech');
    const isSslRequired = cleanUrl.includes('sslmode=') || isNeon || process.env.NODE_ENV === 'production';

    const pool = new Pool({
      connectionString: cleanUrl,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    // Test connection with retry for serverless wake-up
    let connected = false;
    let attempts = 0;
    while (!connected && attempts < 3) {
      try {
        attempts++;
        const client = await pool.connect();
        const hostName = pool.options.host || 'Neon/PostgreSQL';
        console.log(`🐘 SQL Connected: PostgreSQL (${isNeon ? 'Neon Serverless' : 'PostgreSQL'}) on ${hostName}`);
        client.release();
        connected = true;
      } catch (err) {
        console.warn(`PostgreSQL connection attempt ${attempts} failed: ${err.message}. Retrying in 2s...`);
        if (attempts >= 3) throw err;
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    dbEngine = isNeon ? 'neon-postgres' : 'postgres';
    sqlClient = {
      engine: dbEngine,
      isNeon,
      async query(text, params = []) {
        let pgText = text;
        let index = 1;
        while (pgText.includes('?')) {
          pgText = pgText.replace('?', `$${index++}`);
        }
        const res = await pool.query(pgText, params);
        return res.rows;
      },
      pool
    };

    // Auto-create users table
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Auto-create todos table
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure user_id column exists if table existed previously
    try {
      await sqlClient.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id VARCHAR(64);`);
    } catch (e) {
      // Ignored if column already exists
    }
  } else {
    // SQLite Fallback (for local testing without needing Postgres setup)
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(process.env.SQL_FILE_PATH || path.join(__dirname, '../todos.sqlite'));

    const db = await new Promise((resolve, reject) => {
      const sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) return reject(err);
        resolve(sqliteDb);
      });
    });

    console.log(`🗄️ SQL Connected: SQLite (local database at ${path.basename(dbPath)})`);
    dbEngine = 'sqlite';

    sqlClient = {
      engine: 'sqlite',
      isNeon: false,
      async query(sql, params = []) {
        return new Promise((resolve, reject) => {
          const trimmedSql = sql.trim().toUpperCase();
          if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('PRAGMA')) {
            db.all(sql, params, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          } else {
            db.run(sql, params, function (err) {
              if (err) reject(err);
              else resolve({ changes: this.changes, lastID: this.lastID });
            });
          }
        });
      },
      db
    };

    // Auto-create users table in SQLite
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Auto-create todos table in SQLite
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Safe column check for SQLite
    try {
      const columns = await sqlClient.query(`PRAGMA table_info(todos);`);
      const hasUserId = columns.some((col) => col.name === 'user_id');
      if (!hasUserId) {
        await sqlClient.query(`ALTER TABLE todos ADD COLUMN user_id TEXT;`);
      }
    } catch (e) {
      // Ignored
    }
  }

  return sqlClient;
};

const getSQLClient = () => sqlClient;
const getSQLEngine = () => dbEngine;

module.exports = {
  connectSQL,
  getSQLClient,
  getSQLEngine
};
