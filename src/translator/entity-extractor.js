/**
 * EntityExtractor — 实体/约束提取器
 * 从用户输入中提取关键实体和约束条件。
 */
class EntityExtractor {
  constructor() {
    this.name = 'entity-extractor';
    this.version = '1.0.0';
  }
  extract(input) {
    const entities = {
      concepts: this._extractConcepts(input),
      numbers: this._extractNumbers(input),
      people: this._extractPeople(input),
      timeframes: this._extractTimeframes(input),
      references: this._extractReferences(input),
      constraints: this._extractConstraints(input),
    };
    entities.count = Object.values(entities).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    return entities;
  }
  _extractConcepts(input) {
    const concepts = [];
    // 引号内的概念
    const quoted = input.match(/["""]([^"""]{2,30})["""]/g);
    if (quoted) concepts.push(...quoted.map(q => q.replace(/["""]/g, '')));
    // "关于X"的X
    const about = input.match(/关于\s*([\u4e00-\u9fa5a-zA-Z]{2,20})/);
    if (about) concepts.push(about[1]);
    return [...new Set(concepts)];
  }
  _extractNumbers(input) { return (input.match(/\d+[.\d]*/g) || []).map(Number); }
  _extractPeople(input) {
    const people = [];
    const matches = input.match(/(?:像|比如|例如|参考)\s*([\u4e00-\u9fa5]{2,4})/g);
    if (matches) people.push(...matches.map(m => m.replace(/像|比如|例如|参考/g, '').trim()));
    return [...new Set(people)];
  }
  _extractTimeframes(input) {
    if (/最近|前几天|上周|昨天/.test(input)) return [{ type: 'recent', original: input.match(/最近|前几天|上周|昨天/)[0] }];
    if (/历史|以前|过去|之前/.test(input)) return [{ type: 'historical', original: 'historical' }];
    if (/未来|以后|接下来|下一步/.test(input)) return [{ type: 'future', original: 'future' }];
    return [];
  }
  _extractReferences(input) {
    const refs = [];
    const urlMatch = input.match(/https?:\/\/[^\s]+/g);
    if (urlMatch) refs.push(...urlMatch.map(u => ({ type: 'url', value: u })));
    return refs;
  }
  _extractConstraints(input) {
    const c = {};
    if (/简短|几句话|简洁|一句话|50字|100字/.test(input)) c.length = 'short';
    if (/详细|全面|深入|展开|500字/.test(input)) c.length = 'detailed';
    if (/中文|英文/.test(input)) c.language = input.match(/中文|英文/)?.[0];
    if (/比喻|举例|案例/.test(input)) c.style = 'example-driven';
    if (/专业|学术|论文/.test(input)) c.style = 'academic';
    if (/简单|通俗|易懂|大白话/.test(input)) c.style = 'simple';
    return c;
  }
  destroy() {}
  stop() {}
}
module.exports = { EntityExtractor };
