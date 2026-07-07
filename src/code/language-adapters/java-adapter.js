/**
 * java-adapter.js — Java 语言适配器
 *
 * 提供 Java 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置
 *
 * @module language-adapters/java-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');

// ============================================================================
// Java 代码模板
// ============================================================================

const JAVA_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    return `import java.util.*;
import java.util.stream.Collectors;

/**
 * ${params.description || '排序工具'}
 * 提供列表排序功能
 */
public class SortUtils {

    /**
     * 对整数列表排序
     * @param data 输入数据列表
     * @param ascending 是否升序
     * @return 排序后的新列表
     */
    public static List<Integer> sortData(List<Integer> data, boolean ascending) {
        if (data == null || data.isEmpty()) {
            System.out.println("[sortData] 输入为空，返回空列表");
            return new ArrayList<>();
        }
        List<Integer> sorted = new ArrayList<>(data);
        sorted.sort(ascending ? Comparator.naturalOrder() : Comparator.reverseOrder());
        return sorted;
    }

    /**
     * 对对象列表按字段排序
     * @param data 输入数据列表
     * @param key 排序字段
     * @param ascending 是否升序
     * @return 排序后的新列表
     * @param <T> 对象类型
     */
    public static <T> List<T> sortData(List<T> data, String key, boolean ascending) {
        if (data == null || data.isEmpty()) {
            return new ArrayList<>();
        }
        List<T> sorted = new ArrayList<>(data);
        sorted.sort(Comparator.comparing(
            item -> {
                try {
                    return String.valueOf(item.getClass().getMethod(
                        "get" + Character.toUpperCase(key.charAt(0)) + key.substring(1)
                    ).invoke(item));
                } catch (Exception e) {
                    return String.valueOf(item);
                }
            },
            ascending ? Comparator.naturalOrder() : Comparator.reverseOrder()
        ));
        return sorted;
    }

    // 使用示例
    // List<Integer> result = sortData(Arrays.asList(3, 1, 4, 1, 5, 9));
    // System.out.println(result); // [1, 1, 3, 4, 5, 9]
}
`;
  },

  [INTENT.FILTER]: (params) => {
    return `import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * ${params.description || '过滤工具'}
 * 提供列表过滤功能
 */
public class FilterUtils {

    /**
     * 过滤列表
     * @param data 输入数据列表
     * @param predicate 过滤条件
     * @return 过滤后的列表
     * @param <T> 元素类型
     */
    public static <T> List<T> filterData(List<T> data, Predicate<T> predicate) {
        if (data == null || data.isEmpty()) {
            System.out.println("[filterData] 输入为空");
            return new ArrayList<>();
        }
        if (predicate == null) return new ArrayList<>(data);
        return data.stream().filter(predicate).collect(Collectors.toList());
    }

    // 使用示例
    // List<Integer> result = filterData(Arrays.asList(1, 2, 3, 4, 5), n -> n > 2);
    // System.out.println(result); // [3, 4, 5]
}
`;
  },

  [INTENT.ANALYZE]: (params) => {
    return `import java.util.*;
import java.util.stream.Collectors;

/**
 * ${params.description || '统计分析工具'}
 * 提供数据统计分析功能
 */
public class AnalyzeUtils {

