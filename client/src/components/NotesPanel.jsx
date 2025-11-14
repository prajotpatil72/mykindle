import { useState, useEffect } from 'react';
import noteService from '../services/noteService';

const NotesPanel = ({ documentId, currentPage, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    color: '#fbbf24',
    pageNumber: currentPage,
  });
  const [editingNote, setEditingNote] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'current'

  useEffect(() => {
    fetchNotes();
  }, [documentId, filter, currentPage]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const pageNumber = filter === 'current' ? currentPage : null;
      const response = await noteService.getNotes(documentId, pageNumber);
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      await noteService.createNote({
        documentId,
        pageNumber: newNote.pageNumber,
        content: newNote.content,
        color: newNote.color,
      });
      setShowCreateModal(false);
      setNewNote({ content: '', color: '#fbbf24', pageNumber: currentPage });
      fetchNotes();
    } catch (error) {
      alert('Failed to create note');
    }
  };

  const handleUpdateNote = async (noteId, updates) => {
    try {
      await noteService.updateNote(noteId, updates);
      fetchNotes();
      setEditingNote(null);
    } catch (error) {
      alert('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await noteService.deleteNote(noteId);
      fetchNotes();
    } catch (error) {
      alert('Failed to delete note');
    }
  };

  const colors = [
    { value: '#fbbf24', label: 'Yellow' },
    { value: '#60a5fa', label: 'Blue' },
    { value: '#34d399', label: 'Green' },
    { value: '#f87171', label: 'Red' },
    { value: '#a78bfa', label: 'Purple' },
    { value: '#fb923c', label: 'Orange' },
  ];

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <h3>📝 Notes</h3>
        <button className="btn-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="notes-toolbar">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setNewNote({ content: '', color: '#fbbf24', pageNumber: currentPage });
            setShowCreateModal(true);
          }}
        >
          ➕ New Note
        </button>

        <div className="notes-filter">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'current' ? 'active' : ''}`}
            onClick={() => setFilter('current')}
          >
            Page {currentPage}
          </button>
        </div>
      </div>

      <div className="notes-list">
        {loading ? (
          <div className="notes-loading">
            <div className="spinner"></div>
            <p>Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="notes-empty">
            <p>No notes yet</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              Create your first note
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="note-item"
              style={{ borderLeftColor: note.color }}
            >
              {editingNote === note._id ? (
                <div className="note-edit">
                  <textarea
                    value={note.content}
                    onChange={(e) => {
                      const updated = notes.map((n) =>
                        n._id === note._id ? { ...n, content: e.target.value } : n
                      );
                      setNotes(updated);
                    }}
                    className="note-textarea"
                  />
                  <div className="note-edit-actions">
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={() => handleUpdateNote(note._id, { content: note.content })}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        setEditingNote(null);
                        fetchNotes();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-header">
                    <span className="note-page">Page {note.pageNumber}</span>
                    <div className="note-actions">
                      <button
                        className="btn-icon-sm"
                        onClick={() => setEditingNote(note._id)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={() => handleDeleteNote(note._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="note-content">{note.content}</p>
                  <span className="note-date">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Note</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Page Number</label>
                <input
                  type="number"
                  className="form-input"
                  value={newNote.pageNumber}
                  onChange={(e) =>
                    setNewNote({ ...newNote, pageNumber: parseInt(e.target.value) })
                  }
                  min={1}
                />
              </div>

              <div className="form-group">
                <label>Note Content</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note here..."
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      className={`color-option ${
                        newNote.color === color.value ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewNote({ ...newNote, color: color.value })}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateNote}
                disabled={!newNote.content.trim()}
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;