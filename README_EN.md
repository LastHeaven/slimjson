# slimjson

[中文](./README.md) | English

A lightweight object array compression tool — converts JSON object arrays with repeated keys into a compact `{ schema, data }` format, with support for omitting `null` values during serialization to further reduce size.

## Use Cases

- **API List Endpoints**: Backend list endpoints where every object carries the same key names, resulting in massive redundancy
- **Heterogeneous Fields**: Objects with different fields (backend omits null fields on demand)
- **Network Transfer Compression**: Minimizing JSON text size for network transmission
- **LLM Context Compression**: Compress large structured data (e.g. database query results, API responses, knowledge base entries) before sending to prompts, reducing token consumption and API costs
- **LLM Tool Calling**: function calling / tool_use results are often structured object arrays — compressing them before feeding back to the model significantly reduces context window usage, enabling the model to handle more complex data within limited tokens
- **LLM-Friendly Format**: The compressed `{ schema, data }` format separates schema (field definitions) from data, with each key appearing only once. Models can more accurately understand data structures and extract information by field name, with less confusion compared to raw JSON with repeated keys

## Installation

```bash
npm install slimjson
```

## API

### `compress(source, opts?)`

Compresses an object array into a `{ schema, data }` structure:

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

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | `Object[]` or `Object` | — | Object array to compress (single object is auto-wrapped) |
| `opts` | `Object` | — | Optional configuration |
| `opts.trimTrailingNulls` | `boolean` | `false` | Remove trailing `null` values from each row |

**Features:**
- `schema` takes the union of all object keys, ordered by first appearance
- Missing fields in an object → fill `null` at the corresponding data position
- Nested objects are recursively processed: represented as `{ "fieldName": [childKeys] }` in `schema`
- Object arrays (e.g. order items) are recursively compressed the same way
- When a plain object is passed (not an array), it is treated as a single-element array

#### Nested Object Example

```js
const data = [
  { name: 'Alice', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello' } },
  { name: 'Bob',   age: 35, profile: { avatar: 'b.jpg', file: null } },
  { name: 'Carol' },
];

compress(data);
// {
//   schema: [['name', 'age', { profile: ['avatar', 'bio', 'file'] }]],
//   data: [
//     ['Alice', 28, ['a.jpg', 'Hello', null]],
//     ['Bob',   35, ['b.jpg', null, null]],
//     ['Carol', null, null]
//   ]
// }
```

#### `trimTrailingNulls`: Remove Trailing nulls

When enabled, trailing `null` values in each row (and nested sub-rows) are removed for further compression:

```js
compress(data, { trimTrailingNulls: true });
// {
//   schema: [['name', 'age', { profile: ['avatar', 'bio', 'file'] }]],
//   data: [
//     ['Alice', 28, ['a.jpg', 'Hello']],
//     ['Bob',   35, ['b.jpg']],
//     ['Carol']
//   ]
// }
```

`decompress` automatically fills missing trailing values with `null`, so the roundtrip result is identical:

```js
decompress(compress(data, { trimTrailingNulls: true }));
// [
//   { name: 'Alice', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello', file: null } },
//   { name: 'Bob',   age: 35, profile: { avatar: 'b.jpg', bio: null, file: null } },
//   { name: 'Carol', age: null, profile: null }
// ]
```

#### Object Array Example (Order Scenario)

```js
const orders = [
  { orderId: 'A001', items: [{ name: 'Keyboard', price: 299 }, { name: 'Mouse', price: 99 }] },
  { orderId: 'A002', items: [{ name: 'Monitor', price: 1999 }] },
];

compress(orders);
// {
//   schema: [['orderId', { items: [['name', 'price']] }]],
//   data: [['A001', [['Keyboard', 299], ['Mouse', 99]]], ['A002', [['Monitor', 1999]]]]
// }

stringify(compress(orders));
// {schema:[[orderId,{items:[[name,price]]}]],data:[[A001,[[Keyboard,299],[Mouse,99]]],[A002,[[Monitor,1999]]]]}
//                  ^^^^^ nested object key, no quotes    ^^^^ safe string value, no quotes
```

#### Three-Level Nesting Example (Order → Item → Specs)

