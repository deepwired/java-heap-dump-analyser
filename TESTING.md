# Testing Guide

This guide helps you create test heap dumps to verify the Java Heap Dump Analyser.

## Creating a Simple Test Heap Dump

### Option 1: Using a Simple Java Program

Create a file named `TestMemoryLeak.java`:

```java
import java.util.*;

public class TestMemoryLeak {
    private static List<String> leak = new ArrayList<>();
    private static Map<String, byte[]> cache = new HashMap<>();
    
    public static void main(String[] args) throws Exception {
        System.out.println("Creating memory pressure...");
        
        // Simulate string leak
        for (int i = 0; i < 100000; i++) {
            leak.add("Leaked string number " + i);
        }
        
        // Simulate collection leak
        for (int i = 0; i < 1000; i++) {
            cache.put("key" + i, new byte[1024]); // 1KB each
        }
        
        System.out.println("Memory allocated. Press Enter to dump heap...");
        System.in.read();
        
        // Keep references alive
        System.out.println("Total leaked strings: " + leak.size());
        System.out.println("Cache size: " + cache.size());
    }
}
```

### Compile and Run

```bash
# Compile
javac TestMemoryLeak.java

# Run with heap dump on demand
java TestMemoryLeak

# In another terminal, find the process ID
jps

# Create heap dump
jmap -dump:format=b,file=test-leak.hprof <PID>
```

### Option 2: Using JVM Options

Run with automatic heap dump:

```bash
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./oom.hprof -Xmx64m TestMemoryLeak
```

## Expected Results

When you analyze the test heap dump, you should see:

### Histogram Tab
- `java.lang.String` - ~100,000 instances
- `char[]` - High memory usage from strings
- `java.util.HashMap$Node[]` - From the cache
- `byte[]` - ~1000 instances from cache values

### Leak Suspects Tab
- **High Severity**: Retained Strings pattern detected
- **High Severity**: Uncollected Collections detected
- Recommendations about string accumulation and collection growth

### Dominator Tree Tab
- `java.lang.String` should show high retained size
- `byte[]` arrays should be visible
- `HashMap` internal structures

## Creating Different Leak Patterns

### Classloader Leak Simulation

```java
import java.net.*;

public class ClassloaderLeak {
    public static void main(String[] args) throws Exception {
        for (int i = 0; i < 100; i++) {
            URLClassLoader loader = new URLClassLoader(new URL[]{new URL("file:///tmp/")});
            loader.loadClass("java.lang.String");
            // Intentionally not closing loader
        }
        System.in.read();
    }
}
```

### Thread Leak Simulation

```java
public class ThreadLeak {
    public static void main(String[] args) throws Exception {
        for (int i = 0; i < 50; i++) {
            final int threadNum = i;
            new Thread(() -> {
                try {
                    Thread.sleep(Long.MAX_VALUE);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }, "LeakedThread-" + i).start();
        }
        
        Thread.sleep(5000); // Wait for threads to start
        System.out.println("Press Enter to dump heap...");
        System.in.read();
    }
}
```

## Verifying the Analyser

After loading a heap dump:

1. **Check Histogram**: Should list all classes with instance counts
2. **Check Sorting**: Click column headers to sort
3. **Check Search**: Type class names to filter
4. **Check Dominator Tree**: Should show retained sizes
5. **Check Leak Suspects**: Should detect patterns based on your test program

## Common Issues

### "Failed to parse heap dump" Error
- Ensure the file is a valid .hprof file
- Check that the file isn't corrupted
- Try with a smaller heap dump first

### Browser Crashes
- Very large heap dumps (>1GB) may cause browser issues
- Try with a smaller heap first
- Increase browser memory limits if possible

### No Leak Suspects Found
- This is normal for clean applications
- Try the test programs above to create obvious leaks

## Real-World Testing

For real-world testing, generate heap dumps from your actual applications:

```bash
# During normal operation
jmap -dump:live,format=b,file=app-heap.hprof <PID>

# With GC first
jcmd <PID> GC.heap_dump app-heap.hprof

# Automatic on OOM
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/path/to/dumps -jar yourapp.jar
```

## Performance Notes

- Small dumps (<100MB): Parses in seconds
- Medium dumps (100MB-500MB): May take 10-30 seconds
- Large dumps (>500MB): May take longer, be patient

The parser is optimized for browser environments but very large dumps may require patience or a desktop tool like Eclipse MAT.
