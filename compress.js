/**
 * 对象数组压缩转换工具
 *
 * 支持：不同对象有不同 key（后端未返回 null 字段时）
 * - buildKeys 扫描所有对象取 key 并集
 * - 嵌套对象/数组递归时同样合并子结构
 * - 缺失的 key 在 rows 中填充 null
 */

/**
 * 合并两个 schema（取键的并集，保持顺序）
 * 对象 schema 合并键，嵌套数组 schema 递归合并内层，原始值数组取第一个
 */
function mergeSchemas(s1, s2) {
    if (!Array.isArray(s1) || !Array.isArray(s2)) return s1;

    const first1 = s1[0];
    const first2 = s2[0];

    // 两者都是对象 schema（元素是字符串或 {key: sub} 对象）→ 合并字段
    const isObj1 = s1.length === 0 || typeof first1 === 'string' ||
        (typeof first1 === 'object' && first1 !== null && !Array.isArray(first1));
    const isObj2 = s2.length === 0 || typeof first2 === 'string' ||
        (typeof first2 === 'object' && first2 !== null && !Array.isArray(first2));

    if (isObj1 && isObj2) {
        const merged = [...s1];
        const existingKeys = new Set();
        for (const field of merged) {
            existingKeys.add(typeof field === 'string' ? field : Object.keys(field)[0]);
        }
        for (const field of s2) {
            const key = typeof field === 'string' ? field : Object.keys(field)[0];
            if (!existingKeys.has(key)) {
                merged.push(field);
                existingKeys.add(key);
            }
        }
        return merged;
    }

    // 两者都是数组（不是对象 schema）→ 递归合并第一个元素
    if (Array.isArray(first1) && Array.isArray(first2)) {
        return [mergeSchemas(first1, first2)];
    }

    // 其他情况（原始值数组或类型不匹配）→ 取第一个
    return s1;
}

/**
 * 推断值的 schema（从所有数据中收集完整结构）
 */
function inferSchema(value) {
    if (Array.isArray(value)) {
        if (value.length === 0) return [[]];
        const first = value[0];
        if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
            // 对象数组
            return [inferObjectSchema(value)];
        }
        if (Array.isArray(first)) {
            // 数组的数组：对每个内层数组递归推断 schema，然后合并
            let merged = null;
            for (const inner of value) {
                const s = inferSchema(inner);
                if (s) {
                    merged = merged ? mergeSchemas(merged, s) : s;
                }
            }
            return [merged || inferSchema(first)];
        }
        // 检查是否含对象（混合数组）
        const objects = value.filter(v => v && typeof v === 'object' && !Array.isArray(v));
        if (objects.length > 0) {
            return [inferObjectSchema(objects)];
        }
        // 原始值数组 - 不压缩，由父级处理
        return undefined;
    }
    if (typeof value === 'object' && value !== null) {
        return inferObjectSchema([value]);
    }
    return undefined;
}

/**
 * 从多个对象中推断对象 schema（取所有 key 的并集）
 */