```js
const orders = [
  {
    orderId: 'A001',
    customer: 'Alice',
    items: [
      { name: 'Keyboard', price: 299, specs: { color: 'Black', layout: '104-key' } },
      { name: 'Mouse',    price: 99,  specs: { color: 'White', dpi: '4000' } },
    ]
  },
  {
    orderId: 'A002',
    customer: 'Bob',
    items: [
      { name: 'Monitor', price: 1999, specs: { color: 'Silver', size: '27in' } },
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
//     ['A001', 'Alice', [
//       ['Keyboard', 299, ['Black', '104-key', null, null]],
//       ['Mouse',    99,  ['White', null, '4000', null]]
//     ]],
//     ['A002', 'Bob', [
//       ['Monitor', 1999, ['Silver', null, null, '27in']]
//     ]]
//   ]
// }
// specs schema takes the union: order 1 has layout, order 2 has size → both kept, missing fields filled with null

compress(orders, { trimTrailingNulls: true });
// data becomes:
// [
//   ['A001', 'Alice', [
//     ['Keyboard', 299, ['Black', '104-key']],
//     ['Mouse',    99,  ['White', null, '4000']]
//   ]],
//   ['A002', 'Bob', [
//     ['Monitor', 1999, ['Silver', null, null, '27in']]
//   ]]
// ]
```

### `decompress(compressed)`

Restores `{ schema, data }` back to the original object array. Missing trailing values are automatically filled with `null`:

```js
const restored = decompress(compressed);
// deep-equal to the original array
```

### `stringify(compressed)`

Serializes the compress result into compact text. Compared to `JSON.stringify`, the following optimization rules are applied:

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

#### Serialization Rules

| Value Type | Serialized Result | Notes |
|------------|------------------|-------|
| `null` / `undefined` | `null` | — |
| Finite number | `25` | Direct output, no quotes |
| `NaN` / `Infinity` | `null` | Non-finite numbers unified to null |
| `true` / `false` | `true` / `false` | — |
| Safe string | `Alice` | Quotes omitted (see rules below) |
| Unsafe string | `"hello world"` | JSON quotes and escaping retained |
| Nested object `{k: v}` | `{k:v}` | Keys follow same safe/unsafe rules |
| Array | See null omission rules below | — |

#### Safe Strings (Conditions for Omitting Quotes)

A string can omit quotes only when it satisfies **all** of the following conditions; otherwise `JSON.stringify` escaping is applied:

1. Non-empty string
2. Not a keyword literal: `null`, `true`, `false`
3. Does not match number pattern: `/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/` (e.g. `"123"`, `"-3.14"`, `"1e10"` all retain quotes)
4. Does not start with a digit or minus sign `-`
5. Does not contain whitespace, `[`, `]`, `{`, `}`, `,`, `:`, `"` or similar characters

| String | Result | Reason |
|--------|--------|--------|
| `"Alice"` | `Alice` | Safe, quotes omitted |
| `"hello world"` | `"hello world"` | Contains space |
| `"123"` | `"123"` | Looks like a number |
| `"-3.14"` | `"-3.14"` | Looks like a number |
| `"null"` | `"null"` | Keyword |
| `""` | `""` | Empty string |
| `"-abc"` | `"-abc"` | Starts with minus sign |
| `"a:b"` | `"a:b"` | Contains colon |

#### Object Key Quoting Rules

Nested object keys in `schema` follow the same safe string check:

```js
stringify({ schema: [{ profile: ['name', 'age'] }], data: [...] });
// {schema:[{profile:[name,age]}],data:[...]}   ← profile is safe, quotes omitted

stringify({ schema: [{ "my key": ['name'] }], data: [...] });
// {schema:[{"my key":[name]}],data:[...]}      ← my key contains space, quotes retained
```

#### Array Null Omission Rules

`null` / `undefined` values in arrays are omitted as comma slots, taking no text space:

| Original Array | Serialized Result | Notes |
|---------------|------------------|-------|
| `["a", null, null]` | `[a,,]` | Two trailing empty slots |
| `[null, 1, null]` | `[,1,]` | Leading and trailing empty slots |
| `[]` | `[]` | Empty array |
| `[null]` | `[null]` | **Special**: `[,]` means 2 nulls, so single null retains literal |

### `parse(text)`

Parses text produced by `stringify`, restoring omitted `null` values:

```js
const parsed = parse(text);
// deep-equal to compressed
```

