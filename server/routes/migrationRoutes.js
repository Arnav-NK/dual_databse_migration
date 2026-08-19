const express = require('express');
const router = express.Router();
const {
  migrateSQLToMongo,
  migrateMongoToSQL,
  syncBoth
} = require('../services/migrationService');

// @route   POST /api/migrate/to-mongo
// @desc    Migrate all data from SQL (Neon/Postgres) -> MongoDB
router.post('/to-mongo', async (req, res) => {
  try {
    const result = await migrateSQLToMongo();
    res.json(result);
  } catch (error) {
    console.error('Migration SQL -> Mongo Error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  }
});

// @route   POST /api/migrate/to-sql
// @desc    Migrate all data from MongoDB -> SQL (Neon/Postgres)
router.post('/to-sql', async (req, res) => {
  try {
    const result = await migrateMongoToSQL();
    res.json(result);
  } catch (error) {
    console.error('Migration Mongo -> SQL Error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  }
});

// @route   POST /api/migrate/sync
// @desc    Two-way synchronization between both SQL and MongoDB
router.post('/sync', async (req, res) => {
  try {
    const result = await syncBoth();
    res.json(result);
  } catch (error) {
    console.error('Database Sync Error:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

module.exports = router;
