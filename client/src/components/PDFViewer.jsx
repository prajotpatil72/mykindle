import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import textExtractionService from '../services/textExtractionService';
import NotesPanel from './NotesPanel';
import ChatPanel from './ChatPanel';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const PDFViewer = ({
  fileUrl,
  documentId,
  onProgressUpdate,
  initialPage = 1,
  initialZoom = 1.0,
  initialViewMode = 'continuous',
}) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(initialZoom);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Notes and Chat state
  const [showNotes, setShowNotes] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // OCR state
  const [ocrStatus, setOcrStatus] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  
  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  // Document load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  // Check OCR status on mount
  useEffect(() => {
    if (documentId) {
      checkOcrStatus();
    }
  }, [documentId]);

  const checkOcrStatus = async () => {
    try {
      const response = await textExtractionService.getStatus(documentId);
      setOcrStatus(response.data);
    } catch (error) {
      console.error('Failed to get OCR status:', error);
    }
  };

  const handleExtractText = async () => {
    try {
      setOcrLoading(true);
      await textExtractionService.extractText(documentId);
      await checkOcrStatus();
      alert('Text extracted successfully!');
    } catch (error) {
      console.error('Text extraction failed:', error);
      alert('Failed to extract text');
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePerformOCR = async () => {
    try {
      setOcrLoading(true);
      setShowOcrModal(false);
      await textExtractionService.performOCR(documentId);
      await checkOcrStatus();
      alert('OCR completed successfully!');
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to perform OCR: ' + (error.response?.data?.message || error.message));
    } finally {
      setOcrLoading(false);
    }
  };

  // Update progress
  const updateProgress = useCallback(() => {
    if (numPages && onProgressUpdate) {
      onProgressUpdate({
        currentPage,
        totalPages: numPages,
        zoom,
        viewMode,
      });
    }
  }, [currentPage, numPages, zoom, viewMode, onProgressUpdate]);

  // Auto-save progress (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateProgress();
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentPage, zoom, viewMode, updateProgress]);

  // Page navigation
  const goToPage = (page) => {
    const pageNum = Math.max(1, Math.min(page, numPages));
    setCurrentPage(pageNum);
    
    if (viewMode === 'continuous' && pageRefs.current[pageNum - 1]) {
      pageRefs.current[pageNum - 1].scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Zoom controls
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoom(1.0);
  const fitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40;
      setZoom(containerWidth / 595); // 595 is default PDF width
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(numPages);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          setShowThumbnails((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  // Track current page in continuous mode
  useEffect(() => {
    if (viewMode !== 'continuous') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.dataset.pageNumber);
            setCurrentPage(pageNum);
          }
        });
      },
      { threshold: 0.5 }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [viewMode, numPages]);

  return (
    <div className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      {/* Toolbar */}
      <div className="pdf-toolbar">
        <div className="toolbar-left">
          <button
            className="toolbar-btn"
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Toggle Thumbnails (T)"
          >
            🖼️
          </button>
          
          {/* OCR Button */}
          {ocrStatus && (
            <>
              {ocrStatus.ocrStatus === 'pending' && (
                <button
                  className="toolbar-btn toolbar-btn-warning"
                  onClick={() => setShowOcrModal(true)}
                  disabled={ocrLoading}
                  title="This document may need OCR"
                >
                  {ocrLoading ? '⏳' : '🔍'} {ocrLoading ? 'Processing...' : 'Perform OCR'}
                </button>
              )}
              
              {ocrStatus.ocrStatus === 'processing' && (
                <button className="toolbar-btn" disabled title="OCR in progress">
                  ⏳ OCR Processing...
                </button>
              )}
              
              {ocrStatus.ocrStatus === 'completed' && (
                <button className="toolbar-btn toolbar-btn-success" disabled title="OCR completed">
                  ✓ OCR Complete
                </button>
              )}
              
              {ocrStatus.ocrStatus === 'failed' && (
                <button
                  className="toolbar-btn toolbar-btn-danger"
                  onClick={() => setShowOcrModal(true)}
                  disabled={ocrLoading}
                  title="OCR failed. Click to retry"
                >
                  ⚠️ Retry OCR
                </button>
              )}
            </>
          )}
          
          <div className="page-controls">
            <button
              className="toolbar-btn"
              onClick={prevPage}
              disabled={currentPage <= 1}
              title="Previous Page (←)"
            >
              ◀
            </button>
            
            <span className="page-info">
              <input
                type="number"
                className="page-input"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                min={1}
                max={numPages}
              />
              <span> / {numPages || '?'}</span>
            </span>
            
            <button
              className="toolbar-btn"
              onClick={nextPage}
              disabled={currentPage >= numPages}
              title="Next Page (→)"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="toolbar-center">
          <button
            className="toolbar-btn"
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            title="Zoom Out (-)"
          >
            🔍-
          </button>
          
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          
          <button
            className="toolbar-btn"
            onClick={zoomIn}
            disabled={zoom >= 3.0}
            title="Zoom In (+)"
          >
            🔍+
          </button>
          
          <button
            className="toolbar-btn"
            onClick={resetZoom}
            title="Reset Zoom (0)"
          >
            ⟲
          </button>
          
          <button
            className="toolbar-btn"
            onClick={fitWidth}
            title="Fit Width"
          >
            ↔️
          </button>
        </div>

        <div className="toolbar-right">
          {/* Notes Button */}
          <button
            className={`toolbar-btn ${showNotes ? 'active' : ''}`}
            onClick={() => {
              setShowNotes(!showNotes);
              if (showChat) setShowChat(false);
            }}
            title="Notes"
          >
            📝
          </button>
          
          {/* Chat Button */}
          <button
            className={`toolbar-btn ${showChat ? 'active' : ''}`}
            onClick={() => {
              setShowChat(!showChat);
              if (showNotes) setShowNotes(false);
            }}
            title="AI Assistant"
          >
            💬
          </button>
          
          <button
            className={`toolbar-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
            title="Single Page"
          >
            📄
          </button>
          
          <button
            className={`toolbar-btn ${viewMode === 'continuous' ? 'active' : ''}`}
            onClick={() => setViewMode('continuous')}
            title="Continuous Scroll"
          >
            📜
          </button>
          
          <button
            className="toolbar-btn"
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pdf-content">
        {/* Thumbnail Sidebar */}
        {showThumbnails && numPages && (
          <div className="pdf-thumbnails">
            <h3>Pages</h3>
            <div className="thumbnail-list">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  className={`thumbnail-item ${pageNum === currentPage ? 'active' : ''}`}
                  onClick={() => goToPage(pageNum)}
                >
                  <Document file={fileUrl} loading="">
                    <Page
                      pageNumber={pageNum}
                      width={120}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <span className="thumbnail-label">Page {pageNum}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Pages */}
        <div className="pdf-pages">
          {loading && (
            <div className="pdf-loading">
              <div className="spinner"></div>
              <p>Loading PDF...</p>
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading=""
            error={
              <div className="pdf-error">
                <h3>Failed to load PDF</h3>
                <p>Please check the console for details</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            }
          >
            {viewMode === 'single' ? (
              // Single page mode
              <div className="pdf-page-single">
                <Page
                  pageNumber={currentPage}
                  scale={zoom}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </div>
            ) : (
              // Continuous scroll mode
              <div className="pdf-page-continuous">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div
                    key={pageNum}
                    ref={(el) => (pageRefs.current[pageNum - 1] = el)}
                    data-page-number={pageNum}
                    className="pdf-page-wrapper"
                  >
                    <Page
                      pageNumber={pageNum}
                      scale={zoom}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                    <div className="page-number-label">Page {pageNum}</div>
                  </div>
                ))}
              </div>
            )}
          </Document>
        </div>
      </div>

      {/* Notes & Chat Panels */}
      {showNotes && (
        <NotesPanel
          documentId={documentId}
          currentPage={currentPage}
          onClose={() => setShowNotes(false)}
        />
      )}
      {showChat && (
        <ChatPanel
          documentId={documentId}
          currentPage={currentPage}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* OCR Confirmation Modal */}
      {showOcrModal && (
        <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔍 Perform OCR</h2>
              <button className="modal-close" onClick={() => setShowOcrModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                This document appears to be scanned or image-based. Would you like to
                perform OCR (Optical Character Recognition) to extract text?
              </p>
              <div className="ocr-info">
                <p className="text-muted">
                  <strong>What is OCR?</strong><br />
                  OCR uses AI to recognize and extract text from images and scanned documents,
                  making them searchable and copyable.
                </p>
                <p className="text-muted">
                  ⏱️ This may take a few moments depending on the document size.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOcrModal(false)}
                disabled={ocrLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePerformOCR}
                disabled={ocrLoading}
              >
                {ocrLoading ? '⏳ Processing...' : '🔍 Perform OCR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts-hint">
        Press <kbd>?</kbd> for keyboard shortcuts
      </div>
    </div>
  );
};

export default PDFViewer;