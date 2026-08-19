const mongoose = require('mongoose');
const User = require('../models/User');

class MongoUserRepository {
  async findByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    return user;
  }

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const user = await User.findById(id).select('-password');
    return user ? user.toJSON() : null;
  }

  async createUser({ email, password }) {
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password
    });
    return {
      _id: String(user._id),
      email: user.email,
      createdAt: user.createdAt
    };
  }

  async comparePassword(enteredPassword, hashedPassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
}

module.exports = MongoUserRepository;
