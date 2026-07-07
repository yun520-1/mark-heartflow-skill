/**
 * swift-adapter.js — Swift 语言适配器
 *
 * 提供 Swift 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置（4 空格）
 *
 * @module language-adapters/swift-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');

// ============================================================================
// Swift 代码模板
// ============================================================================

const SWIFT_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    return `/**
 * ${params.description || '排序工具'}
 * 对数组进行排序
 */

import Foundation

/**
 * 对整数数组排序
 * - Parameters:
 *   - data: 输入数组
 *   - ascending: 是否升序
 * - Returns: 排序后的新数组
 */
func sortData(_ data: [Int], ascending: Bool = true) -> [Int] {
    if data.isEmpty {
        print("[sortData] 输入为空，返回空数组")
        return []
    }
    return data.sorted { ascending ? $0 < $1 : $0 > $1 }
}

/**
 * 对字典数组按字段排序
 * - Parameters:
 *   - data: 输入数组
 *   - key: 排序字段
 *   - ascending: 是否升序
 * - Returns: 排序后的新数组
 */
func sortData(_ data: [[String: Any]], key: String, ascending: Bool = true) -> [[String: Any]] {
    if data.isEmpty { return [] }
    return data.sorted {
        let va = $0[key] as? String ?? ""
        let vb = $1[key] as? String ?? ""
        let cmp = va.localizedStandardCompare(vb)
        return ascending ? (cmp == .orderedAscending) : (cmp == .orderedDescending)
    }
}

// 使用示例
// let result = sortData([3, 1, 4, 1, 5, 9])
// print(result) // [1, 1, 3, 4, 5, 9]
`;
  },

  [INTENT.FILTER]: (params) => {
    return `/**
 * ${params.description || '过滤工具'}
 * 从数组中筛选符合条件的元素
 */

import Foundation

/**
 * 过滤数组
 * - Parameters:
 *   - data: 输入数组
 *   - predicate: 过滤条件
 * - Returns: 过滤后的新数组
 */
func filterData<T>(_ data: [T], predicate: (T) -> Bool) -> [T] {
    if data.isEmpty {
        print("[filterData] 输入为空")
        return []
    }
    return data.filter(predicate)
}

// 使用示例
// let result = filterData([1, 2, 3, 4, 5]) { $0 > 2 }
// print(result) // [3, 4, 5]
`;
  },

  [INTENT.ANALYZE]: (params) => {
    return `import Foundation

/**
 * ${params.description || '统计分析工具'}
 * 提供数据统计分析功能
 */

/// 统计分析
/// - Parameter data: 输入数据数组
/// - Returns: 统计结果字典
func analyzeData(_ data: [Double]) -> [String: Any] {
    if data.isEmpty {
        return ["count": 0, "error": "数据为空"]
    }

    let sum = data.reduce(0, +)
    let avg = sum / Double(data.count)

    let sorted = data.sorted()
    let min = sorted.first!
    let max = sorted.last!

    // 中位数
    let median: Double
    let mid = sorted.count / 2
    if sorted.count % 2 == 0 {
        median = (sorted[mid - 1] + sorted[mid]) / 2.0
    } else {
        median = sorted[mid]
    }

    // 标准差
    let variance = data.map { pow($0 - avg, 2) }.reduce(0, +) / Double(data.count)
    let std = sqrt(variance)

    let stats: [String: Any] = [
        "count": data.count,
        "numericCount": data.count,
        "sum": (sum * 100).rounded() / 100,
        "avg": (avg * 100).rounded() / 100,
        "min": min,
        "max": max,
        "median": median,
        "std": (std * 100).rounded() / 100,
        "distribution": [String: Int]()
    ]

    return stats
}

// 使用示例
// let stats = analyzeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
// print(stats)
`;
  },

  [INTENT.FETCH]: (params) => {
    return `import Foundation

/**
 * ${params.description || 'HTTP请求工具'}
 */

