const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api/todos`;
const AUTH_BASE = `${BASE_URL}/api/auth`;
const HEALTH_URL = `${BASE_URL}/api/health`;

// Token storage helpers
export const getStoredToken = () => localStorage.getItem('mern_todo_token');
export const setStoredToken = (token) => {
  if (token) localStorage.setItem('mern_todo_token', token);
  else localStorage.removeItem('mern_todo_token');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('mern_todo_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => {
  if (user) localStorage.setItem('mern_todo_user', JSON.stringify(user));
  else localStorage.removeItem('mern_todo_user');
};

// Helper for authenticated requests
const authHeaders = (headers = {}) => {
  const token = getStoredToken();
  const base = { 'Content-Type': 'application/json', ...headers };
  if (token) {
    base['Authorization'] = `Bearer ${token}`;
  }
  return base;
};

// Authentication Services
export const authService = {
  async register(email, password) {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async getMe() {
    const token = getStoredToken();
    if (!token) return null;

    const res = await fetch(`${AUTH_BASE}/me`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      setStoredToken(null);
      setStoredUser(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
  }
};

// Todo Services (Protected)
export const todoService = {
  // Fetch todos with optional status filter ('all', 'active', 'completed')
  async getTodos(status = 'all') {
    const url = status && status !== 'all' ? `${API_BASE}?status=${status}` : API_BASE;
    const res = await fetch(url, {
      headers: authHeaders()
    });
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
      headers: authHeaders(),
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
      method: 'PATCH',
      headers: authHeaders()
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
      headers: authHeaders(),
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
      method: 'DELETE',
      headers: authHeaders()
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
      method: 'DELETE',
      headers: authHeaders()
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
      headers: authHeaders(),
      body: JSON.stringify({ completed })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update todos');
    }
    return res.json();
  },

  // Check Database & Server health
  async checkHealth() {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) {
      throw new Error('Server health check failed');
    }
    return res.json();
  }
};
