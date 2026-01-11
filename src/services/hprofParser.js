/**
 * HPROF Binary Heap Dump Parser
 * 
 * This parser reads Java .hprof heap dump files in the browser.
 * It supports HPROF format version 1.0.3 (Java 11+).
 * 
 * HPROF Format Overview:
 * - Header: format name, version, identifier size, timestamp
 * - Records: tagged data blocks containing heap information
 * 
 * Common Record Types:
 * - STRING: UTF-8 strings
 * - LOAD_CLASS: class definitions
 * - HEAP_DUMP/HEAP_DUMP_SEGMENT: heap snapshot data
 * - STACK_FRAME/STACK_TRACE: stack information
 * 
 * All parsing happens client-side - no data leaves the browser.
 */

// HPROF record tags
const TAGS = {
  STRING: 0x01,
  LOAD_CLASS: 0x02,
  UNLOAD_CLASS: 0x03,
  STACK_FRAME: 0x04,
  STACK_TRACE: 0x05,
  ALLOC_SITES: 0x06,
  HEAP_SUMMARY: 0x07,
  START_THREAD: 0x0a,
  END_THREAD: 0x0b,
  HEAP_DUMP: 0x0c,
  HEAP_DUMP_SEGMENT: 0x1c,
  HEAP_DUMP_END: 0x2c,
  CPU_SAMPLES: 0x0d,
  CONTROL_SETTINGS: 0x0e
};

// Heap dump sub-record tags
const SUB_TAGS = {
  ROOT_UNKNOWN: 0xff,
  ROOT_JNI_GLOBAL: 0x01,
  ROOT_JNI_LOCAL: 0x02,
  ROOT_JAVA_FRAME: 0x03,
  ROOT_NATIVE_STACK: 0x04,
  ROOT_STICKY_CLASS: 0x05,
  ROOT_THREAD_BLOCK: 0x06,
  ROOT_MONITOR_USED: 0x07,
  ROOT_THREAD_OBJ: 0x08,
  CLASS_DUMP: 0x20,
  INSTANCE_DUMP: 0x21,
  OBJECT_ARRAY_DUMP: 0x22,
  PRIMITIVE_ARRAY_DUMP: 0x23
};

// Basic type sizes
const BASIC_TYPES = {
  2: 1, // object
  4: 1, // boolean
  5: 2, // char
  6: 4, // float
  7: 8, // double
  8: 1, // byte
  9: 2, // short
  10: 4, // int
  11: 8  // long
};

/**
 * Main parser class for HPROF files
 */
export class HprofParser {
  constructor() {
    this.strings = new Map();
    this.classes = new Map();
    this.instances = new Map();
    this.roots = [];
    this.identifierSize = 0;
    this.position = 0;
    this.data = null;
  }

  /**
   * Parse a heap dump file from an ArrayBuffer
   * @param {ArrayBuffer} buffer - The heap dump file contents
   * @returns {Object} Parsed heap data
   */
  async parse(buffer) {
    this.data = new DataView(buffer);
    this.position = 0;

    try {
      // Parse header
      this.parseHeader();
      
      // Parse records
      while (this.position < this.data.byteLength) {
        this.parseRecord();
      }

      return {
        strings: this.strings,
        classes: this.classes,
        instances: this.instances,
        roots: this.roots,
        identifierSize: this.identifierSize
      };
    } catch (error) {
      console.error('Error parsing heap dump:', error);
      throw new Error(`Failed to parse heap dump: ${error.message}`);
    }
  }

