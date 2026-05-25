# slimjson

中文 | [English](./README_EN.md)

轻量级对象数组压缩工具 — 将重复 key 的 JSON 对象数组转换为 `{ schema, data }` 紧凑格式，并支持序列化时省略 `null` 以进一步减小体积。

## 适用场景

- **API 列表接口**：后端返回列表接口时，每个对象都携带相同的 key 名，大量冗余
- **异构字段**：不同对象可能拥有不同的字段（后端按需 omit null 字段）
- **网络传输压缩**：需要在网络传输中极致压缩 JSON 文本体积
- **大模型上下文压缩**：将大量结构化数据（如数据库查询结果、API 响应、知识库条目）压缩后送入 prompt，减少 token 消耗，降低调用成本
- **大模型工具调用**：function calling / tool_use 返回的结果往往是结构化的对象数组，压缩后再回传给模型，可显著减少上下文窗口占用，让模型在有限 token 内处理更复杂的数据
- **大模型识别友好**：压缩后的 `{ schema, data }` 格式将 schema（字段定义）与数据分离，key 只出现一次，模型能更准确地理解数据结构、按字段名提取信息，比重复 key 的原始 JSON 更不容易混淆

## 大模型优化小建议

- **给列表加上索引序号**：在数据中显式添加序号字段（如 `id: 0, 1, 2...`），可以让大模型在引用特定记录时返回更准确的索引序号，减少错位问题。

## 安装

```bash
npm install slimjson
```

## API

### `compress(source, opts?)`

将对象数组压缩为 `{ schema, data }` 结构：

```js
import { compress } from 'slimjson';

const users = [
  { name: 'Alice', age: 25, city: 'NYC' },
  { name: 'Bob',   age: 30, city: 'LA' },
];

const compressed = compress(users);
// {
//   schema: [['name', 'age', 'city']],
//   data: [['Alice', 25, 'NYC'], ['Bob', 30, 'LA']]
// }
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `source` | `Object[]` 或 `Object` | — | 待压缩的对象数组（单个对象会自动包裹为数组） |
| `opts` | `Object` | — | 可选配置 |
| `opts.trimTrailingNulls` | `boolean` | `false` | 是否去除行尾的 `null` 值 |

**特点：**
- `schema` 取所有对象的 key 并集，按首次出现顺序排列
- 某对象缺失某字段 → 对应 data 位置填充 `null`
- 嵌套对象递归处理：`schema` 中表示为 `{ "fieldName": [childKeys] }`
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
//   schema: [['name', 'age', { profile: ['avatar', 'bio', 'file'] }]],
//   data: [
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
//   schema: [['name', 'age', { profile: ['avatar', 'bio', 'file'] }]],
//   data: [
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
//   schema: [['orderId', { items: [['name', 'price']] }]],
//   data: [['A001', [['键盘', 299], ['鼠标', 99]]], ['A002', [['显示器', 1999]]]]
// }

stringify(compress(orders));
// {schema:[[orderId,{items:[[name,price]]}]],data:[[A001,[[键盘,299],[鼠标,99]]],[A002,[[显示器,1999]]]]}
//                  ^^^^^ 嵌套对象 key 无引号    ^^^^ 安全字符串 value 无引号
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
//   schema: [[
//     'orderId',
//     'customer',
//     { items: [['name', 'price', { specs: ['color', 'layout', 'dpi', 'size'] }]] }
//   ]],
//   data: [
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
// data 变为：
// [
//   ['A001', '张三', [
//     ['键盘', 299, ['黑色', '104键']],
//     ['鼠标', 99,  ['白色', null, '4000']]
//   ]],
//   ['A002', '李四', [
//     ['显示器', 1999, ['银色', null, null, '27寸']]
//   ]]
// ]

stringify(compress(orders, { trimTrailingNulls: true }));
// {schema:[[orderId,customer,{items:[[name,price,{specs:[color,layout,dpi,size]}]]}]],data:[[
//   A001,张三,[[键盘,299,[黑色,"104键"]],[鼠标,99,[白色,,4000]]]],[A002,李四,[[显示器,1999,[银色,,,"27寸"]]]]]}
```

