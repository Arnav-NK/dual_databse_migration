const express = require('express');
const router = express.Router();
const {
  migrateSQLToMongo,
  migrateMongoToSQL,
  syncBoth
} = require('../services/migrationService');

// Developer-Only Authorization Middleware
const adminOnly = (req, res, next) => {
  const secret = process.env.MIGRATION_SECRET || 'dev_secret_migration_key_2026';
  const providedKey =
    req.headers['x-admin-key'] ||
    req.query.key ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!providedKey || providedKey !== secret) {
    return res.status(403).json({
      error: 'Forbidden: Developer authorization required',
      message: 'Only developers can perform migrations. Please provide a valid x-admin-key header or ?key= query parameter.'
    });
  }

  next();
};

// Protect all migration routes with Developer Admin authentication
router.use(adminOnly);

// @route   POST /api/migrate/to-mongo
// @desc    Migrate all data from SQL (Neon/Postgres) -> MongoDB (Developer Only)
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
// @desc    Migrate all data from MongoDB -> SQL (Neon/Postgres) (Developer Only)
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
// @desc    Two-way synchronization between both SQL and MongoDB (Developer Only)
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
