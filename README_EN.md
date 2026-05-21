# slimjson

[中文](./README.md) | English

A lightweight object array compression tool — converts JSON object arrays with repeated keys into a compact `{ keys, rows }` format, with support for omitting `null` values during serialization to further reduce size.

## Use Cases

- **API List Endpoints**: Backend list endpoints where every object carries the same key names, resulting in massive redundancy
- **Heterogeneous Fields**: Objects with different fields (backend omits null fields on demand)
- **Network Transfer Compression**: Minimizing JSON text size for network transmission
- **LLM Context Compression**: Compress large structured data (e.g. database query results, API responses, knowledge base entries) before sending to prompts, reducing token consumption and API costs
- **LLM Tool Calling**: function calling / tool_use results are often structured object arrays — compressing them before feeding back to the model significantly reduces context window usage, enabling the model to handle more complex data within limited tokens
- **LLM-Friendly Format**: The compressed `{ keys, rows }` format separates schema (field definitions) from data, with each key appearing only once. Models can more accurately understand data structures and extract information by field name, with less confusion compared to raw JSON with repeated keys

## Installation

```bash
npm install slimjson
```

## API

### `compress(source)`

Compresses an object array into a `{ keys, rows }` structure:

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

**Features:**
- `keys` takes the union of all object keys, ordered by first appearance
- Missing fields in an object → fill `null` at the corresponding row position
- Nested objects are recursively processed: represented as `{ "fieldName": [childKeys] }` in `keys`
- Object arrays (e.g. order items) are recursively compressed the same way
- When a plain object is passed (not an array), it is treated as a single-element array

```js
compress({ name: 'Alice', age: 25 });
// Equivalent to compress([{ name: 'Alice', age: 25 }])
// { keys: ['name', 'age'], rows: [['Alice', 25]] }
```

#### Nested Object Example

```js
const data = [
  { name: 'Alice', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello' } },
  { name: 'Bob',   age: 35, profile: { avatar: 'b.jpg' } },  // missing bio
];

compress(data);
// {
//   keys: ['name', 'age', { profile: ['avatar', 'bio'] }],
//   rows: [
//     ['Alice', 28, ['a.jpg', 'Hello']],
//     ['Bob',   35, ['b.jpg', null    ]]
//   ]
// }

stringify(compress(data));
// {keys:[name,age,{profile:[avatar,bio]}],rows:[[Alice,28,[a.jpg,Hello]],[Bob,35,[b.jpg,]]]}
//                                                                                         ^^ null omitted, comma retained
```

#### Object Array Example (Order Scenario)

```js
const orders = [
  { orderId: 'A001', items: [{ name: 'Keyboard', price: 299 }, { name: 'Mouse', price: 99 }] },
  { orderId: 'A002', items: [{ name: 'Monitor', price: 1999 }] },
];

compress(orders);
// {
//   keys: ['orderId', { items: ['name', 'price'] }],
//   rows: [
//     ['A001', [['Keyboard', 299], ['Mouse', 99]]],
//     ['A002', [['Monitor', 1999]]]
//   ]
// }

stringify(compress(orders));
// {keys:[orderId,{items:[name,price]}],rows:[[A001,[[Keyboard,299],[Mouse,99]]],[A002,[[Monitor,1999]]]]}
//                ^^^^^ nested object key, no quotes    ^^^^ safe string value, no quotes
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
//   keys: [
//     'orderId',
//     'customer',
//     { items: ['name', 'price', { specs: ['color', 'layout', 'dpi', 'size'] }] }
//   ],
//   rows: [
//     ['A001', 'Alice', [
//       ['Keyboard', 299, ['Black', '104-key', null, null]],
//       ['Mouse',    99,  ['White', null, '4000', null]]
//     ]],
//     ['A002', 'Bob', [
//       ['Monitor', 1999, ['Silver', null, null, '27in']]
//     ]]
//   ]
// }
// specs keys take the union: order 1 has layout, order 2 has size → both kept, missing fields filled with null

stringify(compress(orders));
// {keys:[orderId,customer,{items:[name,price,{specs:[color,layout,dpi,size]}]}],rows:[[
//   A001,Alice,[[Keyboard,299,[Black,104-key,,]],[Mouse,99,[White,,4000,]]]],[A002,Bob,[[Monitor,1999,[Silver,,,27in]]]]]}
//            ^^^^^^^^^^^^^^^^^^^^^^^^^^^ missing fields in specs omitted as empty slots ^^^^^^^^^^^^^^^^^^^^^^^^
```

### `decompress(compressed)`

Restores `{ keys, rows }` back to the original object array:

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
// {keys:[name,age],rows:[[Alice,25],[Bob,30]]}

JSON.stringify(compress(data));
// {"keys":["name","age"],"rows":[["Alice",25],["Bob",30]]}
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

Nested object keys in `keys` follow the same safe string check:

```js
stringify({ keys: [{ profile: ['name', 'age'] }], rows: [...] });
// {keys:[{profile:[name,age]}],rows:[...]}   ← profile is safe, quotes omitted

stringify({ keys: [{ "my-key": ['name'] }], rows: [...] });
// {keys:[{"my-key":[name]}],rows:[...]}      ← my-key contains hyphen, quotes retained
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
```

### Compression Ratio Calculation

```js
const originalSize   = Buffer.byteLength(JSON.stringify(data));
const compressedSize = Buffer.byteLength(stringify(compress(data)));
const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
console.log(`Compression ratio: ${ratio}%`);
```

## Compression Results

Based on actual data from `compress-test.js` benchmarks (18 test cases, average compression ratio **52.20%**, all roundtrip decompressions verified):

| Data Type | Object Count | Original Size | Compressed | Ratio |
|-----------|-------------|---------------|------------|-------|
| Simple users | 1,000 | 147.85 KB | 87.36 KB | **40.91%** |
| Simple users | 10,000 | 1.45 MB | 882.34 KB | **40.69%** |
| Nested users (with profile.social) | 1,000 | 235.28 KB | 153.03 KB | **34.96%** |
| Orders (1-5 items per order) | 500 | 166.34 KB | 72.10 KB | **56.66%** |
| School data (6 grades x 4 classes x 30 students) | 24 | 215.47 KB | 88.39 KB | **58.98%** |
| Sparse fields (500 records x 30 fields) | 500 | 144.68 KB | 45.39 KB | **68.62%** |
| Sparse fields (2000 records x 50 fields) | 2,000 | 947.88 KB | 292.74 KB | **69.12%** |
| Deep nesting (5-level org structure) | 5 | 634.65 KB | 288.75 KB | **54.50%** |

**Conclusions:**
1. Longer field names and more fields yield better compression
2. Object arrays (order items, student lists) show significant compression (55–59%)
3. Sparse fields achieve the highest compression — missing field nulls omitted as empty slots (67–69%)
4. Deeper nested structures achieve better compression
5. `stringify` quote omission further reduces text size

## Development

```bash
# Run tests
npm test

# Run compression ratio benchmarks
node compress-test.js
```

## GitHub

[https://github.com/LastHeaven/slimjson](https://github.com/LastHeaven/slimjson)

## License

MIT
