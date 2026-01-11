/**
 * Leak Suspects Analyzer
 * 
 * Detects potential memory leaks by identifying:
 * - Classes with unusually high retained sizes
 * - Common leak patterns (collections, strings, listeners, classloaders)
 * - Classes with abnormally high instance counts
 * 
 * This analyzer is particularly tuned for observability pipeline workloads.
 */

import { getTotalHeapSize } from './dominatorTreeAnalyzer.js';

// Threshold: classes using more than this % of heap are suspicious
const HIGH_RETENTION_THRESHOLD = 0.1; // 10%

// Threshold: classes with more than this many instances are suspicious
const HIGH_INSTANCE_COUNT_THRESHOLD = 10000;

// Common leak pattern signatures
const LEAK_PATTERNS = {
  STRING: {
    pattern: /java\.lang\.String|char\[\]/i,
    name: 'Retained Strings',
    description: 'Large number of String objects or char arrays. Common in batch processing and logging.',
    severity: 'high'
  },
  COLLECTION: {
    pattern: /java\.util\.(HashMap|ArrayList|HashSet|LinkedList|TreeMap|TreeSet|Vector|Hashtable)/i,
    name: 'Uncollected Collections',
    description: 'Collections that may be growing unbounded. Check for missing cleanup logic.',
    severity: 'high'
  },
  BYTE_ARRAY: {
    pattern: /byte\[\]/i,
    name: 'Byte Arrays',
    description: 'Large byte arrays, possibly from buffering or caching.',
    severity: 'medium'
  },
  CLASSLOADER: {
    pattern: /ClassLoader$/i,
    name: 'Classloader Leak',
    description: 'Retained classloaders prevent entire class graphs from being unloaded.',
    severity: 'critical'
  },
  THREAD: {
    pattern: /java\.lang\.Thread/i,
    name: 'Thread Leak',
    description: 'Threads that were not properly shut down.',
    severity: 'high'
  },
  LISTENER: {
    pattern: /Listener$/i,
    name: 'Listener Leak',
    description: 'Event listeners that were registered but never removed.',
    severity: 'medium'
  },
  REFERENCE: {
    pattern: /Reference$/i,
    name: 'Reference Objects',
    description: 'Soft/Weak/Phantom references accumulating in queues.',
    severity: 'low'
  }
};

/**
 * Detect memory leak suspects
 * @param {Object} heapData - Parsed heap dump data
 * @param {Array} histogram - Histogram data from histogramAnalyzer
 * @returns {Array} Array of leak suspects with details
 */
export function detectLeakSuspects(heapData, histogram) {
  const suspects = [];
  const totalHeapSize = getTotalHeapSize(heapData);

  // Check histogram for high instance counts
  for (const entry of histogram) {
    const reasons = [];
    const patterns = [];
    
    // Check for high retention
    const retentionPct = (entry.totalSize / totalHeapSize) * 100;
    if (retentionPct > HIGH_RETENTION_THRESHOLD * 100) {
      reasons.push(`Uses ${retentionPct.toFixed(2)}% of total heap`);
    }
    
    // Check for high instance count
    if (entry.instanceCount > HIGH_INSTANCE_COUNT_THRESHOLD) {
      reasons.push(`${entry.instanceCount.toLocaleString()} instances`);
    }
    
    // Check for leak patterns
    for (const pattern of Object.values(LEAK_PATTERNS)) {
      if (pattern.pattern.test(entry.className)) {
        patterns.push({
          name: pattern.name,
          description: pattern.description,
          severity: pattern.severity
        });
      }
    }
    
    // If we found any reasons or patterns, add as suspect
    if (reasons.length > 0 || patterns.length > 0) {
      suspects.push({
        className: entry.className,
        instanceCount: entry.instanceCount,
        totalSize: entry.totalSize,
        retentionPercentage: retentionPct,
        reasons,
        patterns,
        severity: getSeverity(patterns, retentionPct, entry.instanceCount)
      });
    }
  }

  // Sort by severity and then by size
  suspects.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.totalSize - a.totalSize;
  });

  return suspects;
}

/**
 * Determine overall severity for a suspect
 * @param {Array} patterns - Matched patterns
 * @param {number} retentionPct - Retention percentage
 * @param {number} instanceCount - Instance count
 * @returns {string} Severity level
 */
function getSeverity(patterns, retentionPct, instanceCount) {
  // Check pattern severity
  for (const pattern of patterns) {
    if (pattern.severity === 'critical') return 'critical';
  }
  
  // High retention or instance count
  if (retentionPct > 25 || instanceCount > 100000) return 'high';
  
  // Check for high severity patterns
  for (const pattern of patterns) {
    if (pattern.severity === 'high') return 'high';
  }
  
  // Medium retention or instance count
  if (retentionPct > 10 || instanceCount > 50000) return 'medium';
  
  return 'low';
}

/**
 * Generate leak insights summary
 * @param {Array} suspects - Array of leak suspects
 * @returns {Object} Summary with insights and recommendations
 */
export function generateLeakInsights(suspects) {
  const insights = {
    totalSuspects: suspects.length,
    critical: suspects.filter(s => s.severity === 'critical').length,
    high: suspects.filter(s => s.severity === 'high').length,
    medium: suspects.filter(s => s.severity === 'medium').length,
    low: suspects.filter(s => s.severity === 'low').length,
    topPatterns: {},
    recommendations: []
  };

  // Count pattern occurrences
  for (const suspect of suspects) {
    for (const pattern of suspect.patterns) {
      if (!insights.topPatterns[pattern.name]) {
        insights.topPatterns[pattern.name] = {
          count: 0,
          description: pattern.description,
          severity: pattern.severity
        };
      }
      insights.topPatterns[pattern.name].count++;
    }
  }

  // Generate recommendations
  if (insights.critical > 0) {
    insights.recommendations.push(
      'Critical: Classloader leaks detected. Review application lifecycle and ensure proper cleanup.'
    );
  }
  
  if (insights.topPatterns['Retained Strings']?.count > 0) {
    insights.recommendations.push(
      'High string retention detected. Review batch processing and ensure strings are not accumulated unnecessarily.'
    );
  }
  
  if (insights.topPatterns['Uncollected Collections']?.count > 0) {
    insights.recommendations.push(
      'Growing collections detected. Implement size limits and periodic cleanup for caches and buffers.'
    );
  }
  
  if (insights.topPatterns['Listener Leak']?.count > 0) {
    insights.recommendations.push(
      'Event listener accumulation detected. Ensure listeners are properly unregistered.'
    );
  }

  return insights;
}

export default detectLeakSuspects;