function inferObjectSchema(objects) {
    const keyOrder = [];
    const keyValues = new Map();

    for (const obj of objects) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;
        for (const key of Object.keys(obj)) {
            if (!keyValues.has(key)) {
                keyOrder.push(key);
                keyValues.set(key, []);
            }
            const val = obj[key];
            if (val != null) {
                keyValues.get(key).push(val);
            }
        }
    }

    return keyOrder.map(key => {
        const values = keyValues.get(key) || [];
        if (values.length === 0) return key;

        const sample = values[0];

        // 值是对象 → 递归推断对象 schema（单对象，非数组）
        if (typeof sample === 'object' && sample !== null && !Array.isArray(sample)) {
            const subObjects = values.filter(v => typeof v === 'object' && v !== null && !Array.isArray(v));
            return { [key]: inferObjectSchema(subObjects) };
        }

        // 值是数组
        if (Array.isArray(sample)) {
            // 空数组 → 无法推断，用 key 名
            if (sample.length === 0) return key;

            // 数组元素是对象 → 对象数组：{ key: [objectSchema] }
            if (typeof sample[0] === 'object' && sample[0] !== null && !Array.isArray(sample[0])) {
                const allItems = [];
                for (const v of values) {
                    if (Array.isArray(v)) {
                        for (const item of v) {
                            if (item && typeof item === 'object' && !Array.isArray(item)) {
                                allItems.push(item);
                            }
                        }
                    }
                }
                return { [key]: [inferObjectSchema(allItems)] };
            }

            // 数组元素是数组 → 检查是否含对象
            if (Array.isArray(sample[0])) {
                // 不含对象的嵌套数组（如 [[1,2],[3,4]]）→ 不压缩，直接用 key 名
                if (!containsObject(sample)) return key;

                // 含对象的嵌套数组 → 递归推断内层 schema 并合并
                let merged = null;
                for (const v of values) {
                    if (Array.isArray(v)) {
                        const s = inferSchema(v);
                        if (s) {
                            // inferSchema 返回 [innerSchema]，取 innerSchema 用于合并
                            const inner = Array.isArray(s) && s.length === 1 ? s[0] : s;
                            merged = merged ? mergeSchemas(merged, inner) : inner;
                        }
                    }
                }
                // 再包一层 [] 表示"数组的数组"
                return { [key]: [merged || inferSchema(sample[0])] };
            }

            // 原始值数组（如 ["张三","李四"]）→ 不压缩，直接用 key 名
            return key;
        }

        // 原始值 → 直接用 key 名
        return key;
    });
}

/**
 * 使用已知 schema 压缩值为 data
 */
function compressWithSchema(value, schema) {
    if (schema === undefined) return value;

    // schema 是 [innerSchema] → 值是数组
    if (Array.isArray(schema) && schema.length === 1 && Array.isArray(schema[0])) {
        const inner = schema[0];
        if (!Array.isArray(value)) return null;
        return value.map(item => compressWithSchema(item, inner));
    }

    // schema 包含 undefined → 原始值数组，不压缩
    if (Array.isArray(schema) && schema.some(s => s === undefined || s === null)) {
        return value;
    }

    // schema 是数组（对象 schema）→ 值是对象
    if (Array.isArray(schema)) {
        if (Array.isArray(value)) return value.length === 0 ? [] : null;
        if (!value || typeof value !== 'object') return value;
        return schema.map(fieldDef => {
            let key, valueSchema;
            if (typeof fieldDef === 'string') {
                key = fieldDef;
                valueSchema = undefined;
            } else {
                key = Object.keys(fieldDef)[0];
                valueSchema = fieldDef[key];
            }
            const val = value[key];
            if (val == null) return null;
            return compressWithSchema(val, valueSchema);
        });
    }

    return value;
}

/**
 * 判断值是否包含对象（递归检查）
 */
function containsObject(value) {
    if (value === null || typeof value !== 'object') return false;
    if (!Array.isArray(value)) return true;
    for (const item of value) {
        if (containsObject(item)) return true;
    }
    return false;
}

/**
 * 递归去掉数组尾部连续 null
 */
function trimTrailingNullsDeep(data) {
    if (!Array.isArray(data)) return data;
    const trimmed = data.map(item => trimTrailingNullsDeep(item));
    while (trimmed.length > 0 && trimmed[trimmed.length - 1] === null) {
        trimmed.pop();
    }
    return trimmed;
}

/**
 * 压缩任意 JSON 值为 { schema, data } 格式
 * 不含对象的数组和非对象非数组的值直接返回
 * @param {any} value - 要压缩的值
 * @param {object} [options] - 选项
 * @param {boolean} [options.trimTrailingNulls=false] - 去掉数组尾部连续 null
 */
function compress(value, options) {
    if (!containsObject(value)) return value;
    const schema = inferSchema(value);
    let data = compressWithSchema(value, schema);
    if (options && options.trimTrailingNulls) {
        data = trimTrailingNullsDeep(data);
    }
    return { schema, data };
}

/**
 * 使用 schema 还原 data 为原始对象
 */
