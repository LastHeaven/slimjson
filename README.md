# slimjson

轻量级对象数组压缩工具 — 将重复 key 的 JSON 对象数组转换为 `{ keys, rows }` 紧凑格式，并支持序列化时省略 `null` 以进一步减小体积。

## 适用场景

- 后端返回列表接口时，每个对象都携带相同的 key 名，大量冗余
- 不同对象可能拥有不同的字段（后端按需 omit null 字段）
- 需要在网络传输中极致压缩 JSON 文本体积
- **大模型上下文压缩**：将大量结构化数据（如数据库查询结果、API 响应、知识库条目）压缩后送入 prompt，减少 token 消耗，降低调用成本
- **大模型工具调用**：function calling / tool_use 返回的结果往往是结构化的对象数组，压缩后再回传给模型，可显著减少上下文窗口占用，让模型在有限 token 内处理更复杂的数据

## 安装

```bash
npm install slimjson
```

## API

### `compress(source)`

将对象数组压缩为 `{ keys, rows }` 结构：

```js
const { compress } = require('slimjson');

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
  { name: '李四', age: 35, profile: { avatar: 'b.jpg' } },  // 缺失 bio
];

compress(data);
// {
//   keys: ['name', 'age', { profile: ['avatar', 'bio'] }],
//   rows: [
//     ['张三', 28, ['a.jpg', 'Hello']],
//     ['李四', 35, ['b.jpg', null    ]]
//   ]
// }

stringify(compress(data));
// {keys:[name,age,{profile:[avatar,bio]}],rows:[[张三,28,[a.jpg,Hello]],[李四,35,[b.jpg,]]]}
//                                                                                         ^^ 省略 null，保留逗号
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

stringify(compress(orders));
// {keys:[orderId,customer,{items:[name,price,{specs:[color,layout,dpi,size]}]}],rows:[[
//   A001,张三,[[键盘,299,[黑色,104键,,]],[鼠标,99,[白色,,4000,]]]],[A002,李四,[[显示器,1999,[银色,,,27寸]]]]]}
//            ^^^^^^^^^^^^^^^^^^^^^^^^^^^ specs 中缺失字段用空槽省略 null ^^^^^^^^^^^^^^^^^^^^^^^^
```

### `decompress(compressed)`

将 `{ keys, rows }` 还原为原始对象数组：

```js
const restored = decompress(compressed);
// deep-equal 原数组
```

### `stringify(compressed)`

将 compress 结果序列化为文本，数组中 `null` 值被省略（保留逗号占位），安全的字符串省略引号：

```js
const data = [
  { name: 'Alice', age: 25 },
  { name: 'Bob',   age: 30 },
];

const text = stringify(compress(data));
// {keys:[name,age],rows:[[Alice,25],[Bob,30]]}
```

对比 JSON.stringify：
```js
JSON.stringify(compress(data));
// {"keys":["name","age"],"rows":[["Alice",25],["Bob",30]]}
//  ↑ 引号 ↑                    ↑ 引号 ↑
```

数组 null 省略规则：

| 原始数组                 | 序列化结果      | 说明 |
|----------------------|------------|------|
| `["a", null, null]`  | `[a,,]`    | 尾部两个空槽 |
| `[null, 1, null]`    | `[,1,]`    | 前后空槽 |
| `[null, "1", null]`  | `[,"1",]`  | 前后空槽 |
| `[null, "1a", null]` | `[,"1a",]` | 前后空槽 |
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
const { compress, decompress, stringify, parse } = require('slimjson');

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
```

### 压缩率计算

```js
const originalSize  = Buffer.byteLength(JSON.stringify(data));
const compressedSize = Buffer.byteLength(stringify(compress(data)));
const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
console.log(`压缩率: ${ratio}%`);
```

## 压缩效果

基于 `compress-test.js` 基准测试的实际数据（18 组测试，平均压缩率 **52.20%**，所有 roundtrip 解压正确）：

| 数据类型 | 对象数 | 原始大小 | 压缩后 | 压缩率 |
|---------|-------|---------|-------|-------|
| 简单用户 | 1,000 | 147.85 KB | 87.36 KB | **40.91%** |
| 简单用户 | 10,000 | 1.45 MB | 882.34 KB | **40.69%** |
| 嵌套用户（含 profile.social） | 1,000 | 235.28 KB | 153.03 KB | **34.96%** |
| 订单（每单1-5商品） | 500 | 166.34 KB | 72.10 KB | **56.66%** |
| 学校数据（6年级×4班×30生） | 24 | 215.47 KB | 88.39 KB | **58.98%** |
| 稀疏字段（500条×30字段） | 500 | 144.68 KB | 45.39 KB | **68.62%** |
| 稀疏字段（2000条×50字段） | 2,000 | 947.88 KB | 292.74 KB | **69.12%** |
| 深层嵌套（5层组织结构） | 5 | 634.65 KB | 288.75 KB | **54.50%** |

**结论：**
1. 字段名越长、数量越多，压缩效果越好
2. 对象数组（订单条目、学生列表）压缩效果显著（55–59%）
3. 稀疏字段压缩率最高 — 缺失字段的 null 通过空槽省略（67–69%）
4. 深层嵌套结构能获得更好的压缩效果
5. `stringify` 省略引号进一步减少文本体积

## 开发

```bash
# 运行测试
npm test

# 运行压缩率基准测试
node compress-test.js
```

## License

ISC
