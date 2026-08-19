const mongoose = require('mongoose');
const Todo = require('../models/Todo');

class MongoTodoRepository {
  async getAll({ status, userId } = {}) {
    let filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }
    if (status === 'active') filter.completed = false;
    if (status === 'completed') filter.completed = true;

    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    return todos.map((t) => t.toJSON());
  }

  async getById(id, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    let filter = { _id: id };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }
    const todo = await Todo.findOne(filter);
    return todo ? todo.toJSON() : null;
  }

  async create({ text, userId = null }) {
    const todoData = { text };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      todoData.user = userId;
    }
    const todo = await Todo.create(todoData);
    return todo.toJSON();
  }

  async update(id, { text, completed }, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    let filter = { _id: id };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }

    const updateData = {};
    if (typeof text === 'string') updateData.text = text.trim();
    if (typeof completed === 'boolean') updateData.completed = completed;

    const updated = await Todo.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true
    });
    return updated ? updated.toJSON() : null;
  }

  async toggle(id, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    let filter = { _id: id };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }

    const todo = await Todo.findOne(filter);
    if (!todo) return null;

    todo.completed = !todo.completed;
    await todo.save();
    return todo.toJSON();
  }

  async delete(id, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    let filter = { _id: id };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }

    const deleted = await Todo.findOneAndDelete(filter);
    return deleted ? { id } : null;
  }

  async clearCompleted(userId = null) {
    let filter = { completed: true };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }
    const result = await Todo.deleteMany(filter);
    return { deletedCount: result.deletedCount };
  }

  async toggleAll(completed = true, userId = null) {
    let filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }
    await Todo.updateMany(filter, { completed });
    return this.getAll({ userId });
  }

  getHealth() {
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };
    const dbState = mongoose.connection.readyState;
    return {
      dbType: 'NoSQL (MongoDB)',
      driver: 'Mongoose ODM',
      status: states[dbState] || 'Unknown',
      dbHost: mongoose.connection.host || 'N/A',
      dbName: mongoose.connection.name || 'N/A'
    };
  }
}

module.exports = MongoTodoRepository;
