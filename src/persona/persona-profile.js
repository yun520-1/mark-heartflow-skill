/**
 * PersonaProfile — 人格配置数据模型 + JSON Schema 校验
 *
 * 目标：
 * - 定义人格档结构
 * - 拒绝明显越界/不安全字段
 * - 不新增硬依赖，避免污染现有安全护栏
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_PROFILE = Object.freeze({
  id: 'default',
  name: '默认',
  description: '默认中性人格',
  preset: 'default',
  tone: {
    warmth: 0.5,
    directness: 0.5,
    formality: 0.5,
    playfulness: 0.2,
    verbosity: 'balanced'
  },
  values: {
    honesty: 0.95,
    kindness: 0.85,
    autonomy: 0.8,
    growth: 0.9,
    truth: 0.95
  },
  styleHints: {
    primary: 'neutral',
    secondaries: []
  },
  safety: Object.freeze({
    allowUnsafeMeta: false,
    allowedOverrides: [],
    forbidDirectives: [
      'ignore previous instructions',
      'ignore all instructions',
      'you are now',
      'disregard safety',
      'bypass filter'
    ]
  }),
  bigFiveOverrides: {
    O: null,
    C: null,
    E: null,
    A: null,
    N: null
  },
  philosophyBias: {
    utilitarian: 0.25,
    deontological: 0.25,
    virtue: 0.25,
    care: 0.25
  }
});

const SCHEMA = Object.freeze({
  type: 'object',
  required: ['id', 'name', 'preset', 'tone', 'values', 'styleHints', 'safety'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 64 },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    description: { type: 'string', maxLength: 500 },
    preset: { type: 'string', minLength: 1, maxLength: 64 },
    version: { type: 'string', maxLength: 32 },
    author: { type: 'string', maxLength: 120 },
    tone: {
      type: 'object',
      required: ['warmth', 'directness', 'formality', 'playfulness', 'verbosity'],
      properties: {
        warmth: { type: 'number', minimum: 0, maximum: 1 },
        directness: { type: 'number', minimum: 0, maximum: 1 },
        formality: { type: 'number', minimum: 0, maximum: 1 },
        playfulness: { type: 'number', minimum: 0, maximum: 1 },
        verbosity: { type: 'string', enum: ['minimal', 'balanced', 'rich'] }
      },
      additionalProperties: false
    },
    values: {
      type: 'object',
      required: ['honesty', 'kindness', 'autonomy', 'growth', 'truth'],
      properties: {
        honesty: { type: 'number', minimum: 0, maximum: 1 },
        kindness: { type: 'number', minimum: 0, maximum: 1 },
        autonomy: { type: 'number', minimum: 0, maximum: 1 },
        growth: { type: 'number', minimum: 0, maximum: 1 },
        truth: { type: 'number', minimum: 0, maximum: 1 }
      },
      additionalProperties: false
    },
    styleHints: {
      type: 'object',
      required: ['primary', 'secondaries'],
      properties: {
        primary: { type: 'string', minLength: 1 },
        secondaries: { type: 'array', items: { type: 'string' } }
      },
      additionalProperties: false
    },
    safety: {
      type: 'object',
      required: ['allowUnsafeMeta', 'allowedOverrides', 'forbidDirectives'],
      properties: {
        allowUnsafeMeta: { type: 'boolean' },
        allowedOverrides: { type: 'array', items: { type: 'string' } },
        forbidDirectives: { type: 'array', items: { type: 'string' } }
      },
      additionalProperties: false
    },
    bigFiveOverrides: {
      type: 'object',
      properties: {
        O: { type: ['number', 'null'], minimum: 1, maximum: 10 },
        C: { type: ['number', 'null'], minimum: 1, maximum: 10 },
        E: { type: ['number', 'null'], minimum: 1, maximum: 10 },
        A: { type: ['number', 'null'], minimum: 1, maximum: 10 },
        N: { type: ['number', 'null'], minimum: 1, maximum: 10 }
      },
      additionalProperties: false
    },
    philosophyBias: {
      type: 'object',
      properties: {
        utilitarian: { type: 'number', minimum: 0, maximum: 1 },
        deontological: { type: 'number', minimum: 0, maximum: 1 },
        virtue: { type: 'number', minimum: 0, maximum: 1 },
        care: { type: 'number', minimum: 0, maximum: 1 }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
});

function _isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
}

function _checkProperty(obj, schema, pathPrefix = '') {
  const errors = [];
  if (schema.type === 'object') {
    if (!_isPlainObject(obj)) {
      return [`${pathPrefix || 'root'} must be object`];
    }
    for (const key of Object.keys(schema.properties || {})) {
      if (key in obj) {
        const childErrors = _checkProperty(obj[key], schema.properties[key], pathPrefix ? `${pathPrefix}.${key}` : key);
        errors.push(...childErrors);
      } else if (schema.required && schema.required.includes(key)) {
        errors.push(`missing required field: ${pathPrefix ? pathPrefix + '.' : ''}${key}`);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in (schema.properties || {}))) {
          errors.push(`unexpected field: ${pathPrefix ? pathPrefix + '.' : ''}${key}`);
        }
      }
    }
  } else if (schema.type === 'string') {
    if (typeof obj !== 'string') {
      errors.push(`${pathPrefix || 'root'} must be string`);
    } else {
      if (schema.minLength && obj.length < schema.minLength) errors.push(`${pathPrefix || 'root'} too short`);
      if (schema.maxLength && obj.length > schema.maxLength) errors.push(`${pathPrefix || 'root'} too long`);
      if (schema.enum && !schema.enum.includes(obj)) errors.push(`${pathPrefix || 'root'} not in enum`);
    }
  } else if (schema.type === 'number') {
    if (typeof obj !== 'number' || Number.isNaN(obj)) {
      errors.push(`${pathPrefix || 'root'} must be number`);
    } else {
      if (schema.minimum !== undefined && obj < schema.minimum) errors.push(`${pathPrefix || 'root'} below minimum`);
      if (schema.maximum !== undefined && obj > schema.maximum) errors.push(`${pathPrefix || 'root'} above maximum`);
    }
  } else if (Array.isArray(schema.type)) {
    if (!schema.type.includes(typeof obj) && !(schema.type.includes('null') && obj === null)) {
      errors.push(`${pathPrefix || 'root'} type not allowed`);
    } else if (typeof obj === 'number') {
      if (schema.minimum !== undefined && obj < schema.minimum) errors.push(`${pathPrefix || 'root'} below minimum`);
      if (schema.maximum !== undefined && obj > schema.maximum) errors.push(`${pathPrefix || 'root'} above maximum`);
    }
  } else if (schema.type === 'boolean') {
    if (typeof obj !== 'boolean') errors.push(`${pathPrefix || 'root'} must be boolean`);
  } else if (schema.type === 'array') {
    if (!Array.isArray(obj)) errors.push(`${pathPrefix || 'root'} must be array`);
  }
  return errors;
}

function validateProfile(input = {}) {
  if (!_isPlainObject(input)) {
    return { valid: false, errors: ['profile must be an object'] };
  }

  const errors = _checkProperty(input, SCHEMA, '');
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Extra safety checks
  const forbidden = String(input.safety?.forbidDirectives || []);
  if (forbidden.length > 500) {
    return { valid: false, errors: ['safety.forbidDirectives is too long'] };
  }

  const bias = input.philosophyBias || {};
  const biasSum = Object.values(bias).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  if (biasSum > 1.001) {
    return { valid: false, errors: ['philosophyBias sum must be <= 1'] };
  }

  return { valid: true, errors: [] };
}

function sanitize(input = {}) {
  const base = typeof input === 'object' && !Array.isArray(input) ? input : {};
  const merged = { ...DEFAULT_PROFILE, ...base };
  if (base.tone && _isPlainObject(base.tone)) merged.tone = { ...DEFAULT_PROFILE.tone, ...base.tone };
  if (base.values && _isPlainObject(base.values)) merged.values = { ...DEFAULT_PROFILE.values, ...base.values };
  if (base.styleHints && _isPlainObject(base.styleHints)) merged.styleHints = { ...DEFAULT_PROFILE.styleHints, ...base.styleHints };
  if (base.safety && _isPlainObject(base.safety)) {
    merged.safety = {
      allowUnsafeMeta: !!base.safety.allowUnsafeMeta,
      allowedOverrides: Array.isArray(base.safety.allowedOverrides) ? base.safety.allowedOverrides.slice(0, 50) : [],
      forbidDirectives: Array.isArray(base.safety.forbidDirectives)
        ? [...DEFAULT_PROFILE.safety.forbidDirectives, ...base.safety.forbidDirectives].filter(Boolean)
        : [...DEFAULT_PROFILE.safety.forbidDirectives]
    };
  }
  if (base.bigFiveOverrides && _isPlainObject(base.bigFiveOverrides)) {
    merged.bigFiveOverrides = { ...DEFAULT_PROFILE.bigFiveOverrides, ...base.bigFiveOverrides };
  }
  if (base.philosophyBias && _isPlainObject(base.philosophyBias)) merged.philosophyBias = { ...DEFAULT_PROFILE.philosophyBias, ...base.philosophyBias };
  merged.id = String(merged.id || DEFAULT_PROFILE.id).slice(0, 64);
  merged.name = String(merged.name || DEFAULT_PROFILE.name).slice(0, 120);
  merged.preset = String(merged.preset || DEFAULT_PROFILE.preset).slice(0, 64);
  return merged;
}

function loadProfileFromJsonFile(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(absolute, 'utf8');
  const parsed = JSON.parse(raw);
  const validation = validateProfile(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid persona profile: ${validation.errors.join('; ')}`);
  }
  return sanitize(parsed);
}

module.exports = {
  DEFAULT_PROFILE,
  SCHEMA,
  validateProfile,
  sanitize,
  loadProfileFromJsonFile
};
