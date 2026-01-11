/**
 * ClassDetailsModal Component
 * 
 * Displays detailed information about a selected class including:
 * - Description and typical usage
 * - Common memory issues
 * - Resolution strategies
 * - Links to documentation and resources
 */

import { useEffect } from 'react';
import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import { getClassInfo } from '../services/classKnowledgeBase.js';
import './ClassDetailsModal.css';

function ClassDetailsModal({ classData, onClose }) {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close modal on background click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const classInfo = getClassInfo(classData.className);
  const isWellKnown = classInfo.matchType !== 'generic';

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Class Details</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Class Name Section */}
          <div className="detail-section">
            <div className="class-name-display">
              <span className="class-icon">📦</span>
              <code className="class-name">{classData.className}</code>
            </div>
            {isWellKnown && (
              <div className="well-known-badge">
                ✓ Recognized Java Class
              </div>
            )}
          </div>

          {/* Memory Statistics */}
          <div className="detail-section">
            <h3>Memory Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Instances</span>
                <span className="stat-value">{formatNumber(classData.instanceCount)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Size</span>
                <span className="stat-value">{formatSize(classData.totalSize)}</span>
              </div>
              {classData.retainedSize !== undefined && (
                <div className="stat-item">
                  <span className="stat-label">Retained Size</span>
                  <span className="stat-value">{formatSize(classData.retainedSize)}</span>
                </div>
              )}
              {classData.averageSize !== undefined && (
                <div className="stat-item">
                  <span className="stat-label">Average Size</span>
                  <span className="stat-value">{formatSize(classData.averageSize)}</span>
                </div>
              )}
              {classData.retentionPercentage !== undefined && (
                <div className="stat-item">
                  <span className="stat-label">Heap Percentage</span>
                  <span className="stat-value">{classData.retentionPercentage.toFixed(2)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="detail-section">
            <h3>Description</h3>
            <p className="description-text">{classInfo.description}</p>
          </div>

          {/* Common Issues */}
          {classInfo.commonIssues && classInfo.commonIssues.length > 0 && (
            <div className="detail-section">
              <h3>⚠️ Common Memory Issues</h3>
              <ul className="issue-list">
                {classInfo.commonIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resolutions */}
          {classInfo.resolutions && classInfo.resolutions.length > 0 && (
            <div className="detail-section">
              <h3>✅ Recommended Actions</h3>
              <ul className="resolution-list">
                {classInfo.resolutions.map((resolution, index) => (
                  <li key={index}>{resolution}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Documentation Links */}
          {classInfo.links && classInfo.links.length > 0 && (
            <div className="detail-section">
              <h3>📚 Documentation & Resources</h3>
              <div className="links-container">
                {classInfo.links.map((link, index) => (
                  <a 
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-link"
                  >
                    <span className="link-icon">🔗</span>
                    <span className="link-title">{link.title}</span>
                    <span className="external-icon">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Additional Resources for all classes */}
          <div className="detail-section">
            <h3>🔍 General Resources</h3>
            <div className="links-container">
              <a 
                href="https://www.eclipse.org/mat/"
                target="_blank"
                rel="noopener noreferrer"
                className="doc-link"
              >
                <span className="link-icon">🔗</span>
                <span className="link-title">Eclipse Memory Analyzer (MAT)</span>
                <span className="external-icon">↗</span>
              </a>
              <a 
                href="https://visualvm.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="doc-link"
              >
                <span className="link-icon">🔗</span>
                <span className="link-title">VisualVM</span>
                <span className="external-icon">↗</span>
              </a>
              <a 
                href="https://www.baeldung.com/java-memory-leaks"
                target="_blank"
                rel="noopener noreferrer"
                className="doc-link"
              >
                <span className="link-icon">🔗</span>
                <span className="link-title">Java Memory Leaks Guide</span>
                <span className="external-icon">↗</span>
              </a>
            </div>
          </div>

          {/* Analysis Tips */}
          <div className="detail-section tips-section">
            <h3>💡 Analysis Tips</h3>
            <div className="tips-content">
              <p><strong>High instance count:</strong> May indicate object pooling, caching, or accumulation without cleanup.</p>
              <p><strong>High retained size:</strong> This class or its references are holding onto significant memory.</p>
              <p><strong>Next steps:</strong> Use Eclipse MAT or VisualVM for detailed reference chains and dominator analysis.</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClassDetailsModal;
