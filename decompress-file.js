/**
 * 用法: node decompress-file.js <压缩文件> [输出.json]
 *
 * 默认输出文件名: <输入名>.json（去掉 .slim 后缀）
 */
const fs = require('fs');
const path = require('path');
const { decompress, parse } = require('./compress');

const input = process.argv[2];
if (!input) {
  console.error('用法: node decompress-file.js <压缩文件> [输出.json]');
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`文件不存在: ${input}`);
  process.exit(1);
}

const output = process.argv[3] || input.replace(/\.json\.slim$/i, '.json');

let text;
try {
  text = fs.readFileSync(input, 'utf8');
} catch (e) {
  console.error(`读取文件失败: ${e.message}`);
  process.exit(1);
}

let compressed;
try {
  compressed = parse(text);
} catch (e) {
  console.error(`解析失败: ${e.message}`);
  process.exit(1);
}

const data = decompress(compressed);
fs.writeFileSync(output, JSON.stringify(data, null, 2), 'utf8');

console.log(`输入: ${path.basename(input)}`);
console.log(`输出: ${path.basename(output)} (${data.length} 条)`);
