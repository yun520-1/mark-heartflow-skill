/**
 * PersonaMeta — persona_meta 输出与副作用控制
 *
 * 设计约束：
 * - 默认只返回 meta 对象，不污染正文
 * - 提供可选的 bodyMeta 字段，由上层按需决定是否应用
 * - 不新增硬依赖
 */

function createPersonaMeta(profile = {}, event = 'unknown') {
  const meta = {
    persona_meta: {
      emittedAt: new Date().toISOString(),
      event,
      profileId: profile.id || null,
      preset: profile.preset || null,
      tone: profile.tone || null,
      values: profile.values || null,
      styleHints: profile.styleHints || null,
      bigFiveOverrides: profile.bigFiveOverrides || null,
      philosophyBias: profile.philosophyBias || null,
      appliedToBody: false,
      bodyMeta: null
    }
  };
  return meta;
}

function attachBodyMeta(metaObj, text = '') {
  if (!metaObj || !metaObj.persona_meta) return metaObj;
  metaObj.persona_meta.appliedToBody = true;
  metaObj.persona_meta.bodyMeta = {
    text,
    wrapped: text,
    appliedPrefix: '',
    appliedSuffix: '',
    note: 'wrapper is not applied automatically; consume styleHints/instructions only'
  };
  return metaObj;
}

function clearPersonaMeta(metaObj) {
  if (!metaObj || !metaObj.persona_meta) return metaObj;
  metaObj.persona_meta.appliedToBody = false;
  metaObj.persona_meta.bodyMeta = null;
  return metaObj;
}

function describeMeta() {
  return {
    name: 'persona-meta',
    version: '1.0.0',
    behavior: 'emits persona_meta metadata only',
    defaultInjectsBody: false,
    api: ['createPersonaMeta', 'attachBodyMeta', 'clearPersonaMeta']
  };
}

module.exports = {
  createPersonaMeta,
  attachBodyMeta,
  clearPersonaMeta,
  describeMeta
};
