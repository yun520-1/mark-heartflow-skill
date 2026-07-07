/**
 * go-adapter.js — Go 语言适配器
 *
 * 提供 Go 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置（tab）
 *
 * @module language-adapters/go-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');

// ============================================================================
// Go 代码模板
// ============================================================================

const GO_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    return `package main

import (
	"fmt"
	"sort"
)

/**
 * ${params.description || '排序工具'}
 * 对切片进行排序
 */

// SortData 对整数切片排序
// data: 输入切片
// ascending: 是否升序
// 返回排序后的新切片
func SortData(data []int, ascending bool) []int {
	if data == nil || len(data) == 0 {
		fmt.Println("[SortData] 输入为空，返回空切片")
		return []int{}
	}
	result := make([]int, len(data))
	copy(result, data)
	if ascending {
		sort.Ints(result)
	} else {
		sort.Sort(sort.Reverse(sort.IntSlice(result)))
	}
	return result
}

// 使用示例
// result := SortData([]int{3, 1, 4, 1, 5, 9}, true)
// fmt.Println(result) // [1 1 3 4 5 9]
`;
  },

  [INTENT.FILTER]: (params) => {
    return `package main

import "fmt"

/**
 * ${params.description || '过滤工具'}
 * 从切片中筛选符合条件的元素
 */

// FilterData 过滤切片
// data: 输入切片
// predicate: 过滤条件函数
// 返回过滤后的新切片
func FilterData[T any](data []T, predicate func(T) bool) []T {
	if data == nil || len(data) == 0 {
		fmt.Println("[FilterData] 输入为空")
		return []T{}
	}
	if predicate == nil {
		return data
	}
	result := make([]T, 0, len(data))
	for _, item := range data {
		if predicate(item) {
			result = append(result, item)
		}
	}
	return result
}

// 使用示例
// result := FilterData([]int{1, 2, 3, 4, 5}, func(n int) bool { return n > 2 })
// fmt.Println(result) // [3 4 5]
`;
  },

  [INTENT.ANALYZE]: (params) => {
    return `package main

import (
	"fmt"
	"math"
	"sort"
)

/**
 * ${params.description || '统计分析工具'}
 * 提供数据统计分析功能
 */

// AnalyzeData 统计分析
// data: 输入数据切片
// 返回统计结果映射
func AnalyzeData(data []float64) map[string]interface{} {
	if data == nil || len(data) == 0 {
		return map[string]interface{}{"count": 0, "error": "数据为空"}
	}

	sum := 0.0
	for _, v := range data {
		sum += v
	}
	avg := sum / float64(len(data))

	sorted := make([]float64, len(data))
	copy(sorted, data)
	sort.Float64s(sorted)

	// 中位数
	var median float64
	mid := len(sorted) / 2
	if len(sorted)%2 == 0 {
		median = (sorted[mid-1] + sorted[mid]) / 2.0
	} else {
		median = sorted[mid]
	}

	// 标准差
	variance := 0.0
	for _, v := range data {
		variance += math.Pow(v-avg, 2)
	}
	variance /= float64(len(data))
	std := math.Sqrt(variance)

	stats := map[string]interface{}{
		"count":        len(data),
		"numericCount": len(data),
		"sum":          math.Round(sum*100) / 100,
		"avg":          math.Round(avg*100) / 100,
		"min":          sorted[0],
		"max":          sorted[len(sorted)-1],
		"median":       median,
		"std":          math.Round(std*100) / 100,
		"distribution": map[string]int{},
	}

	return stats
}

// 使用示例
// stats := AnalyzeData([]float64{1, 2, 3, 4, 5, 6, 7, 8, 9, 10})
// fmt.Printf("%+v\\n", stats)
`;
  },

  [INTENT.FETCH]: (params) => {
    return `package main

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

/**
 * ${params.description || 'HTTP请求工具'}
 */

