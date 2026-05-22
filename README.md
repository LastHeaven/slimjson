# slimjson

中文 | [English](./README_EN.md)

轻量级对象数组压缩工具 — 将重复 key 的 JSON 对象数组转换为 `{ keys, rows }` 紧凑格式，并支持序列化时省略 `null` 以进一步减小体积。

## 适用场景

- **API 列表接口**：后端返回列表接口时，每个对象都携带相同的 key 名，大量冗余
- **异构字段**：不同对象可能拥有不同的字段（后端按需 omit null 字段）
- **网络传输压缩**：需要在网络传输中极致压缩 JSON 文本体积
- **大模型上下文压缩**：将大量结构化数据（如数据库查询结果、API 响应、知识库条目）压缩后送入 prompt，减少 token 消耗，降低调用成本
- **大模型工具调用**：function calling / tool_use 返回的结果往往是结构化的对象数组，压缩后再回传给模型，可显著减少上下文窗口占用，让模型在有限 token 内处理更复杂的数据
- **大模型识别友好**：压缩后的 `{ keys, rows }` 格式将 schema（字段定义）与数据分离，key 只出现一次，模型能更准确地理解数据结构、按字段名提取信息，比重复 key 的原始 JSON 更不容易混淆

## 安装

```bash
npm install slimjson
```

## API

### `compress(source, opts?)`

将对象数组压缩为 `{ keys, rows }` 结构：

