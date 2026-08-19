const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // supports legacy/guest or authenticated
    },
    text: {
      type: String,
      required: [true, 'Please provide a task description'],
      trim: true,
      maxlength: [300, 'Task description cannot exceed 300 characters']
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Todo', todoSchema);
