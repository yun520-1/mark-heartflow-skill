/**
 * python-adapter.js — Python 语言适配器
 *
 * 提供 Python 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置
 *
 * @module language-adapters/python-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');

// ============================================================================
// Python 代码模板
// ============================================================================

const PYTHON_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    return `def sort_data(data, key=None, ascending=True):
    """
    ${params.description || '排序函数'}

    Args:
        data: 输入数据列表
        key: 排序字段（数据为字典时使用）
        ascending: 升序/降序

    Returns:
        排序后的新列表
    """
    if not isinstance(data, list):
        print('[sort_data] 输入不是列表')
        return []
    if not data:
        return []

    if key:
        def sort_key(item):
            v = item.get(key, '') if isinstance(item, dict) else item
            return v if v is not None else ''
        return sorted(data, key=sort_key, reverse=not ascending)
    else:
        return sorted(data, reverse=not ascending)


# 使用示例
# result = sort_data([3, 1, 4, 1, 5, 9])
# print(result)  # [1, 1, 3, 4, 5, 9]
`;
  },

  [INTENT.FILTER]: (params) => {
    const condition = params.condition || 'item is not None';
    return `def filter_data(data, predicate=None):
    """
    ${params.description || '过滤函数'}

    Args:
        data: 输入数据列表
        predicate: 过滤条件函数 (item) -> bool

    Returns:
        过滤后的列表
    """
    if not isinstance(data, list):
        print('[filter_data] 输入不是列表')
        return []

    if predicate is None:
        predicate = lambda item: ${condition}

    return [item for item in data if predicate(item)]


# 使用示例
# result = filter_data([1, 2, 3, 4, 5], lambda n: n > 2)
# print(result)  # [3, 4, 5]
`;
  },

  [INTENT.ANALYZE]: (params) => {
    const field = params.field || null;
    return `import statistics
from collections import Counter


def analyze_data(data, field=None):
    """
    ${params.description || '统计分析'}

    Args:
        data: 输入数据列表
        field: 统计字段（数据为字典时使用）

    Returns:
        统计结果字典
    """
    if not isinstance(data, list) or not data:
        return {'count': 0, 'error': '数据为空'}

    # 提取数值
    if field:
        numbers = [d[field] for d in data if isinstance(d, dict) and field in d and isinstance(d[field], (int, float))]
    else:
        numbers = [d for d in data if isinstance(d, (int, float))]

    stats = {
        'count': len(data),
        'numeric_count': len(numbers),
        'sum': sum(numbers) if numbers else 0,
        'avg': None,
        'min': None,
        'max': None,
        'median': None,
        'std': None,
        'distribution': {}
    }

    if numbers:
        stats['avg'] = round(sum(numbers) / len(numbers), 2)
        stats['min'] = min(numbers)
        stats['max'] = max(numbers)
        stats['median'] = statistics.median(numbers)
        stats['std'] = round(statistics.stdev(numbers), 2) if len(numbers) > 1 else 0

    return stats


# 使用示例
# stats = analyze_data([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
# print(stats)
`;
  },

  [INTENT.FETCH]: (params) => {
    return `import urllib.request
import urllib.parse
import json


def fetch_data(url='${params.url || 'https://api.example.com/data'}', method='GET', headers=None, body=None, timeout=10):
    """
    ${params.description || 'HTTP请求'}

    Args:
        url: 请求URL
        method: HTTP方法
        headers: 请求头
        body: 请求体
        timeout: 超时时间（秒）

    Returns:
        响应数据字典
    """
    if headers is None:
        headers = {'Content-Type': 'application/json'}

    try:
        if method.upper() == 'GET':
            req = urllib.request.Request(url, headers=headers)
        else:
            data_bytes = json.dumps(body).encode() if body else None
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method.upper())

        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.status
            text = response.read().decode('utf-8')
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                data = text
            return {'success': True, 'data': data, 'status': status}
    except Exception as e:
        error_msg = str(e)
        if 'timed out' in error_msg.lower():
            return {'success': False, 'error': '请求超时', 'timeout': timeout}
        return {'success': False, 'error': error_msg}


# 使用示例
# result = fetch_data('https://jsonplaceholder.typicode.com/todos/1')
# if result['success']:
#     print(result['data'])
`;
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return `import time
from collections import OrderedDict


class DataCache:
    """
    ${params.description || '缓存工具'}
    LRU缓存，支持TTL过期
    """

    def __init__(self, max_size=100, ttl=${ttl}):
        self._store = OrderedDict()
        self.max_size = max_size
        self.default_ttl = ttl
        self._hits = 0
        self._misses = 0

    def get(self, key):
        if key not in self._store:
            self._misses += 1
            return None
        entry = self._store[key]
        if time.time() - entry['timestamp'] > entry['ttl']:
            del self._store[key]
            self._misses += 1
            return None
        self._hits += 1
        entry['last_access'] = time.time()
        self._store.move_to_end(key)
        return entry['value']

    def set(self, key, value, ttl=None):
        if key in self._store:
            del self._store[key]
        elif len(self._store) >= self.max_size:
            # 淘汰最久未访问的
            oldest_key = next(iter(self._store))
            del self._store[oldest_key]
        self._store[key] = {
            'value': value,
            'ttl': ttl or self.default_ttl,
            'timestamp': time.time(),
            'last_access': time.time()
        }
        return True

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self):
        self._store.clear()
        self._hits = 0
        self._misses = 0

    @property
    def stats(self):
        total = self._hits + self._misses
        return {
            'size': len(self._store),
            'max_size': self.max_size,
            'hits': self._hits,
            'misses': self._misses,
            'hit_rate': f"{round(self._hits / total * 100, 1)}%" if total > 0 else '0%',
            'keys': list(self._store.keys())
        }


# 使用示例
# cache = DataCache(max_size=50, ttl=30000)
# cache.set('user:1', {'name': 'Alice'})
# print(cache.get('user:1'))
# print(cache.stats)
`;
  },

  [INTENT.FILE]: (params) => {
    return `import os
import csv
from pathlib import Path


class FileManager:
    """
    ${params.description || '文件操作工具'}
    安全的文件读写操作
    """

    def __init__(self, base_dir=None):
        self.base_dir = Path(base_dir).resolve() if base_dir else Path.cwd()

    def _safe_path(self, target):
        resolved = (self.base_dir / target).resolve()
        if not str(resolved).startswith(str(self.base_dir)):
            raise PermissionError(f'路径越界: "{target}" 超出基目录 "{self.base_dir}"')
        return resolved

    def read(self, filepath, encoding='utf-8'):
        try:
            full = self._safe_path(filepath)
            if not full.exists():
                return {'success': False, 'error': f'文件不存在: {filepath}'}
            content = full.read_text(encoding=encoding)
            return {'success': True, 'content': content, 'size': len(content)}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def write(self, filepath, content, encoding='utf-8'):
        try:
            full = self._safe_path(filepath)
            full.parent.mkdir(parents=True, exist_ok=True)
            full.write_text(content, encoding=encoding)
            return {'success': True, 'path': str(filepath), 'size': len(content)}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def list(self, dir_path='.'):
        try:
            full = self._safe_path(dir_path)
            if not full.exists():
                return {'success': False, 'error': f'目录不存在: {dir_path}'}
            files = [p.name for p in full.iterdir() if p.is_file()]
            dirs = [p.name for p in full.iterdir() if p.is_dir()]
            return {'success': True, 'files': files, 'dirs': dirs, 'total': len(files) + len(dirs)}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def read_csv(self, filepath, has_header=True):
        try:
            full = self._safe_path(filepath)
            with open(full, 'r', encoding='utf-8') as f:
                if has_header:
                    reader = csv.DictReader(f)
                    return {'success': True, 'data': list(reader), 'count': len(list(reader))}
                else:
                    reader = csv.reader(f)
                    return {'success': True, 'data': list(reader), 'count': len(list(reader))}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def read_json(self, filepath):
        try:
            full = self._safe_path(filepath)
            with open(full, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {'success': True, 'data': data}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# 使用示例
# fm = FileManager('./data')
# fm.write('test.txt', 'Hello World')
# print(fm.read('test.txt'))
# print(fm.list('.'))
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `import re


def validate(input_data, rules):
    """
    ${params.description || '数据验证器'}

    Args:
        input_data: 输入数据（字典）
        rules: 验证规则字典

    Returns:
        验证结果字典
    """
    if not isinstance(input_data, dict):
        return {'valid': False, 'errors': ['输入数据无效']}
    if not isinstance(rules, dict):
        return {'valid': False, 'errors': ['验证规则无效']}

    errors = []

    for field, rule in rules.items():
        value = input_data.get(field)

        # 必填检查
        if rule.get('required') and (value is None or value == ''):
            errors.append({'field': field, 'rule': 'required', 'message': f'"{field}" 是必填字段'})
            continue

        # 跳过未提供的可选字段
        if value is None:
            continue

        # 类型检查
        expected_type = rule.get('type')
        if expected_type:
            if expected_type == 'array' and not isinstance(value, (list, tuple)):
                errors.append({'field': field, 'rule': 'type', 'message': f'"{field}" 应为 {expected_type} 类型'})
                continue
            elif expected_type == 'number' and not isinstance(value, (int, float)):
                errors.append({'field': field, 'rule': 'type', 'message': f'"{field}" 应为 {expected_type} 类型'})
                continue
            elif expected_type == 'string' and not isinstance(value, str):
                errors.append({'field': field, 'rule': 'type', 'message': f'"{field}" 应为 {expected_type} 类型'})
                continue

        # 范围检查（数字）
        if isinstance(value, (int, float)):
            min_val = rule.get('min')
            max_val = rule.get('max')
            if min_val is not None and value < min_val:
                errors.append({'field': field, 'rule': 'min', 'message': f'"{field}" 最小值为 {min_val}', 'actual': value})
            if max_val is not None and value > max_val:
                errors.append({'field': field, 'rule': 'max', 'message': f'"{field}" 最大值为 {max_val}', 'actual': value})

        # 长度检查（字符串/列表）
        if isinstance(value, (str, list, tuple)):
            min_len = rule.get('min_length')
            max_len = rule.get('max_length')
            if min_len is not None and len(value) < min_len:
                errors.append({'field': field, 'rule': 'min_length', 'message': f'"{field}" 最少 {min_len} 个字符'})
            if max_len is not None and len(value) > max_len:
                errors.append({'field': field, 'rule': 'max_length', 'message': f'"{field}" 最多 {max_len} 个字符'})

        # 正则检查
        pattern = rule.get('pattern')
        if pattern and isinstance(value, str) and not re.match(pattern, value):
            errors.append({'field': field, 'rule': 'pattern', 'message': f'"{field}" 格式不正确'})

        # 枚举检查
        enum_vals = rule.get('enum')
        if enum_vals and isinstance(enum_vals, (list, tuple)) and value not in enum_vals:
            errors.append({'field': field, 'rule': 'enum', 'message': f'"{field}" 必须是 {enum_vals} 之一'})

    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'error_count': len(errors),
        'passed': len(rules) - len(errors),
        'total': len(rules)
    }


# 使用示例
# result = validate(
#     {'name': 'Alice', 'age': 25, 'email': 'alice@example.com'},
#     {
#         'name': {'required': True, 'type': 'string', 'min_length': 2, 'max_length': 50},
#         'age': {'required': True, 'type': 'number', 'min': 0, 'max': 150},
#         'email': {'required': True, 'pattern': r'^[^@]+@[^@]+\\.[^@]+$'}
#     }
# )
# print(result)
`;
  }
};

// ============================================================================
// Python 测试代码生成
// ============================================================================

/**
 * 生成 Python 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 函数/类名
 * @returns {string} 测试代码
 */
function generatePythonTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = `# === 测试: ${params.description?.substring(0, 50) || funcName} ===

def test_${funcName}():
    """测试 ${funcName}"""
    print(f'测试 ${funcName}...')
    passed = 0
    failed = 0
`;

  for (const tc of testCases) {
    testCode += `
    # ${tc.name}
    try:
${tc.setup ? '        ' + tc.setup.replace(/\n/g, '\n        ') : ''}
        result = ${tc.call}
        ${tc.assert.replace(/\n/g, '\n        ')}
        print('  ✅ ${tc.name}')
        passed += 1
    except Exception as e:
        print(f'  ❌ ${tc.name}: {e}')
        failed += 1
`;
  }

  testCode += `
    print(f'测试完成: {passed} 通过, {failed} 失败')
    return {'passed': passed, 'failed': failed}

# 运行测试
# test_${funcName}()
`;
  return testCode;
}

/**
 * 获取 Python 测试用例
 */
function getTestCases(intent, funcName) {
  const jsCases = getJSTestCases(intent, funcName);

  // 将 JavaScript 测试用例转换为 Python 语法
  return jsCases.map(tc => {
    const pyTc = { name: tc.name };

    // JS setup → Python setup
    let setup = tc.setup || '';
    setup = setup.replace(/const /g, '');
    setup = setup.replace(/let /g, '');
    setup = setup.replace(/Array\.isArray\(([^)]+)\)/g, 'isinstance($1, list)');
    setup = setup.replace(/typeof ([^ ]+)/g, 'type($1)');
    setup = setup.replace(/===/g, '==');
    setup = setup.replace(/!==/g, '!=');
    setup = setup.replace(/\.length !== 0/g, 'len() != 0');
    setup = setup.replace(/\.length !== (\d+)/g, 'len() != $1');
    setup = setup.replace(/new DataCache\(([^)]+)\)/g, 'DataCache($1)');
    setup = setup.replace(/new FileManager\(([^)]+)\)/g, 'FileManager($1)');
    setup = setup.replace(/typeof FileManager/g, 'FileManager');
    pyTc.setup = setup;

    // JS call → Python call
    let call = tc.call;
    call = call.replace(/sortData\(([^,]+), false\)/g, 'sort_data($1, ascending=False)');
    call = call.replace(/filterData\(([^,]+), ([^)]+)\)/g, 'filter_data($1, $2)');
    call = call.replace(/sortData\(([^)]+)\)/g, 'sort_data($1)');
    call = call.replace(/analyzeData\(([^)]+)\)/g, 'analyze_data($1)');
    call = call.replace(/cache\.set\(([^,]+), ([^)]+)\)/g, 'cache.set($1, $2)');
    call = call.replace(/cache\.get\(([^)]+)\)/g, 'cache.get($1)');
    call = call.replace(/typeof fetchData/g, 'fetch_data');
    call = call.replace(/typeof plotBar/g, 'plot_bar');
    call = call.replace(/typeof plotLine/g, 'plot_line');
    call = call.replace(/typeof batchProcess/g, 'batch_process');
    call = call.replace(/typeof chunkProcess/g, 'chunk_process');
    call = call.replace(/deepClone\(([^)]+)\)/g, 'deep_clone($1)');
    call = call.replace(/chunk\(([^,]+), ([^)]+)\)/g, 'chunk($1, $2)');
    call = call.replace(/base64Encode\("Hello"\)/g, 'base64_encode("Hello")');
    call = call.replace(/base64Decode\(([^)]+)\)/g, 'base64_decode($1)');
    call = call.replace(/hexEncode\("ABC"\)/g, 'hex_encode("ABC")');
    call = call.replace(/hexDecode\("([^"]+)"\)/g, 'hex_decode("$1")');
    pyTc.call = call;

    // JS assert → Python assert
    let assert = tc.assert || '';
    assert = assert.replace(/Array\.isArray\(result\)/g, 'isinstance(result, list)');
    assert = assert.replace(/result\.length !== (\d+)/g, 'len(result) != $1');
    assert = assert.replace(/result\.length === (\d+)/g, 'len(result) == $1');
    assert = assert.replace(/result\[0\] !== (\d+)/g, 'result[0] != $1');
    assert = assert.replace(/result\[result\.length-1\] !== (\d+)/g, 'result[-1] != $1');
    assert = assert.replace(/result\[0\] === (\d+)/g, 'result[0] == $1');
    assert = assert.replace(/result !== (\d+)/g, 'result != $1');
    assert = assert.replace(/result === (\d+)/g, 'result == $1');
    assert = assert.replace(/result === undefined/g, 'result is None');
    assert = assert.replace(/result !== undefined/g, 'result is not None');
    assert = assert.replace(/result !== "([^"]+)"/g, 'result != "$1"');
    assert = assert.replace(/result === "([^"]+)"/g, 'result == "$1"');
    assert = assert.replace(/result === "([^"]+)"/g, 'result == "$1"');
    assert = assert.replace(/!==/g, '!=');
    assert = assert.replace(/===/g, '===');
    assert = assert.replace(/throw new Error\("([^"]+)"\)/g, 'raise AssertionError("$1")');
    assert = assert.replace(/throw new Error\('([^']+)'\)/g, 'raise AssertionError("$1")');
    assert = assert.replace(/if \(([^)]+)\) throw new Error\("([^"]+)"\)/g, 'if $1: raise AssertionError("$2")');
    assert = assert.replace(/\.every\(([^)]+)\)/g, 'all($1)');
    pyTc.assert = assert;

    return pyTc;
  });
}