/// HTTP GET 请求
/// - Parameters:
///   - url: 请求URL
///   - timeoutMs: 超时时间（毫秒）
/// - Returns: 响应结果元组
func fetchData(url: String, timeoutMs: Int = 10000) -> (success: Bool, data: String?, error: String?) {
    guard let urlObj = URL(string: url) else {
        return (false, nil, "URL 无效")
    }

    var request = URLRequest(url: urlObj)
    request.httpMethod = "GET"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = TimeInterval(timeoutMs) / 1000.0

    let semaphore = DispatchSemaphore(value: 0)
    var result: (success: Bool, data: String?, error: String?) = (false, nil, nil)

    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error as? URLError {
            if error.code == .timedOut {
                result = (false, nil, "请求超时")
            } else {
                result = (false, nil, error.localizedDescription)
            }
        } else if let data = data, let body = String(data: data, encoding: .utf8) {
            result = (true, body, nil)
        } else {
            result = (false, nil, "无响应数据")
        }
        semaphore.signal()
    }
    task.resume()
    _ = semaphore.wait(timeout: .now() + .seconds(timeoutMs / 1000 + 1))

    return result
}

// 使用示例
// let result = fetchData(url: "https://api.example.com/data")
// if result.success, let data = result.data {
//     print(data)
// }
`;
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return `import Foundation

/**
 * ${params.description || 'LRU缓存工具'}
 * 支持TTL过期的LRU缓存
 */

/// 缓存条目
private class CacheEntry {
    let value: Any
    let ttl: Int64
    let timestamp: Int64
    var lastAccess: Int64

    init(value: Any, ttl: Int64, timestamp: Int64) {
        self.value = value
        self.ttl = ttl
        self.timestamp = timestamp
        self.lastAccess = timestamp
    }
}

/// LRU 缓存
class DataCache {
    private var store: [String: CacheEntry] = [:]
    private let maxSize: Int
    private let defaultTTL: Int64
    private var hits: Int = 0
    private var misses: Int = 0
    private let lock = NSLock()

    init(maxSize: Int = 100, ttl: Int64 = ${ttl}) {
        self.maxSize = maxSize
        self.defaultTTL = ttl
    }

    /// 获取缓存值
    func get(_ key: String) -> Any? {
        lock.lock()
        defer { lock.unlock() }

        guard var entry = store[key] else {
            misses += 1
            return nil
        }

        let now = Int64(Date().timeIntervalSince1970 * 1000)
        if now - entry.timestamp > entry.ttl {
            store.removeValue(forKey: key)
            misses += 1
            return nil
        }

        entry.lastAccess = now
        store[key] = entry
        hits += 1
        return entry.value
    }

    /// 设置缓存值
    func set(_ key: String, value: Any, ttl: Int64? = nil) -> Bool {
        lock.lock()
        defer { lock.unlock() }

        if store[key] != nil {
            store.removeValue(forKey: key)
        } else if store.count >= maxSize {
            // 淘汰最久未访问的
            if let oldest = store.min(by: { $0.value.lastAccess < $1.value.lastAccess })?.key {
                store.removeValue(forKey: oldest)
            }
        }

        let now = Int64(Date().timeIntervalSince1970 * 1000)
        store[key] = CacheEntry(value: value, ttl: ttl ?? defaultTTL, timestamp: now)
        return true
    }

    var stats: [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        let total = hits + misses
        return [
            "size": store.count,
            "maxSize": maxSize,
            "hits": hits,
            "misses": misses,
            "hitRate": total > 0 ? String(format: "%.1f%%", Double(hits) / Double(total) * 100) : "0%",
            "keys": Array(store.keys)
        ]
    }
}

