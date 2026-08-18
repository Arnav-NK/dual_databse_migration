const path = require('path');
const fs = require('fs');

let sqlClient = null;
let dbEngine = null; // 'postgres' | 'sqlite'

const connectSQL = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    // PostgreSQL / Neon DB Connection
    const { Pool } = require('pg');
    const isNeon = databaseUrl.includes('neon.tech');
    const isSslRequired = databaseUrl.includes('sslmode=require') || isNeon || process.env.NODE_ENV === 'production';

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false
    });

    // Test connection
    const client = await pool.connect();
    const hostName = pool.options.host || 'Neon/PostgreSQL';
    console.log(`🐘 SQL Connected: PostgreSQL (${isNeon ? 'Neon Serverless Postgres' : 'PostgreSQL'}) on ${hostName}`);
    client.release();

    dbEngine = isNeon ? 'neon-postgres' : 'postgres';
    sqlClient = {
      engine: dbEngine,
      isNeon,
      async query(text, params = []) {
        // Convert ? placeholders to $1, $2, etc. if needed
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

    // Auto-create table
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id VARCHAR(64) PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
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

    // Auto-create table
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
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