Supports full JSON type parsing (strings, numbers, booleans, null, nested objects/arrays), compatible with escape characters and Unicode.

## Complete Example

```js
import { compress, decompress, stringify, parse } from 'slimjson';

const data = [
  { name: 'Alice', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello' } },
  { name: 'Bob',   age: 35, profile: { avatar: 'b.jpg' } },              // missing bio
];

// Compress → Stringify → Parse → Decompress
const compressed = compress(data);
const text       = stringify(compressed);
const parsed     = parse(text);
const restored   = decompress(parsed);

// restored is deep-equal to data

// Enable trimTrailingNulls for further compression
const compressedTrim = compress(data, { trimTrailingNulls: true });
const textTrim       = stringify(compressedTrim);
// textTrim is shorter than text
```

### Compression Ratio Calculation

```js
const originalSize   = Buffer.byteLength(JSON.stringify(data));
const compressedSize = Buffer.byteLength(stringify(compress(data)));
const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
console.log(`Compression ratio: ${ratio}%`);
```

## Compression Results

Based on actual data from `compress-test.js` benchmarks (18 test cases, all roundtrip decompressions verified):

| Data Type | Count | Original | No trim | Ratio | Trim | Ratio | Diff |
|-----------|-------|----------|---------|-------|------|-------|------|
| Simple users | 100 | 14.69 KB | 8.69 KB | 40.82% | 8.69 KB | 40.82% | — |
| Simple users | 1,000 | 147.74 KB | 87.25 KB | 40.94% | 87.25 KB | 40.94% | — |
| Simple users | 10,000 | 1.45 MB | 881.58 KB | 40.71% | 881.58 KB | 40.71% | — |
| Nested users (with profile.social) | 100 | 23.41 KB | 15.28 KB | 34.74% | 15.24 KB | 34.87% | -33 B |
| Nested users (with profile.social) | 1,000 | 236.03 KB | 153.93 KB | 34.78% | 153.64 KB | 34.91% | -301 B |
| Nested users (with profile.social) | 5,000 | 1.16 MB | 777.89 KB | 34.58% | 776.42 KB | 34.70% | -1.47 KB |
| Orders (1-5 items per order) | 100 | 31.28 KB | 13.65 KB | 56.38% | 13.65 KB | 56.38% | — |
| Orders (1-5 items per order) | 500 | 163.18 KB | 70.83 KB | 56.59% | 70.83 KB | 56.59% | — |
| Orders (1-5 items per order) | 2,000 | 655.99 KB | 284.29 KB | 56.66% | 284.29 KB | 56.66% | — |
| School data (2 grades x 2 classes x 10 students) | 4 | 12.26 KB | 5.25 KB | 57.20% | 5.23 KB | 57.36% | -21 B |
| School data (6 grades x 4 classes x 30 students) | 24 | 217.73 KB | 89.71 KB | 58.80% | 89.31 KB | 58.98% | -406 B |
| School data (6 grades x 6 classes x 50 students) | 36 | 539.64 KB | 222.56 KB | 58.76% | 221.66 KB | 58.92% | -923 B |
| Sparse fields (100 records x 20 fields) | 100 | 19.50 KB | 6.34 KB | 67.46% | 6.28 KB | 67.78% | -64 B |
| Sparse fields (500 records x 30 fields) | 500 | 143.26 KB | 45.09 KB | 68.52% | 44.78 KB | 68.74% | -326 B |
| Sparse fields (2000 records x 50 fields) | 2,000 | 957.96 KB | 294.69 KB | 69.24% | 293.54 KB | 69.36% | -1.15 KB |
| Deep nesting (small) | 2 | 17.47 KB | 8.08 KB | 53.73% | 8.08 KB | 53.73% | — |
| Deep nesting (medium) | 3 | 141.89 KB | 64.55 KB | 54.50% | 64.55 KB | 54.50% | — |
| Deep nesting (large) | 5 | 629.42 KB | 286.40 KB | 54.50% | 286.40 KB | 54.50% | — |

**Conclusions:**
1. Longer field names and more fields yield better compression
2. Object arrays (order items, student lists) show significant compression (55–59%)
3. Sparse fields achieve the highest compression — missing field nulls omitted as empty slots (67–69%)
4. `trimTrailingNulls` saves additional space when data has missing trailing fields (up to 1.48 KB / 5000 records)
5. When data has no missing fields, trim provides no extra benefit
6. Deeper nested structures achieve better compression
7. `stringify` quote omission further reduces text size