#### 单对象示例
```js
compress({ name: 'Alice', age: 25 });
// 等价于 compress([{ name: 'Alice', age: 25 }])
// { schema: ['name', 'age'], data: ['Alice', 25] }
```

### `decompress(compressed)`

将 `{ schema, data }` 还原为原始对象数组。缺失的尾部值会自动补回 `null`：

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
// {schema:[[name,age]],data:[[Alice,25],[Bob,30]]}

JSON.stringify(compress(data));
// {"schema":[["name","age"]],"data":[["Alice",25],["Bob",30]]}
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

`schema` 中的嵌套对象 key 同样适用安全字符串判断：

```js
stringify({ schema: [{ profile: ['name', 'age'] }], data: [...] });
// {schema:[{profile:[name,age]}],data:[...]}   ← profile 是安全 key，省略引号

stringify({ schema: [{ "my key": ['name'] }], data: [...] });
// {schema:[{"my key":[name]}],data:[...]}      ← my key 含空格，保留引号
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
| 简单用户 | 100 | 14.69 KB | 8.69 KB | 40.82% | 8.69 KB | 40.82% | — |
| 简单用户 | 1,000 | 147.74 KB | 87.25 KB | 40.94% | 87.25 KB | 40.94% | — |
| 简单用户 | 10,000 | 1.45 MB | 881.58 KB | 40.71% | 881.58 KB | 40.71% | — |
| 嵌套用户（含 profile.social） | 100 | 23.41 KB | 15.28 KB | 34.74% | 15.24 KB | 34.87% | -33 B |
| 嵌套用户（含 profile.social） | 1,000 | 236.03 KB | 153.93 KB | 34.78% | 153.64 KB | 34.91% | -301 B |
| 嵌套用户（含 profile.social） | 5,000 | 1.16 MB | 777.89 KB | 34.58% | 776.42 KB | 34.70% | -1.47 KB |
| 订单（每单1-5商品） | 100 | 31.28 KB | 13.65 KB | 56.38% | 13.65 KB | 56.38% | — |
| 订单（每单1-5商品） | 500 | 163.18 KB | 70.83 KB | 56.59% | 70.83 KB | 56.59% | — |
| 订单（每单1-5商品） | 2,000 | 655.99 KB | 284.29 KB | 56.66% | 284.29 KB | 56.66% | — |
| 学校数据（2年级×2班×10生） | 4 | 12.26 KB | 5.25 KB | 57.20% | 5.23 KB | 57.36% | -21 B |
| 学校数据（6年级×4班×30生） | 24 | 217.73 KB | 89.71 KB | 58.80% | 89.31 KB | 58.98% | -406 B |
| 学校数据（6年级×6班×50生） | 36 | 539.64 KB | 222.56 KB | 58.76% | 221.66 KB | 58.92% | -923 B |
| 稀疏字段（100条×20字段） | 100 | 19.50 KB | 6.34 KB | 67.46% | 6.28 KB | 67.78% | -64 B |
| 稀疏字段（500条×30字段） | 500 | 143.26 KB | 45.09 KB | 68.52% | 44.78 KB | 68.74% | -326 B |
| 稀疏字段（2000条×50字段） | 2,000 | 957.96 KB | 294.69 KB | 69.24% | 293.54 KB | 69.36% | -1.15 KB |
| 深层嵌套（小） | 2 | 17.47 KB | 8.08 KB | 53.73% | 8.08 KB | 53.73% | — |
| 深层嵌套（中） | 3 | 141.89 KB | 64.55 KB | 54.50% | 64.55 KB | 54.50% | — |
| 深层嵌套（大） | 5 | 629.42 KB | 286.40 KB | 54.50% | 286.40 KB | 54.50% | — |

**结论：**
1. 字段名越长、数量越多，压缩效果越好
2. 对象数组（订单条目、学生列表）压缩效果显著（55–59%）
3. 稀疏字段压缩率最高 — 缺失字段的 null 通过空槽省略（67–69%）
4. `trimTrailingNulls` 在数据有缺失尾部字段时额外节省体积（最高 1.48 KB / 5000 条）
5. 数据完整无缺失字段时，trim 无额外收益
6. 深层嵌套结构能获得更好的压缩效果
7. `stringify` 省略引号进一步减少文本体积

## Token 效率对比

与其他格式的 token 消耗对比（基于 6 个数据集的实际测试）。

#### 混合结构赛道

含嵌套或半均匀结构的数据集。CSV 无法表示此类结构，已排除。

```
🛒 电商订单（嵌套结构）  ┊  表格化程度: 33%
   │
   slimjson            ████████░░░░░░░░░░░░    46,233 tokens
   ├─ vs JSON          (−57.8%)               109,574 tokens
   ├─ vs JSON compact  (−33.5%)                69,528 tokens
   ├─ vs TOON          (−36.9%)                73,246 tokens
   ├─ vs YAML          (−45.9%)                85,451 tokens
   └─ vs XML           (−62.5%)               123,272 tokens

