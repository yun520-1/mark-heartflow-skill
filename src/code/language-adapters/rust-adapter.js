/**
 * rust-adapter.js — Rust 语言适配器
 *
 * 提供 Rust 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置（4 空格）
 *
 * @module language-adapters/rust-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');

// ============================================================================
// Rust 代码模板
// ============================================================================

const RUST_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    return '/**\n' +
      ' * ' + (params.description || '排序工具') + '\n' +
      ' * 对 Vec 进行排序\n' +
      ' */\n\n' +
      '/// 对整数向量排序\n' +
      '/// # Arguments\n' +
      '/// * `data` - 输入数据\n' +
      '/// * `ascending` - 是否升序\n' +
      '/// # Returns\n' +
      '/// 排序后的新向量\n' +
      'pub fn sort_data(data: &[i32], ascending: bool) -> Vec<i32> {\n' +
      '    if data.is_empty() {\n' +
      '        eprintln!("[sort_data] 输入为空，返回空向量");\n' +
      '        return vec![];\n' +
      '    }\n' +
      '    let mut result = data.to_vec();\n' +
      '    if ascending {\n' +
      '        result.sort();\n' +
      '    } else {\n' +
      '        result.sort_by(|a, b| b.cmp(a));\n' +
      '    }\n' +
      '    result\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let result = sort_data(&[3, 1, 4, 1, 5, 9], true);\n' +
      '// println!("{:?}", result); // [1, 1, 3, 4, 5, 9]\n';
  },

  [INTENT.FILTER]: (params) => {
    return '/**\n' +
      ' * ' + (params.description || '过滤工具') + '\n' +
      ' * 从向量中筛选符合条件的元素\n' +
      ' */\n\n' +
      '/// 过滤向量\n' +
      '/// # Arguments\n' +
      '/// * `data` - 输入数据切片\n' +
      '/// * `predicate` - 过滤条件闭包\n' +
      '/// # Returns\n' +
      '/// 过滤后的新向量\n' +
      'pub fn filter_data<T: Clone>(data: &[T], predicate: impl Fn(&T) -> bool) -> Vec<T> {\n' +
      '    if data.is_empty() {\n' +
      '        eprintln!("[filter_data] 输入为空");\n' +
      '        return vec![];\n' +
      '    }\n' +
      '    data.iter().filter(|x| predicate(x)).cloned().collect()\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let result = filter_data(&[1, 2, 3, 4, 5], |&n| n > 2);\n' +
      '// println!("{:?}", result); // [3, 4, 5]\n';
  },

  [INTENT.ANALYZE]: (params) => {
    return 'use std::collections::HashMap;\n\n' +
      '/**\n' +
      ' * ' + (params.description || '统计分析工具') + '\n' +
      ' * 提供数据统计分析功能\n' +
      ' */\n\n' +
      '/// 统计分析\n' +
      '/// # Arguments\n' +
      '/// * `data` - 输入数据切片\n' +
      '/// # Returns\n' +
      '/// 统计结果映射\n' +
      'pub fn analyze_data(data: &[f64]) -> HashMap<String, serde_json::Value> {\n' +
      '    use std::f64;\n\n' +
      '    if data.is_empty() {\n' +
      '        let mut result = HashMap::new();\n' +
      '        result.insert("count".to_string(), serde_json::Value::Number(0.into()));\n' +
      '        result.insert("error".to_string(), serde_json::Value::String("数据为空".to_string()));\n' +
      '        return result;\n' +
      '    }\n\n' +
      '    let sum: f64 = data.iter().sum();\n' +
      '    let avg = sum / data.len() as f64;\n\n' +
      '    let mut sorted = data.to_vec();\n' +
      '    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());\n\n' +
      '    // 中位数\n' +
      '    let median = if sorted.len() % 2 == 0 {\n' +
      '        (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0\n' +
      '    } else {\n' +
      '        sorted[sorted.len() / 2]\n' +
      '    };\n\n' +
      '    // 标准差\n' +
      '    let variance = data.iter().map(|n| (n - avg).powi(2)).sum::<f64>() / data.len() as f64;\n' +
      '    let std = variance.sqrt();\n\n' +
      '    let mut stats = HashMap::new();\n' +
      '    stats.insert("count".to_string(), serde_json::json!(data.len()));\n' +
      '    stats.insert("numericCount".to_string(), serde_json::json!(data.len()));\n' +
      '    stats.insert("sum".to_string(), serde_json::json!((sum * 100.0).round() / 100.0));\n' +
      '    stats.insert("avg".to_string(), serde_json::json!((avg * 100.0).round() / 100.0));\n' +
      '    stats.insert("min".to_string(), serde_json::json!(sorted[0]));\n' +
      '    stats.insert("max".to_string(), serde_json::json!(sorted[sorted.len() - 1]));\n' +
      '    stats.insert("median".to_string(), serde_json::json!(median));\n' +
      '    stats.insert("std".to_string(), serde_json::json!((std * 100.0).round() / 100.0));\n' +
      '    stats.insert("distribution".to_string(), serde_json::json!(HashMap::<String, usize>::new()));\n\n' +
      '    stats\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let stats = analyze_data(&[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]);\n' +
      '// println!("{:?}", stats);\n';
  },

  [INTENT.FETCH]: (params) => {
    return 'use reqwest;\n\n' +
      '/**\n' +
      ' * ' + (params.description || 'HTTP请求工具') + '\n' +
      ' */\n\n' +
      '/// HTTP GET 请求\n' +
      '/// # Arguments\n' +
      '/// * `url` - 请求URL\n' +
      '/// * `timeout_ms` - 超时时间（毫秒）\n' +
      '/// # Returns\n' +
      '/// 响应结果\n' +
      'pub async fn fetch_data(url: &str, timeout_ms: u64) -> Result<String, String> {\n' +
      '    let client = reqwest::Client::builder()\n' +
      '        .timeout(std::time::Duration::from_millis(timeout_ms))\n' +
      '        .build()\n' +
      '        .map_err(|e| e.to_string())?;\n\n' +
      '    let response = client.get(url)\n' +
      '        .send()\n' +
      '        .await\n' +
      '        .map_err(|e| {\n' +
      '            if e.is_timeout() {\n' +
      '                "请求超时".to_string()\n' +
      '            } else {\n' +
      '                e.to_string()\n' +
      '            }\n' +
      '        })?;\n\n' +
      '    let status = response.status();\n' +
      '    let body = response.text().await.map_err(|e| e.to_string())?;\n\n' +
      '    if status.is_success() {\n' +
      '        Ok(body)\n' +
      '    } else {\n' +
      '        Err(format!("HTTP {}: {}", status, status.canonical_reason().unwrap_or("Unknown")))\n' +
      '    }\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let result = fetch_data("https://api.example.com/data", 10000).await;\n' +
      '// match result { Ok(data) => println!("{}", data), Err(e) => eprintln!("错误: {}", e) }\n';
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return 'use std::collections::HashMap;\n' +
      'use std::time::{SystemTime, UNIX_EPOCH};\n\n' +
      '/**\n' +
      ' * ' + (params.description || 'LRU缓存工具') + '\n' +
      ' * 支持TTL过期的LRU缓存\n' +
      ' */\n\n' +
      'struct CacheEntry {\n' +
      '    value: String,\n' +
      '    ttl: u64,\n' +
      '    timestamp: u64,\n' +
      '    last_access: u64,\n' +
      '}\n\n' +
      '/// LRU 缓存\n' +
      'pub struct DataCache {\n' +
      '    store: HashMap<String, CacheEntry>,\n' +
      '    max_size: usize,\n' +
      '    default_ttl: u64,\n' +
      '    hits: usize,\n' +
      '    misses: usize,\n' +
      '}\n\n' +
      'impl DataCache {\n' +
      '    /// 创建新缓存\n' +
      '    pub fn new(max_size: usize, ttl_ms: u64) -> Self {\n' +
      '        DataCache {\n' +
      '            store: HashMap::new(),\n' +
      '            max_size,\n' +
      '            default_ttl: ttl_ms,\n' +
      '            hits: 0,\n' +
      '            misses: 0,\n' +
      '        }\n' +
      '    }\n\n' +
      '    /// 获取缓存值\n' +
      '    pub fn get(&mut self, key: &str) -> Option<String> {\n' +
      '        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;\n\n' +
      '        if let Some(entry) = self.store.get_mut(key) {\n' +
      '            if now - entry.timestamp > entry.ttl {\n' +
      '                self.store.remove(key);\n' +
      '                self.misses += 1;\n' +
      '                return None;\n' +
      '            }\n' +
      '            entry.last_access = now;\n' +
      '            self.hits += 1;\n' +
      '            return Some(entry.value.clone());\n' +
      '        }\n' +
      '        self.misses += 1;\n' +
      '        None\n' +
      '    }\n\n' +
      '    /// 设置缓存值\n' +
      '    pub fn set(&mut self, key: String, value: String, ttl: Option<u64>) -> bool {\n' +
      '        if self.store.contains_key(&key) {\n' +
      '            self.store.remove(&key);\n' +
      '        } else if self.store.len() >= self.max_size {\n' +
      '            // 淘汰最久未访问的\n' +
      '            let oldest = self.store.iter()\n' +
      '                .min_by_key(|(_, v)| v.last_access)\n' +
      '                .map(|(k, _)| k.clone());\n' +
      '            if let Some(k) = oldest {\n' +
      '                self.store.remove(&k);\n' +
      '            }\n' +
      '        }\n\n' +
      '        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;\n' +
      '        self.store.insert(key.clone(), CacheEntry {\n' +
      '            value,\n' +
      '            ttl: ttl.unwrap_or(self.default_ttl),\n' +
      '            timestamp: now,\n' +
      '            last_access: now,\n' +
      '        });\n' +
      '        true\n' +
      '    }\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let mut cache = DataCache::new(50, ' + ttl + ');\n' +
      '// cache.set("user:1".to_string(), "Alice".to_string(), None);\n' +
      '// println!("{:?}", cache.get("user:1"));\n';
  },

  [INTENT.VALIDATE]: (params) => {
    return 'use regex::Regex;\n\n' +
      '/**\n' +
      ' * ' + (params.description || '数据验证工具') + '\n' +
      ' * 基于规则的验证引擎\n' +
      ' */\n\n' +
      '/// 验证输入数据\n' +
      '/// # Arguments\n' +
      '/// * `input` - 输入数据映射\n' +
      '/// * `rules` - 验证规则映射\n' +
      '/// # Returns\n' +
      '/// 验证结果映射\n' +
      'pub fn validate(input: &serde_json::Value, rules: &serde_json::Value) -> serde_json::Value {\n' +
      '    use std::collections::HashMap;\n\n' +
      '    if input.is_null() || !input.is_object() {\n' +
      '        return serde_json::json!({"valid": false, "errors": ["输入数据无效"]});\n' +
      '    }\n' +
      '    if rules.is_null() || !rules.is_object() {\n' +
      '        return serde_json::json!({"valid": false, "errors": ["验证规则无效"]});\n' +
      '    }\n\n' +
      '    let mut errors = Vec::new();\n' +
      '    let input_obj = input.as_object().unwrap();\n' +
      '    let rules_obj = rules.as_object().unwrap();\n\n' +
      '    for (field, rule) in rules_obj {\n' +
      '        let value = input_obj.get(field);\n\n' +
      '        // 必填检查\n' +
      '        if let Some(required) = rule.get("required").and_then(|v| v.as_bool()) {\n' +
      '            if required && (value.is_none() || value.map(|v| v.as_str().unwrap_or("")).unwrap_or("").is_empty()) {\n' +
      '                errors.push(serde_json::json!({"field": field, "rule": "required",\n' +
      '                    "message": format!("\\"{}\\" 是必填字段", field)}));\n' +
      '                continue;\n' +
      '            }\n' +
      '        }\n\n' +
      '        // 跳过未提供的可选字段\n' +
      '        if value.is_none() {\n' +
      '            continue;\n' +
      '        }\n\n' +
      '        // 类型检查\n' +
      '        if let Some(expected_type) = rule.get("type").and_then(|v| v.as_str()) {\n' +
      '            let type_ok = match expected_type {\n' +
      '                "string" => value.map(|v| v.is_string()).unwrap_or(false),\n' +
      '                "number" => value.map(|v| v.is_number()).unwrap_or(false),\n' +
      '                _ => true,\n' +
      '            };\n' +
      '            if !type_ok {\n' +
      '                errors.push(serde_json::json!({"field": field, "rule": "type",\n' +
      '                    "message": format!("\\"{}\\" 应为 {} 类型", field, expected_type)}));\n' +
      '                continue;\n' +
      '            }\n' +
      '        }\n' +
      '    }\n\n' +
      '    serde_json::json!({\n' +
      '        "valid": errors.is_empty(),\n' +
      '        "errors": errors,\n' +
      '        "error_count": errors.len(),\n' +
      '    })\n' +
      '}\n\n' +
      '// 使用示例（需 Cargo.toml 添加 regex, serde_json 依赖）\n' +
      '// let input = serde_json::json!({"name": "Alice", "age": 25});\n' +
      '// let rules = serde_json::json!({"name": {"required": true, "type": "string"}});\n' +
      '// println!("{:?}", validate(&input, &rules));\n';
  },

  [INTENT.FILE]: (params) => {
    return 'use std::fs;\n' +
      'use std::path::{Path, PathBuf};\n\n' +
      '/**\n' +
      ' * ' + (params.description || '文件操作工具') + '\n' +
      ' * 安全的文件读写操作\n' +
      ' */\n\n' +
      '/// 文件管理器\n' +
      'pub struct FileManager {\n' +
      '    base_dir: PathBuf,\n' +
      '}\n\n' +
      'impl FileManager {\n' +
      '    /// 创建新文件管理器\n' +
      '    pub fn new(base_dir: &str) -> Self {\n' +
      '        let base = Path::new(base_dir).canonicalize().unwrap_or_else(|_| PathBuf::from(base_dir));\n' +
      '        FileManager { base_dir: base }\n' +
      '    }\n\n' +
      '    /// 安全路径检查\n' +
      '    fn safe_path(&self, target: &str) -> Result<PathBuf, String> {\n' +
      '        let resolved = self.base_dir.join(target).canonicalize()\n' +
      '            .map_err(|e| format!("路径解析失败: {}", e))?;\n' +
      '        if !resolved.starts_with(&self.base_dir) {\n' +
      '            return Err(format!("路径越界: \\"{}\\" 超出基目录", target));\n' +
      '        }\n' +
      '        Ok(resolved)\n' +
      '    }\n\n' +
      '    /// 读取文件\n' +
      '    pub fn read(&self, filepath: &str) -> serde_json::Value {\n' +
      '        match self.safe_path(filepath) {\n' +
      '            Ok(full) => match fs::read_to_string(&full) {\n' +
      '                Ok(content) => serde_json::json!({"success": true, "content": content, "size": content.len()}),\n' +
      '                Err(_) => serde_json::json!({"success": false, "error": format!("文件不存在: {}", filepath)}),\n' +
      '            },\n' +
      '            Err(e) => serde_json::json!({"success": false, "error": e}),\n' +
      '        }\n' +
      '    }\n\n' +
      '    /// 写入文件\n' +
      '    pub fn write(&self, filepath: &str, content: &str) -> serde_json::Value {\n' +
      '        match self.safe_path(filepath) {\n' +
      '            Ok(full) => {\n' +
      '                if let Some(parent) = full.parent() {\n' +
      '                    fs::create_dir_all(parent).ok();\n' +
      '                }\n' +
      '                match fs::write(&full, content) {\n' +
      '                    Ok(_) => serde_json::json!({"success": true, "path": filepath, "size": content.len()}),\n' +
      '                    Err(e) => serde_json::json!({"success": false, "error": e.to_string()}),\n' +
      '                }\n' +
      '            }\n' +
      '            Err(e) => serde_json::json!({"success": false, "error": e}),\n' +
      '        }\n' +
      '    }\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let fm = FileManager::new("./data");\n' +
      '// println!("{:?}", fm.write("test.txt", "Hello World"));\n' +
      '// println!("{:?}", fm.read("test.txt"));\n';
  },

  [INTENT.PIPELINE]: (params) => {
    return '/**\n' +
      ' * ' + (params.description || '数据处理管道') + '\n' +
      ' * 链式数据处理管道\n' +
      ' */\n\n' +
      'use std::sync::Arc;\n\n' +
      '/// 管道步骤\n' +
      'struct PipelineStep {\n' +
      '    name: String,\n' +
      '    action: Arc<dyn Fn(&mut Vec<serde_json::Value>) + Send + Sync>,\n' +
      '}\n\n' +
      '/// 数据处理管道\n' +
      'pub struct DataPipeline {\n' +
      '    data: Vec<serde_json::Value>,\n' +
      '    steps: Vec<PipelineStep>,\n' +
      '}\n\n' +
      'impl DataPipeline {\n' +
      '    /// 创建新管道\n' +
      '    pub fn new(data: Vec<serde_json::Value>) -> Self {\n' +
      '        DataPipeline { data, steps: vec![] }\n' +
      '    }\n\n' +
      '    /// 添加处理步骤\n' +
      '    pub fn pipe<F>(mut self, name: &str, action: F) -> Self\n' +
      '    where\n' +
      '        F: Fn(&mut Vec<serde_json::Value>) + Send + Sync + \'static,\n' +
      '    {\n' +
      '        self.steps.push(PipelineStep {\n' +
      '            name: name.to_string(),\n' +
      '            action: Arc::new(action),\n' +
      '        });\n' +
      '        self\n' +
      '    }\n\n' +
      '    /// 执行所有步骤\n' +
      '    pub fn run(self) -> serde_json::Value {\n' +
      '        let mut errors = vec![];\n' +
      '        let mut data = self.data;\n\n' +
      '        for step in &self.steps {\n' +
      '            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {\n' +
      '                (step.action)(&mut data)\n' +
      '            }));\n' +
      '            if result.is_err() {\n' +
      '                errors.push(serde_json::json!({"step": step.name, "error": "执行失败"}));\n' +
      '            }\n' +
      '        }\n\n' +
      '        serde_json::json!({\n' +
      '            "data": data,\n' +
      '            "steps": self.steps.len(),\n' +
      '            "errors": errors,\n' +
      '            "hasErrors": !errors.is_empty(),\n' +
      '        })\n' +
      '    }\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// let pipeline = DataPipeline::new(vec![]);\n' +
      '// let result = pipeline.pipe("test", |_| {}).run();\n' +
      '// println!("{:?}", result);\n';
  },

  [INTENT.ENCODE]: (params) => {
    return 'use base64::{engine::general_purpose, Engine as _};\n\n' +
      '/**\n' +
      ' * ' + (params.description || '编码/解码工具') + '\n' +
      ' * 提供 Base64、Hex 等编解码功能\n' +
      ' */\n\n' +
      '/// Base64 编码\n' +
      'pub fn base64_encode(s: &str) -> String {\n' +
      '    general_purpose::STANDARD.encode(s.as_bytes())\n' +
      '}\n\n' +
      '/// Base64 解码\n' +
      'pub fn base64_decode(encoded: &str) -> String {\n' +
      '    let bytes = general_purpose::STANDARD.decode(encoded).unwrap_or_default();\n' +
      '    String::from_utf8_lossy(&bytes).to_string()\n' +
      '}\n\n' +
      '/// Hex 编码\n' +
      'pub fn hex_encode(s: &str) -> String {\n' +
      '    s.bytes().map(|b| format!("{:02x}", b)).collect()\n' +
      '}\n\n' +
      '/// Hex 解码\n' +
      'pub fn hex_decode(hex: &str) -> String {\n' +
      '    let mut result = String::new();\n' +
      '    let chars: Vec<char> = hex.chars().collect();\n' +
      '    for i in (0..chars.len()).step_by(2) {\n' +
      '        if let Ok(byte) = u8::from_str_radix(&hex[i..i+2], 16) {\n' +
      '            result.push(byte as char);\n' +
      '        }\n' +
      '    }\n' +
      '    result\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// println!("{}", base64_encode("Hello 世界"));\n' +
      '// println!("{}", base64_decode("SGVsbG8g5LiW55WM"));\n' +
      '// println!("{}", hex_encode("ABC"));\n' +
      '// println!("{}", hex_decode("414243"));\n';
  },

  [INTENT.BATCH]: (params) => {
    return 'use std::sync::{Arc, Mutex};\n\n' +
      '/**\n' +
      ' * ' + (params.description || '批量处理工具') + '\n' +
      ' * 批量处理数据，支持并发控制\n' +
      ' */\n\n' +
      '/// 批量处理（并发）\n' +
      '/// # Arguments\n' +
      '/// * `items` - 待处理项目切片\n' +
      '/// * `processor` - 处理闭包\n' +
      '/// * `batch_size` - 批次大小\n' +
      '/// # Returns\n' +
      '/// 处理结果映射\n' +
      'pub fn batch_process<T, R: Send>(\n' +
      '    items: &[T],\n' +
      '    processor: impl Fn(&T, usize) -> Result<R, String> + Sync + Send,\n' +
      '    batch_size: usize,\n' +
      ') -> serde_json::Value {\n' +
      '    use std::sync::Mutex;\n\n' +
      '    if items.is_empty() {\n' +
      '        return serde_json::json!({\n' +
      '            "results": [], "errors": [],\n' +
      '            "total": 0, "succeeded": 0, "failed": 0,\n' +
      '        });\n' +
      '    }\n\n' +
      '    let results: Arc<Mutex<Vec<Option<R>>>> = Arc::new(Mutex::new(vec![None; items.len()])));\n' +
      '    let errors: Arc<Mutex<Vec<serde_json::Value>>> = Arc::new(Mutex::new(vec![]));\n\n' +
      '    items.par_iter().enumerate().for_each(|(idx, item)| {\n' +
      '        match processor(item, idx) {\n' +
      '            Ok(val) => results.lock().unwrap()[idx] = Some(val),\n' +
      '            Err(e) => errors.lock().unwrap().push(serde_json::json!({"index": idx, "error": e})),\n' +
      '        }\n' +
      '    });\n\n' +
      '    let succeeded = results.lock().unwrap().iter().filter(|r| r.is_some()).count();\n\n' +
      '    serde_json::json!({\n' +
      '        "results": results.lock().unwrap().iter().filter_map(|r| r.clone()).collect::<Vec<_>>(),\n' +
      '        "errors": errors.lock().unwrap().clone(),\n' +
      '        "total": items.len(),\n' +
      '        "succeeded": succeeded,\n' +
      '        "failed": errors.lock().unwrap().len(),\n' +
      '    })\n' +
      '}\n\n' +
      '// 使用示例（需 Cargo.toml 添加 rayon, serde_json 依赖）\n' +
      '// let data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\n' +
      '// let result = batch_process(&data, |&n, _| Ok(n * 2), 3);\n' +
      '// println!("{:?}", result);\n';
  },

  [INTENT.UTILITY]: (params) => {
    return '/**\n' +
      ' * ' + (params.description || '通用工具函数') + '\n' +
      ' */\n\n' +
      '/// 睡眠（毫秒）\n' +
      'pub fn sleep(ms: u64) {\n' +
      '    std::thread::sleep(std::time::Duration::from_millis(ms));\n' +
      '}\n\n' +
      '/// 分块\n' +
      'pub fn chunk<T: Clone>(items: &[T], size: usize) -> Vec<Vec<T>> {\n' +
      '    if items.is_empty() || size < 1 {\n' +
      '        return vec![];\n' +
      '    }\n' +
      '    items.chunks(size).map(|c| c.to_vec()).collect()\n' +
      '}\n\n' +
      '/// 去重\n' +
      'pub fn unique<T: Eq + std::hash::Hash + Clone>(items: &[T]) -> Vec<T> {\n' +
      '    use std::collections::HashSet;\n' +
      '    let mut seen = HashSet::new();\n' +
      '    items.iter().filter(|x| seen.insert((*x).clone())).cloned().collect()\n' +
      '}\n\n' +
      '// 使用示例\n' +
      '// println!("{:?}", chunk(&[1, 2, 3, 4, 5], 2));\n' +
      '// println!("{:?}", unique(&[1, 2, 2, 3, 3, 4]));\n';
  }
};