    /**
     * 统计分析
     * @param data 输入数据列表
     * @return 统计结果映射
     */
    public static Map<String, Object> analyzeData(List<? extends Number> data) {
        if (data == null || data.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("count", 0);
            result.put("error", "数据为空");
            return result;
        }

        List<Double> numbers = data.stream()
            .map(Number::doubleValue)
            .collect(Collectors.toList());

        double sum = numbers.stream().mapToDouble(Double::doubleValue).sum();
        double avg = sum / numbers.size();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("count", data.size());
        stats.put("numericCount", numbers.size());
        stats.put("sum", Math.round(sum * 100.0) / 100.0);
        stats.put("avg", Math.round(avg * 100.0) / 100.0);
        stats.put("min", Collections.min(numbers));
        stats.put("max", Collections.max(numbers));

        // 中位数
        List<Double> sorted = new ArrayList<>(numbers);
        Collections.sort(sorted);
        double median;
        int mid = sorted.size() / 2;
        if (sorted.size() % 2 == 0) {
            median = (sorted.get(mid - 1) + sorted.get(mid)) / 2.0;
        } else {
            median = sorted.get(mid);
        }
        stats.put("median", median);

        // 标准差
        double variance = numbers.stream()
            .mapToDouble(n -> Math.pow(n - avg, 2))
            .average().orElse(0.0);
        stats.put("std", Math.round(Math.sqrt(variance) * 100.0) / 100.0);

        // 分布（等宽分桶）
        Map<String, Integer> distribution = new LinkedHashMap<>();
        double min = stats.get("min") instanceof Number ? ((Number) stats.get("min")).doubleValue() : 0;
        double max = stats.get("max") instanceof Number ? ((Number) stats.get("max")).doubleValue() : 0;
        int binCount = Math.min(10, Math.max(3, (int) Math.sqrt(numbers.size())));
        double binWidth = (max - min) / binCount || 1;
        for (int i = 0; i < binCount; i++) {
            double lower = Math.round((min + i * binWidth) * 100.0) / 100.0;
            double upper = Math.round((lower + binWidth) * 100.0) / 100.0;
            String label = lower + "-" + upper;
            int count = (int) numbers.stream()
                .filter(n -> n >= lower && (i == binCount - 1 ? n <= upper : n < upper))
                .count();
            distribution.put(label, count);
        }
        stats.put("distribution", distribution);

        return stats;
    }

    // 使用示例
    // Map<String, Object> stats = analyzeData(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
    // System.out.println(stats);
}
`;
  },

  [INTENT.FETCH]: (params) => {
    return `import java.net.*;
import java.io.*;
import java.util.Map;

/**
 * ${params.description || 'HTTP请求工具'}
 */
public class FetchUtils {

    /**
     * HTTP GET 请求
     * @param urlStr 请求URL
     * @param timeoutMs 超时时间（毫秒）
     * @return 响应数据映射
     */
    public static Map<String, Object> fetchData(String urlStr, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestProperty("Content-Type", "application/json");

            int status = conn.getResponseCode();
            String responseBody = readResponse(conn);

            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("success", status >= 200 && status < 300);
            result.put("status", status);
            result.put("data", responseBody);
            return result;
        } catch (SocketTimeoutException e) {
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("success", false);
            result.put("error", "请求超时");
            result.put("timeout", timeoutMs);
            return result;
        } catch (Exception e) {
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String readResponse(HttpURLConnection conn) throws IOException {
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(conn.getInputStream())
        );
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();
        return response.toString();
    }

    // 使用示例
    // Map<String, Object> result = fetchData("https://api.example.com/data", 10000);
    // System.out.println(result);
}
`;
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return `import java.util.*;

/**
 * ${params.description || 'LRU缓存工具'}
 * 支持TTL过期的LRU缓存
 */
public class DataCache {
    private final Map<String, CacheEntry> store;
    private final int maxSize;
    private final long defaultTTL;
    private int hits = 0;
    private int misses = 0;

    private static class CacheEntry {
        Object value;
        long ttl;
        long timestamp;
        long lastAccess;

        CacheEntry(Object value, long ttl, long timestamp) {
            this.value = value;
            this.ttl = ttl;
            this.timestamp = timestamp;
            this.lastAccess = timestamp;
        }
    }

    public DataCache(int maxSize, long ttlMs) {
        this.store = new LinkedHashMap<>(maxSize, 0.75f, true);
        this.maxSize = maxSize;
        this.defaultTTL = ttlMs;
    }

    public DataCache() {
        this(100, ${ttl});
    }

    public synchronized Object get(String key) {
        CacheEntry entry = store.get(key);
        if (entry == null) { misses++; return null; }
        if (System.currentTimeMillis() - entry.timestamp > entry.ttl) {
            store.remove(key);
            misses++;
            return null;
        }
        hits++;
        entry.lastAccess = System.currentTimeMillis();
        return entry.value;
    }

    public synchronized boolean set(String key, Object value, long ttl) {
        if (store.containsKey(key)) store.remove(key);
        else if (store.size() >= maxSize) {
            Iterator<String> it = store.keySet().iterator();
            if (it.hasNext()) it.next();
            it.remove();
        }
        store.put(key, new CacheEntry(value, ttl > 0 ? ttl : defaultTTL, System.currentTimeMillis()));
        return true;
    }

    public synchronized boolean has(String key) { return get(key) != null; }

