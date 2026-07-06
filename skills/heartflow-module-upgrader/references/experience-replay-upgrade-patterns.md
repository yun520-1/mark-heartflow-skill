# 反馈循环/经验回放类升级模式 (experience-replay.js)

## 适用场景

模块是**反馈循环处理引擎**，负责从反思报告/历史数据中提取模式，生成技能修改建议。典型特征：

- 核心流程：`loadReports() → identifyPatterns() → generateSkillSuggestions() → saveSuggestions()`
- 依赖外部 JSON 文件存储模式数据（如 `experience-patterns.json`）
- 有已知模式库（`knownPatterns`），通过关键词匹配检测问题
- 发生计数器（occurrence）但**无时间衰减**——旧模式和当前模式权重相同
- 无数据完整性校验——JSON 损坏时静默返回空数组
- 无重试机制——文件操作失败直接抛异常
- 无震荡检测——相同模式反复出现不感知
- 无自诊断能力

**区别于循环过程类（dream-loop）**：反馈循环类不包装核心引擎，而是**读取外部数据 → 分析模式 → 生成输出**。它的瓶颈不是计算，而是**数据可靠性和模式质量**。

## 示例：ExperienceReplay (src/core/experience-replay.js, ~8.9KB → 30KB)

**原模块**：324 行，纯粹反应式
- `loadReports()` — 无完整性检查，JSON损坏静默返回 `[]`
- `identifyPatterns()` — 简单关键词匹配，无去重保护
- `generateSkillSuggestions()` — 无震荡/衰减感知
- `saveSuggestions()` — 无重试，文件损坏覆盖不保留备份
- `updateExperiencePatterns()` — occurrence 只增不减
- `loadPatterns()` — 无备份恢复

**升级后**：~800 行，带自愈能力的反馈循环引擎

## 可添加的子系统

### 1. 状态枚举（新增）

```javascript
const DataIntegrityError = {
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_TYPE: 'INVALID_TYPE',
  CORRUPTED_JSON: 'CORRUPTED_JSON',
  STALE_DATA: 'STALE_DATA',
  EMPTY_REPORT: 'EMPTY_REPORT',
  CYCLE_DETECTED: 'CYCLE_DETECTED'
};

const SelfHealAction = {
  REBUILD_FILE: 'REBUILD_FILE',
  TRUNCATE_ENTRY: 'TRUNCATE_ENTRY',
  CLEAR_AND_RETRY: 'CLEAR_AND_RETRY',
  RECOVER_FROM_BACKUP: 'RECOVER_FROM_BACKUP',
  RESET_PATTERN: 'RESET_PATTERN',
  FALLBACK_TO_DEFAULTS: 'FALLBACK_TO_DEFAULTS'
};

const PatternOscillation = {
  NONE: 'NONE',
  SOFT: 'SOFT',       // 模式在2个状态间来回切换
  HARD: 'HARD',       // 模式在3+个状态间快速切换
  RECOVERED: 'RECOVERED'  // 已从震荡中恢复
};
```

**设计原则**：枚举值是名词性的（"什么状态"），不是动词性的（"做什么"）。调用方通过 switch 决定行为。

### 2. 数据完整性校验（validateReportIntegrity）

```javascript
validateReportIntegrity(data, source) {
  if (data === null || data === undefined) {
    return { valid: false, error: `${source} 数据为空`, severity: 'critical' };
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    if (Array.isArray(data)) {
      // 验证数组中的每个元素
      for (let i = 0; i < Math.min(data.length, 5); i++) {
        if (typeof data[i] !== 'object' || data[i] === null) {
          return { valid: false, error: `${source}[${i}] 不是有效对象`, severity: 'warning' };
        }
      }
      return { valid: true, error: null, severity: null };
    }
    return { valid: false, error: `${source} 不是对象或数组`, severity: 'critical' };
  }

  // 检查模式文件结构
  if (source === 'patternFile' || source === 'pattern') {
    if (!Array.isArray(data.patterns)) {
      return { valid: false, error: 'patternFile.patterns 缺少或不是数组', severity: 'warning' };
    }
    for (let i = 0; i < data.patterns.length; i++) {
      const p = data.patterns[i];
      if (!p.key || typeof p.key !== 'string') {
        return { valid: false, error: `patterns[${i}] 缺少 key 字段`, severity: 'warning' };
      }
      if (p.occurrence !== undefined && typeof p.occurrence !== 'number') {
        return { valid: false, error: `patterns[${i}].occurrence 类型错误`, severity: 'warning' };
      }
    }
  }
  return { valid: true, error: null, severity: null };
}
```

