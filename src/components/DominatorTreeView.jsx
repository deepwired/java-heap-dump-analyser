/**
 * DominatorTreeView Component
 * 
 * Displays the dominator tree showing retained heap by class.
 */

import { useState, useMemo } from 'react';
import { formatSize, formatNumber } from '../services/analyzers/histogramAnalyzer.js';
import ClassDetailsModal from './ClassDetailsModal.jsx';
import './DominatorTreeView.css';

function DominatorTreeView({ dominatorTree, totalHeapSize }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);
  const [selectedClass, setSelectedClass] = useState(null);

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
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => {
              const percentage = (entry.retainedSize / totalHeapSize) * 100;
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
                  <td className="number">{formatSize(entry.retainedSize)}</td>
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
