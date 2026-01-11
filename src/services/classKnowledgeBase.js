/**
 * Class Knowledge Base
 * 
 * Contains information about common Java classes, their typical usage,
 * potential memory issues, and links to documentation.
 */

/**
 * Get detailed information about a class
 * @param {string} className - The fully qualified class name
 * @returns {Object} Detailed information about the class
 */
export function getClassInfo(className) {
  // Check for exact matches first
  if (CLASS_KNOWLEDGE[className]) {
    return CLASS_KNOWLEDGE[className];
  }

  // Check for pattern matches
  for (const [pattern, info] of Object.entries(CLASS_PATTERNS)) {
    if (new RegExp(pattern).test(className)) {
      return { ...info, matchType: 'pattern' };
    }
  }

  // Return generic information
  return {
    description: 'Custom application class',
    commonIssues: [
      'Verify objects are properly cleaned up',
      'Check for static field retention',
      'Ensure no circular references prevent GC'
    ],
    links: [],
    matchType: 'generic'
  };
}

/**
 * Exact class matches with detailed information
 */
const CLASS_KNOWLEDGE = {
  'java.lang.String': {
    description: 'Immutable sequence of characters. Strings are interned in the string pool.',
    commonIssues: [
      'Large numbers of duplicate strings consuming memory',
      'String concatenation in loops creating many intermediate objects',
      'Retained strings from log messages or batch processing',
      'Substrings holding references to larger underlying char arrays (Java 6)'
    ],
    resolutions: [
      'Use StringBuilder for string concatenation in loops',
      'Consider string interning for frequently repeated strings',
      'Clear string collections after batch processing',
      'Review logging configuration and retention policies'
    ],
    links: [
      { title: 'Java String Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/String.html' },
      { title: 'String Memory Leaks Guide', url: 'https://www.baeldung.com/java-string-memory' }
    ]
  },

  'java.util.HashMap': {
    description: 'Hash table implementation of Map interface. Allows null keys and values.',
    commonIssues: [
      'Growing unbounded without size limits or cleanup',
      'Poor hash code implementation causing many collisions',
      'Memory leak from keys/values that are never removed',
      'Retained after intended use due to static references'
    ],
    resolutions: [
      'Implement size limits and eviction policies',
      'Use WeakHashMap if keys can be garbage collected',
      'Consider LinkedHashMap with access order for LRU caches',
      'Clear maps when no longer needed',
      'Review static field usage'
    ],
    links: [
      { title: 'HashMap Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashMap.html' },
      { title: 'HashMap Memory Issues', url: 'https://www.baeldung.com/java-memory-leaks#4-hashmap-memory-leak' }
    ]
  },

  'java.util.ArrayList': {
    description: 'Resizable array implementation of List interface. Provides fast random access.',
    commonIssues: [
      'Growing unbounded without size constraints',
      'Retaining references to removed elements',
      'Large capacity with few elements (wasted space)',
      'Accumulated in static collections'
    ],
    resolutions: [
      'Implement size limits and periodic cleanup',
      'Call trimToSize() after bulk removals',
      'Clear lists when finished processing',
      'Consider using ArrayList with initial capacity to avoid resizing'
    ],
    links: [
      { title: 'ArrayList Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/ArrayList.html' },
      { title: 'Collection Memory Best Practices', url: 'https://www.baeldung.com/java-collections-memory-efficiency' }
    ]
  },

  'java.util.HashSet': {
    description: 'Set implementation backed by a HashMap. Permits null element.',
    commonIssues: [
      'Growing unbounded in caches or registries',
      'Elements not removed after processing',
      'Retained in static fields or singleton objects'
    ],
    resolutions: [
      'Use WeakHashSet pattern if applicable',
      'Implement maximum size limits',
      'Clear sets after batch processing',
      'Review lifecycle of containing objects'
    ],
    links: [
      { title: 'HashSet Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashSet.html' }
    ]
  },

  'java.lang.Thread': {
    description: 'Represents a thread of execution in a program.',
    commonIssues: [
      'Threads not properly shut down on application stop',
      'Thread pools not terminated correctly',
      'Daemon threads preventing JVM shutdown',
      'Threads holding references to large objects'
    ],
    resolutions: [
      'Always shut down thread pools using shutdown() or shutdownNow()',
      'Use ExecutorService instead of raw Thread objects',
      'Implement proper cleanup in thread lifecycle',
      'Review thread local variables for cleanup'
    ],
    links: [
      { title: 'Thread Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Thread.html' },
      { title: 'Thread Memory Leaks', url: 'https://www.baeldung.com/java-memory-leaks#5-thread-local-memory-leak' }
    ]
  },

  'java.lang.ThreadLocal': {
    description: 'Provides thread-local variables. Each thread has its own copy.',
    commonIssues: [
      'Values not removed after use, especially in thread pools',
      'Large objects stored in thread locals',
      'Thread locals in long-running threads accumulating data',
      'ClassLoader leaks via thread local references'
    ],
    resolutions: [
      'Always call ThreadLocal.remove() when done',
      'Use try-finally to ensure cleanup',
      'Consider using scope-bound thread locals',
      'Audit thread pool configurations'
    ],
    links: [
      { title: 'ThreadLocal Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/ThreadLocal.html' },
      { title: 'ThreadLocal Memory Leak Prevention', url: 'https://www.baeldung.com/java-memory-leaks#5-thread-local-memory-leak' }
    ]
  },

  'char[]': {
    description: 'Character array, often used as backing storage for Strings.',
    commonIssues: [
      'Many char arrays indicate high String usage',
      'Substring leaks (pre-Java 7) holding large arrays',
      'Accumulated from text processing operations'
    ],
    resolutions: [
      'Review String handling and retention',
      'Check for unnecessary string copies',
      'Optimize text processing algorithms',
      'Consider using StringBuilder for mutable strings'
    ],
    links: [
      { title: 'String Internals', url: 'https://www.baeldung.com/java-string-pool' }
    ]
  },

  'byte[]': {
    description: 'Byte array, commonly used for buffers, I/O operations, and binary data.',
    commonIssues: [
      'Large buffers retained after I/O operations',
      'Buffered data not being flushed or cleared',
      'Memory-mapped file buffers',
      'Network or file reading buffers accumulating'
    ],
    resolutions: [
      'Implement buffer pooling and reuse',
      'Set reasonable buffer size limits',
      'Clear buffers after processing',
      'Review I/O framework configurations'
    ],
    links: [
      { title: 'Efficient I/O in Java', url: 'https://www.baeldung.com/java-io-buffered-streams' }
    ]
  }
};

