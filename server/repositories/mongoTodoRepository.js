const mongoose = require('mongoose');
const Todo = require('../models/Todo');

class MongoTodoRepository {
  async getAll({ status } = {}) {
    let filter = {};
    if (status === 'active') filter.completed = false;
    if (status === 'completed') filter.completed = true;

    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    return todos.map((t) => t.toJSON());
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const todo = await Todo.findById(id);
    return todo ? todo.toJSON() : null;
  }

  async create({ text }) {
    const todo = await Todo.create({ text });
    return todo.toJSON();
  }

  async update(id, { text, completed }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updateData = {};
    if (typeof text === 'string') updateData.text = text.trim();
    if (typeof completed === 'boolean') updateData.completed = completed;

    const updated = await Todo.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    return updated ? updated.toJSON() : null;
  }

  async toggle(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const todo = await Todo.findById(id);
    if (!todo) return null;

    todo.completed = !todo.completed;
    await todo.save();
    return todo.toJSON();
  }

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const deleted = await Todo.findByIdAndDelete(id);
    return deleted ? { id } : null;
  }

  async clearCompleted() {
    const result = await Todo.deleteMany({ completed: true });
    return { deletedCount: result.deletedCount };
  }

  async toggleAll(completed = true) {
    await Todo.updateMany({}, { completed });
    return this.getAll();
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
