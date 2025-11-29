import { useState, useMemo } from 'react';
import { useAuth } from '../state/AuthContext';
import api from '../utils/api';

export default function ReportPreviewModal({ isOpen, onClose, previewData }) {
  const { token } = useAuth();
  if (!isOpen) return null;

  const previewSrc = useMemo(() => {
    const base = api.defaults.baseURL?.replace(/\/$/, '') || 'http://localhost:8000/api'
    const url = `${base}/reports/template-preview-standalone/?format=pdf`
    return token ? `${url}&token=${token}` : url
  }, [token])

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">📄 Report Template Preview</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info mb-2">
              <strong>PDF Preview:</strong> Rendered as a single-page A4 (inline).
            </div>
            <div style={{ height: '80vh', position: 'relative' }}>
              {loading && (
                <div className="d-flex align-items-center justify-content-center h-100 w-100" style={{ position: 'absolute', inset: 0 }}>
                  <div className="text-center">
                    <div className="spinner-border text-primary mb-2" role="status" />
                    <div className="small text-muted">Loading PDF…</div>
                  </div>
                </div>
              )}
              {!loadError && (
                <iframe
                  title="Report Template Preview"
                  src={previewSrc}
                  onLoad={() => setLoading(false)}
                  onError={() => { setLoading(false); setLoadError(true); }}
                  style={{ width: '100%', height: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              )}
              {loadError && (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center border rounded p-4 bg-light">
                  <div className="alert alert-danger w-100" role="alert">
                    Unable to embed the PDF (browser or server blocked iframe).
                  </div>
                  <a href={previewSrc} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary mb-2">
                    Open PDF in New Tab
                  </a>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setLoading(true); setLoadError(false); }}>
                    Retry Inline Preview
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <a href={previewSrc} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
              Open in New Tab
            </a>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}