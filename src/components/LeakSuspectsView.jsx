/**
 * LeakSuspectsView Component
 * 
 * Displays detected memory leak suspects with severity levels and patterns.
 */

import { useState } from 'react';
import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import ClassDetailsModal from './ClassDetailsModal.jsx';
import './LeakSuspectsView.css';

function LeakSuspectsView({ suspects, insights, allFiles = [] }) {
  const [selectedClass, setSelectedClass] = useState(null);

  // Calculate comparison data
  const hasMultipleFiles = allFiles.length > 1;
  const crossFileLeaks = hasMultipleFiles ? getCrossFileLeaks(allFiles) : null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#ffa726';
      case 'low': return '#fdd835';
      default: return '#999';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const handleClassClick = (suspect) => {
    setSelectedClass(suspect);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
  };

  return (
    <div className="leak-suspects-view">
      {selectedClass && (
        <ClassDetailsModal 
          classData={selectedClass}
          onClose={handleCloseModal}
        />
      )}
      <div className="leak-suspects-header">
        <h2>Memory Leak Suspects</h2>
        {hasMultipleFiles && crossFileLeaks && (
          <div className="comparison-notice">
            📊 Comparing with {allFiles.length} files - persistent leaks highlighted
          </div>
        )}
        <p className="description">
          Automatically detected classes that may be causing memory leaks.
        </p>
      </div>

      {insights && (
        <div className="insights-summary">
          <div className="summary-stats">
            <div className="stat-box critical">
              <div className="stat-value">{insights.critical}</div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="stat-box high">
              <div className="stat-value">{insights.high}</div>
              <div className="stat-label">High</div>
            </div>
            <div className="stat-box medium">
              <div className="stat-value">{insights.medium}</div>
              <div className="stat-label">Medium</div>
            </div>
            <div className="stat-box low">
              <div className="stat-value">{insights.low}</div>
              <div className="stat-label">Low</div>
            </div>
          </div>

          {insights.recommendations.length > 0 && (
            <div className="recommendations">
              <h3>💡 Recommendations</h3>
              <ul>
                {insights.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(insights.topPatterns).length > 0 && (
            <div className="pattern-summary">
              <h3>🔍 Detected Patterns</h3>
              <div className="patterns-grid">
                {Object.entries(insights.topPatterns).map(([name, data]) => (
                  <div key={name} className="pattern-card">
                    <div className="pattern-name">{name}</div>
                    <div className="pattern-count">{data.count} occurrences</div>
                    <div className="pattern-description">{data.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="general-resources">
        <h3>📖 Memory Leak Resources</h3>
        <p>For more in-depth analysis and troubleshooting, refer to these resources:</p>
        <div className="resource-links">
          <a href="https://www.eclipse.org/mat/" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-title">Eclipse Memory Analyzer (MAT)</div>
            <div className="resource-description">Industry-standard heap dump analyzer with advanced features</div>
          </a>
          <a href="https://visualvm.github.io/" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-title">VisualVM</div>
            <div className="resource-description">Visual tool for monitoring and troubleshooting Java applications</div>
          </a>
          <a href="https://www.baeldung.com/java-memory-leaks" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-title">Java Memory Leaks Guide (Baeldung)</div>
            <div className="resource-description">Comprehensive guide to understanding and fixing memory leaks</div>
          </a>
          <a href="https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/memleaks.html" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-title">Oracle Memory Leak Troubleshooting</div>
            <div className="resource-description">Official Oracle documentation on memory leak diagnosis</div>
          </a>
          <a href="https://dzone.com/articles/how-to-find-and-fix-memory-leaks-in-your-java-app" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-title">DZone Memory Leak Tutorial</div>
            <div className="resource-description">Practical guide to finding and fixing memory leaks</div>
          </a>
        </div>
      </div>

      <div className="suspects-list">
        {suspects.length === 0 ? (
          <div className="no-suspects">
            <div className="no-suspects-icon">✅</div>
            <h3>No Obvious Leak Suspects Found</h3>
            <p>
              The analyzer did not detect any obvious memory leak patterns.
              This doesn't guarantee there are no leaks, but the heap looks relatively healthy.
            </p>
          </div>
        ) : (
          suspects.map((suspect, index) => {
            const crossFileInfo = crossFileLeaks ? crossFileLeaks.get(suspect.className) : null;
            
            return (
              <div key={index} className={`suspect-card ${crossFileInfo?.isPersistent ? 'persistent-leak' : ''}`}>
                <div className="suspect-header">
                  <div className="suspect-severity" style={{ color: getSeverityColor(suspect.severity) }}>
                    <span className="severity-icon">{getSeverityIcon(suspect.severity)}</span>
                    <span className="severity-text">{suspect.severity.toUpperCase()}</span>
                  </div>
                  <div 
                    className="suspect-class clickable-suspect-class"
                    onClick={() => handleClassClick(suspect)}
                    title="Click for detailed insights"
                  >
                    {suspect.className}
                  </div>
                  {crossFileInfo && (
                    <div className="cross-file-badge">
                      {crossFileInfo.isPersistent && <span className="persistent-badge">⚠️ Persistent</span>}
                      <span className="occurrence-badge">
                        {crossFileInfo.occurrences}/{crossFileInfo.totalFiles} files
                      </span>
                    </div>
                  )}
                </div>

                <div className="suspect-stats">
                  <div className="stat">
                    <span className="stat-label">Instances:</span>
                    <span className="stat-value">{formatNumber(suspect.instanceCount)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Size:</span>
                    <span className="stat-value">{formatSize(suspect.totalSize)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Heap %:</span>
                    <span className="stat-value">{suspect.retentionPercentage.toFixed(2)}%</span>
                  </div>
                </div>

              {suspect.reasons.length > 0 && (
                <div className="suspect-reasons">
                  <strong>Why this is suspicious:</strong>
                  <ul>
                    {suspect.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {suspect.patterns.length > 0 && (
                <div className="suspect-patterns">
                  <strong>Detected patterns:</strong>
                  <div className="pattern-tags">
                    {suspect.patterns.map((pattern, i) => (
                      <div key={i} className="pattern-tag" title={pattern.description}>
                        {pattern.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper function to analyze leaks across files
function getCrossFileLeaks(allFiles) {
  const validFiles = allFiles.filter(f => !f.error && f.leakSuspects);
  if (validFiles.length < 2) return null;
  
  const leakOccurrences = new Map();
  
  validFiles.forEach((file) => {
    file.leakSuspects.forEach(suspect => {
      if (!leakOccurrences.has(suspect.className)) {
        leakOccurrences.set(suspect.className, {
          count: 0,
          severities: []
        });
      }
      const data = leakOccurrences.get(suspect.className);
      data.count++;
      data.severities.push(suspect.severity);
    });
  });
  
  // Create a map for quick lookup
  const result = new Map();
  leakOccurrences.forEach((data, className) => {
    result.set(className, {
      occurrences: data.count,
      totalFiles: validFiles.length,
      isPersistent: data.count >= validFiles.length * 0.7
    });
  });
  
  return result;
}

export default LeakSuspectsView;