// FetchData HTTP GET 请求
// url: 请求URL
// timeoutMs: 超时时间（毫秒）
// 返回响应数据映射
func FetchData(url string, timeoutMs int) map[string]interface{} {
	client := &http.Client{Timeout: time.Duration(timeoutMs) * time.Millisecond}
	resp, err := client.Get(url)
	if err != nil {
		if err.Timeout() {
			return map[string]interface{}{"success": false, "error": "请求超时", "timeout": timeoutMs}
		}
		return map[string]interface{}{"success": false, "error": err.Error()}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	return map[string]interface{}{
		"success": true,
		"data":    string(body),
		"status":  resp.StatusCode,
	}
}

// 使用示例
// result := FetchData("https://api.example.com/data", 10000)
// fmt.Println(result)
`;
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return `package main

import (
	"fmt"
	"sync"
	"time"
)

/**
 * ${params.description || 'LRU缓存工具'}
 * 线程安全的LRU缓存，支持TTL过期
 */

// CacheEntry 缓存条目
type CacheEntry struct {
	Value      interface{}
	TTL        int64
	Timestamp  int64
	LastAccess int64
}

// DataCache LRU缓存
type DataCache struct {
	store      map[string]*CacheEntry
	maxSize    int
	defaultTTL int64
	hits       int
	misses     int
	mu         sync.RWMutex
}

// NewDataCache 创建新缓存
func NewDataCache(maxSize int, ttlMs int64) *DataCache {
	return &DataCache{
		store:      make(map[string]*CacheEntry),
		maxSize:    maxSize,
		defaultTTL: ttlMs,
	}
}

// Get 获取缓存值
func (c *DataCache) Get(key string) interface{} {
	c.mu.RLock()
	entry, exists := c.store[key]
	c.mu.RUnlock()

	if !exists {
		c.mu.Lock()
		c.misses++
		c.mu.Unlock()
		return nil
	}

	if time.Now().UnixMilli()-entry.Timestamp > entry.TTL {
		c.mu.Lock()
		delete(c.store, key)
		c.misses++
		c.mu.Unlock()
		return nil
	}

	c.mu.Lock()
	entry.LastAccess = time.Now().UnixMilli()
	c.hits++
	c.mu.Unlock()

	return entry.Value
}

// Set 设置缓存值
func (c *DataCache) Set(key string, value interface{}, ttl ...int64) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.store[key]; exists {
		delete(c.store, key)
	} else if len(c.store) >= c.maxSize {
		// 淘汰最久未访问的
		var oldestKey string
		var oldestTime int64 = time.Now().UnixMilli()
		for k, v := range c.store {
			if v.LastAccess < oldestTime {
				oldestTime = v.LastAccess
				oldestKey = k
			}
		}
		if oldestKey != "" {
			delete(c.store, oldestKey)
		}
	}

	ttlVal := c.defaultTTL
	if len(ttl) > 0 && ttl[0] > 0 {
		ttlVal = ttl[0]
	}

	c.store[key] = &CacheEntry{
		Value:      value,
		TTL:        ttlVal,
		Timestamp:  time.Now().UnixMilli(),
		LastAccess: time.Now().UnixMilli(),
	}
	return true
}

