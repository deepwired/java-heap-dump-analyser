/**
 * Reference Chain Analyzer
 * 
 * Traces reference chains from GC roots to objects.
 * Helps understand why objects are being retained in memory.
 */

/**
 * Find reference chains to an object
 * This is a simplified implementation that shows direct references
 * @param {Object} heapData - Parsed heap dump data
 * @param {number} targetObjectId - Object ID to find chains for
 * @param {number} maxDepth - Maximum chain depth to search
 * @returns {Array} Array of reference chains
 */
export function findReferenceChains(heapData, targetObjectId, maxDepth = 5) {
  const { roots } = heapData;
  const chains = [];
  
  // Build reverse reference map (who references what)
  const reverseRefs = buildReverseReferenceMap(heapData);
  
  // BFS from target to roots
  const queue = [[targetObjectId]];
  const visited = new Set();
  
  while (queue.length > 0 && chains.length < 10) {
    const chain = queue.shift();
    const currentId = chain[chain.length - 1];
    
    if (visited.has(currentId) || chain.length > maxDepth) {
      continue;
    }
    visited.add(currentId);
    
    // Check if this is a root
    const isRoot = roots.some(r => r.objectId === currentId);
    if (isRoot) {
      chains.push(chain);
      continue;
    }
    
    // Find references to this object
    const referencers = reverseRefs.get(currentId) || [];
    for (const refId of referencers) {
      if (!chain.includes(refId)) {
        queue.push([...chain, refId]);
      }
    }
  }
  
  // Format chains with class names
  return chains.map(chain => formatChain(chain, heapData));
}

/**
 * Build a map of reverse references (object -> objects that reference it)
 * @param {Object} heapData - Parsed heap dump data
 * @returns {Map} Map of objectId -> Set of referencing objectIds
 */
function buildReverseReferenceMap(heapData) {
  const { instances } = heapData;
  const reverseRefs = new Map();
  
  for (const [objectId, instance] of instances) {
    // For object arrays, add references
    if (instance.type === 'objectArray' && instance.elements) {
      for (const elementId of instance.elements) {
        if (elementId && elementId !== 0) {
          if (!reverseRefs.has(elementId)) {
            reverseRefs.set(elementId, new Set());
          }
          reverseRefs.get(elementId).add(objectId);
        }
      }
    }
  }
  
  return reverseRefs;
}

/**
 * Format a reference chain with class names
 * @param {Array} chain - Array of object IDs
 * @param {Object} heapData - Parsed heap dump data
 * @returns {Object} Formatted chain
 */
function formatChain(chain, heapData) {
  const { instances, classes } = heapData;
  
  const formatted = chain.map(objectId => {
    const instance = instances.get(objectId);
    if (!instance) {
      return { objectId, className: 'Unknown' };
    }
    
    const classInfo = classes.get(instance.classObjectId);
    const className = classInfo?.name || 'Unknown';
    
    return {
      objectId,
      className,
      size: instance.size || 0
    };
  });
  
  return {
    chain: formatted,
    depth: chain.length,
    totalSize: formatted.reduce((sum, item) => sum + item.size, 0)
  };
}

/**
 * Get the top objects by size
 * @param {Object} heapData - Parsed heap dump data
 * @param {number} limit - Number of objects to return
 * @returns {Array} Array of top objects
 */
export function getTopObjectsBySize(heapData, limit = 20) {
  const { instances, classes } = heapData;
  const objects = [];
  
  for (const [objectId, instance] of instances) {
    const classInfo = classes.get(instance.classObjectId);
    objects.push({
      objectId,
      className: classInfo?.name || 'Unknown',
      size: instance.size || 0,
      type: instance.type || 'instance'
    });
  }
  
  objects.sort((a, b) => b.size - a.size);
  return objects.slice(0, limit);
}

export default findReferenceChains;
