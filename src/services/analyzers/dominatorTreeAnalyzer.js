/**
 * Dominator Tree Analyzer
 * 
 * Calculates the dominator tree and retained heap sizes.
 * 
 * A dominator tree shows which objects are keeping other objects alive.
 * The retained size of an object is the total memory that would be freed
 * if that object were garbage collected.
 * 
 * This is a simplified implementation that provides useful insights without
 * full graph traversal (which can be memory-intensive for large heaps).
 */

/**
 * Calculate retained heap by class
 * This is a simplified calculation that aggregates instance sizes by class
 * @param {Object} heapData - Parsed heap dump data
 * @returns {Array} Array of dominator tree entries
 */
export function calculateDominatorTree(heapData) {
  const { classes, instances, roots } = heapData;
  
  // Build a map of which objects are reachable from roots
  const reachableObjects = new Set();
  const rootObjects = new Set(roots.map(r => r.objectId));
  
  // Mark all instances as potentially reachable
  // In a full implementation, we'd do proper reachability analysis
  for (const [objectId] of instances) {
    reachableObjects.add(objectId);
  }

  // Calculate retained size by class
  const retainedByClass = new Map();
  
  for (const [classId, classInfo] of classes) {
    const className = classInfo.name;
    let retainedSize = 0;
    let instanceCount = 0;
    
    // Sum up sizes of all instances of this class
    for (const instanceId of classInfo.instances || []) {
      const instance = instances.get(instanceId);
      if (instance && reachableObjects.has(instanceId)) {
        retainedSize += instance.size || 0;
        instanceCount++;
      }
    }
    
    if (instanceCount > 0) {
      retainedByClass.set(className, {
        className,
        classId,
        retainedSize,
        instanceCount,
        averageSize: instanceCount > 0 ? retainedSize / instanceCount : 0
      });
    }
  }

  // Convert to array and sort by retained size
  const result = Array.from(retainedByClass.values());
  result.sort((a, b) => b.retainedSize - a.retainedSize);
  
  return result;
}

/**
 * Calculate retention percentage
 * @param {number} retainedSize - Retained size for this class
 * @param {number} totalHeapSize - Total heap size
 * @returns {number} Percentage of total heap
 */
export function calculateRetentionPercentage(retainedSize, totalHeapSize) {
  if (totalHeapSize === 0) return 0;
  return (retainedSize / totalHeapSize) * 100;
}

/**
 * Get total heap size from heap data
 * @param {Object} heapData - Parsed heap dump data
 * @returns {number} Total heap size in bytes
 */
export function getTotalHeapSize(heapData) {
  const { instances } = heapData;
  let total = 0;
  
  for (const [, instance] of instances) {
    total += instance.size || 0;
  }
  
  return total;
}

export default calculateDominatorTree;
