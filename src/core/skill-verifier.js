/**
 * SKILL.md 验证器 - 验证技能文档的结构和内容正确性
 * v2.0.47 — 扩展：链接验证、交叉引用检查、代码块语法检查、重复章节检测、严重性分级、修复建议
 */
const { assert } = require('./assertions');

// 已知的 valid skill names (用于交叉引用检查)
const knownSkills = new Set([
  'heartflow', 'heartflow-engine', 'verification-engine', 'upgrade-proposal',
  'stability-guard', 'state-snapshot', 'execution-verifier', 'claim-extractor',
  'hypothesis-tester', 'lesson-retrieval', 'skill-verifier', 'lesson-bank',
  'reflector', 'meta-engine', 'being-logic', 'heart-logic', 'memory',
  'meaningful-memory', 'dream', 'boot-check', 'self-healing-rl',
  'self-correction-loop', 'fact-checker', 'decision-verifier',
  'cognitive-appraisal', 'cognitive-protocol', 'narrative-generator',
  'emotional-memory-bridge', 'embodied-core', 'spontaneous-restraint',
  'self-diagnostic', 'auto-compaction-engine', 'error-handler',
  'constitutional-ai', 'psychology', 'openalex-client', 'skill-generator',
  'philosophy-engine', 'experience-replay', 'reflection-loop',
  'language-honesty', 'semantic-anchor', 'workflow-switch',
  'confidence-annotator', 'code-verifier', 'version', 'task-pipeline',
  'self-healing', 'budget', 'feedback-functions'
]);

// 严重性级别
const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// 严重性级别权重
const SEVERITY_WEIGHT = {
  error: 10,
  warning: 5,
  info: 1
};