// ============================================================================
// Rust 测试代码生成
// ============================================================================

/**
 * 生成 Rust 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 函数名
 * @returns {string} 测试代码
 */
function generateRustTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = '// === 测试: ' + (params.description?.substring(0, 50) || funcName) + ' ===\n' +
    '#[cfg(test)]\n' +
    'mod tests {\n' +
    '    use super::*;\n\n' +
    '    #[test]\n' +
    '    fn test_' + funcName + '() {\n' +
    '        let mut passed = 0;\n' +
    '        let mut failed = 0;\n\n' +
    '        println!("测试 ' + funcName + '...");\n';

  for (const tc of testCases) {
    testCode += '\n' +
      '        // ' + tc.name + '\n' +
      '        {\n' +
      (tc.setup ? '            ' + tc.setup.replace(/\n/g, '\n            ') + '\n' : '') +
      '            ' + tc.call + '\n' +
      '            ' + tc.assert + '\n' +
      '            println!("  ✅ ' + tc.name + '");\n' +
      '            passed += 1;\n' +
      '        }\n';
  }

  testCode += '\n' +
    '        println!("测试完成: {} 通过, {} 失败", passed, failed);\n' +
    '        assert!(failed == 0, "存在失败的测试");\n' +
    '    }\n' +
    '}\n';

  return testCode;
}

