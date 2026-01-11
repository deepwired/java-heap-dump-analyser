/**
 * LoadingSpinner Component
 * 
 * Shows loading state while parsing heap dump.
 */

import './LoadingSpinner.css';

function LoadingSpinner({ message, progress }) {
  return (
    <div className="loading-spinner">
      <div className="spinner-container">
        <div className="spinner"></div>
        <div className="spinner-message">{message}</div>
        {progress !== undefined && (
          <div className="spinner-progress">{progress}%</div>
        )}
      </div>
    </div>
  );
}

export default LoadingSpinner;
