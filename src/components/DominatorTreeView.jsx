/**
 * DominatorTreeView Component
 * 
 * Displays the dominator tree showing retained heap by class.
 */

import { useState, useMemo } from 'react';
import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import ClassDetailsModal from './ClassDetailsModal.jsx';
import './DominatorTreeView.css';

function DominatorTreeView({ dominatorTree, totalHeapSize, allFiles = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);
  const [selectedClass, setSelectedClass] = useState(null);

  // Calculate comparison data
  const hasMultipleFiles = allFiles.length > 1;
  const comparisonData = useMemo(() => {
    if (!hasMultipleFiles) return null;
    
    const validFiles = allFiles.filter(f => !f.error && f.dominatorTree);
    if (validFiles.length < 2) return null;
    
    const classComparisons = new Map();
    
    validFiles.forEach((file) => {
      file.dominatorTree.forEach(entry => {
        if (!classComparisons.has(entry.className)) {
          classComparisons.set(entry.className, {
            retainedSizes: []
          });
        }
        const comp = classComparisons.get(entry.className);
        comp.retainedSizes.push(entry.retainedSize);
      });
    });
    
    return classComparisons;
  }, [allFiles, hasMultipleFiles]);

  const getComparisonInfo = (className, currentRetainedSize) => {
    if (!comparisonData) return null;
    
    const comparison = comparisonData.get(className);
    if (!comparison || comparison.retainedSizes.length < 2) return null;
    
    const avgRetained = comparison.retainedSizes.reduce((a, b) => a + b, 0) / comparison.retainedSizes.length;
    const trend = currentRetainedSize > avgRetained * 1.2 ? 'up' : (currentRetainedSize < avgRetained * 0.8 ? 'down' : 'stable');
    
    return {
      trend,
      avgRetained,
      filesPresent: comparison.retainedSizes.length
    };
  };

  const filtered = useMemo(() => {
    let result = [...dominatorTree];
    
    if (searchTerm) {
      result = result.filter(entry => 
        entry.className.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result.slice(0, limit);
  }, [dominatorTree, searchTerm, limit]);

  const handleRowClick = (entry) => {
    setSelectedClass(entry);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
  };

  return (
    <div className="dominator-tree-view">
      {selectedClass && (
        <ClassDetailsModal 
          classData={selectedClass}
          onClose={handleCloseModal}
        />
      )}
      <div className="dominator-header">
        <h2>Dominator Tree</h2>
        {hasMultipleFiles && (
          <div className="comparison-notice">
            📊 Comparing with {allFiles.length} files - retention trends shown
          </div>
        )}
        <p className="description">
          Shows retained heap size by class. Retained size is the amount of memory
          that would be freed if all instances of a class were garbage collected.
        </p>
      </div>

      <div className="dominator-controls">
        <input 
          type="text" 
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          className="limit-select"
        >
          <option value={50}>Show 50</option>
          <option value={100}>Show 100</option>
          <option value={500}>Show 500</option>
          <option value={999999}>Show All</option>
        </select>
      </div>

      <div className="dominator-table-container">
        <table className="dominator-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th className="number">Instances</th>
              <th className="number">Retained Size</th>
              <th className="number">% of Heap</th>
              <th className="number">Avg Size</th>
              {hasMultipleFiles && <th className="comparison-col">Trend</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => {
              const percentage = (entry.retainedSize / totalHeapSize) * 100;
              const comparison = hasMultipleFiles ? getComparisonInfo(entry.className, entry.retainedSize) : null;
              
              return (
                <tr 
                  key={index}
                  onClick={() => handleRowClick(entry)}
                  className="clickable-row"
                  title="Click for detailed insights"
                >
                  <td className="class-name" title={entry.className}>
                    {entry.className}
                  </td>
                  <td className="number">{formatNumber(entry.instanceCount)}</td>
                  <td className="number">
                    {formatSize(entry.retainedSize)}
                    {comparison && comparison.trend !== 'stable' && (
                      <span className={`trend-icon ${comparison.trend}`}>
                        {comparison.trend === 'up' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </td>
                  <td className="number">
                    <div className="percentage-cell">
                      <div className="percentage-bar">
                        <div 
                          className="percentage-fill"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="percentage-text">{percentage.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="number">{formatSize(entry.averageSize)}</td>
                  {hasMultipleFiles && (
                    <td className="comparison-col">
                      {comparison ? (
                        <div className="comparison-info">
                          <span className="files-badge">{comparison.filesPresent}/{allFiles.filter(f => !f.error).length}</span>
                          {comparison.trend === 'up' && <span className="trend-badge up">📈 Growing</span>}
                          {comparison.trend === 'down' && <span className="trend-badge down">📉 Shrinking</span>}
                          {comparison.trend === 'stable' && <span className="trend-badge stable">➡️ Stable</span>}
                        </div>
                      ) : (
                        <span className="new-badge">🆕 New</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="no-results">
          No classes match your search.
        </div>
      )}
    </div>
  );
}

export default DominatorTreeView;