```js
import { compress } from 'slimjson';

const users = [
  { name: 'Alice', age: 25, city: 'NYC' },
  { name: 'Bob',   age: 30, city: 'LA' },
];

const compressed = compress(users);
// {
//   keys: ['name', 'age', 'city'],
//   rows: [
//     ['Alice', 25, 'NYC'],
//     ['Bob',   30, 'LA' ]
//   ]
// }
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `source` | `Object[]` 或 `Object` | — | 待压缩的对象数组（单个对象会自动包裹为数组） |
| `opts` | `Object` | — | 可选配置 |
| `opts.trimTrailingNulls` | `boolean` | `false` | 是否去除行尾的 `null` 值 |

**特点：**
- `keys` 取所有对象的 key 并集，按首次出现顺序排列
- 某对象缺失某字段 → 对应 row 位置填充 `null`
- 嵌套对象递归处理：`keys` 中表示为 `{ "fieldName": [childKeys] }`
- 对象数组（如订单条目）同样递归压缩
- 当传入的是对象时，会当成数组中只有一个对象处理

#### 嵌套对象示例

```js
const data = [
  { name: '张三', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello' } },
  { name: '李四', age: 35, profile: { avatar: 'b.jpg', file: null } },
  { name: '王五' },
];

compress(data);
// {
//   keys: ['name', 'age', { profile: ['avatar', 'bio', 'file'] }],
//   rows: [
//     ['张三', 28, ['a.jpg', 'Hello', null]],
//     ['李四', 35, ['b.jpg', null, null]],
//     ['王五', null, null]
//   ]
// }
```

#### `trimTrailingNulls`：去除尾部 null

启用后，每行及嵌套子行尾部的 `null` 会被去除，进一步压缩体积：

```js
compress(data, { trimTrailingNulls: true });
// {
//   keys: ['name', 'age', { profile: ['avatar', 'bio', 'file'] }],
//   rows: [
//     ['张三', 28, ['a.jpg', 'Hello']],
//     ['李四', 35, ['b.jpg']],
//     ['王五']
//   ]
// }
```

`decompress` 会自动将缺失的尾部值补回 `null`，roundtrip 还原结果一致：

```js
decompress(compress(data, { trimTrailingNulls: true }));
// [
//   { name: '张三', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello', file: null } },
//   { name: '李四', age: 35, profile: { avatar: 'b.jpg', bio: null, file: null } },
//   { name: '王五', age: null, profile: null }
// ]
```

#### 对象数组示例（订单场景）

```js
const orders = [
  { orderId: 'A001', items: [{ name: '键盘', price: 299 }, { name: '鼠标', price: 99 }] },
  { orderId: 'A002', items: [{ name: '显示器', price: 1999 }] },
];

compress(orders);
// {
//   keys: ['orderId', { items: ['name', 'price'] }],
//   rows: [
//     ['A001', [['键盘', 299], ['鼠标', 99]]],
//     ['A002', [['显示器', 1999]]]
//   ]
// }

stringify(compress(orders));
// {keys:[orderId,{items:[name,price]}],rows:[[A001,[[键盘,299],[鼠标,99]]],[A002,[[显示器,1999]]]]}
//                ^^^^^ 嵌套对象 key 无引号    ^^^^ 安全字符串 value 无引号
```

#### 三层嵌套示例（订单 → 商品 → 规格）

```js
const orders = [
  {
    orderId: 'A001',
    customer: '张三',
    items: [
      { name: '键盘', price: 299, specs: { color: '黑色', layout: '104键' } },
      { name: '鼠标', price: 99,  specs: { color: '白色', dpi: '4000' } },
    ]
  },
  {
    orderId: 'A002',
    customer: '李四',
    items: [
      { name: '显示器', price: 1999, specs: { color: '银色', size: '27寸' } },
    ]
  },
];

compress(orders);
// {
//   keys: [
//     'orderId',
//     'customer',
//     { items: ['name', 'price', { specs: ['color', 'layout', 'dpi', 'size'] }] }
//   ],
//   rows: [
//     ['A001', '张三', [
//       ['键盘', 299, ['黑色', '104键', null, null]],
//       ['鼠标', 99,  ['白色', null, '4000', null]]
//     ]],
//     ['A002', '李四', [
//       ['显示器', 1999, ['银色', null, null, '27寸']]
//     ]]
//   ]
// }
// specs 的 key 取并集：第一单有 layout，第二单有 size → 都保留，缺失的填 null

compress(orders, { trimTrailingNulls: true });
// rows 变为：
// [
//   ['A001', '张三', [
//     ['键盘', 299, ['黑色', '104键']],
//     ['鼠标', 99,  ['白色', null, '4000']]
//   ]],
//   ['A002', '李四', [
//     ['显示器', 1999, ['银色']]
//   ]]
// ]

stringify(compress(orders, { trimTrailingNulls: true }));
// {keys:[orderId,customer,{items:[name,price,{specs:[color,layout,dpi,size]}]}],rows:[[
//   A001,张三,[[键盘,299,[黑色,104键]],[鼠标,99,[白色,,4000]]]],[A002,李四,[[显示器,1999,[银色]]]]]}
```

#### 单对象示例
```js
compress({ name: 'Alice', age: 25 });
// 等价于 compress([{ name: 'Alice', age: 25 }])
// { keys: ['name', 'age'], rows: [['Alice', 25]] }
```

### `decompress(compressed)`

将 `{ keys, rows }` 还原为原始对象数组。缺失的尾部值会自动补回 `null`：

```js
const restored = decompress(compressed);
// deep-equal 原数组
```

### `stringify(compressed)`

将 compress 结果序列化为紧凑文本。相比 `JSON.stringify`，应用了以下优化规则：

```js
const data = [
  { name: 'Alice', age: 25 },
  { name: 'Bob',   age: 30 },
];

const text = stringify(compress(data));
// {keys:[name,age],rows:[[Alice,25],[Bob,30]]}

JSON.stringify(compress(data));
// {"keys":["name","age"],"rows":[["Alice",25],["Bob",30]]}
```

#### 序列化规则一览

| 值类型 | 序列化结果 | 说明 |
|--------|-----------|------|
| `null` / `undefined` | `null` | — |
| 有限数字 | `25` | 直接输出，无引号 |
| `NaN` / `Infinity` | `null` | 非有限数统一输出 null |
| `true` / `false` | `true` / `false` | — |
| 安全字符串 | `Alice` | 省略引号（见下方规则） |
| 非安全字符串 | `"hello world"` | 保留 JSON 引号和转义 |
| 嵌套对象 `{k: v}` | `{k:v}` | key 同样区分安全/非安全 |
| 数组 | 见下方 null 省略规则 | — |

#### 安全字符串（可省略引号的条件）

满足以下**全部**条件的字符串可省略引号，否则保留 `JSON.stringify` 转义：

1. 非空字符串
2. 不是关键字字面量：`null`、`true`、`false`
3. 不匹配数字模式：`/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/`（如 `"123"`、`"-3.14"`、`"1e10"` 均保留引号）
4. 不以数字或减号 `-` 开头
5. 不含空白、`[`、`]`、`{`、`}`、`,`、`:`、`"` 等字符

| 字符串 | 结果 | 原因 |
|--------|------|------|
| `"Alice"` | `Alice` | 安全，省略引号 |
| `"hello world"` | `"hello world"` | 含空格 |
| `"123"` | `"123"` | 看起来像数字 |
| `"-3.14"` | `"-3.14"` | 看起来像数字 |
| `"null"` | `"null"` | 关键字 |
| `""` | `""` | 空字符串 |
| `"-abc"` | `"-abc"` | 以减号开头 |
| `"a:b"` | `"a:b"` | 含冒号 |

#### 对象 key 引号规则

`keys` 中的嵌套对象 key 同样适用安全字符串判断：

```js
stringify({ keys: [{ profile: ['name', 'age'] }], rows: [...] });
// {keys:[{profile:[name,age]}],rows:[...]}   ← profile 是安全 key，省略引号

stringify({ keys: [{ "my-key": ['name'] }], rows: [...] });
// {keys:[{"my-key":[name]}],rows:[...]}      ← my-key 含减号，保留引号
```

#### 数组 null 省略规则

数组中的 `null` / `undefined` 被省略为逗号空槽，不占文字体积：

| 原始数组                 | 序列化结果      | 说明 |
|----------------------|------------|------|
| `["a", null, null]`  | `[a,,]`    | 尾部两个空槽 |
| `[null, 1, null]`    | `[,1,]`    | 前后空槽 |
| `[]`                 | `[]`       | 空数组 |
| `[null]`             | `[null]`   | **特殊**：`[,]` 代表 2 个 null，因此单 null 保留文字 |

### `parse(text)`

解析 `stringify` 产生的文本，将省略的 `null` 恢复：

```js
const parsed = parse(text);
// deep-equal compressed
```

支持完整 JSON 类型的解析（字符串、数字、布尔、null、嵌套对象/数组），兼容转义字符和 Unicode。

## 完整使用示例

```js
import { compress, decompress, stringify, parse } from 'slimjson';

const data = [
  { name: '张三', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello' } },
  { name: '李四', age: 35, profile: { avatar: 'b.jpg' } },              // 缺失 bio
];

// 压缩 → 文本化 → 解析 → 还原
const compressed = compress(data);
const text       = stringify(compressed);
const parsed     = parse(text);
const restored   = decompress(parsed);

// restored 与 data 深度相等

// 启用 trimTrailingNulls 进一步压缩
const compressedTrim = compress(data, { trimTrailingNulls: true });
const textTrim       = stringify(compressedTrim);
// textTrim 比 text 更短
```

### 压缩率计算

```js
const originalSize  = Buffer.byteLength(JSON.stringify(data));
const compressedSize = Buffer.byteLength(stringify(compress(data)));
const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
console.log(`压缩率: ${ratio}%`);
```

## 压缩效果

基于 `compress-test.js` 基准测试的实际数据（18 组测试，所有 roundtrip 解压正确）：

| 数据类型 | 对象数 | 原始大小 | 不 trim | 压缩率 | trim | 压缩率 | 差值 |
|---------|-------|---------|---------|-------|------|-------|------|
| 简单用户 | 1,000 | 147.61 KB | 87.12 KB | 40.98% | 87.12 KB | 40.98% | — |
| 简单用户 | 10,000 | 1.45 MB | 882.51 KB | 40.69% | 882.51 KB | 40.69% | — |
| 嵌套用户（含 profile.social） | 1,000 | 235.70 KB | 153.56 KB | 34.85% | 153.27 KB | 34.97% | -294 B |
| 订单（每单1-5商品） | 500 | 166.95 KB | 72.30 KB | 56.69% | 72.30 KB | 56.69% | — |
| 学校数据（6年级×4班×30生） | 24 | 214.86 KB | 88.88 KB | 58.63% | 88.53 KB | 58.80% | -365 B |
| 稀疏字段（500条×30字段） | 500 | 144.61 KB | 45.40 KB | 68.60% | 45.13 KB | 68.79% | -276 B |
| 稀疏字段（2000条×50字段） | 2,000 | 951.94 KB | 293.62 KB | 69.16% | 292.49 KB | 69.27% | -1.13 KB |
| 深层嵌套（5层组织结构） | 5 | 634.60 KB | 289.02 KB | 54.46% | 289.02 KB | 54.46% | — |

**结论：**
1. 字段名越长、数量越多，压缩效果越好
2. 对象数组（订单条目、学生列表）压缩效果显著（55–59%）
3. 稀疏字段压缩率最高 — 缺失字段的 null 通过空槽省略（67–69%）
4. `trimTrailingNulls` 在数据有缺失尾部字段时额外节省体积（最高 1.48 KB / 5000 条）
5. 数据完整无缺失字段时，trim 无额外收益
6. 深层嵌套结构能获得更好的压缩效果
7. `stringify` 省略引号进一步减少文本体积

## 开发

```bash
# 运行测试（192 个用例，100% 覆盖率）
npm test

# 运行压缩率基准测试（含 trim 对比）
node compress-test.js
```

## GitHub

[https://github.com/LastHeaven/slimjson](https://github.com/LastHeaven/slimjson)

## License

MIT