**关键设计**：
- 两层严重性：`critical`（无法继续）vs `warning`（可修复后继续）
- 只检查前5个元素（性能）
- `patternFile` 额外检查 `patterns` 数组结构

### 3. 带完整性检查的文件读取（readFileWithIntegrityCheck）

```javascript
readFileWithIntegrityCheck(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    if (stats.size === 0) return null;          // 空文件检测
    if (stats.size > 10 * 1024 * 1024) return null;  // >10MB 异常
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}
```

**阈值设计依据**：
- 空文件检测：JSON.parse('') 会抛异常，提前拦截
- 10MB 上限：经验回放 JSON 文件通常 <100KB，10MB 明显异常（可能日志溢出或程序错误写入）

### 4. 自愈修复（selfHealCorruptedFile）

```javascript
selfHealCorruptedFile(source) {
  const healAction = SelfHealAction.FALLBACK_TO_DEFAULTS;

  // 尝试从备份恢复
  try {
    const backupFile = this.patternFile + '.bak';
    if (fs.existsSync(backupFile)) {
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      const backupData = JSON.parse(backupContent);
      const validation = this.validateReportIntegrity(backupData, 'backup');
      if (validation.valid) {
        console.warn(`[ExperienceReplay] Recovered from backup`);
        return backupData;
      }
    }
  } catch (e) { /* fall through */ }

  // 保留损坏文件作为 .corrupted
  try {
    if (fs.existsSync(this.patternFile)) {
      const corruptedPath = this.patternFile + '.corrupted';
      fs.renameSync(this.patternFile, corruptedPath);
    }
  } catch (e) { /* fall through */ }

  return { patterns: [], lastUpdate: null };
}
```

**三阶段恢复策略**：
1. 备份恢复（`.bak` 文件，上次成功写入的副本）
2. 现场保留（重命名损坏文件为 `.corrupted`，保留调试信息）
3. 默认回退（空模式列表，保证系统不崩溃）

### 5. 重试策略（指数退避）

```javascript
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 200,
  BACKOFF_FACTOR: 2
};

async savePatterns() {
  const saveWithRetry = async (attempt = 0) => {
    try {
      // 确保目录存在
      const dir = path.dirname(this.patternFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // 先写备份
      if (fs.existsSync(this.patternFile)) {
        fs.writeFileSync(this.patternFile + '.bak', JSON.stringify(this.patterns, null, 2));
      }
      await atomicWrite(this.patternFile, JSON.stringify(this.patterns, null, 2));
      return true;
    } catch (e) {
      if (attempt < RETRY_CONFIG.MAX_RETRIES) {
        const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);
        await new Promise(r => setTimeout(r, delay));
        return saveWithRetry(attempt + 1);
      }
      console.error(`[ExperienceReplay] save failed after retries:`, e.message);
      return false;  // 失败但不抛异常
    }
  };
  await saveWithRetry();
}
```

**关键设计**：
- **失败不抛异常**：文件系统问题不应让整个反馈循环崩溃
- **目录自动创建**：防止 `ENOENT`（atomicWrite 在某些环境下不创建目录）
- **备份先于写入**：`writeFileSync` 同步备份后，再 `atomicWrite` 主文件

### 6. 震荡检测（detectOscillation）

```javascript
detectOscillation(reports) {
  const window = reports.slice(-OSCILLATION_CONFIG.WINDOW_SIZE);
  if (window.length < 4) {
    return { type: PatternOscillation.NONE, ... };
  }

  const oscillatingPatterns = [];
  const patternStates = {};

  for (const [patternKey] of Object.entries(this.knownPatterns)) {
    const stateSequence = [];

    for (const report of window) {
      const improvements = report.improvements || [];
      const area = improvements.some(imp => {
        const areaStr = (imp.area || '').toLowerCase();
        const sugStr = (imp.suggestion || '').toLowerCase();
        return areaStr.includes(patternKey) || sugStr.includes(patternKey);
      });
      stateSequence.push(area ? 1 : 0);
    }

    // 计算状态切换次数
    let transitions = 0;
    for (let i = 1; i < stateSequence.length; i++) {
      if (stateSequence[i] !== stateSequence[i - 1]) transitions++;
    }

    if (transitions >= OSCILLATION_CONFIG.HARD_THRESHOLD) {
      patternStates[patternKey] = { transitions, type: PatternOscillation.HARD, stateSequence };
      oscillatingPatterns.push(patternKey);
    } else if (transitions >= OSCILLATION_CONFIG.SOFT_THRESHOLD) {
      patternStates[patternKey] = { transitions, type: PatternOscillation.SOFT, stateSequence };
      oscillatingPatterns.push(patternKey);
    }
  }

  if (oscillatingPatterns.length === 0) return { type: PatternOscillation.NONE, ... };

  const hasHard = Object.values(patternStates).some(s => s.type === 'HARD');
  return { type: hasHard ? PatternOscillation.HARD : PatternOscillation.SOFT, oscillatingPatterns, ... };
}
```