    public synchronized void delete(String key) { store.remove(key); }

    public synchronized void clear() { store.clear(); hits = 0; misses = 0; }

    public Map<String, Object> getStats() {
        int total = hits + misses;
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("size", store.size());
        stats.put("maxSize", maxSize);
        stats.put("hits", hits);
        stats.put("misses", misses);
        stats.put("hitRate", total > 0 ? String.format("%.1f%%", hits * 100.0 / total) : "0%");
        stats.put("keys", new ArrayList<>(store.keySet()));
        return stats;
    }

    // 使用示例
    // DataCache cache = new DataCache(50, 30000);
    // cache.set("user:1", new User("Alice"));
    // System.out.println(cache.get("user:1"));
    // System.out.println(cache.getStats());
}
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `import java.util.*;
import java.util.regex.Pattern;

/**
 * ${params.description || '数据验证器'}
 * 基于规则的数据验证引擎
 */
public class Validator {

    /**
     * 验证输入数据
     * @param input 输入数据映射
     * @param rules 验证规则映射
     * @return 验证结果映射
     */
    public static Map<String, Object> validate(Map<String, Object> input, Map<String, Map<String, Object>> rules) {
        if (input == null || input.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("valid", false);
            result.put("errors", Arrays.asList("输入数据无效"));
            return result;
        }
        if (rules == null || rules.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("valid", false);
            result.put("errors", Arrays.asList("验证规则无效"));
            return result;
        }

        List<Map<String, Object>> errors = new ArrayList<>();

        for (Map.Entry<String, Map<String, Object>> entry : rules.entrySet()) {
            String field = entry.getKey();
            Map<String, Object> rule = entry.getValue();
            Object value = input.get(field);

            // 必填检查
            Boolean required = (Boolean) rule.get("required");
            if (required != null && required && (value == null || value.toString().isEmpty())) {
                Map<String, Object> error = new LinkedHashMap<>();
                error.put("field", field);
                error.put("rule", "required");
                error.put("message", String.format("\"%s\" 是必填字段", field));
                errors.add(error);
                continue;
            }

            // 跳过未提供的可选字段
            if (value == null) continue;

            // 类型检查
            String type = (String) rule.get("type");
            if (type != null) {
                boolean typeMatch = false;
                switch (type) {
                    case "string": typeMatch = value instanceof String; break;
                    case "number": typeMatch = value instanceof Number; break;
                    case "array": typeMatch = value instanceof List; break;
                    case "boolean": typeMatch = value instanceof Boolean; break;
                }
                if (!typeMatch) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("field", field);
                    error.put("rule", "type");
                    error.put("message", String.format("\"%s\" 应为 %s 类型", field, type));
                    errors.add(error);
                    continue;
                }
            }

            // 范围检查（数字）
            if (value instanceof Number) {
                double numVal = ((Number) value).doubleValue();
                Object minObj = rule.get("min");
                Object maxObj = rule.get("max");
                if (minObj instanceof Number && numVal < ((Number) minObj).doubleValue()) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("field", field);
                    error.put("rule", "min");
                    error.put("message", String.format("\"%s\" 最小值为 %s", field, minObj));
                    error.put("actual", numVal);
                    errors.add(error);
                }
                if (maxObj instanceof Number && numVal > ((Number) maxObj).doubleValue()) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("field", field);
                    error.put("rule", "max");
                    error.put("message", String.format("\"%s\" 最大值为 %s", field, maxObj));
                    error.put("actual", numVal);
                    errors.add(error);
                }
            }

            // 长度检查（字符串/列表）
            if (value instanceof String || value instanceof List) {
                int len = value instanceof String ? ((String) value).length() : ((List<?>) value).size();
                Object minLenObj = rule.get("minLength");
                Object maxLenObj = rule.get("maxLength");
                if (minLenObj instanceof Number && len < ((Number) minLenObj).intValue()) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("field", field);
                    error.put("rule", "minLength");
                    error.put("message", String.format("\"%s\" 最少 %d 个字符", field, ((Number) minLenObj).intValue()));
                    errors.add(error);
                }
                if (maxLenObj instanceof Number && len > ((Number) maxLenObj).intValue()) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("field", field);
                    error.put("rule", "maxLength");
                    error.put("message", String.format("\"%s\" 最多 %d 个字符", field, ((Number) maxLenObj).intValue()));
                    errors.add(error);
                }
            }

            // 正则检查
            Object patternObj = rule.get("pattern");
            if (patternObj instanceof Pattern && value instanceof String) {
                if (!((Pattern) patternObj).matcher((String) value).matches()) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("field", field);
                    error.put("rule", "pattern");
                    error.put("message", String.format("\"%s\" 格式不正确", field));
                    errors.add(error);
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("valid", errors.isEmpty());
        result.put("errors", errors);
        result.put("errorCount", errors.size());
        result.put("passed", rules.size() - errors.size());
        result.put("total", rules.size());
        return result;
    }

    // 使用示例
    // Map<String, Object> input = new HashMap<>();
    // input.put("name", "Alice");
    // input.put("age", 25);
    // Map<String, Map<String, Object>> rules = new HashMap<>();
    // rules.put("name", Map.of("required", true, "type", "string"));
    // rules.put("age", Map.of("required", true, "type", "number", "min", 0));
    // System.out.println(validate(input, rules));
}
`;
  },

  [INTENT.FILE]: (params) => {
    return `import java.io.*;
import java.nio.file.*;
import java.util.*;

/**
 * ${params.description || '文件操作工具'}
 * 安全的文件读写操作
 */
public class FileManager {
    private final Path baseDir;

    public FileManager(String baseDir) {
        this.baseDir = Paths.get(baseDir).toAbsolutePath().normalize();
    }

    public FileManager() {
        this(System.getProperty("user.dir"));
    }

    private Path safePath(String target) throws IOException {
        Path resolved = baseDir.resolve(target).normalize().toAbsolutePath();
        if (!resolved.startsWith(baseDir)) {
            throw new IOException("路径越界: \"" + target + "\" 超出基目录");
        }
        return resolved;
    }

    public Map<String, Object> read(String filepath) {
        try {
            Path full = safePath(filepath);
            if (!Files.exists(full)) {
                return Map.of("success", false, "error", "文件不存在: " + filepath);
            }
            String content = new String(Files.readAllBytes(full));
            return Map.of("success", true, "content", content, "size", content.length());
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> write(String filepath, String content) {
        try {
            Path full = safePath(filepath);
            Files.createDirectories(full.getParent());
            Files.write(full, content.getBytes());
            return Map.of("success", true, "path", filepath, "size", content.length());
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> list(String dirPath) {
        try {
            Path full = safePath(dirPath);
            if (!Files.exists(full)) {
                return Map.of("success", false, "error", "目录不存在: " + dirPath);
            }
            List<String> files = new ArrayList<>();
            List<String> dirs = new ArrayList<>();
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(full)) {
                for (Path entry : stream) {
                    if (Files.isDirectory(entry)) dirs.add(entry.getFileName().toString());
                    else files.add(entry.getFileName().toString());
                }
            }
            return Map.of("success", true, "files", files, "dirs", dirs, "total", files.size() + dirs.size());
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> delete(String filepath) {
        try {
            Path full = safePath(filepath);
            if (!Files.exists(full)) {
                return Map.of("success", false, "error", "文件不存在");
            }
            Files.delete(full);
            return Map.of("success", true);
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // 使用示例
    // FileManager fm = new FileManager("./data");
    // fm.write("test.txt", "Hello World");
    // System.out.println(fm.read("test.txt"));
    // System.out.println(fm.list("."));
}
`;
  },

  [INTENT.PIPELINE]: (params) => {
    return `import java.util.*;
import java.util.function.Function;

/**
 * ${params.description || '数据处理管道'}
 * 链式数据处理管道
 */
public class DataPipeline {
    private List<Object> data;
    private List<PipelineStep> steps;
    private List<Map<String, String>> errors;

    private static class PipelineStep {
        String name;
        Runnable action;

        PipelineStep(String name, Runnable action) {
            this.name = name;
            this.action = action;
        }
    }

    public DataPipeline(List<Object> initialData) {
        this.data = new ArrayList<>(initialData != null ? initialData : new ArrayList<>());
        this.steps = new ArrayList<>();
        this.errors = new ArrayList<>();
    }

    public DataPipeline pipe(String name, Runnable action) {
        steps.add(new PipelineStep(name, action));
        return this;
    }

    public DataPipeline filter(java.util.function.Predicate<Object> fn) {
        return pipe("filter", () -> {
            data = data.stream().filter(fn).collect(Collectors.toList());
        });
    }

    public <R> DataPipeline map(Function<Object, R> fn) {
        return pipe("map", () -> {
            data = data.stream().map(fn).collect(Collectors.toList());
        });
    }

    public DataPipeline sort(Comparator<Object> compareFn) {
        return pipe("sort", () -> {
            data = data.stream().sorted(compareFn).collect(Collectors.toList());
        });
    }

    public Map<String, Object> run() {
        errors = new ArrayList<>();
        long start = System.currentTimeMillis();
        for (PipelineStep step : steps) {
            try { step.action.run(); }
            catch (Exception e) { errors.add(Map.of("step", step.name, "error", e.getMessage())); }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", data);
        result.put("steps", steps.size());
        result.put("errors", errors);
        result.put("duration", System.currentTimeMillis() - start);
        return result;
    }

    public List<Object> getData() { return data; }
    public boolean hasErrors() { return !errors.isEmpty(); }

    // 使用示例
    // DataPipeline pipeline = new DataPipeline(Arrays.asList(1, 2, 3, 4, 5, 6));
    // pipeline.filter(n -> (Integer) n > 2)
    //         .map(n -> (Integer) n * 2)
    //         .sort(Comparator.reverseOrder());
    // System.out.println(pipeline.run().get("data"));
}
`;
  },

  [INTENT.PLOT]: (params) => {
    return `import java.util.*;

/**
 * ${params.description || '数据可视化工具'}
 * 在控制台绘制简单图表
 */
public class PlotUtils {

    /**
     * 绘制柱状图
     * @param data 数值列表
     * @param label 图表标签
     */
    public static void plotBar(List<? extends Number> data, String label) {
        if (data == null || data.isEmpty()) {
            System.out.println("[plotBar] 输入数据为空");
            return;
        }

        double max = data.stream().mapToDouble(Number::doubleValue).max().orElse(1);
        int width = 40;
        char symbol = '█';

        System.out.println("--- 柱状图: " + label + " ---");
        for (int i = 0; i < data.size(); i++) {
            double val = data.get(i).doubleValue();
            int barLen = Math.max(1, (int) Math.round((val / max) * width));
            String bar = String.valueOf(symbol).repeat(barLen);
            System.out.println(String.format("%-10s | %s %.1f", "Item" + i, bar, val));
        }
        System.out.println("--- 总计: " + data.size() + " 项 ---");
    }

    /**
     * 绘制折线图（简化文本版）
     * @param values 数值列表
     * @param label 图表标签
     */
    public static void plotLine(List<? extends Number> values, String label) {
        if (values == null || values.isEmpty()) return;

        double max = values.stream().mapToDouble(Number::doubleValue).max().orElse(1);
        double min = values.stream().mapToDouble(Number::doubleValue).min().orElse(0);
        double range = max - min || 1;
        int height = 10;
        int width = 50;

        System.out.println("--- 折线图: " + label + " ---");
        for (int row = 0; row <= height; row++) {
            double threshold = max - (row / (double) height) * range;
            StringBuilder line = new StringBuilder();
            for (int col = 0; col < Math.min(values.size(), width); col++) {
                int idx = (int) ((col / (double) width) * values.size());
                line.append(values.get(idx).doubleValue() >= threshold ? "*" : " ");
            }
            String valLabel = String.format("%.1f", min + (height - row) / (double) height * range);
            System.out.println(String.format("%8s |%s", valLabel, line));
        }
        System.out.println("          " + "-".repeat(Math.min(values.size(), width)));
    }

    // 使用示例
    // plotBar(Arrays.asList(3, 7, 2, 9, 5), "分数");
    // plotLine(Arrays.asList(1, 3, 2, 5, 7, 4, 6, 8, 9, 10), "趋势");
}
`;
  },

  [INTENT.ENCODE]: (params) => {
    return `import java.util.*;
import java.util.Base64;

/**
 * ${params.description || '编码/解码工具'}
 * 提供 Base64、URL、Hex 等编解码功能
 */
public class EncodeUtils {

    /** Base64 编码 */
    public static String base64Encode(String str) {
        if (str == null) return "";
        try {
            return Base64.getEncoder().encodeToString(str.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            return Base64.getEncoder().encodeToString(str.getBytes());
        }
    }

    /** Base64 解码 */
    public static String base64Decode(String encoded) {
        if (encoded == null) return "";
        try {
            return new String(Base64.getDecoder().decode(encoded), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    /** URL 编码 */
    public static String urlEncode(String str) throws Exception {
        return java.net.URLEncoder.encode(str, "UTF-8");
    }

    /** URL 解码 */
    public static String urlDecode(String str) throws Exception {
        return java.net.URLDecoder.decode(str, "UTF-8");
    }

    /** Hex 编码 */
    public static String hexEncode(String str) {
        StringBuilder sb = new StringBuilder();
        for (char c : str.toCharArray()) {
            sb.append(String.format("%02x", (int) c));
        }
        return sb.toString();
    }

    /** Hex 解码 */
    public static String hexDecode(String hex) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < hex.length(); i += 2) {
            sb.append((char) Integer.parseInt(hex.substring(i, i + 2), 16));
        }
        return sb.toString();
    }

    // 使用示例
    // System.out.println(base64Encode("Hello 世界"));
    // System.out.println(base64Decode("SGVsbG8g5LiW55WM"));
    // System.out.println(hexEncode("ABC"));
    // System.out.println(hexDecode("414243"));
}
`;
  },

  [INTENT.BATCH]: (params) => {
    return `import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

/**
 * ${params.description || '批量处理工具'}
 * 批量处理数据，支持并发控制
 */
public class BatchUtils {

    /**
     * 批量处理（异步）
     * @param items 待处理项目列表
     * @param processor 处理函数
     * @param batchSize 每批大小
     * @param parallel 是否并行
     * @return 处理结果
     * @param <T> 输入类型
     * @param <R> 输出类型
     */
    public static <T, R> Map<String, Object> batchProcess(
            List<T> items,
            java.util.function.Function<T, R> processor,
            int batchSize,
            boolean parallel) {
        if (items == null || items.isEmpty()) {
            return Map.of("results", new ArrayList<>(), "errors", new ArrayList<>(),
                    "total", 0, "succeeded", 0, "failed", 0);
        }

        List<R> results = new ArrayList<>(Collections.nCopies(items.size(), null));
        List<Map<String, Object>> errors = new ArrayList<>();

        if (parallel) {
            ExecutorService executor = Executors.newFixedThreadPool(Math.min(batchSize, items.size()));
            List<Future<?>> futures = new ArrayList<>();

            for (int i = 0; i < items.size(); i++) {
                final int idx = i;
                futures.add(executor.submit(() -> {
                    try {
                        results.set(idx, processor.apply(items.get(idx)));
                    } catch (Exception e) {
                        errors.add(Map.of("index", idx, "error", e.getMessage()));
                    }
                }));
            }

            for (Future<?> future : futures) {
                try { future.get(); } catch (Exception e) { /* handled in task */ }
            }
            executor.shutdown();
        } else {
            for (int i = 0; i < items.size(); i += batchSize) {
                int end = Math.min(i + batchSize, items.size());
                for (int j = i; j < end; j++) {
                    try {
                        results.set(j, processor.apply(items.get(j)));
                    } catch (Exception e) {
                        errors.add(Map.of("index", j, "error", e.getMessage()));
                    }
                }
            }
        }

        long succeeded = results.stream().filter(Objects::nonNull).count();
        return Map.of(
            "results", results.stream().filter(Objects::nonNull).collect(Collectors.toList()),
            "errors", errors,
            "total", items.size(),
            "succeeded", succeeded,
            "failed", errors.size()
        );
    }

    /**
     * 分块处理（同步版本）
     * @param items 待处理项目
     * @param processor 处理函数
     * @param chunkSize 每块大小
     * @return 处理结果列表
     * @param <T> 输入类型
     * @param <R> 输出类型
     */
    public static <T, R> List<R> chunkProcess(List<T> items, java.util.function.Function<T, R> processor, int chunkSize) {
        if (items == null || chunkSize < 1) return new ArrayList<>();
        List<R> results = new ArrayList<>();
        for (int i = 0; i < items.size(); i += chunkSize) {
            int end = Math.min(i + chunkSize, items.size());
            for (int j = i; j < end; j++) {
                results.add(processor.apply(items.get(j)));
            }
        }
        return results;
    }

    // 使用示例
    // List<Integer> data = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    // Map<String, Object> result = batchProcess(data, n -> n * 2, 3, false);
    // System.out.println(result.get("results"));
}
`;
  },

  [INTENT.UTILITY]: (params) => {
    return `import java.util.*;

/**
 * ${params.description || '通用工具函数'}
 */
public class CommonUtils {

    /** 深拷贝 */
    @SuppressWarnings("unchecked")
    public static <T> T deepClone(T obj) {
        if (obj == null) return null;
        if (obj instanceof Cloneable) {
            try {
                java.lang.reflect.Method clone = obj.getClass().getMethod("clone");
                clone.setAccessible(true);
                return (T) clone.invoke(obj);
            } catch (Exception e) { /* fall through */ }
        }
        if (obj instanceof List) {
            List<Object> cloned = new ArrayList<>();
            for (Object item : (List<?>) obj) {
                cloned.add(deepClone(item));
            }
            return (T) cloned;
        }
        if (obj instanceof Map) {
            Map<Object, Object> cloned = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) obj).entrySet()) {
                cloned.put(entry.getKey(), deepClone(entry.getValue()));
            }
            return (T) cloned;
        }
        return obj;
    }

    /** 休眠（毫秒） */
    public static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    /** 分块 */
    public static <T> List<List<T>> chunk(List<T> list, int size) {
        if (list == null || size < 1) return new ArrayList<>();
        List<List<T>> result = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            result.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return result;
    }

    /** 去重 */
    public static <T> List<T> unique(List<T> list) {
        if (list == null) return new ArrayList<>();
        return new ArrayList<>(new LinkedHashSet<>(list));
    }

    // 使用示例
    // List<Map<String, Object>> cloned = deepClone(originalList);
    // System.out.println(chunk(Arrays.asList(1,2,3,4,5), 2));
    // System.out.println(unique(Arrays.asList(1,2,2,3,3,4)));
}
`;
  }
};

