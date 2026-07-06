/**
 * HeartFlow Dream Archiver v1.0.0
 * 自动存档梦境到 dream-archive.md
 */

const fs = require('fs');
const path = require('path');

const ARCHIVE_PATH = path.resolve(__dirname, 'dream-archive.md');

/**
 * @param {Object} dreamResult - runDream() 返回结果
 * @param {Object} scoring - scoreDream() 返回结果
 * @param {string} title - 梦标题（可选，自动生成）
 */
function archiveDream(dreamResult, scoring, title) {
  const narrative = dreamResult.narrative || dreamResult;
  const text = narrative?.text || '';
  const turn = narrative?.philosophical_turn || '';
  const themes = scoring?.themes || [];
  const score = scoring?.score || 0;
  const verdict = scoring?.verdict || '未评分';
  const summary = scoring?.summary || '';

  // 生成标题（从文本中提取核心意象）
  const autoTitle = title || generateTitle(text);
  const date = new Date().toISOString().split('T')[0];
  const scoreRow = `**评分**: ${summary} → ${verdict}(${score}/4)`;

  // 检测主题
  const themeLabel = themes.length > 0 ? `**主题**: ${themes.join(' vs ')}` : '';

  // 组装存档条目
  const entry = [
    `## 《${autoTitle}》（${date}）\n`,
    themeLabel ? `${themeLabel}\n` : '',
    '**叙述**:\n' + text + '\n\n',
    `**哲学转折**: ${turn}\n\n`,
    scoreRow,
    '',
    '\n---\n'
  ].filter(Boolean).join('\n');

  // 追加到存档
  try {
    if (fs.existsSync(ARCHIVE_PATH)) {
      const existing = fs.readFileSync(ARCHIVE_PATH, 'utf-8');
      // 在第一个 ## 标题前插入新条目（按日期倒序）
      const firstHeader = existing.search(/^## /m);
      if (firstHeader > 0) {
        fs.writeFileSync(ARCHIVE_PATH, existing.slice(0, firstHeader) + entry + existing.slice(firstHeader));
      } else {
        fs.writeFileSync(ARCHIVE_PATH, entry + '\n' + existing);
      }
    } else {
      fs.writeFileSync(ARCHIVE_PATH, `# Dream Archive — 心虫梦境存档\n\n${entry}`);
    }
    return { success: true, title: autoTitle, path: ARCHIVE_PATH };
  } catch (err) {
    return { success: false, error: err.message, path: ARCHIVE_PATH };
  }
}

/**
 * 从叙事文本自动提取标题
 * 策略：找第一个具体意象（井/门/镜子/水/井等）作为标题
 */
function generateTitle(text) {
  const clean = text.replace(/\n.+$/s, '').trim(); // 取第一句或第一段
  const patterns = [
    { re: /([^，。《》\n。]+的[^，。《》\n。]+)/, label: 'owner_possession' },
    { re: /([^。《》\n]{2,6})[，。]/, label: 'short_phrase' },
  ];
  for (const { re } of patterns) {
    const m = clean.match(re);
    if (m) return m[1].slice(0, 10);
  }
  // 默认：从文本取前5个字
  return clean.slice(0, 5) || '未名';
}

module.exports = { archiveDream, ARCHIVE_PATH };
