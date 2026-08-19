const jwt = require('jsonwebtoken');
const { getUserRepository } = require('../repositories/userRepositoryFactory');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_dual_db_todo_2026';

const generateToken = (id) => {
  return jwt.sign({ id: String(id) }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const userRepository = getUserRepository();
      const user = await userRepository.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User account no longer exists' });
      }

      req.user = {
        _id: String(user._id || user.id),
        id: String(user._id || user.id),
        email: user.email
      };

      return next();
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

module.exports = {
  generateToken,
  protect
};
