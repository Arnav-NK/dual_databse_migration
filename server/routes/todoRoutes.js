const express = require('express');
const router = express.Router();
const { getTodoRepository } = require('../repositories/todoRepositoryFactory');
const { protect } = require('../middleware/authMiddleware');

// Protect all todo routes with JWT Authentication
router.use(protect);

// @route   GET /api/todos
// @desc    Get all todos for the logged-in user (with optional status filter)
router.get('/', async (req, res) => {
  try {
    const repository = getTodoRepository();
    const { status } = req.query;
    const todos = await repository.getAll({ status, userId: req.user.id });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
  }
});

// @route   POST /api/todos
// @desc    Create a new todo for the logged-in user
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const repository = getTodoRepository();
    const todo = await repository.create({
      text: text.trim(),
      userId: req.user.id
    });
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(400).json({ error: 'Failed to create todo', details: error.message });
  }
});

// @route   GET /api/todos/:id
// @desc    Get single todo by ID (user-scoped)
router.get('/:id', async (req, res) => {
  try {
    const repository = getTodoRepository();
    const todo = await repository.getById(req.params.id, req.user.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error getting todo:', error);
    res.status(500).json({ error: 'Failed to retrieve todo', details: error.message });
  }
});

// @route   PUT /api/todos/:id
// @desc    Update a todo (text and/or completed, user-scoped)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const repository = getTodoRepository();
    const updatedTodo = await repository.update(id, { text, completed }, req.user.id);

    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found or unauthorized' });
    }

    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(400).json({ error: 'Failed to update todo', details: error.message });
  }
});

// @route   PATCH /api/todos/:id/toggle
// @desc    Toggle todo completion status (user-scoped)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const repository = getTodoRepository();
    const toggled = await repository.toggle(id, req.user.id);

    if (!toggled) {
      return res.status(404).json({ error: 'Todo not found or unauthorized' });
    }

    res.json(toggled);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(400).json({ error: 'Failed to toggle todo', details: error.message });
  }
});

// @route   DELETE /api/todos/completed/all
// @desc    Delete all completed todos for the logged-in user
router.delete('/completed/all', async (req, res) => {
  try {
    const repository = getTodoRepository();
    const result = await repository.clearCompleted(req.user.id);
    res.json({ message: 'Completed todos cleared', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    res.status(500).json({ error: 'Failed to clear completed todos', details: error.message });
  }
});

// @route   PATCH /api/todos/batch/toggle-all
// @desc    Mark all todos as complete or active for the logged-in user
router.patch('/batch/toggle-all', async (req, res) => {
  try {
    const { completed } = req.body;
    const targetStatus = typeof completed === 'boolean' ? completed : true;

    const repository = getTodoRepository();
    const todos = await repository.toggleAll(targetStatus, req.user.id);
    res.json(todos);
  } catch (error) {
    console.error('Error batch updating todos:', error);
    res.status(500).json({ error: 'Failed to batch update todos', details: error.message });
  }
});

// @route   DELETE /api/todos/:id
// @desc    Delete a todo by id (user-scoped)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repository = getTodoRepository();
    const result = await repository.delete(id, req.user.id);

    if (!result) {
      return res.status(404).json({ error: 'Todo not found or unauthorized' });
    }

    res.json({ message: 'Todo deleted successfully', id });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo', details: error.message });
  }
});

module.exports = router;
