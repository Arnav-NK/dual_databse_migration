import React, { useState, useEffect, useMemo } from 'react';
import { todoService, authService, getStoredUser, getStoredToken } from './services/api';
import Header from './components/Header';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import TodoFooter from './components/TodoFooter';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState(!getStoredToken());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [dbStatus, setDbStatus] = useState({ status: 'Connecting', dbHost: '', dbName: '' });

  // Dark Theme Only
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // Fetch Database health
  const checkDbHealth = async () => {
    try {
      const health = await todoService.checkHealth();
      setDbStatus(health);
    } catch {
      setDbStatus({ status: 'Disconnected', dbHost: '', dbName: '' });
    }
  };

  // Fetch user's todos
  const loadUserTodos = async () => {
    if (!getStoredToken()) {
      setTodos([]);
      return;
    }
    setLoading(true);
    try {
      const data = await todoService.getTodos('all');
      setTodos(data);
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('authorized')) {
        authService.logout();
        setUser(null);
        setShowAuthModal(true);
        showToast('Session expired. Please log in again.', 'error');
      } else {
        showToast('Could not load tasks from database', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial Load: check user session & db health
  useEffect(() => {
    checkDbHealth();

    const verifySession = async () => {
      if (getStoredToken()) {
        try {
          const verifiedUser = await authService.getMe();
          if (verifiedUser) {
            setUser(verifiedUser);
            setShowAuthModal(false);
            loadUserTodos();
          } else {
            setUser(null);
            setShowAuthModal(true);
          }
        } catch {
          setUser(null);
          setShowAuthModal(true);
        }
      } else {
        setShowAuthModal(true);
      }
    };

    verifySession();

    // Poll health check every 20s
    const interval = setInterval(checkDbHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Handle successful login or registration
  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    setShowAuthModal(false);
    showToast(`Welcome, ${authUser.email.split('@')[0]}!`, 'success');
    loadUserTodos();
  };

  // Handle user logout
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setTodos([]);
    setShowAuthModal(true);
    showToast('Logged out successfully', 'info');
  };

  // Add Todo
  const handleAddTodo = async (text) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const newTodo = await todoService.createTodo(text);
      setTodos((prev) => [newTodo, ...prev]);
      showToast('Task added', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to add task', 'error');
    }
  };

  // Toggle Todo completion
  const handleToggle = async (id) => {
    const target = todos.find((t) => t._id === id);
    if (!target) return;

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const updated = await todoService.toggleTodo(id);
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? updated : t))
      );
    } catch (err) {
      // Revert on error
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? target : t))
      );
      showToast('Failed to update task status', 'error');
    }
  };

  // Update Todo text
  const handleUpdate = async (id, updates) => {
    const target = todos.find((t) => t._id === id);
    if (!target) return;

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, ...updates } : t))
    );

    try {
      const updated = await todoService.updateTodo(id, updates);
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? updated : t))
      );
      showToast('Task updated', 'success');
    } catch (err) {
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? target : t))
      );
      showToast('Failed to update task', 'error');
    }
  };

  // Delete Todo
  const handleDelete = async (id) => {
    const prevList = [...todos];
    // Optimistic delete
    setTodos((prev) => prev.filter((t) => t._id !== id));

    try {
      await todoService.deleteTodo(id);
      showToast('Task deleted', 'info');
    } catch (err) {
      setTodos(prevList);
      showToast('Failed to delete task', 'error');
    }
  };

  // Toggle all todos
  const handleToggleAll = async () => {
    const allCompleted = todos.every((t) => t.completed);
    const targetStatus = !allCompleted;

    const prevList = [...todos];
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => ({ ...t, completed: targetStatus }))
    );

    try {
      const updatedList = await todoService.toggleAll(targetStatus);
      setTodos(updatedList);
      showToast(
        targetStatus ? 'All tasks marked as completed' : 'All tasks marked as active',
        'info'
      );
    } catch (err) {
      setTodos(prevList);
      showToast('Failed to batch update tasks', 'error');
    }
  };

  // Clear all completed todos
  const handleClearCompleted = async () => {
    const prevList = [...todos];
    // Optimistic clear
    setTodos((prev) => prev.filter((t) => !t.completed));

    try {
      const result = await todoService.clearCompleted();
      showToast(`Cleared ${result.deletedCount || 'completed'} tasks`, 'info');
    } catch (err) {
      setTodos(prevList);
      showToast('Failed to clear completed tasks', 'error');
    }
  };

  // Derived metrics and filtered todos
  const activeCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);
  const allCompleted = todos.length > 0 && activeCount === 0;

  const filteredTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  return (
    <div className="app-wrapper">
      <Header
        dbStatus={dbStatus}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <main className="main-card">
        <TodoInput
          onAddTodo={handleAddTodo}
          onToggleAll={handleToggleAll}
          allCompleted={allCompleted}
          hasTodos={todos.length > 0}
        />

        <TodoList
          todos={filteredTodos}
          loading={loading}
          currentFilter={filter}
          onToggle={handleToggle}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        {todos.length > 0 && (
          <TodoFooter
            activeCount={activeCount}
            completedCount={completedCount}
            currentFilter={filter}
            onFilterChange={setFilter}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </main>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
