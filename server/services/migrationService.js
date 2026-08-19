const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { connectSQL, getSQLClient, getSQLEngine } = require('../config/sqlDb');
const User = require('../models/User');
const Todo = require('../models/Todo');

// Helper to ensure both databases are connected
async function ensureConnections() {
  // Connect MongoDB if not connected
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // Connect SQL if not connected
  let sql = getSQLClient();
  if (!sql) {
    sql = await connectSQL();
  }

  return { sql };
}

// 1. Migrate SQL -> MongoDB
async function migrateSQLToMongo() {
  const { sql } = await ensureConnections();

  console.log('🔄 Starting Migration: SQL (Neon/Postgres/SQLite) -> MongoDB (NoSQL)...');

  // Step A: Fetch all users from SQL
  const sqlUsers = await sql.query('SELECT * FROM users');
  console.log(`📋 Found ${sqlUsers.length} users in SQL database.`);

  const userMap = {}; // sqlUserId -> mongoUserId

  for (const sqlUser of sqlUsers) {
    const email = sqlUser.email.toLowerCase().trim();
    // Direct upsert preserving existing bcrypt password hash
    let mongoUser = await User.findOne({ email });

    if (!mongoUser) {
      // Create directly using MongoDB driver / bypass pre-save hash to preserve already-hashed password
      const result = await User.collection.insertOne({
        email: email,
        password: sqlUser.password, // Keep existing bcrypt hash
        createdAt: sqlUser.created_at ? new Date(sqlUser.created_at) : new Date(),
        updatedAt: sqlUser.updated_at ? new Date(sqlUser.updated_at) : new Date()
      });
      userMap[String(sqlUser.id)] = String(result.insertedId);
      console.log(`  ➕ Created MongoDB user: ${email}`);
    } else {
      userMap[String(sqlUser.id)] = String(mongoUser._id);
      console.log(`  ✔️ Existing MongoDB user mapped: ${email}`);
    }
  }

  // Step B: Fetch all todos from SQL
  const sqlTodos = await sql.query('SELECT * FROM todos');
  console.log(`📋 Found ${sqlTodos.length} todos in SQL database.`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const sqlTodo of sqlTodos) {
    const targetUserId = sqlTodo.user_id ? userMap[String(sqlTodo.user_id)] : null;
    const completed = Boolean(sqlTodo.completed === true || sqlTodo.completed === 1);

    // Check if task already exists for this user in MongoDB (matching text and user)
    let filter = { text: sqlTodo.text };
    if (targetUserId) {
      filter.user = targetUserId;
    }

    const existingMongoTodo = await Todo.findOne(filter);

    if (!existingMongoTodo) {
      const todoDoc = {
        text: sqlTodo.text,
        completed: completed,
        createdAt: sqlTodo.created_at ? new Date(sqlTodo.created_at) : new Date(),
        updatedAt: sqlTodo.updated_at ? new Date(sqlTodo.updated_at) : new Date()
      };
      if (targetUserId) {
        todoDoc.user = targetUserId;
      }

      await Todo.collection.insertOne(todoDoc);
      insertedCount++;
      console.log(`  ➕ Migrated Todo: "${sqlTodo.text}"`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n🎉 SQL -> MongoDB Migration Complete!`);
  console.log(`  Users Mapped: ${Object.keys(userMap).length}`);
  console.log(`  Todos Added: ${insertedCount} (Skipped Duplicates: ${skippedCount})\n`);

  return {
    status: 'Success',
    direction: 'SQL -> MongoDB',
    usersCount: Object.keys(userMap).length,
    todosInserted: insertedCount,
    todosSkipped: skippedCount
  };
}

// 2. Migrate MongoDB -> SQL
async function migrateMongoToSQL() {
  const { sql } = await ensureConnections();

  console.log('🔄 Starting Migration: MongoDB (NoSQL) -> SQL (Neon/Postgres/SQLite)...');

  // Step A: Fetch all users from MongoDB
  const mongoUsers = await User.find();
  console.log(`📋 Found ${mongoUsers.length} users in MongoDB.`);

  const userMap = {}; // mongoUserId -> sqlUserId

  for (const mUser of mongoUsers) {
    const email = mUser.email.toLowerCase().trim();
    const rows = await sql.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);

    let sqlUserId;
    if (rows.length === 0) {
      sqlUserId = crypto.randomUUID().replace(/-/g, '').substring(0, 24);
      const now = mUser.createdAt ? new Date(mUser.createdAt).toISOString() : new Date().toISOString();

      await sql.query(
        'INSERT INTO users (id, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [sqlUserId, email, mUser.password, now, now]
      );
      console.log(`  ➕ Created SQL user: ${email}`);
    } else {
      sqlUserId = String(rows[0].id);
      // Update password hash if needed
      await sql.query('UPDATE users SET password = ? WHERE id = ?', [mUser.password, sqlUserId]);
      console.log(`  ✔️ Existing SQL user mapped: ${email}`);
    }

    userMap[String(mUser._id)] = sqlUserId;
  }

  // Step B: Fetch all todos from MongoDB
  const mongoTodos = await Todo.find();
  console.log(`📋 Found ${mongoTodos.length} todos in MongoDB.`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const mTodo of mongoTodos) {
    const targetUserId = mTodo.user ? userMap[String(mTodo.user)] : null;
    const completed = mTodo.completed ? 1 : 0;

    // Check if task exists in SQL
    let checkSql = 'SELECT id FROM todos WHERE text = ?';
    let checkParams = [mTodo.text];

    if (targetUserId) {
      checkSql += ' AND user_id = ?';
      checkParams.push(targetUserId);
    }
    checkSql += ' LIMIT 1';

    const existingRows = await sql.query(checkSql, checkParams);

    if (existingRows.length === 0) {
      const todoId = crypto.randomUUID().replace(/-/g, '').substring(0, 24);
      const createdAt = mTodo.createdAt ? new Date(mTodo.createdAt).toISOString() : new Date().toISOString();
      const updatedAt = mTodo.updatedAt ? new Date(mTodo.updatedAt).toISOString() : new Date().toISOString();

      await sql.query(
        'INSERT INTO todos (id, user_id, text, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [todoId, targetUserId, mTodo.text, completed, createdAt, updatedAt]
      );
      insertedCount++;
      console.log(`  ➕ Migrated Todo: "${mTodo.text}"`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n🎉 MongoDB -> SQL Migration Complete!`);
  console.log(`  Users Mapped: ${Object.keys(userMap).length}`);
  console.log(`  Todos Added: ${insertedCount} (Skipped Duplicates: ${skippedCount})\n`);

  return {
    status: 'Success',
    direction: 'MongoDB -> SQL',
    usersCount: Object.keys(userMap).length,
    todosInserted: insertedCount,
    todosSkipped: skippedCount
  };
}

// 3. Bi-directional Synchronization (Merges both databases seamlessly)
async function syncBoth() {
  console.log('\n========================================');
  console.log('🔄 Performing 2-Way Sync between SQL & NoSQL');
  console.log('========================================\n');

  const step1 = await migrateSQLToMongo();
  const step2 = await migrateMongoToSQL();

  return {
    status: 'Success',
    action: '2-Way Bidirectional Sync',
    step1_sql_to_mongo: step1,
    step2_mongo_to_sql: step2
  };
}

module.exports = {
  migrateSQLToMongo,
  migrateMongoToSQL,
  syncBoth
};
