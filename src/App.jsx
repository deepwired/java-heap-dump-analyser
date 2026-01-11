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

// Services
import HprofParser from './services/hprofParser.js';
import { generateHistogram } from './services/analyzers/histogramAnalyzer.js';
import { calculateDominatorTree, getTotalHeapSize } from './services/analyzers/dominatorTreeAnalyzer.js';
import { detectLeakSuspects, generateLeakInsights } from './services/analyzers/leakDetector.js';

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [heapData, setHeapData] = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [dominatorTree, setDominatorTree] = useState(null);
  const [leakSuspects, setLeakSuspects] = useState(null);
  const [leakInsights, setLeakInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('histogram');
  const [fileName, setFileName] = useState('');

  const handleFileSelect = async (file) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setLoadingMessage('Reading file...');

    try {
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      setLoadingMessage('Parsing heap dump...');
      
      // Parse the heap dump
      const parser = new HprofParser();
      const parsedData = await parser.parse(buffer);
      
      setLoadingMessage('Analyzing data...');
      
      // Generate histogram
      const histogramData = generateHistogram(parsedData);
      setHistogram(histogramData);
      
      // Calculate dominator tree
      const dominatorTreeData = calculateDominatorTree(parsedData);
      setDominatorTree(dominatorTreeData);
      
      // Detect leak suspects
      const suspects = detectLeakSuspects(parsedData, histogramData, dominatorTreeData);
      setLeakSuspects(suspects);
      
      // Generate insights
      const insights = generateLeakInsights(suspects);
      setLeakInsights(insights);
      
      setHeapData(parsedData);
      setLoading(false);
      setActiveTab('histogram');
      
    } catch (err) {
      console.error('Error processing heap dump:', err);
      setError(`Failed to process heap dump: ${err.message}`);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHeapData(null);
    setHistogram(null);
    setDominatorTree(null);
    setLeakSuspects(null);
    setLeakInsights(null);
    setFileName('');
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
            ← Load New File
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

        {!loading && heapData && (
          <div className="analysis-view">
            <div className="analysis-header">
              <div className="file-info">
                <span className="label">File:</span>
                <span className="value">{fileName}</span>
              </div>
            </div>

            <div className="tabs">
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
              {activeTab === 'histogram' && histogram && (
                <HistogramView histogram={histogram} />
              )}
              {activeTab === 'dominator' && dominatorTree && (
                <DominatorTreeView 
                  dominatorTree={dominatorTree}
                  totalHeapSize={totalHeapSize}
                />
              )}
              {activeTab === 'leaks' && leakSuspects && (
                <LeakSuspectsView 
                  suspects={leakSuspects}
                  insights={leakInsights}
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