// 获取 JS 测试用例（用于 Python 转换的原始数据）
function getJSTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      { name: '基本排序 - 数字数组升序', setup: 'const input = [3, 1, 4, 1, 5, 9];', call: 'sortData(input)', assert: 'if (!Array.isArray(result)) throw new Error("结果不是数组");\n    if (result[0] !== 1 || result[result.length-1] !== 9) throw new Error("排序结果不正确");\n    if (result.length !== 6) throw new Error("数组长度变化");' },
      { name: '空数组处理', setup: 'const input = [];', call: 'sortData(input)', assert: 'if (!Array.isArray(result)) throw new Error("空数组应返回空数组");\n    if (result.length !== 0) throw new Error("空数组结果长度不为0");' },
      { name: '降序排序', setup: 'const input = [3, 1, 4];', call: 'sortData(input, false)', assert: 'if (result[0] !== 4) throw new Error("降序排序失败");' }
    ],
    [INTENT.FILTER]: [
      { name: '基本过滤 - 大于2', setup: 'const input = [1, 2, 3, 4, 5];', call: 'filterData(input, n => n > 2)', assert: 'if (!Array.isArray(result)) throw new Error("结果不是数组");\n    if (result.length !== 3) throw new Error("过滤结果长度错误");\n    if (!result.every(n => n > 2)) throw new Error("过滤条件不满足");' },
      { name: '空数组', setup: 'const input = [];', call: 'filterData(input, n => n > 0)', assert: 'if (!Array.isArray(result)) throw new Error("空数组应返回数组");\n    if (result.length !== 0) throw new Error("空数组结果不为空");' }
    ],
    [INTENT.ANALYZE]: [
      { name: '基本统计分析', setup: 'const input = [1, 2, 3, 4, 5];', call: 'analyzeData(input)', assert: 'if (result.count !== 5) throw new Error("count 错误");\n    if (result.sum !== 15) throw new Error("sum 错误");\n    if (result.avg !== 3) throw new Error("avg 错误");\n    if (result.min !== 1) throw new Error("min 错误");\n    if (result.max !== 5) throw new Error("max 错误");' },
      { name: '空数组', setup: 'const input = [];', call: 'analyzeData(input)', assert: 'if (result.count !== 0) throw new Error("空数组 count 应为 0");' }
    ],
    [INTENT.FETCH]: [
      { name: '请求结构完整性', setup: '', call: 'typeof fetchData', assert: 'if (result !== "function") throw new Error("fetchData 应为一个函数");' }
    ],
    [INTENT.CACHE]: [
      { name: '缓存基本功能', setup: 'const cache = new DataCache({ maxSize: 10, ttl: 60000 });', call: 'cache.set("key1", "value1")', assert: 'if (result !== true) throw new Error("set 应返回 true");\n    const val = cache.get("key1");\n    if (val !== "value1") throw new Error("get 返回值不匹配");' },
      { name: '缓存未命中', setup: 'const cache = new DataCache({ maxSize: 10, ttl: 60000 });', call: 'cache.get("nonexistent")', assert: 'if (result !== undefined) throw new Error("不存在的键应返回 undefined");' }
    ],
    [INTENT.VALIDATE]: [
      { name: '有效数据验证', setup: 'const input = { name: "Alice", age: 25 };\n    const rules = { name: { required: true, type: "string" }, age: { required: true, type: "number", min: 0 } };', call: 'validate(input, rules)', assert: 'if (result.valid !== true) throw new Error("有效数据应验证通过");\n    if (result.errorCount !== 0) throw new Error("错误计数应为 0");' },
      { name: '无效数据验证', setup: 'const input = { name: "" };\n    const rules = { name: { required: true, minLength: 2 } };', call: 'validate(input, rules)', assert: 'if (result.valid !== false) throw new Error("无效数据应验证失败");' }
    ],
    [INTENT.FILE]: [
      { name: 'FileManager 实例化', setup: '', call: 'typeof FileManager', assert: 'if (result !== "function") throw new Error("FileManager 应为一个类");' }
    ],
    [INTENT.PIPELINE]: [
      { name: '管道基本功能', setup: 'const input = [1, 2, 3, 4, 5];\n    const pipeline = new DataPipeline(input);', call: 'pipeline.filter(n => n > 2).map(n => n * 2).run()', assert: 'if (!Array.isArray(result.data)) throw new Error("管道结果应为数组");\n    if (result.data.length !== 3) throw new Error("管道过滤长度错误");' }
    ],
    [INTENT.PLOT]: [
      { name: 'plotBar 参数验证', setup: '', call: 'typeof plotBar', assert: 'if (result !== "function") throw new Error("plotBar 应为一个函数");' },
      { name: 'plotLine 参数验证', setup: '', call: 'typeof plotLine', assert: 'if (result !== "function") throw new Error("plotLine 应为一个函数");' }
    ],
    [INTENT.ENCODE]: [
      { name: 'Base64 编码', setup: '', call: 'base64Encode("Hello")', assert: 'if (typeof result !== "string" || result.length === 0) throw new Error("编码结果应为非空字符串");' },
      { name: 'Base64 解码', setup: 'const encoded = base64Encode("Hello");', call: 'base64Decode(encoded)', assert: 'if (result !== "Hello") throw new Error("解码结果不匹配");' }
    ],
    [INTENT.BATCH]: [
      { name: 'batchProcess 函数存在性', setup: '', call: 'typeof batchProcess', assert: 'if (result !== "function") throw new Error("batchProcess 应为一个函数");' },
      { name: 'chunkProcess 函数存在性', setup: '', call: 'typeof chunkProcess', assert: 'if (result !== "function") throw new Error("chunkProcess 应为一个函数");' }
    ],
    [INTENT.UTILITY]: [
      { name: 'deepClone 基本功能', setup: 'const obj = { a: 1, b: { c: 2 } };', call: 'deepClone(obj)', assert: 'if (result.a !== 1) throw new Error("克隆值不匹配");\n    if (result.b.c !== 2) throw new Error("嵌套克隆不匹配");\n    if (result === obj) throw new Error("应返回新对象");' },
      { name: 'chunk 函数', setup: '', call: 'chunk([1,2,3,4,5], 2)', assert: 'if (result.length !== 3) throw new Error("chunk 结果长度错误");\n    if (result[0].length !== 2) throw new Error("chunk 第一块长度错误");' }
    ]
  };

  return cases[intent] || [
    {
      name: '基本功能测试',
      setup: '',
      call: `${funcName}()`
    }
  ];
}

// ============================================================================
// 适配器接口
// ============================================================================

module.exports = {
  name: 'python',
  templates: PYTHON_TEMPLATES,
  generateTest: generatePythonTest,
  getTestCases,
  structureKeywords: ['def ', 'class ', 'async def'],
  commentPrefixes: ['#', '"""', "'''"],
  indentSize: 4,
  useTabs: false,
  supportedIntents: Object.keys(PYTHON_TEMPLATES)
};
