/**
 * 用法: node compress-file.js <输入.json> [输出]
 *
 * 默认输出文件名: <输入名>.json.slim
 */
const fs = require('fs');
const path = require('path');
const { compress, stringify } = require('./compress');

const input = process.argv[2];
if (!input) {
  console.error('用法: node compress-file.js <输入.json> [输出]');
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`文件不存在: ${input}`);
  process.exit(1);
}

const output = (process.argv[3] || input).replace(/\.json$/i, '') + '.json.slim';

let data;
try {
  data = JSON.parse(fs.readFileSync(input, 'utf8'));
} catch (e) {
  console.error(`JSON 解析失败: ${e.message}`);
  process.exit(1);
}

const compressed = compress(data);
const text = stringify(compressed);

fs.writeFileSync(output, text, 'utf8');

const originalSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
const newSize = Buffer.byteLength(text, 'utf8');
const ratio = ((originalSize - newSize) / originalSize * 100).toFixed(2);

console.log(`输入: ${path.basename(input)} (${(originalSize / 1024).toFixed(2)} KB)`);
console.log(`输出: ${path.basename(output)} (${(newSize / 1024).toFixed(2)} KB)`);
console.log(`压缩率: ${ratio}%`);
