import React from 'react';
import TodoItem from './TodoItem';
import { ClipboardList, CheckCircle2, ListFilter } from 'lucide-react';

export default function TodoList({
  todos,
  loading,
  currentFilter,
  onToggle,
  onUpdate,
  onDelete
}) {
  if (loading) {
    return (
      <div className="skeleton-list">
        <div className="skeleton-item" style={{ width: '85%' }} />
        <div className="skeleton-item" style={{ width: '70%' }} />
        <div className="skeleton-item" style={{ width: '92%' }} />
      </div>
    );
  }

  if (todos.length === 0) {
    let icon = <ClipboardList size={28} />;
    let title = 'No tasks yet';
    let subtitle = 'Add your first task above to get started.';

    if (currentFilter === 'active') {
      icon = <CheckCircle2 size={28} />;
      title = 'No active tasks';
      subtitle = 'You have completed all your pending tasks!';
    } else if (currentFilter === 'completed') {
      icon = <ListFilter size={28} />;
      title = 'No completed tasks';
      subtitle = 'Check off tasks once you complete them.';
    }

    return (
      <div className="empty-state">
        <div className="empty-icon">{icon}</div>
        <h3 className="empty-title">{title}</h3>
        <p className="empty-subtitle">{subtitle}</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo._id}
          todo={todo}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