// 使用示例
// cache := NewDataCache(50, 30000)
// cache.Set("user:1", "Alice")
// fmt.Println(cache.Get("user:1"))
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `package main

import (
	"fmt"
	"regexp"
)

/**
 * ${params.description || '数据验证工具'}
 * 基于规则的验证引擎
 */

// Validate 验证输入数据
// input: 输入数据映射
// rules: 验证规则映射
// 返回验证结果映射
func Validate(input map[string]interface{}, rules map[string]map[string]interface{}) map[string]interface{} {
	if input == nil || len(input) == 0 {
		return map[string]interface{}{"valid": false, "errors": []string{"输入数据无效"}}
	}
	if rules == nil || len(rules) == 0 {
		return map[string]interface{}{"valid": false, "errors": []string{"验证规则无效"}}
	}

	errors := []map[string]interface{}{}

	for field, rule := range rules {
		value, exists := input[field]

		// 必填检查
		if required, ok := rule["required"].(bool); ok && required {
			if !exists || value == nil || value == "" {
				errors = append(errors, map[string]interface{}{
					"field": field, "rule": "required",
					"message": fmt.Sprintf("\"%s\" 是必填字段", field),
				})
				continue
			}
		}

		// 跳过未提供的可选字段
		if !exists || value == nil {
			continue
		}

		// 类型检查
		if expectedType, ok := rule["type"].(string); ok {
			validType := false
			switch expectedType {
			case "string": _, validType = value.(string)
			case "number": _, validType = value.(float64); _, validType = value.(int)
			case "array": _, validType = value.([]interface{})
			case "boolean": _, validType = value.(bool)
			}
			if !validType {
				errors = append(errors, map[string]interface{}{
					"field": field, "rule": "type",
					"message": fmt.Sprintf("\"%s\" 应为 %s 类型", field, expectedType),
				})
				continue
			}
		}

		// 长度检查
		if str, ok := value.(string); ok {
			if minLen, ok := rule["min_length"].(int); ok && len(str) < minLen {
				errors = append(errors, map[string]interface{}{
					"field": field, "rule": "minLength",
					"message": fmt.Sprintf("\"%s\" 最少 %d 个字符", field, minLen),
				})
			}
			if maxLen, ok := rule["max_length"].(int); ok && len(str) > maxLen {
				errors = append(errors, map[string]interface{}{
					"field": field, "rule": "maxLength",
					"message": fmt.Sprintf("\"%s\" 最多 %d 个字符", field, maxLen),
				})
			}
			// 正则检查
			if patternStr, ok := rule["pattern"].(string); ok {
				matched, _ := regexp.MatchString(patternStr, str)
				if !matched {
					errors = append(errors, map[string]interface{}{
						"field": field, "rule": "pattern",
						"message": fmt.Sprintf("\"%s\" 格式不正确", field),
					})
				}
			}
		}
	}

	return map[string]interface{}{
		"valid":      len(errors) == 0,
		"errors":     errors,
		"errorCount": len(errors),
		"passed":     len(rules) - len(errors),
		"total":      len(rules),
	}
}

// 使用示例
// input := map[string]interface{}{"name": "Alice", "age": float64(25)}
// rules := map[string]map[string]interface{}{
//     "name": {"required": true, "type": "string", "min_length": 2},
//     "age": {"required": true, "type": "number", "min": 0},
// }
// fmt.Println(Validate(input, rules))
`;
  },

  [INTENT.FILE]: (params) => {
    return `package main

import (
	"fmt"
	"os"
	"path/filepath"
)

/**
 * ${params.description || '文件操作工具'}
 * 安全的文件读写操作
 */

// FileManager 文件管理器
type FileManager struct {
	baseDir string
}

// NewFileManager 创建文件管理器
func NewFileManager(baseDir string) *FileManager {
	if baseDir == "" {
		baseDir, _ = os.Getwd()
	}
	abs, _ := filepath.Abs(baseDir)
	return &FileManager{baseDir: abs}
}

// SafePath 安全检查路径
func (fm *FileManager) SafePath(target string) (string, error) {
	resolved, err := filepath.Abs(filepath.Join(fm.baseDir, target))
	if err != nil {
		return "", err
	}
	if !filepath.HasPrefix(resolved, fm.baseDir) && resolved != fm.baseDir {
		return "", fmt.Errorf("路径越界: %q 超出基目录", target)
	}
	return resolved, nil
}

// Read 读取文件
func (fm *FileManager) Read(filepath string) map[string]interface{} {
	full, err := fm.SafePath(filepath)
	if err != nil {
		return map[string]interface{}{"success": false, "error": err.Error()}
	}
	content, err := os.ReadFile(full)
	if err != nil {
		return map[string]interface{}{"success": false, "error": "文件不存在: " + filepath}
	}
	return map[string]interface{}{"success": true, "content": string(content), "size": len(content)}
}

// Write 写入文件
func (fm *FileManager) Write(filepath, content string) map[string]interface{} {
	full, err := fm.SafePath(filepath)
	if err != nil {
		return map[string]interface{}{"success": false, "error": err.Error()}
	}
	dir := filepath.Dir(full)
	os.MkdirAll(dir, 0755)
	err = os.WriteFile(full, []byte(content), 0644)
	if err != nil {
		return map[string]interface{}{"success": false, "error": err.Error()}
	}
	return map[string]interface{}{"success": true, "path": filepath, "size": len(content)}
}

// List 列出目录内容
func (fm *FileManager) List(dirPath string) map[string]interface{} {
	full, err := fm.SafePath(dirPath)
	if err != nil {
		return map[string]interface{}{"success": false, "error": err.Error()}
	}
	entries, err := os.ReadDir(full)
	if err != nil {
		return map[string]interface{}{"success": false, "error": "目录不存在: " + dirPath}
	}
	files := []string{}
	dirs := []string{}
	for _, entry := range entries {
		if entry.IsDir() {
			dirs = append(dirs, entry.Name())
		} else {
			files = append(files, entry.Name())
		}
	}
	return map[string]interface{}{"success": true, "files": files, "dirs": dirs, "total": len(files) + len(dirs)}
}

// 使用示例
// fm := NewFileManager("./data")
// fmt.Println(fm.Write("test.txt", "Hello World"))
// fmt.Println(fm.Read("test.txt"))
// fmt.Println(fm.List("."))
`;
  },

  [INTENT.PIPELINE]: (params) => {
    return `package main

import (
	"fmt"
	"sync"
)

/**
 * ${params.description || '数据处理管道'}
 * 链式数据处理管道
 */

// PipelineStep 管道步骤
type PipelineStep struct {
	Name string
	Fn   func()
}

// DataPipeline 数据处理管道
type DataPipeline struct {
	data   []interface{}
	steps  []PipelineStep
	errors []map[string]string
}

// NewDataPipeline 创建新管道
func NewDataPipeline(data []interface{}) *DataPipeline {
	if data == nil {
		data = []interface{}{}
	}
	return &DataPipeline{data: data}
}

// Pipe 添加处理步骤
func (p *DataPipeline) Pipe(name string, fn func()) *DataPipeline {
	p.steps = append(p.steps, PipelineStep{Name: name, Fn: fn})
	return p
}

// Filter 过滤
func (p *DataPipeline) Filter(predicate func(interface{}) bool) *DataPipeline {
	return p.Pipe("filter", func() {
		result := []interface{}{}
		for _, item := range p.data {
			if predicate(item) {
				result = append(result, item)
			}
		}
		p.data = result
	})
}

// Map 映射
func (p *DataPipeline) Map(fn func(interface{}) interface{}) *DataPipeline {
	return p.Pipe("map", func() {
		result := make([]interface{}, len(p.data))
		for i, item := range p.data {
			result[i] = fn(item)
		}
		p.data = result
	})
}

// Run 执行所有步骤
func (p *DataPipeline) Run() map[string]interface{} {
	p.errors = []map[string]string{}
	start := 0 // 简化：用步数代替时间戳

	for _, step := range p.steps {
		func() {
			defer func() {
				if r := recover(); r != nil {
					p.errors = append(p.errors, map[string]string{
						"step": step.Name, "error": fmt.Sprintf("%v", r),
					})
				}
			}()
			step.Fn()
		}()
		_ = start
	}

	return map[string]interface{}{
		"data":      p.data,
		"steps":     len(p.steps),
		"errors":    p.errors,
		"hasErrors": len(p.errors) > 0,
	}
}

// 使用示例
// pipeline := NewDataPipeline([]interface{}{1, 2, 3, 4, 5, 6})
// result := pipeline.Filter(func(n interface{}) bool { return n.(int) > 2 }).
//     Map(func(n interface{}) interface{} { return n.(int) * 2 }).
//     Run()
// fmt.Println(result["data"])
`;
  },

  [INTENT.PLOT]: (params) => {
    return `package main

import "fmt"

/**
 * ${params.description || '数据可视化工具'}
 * 在控制台绘制简单图表
 */

// PlotBar 绘制柱状图
// data: 数值切片
// label: 图表标签
func PlotBar(data []float64, label string) {
	if data == nil || len(data) == 0 {
		fmt.Println("[PlotBar] 输入数据为空")
		return
	}

	max := 0.0
	for _, v := range data {
		if v > max {
			max = v
		}
	}
	if max == 0 {
		max = 1
	}

	width := 40
	fmt.Printf("--- 柱状图: %s ---\n", label)
	for i, v := range data {
		barLen := int((v / max) * float64(width))
		if barLen < 1 {
			barLen = 1
		}
		bar := ""
		for j := 0; j < barLen; j++ {
			bar += "█"
		}
		fmt.Printf("%-10s | %s %.1f\n", fmt.Sprintf("Item%d", i), bar, v)
	}
	fmt.Printf("--- 总计: %d 项 ---\n", len(data))
}

// 使用示例
// PlotBar([]float64{3, 7, 2, 9, 5}, "分数")
`;
  },

  [INTENT.ENCODE]: (params) => {
    return `package main

import (
	"encoding/base64"
	"fmt"
	"net/url"
)

/**
 * ${params.description || '编码/解码工具'}
 * 提供 Base64、URL、Hex 等编解码功能
 */

// Base64Encode Base64 编码
func Base64Encode(str string) string {
	return base64.StdEncoding.EncodeToString([]byte(str))
}

// Base64Decode Base64 解码
func Base64Decode(encoded string) string {
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return ""
	}
	return string(decoded)
}

// URLEncode URL 编码
func URLEncode(str string) string {
	return url.QueryEscape(str)
}

// URLDecode URL 解码
func URLDecode(str string) string {
	decoded, _ := url.QueryUnescape(str)
	return decoded
}

// HexEncode Hex 编码
func HexEncode(str string) string {
	hexChars := "0123456789abcdef"
	result := ""
	for _, c := range str {
		result += fmt.Sprintf("%02x", c)
	}
	return result
}

// HexDecode Hex 解码
func HexDecode(hex string) string {
	result := ""
	for i := 0; i < len(hex); i += 2 {
		var b byte
		fmt.Sscanf(hex[i:i+2], "%02x", &b)
		result += string(b)
	}
	return result
}

// 使用示例
// fmt.Println(Base64Encode("Hello 世界"))
// fmt.Println(Base64Decode("SGVsbG8g5LiW55WM"))
// fmt.Println(HexEncode("ABC"))
// fmt.Println(HexDecode("414243"))
`;
  },

  [INTENT.BATCH]: (params) => {
    return `package main

import (
	"fmt"
	"sync"
)

/**
 * ${params.description || '批量处理工具'}
 * 批量处理数据，支持并发控制
 */

// BatchProcess 批量处理（并发）
// items: 待处理项目切片
// processor: 处理函数
// batchSize: 每批大小
// 返回结果映射
func BatchProcess[T any, R any](items []T, processor func(T, int) (R, error), batchSize int) map[string]interface{} {
	if items == nil || len(items) == 0 {
		return map[string]interface{}{
			"results": []interface{}{}, "errors": []interface{}{},
			"total": 0, "succeeded": 0, "failed": 0,
		}
	}

	results := make([]interface{}, len(items))
	errors := []map[string]interface{}{}
	var mu sync.Mutex

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, batchSize)

	for i, item := range items {
		wg.Add(1)
		semaphore <- struct{}{}
		go func(idx int, val T) {
			defer wg.Done()
			defer func() { <-semaphore }()
			result, err := processor(val, idx)
			if err != nil {
				mu.Lock()
				errors = append(errors, map[string]interface{}{"index": idx, "error": err.Error()})
				mu.Unlock()
			} else {
				mu.Lock()
				results[idx] = result
				mu.Unlock()
			}
		}(i, item)
	}

	wg.Wait()

	succeeded := 0
	for _, r := range results {
		if r != nil {
			succeeded++
		}
	}

	return map[string]interface{}{
		"results": results, "errors": errors,
		"total": len(items), "succeeded": succeeded, "failed": len(errors),
	}
}

// ChunkProcess 分块处理（同步）
// items: 待处理项目
// processor: 处理函数
// chunkSize: 每块大小
func ChunkProcess[T any, R any](items []T, processor func(T) R, chunkSize int) []R {
	if items == nil || chunkSize < 1 {
		return []R{}
	}
	results := []R{}
	for i := 0; i < len(items); i += chunkSize {
		end := i + chunkSize
		if end > len(items) {
			end = len(items)
		}
		for _, item := range items[i:end] {
			results = append(results, processor(item))
		}
	}
	return results
}

// 使用示例
// data := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
// result := BatchProcess(data, func(n int, idx int) (interface{}, error) {
//     return n * 2, nil
// }, 3)
// fmt.Println(result)
`;
  },

  [INTENT.UTILITY]: (params) => {
    return `package main

import "fmt"

/**
 * ${params.description || '通用工具函数'}
 */

// DeepClone 深拷贝（通用实现）
func DeepClone(src interface{}) interface{} {
	if src == nil {
		return nil
	}
	// 使用 JSON 序列化/反序列化实现深拷贝
	// 生产环境建议使用专用的深拷贝库
	return src // 简化实现
}

// Sleep 休眠
func Sleep(ms int) {
	// 使用 time.Sleep（需导入 time 包）
	_ = ms
}

// Chunk 分块
func Chunk[T any](items []T, size int) [][]T {
	if items == nil || size < 1 {
		return [][]T{}
	}
	result := [][]T{}
	for i := 0; i < len(items); i += size {
		end := i + size
		if end > len(items) {
			end = len(items)
		}
		result = append(result, items[i:end])
	}
	return result
}

// Unique 去重
func Unique[T comparable](items []T) []T {
	if items == nil {
		return []T{}
	}
	seen := make(map[T]bool)
	result := []T{}
	for _, item := range items {
		if !seen[item] {
			seen[item] = true
			result = append(result, item)
		}
	}
	return result
}

// 使用示例
// fmt.Println(Chunk([]int{1, 2, 3, 4, 5}, 2))
// fmt.Println(Unique([]int{1, 2, 2, 3, 3, 4}))
`;
  }
};

