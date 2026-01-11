/**
 * HistogramView Component
 * 
 * Displays the object histogram with sorting and search capabilities.
 */

import { useState, useMemo } from 'react';
import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import './HistogramView.css';

function HistogramView({ histogram }) {
  const [sortBy, setSortBy] = useState('totalSize');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);

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

  return (
    <div className="histogram-view">
      <div className="histogram-header">
        <h2>Object Histogram</h2>
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
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((entry, index) => (
              <tr key={index}>
                <td className="class-name" title={entry.className}>
                  {entry.className}
                </td>
                <td className="number">{formatNumber(entry.instanceCount)}</td>
                <td className="number">{formatSize(entry.totalSize)}</td>
                <td className="number">
                  {((entry.totalSize / totalSize) * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
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