function decompressWithSchema(data, schema) {
    if (schema === undefined) return data;
    if (data == null) return null;

    // schema 是 [innerSchema] → 还原为数组
    if (Array.isArray(schema) && schema.length === 1 && Array.isArray(schema[0])) {
        if (!Array.isArray(data)) return data;
        const inner = schema[0];
        return data.map(item => decompressWithSchema(item, inner));
    }

    // schema 是数组
    if (Array.isArray(schema)) {
        // schema 包含 undefined 元素 → 原始值数组，不压缩
        if (schema.some(s => s === undefined || s === null)) return data;

        // 原始值（混合数组中的原始元素）→ 直接返回
        if (typeof data !== 'object' || data === null) return data;

        // 对象 schema → 还原为对象
        const obj = {};
        for (let i = 0; i < schema.length; i++) {
            const fieldDef = schema[i];
            let key, valueSchema;
            if (typeof fieldDef === 'string') {
                key = fieldDef;
                valueSchema = undefined;
            } else if (typeof fieldDef === 'object' && fieldDef !== null) {
                key = Object.keys(fieldDef)[0];
                valueSchema = fieldDef[key];
            } else {
                continue;
            }
            const val = data[i];
            if (val === undefined) { obj[key] = null; continue; }
            obj[key] = decompressWithSchema(val, valueSchema);
        }
        return obj;
    }

    return data;
}

/**
 * 从 { schema, data } 还原为原始值
 * 如果输入不含 schema（直接值），原样返回
 */
function decompress(compressed) {
    if (compressed === null || typeof compressed !== 'object' || Array.isArray(compressed)) return compressed;
    if (!('data' in compressed)) return compressed;
    return decompressWithSchema(compressed.data, compressed.schema);
}
/* ============================================================
   判断字符串是否可安全省略引号
   ============================================================ */
