import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import DocumentCard from '../components/DocumentCard';
import SearchBar from '../components/SearchBar';
import FilterControls from '../components/FilterControls';
import DeleteModal from '../components/DeleteModal';
import CollectionSidebar from '../components/CollectionSidebar';
import CollectionModal from '../components/CollectionModal';
import Breadcrumb from '../components/Breadcrumb';
import documentService from '../services/documentService';
import collectionService from '../services/collectionService';

const Library = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [documents, setDocuments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionTree, setCollectionTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    sort: '-createdAt',
    page: 1,
    limit: 20,
    collectionId: null,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const params = { ...filters };
      if (params.minSize) params.minSize = params.minSize * 1024 * 1024;
      if (params.maxSize) params.maxSize = params.maxSize * 1024 * 1024;
      
      const response = await documentService.getDocuments(params);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await documentService.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await collectionService.getCollections(true);
      setCollections(response.data.collections);
      setCollectionTree(response.data.tree);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  };

  const buildBreadcrumbPath = (collectionId) => {
    if (!collectionId) {
      setBreadcrumbPath([]);
      return;
    }

    const path = [];
    let current = collections.find((c) => c._id === collectionId);

    while (current) {
      path.unshift(current);
      current = collections.find((c) => c._id === current.parentId);
    }

    setBreadcrumbPath(path);
  };

  useEffect(() => {
    fetchCollections();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  useEffect(() => {
    buildBreadcrumbPath(activeCollection);
  }, [activeCollection, collections]);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchDocuments();
    fetchStats();
    fetchCollections();
  };

  const handleDeleteClick = (id = null) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteTarget) {
        await documentService.deleteDocument(deleteTarget);
      } else if (selectedDocs.length > 0) {
        await documentService.bulkDelete(selectedDocs);
        setSelectedDocs([]);
      }
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchDocuments();
      fetchStats();
      fetchCollections();
    } catch (error) {
      alert('Failed to delete document(s)');
    }
  };

  const handleSelectDoc = (id) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map((doc) => doc._id));
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleSortChange = (sort) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  // Navigate to PDF reader
  const handleOpenDocument = (id) => {
    navigate(`/reader/${id}`);
  };

  const handleSelectCollection = (collectionId) => {
    setActiveCollection(collectionId);
    setFilters((prev) => ({
      ...prev,
      collectionId: collectionId,
      page: 1,
    }));
  };

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setShowCollectionModal(true);
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    setShowCollectionModal(true);
  };

  const handleDeleteCollection = async (collection) => {
    if (!confirm(`Delete collection "${collection.name}"?`)) return;

    try {
      await collectionService.deleteCollection(collection._id, 'root');
      fetchCollections();
      if (activeCollection === collection._id) {
        setActiveCollection(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete collection');
    }
  };

  const handleCollectionSubmit = async (data) => {
    try {
      if (editingCollection) {
        await collectionService.updateCollection(editingCollection._id, data);
      } else {
        await collectionService.createCollection(data);
      }
      setShowCollectionModal(false);
      setEditingCollection(null);
      fetchCollections();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save collection');
    }
  };

  const handleDropDocument = async (documentId, collectionId) => {
    try {
      await documentService.updateDocument(documentId, { collectionId });
      fetchDocuments();
      fetchCollections();
    } catch (error) {
      alert('Failed to move document');
    }
  };

  const handleBreadcrumbNavigate = (collectionId) => {
    handleSelectCollection(collectionId);
  };

  return (
    <div className="library-container-with-sidebar">
      <CollectionSidebar
        collections={collectionTree}
        activeCollection={activeCollection}
        onSelectCollection={handleSelectCollection}
        onCreateCollection={handleCreateCollection}
        onEditCollection={handleEditCollection}
        onDeleteCollection={handleDeleteCollection}
        onDropDocument={handleDropDocument}
      />

      <div className="library-main">
        <header className="library-header">
          <h1>📚 PDF Library</h1>
          <div className="user-menu">
            <span>Welcome, {user?.name}</span>
            <Link to="/profile" className="btn btn-secondary">
              ⚙️ Settings
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              🚪 Logout
            </button>
          </div>
        </header>

        <div className="library-content">
          <Breadcrumb path={breadcrumbPath} onNavigate={handleBreadcrumbNavigate} />

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <h3>{stats.totalDocuments}</h3>
                <p>Documents</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💾</div>
                <h3>{stats.totalSize}</h3>
                <p>Total Size</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📖</div>
                <h3>{stats.totalPages}</h3>
                <p>Total Pages</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <h3>{stats.recentUploads}</h3>
                <p>Last 30 Days</p>
              </div>
            </div>
          )}

          <div className="library-toolbar">
            <div className="toolbar-left">
              <button
                className="btn btn-primary"
                onClick={() => setShowUpload(!showUpload)}
              >
                {showUpload ? '✕ Cancel' : '⬆️ Upload PDF'}
              </button>
              
              {selectedDocs.length > 0 && (
                <>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDeleteClick(null)}
                  >
                    🗑️ Delete ({selectedDocs.length})
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedDocs([])}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>

            <div className="toolbar-right">
              <div className="view-toggle">
                <button
                  className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  ▦
                </button>
                <button
                  className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          <div className="library-controls">
            <SearchBar onSearch={handleSearch} />
            <FilterControls
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              currentSort={filters.sort}
            />
          </div>

          {showUpload && (
            <div className="upload-section">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h2>No documents found</h2>
              <p>
                {filters.search
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first PDF to get started!'}
              </p>
              {!showUpload && (
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => setShowUpload(true)}
                >
                  ⬆️ Upload Your First PDF
                </button>
              )}
            </div>
          ) : (
            <>
              {documents.length > 0 && (
                <div className="select-all-bar">
                  <label>
                    <input
                      type="checkbox"
                      checked={
                        selectedDocs.length === documents.length &&
                        documents.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                    <span>
                      Select All ({selectedDocs.length}/{documents.length})
                    </span>
                  </label>
                </div>
              )}

              <div className={`documents-${viewMode}`}>
                {viewMode === 'list' && (
                  <div className="list-header">
                    <div className="list-header-checkbox"></div>
                    <div className="list-header-icon"></div>
                    <div className="list-header-name">Name</div>
                    <div className="list-header-size">Size</div>
                    <div className="list-header-pages">Pages</div>
                    <div className="list-header-date">Date</div>
                    <div className="list-header-tags">Tags</div>
                    <div className="list-header-actions">Actions</div>
                  </div>
                )}

                {documents.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    document={doc}
                    isSelected={selectedDocs.includes(doc._id)}
                    onSelect={handleSelectDoc}
                    onDelete={handleDeleteClick}
                    onOpen={handleOpenDocument}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <CollectionModal
        isOpen={showCollectionModal}
        onClose={() => {
          setShowCollectionModal(false);
          setEditingCollection(null);
        }}
        onSubmit={handleCollectionSubmit}
        collection={editingCollection}
        collections={collections}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        count={deleteTarget ? 1 : selectedDocs.length}
      />
    </div>
  );
};

export default Library;