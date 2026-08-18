const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api/todos`;
const HEALTH_URL = `${BASE_URL}/api/health`;

export const todoService = {
  // Fetch todos with optional status filter ('all', 'active', 'completed')
  async getTodos(status = 'all') {
    const url = status && status !== 'all' ? `${API_BASE}?status=${status}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch todos');
    }
    return res.json();
  },

  // Create a new todo
  async createTodo(text) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create todo');
    }
    return res.json();
  },

  // Toggle todo completion
  async toggleTodo(id) {
    const res = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle todo');
    }
    return res.json();
  },

  // Update todo text
  async updateTodo(id, updates) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update todo');
    }
    return res.json();
  },

  // Delete a single todo
  async deleteTodo(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete todo');
    }
    return res.json();
  },

  // Clear all completed todos
  async clearCompleted() {
    const res = await fetch(`${API_BASE}/completed/all`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to clear completed todos');
    }
    return res.json();
  },

  // Toggle all todos
  async toggleAll(completed) {
    const res = await fetch(`${API_BASE}/batch/toggle-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update todos');
    }
    return res.json();
  },

  // Check MongoDB & Server health
  async checkHealth() {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) {
      throw new Error('Server health check failed');
    }
    return res.json();
  }
};
