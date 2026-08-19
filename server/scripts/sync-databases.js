const { syncBoth } = require('../services/migrationService');

(async () => {
  try {
    const result = await syncBoth();
    console.log('✅ Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
})();
