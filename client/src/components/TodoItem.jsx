import React, { useState, useRef, useEffect } from 'react';
import { Check, Edit2, Trash2, X } from 'lucide-react';

export default function TodoItem({ todo, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = editText.trim();
    if (!trimmed) {
      // If cleared, delete or revert
      setEditText(todo.text);
      setIsEditing(false);
      return;
    }

    if (trimmed !== todo.text) {
      await onUpdate(todo._id, { text: trimmed });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-item-left">
        {/* Checkbox */}
        <button
          type="button"
          className={`custom-checkbox ${todo.completed ? 'checked' : ''}`}
          onClick={() => onToggle(todo._id)}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {todo.completed && <Check size={14} strokeWidth={3} />}
        </button>

        {/* Text / Edit Mode */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="inline-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="todo-text"
            onDoubleClick={() => setIsEditing(true)}
            onClick={() => onToggle(todo._id)}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="todo-item-actions">
        {isEditing ? (
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              setEditText(todo.text);
              setIsEditing(false);
            }}
            title="Cancel edit"
          >
            <X size={15} />
          </button>
        ) : (
          <button
            type="button"
            className="action-btn"
            onClick={() => setIsEditing(true)}
            title="Edit task"
          >
            <Edit2 size={15} />
          </button>
        )}

        <button
          type="button"
          className="action-btn delete-btn"
          onClick={() => onDelete(todo._id)}
          title="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}