📃 半均匀事件日志  ┊  表格化程度: 50%
   │
   slimjson            ██████████░░░░░░░░░░    91,630 tokens
   ├─ vs JSON          (−49.4%)               181,141 tokens
   ├─ vs JSON compact  (−28.7%)               128,480 tokens
   ├─ vs TOON          (−40.5%)               154,032 tokens
   ├─ vs YAML          (−41.0%)               155,346 tokens
   └─ vs XML           (−55.5%)               205,796 tokens

🧩 深层嵌套配置  ┊  表格化程度: 0%
   │
   slimjson            ████████████░░░░░░░░       547 tokens
   ├─ vs JSON          (−39.6%)                   905 tokens
   ├─ vs JSON compact  (−0.9%)                    552 tokens
   ├─ vs TOON          (−11.5%)                   618 tokens
   ├─ vs YAML          (−17.4%)                   662 tokens
   └─ vs XML           (−45.1%)                   997 tokens

──────────────────────────────────── 合计 ────────────────────────────────────
   slimjson            █████████░░░░░░░░░░░   138,410 tokens
   ├─ vs JSON          (−52.5%)               291,620 tokens
   ├─ vs JSON compact  (−30.3%)               198,560 tokens
   ├─ vs TOON          (−39.3%)               227,896 tokens
   ├─ vs YAML          (−42.7%)               241,459 tokens
   └─ vs XML           (−58.1%)               330,065 tokens
```

#### 纯表格赛道

扁平表格结构数据集，CSV 可适用。

```
👥 均匀员工记录  ┊  表格化程度: 100%
   │
   CSV                 ████████████████████    47,137 tokens
   slimjson            ████████████████████    47,067 tokens   (-0.1% vs CSV)
   ├─ vs JSON          (−63.0%)               127,050 tokens
   ├─ vs JSON compact  (−40.5%)                79,046 tokens
   ├─ vs TOON          (−5.8%)                 49,966 tokens
   ├─ vs YAML          (−52.9%)               100,033 tokens
   └─ vs XML           (−67.9%)               146,596 tokens

📈 时间序列分析数据  ┊  表格化程度: 100%
   │
   CSV                 ███████████████████░     8,392 tokens
   slimjson            ████████████████████     8,767 tokens   (+4.5% vs CSV)
   ├─ vs JSON          (−60.6%)                22,254 tokens
   ├─ vs JSON compact  (−38.3%)                14,220 tokens
   ├─ vs TOON          (−3.9%)                  9,124 tokens
   ├─ vs YAML          (−50.9%)                17,867 tokens
   └─ vs XML           (−67.1%)                26,625 tokens

⭐ Top 100 GitHub 仓库  ┊  表格化程度: 100%
   │
   CSV                 ████████████████████     8,512 tokens
   slimjson            ████████████████████     8,550 tokens   (+0.4% vs CSV)
   ├─ vs JSON          (−43.5%)                15,144 tokens
   ├─ vs JSON compact  (−25.4%)                11,454 tokens
   ├─ vs TOON          (−2.2%)                  8,744 tokens
   ├─ vs YAML          (−34.9%)                13,128 tokens
   └─ vs XML           (−50.0%)                17,095 tokens

──────────────────────────────────── 合计 ────────────────────────────────────
   CSV                 ████████████████████    64,041 tokens
   slimjson            ████████████████████    64,384 tokens   (+0.5% vs CSV)
   ├─ vs JSON          (−60.8%)               164,448 tokens
   ├─ vs JSON compact  (−38.5%)               104,720 tokens
   ├─ vs TOON          (−5.1%)                 67,834 tokens
   ├─ vs YAML          (−50.9%)               131,028 tokens
   └─ vs XML           (−66.2%)               190,316 tokens
