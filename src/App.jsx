/**
 * Java Heap Dump Analyser - Main Application
 * 
 * A privacy-focused, client-side heap dump analysis tool.
 * All parsing and analysis happens in the browser - no data is sent to servers.
 * 
 * Copyright 2024 - Licensed under Apache 2.0
 */

import { useState } from 'react';
import './App.css';

// Components
import FileUpload from './components/FileUpload.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import HistogramView from './components/HistogramView.jsx';
import DominatorTreeView from './components/DominatorTreeView.jsx';
import LeakSuspectsView from './components/LeakSuspectsView.jsx';
import ConsolidatedView from './components/ConsolidatedView.jsx';

// Services
import HprofParser from './services/hprofParser.js';
import { generateHistogram } from './services/analyzers/histogramAnalyzer.js';
import { calculateDominatorTree, getTotalHeapSize } from './services/analyzers/dominatorTreeAnalyzer.js';
import { detectLeakSuspects, generateLeakInsights } from './services/analyzers/leakDetector.js';

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  
  // Store all uploaded heap dumps
  const [heapDumps, setHeapDumps] = useState([]);
  
  // Currently selected file index
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  
  const [activeTab, setActiveTab] = useState('histogram');

  // Get current file data
  const currentFile = heapDumps[selectedFileIndex] || null;
  const heapData = currentFile?.heapData || null;
  const histogram = currentFile?.histogram || null;
  const dominatorTree = currentFile?.dominatorTree || null;
  const leakSuspects = currentFile?.leakSuspects || null;
  const leakInsights = currentFile?.leakInsights || null;
  const fileName = currentFile?.fileName || '';

  const handleFileSelect = async (files) => {
    setLoading(true);
    setError(null);
    setLoadingMessage('Processing files...');

    try {
      const processedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingMessage(`Processing ${i + 1}/${files.length}: ${file.name}...`);
        
        try {
          // Read file as ArrayBuffer
          const buffer = await file.arrayBuffer();
          
          setLoadingMessage(`Parsing ${file.name}...`);
          
          // Parse the heap dump
          const parser = new HprofParser();
          const parsedData = await parser.parse(buffer);
          
          setLoadingMessage(`Analyzing ${file.name}...`);
          
          // Generate histogram
          const histogramData = generateHistogram(parsedData);
          
          // Calculate dominator tree
          const dominatorTreeData = calculateDominatorTree(parsedData);
          
          // Detect leak suspects
          const suspects = detectLeakSuspects(parsedData, histogramData, dominatorTreeData);
          
          // Generate insights
          const insights = generateLeakInsights(suspects);
          
          processedFiles.push({
            fileName: file.name,
            heapData: parsedData,
            histogram: histogramData,
            dominatorTree: dominatorTreeData,
            leakSuspects: suspects,
            leakInsights: insights,
            uploadedAt: new Date()
          });
          
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          // Continue with other files
          processedFiles.push({
            fileName: file.name,
            error: err.message,
            uploadedAt: new Date()
          });
        }
      }
      
      setHeapDumps(processedFiles);
      setSelectedFileIndex(0);
      setLoading(false);
      setActiveTab(processedFiles.length > 1 ? 'consolidated' : 'histogram');
      
    } catch (err) {
      console.error('Error processing heap dumps:', err);
      setError(`Failed to process heap dumps: ${err.message}`);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHeapDumps([]);
    setSelectedFileIndex(0);
    setError(null);
  };

  const totalHeapSize = heapData ? getTotalHeapSize(heapData) : 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>☕ Java Heap Dump Analyser</h1>
          <p className="tagline">Privacy-focused heap dump analysis in your browser</p>
        </div>
        {heapData && (
          <button onClick={handleReset} className="reset-button">
            ← Load New File(s)
          </button>
        )}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {loading && (
          <LoadingSpinner message={loadingMessage} />
        )}

        {!loading && !heapData && !error && (
          <FileUpload onFileSelect={handleFileSelect} />
        )}

        {!loading && heapDumps.length > 0 && (
          <div className="analysis-view">
            <div className="analysis-header">
              <div className="file-info">
                <span className="label">File:</span>
                {heapDumps.length === 1 ? (
                  <span className="value">{fileName}</span>
                ) : (
                  <select 
                    className="file-selector"
                    value={selectedFileIndex}
                    onChange={(e) => setSelectedFileIndex(Number(e.target.value))}
                  >
                    {heapDumps.map((dump, index) => (
                      <option key={index} value={index}>
                        {dump.fileName} {dump.error ? '(Error)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {heapDumps.length > 1 && (
                <div className="file-count-badge">
                  {heapDumps.length} files loaded
                </div>
              )}
            </div>

            <div className="tabs">
              {heapDumps.length > 1 && (
                <button 
                  className={`tab ${activeTab === 'consolidated' ? 'active' : ''}`}
                  onClick={() => setActiveTab('consolidated')}
                >
                  📈 Consolidated Analysis
                </button>
              )}
              <button 
                className={`tab ${activeTab === 'histogram' ? 'active' : ''}`}
                onClick={() => setActiveTab('histogram')}
              >
                📊 Histogram
              </button>
              <button 
                className={`tab ${activeTab === 'dominator' ? 'active' : ''}`}
                onClick={() => setActiveTab('dominator')}
              >
                🌳 Dominator Tree
              </button>
              <button 
                className={`tab ${activeTab === 'leaks' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaks')}
              >
                🔍 Leak Suspects
                {leakSuspects && leakSuspects.length > 0 && (
                  <span className="badge">{leakSuspects.length}</span>
                )}
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'consolidated' && heapDumps.length > 1 && (
                <ConsolidatedView heapDumps={heapDumps} />
              )}
              {activeTab === 'histogram' && histogram && (
                <HistogramView 
                  histogram={histogram}
                  allFiles={heapDumps}
                />
              )}
              {activeTab === 'dominator' && dominatorTree && (
                <DominatorTreeView 
                  dominatorTree={dominatorTree}
                  totalHeapSize={totalHeapSize}
                  allFiles={heapDumps}
                />
              )}
              {activeTab === 'leaks' && leakSuspects && (
                <LeakSuspectsView 
                  suspects={leakSuspects}
                  insights={leakInsights}
                  allFiles={heapDumps}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <span className="footer-icon">🔒</span>
            <span>All data processed locally in your browser</span>
          </div>
          <div className="footer-section">
            <span className="footer-icon">📄</span>
            <span>Licensed under Apache 2.0</span>
          </div>
          <div className="footer-section">
            <a 
              href="https://github.com/deepwired/java-heap-dump-analyser" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
