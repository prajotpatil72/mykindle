import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PDFViewer from '../components/PDFViewer';
import documentService from '../services/documentService';
import readingProgressService from '../services/readingProgressService';

const PDFReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchDocument();
    fetchProgress();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocument(id);
      setDocument(response.data.document);
    } catch (err) {
      setError('Failed to load document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await readingProgressService.getProgress(id);
      setProgress(response.data.progress);
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const handleProgressUpdate = async (progressData) => {
    try {
      await readingProgressService.updateProgress(id, progressData);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleClose = () => {
    navigate('/library');
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="spinner"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="reader-error">
        <h2>Error</h2>
        <p>{error || 'Document not found'}</p>
        <button className="btn btn-primary" onClick={handleClose}>
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="pdf-reader-page">
      <div className="reader-header">
        <button className="btn-close" onClick={handleClose} title="Close (Esc)">
          ✕
        </button>
        <h1 className="reader-title">{document.filename}</h1>
        <div className="reader-info">
          <span>{document.pageCount} pages</span>
          <span>•</span>
          <span>{document.fileSize}</span>
        </div>
      </div>

      <PDFViewer
        fileUrl={document.signedUrl}
        documentId={id}
        onProgressUpdate={handleProgressUpdate}
        initialPage={progress?.currentPage || 1}
        initialZoom={progress?.zoom || 1.0}
        initialViewMode={progress?.viewMode || 'continuous'}
      />
    </div>
  );
};

export default PDFReader;