```

> 在混合结构数据上，slimjson 比 JSON 节省 **52.5%** tokens；在纯表格数据上，与 CSV 基本持平（仅多 0.5%）。

## LLM 数据检索准确率

使用 209 道数据检索题在 2 个模型上测试不同格式下 LLM 的理解准确率。

#### 效率排名（每 1K tokens 的准确率）

```
slimjson       ████████████████████   45.0 acc%/1K tok  │  95.9% acc  │  2,134 tokens
TOON           ███████████████░░░░░   34.3 acc%/1K tok  │  93.8% acc  │  2,734 tokens
JSON compact   ██████████████░░░░░░   31.5 acc%/1K tok  │  96.7% acc  │  3,072 tokens
YAML           ███████████░░░░░░░░░   25.2 acc%/1K tok  │  93.8% acc  │  3,716 tokens
JSON           █████████░░░░░░░░░░░   20.7 acc%/1K tok  │  93.8% acc  │  4,538 tokens
XML            ████████░░░░░░░░░░░░   18.4 acc%/1K tok  │  94.7% acc  │  5,162 tokens
```

*效率分数 = (准确率% ÷ tokens) × 1,000，越高越好。*

> slimjson 准确率 **95.9%**（vs JSON 的 93.8%），同时节省 **53.0%** tokens。

#### 各模型准确率

```
deepseek-v4-flash
  XML            ███████████████████░    97.1% (203/209)
  JSON           ███████████████████░    97.1% (203/209)
  JSON compact   ███████████████████░    96.7% (202/209)
  YAML           ███████████████████░    95.7% (200/209)
→ slimjson       ███████████████████░    94.7% (198/209)
  CSV            ███████████████████░    94.5% (103/109)
  TOON           ███████████████████░    94.3% (197/209)

mimo-v2.5-pro
→ slimjson       ███████████████████░    97.1% (203/209)
  JSON compact   ███████████████████░    96.7% (202/209)
  TOON           ███████████████████░    93.3% (195/209)
  XML            ██████████████████░░    92.3% (193/209)
  YAML           ██████████████████░░    91.9% (192/209)
  CSV            ██████████████████░░    90.8% (99/109)
  JSON           ██████████████████░░    90.4% (189/209)
```

#### 按题型准确率

| 题型 | JSON compact | slimjson | XML | JSON | TOON | YAML | CSV |
|------|-------------|----------|-----|------|------|------|-----|
| 字段检索 | 99.3% | 98.5% | 98.5% | 99.3% | 95.6% | 98.5% | 98.4% |
| 聚合计算 | 96.0% | 97.6% | 90.5% | 91.3% | 94.4% | 92.1% | 87.9% |
| 条件筛选 | 97.9% | 96.9% | 94.8% | 91.7% | 93.8% | 92.7% | 88.9% |
| 结构感知 | 96.0% | 96.0% | 98.0% | 98.0% | 98.0% | 96.0% | 100.0% |
| 结构验证 | 60.0% | 30.0% | 80.0% | 50.0% | 40.0% | 50.0% | 80.0% |

#### 测试数据集

| 数据集 | 行数 | 结构类型 | CSV 支持 | 表格化程度 |
|--------|------|----------|----------|-----------|
| 均匀员工记录 | 100 | 均匀 | ✓ | 100% |
| 电商订单（嵌套结构） | 50 | 嵌套 | ✗ | 33% |
| 时间序列分析数据 | 60 | 均匀 | ✓ | 100% |
| Top 100 GitHub 仓库 | 100 | 均匀 | ✓ | 100% |
| 半均匀事件日志 | 75 | 半均匀 | ✗ | 50% |
| 深层嵌套配置 | 11 | 深层 | ✗ | 0% |

## 开发

```bash
# 运行测试（209 个用例，100% 覆盖率）
npm test

# 运行压缩率基准测试（含 trim 对比）
node compress-test.js
```

## GitHub

[https://github.com/LastHeaven/slimjson](https://github.com/LastHeaven/slimjson)

## License

MIT
