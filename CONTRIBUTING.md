# Contributing to Java Heap Dump Analyser

Thank you for your interest in contributing! This guide will help you extend and improve the heap dump analyser.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- A text editor (VS Code recommended)
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/deepwired/java-heap-dump-analyser.git
cd java-heap-dump-analyser

# Install dependencies
npm install

# Start development server
npm start

# In another terminal, run linter
npm run lint

# Build for production
npm run build
```

## Project Structure

```
java-heap-dump-analyser/
├── src/
│   ├── components/          # React UI components
│   │   ├── FileUpload.jsx
│   │   ├── HistogramView.jsx
│   │   ├── DominatorTreeView.jsx
│   │   └── LeakSuspectsView.jsx
│   ├── services/            # Business logic
│   │   ├── hprofParser.js   # HPROF file parser
│   │   └── analyzers/       # Analysis algorithms
│   │       ├── histogramAnalyzer.js
│   │       ├── dominatorTreeAnalyzer.js
│   │       ├── leakDetector.js
│   │       └── referenceChainAnalyzer.js
│   ├── App.jsx              # Main application
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── README.md                # User documentation
├── TESTING.md              # Testing guide
└── package.json            # Dependencies
```

## How to Contribute

### 1. Adding New Analysis Features

To add a new analyzer (e.g., detect duplicate strings):

1. Create `src/services/analyzers/duplicateDetector.js`:

```javascript
/**
 * Duplicate String Detector
 * Finds duplicate string values that waste memory
 */

export function findDuplicateStrings(heapData) {
  const stringValues = new Map(); // value -> count
  
  // Analyze string instances
  // ... implementation
  
  return duplicates;
}
```

2. Add it to `src/App.jsx`:

```javascript
import { findDuplicateStrings } from './services/analyzers/duplicateDetector.js';

// In handleFileSelect:
const duplicates = findDuplicateStrings(parsedData);
setDuplicates(duplicates);
```

3. Create a UI component `src/components/DuplicatesView.jsx`

4. Add a new tab in the UI

### 2. Supporting New HPROF Formats

The parser is in `src/services/hprofParser.js`. To add support for new record types:

```javascript
// Add to SUB_TAGS constant
const SUB_TAGS = {
  // ... existing tags
  NEW_RECORD_TYPE: 0xAB,
};

// Add parser method
parseNewRecordType() {
  // Read record data
  const data = this.readValue(type);
  
  // Store in appropriate collection
  this.newRecords.set(id, data);
}

// Add to parseHeapDump switch statement
case SUB_TAGS.NEW_RECORD_TYPE:
  this.parseNewRecordType();
  break;
```

### 3. Improving Leak Detection

Edit `src/services/analyzers/leakDetector.js`:

```javascript
// Add new pattern to LEAK_PATTERNS
const LEAK_PATTERNS = {
  // ... existing patterns
  NEW_PATTERN: {
    pattern: /YourPattern/i,
    name: 'Pattern Name',
    description: 'What this pattern indicates',
    severity: 'high'
  }
};
```

### 4. UI Enhancements

Components use React hooks and CSS modules. Example:

```javascript
import { useState, useMemo } from 'react';
import './YourComponent.css';

function YourComponent({ data }) {
  const [filter, setFilter] = useState('');
  
  const filtered = useMemo(() => {
    return data.filter(item => item.name.includes(filter));
  }, [data, filter]);
  
  return (
    <div className="your-component">
      <input 
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      {/* ... */}
    </div>
  );
}
```

## Code Guidelines

### General Principles

1. **Privacy First**: Never make network requests with user data
2. **Performance**: Be mindful of large heap dumps
3. **Comments**: Document complex algorithms
4. **Error Handling**: Always validate and handle errors gracefully

### Code Style

- Use meaningful variable names
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use const/let, avoid var
- Prefer functional patterns over classes

### Example Function Documentation

```javascript
/**
 * Calculate retained heap size by class
 * @param {Object} heapData - Parsed heap dump data
 * @param {Map} heapData.classes - Map of class ID to class info
 * @param {Map} heapData.instances - Map of object ID to instance
 * @returns {Array<Object>} Array of {className, retainedSize, instanceCount}
 */
export function calculateRetainedHeap(heapData) {
  // Implementation
}
```

## Testing

### Manual Testing

1. Use the test programs in `TESTING.md` to generate heap dumps
2. Load them in the application
3. Verify all tabs work correctly
4. Test search, sort, and filter features

### Linting

```bash
npm run lint
```

Fix any errors before submitting.

### Building

```bash
npm run build
```

Ensure the build succeeds.

## Advanced Topics

### Handling Very Large Heaps

For heaps >1GB, consider:

1. **Streaming Parsing**: Parse in chunks instead of loading everything
2. **Web Workers**: Move parsing to a background thread
3. **IndexedDB**: Store parsed data in browser database
4. **Pagination**: Show results in pages

Example worker:

```javascript
// src/workers/parser.worker.js
import HprofParser from '../services/hprofParser.js';

self.onmessage = async (e) => {
  const parser = new HprofParser();
  const result = await parser.parse(e.data);
  self.postMessage(result);
};
```

### WebAssembly Integration

For better performance, consider porting the parser to WebAssembly:

1. Write parser in Rust/C++
2. Compile to WASM
3. Create JavaScript bindings
4. Fall back to JS parser for compatibility

### Advanced Visualizations

Consider adding:

- **Graph View**: Visualize object references as a graph
- **Timeline**: Show object allocation over time (if dump includes timestamps)
- **Heatmap**: Visual representation of memory usage
- **Diff View**: Compare two heap dumps

Libraries to consider:
- D3.js for graphs
- React Flow for interactive diagrams
- Recharts for charts

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run linter: `npm run lint`
5. Test thoroughly
6. Commit with clear messages: `git commit -m "Add feature X"`
7. Push: `git push origin feature-name`
8. Open a Pull Request

### Pull Request Guidelines

- Describe what the PR does
- Explain why the change is needed
- Include screenshots for UI changes
- Reference any related issues
- Ensure CI passes

## Getting Help

- Open an issue for bugs or feature requests
- Tag issues with appropriate labels
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

## Acknowledgments

Thank you for helping make this tool better for everyone!
