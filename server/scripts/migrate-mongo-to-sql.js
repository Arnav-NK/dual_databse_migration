const { migrateMongoToSQL } = require('../services/migrationService');

(async () => {
  try {
    const result = await migrateMongoToSQL();
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