function isSafeBareString(s) {
  if (s === '') return false;
  if (s === 'null' || s === 'true' || s === 'false') return false;
  // 看起来像数字的不省略
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return false;
  // 以数字或减号开头的也不省略（避免 parseValue 的数字分支误吞）
  if (/^[-\d]/.test(s)) return false;
  // 含分隔符、空白的不省略
  if (/[\s\[\]{},:"]/.test(s)) return false;
  return true;
}

/* ============================================================
   stringify / parse — 省略 null 的文本化与还原
   ============================================================ */

/**
 * 将 compress 结果文本化
 * - 数组中的 null 被省略为逗号空槽：[null, 1, null] → [,1,]
 * - 安全的字符串省略引号："hello" → hello
 *
 * @param {*} compressed  待序列化的值
 */
function stringify(compressed) {
  return serializeValue(compressed);
}

/** 序列化单个值 */
function serializeValue(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') {
    if (isSafeBareString(v)) return v;
    return JSON.stringify(v);
  }
  if (typeof v === 'number') {
    if (Number.isFinite(v)) return String(v);
    return 'null'; // NaN, Infinity → null
  }
  if (typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return serializeArray(v);
  if (typeof v === 'object') return serializeObject(v);
  return 'null';
}

/** 序列化数组：null 变为空槽（保留逗号） */
function serializeArray(arr) {
  if (arr.length === 0) return '[]';
  const parts = arr.map(item => {
    if (item === null || item === undefined) return '';
    return serializeValue(item);
  });
  const inner = parts.join(',');
  const result = '[' + inner + ']';
  // 特殊边界：单 null 元素无法用逗号表示
  //   [,] 在本格式中代表 2 个 null，所以 [null] 必须保留 null 文字
  if (result === '[]') return '[null]';
  return result;
}

/** 序列化对象（用于 keys 中的嵌套结构） */
function serializeObject(obj) {
  const pairs = Object.entries(obj).map(([k, v]) => {
    const keyStr = isSafeBareString(k) ? k : JSON.stringify(k);
    return keyStr + ':' + serializeValue(v);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * 解析 stringify 产生的文本，恢复省略的 null
 */
function parse(text) {
  let pos = 0;

  function error(msg) {
    throw new Error(`Parse error at ${pos}: ${msg} — near "${text.slice(Math.max(0, pos - 5), pos + 10)}"`);
  }

  function skipWs() {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
  }

  /** 判断字符是否为值边界（分隔符或 EOF） */
  function isBoundaryChar(c) {
    return c === undefined || /[\s\[\]{},:]/.test(c);
  }

  function parseValue() {
    skipWs();
    if (pos >= text.length) error('Unexpected end');
    const ch = text[pos];
    if (ch === '"') return parseString();
    if (ch === '{') return parseObject();
    if (ch === '[') return parseArray();
    // 关键字：精确匹配且后接边界符或 EOF，否则归为裸字符串
    if (text.startsWith('null', pos) && isBoundaryChar(text[pos + 4])) { pos += 4; return null; }
    if (text.startsWith('true', pos) && isBoundaryChar(text[pos + 4])) { pos += 4; return true; }
    if (text.startsWith('false', pos) && isBoundaryChar(text[pos + 5])) { pos += 5; return false; }
    if (ch === '-' || (ch >= '0' && ch <= '9')) return parseNumber();
    // 裸字符串（无引号标识符）
    return parseBareString();
  }

  function parseString() {
    let result = '';
    pos++; // skip opening "
    while (pos < text.length) {
      const ch = text[pos];
      if (ch === '"') { pos++; return result; }
      if (ch === '\\') {
        pos++;
        const esc = text[pos];
        switch (esc) {
          case '"': result += '"'; break;
          case '\\': result += '\\'; break;
          case '/': result += '/'; break;
          case 'b': result += '\b'; break;
          case 'f': result += '\f'; break;
          case 'n': result += '\n'; break;
          case 'r': result += '\r'; break;
          case 't': result += '\t'; break;
          case 'u': {
            const hex = text.substring(pos + 1, pos + 5);
            result += String.fromCharCode(parseInt(hex, 16));
            pos += 4;
            break;
          }
          default: result += esc;
        }
      } else {
        result += ch;
      }
      pos++;
    }
    error('Unterminated string');
  }

  /** 解析数组：逗号 = null，空槽 = null */
  function parseArray() {
    pos++; // skip [
    const result = [];
    skipWs();
    if (text[pos] === ']') { pos++; return result; }

    while (true) {
      skipWs();
      const ch = text[pos];

      if (ch === ',' || ch === ']') {
        // 空槽 → null
        if (ch === ']') {
          result.push(null);
          pos++;
          return result;
        }
        result.push(null);
        pos++; // skip comma
        skipWs();
        if (text[pos] === ']') {
          result.push(null); // 尾部空槽
          pos++;
          return result;
        }
        continue;
      }

      result.push(parseValue());
      skipWs();

      if (text[pos] === ']') { pos++; return result; }
      if (text[pos] === ',') { pos++; continue; }
      error(`Expected , or ], got: ${text[pos]}`);
    }
  }

  function parseObject() {
    pos++; // skip {
    const obj = {};
    skipWs();
    if (text[pos] === '}') { pos++; return obj; }

    while (true) {
      skipWs();
      // key 支持引号字符串或裸字符串
      const key = text[pos] === '"' ? parseString() : parseBareString();
      skipWs();
      if (text[pos] !== ':') error('Expected :');
      pos++;
      const val = parseValue();
      obj[key] = val;
      skipWs();
      if (text[pos] === '}') { pos++; return obj; }
      if (text[pos] === ',') { pos++; continue; }
      error(`Expected , or }`);
    }
  }

  /** 解析裸字符串（无引号标识符），读到分隔符或 EOF 为止 */
  function parseBareString() {
    const start = pos;
    while (pos < text.length && !/[\s\[\]{},:]/.test(text[pos])) {
      pos++;
    }
    const result = text.substring(start, pos);
    if (result === '') error('Expected value');
    if (result === 'null') return null;
    if (result === 'true') return true;
    if (result === 'false') return false;
    return result;
  }

  function parseNumber() {
    const start = pos;
    if (text[pos] === '-') pos++;
    while (pos < text.length && text[pos] >= '0' && text[pos] <= '9') pos++;
    if (text[pos] === '.') {
      pos++;
      while (pos < text.length && text[pos] >= '0' && text[pos] <= '9') pos++;
    }
    if (text[pos] === 'e' || text[pos] === 'E') {
      pos++;
      if (text[pos] === '+' || text[pos] === '-') pos++;
      while (pos < text.length && text[pos] >= '0' && text[pos] <= '9') pos++;
    }
    const num = Number(text.substring(start, pos));
    if (!Number.isFinite(num)) return null;
    return num;
  }

  const result = parseValue();
  skipWs();
  if (pos < text.length) error(`Unexpected trailing: "${text.slice(pos)}"`);
  return result;
}

module.exports = { compress, decompress, stringify, parse };
module.exports.default = module.exports;
