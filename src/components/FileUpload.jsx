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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    setError(null);
    if (!file.name.endsWith('.hprof')) {
      setError('Please select a .hprof file');
      return;
    }
    onFileSelect(file);
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
        <h2>Upload Heap Dump</h2>
        <p>Drag and drop your .hprof file here, or click to browse</p>
        <input 
          type="file" 
          accept=".hprof"
          onChange={handleFileInput}
          id="file-input"
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="upload-button">
          Choose File
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