**阈值设计依据**：
- `WINDOW_SIZE = 10`：10 个报告提供足够的统计量
- `SOFT_THRESHOLD = 4`：10次中有4次切换 = 40% 翻转率，值得注意
- `HARD_THRESHOLD = 6`：60%+ 翻转率，需要主动抑制

**震荡后的行为**：
- 硬震荡：`dampenOscillatingPatterns()` 抑制模式生成
- 持续震荡≥2次：完全抑制（不再为该模式生成建议）
- 首次震荡：降低优先级（high→medium, medium→low）

### 7. 模式衰减（agePatterns）

```javascript
const DECAY_HALF_LIFE = 7; // 天

agePatterns() {
  if (!this.patterns.patterns) return;

  const now = Date.now();
  const halfLifeMs = DECAY_HALF_LIFE * 24 * 60 * 60 * 1000;

  for (const pattern of this.patterns.patterns) {
    if (!pattern.lastSeen) continue;
    const elapsed = now - new Date(pattern.lastSeen).getTime();

    if (elapsed > halfLifeMs) {
      const decayCycles = Math.floor(elapsed / halfLifeMs);
      for (let i = 0; i < decayCycles; i++) {
        pattern.occurrence = Math.max(1, Math.floor(pattern.occurrence / 2));
      }
    }
  }
}
```

**衰减模型**：指数衰减（半衰期7天）
- occurrence = 100 → 7天后 → 50 → 14天后 → 25
- 下限为1（永远不会衰减到0，避免被完全遗忘）
- 自动触发：每次 `updateExperiencePatterns()` 后调用

### 8. 自诊断（selfDiagnostic）

```javascript
selfDiagnostic() {
  const issues = [], warnings = [];

  // 1. 检查模式文件完整性
  const patternRaw = this.readFileWithIntegrityCheck(this.patternFile);
  if (patternRaw === null) {
    warnings.push({ component: 'patternFile', issue: '文件不可读或为空', severity: 'warning' });
  } else {
    try {
      const parsed = JSON.parse(patternRaw);
      const validation = this.validateReportIntegrity(parsed, 'pattern');
      if (!validation.valid) {
        issues.push({ component: 'patternFile', issue: validation.error, severity: validation.severity });
      }
    } catch (e) {
      issues.push({ component: 'patternFile', issue: `JSON解析失败: ${e.message}`, severity: 'critical' });
    }
  }

  // 2. 检查震荡缓存
  if (this._oscillationCache.type && this._oscillationCache.type !== 'NONE') {
    warnings.push({ component: 'oscillationDetector', issue: `检测到模式震荡`, severity: 'warning' });
  }

  // 3. 检查模式计数异常
  for (const p of this.patterns.patterns) {
    if (p.occurrence > 100) {
      warnings.push({ component: 'patternCounter', issue: `"${p.key}" 出现次数异常 (${p.occurrence})`, severity: 'warning' });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    healthy: issues.length === 0,
    issues, warnings,
    patternCount: this.patterns.patterns?.length || 0,
    oscillationStatus: this._oscillationCache.type || 'NONE'
  };
}
```

**诊断覆盖范围**：
- 数据文件完整性（模式文件、建议文件）
- 震荡状态检测
- 模式计数异常检测
- 文件可读性检查

### 9. 增强的 identifyPatterns（去重保护）

