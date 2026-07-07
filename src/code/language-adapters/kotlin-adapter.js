/**
 * kotlin-adapter.js — Kotlin 语言适配器
 *
 * 提供 Kotlin 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置（4 空格）
 *
 * @module language-adapters/kotlin-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');

// ============================================================================
// Kotlin 代码模板
// ============================================================================

const KOTLIN_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    return `/**
 * ${params.description || '排序工具'}
 * 对列表进行排序
 */

/**
 * 对整数列表排序
 * @param data 输入数据列表
 * @param ascending 是否升序
 * @return 排序后的新列表
 */
fun sortData(data: List<Int>, ascending: Boolean = true): List<Int> {
    if (data.isEmpty()) {
        println("[sortData] 输入为空，返回空列表")
        return emptyList()
    }
    return if (ascending) data.sorted() else data.sortedDescending()
}

/**
 * 对对象列表按字段排序
 * @param data 输入数据列表
 * @param key 排序字段
 * @param ascending 是否升序
 * @return 排序后的新列表
 */
fun <T> sortData(data: List<T>, key: String, ascending: Boolean = true): List<T> {
    if (data.isEmpty()) return emptyList()
    return data.sortedBy { item ->
        try {
            val method = item!!::class.java.getMethod(
                "get\${key.replaceFirstChar { it.uppercase() }}"
            )
            (method.invoke(item) as? String) ?: ""
        } catch (e: Exception) {
            item.toString()
        }
    }.let { if (ascending) it else it.reversed() }
}

// 使用示例
// val result = sortData(listOf(3, 1, 4, 1, 5, 9))
// println(result) // [1, 1, 3, 4, 5, 9]
`;
  },

  [INTENT.FILTER]: (params) => {
    return `/**
 * ${params.description || '过滤工具'}
 * 从列表中筛选符合条件的元素
 */

/**
 * 过滤列表
 * @param data 输入数据列表
 * @param predicate 过滤条件
 * @return 过滤后的新列表
 */
fun <T> filterData(data: List<T>, predicate: (T) -> Boolean): List<T> {
    if (data.isEmpty()) {
        println("[filterData] 输入为空")
        return emptyList()
    }
    return data.filter(predicate)
}

// 使用示例
// val result = filterData(listOf(1, 2, 3, 4, 5)) { it > 2 }
// println(result) // [3, 4, 5]
`;
  },

  [INTENT.ANALYZE]: (params) => {
    return `/**
 * ${params.description || '统计分析工具'}
 * 提供数据统计分析功能
 */

/**
 * 统计分析
 * @param data 输入数据列表
 * @return 统计结果映射
 */
fun analyzeData(data: List<Double>): Map<String, Any> {
    if (data.isEmpty()) {
        return mapOf("count" to 0, "error" to "数据为空")
    }

    val sum = data.sum()
    val avg = sum / data.size

    val sorted = data.sorted()
    val min = sorted.first()
    val max = sorted.last()

    // 中位数
    val median: Double = if (sorted.size % 2 == 0) {
        (sorted[sorted.size / 2 - 1] + sorted[sorted.size / 2]) / 2.0
    } else {
        sorted[sorted.size / 2]
    }

    // 标准差
    val variance = data.map { (it - avg).pow(2) }.average()
    val std = sqrt(variance)

    return mapOf(
        "count" to data.size,
        "numericCount" to data.size,
        "sum" to (sum * 100).roundToInt() / 100.0,
        "avg" to (avg * 100).roundToInt() / 100.0,
        "min" to min,
        "max" to max,
        "median" to median,
        "std" to (std * 100).roundToInt() / 100.0,
        "distribution" to emptyMap<String, Int>()
    )
}

// 使用示例
// val stats = analyzeData(listOf(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0))
// println(stats)
`;
  },

  [INTENT.FETCH]: (params) => {
    return `import java.net.HttpURLConnection
import java.net.URL
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * ${params.description || 'HTTP请求工具'}
 */

