import { useState } from 'react';

const DocumentCard = ({ 
  document, 
  isSelected, 
  onSelect, 
  onDelete, 
  onOpen, 
  viewMode = 'grid' 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('documentId', document._id);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={`document-list-item ${isSelected ? 'selected' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="list-item-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(document._id);
            }}
          />
        </div>
        
        <div className="list-item-icon">📄</div>
        
        <div 
          className="list-item-name" 
          onClick={() => onOpen(document._id)}
          title={document.originalName}
        >
          {document.originalName}
        </div>
        
        <div className="list-item-size">{document.fileSize}</div>
        
        <div className="list-item-pages">{document.pageCount} pages</div>
        
        <div className="list-item-date">{formatDate(document.createdAt)}</div>
        
        <div className="list-item-tags">
          {document.tags && document.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-small">{tag}</span>
          ))}
        </div>
        
        <div className="list-item-actions">
          <button 
            className="btn-icon" 
            onClick={(e) => {
              e.stopPropagation();
              onOpen(document._id);
            }}
            title="Open"
          >
            👁️
          </button>
          <button 
            className="btn-icon btn-icon-danger" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document._id);
            }}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className={`document-card ${isSelected ? 'selected' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="document-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(document._id);
          }}
        />
      </div>

      <div 
        className="document-thumbnail"
        onClick={() => onOpen(document._id)}
      >
        {document.thumbnail ? (
          <img src={document.thumbnail} alt={document.originalName} />
        ) : (
          <div className="document-icon">📄</div>
        )}
      </div>

      <div className="document-info">
        <h3 
          className="document-title" 
          onClick={() => onOpen(document._id)}
          title={document.originalName}
        >
          {document.originalName}
        </h3>

        <div className="document-meta">
          <span>📄 {document.pageCount} pages</span>
          <span>💾 {document.fileSize}</span>
        </div>

        <div className="document-date">
          {formatDate(document.createdAt)}
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="document-tags">
            {document.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="tag">+{document.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="document-actions">
          <button 
            className="btn btn-sm btn-primary" 
            onClick={(e) => {
              e.stopPropagation();
              onOpen(document._id);
            }}
          >
            Open
          </button>
          <button 
            className="btn btn-sm btn-danger" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document._id);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;