// ============================================================================
// Java 测试代码生成
// ============================================================================

/**
 * 生成 Java 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 类名
 * @returns {string} 测试代码
 */
function generateJavaTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
public class Test${funcName} {
    public static void main(String[] args) {
        System.out.println("测试 ${funcName}...");
        int passed = 0;
        int failed = 0;
`;

  for (const tc of testCases) {
    testCode += `
        // ${tc.name}
        try {
${tc.setup ? '            ' + tc.setup.replace(/\n/g, '\n            ') : ''}
            ${tc.call};
            ${tc.assert}
            System.out.println("  ✅ ${tc.name}");
            passed++;
        } catch (Exception e) {
            System.err.println("  ❌ ${tc.name}: " + e.getMessage());
            failed++;
        }
`;
  }

  testCode += `
        System.out.printf("测试完成: %d 通过, %d 失败%n", passed, failed);
    }
}
`;
  return testCode;
}

/**
 * 获取 Java 测试用例
 */
function getTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      { name: '基本排序 - 数字列表升序', setup: 'List<Integer> input = Arrays.asList(3, 1, 4, 1, 5, 9);', call: 'List<Integer> result = SortUtils.sortData(input, true)', assert: 'if (result == null || result.get(0) != 1) throw new AssertionError("排序结果不正确");' },
      { name: '空列表处理', setup: 'List<Integer> input = new ArrayList<>();', call: 'List<Integer> result = SortUtils.sortData(input, true)', assert: 'if (result == null || !result.isEmpty()) throw new AssertionError("空列表应返回空列表");' }
    ],
    [INTENT.FILTER]: [
      { name: '基本过滤 - 大于2', setup: 'List<Integer> input = Arrays.asList(1, 2, 3, 4, 5);', call: 'List<Integer> result = FilterUtils.filterData(input, n -> n > 2)', assert: 'if (result == null || result.size() != 3) throw new AssertionError("过滤结果长度错误");' }
    ],
    [INTENT.ANALYZE]: [
      { name: '基本统计分析', setup: 'List<Integer> input = Arrays.asList(1, 2, 3, 4, 5);', call: 'Map<String, Object> result = AnalyzeUtils.analyzeData(input)', assert: 'if (!((int) result.get("count") == 5)) throw new AssertionError("count 错误");' }
    ],
    [INTENT.FETCH]: [
      { name: 'fetchData 方法存在性', setup: '', call: 'Class<?> clazz = FetchUtils.class', assert: 'if (!java.lang.reflect.Modifier.isStatic(java.util.Arrays.asList(clazz.getMethods()).stream().filter(m -> m.getName().equals("fetchData")).findFirst().orElseThrow().getModifiers())) throw new AssertionError("fetchData 应为静态方法");' }
    ],
    [INTENT.CACHE]: [
      { name: '缓存基本功能', setup: 'DataCache cache = new DataCache(10, 60000);', call: 'boolean setResult = cache.set("key1", "value1")', assert: 'if (!setResult) throw new AssertionError("set 应返回 true");\n            if (!"value1".equals(cache.get("key1"))) throw new AssertionError("get 返回值不匹配");' }
    ],
    [INTENT.VALIDATE]: [
      { name: '有效数据验证', setup: 'Map<String, Object> input = new HashMap<>(); input.put("name", "Alice"); input.put("age", 25);\n            Map<String, Map<String, Object>> rules = new HashMap<>();\n            Map<String, Object> nameRule = new HashMap<>(); nameRule.put("required", true); nameRule.put("type", "string"); rules.put("name", nameRule);\n            Map<String, Object> ageRule = new HashMap<>(); ageRule.put("required", true); ageRule.put("type", "number"); ageRule.put("min", 0); rules.put("age", ageRule);', call: 'Map<String, Object> result = Validator.validate(input, rules)', assert: 'if (!(Boolean) result.get("valid")) throw new AssertionError("有效数据应验证通过");' }
    ],
    [INTENT.FILE]: [
      { name: 'FileManager 实例化', setup: '', call: 'FileManager fm = new FileManager("./data")', assert: 'if (fm == null) throw new AssertionError("FileManager 实例化失败");' }
    ],
    [INTENT.PIPELINE]: [
      { name: '管道基本功能', setup: 'List<Object> input = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));\n            DataPipeline pipeline = new DataPipeline(input);', call: 'pipeline.filter(n -> (Integer) n > 2).map(n -> (Integer) n * 2); Map<String, Object> result = pipeline.run()', assert: 'if (result == null || !((List<?>) result.get("data")).isEmpty()) throw new AssertionError("管道结果应为数组");' }
    ],
    [INTENT.PLOT]: [
      { name: 'plotBar 方法存在性', setup: '', call: 'Class<?> clazz = PlotUtils.class', assert: 'boolean found = java.util.Arrays.asList(clazz.getMethods()).stream().anyMatch(m -> m.getName().equals("plotBar"));\n            if (!found) throw new AssertionError("plotBar 应存在");' }
    ],
    [INTENT.ENCODE]: [
      { name: 'Base64 编码', setup: '', call: 'String result = EncodeUtils.base64Encode("Hello")', assert: 'if (result == null || result.isEmpty()) throw new AssertionError("编码结果应为非空字符串");' }
    ],
    [INTENT.BATCH]: [
      { name: 'batchProcess 方法存在性', setup: '', call: 'Class<?> clazz = BatchUtils.class', assert: 'boolean found = java.util.Arrays.asList(clazz.getMethods()).stream().anyMatch(m -> m.getName().equals("batchProcess"));\n            if (!found) throw new AssertionError("batchProcess 应存在");' }
    ],
    [INTENT.UTILITY]: [
      { name: 'deepClone 基本功能', setup: 'List<Object> obj = new ArrayList<>(); obj.add(Map.of("a", 1));', call: 'Object result = CommonUtils.deepClone(obj)', assert: 'if (result == null) throw new AssertionError("deepClone 应返回对象");' }
    ]
  };

  return cases[intent] || [
    { name: '基本功能测试', setup: '', call: `${funcName} instance = new ${funcName}()`, assert: 'if (instance == null) throw new AssertionError("实例化失败");' }
  ];
}

// ============================================================================
// 适配器接口
// ============================================================================

module.exports = {
  name: 'java',
  templates: JAVA_TEMPLATES,
  generateTest: generateJavaTest,
  getTestCases,
  structureKeywords: ['public class', 'public static', 'private class', 'class '],
  commentPrefixes: ['//', '/**', '*', '*/'],
  indentSize: 4,
  useTabs: false,
  supportedIntents: Object.keys(JAVA_TEMPLATES)
};