  /**
   * Parse HPROF header
   */
  parseHeader() {
    // Read format name (null-terminated string)
    const formatBytes = [];
    while (true) {
      const byte = this.data.getUint8(this.position++);
      if (byte === 0) break;
      formatBytes.push(byte);
    }
    const format = String.fromCharCode(...formatBytes);
    
    if (!format.startsWith('JAVA PROFILE 1.0')) {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Read identifier size (4 bytes)
    this.identifierSize = this.data.getUint32(this.position);
    this.position += 4;

    // Read timestamp (8 bytes, high word first)
    const highWord = this.data.getUint32(this.position);
    const lowWord = this.data.getUint32(this.position + 4);
    this.timestamp = (highWord * 0x100000000) + lowWord;
    this.position += 8;
  }

  /**
   * Parse a single record
   */
  parseRecord() {
    if (this.position >= this.data.byteLength) return;

    const tag = this.data.getUint8(this.position++);
    
    // Read timestamp (4 bytes, microseconds)
    this.position += 4;

    // Read record length (4 bytes)
    const length = this.data.getUint32(this.position);
    this.position += 4;

    const endPosition = this.position + length;

    try {
      switch (tag) {
        case TAGS.STRING:
          this.parseString(endPosition);
          break;
        case TAGS.LOAD_CLASS:
          this.parseLoadClass(endPosition);
          break;
        case TAGS.HEAP_DUMP:
        case TAGS.HEAP_DUMP_SEGMENT:
          this.parseHeapDump(endPosition);
          break;
        default:
          // Skip unknown records
          this.position = endPosition;
      }
    } catch (error) {
      console.warn(`Error parsing record type ${tag}:`, error);
      this.position = endPosition;
    }

    // Ensure we're at the right position
    this.position = endPosition;
  }

  /**
   * Parse STRING record
   */
  parseString(endPosition) {
    const id = this.readId();
    const bytes = [];
    while (this.position < endPosition) {
      bytes.push(this.data.getUint8(this.position++));
    }
    const str = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    this.strings.set(id, str);
  }

  /**
   * Parse LOAD_CLASS record
   */
  parseLoadClass() {
    const serialNum = this.data.getUint32(this.position);
    this.position += 4;
    const classObjectId = this.readId();
    const stackTraceSerial = this.data.getUint32(this.position);
    this.position += 4;
    const classNameId = this.readId();

    this.classes.set(classObjectId, {
      serialNum,
      classObjectId,
      stackTraceSerial,
      classNameId,
      name: this.strings.get(classNameId) || `Class#${classNameId}`,
      instances: [],
      staticFields: {},
      instanceFields: []
    });
  }

  /**
   * Parse HEAP_DUMP or HEAP_DUMP_SEGMENT record
   */
  parseHeapDump(endPosition) {
    while (this.position < endPosition) {
      const subTag = this.data.getUint8(this.position++);
      
      try {
        switch (subTag) {
          case SUB_TAGS.ROOT_UNKNOWN:
          case SUB_TAGS.ROOT_STICKY_CLASS:
          case SUB_TAGS.ROOT_MONITOR_USED:
          case SUB_TAGS.ROOT_THREAD_OBJ:
            this.parseRoot(subTag);
            break;
          case SUB_TAGS.ROOT_JNI_GLOBAL:
            this.parseRootJniGlobal();
            break;
          case SUB_TAGS.ROOT_JNI_LOCAL:
          case SUB_TAGS.ROOT_JAVA_FRAME:
          case SUB_TAGS.ROOT_NATIVE_STACK:
          case SUB_TAGS.ROOT_THREAD_BLOCK:
            this.parseRootWithThread(subTag);
            break;
          case SUB_TAGS.CLASS_DUMP:
            this.parseClassDump();
            break;
          case SUB_TAGS.INSTANCE_DUMP:
            this.parseInstanceDump();
            break;
          case SUB_TAGS.OBJECT_ARRAY_DUMP:
            this.parseObjectArrayDump();
            break;
          case SUB_TAGS.PRIMITIVE_ARRAY_DUMP:
            this.parsePrimitiveArrayDump();
            break;
          default:
            throw new Error(`Unknown sub-tag: 0x${subTag.toString(16)}`);
        }
      } catch (error) {
        console.warn(`Error parsing heap dump sub-record 0x${subTag.toString(16)}:`, error);
        // Try to continue - this is risky but might allow partial parsing
        break;
      }
    }
  }

  /**
   * Parse simple GC root
   */
  parseRoot(subTag) {
    const objectId = this.readId();
    this.roots.push({ type: subTag, objectId });
  }

  /**
   * Parse JNI global root
   */
  parseRootJniGlobal() {
    const objectId = this.readId();
    const jniGlobalRefId = this.readId();
    this.roots.push({ type: SUB_TAGS.ROOT_JNI_GLOBAL, objectId, jniGlobalRefId });
  }

  /**
   * Parse root with thread information
   */
  parseRootWithThread(subTag) {
    const objectId = this.readId();
    const threadSerial = this.data.getUint32(this.position);
    this.position += 4;
    const frameNum = this.data.getUint32(this.position);
    this.position += 4;
    this.roots.push({ type: subTag, objectId, threadSerial, frameNum });
  }

  /**
   * Parse CLASS_DUMP sub-record
   */
  parseClassDump() {
    const classObjectId = this.readId();
    const stackTraceSerial = this.data.getUint32(this.position);
    this.position += 4;
    const superClassObjectId = this.readId();
    const classLoaderObjectId = this.readId();
    this.readId(); // signersObjectId
    this.readId(); // protectionDomainObjectId
    this.readId(); // reserved
    this.readId(); // reserved
    const instanceSize = this.data.getUint32(this.position);
    this.position += 4;

    // Constant pool size
    const constantPoolSize = this.data.getUint16(this.position);
    this.position += 2;

    // Skip constant pool entries
    for (let i = 0; i < constantPoolSize; i++) {
      this.position += 2; // index
      this.position += 1; // type
      this.skipValue();
    }

    // Static fields
    const numStaticFields = this.data.getUint16(this.position);
    this.position += 2;
    const staticFields = {};
    
    for (let i = 0; i < numStaticFields; i++) {
      const nameId = this.readId();
      const type = this.data.getUint8(this.position++);
      const value = this.readValue(type);
      staticFields[nameId] = { type, value };
    }

    // Instance fields
    const numInstanceFields = this.data.getUint16(this.position);
    this.position += 2;
    const instanceFields = [];
    
    for (let i = 0; i < numInstanceFields; i++) {
      const nameId = this.readId();
      const type = this.data.getUint8(this.position++);
      instanceFields.push({ nameId, type });
    }

    // Update or create class info
    let classInfo = this.classes.get(classObjectId);
    if (!classInfo) {
      classInfo = {
        classObjectId,
        name: `Class#${classObjectId}`,
        instances: []
      };
      this.classes.set(classObjectId, classInfo);
    }

    Object.assign(classInfo, {
      stackTraceSerial,
      superClassObjectId,
      classLoaderObjectId,
      instanceSize,
      staticFields,
      instanceFields
    });
  }

  /**
   * Parse INSTANCE_DUMP sub-record
   */
  parseInstanceDump() {
    const objectId = this.readId();
    const stackTraceSerial = this.data.getUint32(this.position);
    this.position += 4;
    const classObjectId = this.readId();
    const numBytes = this.data.getUint32(this.position);
    this.position += 4;

    // Store instance data (we'll skip reading the actual bytes for now)
    const instanceData = new Uint8Array(this.data.buffer, this.position, numBytes);
    this.position += numBytes;

    const instance = {
      objectId,
      classObjectId,
      stackTraceSerial,
      size: numBytes,
      data: instanceData
    };

    this.instances.set(objectId, instance);

    // Add to class instances list
    const classInfo = this.classes.get(classObjectId);
    if (classInfo) {
      classInfo.instances.push(objectId);
    }
  }

  /**
   * Parse OBJECT_ARRAY_DUMP sub-record
   */
  parseObjectArrayDump() {
    const arrayObjectId = this.readId();
    const stackTraceSerial = this.data.getUint32(this.position);
    this.position += 4;
    const numElements = this.data.getUint32(this.position);
    this.position += 4;
    const arrayClassObjectId = this.readId();

    const elements = [];
    for (let i = 0; i < numElements; i++) {
      elements.push(this.readId());
    }

    this.instances.set(arrayObjectId, {
      objectId: arrayObjectId,
      classObjectId: arrayClassObjectId,
      stackTraceSerial,
      type: 'objectArray',
      size: numElements * this.identifierSize,
      elements
    });
  }

  /**
   * Parse PRIMITIVE_ARRAY_DUMP sub-record
   */
  parsePrimitiveArrayDump() {
    const arrayObjectId = this.readId();
    const stackTraceSerial = this.data.getUint32(this.position);
    this.position += 4;
    const numElements = this.data.getUint32(this.position);
    this.position += 4;
    const elementType = this.data.getUint8(this.position++);

    const elementSize = BASIC_TYPES[elementType] || 1;
    const totalSize = numElements * elementSize;

    // Skip the actual data
    this.position += totalSize;

    this.instances.set(arrayObjectId, {
      objectId: arrayObjectId,
      stackTraceSerial,
      type: 'primitiveArray',
      elementType,
      size: totalSize,
      length: numElements
    });
  }

  /**
   * Read an ID (object reference) based on identifier size
   */
  readId() {
    if (this.identifierSize === 4) {
      const id = this.data.getUint32(this.position);
      this.position += 4;
      return id;
    } else if (this.identifierSize === 8) {
      // Read 8-byte ID as two 4-byte values
      const high = this.data.getUint32(this.position);
      const low = this.data.getUint32(this.position + 4);
      this.position += 8;
      // For JavaScript number safety, we combine them but may lose precision for very large IDs
      return high * 0x100000000 + low;
    }
    throw new Error(`Unsupported identifier size: ${this.identifierSize}`);
  }

  /**
   * Read a typed value
   */
  readValue(type) {
    switch (type) {
      case 2: { // object
        return this.readId();
      }
      case 4: { // boolean
        return this.data.getUint8(this.position++) !== 0;
      }
      case 5: { // char
        const charVal = this.data.getUint16(this.position);
        this.position += 2;
        return charVal;
      }
      case 6: { // float
        const floatVal = this.data.getFloat32(this.position);
        this.position += 4;
        return floatVal;
      }
      case 7: { // double
        const doubleVal = this.data.getFloat64(this.position);
        this.position += 8;
        return doubleVal;
      }
      case 8: { // byte
        return this.data.getInt8(this.position++);
      }
      case 9: { // short
        const shortVal = this.data.getInt16(this.position);
        this.position += 2;
        return shortVal;
      }
      case 10: { // int
        const intVal = this.data.getInt32(this.position);
        this.position += 4;
        return intVal;
      }
      case 11: { // long
        const highWord = this.data.getInt32(this.position);
        const lowWord = this.data.getUint32(this.position + 4);
        this.position += 8;
        return highWord * 0x100000000 + lowWord;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  /**
   * Skip a typed value without reading it
   */
  skipValue() {
    const type = this.data.getUint8(this.position++);
    const size = BASIC_TYPES[type] || this.identifierSize;
    this.position += size;
  }
}

export default HprofParser;