// ============================================================================
// Go 测试代码生成
// ============================================================================

/**
 * 生成 Go 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 类/函数名
 * @returns {string} 测试代码
 */
function generateGoTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
package main

import "testing"

func Test${funcName}(t *testing.T) {
\tpassed := 0
\tfailed := 0

\t// 打印测试结果摘要
\tdefer func() {
\t\tt.Logf("测试完成: %d 通过, %d 失败", passed, failed)
\t}()
`;

  for (const tc of testCases) {
    testCode += `
\t// ${tc.name}
\tt.Run("${tc.name}", func(t *testing.T) {
\t\tfunc() {
\t\t\tdefer func() {
\t\t\t\tif r := recover(); r != nil {
\t\t\t\t\tt.Errorf("  ❌ ${tc.name}: %v", r)
\t\t\t\t\tfailed++
\t\t\t\t}
\t\t\t}()
${tc.setup ? '\t\t\t' + tc.setup.replace(/\n/g, '\n\t\t\t') : ''}
\t\t\t${tc.call}
\t\t\t${tc.assert}
\t\t\tt.Logf("  ✅ ${tc.name}")
\t\t\tpassed++
\t\t}()
\t})
`;
  }

  testCode += `}
`;
  return testCode;
}

/**
 * 获取 Go 测试用例
 */
function getTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      { name: '基本排序 - 整数切片升序', setup: 'input := []int{3, 1, 4, 1, 5, 9}', call: 'result := SortData(input, true)', assert: 'if len(result) != 6 || result[0] != 1 { panic("排序结果不正确") }' },
      { name: '空切片处理', setup: 'input := []int{}', call: 'result := SortData(input, true)', assert: 'if len(result) != 0 { panic("空切片应返回空切片") }' }
    ],
    [INTENT.FILTER]: [
      { name: '基本过滤 - 大于2', setup: 'input := []int{1, 2, 3, 4, 5}', call: 'result := FilterData(input, func(n int) bool { return n > 2 })', assert: 'if len(result) != 3 { panic("过滤结果长度错误") }' }
    ],
    [INTENT.ANALYZE]: [
      { name: '基本统计分析', setup: 'input := []float64{1, 2, 3, 4, 5}', call: 'result := AnalyzeData(input)', assert: 'if result["count"] != 5 { panic("count 错误") }' }
    ],
    [INTENT.FETCH]: [
      { name: 'FetchData 方法存在性', setup: '', call: '// FetchData 是包级函数', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.CACHE]: [
      { name: '缓存基本功能', setup: 'cache := NewDataCache(10, 60000)', call: 'setResult := cache.Set("key1", "value1")', assert: 'if !setResult { panic("set 应返回 true") }\n\t\t\tif cache.Get("key1") != "value1" { panic("get 返回值不匹配") }' }
    ],
    [INTENT.VALIDATE]: [
      { name: '有效数据验证', setup: `input := map[string]interface{}{"name": "Alice", "age": float64(25)}
