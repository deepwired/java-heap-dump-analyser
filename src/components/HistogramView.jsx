/**
 * HistogramView Component
 * 
 * Displays the object histogram with sorting and search capabilities.
 */

import { useState, useMemo } from 'react';
import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import ClassDetailsModal from './ClassDetailsModal.jsx';
import './HistogramView.css';

function HistogramView({ histogram, allFiles = [] }) {
  const [sortBy, setSortBy] = useState('totalSize');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);
  const [selectedClass, setSelectedClass] = useState(null);

  // Calculate comparison data
  const hasMultipleFiles = allFiles.length > 1;
  const comparisonData = useMemo(() => {
    if (!hasMultipleFiles) return null;
    
    const validFiles = allFiles.filter(f => !f.error && f.histogram);
    if (validFiles.length < 2) return null;
    
    const classComparisons = new Map();
    
    // Build comparison map
    validFiles.forEach((file, fileIndex) => {
      file.histogram.forEach(entry => {
        if (!classComparisons.has(entry.className)) {
          classComparisons.set(entry.className, {
            sizes: [],
            instances: []
          });
        }
        const comp = classComparisons.get(entry.className);
        comp.sizes[fileIndex] = entry.totalSize;
        comp.instances[fileIndex] = entry.instanceCount;
      });
    });
    
    return classComparisons;
  }, [allFiles, hasMultipleFiles]);

  const getComparisonInfo = (className, currentSize, currentInstances) => {
    if (!comparisonData) return null;
    
    const comparison = comparisonData.get(className);
    if (!comparison) return null;
    
    const sizes = comparison.sizes.filter(s => s !== undefined);
    const instances = comparison.instances.filter(i => i !== undefined);
    
    if (sizes.length < 2) return null;
    
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const avgInstances = instances.reduce((a, b) => a + b, 0) / instances.length;
    
    const sizeTrend = currentSize > avgSize * 1.2 ? 'up' : (currentSize < avgSize * 0.8 ? 'down' : 'stable');
    const instanceTrend = currentInstances > avgInstances * 1.2 ? 'up' : (currentInstances < avgInstances * 0.8 ? 'down' : 'stable');
    
    return {
      sizeTrend,
      instanceTrend,
      avgSize,
      avgInstances,
      filesPresent: sizes.length
    };
  };

  const sortedAndFiltered = useMemo(() => {
    let result = [...histogram];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(entry => 
        entry.className.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    
    return result.slice(0, limit);
  }, [histogram, sortBy, sortOrder, searchTerm, limit]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const totalSize = histogram.reduce((sum, entry) => sum + entry.totalSize, 0);
  const totalInstances = histogram.reduce((sum, entry) => sum + entry.instanceCount, 0);

  const handleRowClick = (entry) => {
    setSelectedClass(entry);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
  };

  return (
    <div className="histogram-view">
      {selectedClass && (
        <ClassDetailsModal 
          classData={selectedClass}
          onClose={handleCloseModal}
        />
      )}
      <div className="histogram-header">
        <h2>Object Histogram</h2>
        {hasMultipleFiles && (
          <div className="comparison-notice">
            📊 Comparing with {allFiles.length} files - trends shown relative to average
          </div>
        )}
        <div className="histogram-summary">
          <div className="summary-item">
            <span className="label">Total Classes:</span>
            <span className="value">{formatNumber(histogram.length)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Instances:</span>
            <span className="value">{formatNumber(totalInstances)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Size:</span>
            <span className="value">{formatSize(totalSize)}</span>
          </div>
        </div>
      </div>

      <div className="histogram-controls">
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
          <option value={1000}>Show 1000</option>
          <option value={999999}>Show All</option>
        </select>
      </div>

      <div className="histogram-table-container">
        <table className="histogram-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('className')} className="sortable">
                Class Name {sortBy === 'className' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('instanceCount')} className="sortable number">
                Instances {sortBy === 'instanceCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalSize')} className="sortable number">
                Total Size {sortBy === 'totalSize' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="number">% of Heap</th>
              {hasMultipleFiles && <th className="comparison-col">Trend</th>}
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((entry, index) => {
              const comparison = hasMultipleFiles ? getComparisonInfo(entry.className, entry.totalSize, entry.instanceCount) : null;
              
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
                  <td className="number">
                    {formatNumber(entry.instanceCount)}
                    {comparison && comparison.instanceTrend !== 'stable' && (
                      <span className={`trend-icon ${comparison.instanceTrend}`}>
                        {comparison.instanceTrend === 'up' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </td>
                  <td className="number">
                    {formatSize(entry.totalSize)}
                    {comparison && comparison.sizeTrend !== 'stable' && (
                      <span className={`trend-icon ${comparison.sizeTrend}`}>
                        {comparison.sizeTrend === 'up' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </td>
                  <td className="number">
                    {((entry.totalSize / totalSize) * 100).toFixed(2)}%
                  </td>
                  {hasMultipleFiles && (
                    <td className="comparison-col">
                      {comparison ? (
                        <div className="comparison-info">
                          <span className="files-badge">{comparison.filesPresent}/{allFiles.filter(f => !f.error).length}</span>
                          {comparison.sizeTrend === 'up' && <span className="trend-badge up">📈 Above Avg</span>}
                          {comparison.sizeTrend === 'down' && <span className="trend-badge down">📉 Below Avg</span>}
                          {comparison.sizeTrend === 'stable' && <span className="trend-badge stable">➡️ Normal</span>}
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
      
      {sortedAndFiltered.length === 0 && (
        <div className="no-results">
          No classes match your search.
        </div>
      )}
    </div>
  );
}

export default HistogramView;
