/**
 * 用法: node compress-ratio.js <json文件路径>
 *
 * 读取 JSON 文件压缩，输出压缩率。
 */
const fs = require('fs');
const path = require('path');
const { compress, stringify } = require('./compress');

function getByteSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------- 参数解析 ----------
const filePath = process.argv[2];
if (!filePath) {
  console.error('用法: node compress-ratio.js <json文件>');
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(1);
}

// ---------- 读取并解析 ----------
let raw;
try {
  raw = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.error(`读取文件失败: ${e.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`JSON 解析失败: ${e.message}`);
  process.exit(1);
}

const originalSize = Buffer.byteLength(JSON.stringify(data), 'utf8');

// ---------- 压缩 ----------
const compressed = compress(data);
const compressedStr = stringify(compressed);

const compressedSize = Buffer.byteLength(compressedStr, 'utf8');

const savings = originalSize - compressedSize;
const ratio = originalSize === 0 ? 0 : (savings / originalSize * 100);

// ---------- 输出 ----------
const fileName = path.basename(filePath);

console.log(`\n文件: ${fileName}`);
console.log(`原始大小: ${formatBytes(originalSize)}`);
console.log(`压缩后:   ${formatBytes(compressedSize)}`);
console.log(`节省:     ${formatBytes(savings)} (${ratio.toFixed(2)}%)`);

// 如果是数组，额外输出元素数量
if (Array.isArray(data)) {
  console.log(`元素数量: ${data.length}`);
}