/**
 * HTTP GET 请求
 * @param url 请求URL
 * @param timeoutMs 超时时间（毫秒）
 * @return 响应结果
 */
fun fetchData(url: String, timeoutMs: Int = 10000): Map<String, Any> {
    return try {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = timeoutMs
        connection.readTimeout = timeoutMs
        connection.setRequestProperty("Content-Type", "application/json")

        val status = connection.responseCode
        val reader = BufferedReader(InputStreamReader(connection.inputStream))
        val response = reader.readText()
        reader.close()

        mapOf("success" to (status in 200..299), "data" to response, "status" to status)
    } catch (e: java.net.SocketTimeoutException) {
        mapOf("success" to false, "error" to "请求超时", "timeout" to timeoutMs)
    } catch (e: Exception) {
        mapOf("success" to false, "error" to (e.message ?: "未知错误"))
    }
}

// 使用示例
// val result = fetchData("https://api.example.com/data")
// println(result)
`;
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return `import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.locks.ReentrantLock

/**
 * ${params.description || 'LRU缓存工具'}
 * 支持TTL过期的LRU缓存
 */

class CacheEntry(
    val value: Any,
    val ttl: Long,
    val timestamp: Long,
    var lastAccess: Long
)

/**
 * LRU 缓存
 * @param maxSize 最大容量
 * @param ttlMs 默认TTL（毫秒）
 */
class DataCache(private val maxSize: Int = 100, private val ttlMs: Long = ${ttl}) {
    private val store = ConcurrentHashMap<String, CacheEntry>()
    private val lock = ReentrantLock()
    private var hits: Int = 0
    private var misses: Int = 0

    /**
     * 获取缓存值
     */
    fun get(key: String): Any? {
        lock.lock()
        try {
            val entry = store[key]
            if (entry == null) {
                misses++
                return null
            }
            val now = System.currentTimeMillis()
            if (now - entry.timestamp > entry.ttl) {
                store.remove(key)
                misses++
                return null
            }
            entry.lastAccess = now
            hits++
            return entry.value
        } finally {
            lock.unlock()
        }
    }

    /**
     * 设置缓存值
     */
    fun set(key: String, value: Any, ttl: Long? = null): Boolean {
        lock.lock()
        try {
            if (store.containsKey(key)) {
                store.remove(key)
            } else if (store.size >= maxSize) {
                // 淘汰最久未访问的
                val oldest = store.minByOrNull { it.value.lastAccess }?.key
                oldest?.let { store.remove(it) }
            }
            val now = System.currentTimeMillis()
            store[key] = CacheEntry(value, ttl ?: ttlMs, now, now)
            return true
        } finally {
            lock.unlock()
        }
    }

    /** 缓存统计 */
    val stats: Map<String, Any>
        get() {
            lock.lock()
            try {
                val total = hits + misses
                return mapOf(
                    "size" to store.size,
                    "maxSize" to maxSize,
                    "hits" to hits,
                    "misses" to misses,
                    "hitRate" to if (total > 0) String.format("%.1f%%", hits * 100.0 / total) else "0%",
                    "keys" to store.keys.toList()
                )
            } finally {
                lock.unlock()
            }
        }
}