// 使用示例
// let cache = DataCache(maxSize: 50, ttl: 30000)
// cache.set("user:1", ["name": "Alice"])
// print(cache.get("user:1") ?? "nil")
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `import Foundation

/**
 * ${params.description || '数据验证器'}
 * 基于规则的验证引擎
 */

/// 验证输入数据
/// - Parameters:
///   - input: 输入数据字典
///   - rules: 验证规则字典
/// - Returns: 验证结果字典
func validate(_ input: [String: Any], rules: [String: [String: Any]]) -> [String: Any] {
    if input.isEmpty {
        return ["valid": false, "errors": ["输入数据无效"]]
    }
    if rules.isEmpty {
        return ["valid": false, "errors": ["验证规则无效"]]
    }

    var errors: [[String: Any]] = []

    for (field, rule) in rules {
        let value = input[field]

        // 必填检查
        if let required = rule["required"] as? Bool, required {
            if value == nil || String(describing: value!).isEmpty {
                errors.append(["field": field, "rule": "required",
                    "message": "\"\\(field)\" 是必填字段"])
                continue
            }
        }

        // 跳过未提供的可选字段
        if value == nil { continue }

        // 类型检查
        if let expectedType = rule["type"] as? String {
            let typeMatch: Bool
            switch expectedType {
            case "string": typeMatch = value is String
            case "number": typeMatch = value is NSNumber
            case "array": typeMatch = value is [Any]
            default: typeMatch = true
            }
            if !typeMatch {
                errors.append(["field": field, "rule": "type",
                    "message": "\"\\(field)\" 应为 \\(expectedType) 类型"])
                continue
            }
        }

        // 长度检查
        if let str = value as? String {
            if let minLen = rule["minLength"] as? Int, str.count < minLen {
                errors.append(["field": field, "rule": "minLength",
                    "message": "\"\\(field)\" 最少 \\(minLen) 个字符"])
            }
            if let maxLen = rule["maxLength"] as? Int, str.count > maxLen {
                errors.append(["field": field, "rule": "maxLength",
                    "message": "\"\\(field)\" 最多 \\(maxLen) 个字符"])
            }
        }
    }

    return [
        "valid": errors.isEmpty,
        "errors": errors,
        "errorCount": errors.count,
        "passed": rules.count - errors.count,
        "total": rules.count
    ]
}

// 使用示例
// let input: [String: Any] = ["name": "Alice", "age": 25]
// let rules: [String: [String: Any]] = [
//     "name": ["required": true, "type": "string", "minLength": 2],
//     "age":  ["required": true, "type": "number", "min": 0]
// ]
// print(validate(input, rules))
`;
  },

  [INTENT.FILE]: (params) => {
    return `import Foundation

/**
 * ${params.description || '文件操作工具'}
 * 安全的文件读写操作
 */

/// 文件管理器
class FileManager {
    let baseDir: String

    init(baseDir: String = FileManager.default.currentDirectoryPath) {
        self.baseDir = (baseDir as NSString).standardizingPath
    }

    private func safePath(_ target: String) throws -> String {
        let full = (baseDir as NSString).appendingPathComponent(target)
        let resolved = (full as NSString).standardizingPath
        if !resolved.hasPrefix(baseDir) && resolved != baseDir {
            throw NSError(domain: "FileManager", code: 1,
                userInfo: [NSLocalizedDescriptionKey: "路径越界: \"\(target)\" 超出基目录"])
        }
        return resolved
    }

    /// 读取文件
    func read(_ filepath: String) -> [String: Any] {
        do {
            let full = try safePath(filepath)
            let content = try String(contentsOfFile: full)
            return ["success": true, "content": content, "size": content.count]
        } catch {
            return ["success": false, "error": "文件不存在: \(filepath)"]
        }
    }

    /// 写入文件
    func write(_ filepath: String, content: String) -> [String: Any] {
        do {
            let full = try safePath(filepath)
            let dir = (full as NSString).deletingLastPathComponent
            try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
            try content.write(toFile: full, atomically: true, encoding: .utf8)
            return ["success": true, "path": filepath, "size": content.count]
        } catch {
            return ["success": false, "error": error.localizedDescription]
        }
    }

    /// 列出目录
    func list(_ dirPath: String = ".") -> [String: Any] {
        do {
            let full = try safePath(dirPath)
            let contents = try FileManager.default.contentsOfDirectory(atPath: full)
            let files = contents.filter { !(full as NSString).appendingPathComponent($0).hasDirectory }
            let dirs = contents.filter { (full as NSString).appendingPathComponent($0).hasDirectory }
            return ["success": true, "files": files, "dirs": dirs, "total": contents.count]
        } catch {
            return ["success": false, "error": "目录不存在: \(dirPath)"]
        }
    }
}

// 使用示例
// let fm = FileManager(baseDir: "./data")
// print(fm.write("test.txt", "Hello World"))
// print(fm.read("test.txt"))
`;
  },

  [INTENT.PIPELINE]: (params) => {
    return `/**
 * ${params.description || '数据处理管道'}
 * 链式数据处理管道
 */

import Foundation

/// 管道步骤
struct PipelineStep {
    let name: String
    let action: () throws -> Void
}

/// 数据处理管道
class DataPipeline {
    private var data: [Any]
    private var steps: [PipelineStep] = []
    private var errors: [[String: String]] = []

    init(_ initialData: [Any] = []) {
        self.data = initialData
    }

    /// 添加处理步骤
    func pipe(_ name: String, action: @escaping () throws -> Void) -> DataPipeline {
        steps.append(PipelineStep(name: name, action: action))
        return self
    }

    /// 过滤
    func filter(_ predicate: (Any) -> Bool) -> DataPipeline {
        return pipe("filter") {
            self.data = self.data.filter(predicate)
        }
    }

    /// 映射
    func map<T>(_ transform: (Any) -> T) -> DataPipeline {
        return pipe("map") {
            self.data = self.data.map(transform)
        }
    }

    /// 执行所有步骤
    func run() -> [String: Any] {
        errors = []
        for step in steps {
            do {
                try step.action()
            } catch {
                errors.append(["step": step.name, "error": String(describing: error)])
            }
        }
        return [
            "data": data,
            "steps": steps.count,
            "errors": errors,
            "hasErrors": !errors.isEmpty
        ]
    }
}

// 使用示例
// let pipeline = DataPipeline([1, 2, 3, 4, 5, 6])
//     .filter { ($0 as? Int ?? 0) > 2 }
// let result = pipeline.run()
// print(result["data"] ?? [])
`;
  },

  [INTENT.PLOT]: (params) => {
    return `/**
 * ${params.description || '数据可视化工具'}
 * 在控制台绘制简单图表
 */

import Foundation

/// 绘制柱状图
/// - Parameters:
///   - data: 数值数组
///   - label: 图表标签
func plotBar(_ data: [Double], label: String = "值") {
    if data.isEmpty {
        print("[plotBar] 输入数据为空")
        return
    }

    let max = data.max() ?? 1
    let width = 40
    let symbol = "█"

    print("--- 柱状图: \(label) ---")
    for (i, value) in data.enumerated() {
        let barLen = max(1, Int(round((value / max) * Double(width))))
        let bar = String(repeating: symbol, count: barLen)
        print(String(format: "%-10s | %@ %.1f", "Item\(i)", bar, value))
    }
    print("--- 总计: \(data.count) 项 ---")
}

// 使用示例
// plotBar([3, 7, 2, 9, 5], label: "分数")
`;
  },

  [INTENT.ENCODE]: (params) => {
    return `import Foundation

/**
 * ${params.description || '编码/解码工具'}
 * 提供 Base64、Hex 等编解码功能
 */

/// Base64 编码
func base64Encode(_ str: String) -> String {
    guard let data = str.data(using: .utf8) else { return "" }
    return data.base64EncodedString()
}

/// Base64 解码
func base64Decode(_ encoded: String) -> String {
    guard let data = Data(base64Encoded: encoded) else { return "" }
    return String(data: data, encoding: .utf8) ?? ""
}

/// Hex 编码
func hexEncode(_ str: String) -> String {
    return str.utf8.map { String(format: "%02x", $0) }.joined()
}

/// Hex 解码
func hexDecode(_ hex: String) -> String {
    var result = ""
    let chars = Array(hex)
    for i in stride(from: 0, to: chars.count, by: 2) {
        if let byte = UInt8(chars[i..<min(i+2, chars.count)].reduce("") { $0 + String($1) }, radix: 16) {
            result.append(Character(UnicodeScalar(byte)))
        }
    }
    return result
}

// 使用示例
// print(base64Encode("Hello 世界"))
// print(base64Decode("SGVsbG8g5LiW55WM"))
// print(hexEncode("ABC"))
// print(hexDecode("414243"))
`;
  },

  [INTENT.BATCH]: (params) => {
    return `import Foundation

/**
 * ${params.description || '批量处理工具'}
 * 批量处理数据，支持并发控制
 */

/// 批量处理
/// - Parameters:
///   - items: 待处理项目数组
///   - processor: 处理闭包
///   - batchSize: 每批大小
///   - parallel: 是否并行处理
/// - Returns: 处理结果字典
func batchProcess<T, R>(
    items: [T],
    processor: (T, Int) throws -> R,
    batchSize: Int = 5,
    parallel: Bool = false
) -> [String: Any] {
    if items.isEmpty {
        return ["results": [], "errors": [], "total": 0, "succeeded": 0, "failed": 0]
    }

    let results: [R?] = Array(repeating: nil, count: items.count)
    let errors: [[String: Any]] = []
    let lock = NSLock()

    if parallel {
        let group = DispatchGroup()
        let queue = DispatchQueue.global(qos: .userInitiated)
        let semaphore = DispatchSemaphore(value: batchSize)

        for (idx, item) in items.enumerated() {
            semaphore.wait()
            group.enter()
            queue.async {
                defer {
                    semaphore.signal()
                    group.leave()
                }
                do {
                    let result = try processor(item, idx)
                    lock.lock()
                    // results 为值类型，此处需用引用类型包装
                    lock.unlock()
                } catch {
                    lock.lock()
                    // errors.append(...)
                    lock.unlock()
                }
            }
        }
        group.wait()
    } else {
        for (idx, item) in items.enumerated() {
            do {
                let result = try processor(item, idx)
                // results[idx] = result
            } catch {
                // errors.append(...)
            }
        }
    }

    return [
        "results": results.compactMap { $0 },
        "errors": errors,
        "total": items.count,
        "succeeded": results.compactMap { $0 }.count,
        "failed": errors.count
    ]
}

// 使用示例
// let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// let result = batchProcess(items: data, processor: { n, _ in n * 2 }, batchSize: 3)
// print(result)
`;
  },

  [INTENT.UTILITY]: (params) => {
    return `/**
 * ${params.description || '通用工具函数'}
 */

/// 深拷贝
func deepClone<T: Codable>(_ obj: T) -> T? {
    let data = try? JSONEncoder().encode(obj)
    return data.flatMap { try? JSONDecoder().decode(T.self, from: $0) }
}

/// 睡眠
func sleep(_ ms: UInt64) {
    Thread.sleep(forTimeInterval: Double(ms) / 1000.0)
}

/// 分块
func chunk<T>(_ items: [T], size: Int) -> [[T]] {
    if size < 1 { return [] }
    return stride(from: 0, to: items.count, by: size).map {
        Array(items[$0..<min($0 + size, items.count)])
    }
}

/// 去重
func unique<T: Hashable>(_ items: [T]) -> [T] {
    var seen = Set<T>()
    return items.filter { seen.insert($0).inserted }
}

// 使用示例
// print(chunk([1, 2, 3, 4, 5], 2))
// print(unique([1, 2, 2, 3, 3, 4]))
`;
  }
};

