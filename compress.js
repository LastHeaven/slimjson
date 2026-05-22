/**
 * 对象数组压缩转换工具
 *
 * 支持：不同对象有不同 key（后端未返回 null 字段时）
 * - buildKeys 扫描所有对象取 key 并集
 * - 嵌套对象/数组递归时同样合并子结构
 * - 缺失的 key 在 rows 中填充 null
 */

/* ============================================================
   内部辅助：确定一个值的类型分类
   ============================================================ */
function getValueKind(v) {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) {
    if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
      return 'object-array';   // [{...}, {...}]
    }
    return 'primitive-array';  // [1, 2, 3]  或  []
  }
  if (typeof v === 'object') return 'object'; // {...}
  return 'primitive';
}

/* ============================================================
   buildKeys — 扫描所有对象，递归构建完整 key 结构
   ============================================================ */
function buildKeys(sources) {
  // ---- 1. 取所有对象 key 的并集，按首次出现顺序排列 ----
  const orderedKeys = [];
  const seen = new Set();
  for (const obj of sources) {
    if (obj !== null && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (!seen.has(k)) {
          seen.add(k);
          orderedKeys.push(k);
        }
      }
    }
  }

  const keys = [];
  for (const keyName of orderedKeys) {
    // ---- 2. 找第一个非 null/undefined 的值来推断类型 ----
    let repValue = undefined;
    for (const obj of sources) {
      if (obj !== null && typeof obj === 'object') {
        const v = obj[keyName];
        if (v !== undefined && v !== null) { repValue = v; break; }
      }
    }

    const kind = getValueKind(repValue);

    if (kind === 'object') {
      // ---- 收集所有非 null 的嵌套对象，合并子 key ----
      const allNestedObjs = [];
      for (const obj of sources) {
        if (obj !== null && typeof obj === 'object') {
          const v = obj[keyName];
          if (v !== undefined && v !== null && typeof v === 'object' && !Array.isArray(v)) {
            allNestedObjs.push(v);
          }
        }
      }
      keys.push({ [keyName]: buildKeys(allNestedObjs) });

    } else if (kind === 'object-array') {
      // ---- 收集所有数组中的所有对象，合并子 key ----
      const allItems = [];
      for (const obj of sources) {
        if (obj !== null && typeof obj === 'object') {
          const arr = obj[keyName];
          if (Array.isArray(arr)) {
            for (const item of arr) {
              if (item !== null && typeof item === 'object') {
                allItems.push(item);
              }
            }
          }
        }
      }
      keys.push({ [keyName]: buildKeys(allItems) });

    } else {
      // primitive / primitive-array / null（全当字符串 key 处理）
      keys.push(keyName);
    }
  }

  return keys;
}

/* ============================================================
   buildRow — 按 keys 结构将单个源对象转为 row
   ============================================================ */
function trimTrailingNulls(arr) {
  let end = arr.length;
  while (end > 0 && arr[end - 1] === null) end--;
  if (end === arr.length) return arr;
  return arr.slice(0, end);
}

function buildRow(obj, keys, trim) {
  const row = [];
  for (const key of keys) {
    if (typeof key === 'string') {
      // 普通字段：缺失则 push null；显式的 undefined 也转 null
      const v = (obj != null && typeof obj === 'object') ? obj[key] : undefined;
      row.push(v === undefined ? null : v);
    } else {
      // 嵌套结构
      const [[keyName, childKeys]] = Object.entries(key);
      const val = obj != null && typeof obj === 'object' ? obj[keyName] : undefined;

      if (val === undefined || val === null) {
        row.push(null); // 字段缺失或为 null

      } else if (Array.isArray(val)) {
        // 对象数组
        const arr = val.map(item => buildRow(item, childKeys, trim));
        row.push(trim ? arr.map(r => trimTrailingNulls(r)) : arr);

      } else {
        // 单个嵌套对象
        const sub = buildRow(val, childKeys, trim);
        row.push(trim ? trimTrailingNulls(sub) : sub);
      }
    }
  }
  if (trim) {
    return trimTrailingNulls(row);
  }
  return row;
}

/* ============================================================
   compress / decompress
   ============================================================ */
function compress(source, opts) {
  if (Object.prototype.toString.call(source) === '[object Object]') {
    source = [source]
  } else if (!Array.isArray(source) || source.length === 0) {
    return source;  // 不满足条件直接返回原值
  }
  const trim = opts && opts.trimTrailingNulls;
  const keys = buildKeys(source);
  const rows = source.map(obj => buildRow(obj, keys, trim));
  return { keys, rows };
}

function decompress(compressed) {
  function buildFromRow(row, keys) {
    const obj = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = row[i];

      if (typeof key === 'string') {
        obj[key] = val === undefined ? null : val;

      } else {
        const [[keyName, childKeys]] = Object.entries(key);

        if (val === null || val === undefined) {
          // 字段缺失或为 null → 写入 null
          obj[keyName] = null;

        } else if (Array.isArray(val) && val.length > 0 && Array.isArray(val[0])) {
          // 对象数组
          obj[keyName] = val.map(r => buildFromRow(r, childKeys));

        } else {
          // 单个嵌套对象（或被 trim 的子 row）
          obj[keyName] = buildFromRow(val, childKeys);
        }
      }
    }
    return obj;
  }
  return compressed.rows.map(row => buildFromRow(row, compressed.keys));
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