```javascript
identifyPatterns(report) {
  const foundPatterns = [];
  const improvements = report.improvements || [];

  for (const [patternKey, patternDef] of Object.entries(this.knownPatterns)) {
    for (const improvement of improvements) {
      const area = improvement.area?.toLowerCase() || '';
      const suggestion = improvement.suggestion?.toLowerCase() || '';
      const matchesTrigger = patternDef.trigger.some(t => area.includes(t) || suggestion.includes(t));

      if (matchesTrigger) {
        // 避免同一报告内重复
        const existing = foundPatterns.find(p => p.key === patternKey);
        if (existing) {
          existing.occurrence = (existing.occurrence || 1) + 1;
          continue;
        }
        foundPatterns.push({ key: patternKey, ...patternDef, occurrence: 1, timestamp: new Date().toISOString() });
      }
    }
  }

  // 从历史加载 occurrence 和震荡状态
  for (const pattern of foundPatterns) {
    const existing = this.patterns.patterns?.find(p => p.key === pattern.key);
    if (existing) {
      pattern.occurrence = (existing.occurrence || 0) + 1;
      if (existing.oscillation && existing.oscillation !== 'NONE') {
        pattern.oscillation = existing.oscillation;
      }
    }
  }

  return foundPatterns;
}
```

## 关键实现细节

### 保持向后兼容
- `loadPatterns()` 返回格式不变：`{ patterns: [], lastUpdate: null }`
- `loadReports()` 返回格式不变：`[{ ...report }]`
- `updateSkillFromExperience()` 返回格式不变：`{ success, reason, message, patterns?, suggestions? }`
- 新增枚举通过 `module.exports` 导出

### 新字段在旧数据中自动回退
```javascript
// 在 updateExperiencePatterns 中：
this.patterns.patterns[existing].oscillation = pattern.oscillation || 'NONE';
this.patterns.patterns[existing].oscillationCount = (this.patterns.patterns[existing].oscillationCount || 0) + 1;
```

### 导出策略
```javascript
module.exports = {
  ExperienceReplay,
  DataIntegrityError,
  SelfHealAction,
  PatternOscillation,
  RETRY_CONFIG,
  OSCILLATION_CONFIG
};
```

## 验证清单

- [ ] `node --check` 语法通过
- [ ] `new ExperienceReplay(process.cwd())` 实例化不报错
- [ ] 原有方法签名不变（`updateSkillFromExperience`, `identifyPatterns`, `generateSkillSuggestions`, `loadReports`）
- [ ] `null` 输入 → `validateReportIntegrity` 返回 `{ valid: false, severity: 'critical' }`
- [ ] 空文件 → `readFileWithIntegrityCheck` 返回 `null`
- [ ] 异常大文件 → `readFileWithIntegrityCheck` 返回 `null`
- [ ] 损坏 JSON → `loadPatterns` 触发自愈恢复
- [ ] 有备份 → 自愈恢复成功
- [ ] 无备份 → 自愈返回空默认值
- [ ] 震荡检测：10个交替报告 → HARD 震荡
- [ ] 震荡抑制：硬震荡模式下模式数量减少
- [ ] 模式衰减：超过半衰期后 occurrence 减半
- [ ] `selfDiagnostic()` 返回 `healthy: true`（文件正常时）
- [ ] `savePatterns` 重试机制：目录不存在时自动创建
- [ ] 所有枚举通过 `require('./module').XXX` 访问

## 已知陷阱

### 陷阱 1: 备份文件无限增长
每次 `savePatterns` 都会覆盖 `.bak` 文件，但不会累积多个备份。如果也需要时间点备份，应在外部 cron 中处理。

### 陷阱 2: .bak 文件写入失败不影响主流程
备份写入是 fire-and-forget（try/catch 包裹），失败时主文件仍然写入。这是有意设计——备份是辅助，不是依赖。

### 陷阱 3: 震荡检测对短报告序列不敏感
`WINDOW_SIZE = 10` 且需要至少 4 个报告才能检测。头几次运行时震荡检测始终返回 NONE。这是设计使然——统计意义在数据不足时不可靠。

### 陷阱 4: 模式衰减与 occurrence 更新顺序
`updateExperiencePatterns()` 先增加 occurrence（新数据），然后调用 `agePatterns()` 衰减旧数据。如果两者顺序颠倒，新模式的 occurrence 会被错误衰减。

### 陷阱 5: 并发写入
如果多个 HeartFlow 实例同时运行，可能并发写入同一个 JSON 文件。`atomicWrite` 缓解但不完全解决。当前设计假设单实例运行。

### 陷阱 6: .corrupted 文件累积
每次自愈修复会创建 `.corrupted` 文件，但不会自动清理。长期运行可能累积多个 `.corrupted` 文件。建议在外部维护中定期清理。
