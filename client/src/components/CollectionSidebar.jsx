import { useState } from 'react';
import CollectionItem from './CollectionItem';

const CollectionSidebar = ({
  collections = [],
  activeCollection,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  onDropDocument,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState([]);

  const toggleExpand = (id) => {
    setExpandedCollections((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const renderTree = (items, level = 0) => {
    return items.map((item) => (
      <CollectionItem
        key={item._id}
        collection={item}
        level={level}
        isActive={activeCollection === item._id}
        isExpanded={expandedCollections.includes(item._id)}
        onSelect={onSelectCollection}
        onToggleExpand={toggleExpand}
        onEdit={onEditCollection}
        onDelete={onDeleteCollection}
        onDropDocument={onDropDocument}
      >
        {item.children &&
          item.children.length > 0 &&
          expandedCollections.includes(item._id) &&
          renderTree(item.children, level + 1)}
      </CollectionItem>
    ));
  };

  return (
    <>
      <div className={`collection-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {!collapsed ? (
          <>
            <div className="sidebar-header">
              <h3>Collections</h3>
              <div className="sidebar-actions">
                <button
                  className="btn-icon"
                  onClick={onCreateCollection}
                  title="New Collection"
                >
                  ➕
                </button>
                <button
                  className="btn-icon"
                  onClick={toggleSidebar}
                  title="Collapse Sidebar"
                >
                  ◀
                </button>
              </div>
            </div>

            <div className="sidebar-content">
              <div
                className={`collection-item ${activeCollection === null ? 'active' : ''}`}
                onClick={() => onSelectCollection(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const docId = e.dataTransfer.getData('documentId');
                  if (docId) {
                    onDropDocument(docId, null);
                  }
                }}
              >
                <span className="collection-icon">📚</span>
                <span className="collection-name">All Documents</span>
              </div>

              {collections.length > 0 ? (
                <div className="collection-tree">{renderTree(collections)}</div>
              ) : (
                <div className="sidebar-empty">
                  <p>No collections yet</p>
                  <button className="btn btn-sm btn-primary" onClick={onCreateCollection}>
                    Create First Collection
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="sidebar-collapsed-content">
            <button
              className="btn-icon sidebar-expand-btn"
              onClick={toggleSidebar}
              title="Expand Sidebar"
            >
              ▶
            </button>
            <div className="sidebar-collapsed-icons">
              <button
                className="sidebar-icon-btn"
                onClick={() => {
                  setCollapsed(false);
                  onSelectCollection(null);
                }}
                title="All Documents"
              >
                📚
              </button>
              {collections.slice(0, 5).map((collection) => (
                <button
                  key={collection._id}
                  className="sidebar-icon-btn"
                  onClick={() => {
                    setCollapsed(false);
                    onSelectCollection(collection._id);
                  }}
                  title={collection.name}
                >
                  {collection.icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CollectionSidebar;