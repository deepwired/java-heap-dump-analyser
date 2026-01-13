/**
 * ConsolidatedView Component
 * 
 * Shows aggregated analysis across multiple heap dump files.
 * Identifies patterns, trends, and common issues across all uploaded files.
 */

import { useState } from 'react';
import './ConsolidatedView.css';
import ClassDetailsModal from './ClassDetailsModal.jsx';

function ConsolidatedView({ heapDumps }) {
  const [selectedClass, setSelectedClass] = useState(null);

  // Filter out files with errors
  const validDumps = heapDumps.filter(dump => !dump.error);

  if (validDumps.length === 0) {
    return (
      <div className="consolidated-view">
        <div className="no-data">
          No valid heap dumps to analyze. All uploaded files had errors.
        </div>
      </div>
    );
  }

  // Aggregate data across all files
  const aggregateData = aggregateHeapDumps(validDumps);

  return (
    <div className="consolidated-view">
      <div className="consolidated-header">
        <h2>📈 Consolidated Analysis</h2>
        <p>Analysis across {validDumps.length} heap dump files</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-section">
        <h3>📊 Summary Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Files Analyzed</div>
            <div className="stat-value">{validDumps.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Classes</div>
            <div className="stat-value">{aggregateData.uniqueClasses}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Common Leak Suspects</div>
            <div className="stat-value">{aggregateData.commonLeakSuspects.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Persistent Issues</div>
            <div className="stat-value">{aggregateData.persistentIssues}</div>
          </div>
        </div>
      </div>

      {/* Common Leak Suspects */}
      {aggregateData.commonLeakSuspects.length > 0 && (
        <div className="section">
          <h3>🔍 Common Leak Suspects</h3>
          <p className="section-description">
            Classes appearing as leak suspects in multiple files (ordered by frequency)
          </p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Occurrences</th>
                  <th>Avg Retained Size</th>
                  <th>Trend</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {aggregateData.commonLeakSuspects.map((suspect, index) => (
                  <tr 
                    key={index}
                    className="clickable-row"
                    onClick={() => setSelectedClass(suspect.className)}
                    title="Click for detailed insights"
                  >
                    <td className="class-name">{suspect.className}</td>
                    <td>{suspect.occurrences} / {validDumps.length} files</td>
                    <td>{formatBytes(suspect.avgRetainedSize)}</td>
                    <td>
                      <span className={`trend-indicator ${suspect.trend}`}>
                        {suspect.trend === 'increasing' && '📈 Increasing'}
                        {suspect.trend === 'decreasing' && '📉 Decreasing'}
                        {suspect.trend === 'stable' && '➡️ Stable'}
                      </span>
                    </td>
                    <td>
                      <span className={`severity-badge ${suspect.severity}`}>
                        {suspect.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Memory Consumers (Consistent) */}
      <div className="section">
        <h3>💾 Consistent Memory Consumers</h3>
        <p className="section-description">
          Classes consistently using significant memory across all files
        </p>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Files Present</th>
                <th>Avg Size</th>
                <th>Min Size</th>
                <th>Max Size</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {aggregateData.consistentMemoryConsumers.map((consumer, index) => (
                <tr 
                  key={index}
                  className="clickable-row"
                  onClick={() => setSelectedClass(consumer.className)}
                  title="Click for detailed insights"
                >
                  <td className="class-name">{consumer.className}</td>
                  <td>{consumer.filesPresent} / {validDumps.length}</td>
                  <td>{formatBytes(consumer.avgSize)}</td>
                  <td>{formatBytes(consumer.minSize)}</td>
                  <td>{formatBytes(consumer.maxSize)}</td>
                  <td>
                    <span className={`variance-indicator ${getVarianceLevel(consumer.variance)}`}>
                      {(consumer.variance * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instance Count Trends */}
      <div className="section">
        <h3>📊 Instance Count Trends</h3>
        <p className="section-description">
          Classes showing significant changes in instance counts
        </p>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>First File Count</th>
                <th>Last File Count</th>
                <th>Change</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {aggregateData.instanceTrends.map((trend, index) => (
                <tr 
                  key={index}
                  className="clickable-row"
                  onClick={() => setSelectedClass(trend.className)}
                  title="Click for detailed insights"
                >
                  <td className="class-name">{trend.className}</td>
                  <td>{trend.firstCount.toLocaleString()}</td>
                  <td>{trend.lastCount.toLocaleString()}</td>
                  <td>
                    <span className={`change-indicator ${trend.change > 0 ? 'positive' : 'negative'}`}>
                      {trend.change > 0 ? '+' : ''}{((trend.change) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span className={`trend-indicator ${trend.trendType}`}>
                      {trend.trendType === 'growing' && '📈 Growing'}
                      {trend.trendType === 'shrinking' && '📉 Shrinking'}
                      {trend.trendType === 'stable' && '➡️ Stable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h3>💡 Key Insights</h3>
        <div className="insights-grid">
          {aggregateData.insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div className="insight-icon">{insight.icon}</div>
              <div className="insight-content">
                <div className="insight-title">{insight.title}</div>
                <div className="insight-description">{insight.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h3>✅ Recommendations</h3>
        <ol className="recommendations-list">
          {aggregateData.recommendations.map((rec, index) => (
            <li key={index} className={`recommendation ${rec.priority}`}>
              <span className="recommendation-priority">{rec.priorityIcon}</span>
              <span className="recommendation-text">{rec.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {selectedClass && (
        <ClassDetailsModal
          className={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
}

/**
 * Aggregate data from multiple heap dumps
 */
function aggregateHeapDumps(heapDumps) {
  // Track all unique classes
  const classDataMap = new Map();
  const leakSuspectCounts = new Map();
  
  // Process each heap dump
  heapDumps.forEach((dump) => {
    // Process histogram
    if (dump.histogram) {
      dump.histogram.forEach(entry => {
        if (!classDataMap.has(entry.className)) {
          classDataMap.set(entry.className, {
            className: entry.className,
            sizes: [],
            instances: [],
            filesPresent: 0
          });
        }
        const classData = classDataMap.get(entry.className);
        classData.sizes.push(entry.totalSize);
        classData.instances.push(entry.instanceCount);
        classData.filesPresent++;
      });
    }
    
    // Track leak suspects
    if (dump.leakSuspects) {
      dump.leakSuspects.forEach(suspect => {
        const count = leakSuspectCounts.get(suspect.className) || { count: 0, severities: [], retainedSizes: [] };
        count.count++;
        count.severities.push(suspect.severity);
        count.retainedSizes.push(suspect.retainedSize || 0);
        leakSuspectCounts.set(suspect.className, count);
      });
    }
  });

  // Analyze unique classes
  const uniqueClasses = classDataMap.size;

  // Find common leak suspects (appearing in 2+ files)
  const commonLeakSuspects = [];
  leakSuspectCounts.forEach((data, className) => {
    if (data.count >= 2) {
      const avgRetainedSize = data.retainedSizes.reduce((a, b) => a + b, 0) / data.retainedSizes.length;
      const trend = analyzeTrend(data.retainedSizes);
      const severity = getMostCommonSeverity(data.severities);
      
      commonLeakSuspects.push({
        className,
        occurrences: data.count,
        avgRetainedSize,
        trend,
        severity
      });
    }
  });
  
  // Sort by occurrence count
  commonLeakSuspects.sort((a, b) => b.occurrences - a.occurrences);

  // Find consistent memory consumers
  const consistentMemoryConsumers = [];
  classDataMap.forEach((data, className) => {
    if (data.filesPresent >= Math.max(2, heapDumps.length * 0.5)) {
      const avgSize = data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length;
      const minSize = Math.min(...data.sizes);
      const maxSize = Math.max(...data.sizes);
      const variance = avgSize > 0 ? (maxSize - minSize) / avgSize : 0;
      
      consistentMemoryConsumers.push({
        className,
        filesPresent: data.filesPresent,
        avgSize,
        minSize,
        maxSize,
        variance
      });
    }
  });
  
  // Sort by average size
  consistentMemoryConsumers.sort((a, b) => b.avgSize - a.avgSize);
  const topConsumers = consistentMemoryConsumers.slice(0, 10);

  // Analyze instance count trends
  const instanceTrends = [];
  classDataMap.forEach((data, className) => {
    if (data.instances.length >= 2) {
      const firstCount = data.instances[0];
      const lastCount = data.instances[data.instances.length - 1];
      const change = (lastCount - firstCount) / firstCount;
      
      // Only show significant changes (>20%)
      if (Math.abs(change) > 0.2) {
        const trendType = change > 0.5 ? 'growing' : (change < -0.2 ? 'shrinking' : 'stable');
        instanceTrends.push({
          className,
          firstCount,
          lastCount,
          change,
          trendType
        });
      }
    }
  });
  
  // Sort by absolute change
  instanceTrends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const topTrends = instanceTrends.slice(0, 10);

  // Generate insights
  const insights = generateInsights(heapDumps, commonLeakSuspects, topConsumers, topTrends);
  
  // Generate recommendations
  const recommendations = generateRecommendations(commonLeakSuspects, topConsumers, topTrends);
  
  // Count persistent issues
  const persistentIssues = commonLeakSuspects.filter(s => s.occurrences >= heapDumps.length * 0.7).length;

  return {
    uniqueClasses,
    commonLeakSuspects: commonLeakSuspects.slice(0, 20),
    consistentMemoryConsumers: topConsumers,
    instanceTrends: topTrends,
    insights,
    recommendations,
    persistentIssues
  };
}

function analyzeTrend(values) {
  if (values.length < 2) return 'stable';
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = (last - first) / first;
  
  if (change > 0.2) return 'increasing';
  if (change < -0.2) return 'decreasing';
  return 'stable';
}

function getMostCommonSeverity(severities) {
  const counts = {};
  severities.forEach(s => {
    counts[s] = (counts[s] || 0) + 1;
  });
  
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function getVarianceLevel(variance) {
  if (variance < 0.2) return 'low';
  if (variance < 0.5) return 'medium';
  return 'high';
}

function generateInsights(heapDumps, leakSuspects, consumers, trends) {
  const insights = [];
  
  // Insight: Persistent leaks
  const persistentLeaks = leakSuspects.filter(s => s.occurrences >= heapDumps.length * 0.7);
  if (persistentLeaks.length > 0) {
    insights.push({
      type: 'critical',
      icon: '🔴',
      title: 'Persistent Memory Leaks Detected',
      description: `${persistentLeaks.length} leak suspect(s) appear in most files, indicating systematic issues that need immediate attention.`
    });
  }
  
  // Insight: Growing instances
  const growingClasses = trends.filter(t => t.trendType === 'growing');
  if (growingClasses.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Growing Instance Counts',
      description: `${growingClasses.length} class(es) show increasing instance counts across files, suggesting potential memory accumulation.`
    });
  }
  
  // Insight: High variance
  const highVariance = consumers.filter(c => c.variance > 0.5);
  if (highVariance.length > 0) {
    insights.push({
      type: 'info',
      icon: '📊',
      title: 'Variable Memory Usage',
      description: `${highVariance.length} class(es) show high variance in memory usage, indicating workload-dependent behavior.`
    });
  }
  
  // Insight: Common patterns
  const stringLeaks = leakSuspects.filter(s => s.className.includes('String') || s.className.includes('char[]'));
  if (stringLeaks.length > 0) {
    insights.push({
      type: 'info',
      icon: '💡',
      title: 'String Retention Pattern',
      description: 'String-related classes appear frequently as leak suspects. Review string handling, caching, and logging practices.'
    });
  }
  
  return insights;
}

function generateRecommendations(leakSuspects, consumers, trends) {
  const recommendations = [];
  
  // Priority based on persistent leaks
  if (leakSuspects.length > 0) {
    const topSuspect = leakSuspects[0];
    recommendations.push({
      priority: 'critical',
      priorityIcon: '🔴',
      text: `Investigate ${topSuspect.className} - appears as leak suspect in ${topSuspect.occurrences} files with ${topSuspect.severity} severity.`
    });
  }
  
  // Address growing trends
  const fastGrowing = trends.filter(t => t.change > 1.0);
  if (fastGrowing.length > 0) {
    recommendations.push({
      priority: 'high',
      priorityIcon: '⚠️',
      text: `Address rapidly growing classes: ${fastGrowing.slice(0, 3).map(t => t.className).join(', ')}. Instance counts more than doubled.`
    });
  }
  
  // Monitor high consumers
  if (consumers.length > 0) {
    recommendations.push({
      priority: 'medium',
      priorityIcon: '💡',
      text: `Monitor ${consumers[0].className} - consistently high memory usage across all files (avg: ${formatBytes(consumers[0].avgSize)}).`
    });
  }
  
  // General recommendations
  recommendations.push({
    priority: 'info',
    priorityIcon: 'ℹ️',
    text: 'Use Eclipse MAT or VisualVM for detailed reference chain analysis to identify root causes of persistent leaks.'
  });
  
  recommendations.push({
    priority: 'info',
    priorityIcon: 'ℹ️',
    text: 'Click any class name to see detailed insights, common issues, and resolution strategies.'
  });
  
  return recommendations;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default ConsolidatedView;