const skillVerifier = {
  /**
   * 严重性分级 — 为验证结果标记严重性级别
   */
  _classifyResult(error) {
    if (error.startsWith('[Frontmatter]') || error.startsWith('[版本]') || error.startsWith('[路径]')) {
      return { ...error, severity: SEVERITY.ERROR };
    }
    if (error.startsWith('[数据]') || error.startsWith('[表述]') || error.startsWith('[结构]')) {
      return { ...error, severity: SEVERITY.WARNING };
    }
    if (error.startsWith('[链接]') || error.startsWith('[代码块]') || error.startsWith('[交叉引用]')) {
      return { ...error, severity: SEVERITY.WARNING };
    }
    if (error.startsWith('[重复]') || error.startsWith('[描述]')) {
      return { ...error, severity: SEVERITY.INFO };
    }
    return { ...error, severity: SEVERITY.WARNING };
  },

  /**
   * Markdown 链接验证 — 检查链接格式、空链接、无效锚点、重复锚点
   */
  _validateLinks(content) {
    const issues = [];
    const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g;
    const anchorPositions = {};
    let match;

    // 收集所有锚点位置
    const headerRegex = /^#{1,6}\s+(.+)$/gm;
    while ((match = headerRegex.exec(content)) !== null) {
      const anchor = match[1].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      if (!anchorPositions[anchor]) {
        anchorPositions[anchor] = [];
      }
      anchorPositions[anchor].push(match.index);
    }

    // 验证每个链接
    while ((match = linkRegex.exec(content)) !== null) {
      const [full, text, url] = match;
      const trimmedUrl = url.trim();

      if (!text.trim()) {
        issues.push(`[链接] 空链接文本: ${full}`);
        continue;
      }

      if (!trimmedUrl) {
        issues.push(`[链接] 空链接目标: ${full}`);
        continue;
      }

      // 检查内部锚点
      if (trimmedUrl.startsWith('#')) {
        const targetAnchor = trimmedUrl.slice(1).toLowerCase();
        if (!anchorPositions[targetAnchor]) {
          issues.push(`[链接] 无效内部锚点 "${trimmedUrl}" — 目标章节不存在: ${full}`);
        }
      }

      // 检查外部链接基本格式
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        try {
          const parsed = new URL(trimmedUrl);
          if (!parsed.hostname || parsed.hostname.length < 3) {
            issues.push(`[链接] 外部链接缺少有效主机名: ${full}`);
          }
          if (!parsed.protocol || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
            issues.push(`[链接] 外部链接协议异常: ${full}`);
          }
        } catch {
          issues.push(`[链接] 外部链接格式无效: ${full}`);
        }
      }

      // 检查相对路径链接
      if (trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../') || trimmedUrl.startsWith('/')) {
        if (!trimmedUrl.endsWith('.md') && !trimmedUrl.endsWith('.js') && !trimmedUrl.endsWith('.json')) {
          issues.push(`[链接] 相对路径链接缺少文件扩展名: ${full}`);
        }
      }

      // 检查图片链接是否缺少alt文本
      if (full.startsWith('![') && !text.trim()) {
        issues.push(`[链接] 图片缺少替代文本: ${full}`);
      }
    }

    // 检查重复锚点
    for (const [anchor, positions] of Object.entries(anchorPositions)) {
      if (positions.length > 1) {
        issues.push(`[链接] 重复锚点 "#${anchor}" 出现 ${positions.length} 次`);
      }
    }

    return issues;
  },

  /**
   * 交叉引用检查 — 检测 `@skill-name` 引用是否指向已知技能
   */
  _validateCrossReferences(content) {
    const issues = [];
    const refRegex = /@([a-z0-9][a-z0-9-]*[a-z0-9])/gi;
    let match;
    const seen = new Set();

    while ((match = refRegex.exec(content)) !== null) {
      const ref = match[1].toLowerCase();
      if (seen.has(ref)) continue;
      seen.add(ref);

      // 跳过常见的非技能引用
      const skipPatterns = ['example', 'param', 'return', 'type', 'param', 'throws', 'see', 'link'];
      if (skipPatterns.includes(ref)) continue;

      // 跳过URL中的@符号
      const before = content.slice(Math.max(0, match.index - 10), match.index);
      if (before.includes('mailto:') || before.includes('@')) continue;

      if (!knownSkills.has(ref)) {
        issues.push(`[交叉引用] 未知技能引用 "@${ref}" — 目标技能不在已知技能列表中`);
      }
    }

    return issues;
  },

  /**
   * 代码块语法检查 — 验证语言标签、括号平衡
   */
  _validateCodeBlocks(content) {
    const issues = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    const validLanguages = new Set([
      'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'bash', 'sh',
      'json', 'yaml', 'yml', 'toml', 'markdown', 'md', 'html', 'css',
      'text', 'plaintext', 'diff', 'patch', 'sql', 'rust', 'go', 'java',
      'cpp', 'c', 'ruby', 'rb', 'php', 'swift', 'kotlin', 'scala',
      'dockerfile', 'docker', 'makefile', 'make', 'graphql', 'gql',
      'xml', 'svg', 'env', 'ini', 'cfg', 'conf', 'log', 'mermaid',
      'plantuml', 'uml'
    ]);

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [full, lang, code] = match;

      // 检查语言标签 — 有内容的代码块应该标注语言
      if (!lang && code.trim().length > 20) {
        issues.push(`[代码块] 代码块缺少语言标签 (行 ${content.slice(0, match.index).split('\n').length})`);
      }

      // 检查语言标签有效性
      if (lang && !validLanguages.has(lang.toLowerCase())) {
        issues.push(`[代码块] 未知语言标签 "${lang}" — 建议使用标准语言标识`);
      }

      // 检查括号平衡（仅对 JS/TS/JSON 代码块）
      if (['javascript', 'js', 'typescript', 'ts', 'json'].includes(lang.toLowerCase())) {
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          issues.push(`[代码块] 花括号不匹配: 开${openBraces} vs 闭${closeBraces} (${lang}代码块)`);
        }
        const openBrackets = (code.match(/\[/g) || []).length;
        const closeBrackets = (code.match(/\]/g) || []).length;
        if (openBrackets !== closeBrackets) {
          issues.push(`[代码块] 方括号不匹配: 开${openBrackets} vs 闭${closeBrackets} (${lang}代码块)`);
        }
      }

      // 检查 JSON 代码块是否有效 JSON
      if (lang === 'json') {
        try {
          JSON.parse(code.trim());
        } catch {
          issues.push(`[代码块] JSON 代码块解析失败 — 检查语法`);
        }
      }
    }

    return issues;
  },

  /**
   * 重复章节检测 — 查找重复的标题
   */
  _detectDuplicateSections(content) {
    const issues = [];
    const headerRegex = /^(#{2,4})\s+(.+)$/gm;
    const headerCount = {};
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
      const header = match[2].trim().toLowerCase();
      if (!headerCount[header]) {
        headerCount[header] = { count: 0, level: match[1].length, lines: [] };
      }
      headerCount[header].count++;
      headerCount[header].lines.push(content.slice(0, match.index).split('\n').length);
    }

    for (const [header, info] of Object.entries(headerCount)) {
      if (info.count > 1 && header.length > 3) {
        // 跳过常见的允许重复的章节名
        const allowedDuplicates = ['example', 'examples', 'notes', 'note', 'see also', 'related',
          'installation', 'usage', 'configuration', 'api', 'license', 'security', 'faq',
          'troubleshooting', 'limitations', 'pitfalls', 'version history', 'changelog',
          '触发条件', '核心功能', '使用方式', '注意事项', '版本历史'];
        if (allowedDuplicates.includes(header)) continue;

        issues.push(`[重复] 章节 "${header}" 出现 ${info.count} 次 (行 ${info.lines.join(', ')})`);
      }
    }

    return issues;
  },

  /**
   * 描述/标题质量评分 — 检查描述质量
   */
  _assessDescriptionQuality(content) {
    const issues = [];
    const descMatch = content.match(/^description:\s*\|?\s*(.+)$/m);
    const titleMatch = content.match(/^title:\s*(.+)$/m);

    if (descMatch) {
      const desc = descMatch[1].trim();
      if (desc.length < 20) {
        issues.push(`[描述] 描述过短 (${desc.length}字符) — 建议至少20字符说明功能`);
      }
      if (!desc.includes('、') && !desc.includes('，') && desc.length > 40) {
        issues.push(`[描述] 长描述建议使用标点分隔功能点`);
      }
      if (!/[功能能力引擎系统模块工具框架平台]/.test(desc) && desc.length > 10) {
        issues.push(`[描述] 描述中缺少功能分类词 (如"引擎/系统/模块/工具")`);
      }
    }

    if (titleMatch) {
      const title = titleMatch[1].trim();
      if (title.length < 4) {
        issues.push(`[描述] 标题过短: "${title}"`);
      }
    }

    return issues;
  },

  /**
   * 生成修复建议
   */
  _generateSuggestions(errors) {
    const suggestions = [];

    for (const error of errors) {
      if (error.startsWith('[Frontmatter]')) {
        suggestions.push('• 在文件顶部添加 --- 包围的 YAML frontmatter，包含 name, version, description 字段');
      }
      if (error.startsWith('[版本]')) {
        suggestions.push('• 确保 frontmatter 中的 version 与标题中的版本号一致');
      }
      if (error.startsWith('[结构]')) {
        suggestions.push('• 添加必需章节: ## 触发条件 和 ## 核心功能');
      }
      if (error.startsWith('[数据]')) {
        suggestions.push('• 为大数字标注置信度: `[high]`, `[medium]`, `[low]`');
      }
      if (error.startsWith('[表述]')) {
        suggestions.push('• 替换不确定性表述为确定表述，或标注为推测');
      }
      if (error.startsWith('[路径]')) {
        suggestions.push('• 使用相对路径或 ~ 替代绝对路径');
      }
      if (error.includes('无效内部锚点')) {
        suggestions.push('• 确保 #锚点 与目标章节标题匹配 (自动转为小写+连字符)');
      }
      if (error.includes('缺少语言标签')) {
        suggestions.push('• 为代码块添加语言标签: ```javascript 或 ```bash');
      }
      if (error.includes('未知语言标签')) {
        suggestions.push('• 使用标准语言标识: javascript, python, bash, json 等');
      }
      if (error.includes('未知技能引用')) {
        suggestions.push('• 确保引用的技能名在 knownSkills 列表中，或修正拼写');
      }
      if (error.includes('重复锚点')) {
        suggestions.push('• 确保每个章节标题唯一，避免生成重复锚点');
      }
      if (error.includes('花括号不匹配') || error.includes('方括号不匹配')) {
        suggestions.push('• 检查代码块中的括号配对，确保开闭数量一致');
      }
      if (error.includes('缺少替代文本')) {
        suggestions.push('• 为图片添加替代文本: ![描述文字](url)');
      }
    }

    // 去重
    return [...new Set(suggestions)];
  },

  /**
   * 完整验证 — 所有检查 + 严重性分级 + 修复建议
   */
  verify(content) {
    const rawErrors = [];
    const errors = [];

    // 1. Frontmatter 必填字段
    const fmCheck = assert.skillFrontmatter(content);
    if (!fmCheck.ok) rawErrors.push(`[Frontmatter] ${fmCheck.error}`);

    // 2. name字段格式
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (!/^[a-z0-9-]+$/.test(name)) {
        rawErrors.push(`[Frontmatter] name 应为小写字母、数字、连字符: "${name}"`);
      }
    }

    // 3. 版本号一致性
    const frontmatterVer = content.match(/^version:\s*v?([\d.]+)/m);
    const headerVer = content.match(/^#\s+.+?\s+v([\d.]+)/m);
    if (frontmatterVer && headerVer) {
      if (frontmatterVer[1] !== headerVer[1]) {
        rawErrors.push(`[版本] frontmatter=${frontmatterVer[1]} vs 标题=${headerVer[1]}`);
      }
    }

    // 4. 必需章节
    const requiredSections = ['## 触发条件', '## 核心功能'];
    for (const s of requiredSections) {
      if (!content.includes(s)) {
        rawErrors.push(`[结构] 缺少 ${s}`);
      }
    }

    // 5. 检查未核实的数字
    const bigNumbers = content.match(/\$[,\d]{4,}|\b[1-9]\d{5,}\b/g);
    if (bigNumbers) {
      const unverified = bigNumbers.filter(n => !content.includes('[high]') && !content.includes('[medium]'));
      if (unverified.length > 0) {
        rawErrors.push(`[数据] 存在未标注置信度的大数字: ${unverified.slice(0, 3).join(', ')}`);
      }
    }

    // 6. 检查禁止词
    const forbidden = ['这是猜测', '可能是', '大概', '应该大概', ' probably ', ' might ', ' maybe '];
    for (const w of forbidden) {
      if (content.includes(w)) {
        rawErrors.push(`[表述] 包含不确定性词: "${w}"`);
      }
    }

    // 7. 禁止外部绝对路径
    const absPaths = content.match(/\/[a-z]+\/[a-z]+\/[^\s'"]+/gi) || [];
    const unsafePaths = absPaths.filter(p => !p.includes('/Users/apple/') && !p.includes('~'));
    if (unsafePaths.length > 0) {
      rawErrors.push(`[路径] 包含外部绝对路径: ${unsafePaths.slice(0, 2).join(', ')}`);
    }

    // 8. Markdown 链接验证
    const linkIssues = this._validateLinks(content);
    rawErrors.push(...linkIssues);

    // 9. 交叉引用检查
    const refIssues = this._validateCrossReferences(content);
    rawErrors.push(...refIssues);

    // 10. 代码块语法检查
    const codeIssues = this._validateCodeBlocks(content);
    rawErrors.push(...codeIssues);

    // 11. 重复章节检测
    const dupIssues = this._detectDuplicateSections(content);
    rawErrors.push(...dupIssues);

    // 12. 描述质量检查
    const descIssues = this._assessDescriptionQuality(content);
    rawErrors.push(...descIssues);

    // 对所有错误进行严重性分级
    for (const err of rawErrors) {
      const classified = this._classifyResult(err);
      errors.push(classified);
    }

    // 生成修复建议
    const suggestions = this._generateSuggestions(rawErrors);

    // 计算验证评分
    const score = this._calculateScore(errors);

    return {
      ok: errors.length === 0,
      errors,
      warnings: errors.filter(e => e.severity === 'warning'),
      suggestions,
      score,
      summary: this._generateSummary(errors, score)
    };
  },

  /**
   * 验证评分 — 0-100 加权计算
   */
  _calculateScore(errors) {
    if (errors.length === 0) return 100;

    let penalty = 0;
    for (const err of errors) {
      const weight = SEVERITY_WEIGHT[err.severity] || 5;
      penalty += weight;
    }

    return Math.max(0, Math.min(100, 100 - penalty));
  },

  /**
   * 生成可读摘要
   */
  _generateSummary(errors, score) {
    const bySeverity = {};
    for (const err of errors) {
      const s = err.severity || 'unknown';
      if (!bySeverity[s]) bySeverity[s] = 0;
      bySeverity[s]++;
    }

    const parts = [];
    if (score >= 90) parts.push(`✅ 评分 ${score}/100 — 质量良好`);
    else if (score >= 70) parts.push(`⚠️ 评分 ${score}/100 — 需要改进`);
    else parts.push(`❌ 评分 ${score}/100 — 需重大修改`);

    const sevParts = [];
    if (bySeverity.error) sevParts.push(`${bySeverity.error}个错误`);
    if (bySeverity.warning) sevParts.push(`${bySeverity.warning}个警告`);
    if (bySeverity.info) sevParts.push(`${bySeverity.info}个提示`);
    if (sevParts.length > 0) parts.push(`(${sevParts.join(', ')})`);

    return parts.join(' ');
  },

  /**
   * 快速检查（只验证Frontmatter）
   */
  quickCheck(content) {
    return assert.skillFrontmatter(content);
  },

  /**
   * 验证版本号
   */
  checkVersion(content) {
    const ver = content.match(/^version:\s*v?([\d.]+)/m);
    if (!ver) return { ok: false, error: '未找到版本号' };
    return assert.version(ver[1]);
  },

  /**
   * 按严重性分类查询问题
   */
  bySeverity(result, severity) {
    if (!result || !result.errors) return [];
    return result.errors.filter(e => e.severity === severity);
  },

  /**
   * 统计各严重性级别的数量
   */
  severityStats(result) {
    if (!result || !result.errors) {
      return { error: 0, warning: 0, info: 0, total: 0 };
    }
    const stats = { error: 0, warning: 0, info: 0, total: result.errors.length };
    for (const err of result.errors) {
      if (stats[err.severity] !== undefined) {
        stats[err.severity]++;
      }
    }
    return stats;
  }
};

module.exports = { skillVerifier };
