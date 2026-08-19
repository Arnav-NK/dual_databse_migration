const MongoUserRepository = require('./mongoUserRepository');
const SqlUserRepository = require('./sqlUserRepository');
const { isSQLMode } = require('./todoRepositoryFactory');

let activeUserRepository = null;

const getUserRepository = () => {
  if (!activeUserRepository) {
    if (isSQLMode()) {
      activeUserRepository = new SqlUserRepository();
    } else {
      activeUserRepository = new MongoUserRepository();
    }
  }
  return activeUserRepository;
};

const resetUserRepository = () => {
  activeUserRepository = null;
};

module.exports = {
  getUserRepository,
  resetUserRepository
};