## Token Efficiency Comparison

Token consumption comparison across formats (based on 6 real-world datasets).

#### Mixed-Structure Track

Datasets with nested or semi-uniform structures. CSV excluded as it cannot represent these structures.

```
🛒 E-commerce orders (nested)  ┊  Tabular: 33%
   │
   slimjson            ████████░░░░░░░░░░░░    46,233 tokens
   ├─ vs JSON          (−57.8%)               109,574 tokens
   ├─ vs JSON compact  (−33.5%)                69,528 tokens
   ├─ vs TOON          (−36.9%)                73,246 tokens
   ├─ vs YAML          (−45.9%)                85,451 tokens
   └─ vs XML           (−62.5%)               123,272 tokens

📃 Semi-uniform event logs  ┊  Tabular: 50%
   │
   slimjson            ██████████░░░░░░░░░░    91,630 tokens
   ├─ vs JSON          (−49.4%)               181,141 tokens
   ├─ vs JSON compact  (−28.7%)               128,480 tokens
   ├─ vs TOON          (−40.5%)               154,032 tokens
   ├─ vs YAML          (−41.0%)               155,346 tokens
   └─ vs XML           (−55.5%)               205,796 tokens

🧩 Deeply nested configuration  ┊  Tabular: 0%
   │
   slimjson            ████████████░░░░░░░░       547 tokens
   ├─ vs JSON          (−39.6%)                   905 tokens
   ├─ vs JSON compact  (−0.9%)                    552 tokens
   ├─ vs TOON          (−11.5%)                   618 tokens
   ├─ vs YAML          (−17.4%)                   662 tokens
   └─ vs XML           (−45.1%)                   997 tokens

──────────────────────────────────── Total ────────────────────────────────────
   slimjson            █████████░░░░░░░░░░░   138,410 tokens
   ├─ vs JSON          (−52.5%)               291,620 tokens
   ├─ vs JSON compact  (−30.3%)               198,560 tokens
   ├─ vs TOON          (−39.3%)               227,896 tokens
   ├─ vs YAML          (−42.7%)               241,459 tokens
   └─ vs XML           (−58.1%)               330,065 tokens
```

#### Flat-Only Track

Flat tabular datasets where CSV is applicable.

```
👥 Uniform employee records  ┊  Tabular: 100%
   │
   CSV                 ████████████████████    47,137 tokens
   slimjson            ████████████████████    47,067 tokens   (-0.1% vs CSV)
   ├─ vs JSON          (−63.0%)               127,050 tokens
   ├─ vs JSON compact  (−40.5%)                79,046 tokens
   ├─ vs TOON          (−5.8%)                 49,966 tokens
   ├─ vs YAML          (−52.9%)               100,033 tokens
   └─ vs XML           (−67.9%)               146,596 tokens

📈 Time-series analytics data  ┊  Tabular: 100%
   │
   CSV                 ███████████████████░     8,392 tokens
   slimjson            ████████████████████     8,767 tokens   (+4.5% vs CSV)
   ├─ vs JSON          (−60.6%)                22,254 tokens
   ├─ vs JSON compact  (−38.3%)                14,220 tokens
   ├─ vs TOON          (−3.9%)                  9,124 tokens
   ├─ vs YAML          (−50.9%)                17,867 tokens
   └─ vs XML           (−67.1%)                26,625 tokens

⭐ Top 100 GitHub repositories  ┊  Tabular: 100%
   │
   CSV                 ████████████████████     8,512 tokens
   slimjson            ████████████████████     8,550 tokens   (+0.4% vs CSV)
   ├─ vs JSON          (−43.5%)                15,144 tokens
   ├─ vs JSON compact  (−25.4%)                11,454 tokens
   ├─ vs TOON          (−2.2%)                  8,744 tokens
   ├─ vs YAML          (−34.9%)                13,128 tokens
   └─ vs XML           (−50.0%)                17,095 tokens

──────────────────────────────────── Total ────────────────────────────────────
   CSV                 ████████████████████    64,041 tokens
   slimjson            ████████████████████    64,384 tokens   (+0.5% vs CSV)
   ├─ vs JSON          (−60.8%)               164,448 tokens
   ├─ vs JSON compact  (−38.5%)               104,720 tokens
   ├─ vs TOON          (−5.1%)                 67,834 tokens
   ├─ vs YAML          (−50.9%)               131,028 tokens
   └─ vs XML           (−66.2%)               190,316 tokens
```

