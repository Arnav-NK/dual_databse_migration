import React, { useState } from 'react';
import { Plus, CheckCheck } from 'lucide-react';

export default function TodoInput({ onAddTodo, onToggleAll, allCompleted, hasTodos }) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTodo(trimmed);
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="todo-input-form" onSubmit={handleSubmit}>
      {hasTodos && (
        <button
          type="button"
          className={`input-toggle-all-btn ${allCompleted ? 'active' : ''}`}
          onClick={onToggleAll}
          title={allCompleted ? 'Mark all as active' : 'Mark all as completed'}
        >
          <CheckCheck size={20} />
        </button>
      )}

      <input
        type="text"
        className="todo-input-field"
        placeholder="What needs to be done today?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        autoFocus
      />

      <button
        type="submit"
        className="add-btn"
        disabled={!text.trim() || isSubmitting}
      >
        <Plus size={16} strokeWidth={2.5} />
        <span>Add</span>
      </button>
    </form>
  );
}