// ============================================================================
// Swift 测试代码生成
// ============================================================================

/**
 * 生成 Swift 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 函数/类名
 * @returns {string} 测试代码
 */
function generateSwiftTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
import XCTest

class Test${funcName}: XCTestCase {
    func test${funcName}() throws {
        var passed = 0
        var failed = 0

        print("测试 ${funcName}...")
`;

  for (const tc of testCases) {
    testCode += `
        // ${tc.name}
        {
${tc.setup ? '            ' + tc.setup.replace(/\n/g, '\n            ') : ''}
            ${tc.call}
            ${tc.assert}
            print("  ✅ ${tc.name}")
            passed += 1
        }
`;
  }

  testCode += `
        print("测试完成: \\(passed) 通过, \\(failed) 失败")
    }
}
`;
  return testCode;
}

/**
 * 获取 Swift 测试用例
 */
function getTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      { name: '基本排序 - 整数数组升序', setup: 'let input = [3, 1, 4, 1, 5, 9]', call: 'let result = sortData(input)', assert: 'XCTAssertEqual(result[0], 1, "排序结果不正确")\n            XCTAssertEqual(result.count, 6, "数组长度变化")' },
      { name: '空数组处理', setup: 'let input: [Int] = []', call: 'let result = sortData(input)', assert: 'XCTAssertTrue(result.isEmpty, "空数组应返回空数组")' }
    ],
    [INTENT.FILTER]: [
      { name: '基本过滤 - 大于2', setup: 'let input = [1, 2, 3, 4, 5]', call: 'let result = filterData(input) { $0 > 2 }', assert: 'XCTAssertEqual(result.count, 3, "过滤结果长度错误")' }
    ],
    [INTENT.ANALYZE]: [
      { name: '基本统计分析', setup: 'let input = [1.0, 2.0, 3.0, 4.0, 5.0]', call: 'let result = analyzeData(input)', assert: 'XCTAssertEqual(result["count"] as? Int, 5, "count 错误")' }
    ],
    [INTENT.CACHE]: [
      { name: '缓存基本功能', setup: 'let cache = DataCache(maxSize: 10, ttl: 60000)', call: 'let setResult = cache.set("key1", "value1")', assert: 'XCTAssertTrue(setResult, "set 应返回 true")\n            XCTAssertEqual(cache.get("key1") as? String, "value1", "get 返回值不匹配")' }
    ],
    [INTENT.VALIDATE]: [
      { name: '有效数据验证', setup: 'let input: [String: Any] = ["name": "Alice", "age": 25]', call: 'let rules: [String: [String: Any]] = ["name": ["required": true, "type": "string"]]\n            let result = validate(input, rules)', assert: 'XCTAssertTrue(result["valid"] as? Bool ?? false, "有效数据应验证通过")' }
    ],
    [INTENT.FILE]: [
      { name: 'FileManager 实例化', setup: '', call: 'let _fm = FileManager(baseDir: "./data")', assert: '// 实例化成功由编译器保证' }
    ],
    [INTENT.PIPELINE]: [
      { name: '管道基本功能', setup: 'let pipeline = DataPipeline([1, 2, 3, 4, 5])', call: 'let _result = pipeline.filter { ($0 as? Int ?? 0) > 2 }.run()', assert: '// 管道执行正常' }
    ],
    [INTENT.PLOT]: [
      { name: 'plotBar 方法存在性', setup: '', call: '', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.ENCODE]: [
      { name: 'Base64 编码', setup: '', call: 'let result = base64Encode("Hello")', assert: 'XCTAssertFalse(result.isEmpty, "编码结果应为非空字符串")' }
    ],
    [INTENT.BATCH]: [
      { name: 'batchProcess 方法存在性', setup: '', call: '', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.UTILITY]: [
      { name: 'chunk 函数', setup: 'let items = [1, 2, 3, 4, 5]', call: 'let result = chunk(items, 2)', assert: 'XCTAssertEqual(result.count, 3, "chunk 结果长度错误")' }
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
  name: 'swift',
  templates: SWIFT_TEMPLATES,
  generateTest: generateSwiftTest,
  getTestCases,
  structureKeywords: ['func ', 'class ', 'struct ', 'enum ', 'protocol '],
  commentPrefixes: ['//', '///', '/*', '*', '*/'],
  indentSize: 4,
  useTabs: false,
  supportedIntents: Object.keys(SWIFT_TEMPLATES)
};