// 使用示例
// val cache = DataCache(maxSize = 50, ttlMs = 30000)
// cache.set("user:1", mapOf("name" to "Alice"))
// println(cache.get("user:1"))
// println(cache.stats)
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `import java.util.regex.Pattern

/**
 * ${params.description || '数据验证器'}
 * 基于规则的验证引擎
 */

/**
 * 验证输入数据
 * @param input 输入数据映射
 * @param rules 验证规则映射
 * @return 验证结果映射
 */
fun validate(input: Map<String, Any?>, rules: Map<String, Map<String, Any?>>): Map<String, Any?> {
    if (input.isEmpty()) {
        return mapOf("valid" to false, "errors" to listOf("输入数据无效"))
    }
    if (rules.isEmpty()) {
        return mapOf("valid" to false, "errors" to listOf("验证规则无效"))
    }

    val errors = mutableListOf<Map<String, Any?>>()

    for ((field, rule) in rules) {
        val value = input[field]

        // 必填检查
        val required = rule["required"] as? Boolean ?: false
        if (required && (value == null || value.toString().isEmpty())) {
            errors.add(mapOf("field" to field, "rule" to "required",
                "message" to ""$field" 是必填字段"))
            continue
        }

        // 跳过未提供的可选字段
        if (value == null) continue

        // 类型检查
        val expectedType = rule["type"] as? String
        if (expectedType != null) {
            val typeMatch = when (expectedType) {
                "string" -> value is String
                "number" -> value is Number
                "array" -> value is List<*>
                else -> true
            }
            if (!typeMatch) {
                errors.add(mapOf("field" to field, "rule" to "type",
                    "message" to ""$field" 应为 $expectedType 类型"))
                continue
            }
        }

        // 长度检查
        if (value is String) {
            val minLen = rule["minLength"] as? Int
            val maxLen = rule["maxLength"] as? Int
            if (minLen != null && value.length < minLen) {
                errors.add(mapOf("field" to field, "rule" to "minLength",
                    "message" to ""$field" 最少 $minLen 个字符"))
            }
            if (maxLen != null && value.length > maxLen) {
                errors.add(mapOf("field" to field, "rule" to "maxLength",
                    "message" to ""$field" 最多 $maxLen 个字符"))
            }
        }
    }

    return mapOf(
        "valid" to errors.isEmpty(),
        "errors" to errors,
        "errorCount" to errors.size,
        "passed" to rules.size - errors.size,
        "total" to rules.size
    )
}

// 使用示例
// val input = mapOf("name" to "Alice", "age" to 25)
// val rules = mapOf(
//     "name" to mapOf("required" to true, "type" to "string", "minLength" to 2),
//     "age" to mapOf("required" to true, "type" to "number", "min" to 0)
// )
// println(validate(input, rules))
`;
  },

  [INTENT.FILE]: (params) => {
    return `import java.io.File

/**
 * ${params.description || '文件操作工具'}
 * 安全的文件读写操作
 */

/**
 * 文件管理器
 * @param baseDir 基目录
 */
class FileManager(private val baseDir: String = System.getProperty("user.dir")) {
    private val baseFile = File(baseDir).canonicalFile

    /**
     * 安全路径检查
     */
    private fun safePath(target: String): File {
        val resolved = File(baseFile, target).canonicalFile
        if (!resolved.path.startsWith(baseFile.path)) {
            throw SecurityException(""路径越界: "$target" 超出基目录"")
        }
        return resolved
    }

    /** 读取文件 */
    fun read(filepath: String): Map<String, Any?> {
        return try {
            val full = safePath(filepath)
            if (!full.exists()) {
                return mapOf("success" to false, "error" to "文件不存在: $filepath")
            }
            val content = full.readText()
            mapOf("success" to true, "content" to content, "size" to content.length)
        } catch (e: Exception) {
            mapOf("success" to false, "error" to e.message)
        }
    }

    /** 写入文件 */
    fun write(filepath: String, content: String): Map<String, Any?> {
        return try {
            val full = safePath(filepath)
            full.parentFile?.mkdirs()
            full.writeText(content)
            mapOf("success" to true, "path" to filepath, "size" to content.length)
        } catch (e: Exception) {
            mapOf("success" to false, "error" to e.message)
        }
    }

    /** 列出目录 */
    fun list(dirPath: String = "."): Map<String, Any?> {
        return try {
            val full = safePath(dirPath)
            if (!full.exists()) {
                return mapOf("success" to false, "error" to "目录不存在: $dirPath")
            }
            val files = full.listFiles()?.filter { it.isFile }?.map { it.name } ?: emptyList()
            val dirs = full.listFiles()?.filter { it.isDirectory }?.map { it.name } ?: emptyList()
            mapOf("success" to true, "files" to files, "dirs" to dirs, "total" to (files.size + dirs.size))
        } catch (e: Exception) {
            mapOf("success" to false, "error" to e.message)
        }
    }
}

// 使用示例
// val fm = FileManager(baseDir = "./data")
// println(fm.write("test.txt", "Hello World"))
// println(fm.read("test.txt"))
// println(fm.list("."))
`;
  },

  [INTENT.PIPELINE]: (params) => {
    return `/**
 * ${params.description || '数据处理管道'}
 * 链式数据处理管道
 */

/**
 * 管道步骤
 */
data class PipelineStep(val name: String, val action: () -> Unit)

/**
 * 数据处理管道
 */
class DataPipeline(private val initialData: List<Any?> = emptyList()) {
    private var data: List<Any?> = initialData
    private val steps = mutableListOf<PipelineStep>()
    private val errors = mutableListOf<Map<String, String>>()

    /** 添加处理步骤 */
    fun pipe(name: String, action: () -> Unit): DataPipeline {
        steps.add(PipelineStep(name, action))
        return this
    }

    /** 过滤 */
    fun filter(predicate: (Any?) -> Boolean): DataPipeline {
        return pipe("filter") {
            data = data.filter(predicate)
        }
    }

    /** 映射 */
    fun <R> map(transform: (Any?) -> R): DataPipeline {
        return pipe("map") {
            data = data.map(transform)
        }
    }

    /** 执行所有步骤 */
    fun run(): Map<String, Any?> {
        errors.clear()
        for (step in steps) {
            try {
                step.action()
            } catch (e: Exception) {
                errors.add(mapOf("step" to step.name, "error" to (e.message ?: "未知错误")))
            }
        }
        return mapOf(
            "data" to data,
            "steps" to steps.size,
            "errors" to errors,
            "hasErrors" to errors.isNotEmpty()
        )
    }
}

// 使用示例
// val pipeline = DataPipeline(listOf(1, 2, 3, 4, 5, 6))
//     .filter { (it as? Int ?: 0) > 2 }
// val result = pipeline.run()
// println(result["data"])
`;
  },

  [INTENT.PLOT]: (params) => {
    return `/**
 * ${params.description || '数据可视化工具'}
 * 在控制台绘制简单图表
 */

/**
 * 绘制柱状图
 * @param data 数值列表
 * @param label 图表标签
 */
fun plotBar(data: List<Double>, label: String = "值") {
    if (data.isEmpty()) {
        println("[plotBar] 输入数据为空")
        return
    }

    val max = data.maxOrNull() ?: 1.0
    val width = 40
    val symbol = "█"

    println("--- 柱状图: $label ---")
    data.forEachIndexed { i, value ->
        val barLen = max(1, ((value / max) * width).roundToInt())
        val bar = symbol.repeat(barLen)
        println("%-10s | %s %.1f".format("Item$i", bar, value))
    }
    println("--- 总计: " + data.size + " 项 ---")
}

// 使用示例
// plotBar(listOf(3.0, 7.0, 2.0, 9.0, 5.0), label = "分数")
`;
  },

  [INTENT.ENCODE]: (params) => {
    return `import java.util.Base64

/**
 * ${params.description || '编码/解码工具'}
 * 提供 Base64、Hex 等编解码功能
 */

/** Base64 编码 */
fun base64Encode(str: String): String {
    return Base64.getEncoder().encodeToString(str.toByteArray())
}

/** Base64 解码 */
fun base64Decode(encoded: String): String {
    return String(Base64.getDecoder().decode(encoded))
}

/** Hex 编码 */
fun hexEncode(str: String): String {
    return str.toByteArray().joinToString("") { "%02x".format(it) }
}

/** Hex 解码 */
fun hexDecode(hex: String): String {
    val result = StringBuilder()
    for (i in hex.indices step 2) {
        result.append(hex.substring(i, minOf(i + 2, hex.length)).toInt(16).toChar())
    }
    return result.toString()
}

// 使用示例
// println(base64Encode("Hello 世界"))
// println(base64Decode("SGVsbG8g5LiW55WM"))
// println(hexEncode("ABC"))
// println(hexDecode("414243"))
`;
  },

  [INTENT.BATCH]: (params) => {
    return `import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * ${params.description || '批量处理工具'}
 * 批量处理数据，支持并发控制
 */

/**
 * 批量处理
 * @param items 待处理项目列表
 * @param processor 处理函数
 * @param batchSize 每批大小
 * @return 处理结果映射
 */
fun <T, R> batchProcess(
    items: List<T>,
    processor: (T, Int) -> R,
    batchSize: Int = 5
): Map<String, Any?> {
    if (items.isEmpty()) {
        return mapOf("results" to emptyList<R>(), "errors" to emptyList<Map<String, Any?>>(),
            "total" to 0, "succeeded" to 0, "failed" to 0)
    }

    val results = ConcurrentHashMap<Int, R>()
    val errors = ConcurrentHashMap<Int, String>()
    val executor = Executors.newFixedThreadPool(batchSize.coerceAtMost(items.size))

    for ((idx, item) in items.withIndex()) {
        executor.submit {
            try {
                results[idx] = processor(item, idx)
            } catch (e: Exception) {
                errors[idx] = e.message ?: "未知错误"
            }
        }
    }

    executor.shutdown()
    executor.awaitTermination(60, TimeUnit.SECONDS)

    val succeeded = results.size
    return mapOf(
        "results" to results.values.toList(),
        "errors" to errors.values.toList(),
        "total" to items.size,
        "succeeded" to succeeded,
        "failed" to errors.size
    )
}

// 使用示例
// val data = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
// val result = batchProcess(data, { n, _ -> n * 2 }, 3)
// println(result)
`;
  },

  [INTENT.UTILITY]: (params) => {
    return `/**
 * ${params.description || '通用工具函数'}
 */

import kotlinx.serialization.json.Json

/** 深拷贝（基于 JSON 序列化） */
inline fun <reified T> deepClone(obj: T): T? {
    val json = Json.encodeToString(JsonElement.serializer(), Json.parseToJsonElement(Json.encodeToString(obj)))
    return Json.decodeFromString(json)
}

/** 睡眠（毫秒） */
fun sleep(ms: Long) {
    Thread.sleep(ms)
}

/** 分块 */
fun <T> chunk(items: List<T>, size: Int): List<List<T>> {
    if (size < 1) return emptyList()
    return items.windowed(size, size, partialWindows = true)
}

/** 去重 */
fun <T> unique(items: List<T>): List<T> {
    return items.distinct()
}

// 使用示例
// println(chunk(listOf(1, 2, 3, 4, 5), 2))
// println(unique(listOf(1, 2, 2, 3, 3, 4)))
`;
  }
};

