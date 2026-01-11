# Java Heap Dump Analyser

A privacy-focused, client-side web application for analyzing Java heap dumps (.hprof files). All parsing and analysis happens entirely in your browser—no data ever leaves your machine.

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

## 🔒 Privacy First

**Your data never leaves your browser.** This application:
- Runs completely client-side using JavaScript
- Does not make any network requests with your heap dump data
- Does not upload files to any server
- Processes everything locally in your browser

## Features

- **📊 Object Histogram**: View class names, instance counts, and total memory usage
- **🌳 Dominator Tree**: Analyze retained heap size by class
- **🔗 Reference Chains**: Trace who holds references to large objects
- **🔍 Leak Suspects**: Automatic detection of classes with unusually high retained size or instance count
- **💡 Insights**: Identify common leak patterns:
  - Retained batch strings
  - Uncollected collections
  - Classloader leaks
  - Event listener accumulation
- **🔎 Search & Filter**: Sort and search through objects efficiently
- **📱 Responsive Design**: Works on desktop and mobile browsers

## Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/deepwired/java-heap-dump-analyser.git
cd java-heap-dump-analyser

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:5173`

### Usage

1. Click "Choose File" or drag and drop a `.hprof` file
2. Wait for the file to be parsed (this happens in your browser)
3. Explore the analysis results:
   - **Histogram Tab**: See all classes sorted by memory usage
   - **Dominator Tree Tab**: View retained heap by class
   - **Leak Suspects Tab**: Review automatically detected potential memory leaks
   - **References Tab**: Trace object reference chains

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve them with any static file server.

## Generating Heap Dumps

To create a heap dump from a running Java application:

```bash
# Using jmap (requires JDK)
jmap -dump:format=b,file=heap.hprof <pid>

# Using jcmd (requires JDK)
jcmd <pid> GC.heap_dump heap.hprof

# Automatic dump on OutOfMemoryError
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./heap.hprof YourApp
```

## Architecture

### Technology Stack

- **React 19**: UI framework
- **Vite**: Build tool and dev server
- **Pure JavaScript**: HPROF parser implementation

### HPROF Parser

The parser is implemented in pure JavaScript to run entirely in the browser. It supports:
- HPROF format version 1.0.3 (Java 11+)
- Common record types: CLASS, INSTANCE, OBJECT_ARRAY, PRIMITIVE_ARRAY
- GC root records for dominator tree analysis
- String records for efficient memory usage

### Analysis Algorithms

1. **Histogram**: Aggregates instances by class with counts and shallow sizes
2. **Dominator Tree**: Calculates retained heap using GC root traversal
3. **Reference Chains**: Breadth-first search from GC roots to target objects
4. **Leak Detection**: Statistical analysis of retained sizes and common patterns

## Common Memory Leak Patterns

This tool is designed to detect common JVM memory leak patterns, especially those seen in observability pipelines:

### 1. Retained Batch Strings
Large numbers of string objects held in collections, often from log processing or event batching.

### 2. Uncollected Collections
HashMap, ArrayList, or other collections that grow unbounded due to missing cleanup logic.

### 3. Classloader Leaks
Applications or modules that fail to unload, retaining entire class graphs and static fields.

### 4. Listener Leaks
Event listeners or callbacks that are registered but never removed.

## Contributing

Contributions are welcome! Here's how to extend the analyzer:

### Adding New Analysis Features

1. Create a new analyzer in `src/services/analyzers/`
2. Implement the analysis logic using the parsed heap data
3. Add UI components in `src/components/`
4. Update the main App.jsx to include your feature

### Supporting New HPROF Formats

The parser is in `src/services/hprofParser.js`. To add support for new record types:

1. Add the record type constant
2. Implement the parser for that record type
3. Update the data structures to store the new information
4. Add tests for the new format

### Parser Extensions

The current parser handles common JVM heap dump formats. For advanced scenarios:
- Consider integrating WebAssembly ports of Eclipse MAT
- Add support for compressed heap dumps
- Implement incremental parsing for very large files

## Testing

```bash
# Run linter
npm run lint

# Build the project
npm run build

# Preview production build
npm run preview
```

### Testing with Sample Heap Dumps

Create test heap dumps using the provided test program:

```java
// TestMemoryLeak.java
import java.util.*;

public class TestMemoryLeak {
    private static List<String> leak = new ArrayList<>();
    
    public static void main(String[] args) throws Exception {
        for (int i = 0; i < 100000; i++) {
            leak.add("Leaked string " + i);
        }
        System.out.println("Press Enter to dump heap...");
        System.in.read();
    }
}
```

Compile and run:
```bash
javac TestMemoryLeak.java
java TestMemoryLeak
# In another terminal: jmap -dump:format=b,file=test.hprof <pid>
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) file for details.

## Acknowledgments

Inspired by:
- [Eclipse Memory Analyzer Tool (MAT)](https://www.eclipse.org/mat/)
- [VisualVM](https://visualvm.github.io/)
- [heap-dump-viewer](https://github.com/alexfeigin/heap-dump-viewer)

## Security

This application is designed with security in mind:
- No external network requests are made
- All processing happens client-side
- No data is stored or transmitted
- No dependencies with known vulnerabilities

If you find a security issue, please report it via GitHub Issues.

## Support

For issues, questions, or contributions:
- Open an [Issue](https://github.com/deepwired/java-heap-dump-analyser/issues)
- Submit a [Pull Request](https://github.com/deepwired/java-heap-dump-analyser/pulls)
