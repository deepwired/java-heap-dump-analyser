/**
 * LeakSuspectsView Component
 * 
 * Displays detected memory leak suspects with severity levels and patterns.
 */

import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import './LeakSuspectsView.css';

function LeakSuspectsView({ suspects, insights }) {
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

  return (
    <div className="leak-suspects-view">
      <div className="leak-suspects-header">
        <h2>Memory Leak Suspects</h2>
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
          suspects.map((suspect, index) => (
            <div key={index} className="suspect-card">
              <div className="suspect-header">
                <div className="suspect-severity" style={{ color: getSeverityColor(suspect.severity) }}>
                  <span className="severity-icon">{getSeverityIcon(suspect.severity)}</span>
                  <span className="severity-text">{suspect.severity.toUpperCase()}</span>
                </div>
                <div className="suspect-class">{suspect.className}</div>
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
          ))
        )}
      </div>
    </div>
  );
}

export default LeakSuspectsView;
