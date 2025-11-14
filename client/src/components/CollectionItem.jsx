import { useState } from 'react';

const CollectionItem = ({
  collection,
  level = 0,
  isActive,
  isExpanded,
  onSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  onDropDocument,
  children,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const hasChildren = collection.children && collection.children.length > 0;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const docId = e.dataTransfer.getData('documentId');
    if (docId) {
      onDropDocument(docId, collection._id);
    }
  };

  return (
    <div className="collection-wrapper">
      <div
        className={`collection-item ${isActive ? 'active' : ''} ${
          dragOver ? 'drag-over' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(collection._id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren && (
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(collection._id);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        <span
          className="collection-icon"
          style={{ color: collection.color }}
        >
          {collection.icon}
        </span>

        <span className="collection-name">{collection.name}</span>

        {collection.documentCount !== undefined && (
          <span className="collection-count">{collection.documentCount}</span>
        )}

        <div className="collection-menu">
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            ⋮
          </button>

          {showMenu && (
            <div className="menu-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(collection);
                  setShowMenu(false);
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(collection);
                  setShowMenu(false);
                }}
                className="menu-danger"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default CollectionItem;