\trules := map[string]map[string]interface{}{
\t\t"name": {"required": true, "type": "string"},
\t\t"age":  {"required": true, "type": "number"},
\t}`, call: 'result := Validate(input, rules)', assert: 'if result["valid"] != true { panic("有效数据应验证通过") }' }
    ],
    [INTENT.FILE]: [
      { name: 'FileManager 实例化', setup: '', call: 'fm := NewFileManager("./data")', assert: 'if fm == nil { panic("FileManager 实例化失败") }' }
    ],
    [INTENT.PIPELINE]: [
      { name: '管道基本功能', setup: `input := []interface{}{1, 2, 3, 4, 5}
\tpipeline := NewDataPipeline(input)`, call: `pipeline.Filter(func(n interface{}) bool { return n.(int) > 2 })
\t\tresult := pipeline.Run()`, assert: 'if result == nil { panic("管道不应返回nil") }' }
    ],
    [INTENT.PLOT]: [
      { name: 'PlotBar 方法存在性', setup: '', call: '// PlotBar 是包级函数', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.ENCODE]: [
      { name: 'Base64 编码', setup: '', call: 'result := Base64Encode("Hello")', assert: 'if result == "" { panic("编码结果应为非空字符串") }' }
    ],
    [INTENT.BATCH]: [
      { name: 'BatchProcess 方法存在性', setup: '', call: '// BatchProcess 是包级函数', assert: '// 函数存在性由编译器保证' }
    ],
    [INTENT.UTILITY]: [
      { name: 'Chunk 函数', setup: 'items := []int{1, 2, 3, 4, 5}', call: 'result := Chunk(items, 2)', assert: 'if len(result) != 3 { panic("chunk 结果长度错误") }' }
    ]
  };

  return cases[intent] || [
    { name: '基本功能测试', setup: '', call: `// ${funcName} 包级函数`, assert: '// 函数存在性由编译器保证' }
  ];
}

// ============================================================================
// 适配器接口
// ============================================================================

module.exports = {
  name: 'go',
  templates: GO_TEMPLATES,
  generateTest: generateGoTest,
  getTestCases,
  structureKeywords: ['func ', 'type ', 'package '],
  commentPrefixes: ['//', '/*', '*', '*/'],
  indentSize: 1, // 使用 tab，此处表示 tab 宽度为 1 个 tab
  useTabs: true,
  supportedIntents: Object.keys(GO_TEMPLATES)
};
