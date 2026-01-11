/**
 * Histogram Analyzer
 * 
 * Generates a histogram of heap objects grouped by class.
 * Shows instance count and total memory usage per class.
 */

/**
 * Generate histogram from parsed heap data
 * @param {Object} heapData - Parsed heap dump data
 * @returns {Array} Array of histogram entries sorted by total size
 */
export function generateHistogram(heapData) {
  const { classes, instances } = heapData;
  const histogram = new Map();

  // Iterate through all instances
  for (const [objectId, instance] of instances) {
    const classId = instance.classObjectId;
    const classInfo = classes.get(classId);
    const className = classInfo?.name || `Unknown#${classId}`;

    if (!histogram.has(className)) {
      histogram.set(className, {
        className,
        classId,
        instanceCount: 0,
        totalSize: 0,
        instances: []
      });
    }

    const entry = histogram.get(className);
    entry.instanceCount++;
    entry.totalSize += instance.size || 0;
    entry.instances.push(objectId);
  }

  // Convert to array and sort by total size
  const result = Array.from(histogram.values());
  result.sort((a, b) => b.totalSize - a.totalSize);

  return result;
}

/**
 * Format byte size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * Format number with thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default generateHistogram;