> On mixed-structure data, slimjson saves **52.5%** tokens vs JSON. On flat tabular data, it's on par with CSV (only 0.5% more).

## LLM Data Retrieval Accuracy

Accuracy tested with 209 data retrieval questions across 2 LLMs on different input formats.

#### Efficiency Ranking (Accuracy per 1K Tokens)

```
slimjson       ████████████████████   44.3 acc%/1K tok  │  94.5% acc  │  2,133 tokens
TOON           ███████████████░░░░░   33.8 acc%/1K tok  │  92.3% acc  │  2,734 tokens
JSON compact   ██████████████░░░░░░   31.0 acc%/1K tok  │  95.2% acc  │  3,072 tokens
YAML           ███████████░░░░░░░░░   24.9 acc%/1K tok  │  92.3% acc  │  3,716 tokens
JSON           █████████░░░░░░░░░░░   20.3 acc%/1K tok  │  92.3% acc  │  4,538 tokens
XML            ████████░░░░░░░░░░░░   18.1 acc%/1K tok  │  93.3% acc  │  5,162 tokens
```

*Efficiency score = (Accuracy % ÷ Tokens) × 1,000. Higher is better.*

> slimjson achieves **94.5%** accuracy (vs JSON's 92.3%) while using **53.0% fewer tokens**.

#### Per-Model Accuracy

```
deepseek-v4-flash
  XML            ███████████████████░    95.7% (200/209)
  JSON           ███████████████████░    95.7% (200/209)
  JSON compact   ███████████████████░    95.2% (199/209)
  YAML           ███████████████████░    94.3% (197/209)
→ slimjson       ███████████████████░    93.3% (195/209)
  TOON           ███████████████████░    92.8% (194/209)
  CSV            ██████████████████░░    91.7% (100/109)

mimo-v2.5-pro
→ slimjson       ███████████████████░    95.7% (200/209)
  JSON compact   ███████████████████░    95.2% (199/209)
  TOON           ██████████████████░░    91.9% (192/209)
  XML            ██████████████████░░    90.9% (190/209)
  YAML           ██████████████████░░    90.4% (189/209)
  JSON           ██████████████████░░    89.0% (186/209)
  CSV            ██████████████████░░    88.1% (96/109)
```

#### Accuracy by Question Type

| Question Type | JSON compact | slimjson | XML | JSON | TOON | YAML | CSV |
|---------------|-------------|----------|-----|------|------|------|-----|
| Field Retrieval | 99.3% | 98.5% | 98.5% | 99.3% | 95.6% | 98.5% | 98.4% |
| Aggregation | 94.4% | 96.0% | 88.9% | 89.7% | 92.9% | 90.5% | 84.5% |
| Filtering | 97.9% | 96.9% | 94.8% | 91.7% | 93.8% | 92.7% | 88.9% |
| Structure Awareness | 88.0% | 88.0% | 90.0% | 90.0% | 90.0% | 88.0% | 87.5% |
| Structural Validation | 60.0% | 30.0% | 80.0% | 50.0% | 40.0% | 50.0% | 80.0% |

#### Datasets Tested

| Dataset | Rows | Structure | CSV Support | Tabular % |
|---------|------|-----------|-------------|-----------|
| Uniform employee records | 100 | uniform | ✓ | 100% |
| E-commerce orders (nested) | 50 | nested | ✗ | 33% |
| Time-series analytics data | 60 | uniform | ✓ | 100% |
| Top 100 GitHub repositories | 100 | uniform | ✓ | 100% |
| Semi-uniform event logs | 75 | semi-uniform | ✗ | 50% |
| Deeply nested configuration | 11 | deep | ✗ | 0% |

## Development

```bash
# Run tests (209 cases, 100% coverage)
npm test

# Run compression ratio benchmarks (with trim comparison)
node compress-test.js
```

## GitHub

[https://github.com/LastHeaven/slimjson](https://github.com/LastHeaven/slimjson)

## License

MIT