/**
 * Pattern-based class information
 * Used when exact class name doesn't match
 */
const CLASS_PATTERNS = {
  '.*ClassLoader$': {
    description: 'Loads classes into the JVM. Each classloader forms its own namespace.',
    commonIssues: [
      'ClassLoader leak preventing class unloading',
      'Applications not properly stopped in containers',
      'Static references to application classes',
      'Thread context classloader not reset'
    ],
    resolutions: [
      'Ensure web applications are properly stopped',
      'Clear static fields on unload',
      'Reset thread context classloaders',
      'Use memory leak detection tools for classloader issues',
      'Review application server configuration'
    ],
    links: [
      { title: 'ClassLoader Documentation', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/ClassLoader.html' },
      { title: 'ClassLoader Memory Leaks', url: 'https://www.baeldung.com/java-memory-leaks#6-classloader-leak' }
    ]
  },

  '.*Listener$': {
    description: 'Event listener interface implementation. Listens for and handles events.',
    commonIssues: [
      'Listeners registered but never removed',
      'Accumulation of listener objects',
      'Listeners holding references to large objects',
      'GUI component listeners preventing GC'
    ],
    resolutions: [
      'Always remove listeners when no longer needed',
      'Use weak listeners where appropriate',
      'Implement proper cleanup in component lifecycle',
      'Use try-finally for listener registration/removal'
    ],
    links: [
      { title: 'Event Listener Pattern', url: 'https://www.baeldung.com/java-observer-pattern' }
    ]
  },

  '.*Cache.*': {
    description: 'Caching implementation for performance optimization.',
    commonIssues: [
      'Cache growing without eviction policy',
      'No maximum size limit configured',
      'Cached items never expire',
      'Multiple caches duplicating data'
    ],
    resolutions: [
      'Implement LRU or size-based eviction',
      'Set maximum cache size',
      'Configure TTL for cache entries',
      'Use dedicated caching libraries (Guava, Caffeine)',
      'Monitor cache hit rates and sizes'
    ],
    links: [
      { title: 'Guava Cache', url: 'https://github.com/google/guava/wiki/CachesExplained' },
      { title: 'Caffeine Cache', url: 'https://github.com/ben-manes/caffeine' }
    ]
  },

  '.*\\.concurrent\\..*': {
    description: 'Java concurrent utilities for thread-safe operations.',
    commonIssues: [
      'Thread pools not shut down properly',
      'Queues growing unbounded',
      'Tasks accumulating in executor queues',
      'Lock objects preventing GC'
    ],
    resolutions: [
      'Always shut down executors with shutdown()',
      'Use bounded queues for thread pools',
      'Set appropriate queue sizes',
      'Implement timeouts for blocking operations',
      'Monitor queue depths'
    ],
    links: [
      { title: 'Java Concurrency', url: 'https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/package-summary.html' },
      { title: 'ExecutorService Best Practices', url: 'https://www.baeldung.com/java-executor-service-tutorial' }
    ]
  },

  '.*Connection.*|.*Statement.*|.*ResultSet.*': {
    description: 'JDBC database connection, statement, or result set object.',
    commonIssues: [
      'Connections not closed properly',
      'Connection pool exhaustion',
      'ResultSets not closed causing cursor leaks',
      'Large ResultSets held in memory'
    ],
    resolutions: [
      'Always close JDBC resources in finally blocks',
      'Use try-with-resources for automatic cleanup',
      'Configure connection pool timeouts',
      'Use streaming for large result sets',
      'Monitor connection pool metrics'
    ],
    links: [
      { title: 'JDBC Best Practices', url: 'https://www.baeldung.com/jdbc-connection-pooling' }
    ]
  },

  '.*Logger.*|.*Appender.*': {
    description: 'Logging framework component for application logging.',
    commonIssues: [
      'Log buffers accumulating messages',
      'Async appenders with large queues',
      'Retained log event objects',
      'MDC/NDC contexts not cleared'
    ],
    resolutions: [
      'Configure appropriate log buffer sizes',
      'Clear MDC/NDC contexts in finally blocks',
      'Review async appender configurations',
      'Set log levels appropriately',
      'Use appropriate log rotation policies'
    ],
    links: [
      { title: 'Logback Configuration', url: 'https://logback.qos.ch/manual/configuration.html' },
      { title: 'Log4j2 Performance', url: 'https://logging.apache.org/log4j/2.x/performance.html' }
    ]
  }
};

export default getClassInfo;
