const MongoTodoRepository = require('./mongoTodoRepository');
const SqlTodoRepository = require('./sqlTodoRepository');

let activeRepository = null;

const isSQLMode = () => {
  const flag = String(process.env.USE_SQL || '').trim().toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'yes';
};

const getTodoRepository = () => {
  if (!activeRepository) {
    if (isSQLMode()) {
      console.log(' Using SQL Todo Repository');
      activeRepository = new SqlTodoRepository();
    } else {
      console.log('🍃 Using NoSQL (MongoDB) Todo Repository');
      activeRepository = new MongoTodoRepository();
    }
  }
  return activeRepository;
};

// Force reset repository instance (useful for testing or hot switching)
const resetTodoRepository = () => {
  activeRepository = null;
};

module.exports = {
  getTodoRepository,
  isSQLMode,
  resetTodoRepository
};