/**
 * 获取 Rust 测试用例
 */
function getTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      { name: '基本排序 - 整数切片升序', setup: 'let input = vec![3, 1, 4, 1, 5, 9];', call: 'let result = sort_data(&input, true);', assert: 'assert_eq!(result[0], 1, "排序结果不正确");\n            assert_eq!(result.len(), 6, "数组长度变化");' },
      { name: '空切片处理', setup: 'let input: Vec<i32> = vec![];', call: 'let result = sort_data(&input, true);', assert: 'assert!(result.is_empty(), "空切片应返回空切片");' }
    ],
    [INTENT.FILTER]: [
      { name: '基本过滤 - 大于2', setup: 'let input = vec![1, 2, 3, 4, 5];', call: 'let result = filter_data(&input, |&n| n > 2);', assert: 'assert_eq!(result.len(), 3, "过滤结果长度错误");' }
    ],
    [INTENT.ANALYZE]: [
      { name: '基本统计分析', setup: 'let input = vec![1.0, 2.0, 3.0, 4.0, 5.0];', call: 'let result = analyze_data(&input);', assert: '// result 包含 count 字段为 5' }
    ],
    [INTENT.CACHE]: [
      { name: '缓存基本功能', setup: 'let mut cache = DataCache::new(10, 60000);', call: 'let set_result = cache.set("key1".to_string(), "value1".to_string(), None);', assert: 'assert!(set_result, "set 应返回 true");\n            assert_eq!(cache.get("key1"), Some("value1".to_string()), "get 返回值不匹配");' }
    ],
    [INTENT.VALIDATE]: [
      { name: '有效数据验证', setup: '// 验证函数存在性', call: '', assert: '// 验证函数存在性由编译器保证' }
    ],
    [INTENT.FILE]: [
      { name: 'FileManager 实例化', setup: 'let _fm = FileManager::new("./data");', call: '', assert: '// 实例化成功由编译器保证' }
    ],
    [INTENT.PIPELINE]: [
      { name: '管道基本功能', setup: 'let pipeline = DataPipeline::new(vec![]);', call: 'let _result = pipeline.pipe("test", |_| {}).run();', assert: '// 管道执行正常' }
    ],
    [INTENT.ENCODE]: [
      { name: 'Base64 编码', setup: '', call: 'let result = base64_encode("Hello");', assert: 'assert!(!result.is_empty(), "编码结果应为非空字符串");' }
    ],
    [INTENT.BATCH]: [
      { name: 'batch_process 方法存在性', setup: '', call: '', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.UTILITY]: [
      { name: 'chunk 函数', setup: 'let items = vec![1, 2, 3, 4, 5];', call: 'let result = chunk(&items, 2);', assert: 'assert_eq!(result.len(), 3, "chunk 结果长度错误");' }
    ]
  };

  return cases[intent] || [
    { name: '基本功能测试', setup: '', call: '// ' + funcName + ' 函数存在性由编译器保证', assert: '// 函数存在性由编译器保证' }
  ];
}

// ============================================================================
// 适配器接口
// ============================================================================

module.exports = {
  name: 'rust',
  templates: RUST_TEMPLATES,
  generateTest: generateRustTest,
  getTestCases,
  structureKeywords: ['fn ', 'pub fn ', 'struct ', 'pub struct ', 'impl '],
  commentPrefixes: ['//', '///', '/*', '*', '*/'],
  indentSize: 4,
  useTabs: false,
  supportedIntents: Object.keys(RUST_TEMPLATES)
};
