/**
 * FileUpload Component
 * 
 * Allows users to select or drag-and-drop .hprof files for analysis.
 * All file processing happens client-side.
 */

import { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files) => {
    setError(null);
    
    // Validate all files are .hprof
    const invalidFiles = files.filter(file => !file.name.endsWith('.hprof'));
    if (invalidFiles.length > 0) {
      setError(`Please select only .hprof files. Invalid: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Pass all files to parent
    onFileSelect(files);
  };

  return (
    <div className="file-upload">
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
      
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📁</div>
        <h2>Upload Heap Dump(s)</h2>
        <p>Drag and drop your .hprof file(s) here, or click to browse</p>
        <p className="multi-file-hint">💡 You can select multiple files to compare and analyze trends</p>
        <input 
          type="file" 
          accept=".hprof"
          onChange={handleFileInput}
          id="file-input"
          multiple
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="upload-button">
          Choose File(s)
        </label>
      </div>
      
      <div className="privacy-notice">
        <div className="privacy-icon">🔒</div>
        <div className="privacy-text">
          <strong>Privacy First:</strong> Your data never leaves your browser.
          All parsing and analysis happens locally on your machine.
          No files are uploaded to any server.
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