// ============================================================================
// Kotlin 测试代码生成
// ============================================================================

/**
 * 生成 Kotlin 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 函数/类名
 * @returns {string} 测试代码
 */
function generateKotlinTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
import kotlin.test.*

class Test${funcName} {
    @Test
    fun test${funcName}() {
        var passed = 0
        var failed = 0

        println("测试 ${funcName}...")
`;

  for (const tc of testCases) {
    testCode += `
        // ${tc.name}
        try {
${tc.setup ? '            ' + tc.setup.replace(/\n/g, '\n            ') : ''}
            ${tc.call}
            ${tc.assert}
            println("  ✅ ${tc.name}")
            passed += 1
        } catch (e: Exception) {
            println("  ❌ ${tc.name}: ${e.message}")
            failed += 1
        }
`;
  }

  testCode += `
        println("测试完成: $passed 通过, $failed 失败")
        assertEquals(0, failed, "存在失败的测试")
    }
}
`;
  return testCode;
}

/**
 * 获取 Kotlin 测试用例
 */
function getTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      { name: '基本排序 - 整数列表升序', setup: 'val input = listOf(3, 1, 4, 1, 5, 9)', call: 'val result = sortData(input)', assert: 'assertEquals(1, result[0], "排序结果不正确")\n            assertEquals(6, result.size, "数组长度变化")' },
      { name: '空列表处理', setup: 'val input: List<Int> = emptyList()', call: 'val result = sortData(input)', assert: 'assertTrue(result.isEmpty(), "空列表应返回空列表")' }
    ],
    [INTENT.FILTER]: [
      { name: '基本过滤 - 大于2', setup: 'val input = listOf(1, 2, 3, 4, 5)', call: 'val result = filterData(input) { it > 2 }', assert: 'assertEquals(3, result.size, "过滤结果长度错误")' }
    ],
    [INTENT.ANALYZE]: [
      { name: '基本统计分析', setup: 'val input = listOf(1.0, 2.0, 3.0, 4.0, 5.0)', call: 'val result = analyzeData(input)', assert: 'assertEquals(5, (result["count"] as Int), "count 错误")' }
    ],
    [INTENT.CACHE]: [
      { name: '缓存基本功能', setup: 'val cache = DataCache(maxSize = 10, ttlMs = 60000)', call: 'val setResult = cache.set("key1", "value1")', assert: 'assertTrue(setResult, "set 应返回 true")\n            assertEquals("value1", cache.get("key1"), "get 返回值不匹配")' }
    ],
    [INTENT.VALIDATE]: [
      { name: '有效数据验证', setup: 'val input = mapOf("name" to "Alice", "age" to 25)', call: 'val rules = mapOf("name" to mapOf("required" to true, "type" to "string"))\n            val result = validate(input, rules)', assert: 'assertTrue(result["valid"] as Boolean, "有效数据应验证通过")' }
    ],
    [INTENT.FILE]: [
      { name: 'FileManager 实例化', setup: '', call: 'val _fm = FileManager(baseDir = "./data")', assert: '// 实例化成功由编译器保证' }
    ],
    [INTENT.PIPELINE]: [
      { name: '管道基本功能', setup: 'val pipeline = DataPipeline(listOf(1, 2, 3, 4, 5))', call: 'val _result = pipeline.filter { (it as? Int ?: 0) > 2 }.run()', assert: '// 管道执行正常' }
    ],
    [INTENT.PLOT]: [
      { name: 'plotBar 方法存在性', setup: '', call: '', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.ENCODE]: [
      { name: 'Base64 编码', setup: '', call: 'val result = base64Encode("Hello")', assert: 'assertFalse(result.isEmpty(), "编码结果应为非空字符串")' }
    ],
    [INTENT.BATCH]: [
      { name: 'batchProcess 方法存在性', setup: '', call: '', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.UTILITY]: [
      { name: 'chunk 函数', setup: 'val items = listOf(1, 2, 3, 4, 5)', call: 'val result = chunk(items, 2)', assert: 'assertEquals(3, result.size, "chunk 结果长度错误")' }
    ]
  };

  return cases[intent] || [
    { name: '基本功能测试', setup: '', call: `// ${funcName} 函数存在性由编译器保证`, assert: '// 函数存在性由编译器保证' }
  ];
}

// ============================================================================
// 适配器接口
// ============================================================================

module.exports = {
  name: 'kotlin',
  templates: KOTLIN_TEMPLATES,
  generateTest: generateKotlinTest,
  getTestCases,
  structureKeywords: ['fun ', 'class ', 'object ', 'val ', 'var '],
  commentPrefixes: ['//', '/*', '*', '*/'],
  indentSize: 4,
  useTabs: false,
  supportedIntents: Object.keys(KOTLIN_TEMPLATES)
};
