import React from 'react';

export default function TodoFooter({
  activeCount,
  completedCount,
  currentFilter,
  onFilterChange,
  onClearCompleted
}) {
  return (
    <footer className="todo-footer">
      {/* Items left counter */}
      <span className="items-counter">
        <strong>{activeCount}</strong> {activeCount === 1 ? 'item' : 'items'} left
      </span>

      {/* Filter Tabs */}
      <div className="filter-buttons">
        <button
          type="button"
          className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          type="button"
          className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          Completed
        </button>
      </div>

      {/* Clear Completed Action */}
      <button
        type="button"
        className="clear-completed-btn"
        onClick={onClearCompleted}
        disabled={completedCount === 0}
      >
        Clear completed {completedCount > 0 ? `(${completedCount})` : ''}
      </button>
    </footer>
  );
}
