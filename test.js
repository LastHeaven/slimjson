/**
 * 测试：compress / decompress v2  ——  Jest 版
 * 运行：npm test
 */
const { compress, decompress, stringify, parse } = require('./compress');

// ---------- 测试数据 ----------

// 样例1
const src1 = [
  {
    "姓名": "张三", "年龄": 19,
    "家人": [{ "姓名": "张四", "年龄": 40 }, { "姓名": "李五", "年龄": 41 }],
    "伴侣": { "姓名": "王六", "年龄": 18 }
  },
  {
    "姓名": "李小花", "年龄": 28,
    "家人": [{ "姓名": "李大国", "年龄": 55 }, { "姓名": "王淑芬", "年龄": 53 }],
    "伴侣": { "姓名": "赵明", "年龄": 30 }
  }
];

// 样例2
const src2 = [
  { "姓名": ["张三", "李四", "王五"], "班级": "23班" },
  { "姓名": ["李小花", "张晓", "李旺", "张思"], "班级": "24班" }
];

// 场景3：第1个元素缺少"伴侣"字段（后端省略 null）
const src3 = [
  { "姓名": "张三", "年龄": 19, "家人": [{ "姓名": "张四", "年龄": 40 }] },
  { "姓名": "李小花", "年龄": 28, "家人": [{ "姓名": "李大国", "年龄": 55 }], "伴侣": { "姓名": "赵明", "年龄": 30 } }
];
const src3Normalized = [  // 所有对象补齐缺失 key 为 null
  { "姓名": "张三", "年龄": 19, "家人": [{ "姓名": "张四", "年龄": 40 }], "伴侣": null },
  { "姓名": "李小花", "年龄": 28, "家人": [{ "姓名": "李大国", "年龄": 55 }], "伴侣": { "姓名": "赵明", "年龄": 30 } }
];

// 场景4：嵌套对象内部子 key 不全（第1个家人中缺少"关系"）
const src4 = [
  {
    "姓名": "张三", "年龄": 19,
    "家人": [
      { "姓名": "张四", "年龄": 40 },
      { "姓名": "李五", "年龄": 41, "关系": "母亲" }
    ]
  }
];
const src4Normalized = [
  {
    "姓名": "张三", "年龄": 19,
    "家人": [
      { "姓名": "张四", "年龄": 40, "关系": null },
      { "姓名": "李五", "年龄": 41, "关系": "母亲" }
    ]
  }
];

// 场景5：复杂嵌套 — 年级,班级,班主任,其他老师,学生（学生含成绩子对象）
const src5 = [
  {
    "年级": "一年级",
    "班级": "1班",
    "班主任": { "姓名": "王老师", "年龄": 35, "科目": "语文" },
    "其他老师": [
      { "姓名": "李老师", "年龄": 28, "科目": "数学" },
      { "姓名": "张老师", "年龄": 40, "科目": "英语" }
    ],
    "学生": [
      { "姓名": "小明", "年龄": 7, "性别": "男", "成绩": { "语文": 95, "数学": 88, "英语": 92 } },
      { "姓名": "小红", "年龄": 7, "性别": "女", "成绩": { "语文": 90, "数学": 96, "英语": 89 } }
    ]
  },
  {
    "年级": "一年级",
    "班级": "2班",
    "班主任": { "姓名": "赵老师", "年龄": 42, "科目": "数学" },
    "其他老师": [
      { "姓名": "钱老师", "年龄": 31, "科目": "语文" },
      { "姓名": "孙老师", "年龄": 33, "科目": "英语" },
      { "姓名": "周老师", "年龄": 26, "科目": "体育" }
    ],
    "学生": [
      { "姓名": "小刚", "年龄": 7, "性别": "男", "成绩": { "语文": 78, "数学": 85 } },
      { "姓名": "小丽", "年龄": 7, "性别": "女", "成绩": { "语文": 99, "数学": 100, "英语": 97 } },
      { "姓名": "小强", "年龄": 8, "性别": "男", "成绩": { "数学": 60 } }
    ]
  }
];

const src5Normalized = [
  {
    "年级": "一年级",
    "班级": "1班",
    "班主任": { "姓名": "王老师", "年龄": 35, "科目": "语文" },
    "其他老师": [
      { "姓名": "李老师", "年龄": 28, "科目": "数学" },
      { "姓名": "张老师", "年龄": 40, "科目": "英语" }
    ],
    "学生": [
      { "姓名": "小明", "年龄": 7, "性别": "男", "成绩": { "语文": 95, "数学": 88, "英语": 92 } },
      { "姓名": "小红", "年龄": 7, "性别": "女", "成绩": { "语文": 90, "数学": 96, "英语": 89 } }
    ]
  },
  {
    "年级": "一年级",
    "班级": "2班",
    "班主任": { "姓名": "赵老师", "年龄": 42, "科目": "数学" },
    "其他老师": [
      { "姓名": "钱老师", "年龄": 31, "科目": "语文" },
      { "姓名": "孙老师", "年龄": 33, "科目": "英语" },
      { "姓名": "周老师", "年龄": 26, "科目": "体育" }
    ],
    "学生": [
      { "姓名": "小刚", "年龄": 7, "性别": "男", "成绩": { "语文": 78, "数学": 85, "英语": null } },
      { "姓名": "小丽", "年龄": 7, "性别": "女", "成绩": { "语文": 99, "数学": 100, "英语": 97 } },
      { "姓名": "小强", "年龄": 8, "性别": "男", "成绩": { "语文": null, "数学": 60, "英语": null } }
    ]
  }
];

// ============================================================
//  测试
// ============================================================

describe('compress / decompress', () => {

  describe('样例1：基础嵌套', () => {
    const r1 = compress(src1);

    test('compress 不出错', () => {
      expect(r1.keys).toBeDefined();
      expect(r1.rows).toBeDefined();
    });

    test('与预期 keys 一致', () => {
      expect(r1.keys).toEqual([
        "姓名", "年龄", { "家人": ["姓名", "年龄"] }, { "伴侣": ["姓名", "年龄"] }
      ]);
    });

    test('还原一致', () => {
      expect(decompress(r1)).toEqual(src1);
    });
  });

  describe('样例2：原始类型数组字段', () => {
    const r2 = compress(src2);

    test('与预期 keys 一致', () => {
      expect(r2.keys).toEqual(["姓名", "班级"]);
    });

    test('与预期 rows 一致', () => {
      expect(r2.rows).toEqual([
        [["张三", "李四", "王五"], "23班"],
        [["李小花", "张晓", "李旺", "张思"], "24班"]
      ]);
    });

    test('还原一致', () => {
      expect(decompress(r2)).toEqual(src2);
    });
  });

  describe('场景3：顶层缺失字段（后端省略 null）', () => {
    const r3 = compress(src3);

    test('keys 包含伴侣', () => {
      expect(r3.keys).toEqual(["姓名", "年龄", { "家人": ["姓名", "年龄"] }, { "伴侣": ["姓名", "年龄"] }]);
    });

    test('row[0] 伴侣位置为 null', () => {
      expect(r3.rows[0][3]).toBeNull();
    });

    test('row[1] 伴侣正常', () => {
      expect(r3.rows[1][3]).toEqual(["赵明", 30]);
    });

    test('还原（null 补齐）', () => {
      expect(decompress(r3)).toEqual(src3Normalized);
    });

    test('张三的伴侣为 null', () => {
      expect(decompress(r3)[0].伴侣).toBeNull();
    });

    test('李小花的伴侣正常', () => {
      expect(decompress(r3)[1].伴侣.姓名).toBe("赵明");
    });
  });

  describe('场景4：嵌套对象子 key 不全', () => {
    const r4 = compress(src4);

    test('keys 中家人包含"关系"', () => {
      expect(r4.keys).toEqual(["姓名", "年龄", { "家人": ["姓名", "年龄", "关系"] }]);
    });

    test('家人[0] 关系为 null', () => {
      expect(r4.rows[0][2][0][2]).toBeNull();
    });

    test('家人[1] 关系正常', () => {
      expect(r4.rows[0][2][1][2]).toBe("母亲");
    });

    test('还原（null 补齐）', () => {
      expect(decompress(r4)).toEqual(src4Normalized);
    });

    test('第1个家人关系为 null', () => {
      expect(decompress(r4)[0].家人[0].关系).toBeNull();
    });

    test('第2个家人关系正常', () => {
      expect(decompress(r4)[0].家人[1].关系).toBe("母亲");
    });
  });

  describe('场景5：复杂嵌套（年级/班级/班主任/其他老师/学生+成绩）', () => {
    const r5 = compress(src5);

    // —— keys ——
    test('keys 顶层包含年级/班级', () => {
      expect(r5.keys.slice(0, 2)).toEqual(["年级", "班级"]);
    });

    test('keys 包含嵌套班主任', () => {
      expect(JSON.stringify(r5.keys[2])).toContain('班主任');
    });

    test('keys 包含嵌套其他老师', () => {
      expect(JSON.stringify(r5.keys[3])).toContain('其他老师');
    });

    test('keys 包含嵌套学生', () => {
      expect(JSON.stringify(r5.keys[4])).toContain('学生');
    });

    test('keys 完整结构', () => {
      expect(r5.keys).toEqual([
        "年级",
        "班级",
        { "班主任": ["姓名", "年龄", "科目"] },
        { "其他老师": ["姓名", "年龄", "科目"] },
        { "学生": ["姓名", "年龄", "性别", { "成绩": ["语文", "数学", "英语"] }] }
      ]);
    });

    // —— rows 数量 ——
    test('1班班主任正常', () => {
      expect(r5.rows[0][2]).toEqual(["王老师", 35, "语文"]);
    });

    test('1班其他老师数量=2', () => {
      expect(r5.rows[0][3].length).toBe(2);
    });

    test('1班学生数量=2', () => {
      expect(r5.rows[0][4].length).toBe(2);
    });

    test('2班班主任正常', () => {
      expect(r5.rows[1][2]).toEqual(["赵老师", 42, "数学"]);
    });

    test('2班其他老师数量=3', () => {
      expect(r5.rows[1][3].length).toBe(3);
    });

    test('2班学生数量=3', () => {
      expect(r5.rows[1][4].length).toBe(3);
    });

    // —— 成绩子对象缺失 key 补 null ——
    // 学生 keys: ["姓名", "年龄", "性别", { "成绩": ["语文", "数学", "英语"] }]
    // 学生 row:  [姓名, 年龄, 性别, [语文, 数学, 英语]]
    test('小刚英语成绩为 null（缺英语字段）', () => {
      expect(r5.rows[1][4][0][3][2]).toBeNull();
    });

    test('小刚语文成绩正常', () => {
      expect(r5.rows[1][4][0][3][0]).toBe(78);
    });

    test('小强语文成绩为 null（缺语文字段）', () => {
      expect(r5.rows[1][4][2][3][0]).toBeNull();
    });

    test('小强数学成绩正常', () => {
      expect(r5.rows[1][4][2][3][1]).toBe(60);
    });

    test('小强英语成绩为 null（缺英语字段）', () => {
      expect(r5.rows[1][4][2][3][2]).toBeNull();
    });

    // —— 还原验证 ——
    test('还原后与 normalized 一致', () => {
      expect(decompress(r5)).toEqual(src5Normalized);
    });

    test('1班年级正确', () => {
      expect(decompress(r5)[0]["年级"]).toBe("一年级");
    });

    test('2班第1个学生英语为 null', () => {
      expect(decompress(r5)[1]["学生"][0]["成绩"]["英语"]).toBeNull();
    });

    test('2班第3个学生语文为 null', () => {
      expect(decompress(r5)[1]["学生"][2]["成绩"]["语文"]).toBeNull();
    });
  });

  /* =========================================================
     边界 / 异常 — 冲击 100% 覆盖率
     ========================================================= */
  describe('边界 / 异常', () => {

    test('compress 空数组 → 返回原值', () => {
      expect(compress([])).toEqual([]);
    });

    test('compress(null) → 返回原值', () => {
      expect(compress(null)).toBeNull();
    });

    test('compress 非数组 → 返回原值', () => {
      expect(compress('hello')).toBe('hello');
    });

    test('源数组含 null 元素', () => {
      const src = [{ name: 'a', age: 10 }, null, { name: 'b' }];
      const r = compress(src);
      expect(r.keys).toEqual(['name', 'age']);
      expect(r.rows[1]).toEqual([null, null]);
      expect(r.rows[0]).toEqual(['a', 10]);
      expect(r.rows[2]).toEqual(['b', null]);
    });

    test('空对象数组字段', () => {
      const src = [{ name: 'test', items: [] }];
      const r = compress(src);
      expect(r.keys).toEqual(['name', 'items']);
      expect(r.rows[0]).toEqual(['test', []]);
      expect(decompress(r)).toEqual(src);
    });

    test('嵌套对象数组中含 null 元素（首元 null→退化为 primitive-array）', () => {
      const src = [{ name: 'a', kids: [null, { name: 'child' }] }];
      const r = compress(src);
      // v[0]===null → 走 primitive-array 分支，不拆解子 key
      expect(r.keys).toEqual(['name', 'kids']);
      expect(r.rows[0]).toEqual(['a', [null, { name: 'child' }]]);
      expect(decompress(r)).toEqual(src);
    });

    test('字段值为 undefined 转 null', () => {
      const src = [{ a: undefined, b: 1 }];
      const r = compress(src);
      expect(r.keys).toEqual(['a', 'b']);
      expect(r.rows[0]).toEqual([null, 1]);
    });

    test('字段值为 null 保留 null', () => {
      const src = [{ a: 1, b: null }];
      const r = compress(src);
      expect(r.rows[0][1]).toBeNull();
      expect(decompress(r)[0].b).toBeNull();
    });

    test('对象数组中含非对象元素（item typeof!=="object" 分支）', () => {
      const src = [{ name: 'x', kids: [{ name: 'kid' }, 'string', null] }];
      const r = compress(src);
      // 首元素是对象 → object-array；非对象元素在 buildKeys 收集时被跳过
      expect(r.keys).toEqual(['name', { kids: ['name'] }]);
      // 非对象元素 → buildRow 返回 [null]，所以 null 元素也是 [null] 而非 null
      expect(r.rows[0][1]).toEqual([['kid'], [null], [null]]);
    });

test('原数组含数字元素（typeof obj!=="object" 各分支）', () => {
      const src = [42, { name: 'a' }, true, { name: 'b' }];
      const r = compress(src);
      expect(r.keys).toEqual(['name']);
      // 数字/布尔不是对象 → buildRow 返回 [null]
      expect(r.rows[0]).toEqual([null]);
      expect(r.rows[1]).toEqual(['a']);
      expect(r.rows[2]).toEqual([null]);
      expect(r.rows[3]).toEqual(['b']);
    });

    test('getValueKind：数组首元素也是数组 → primitive-array', () => {
      const src = [{ name: 'x', matrix: [[1, 2], [3, 4]] }];
      const r = compress(src);
      expect(r.keys).toEqual(['name', 'matrix']);
      expect(r.rows[0]).toEqual(['x', [[1, 2], [3, 4]]]);
      expect(decompress(r)).toEqual(src);
    });

    test('普通原始类型数组 [1,2,3] 不拆解', () => {
      const src = [{ name: 'x', scores: [1, 2, 3] }];
      const r = compress(src);
      expect(r.keys).toEqual(['name', 'scores']);
      expect(r.rows[0]).toEqual(['x', [1, 2, 3]]);
      expect(decompress(r)).toEqual(src);
    });

    test('非对象元素 + 嵌套 key（buildRow line 108 三元 false 分支）', () => {
      const src = [42, { name: 'a', detail: { x: 1 } }];
      const r = compress(src);
      expect(r.keys).toEqual(['name', { detail: ['x'] }]);
      // 42 不是对象 → 所有 key（包括嵌套）都取 undefined → null
      expect(r.rows[0]).toEqual([null, null]);
      expect(r.rows[1]).toEqual(['a', [1]]);
    });

    test('非对象元素 + 对象数组（buildKeys line 73 typeof false 分支）', () => {
      const src = [42, { items: [{ name: 'a' }] }];
      const r = compress(src);
      expect(r.keys).toEqual([{ items: ['name'] }]);
      // 42 不是对象 → buildRow 返回 [null]
      expect(r.rows[0]).toEqual([null]);
      expect(r.rows[1]).toEqual([[['a']]]);
    });

    test('字段值为 null 且 repValue 为 object-array（line 75 Array.isArray false 分支）', () => {
      const src = [
        { items: [{ name: 'a' }] },   // items 是 object-array
        { items: null }                // items 为 null → !Array.isArray
      ];
      const r = compress(src);
      expect(r.keys).toEqual([{ items: ['name'] }]);
      expect(r.rows[0]).toEqual([[['a']]]);
      expect(r.rows[1]).toEqual([null]);
    });

  });

  /* =========================================================
     stringify / parse — 省略 null 文本化 与 还原
     ========================================================= */
  describe('stringify / parse', () => {

    // ---- 基础数组序列化 ----
    describe('基础数组规则', () => {
      test('全 null 数组 → [,,]', () => {
        expect(stringify([null, null, null])).toBe('[,,]');
      });

      test('["null", null, null] → ["null",,]', () => {
        expect(stringify(['null', null, null])).toBe('["null",,]');
      });

      test('[null, 1, null] → [,1,]', () => {
        expect(stringify([null, 1, null])).toBe('[,1,]');
      });

      test('[null, "a", null, 2] → [,a,,2]', () => {
        expect(stringify([null, 'a', null, 2])).toBe('[,a,,2]');
      });

      test('无 null → 正常', () => {
        expect(stringify([1, 2, 3])).toBe('[1,2,3]');
        expect(stringify(['a', 'b', 'c'])).toBe('[a,b,c]');
      });

      test('空数组 → []', () => {
        expect(stringify([])).toBe('[]');
      });

      test('单元素 null → [null]（无法用逗号表示）', () => {
        expect(stringify([null])).toBe('[null]');
      });
    });

    // ---- 基础数组解析 ----
    describe('基础数组解析', () => {
      test('[,,] → [null, null, null]', () => {
        expect(parse('[,,]')).toEqual([null, null, null]);
      });

      test('["null",,] → ["null", null, null]', () => {
        expect(parse('["null",,]')).toEqual(['null', null, null]);
      });

      test('[,1,] → [null, 1, null]', () => {
        expect(parse('[,1,]')).toEqual([null, 1, null]);
      });

      test('[,"a",,2] → [null, "a", null, 2]', () => {
        expect(parse('[,"a",,2]')).toEqual([null, 'a', null, 2]);
      });

      test('无 null → 原样', () => {
        expect(parse('[1,2,3]')).toEqual([1, 2, 3]);
        expect(parse('["a","b","c"]')).toEqual(['a', 'b', 'c']);
      });

      test('空数组', () => {
        expect(parse('[]')).toEqual([]);
      });

      test('[,] → [null, null]（两 null）', () => {
        expect(parse('[,]')).toEqual([null, null]);
      });

      test('[null] → [null]（单 null 保留文字）', () => {
        expect(parse('[null]')).toEqual([null]);
      });
    });

    // ---- 嵌套数组 ----
    describe('嵌套数组', () => {
      test('[[1,2],,] → [[1,2], null, null]', () => {
        expect(stringify([[1, 2], null, null])).toBe('[[1,2],,]');
        expect(parse('[[1,2],,]')).toEqual([[1, 2], null, null]);
      });

      test('[[null,"a"],["b",null]] 往返', () => {
        const arr = [[null, 'a'], ['b', null]];
        expect(parse(stringify(arr))).toEqual(arr);
      });

      test('[[null,null,null]] → [[,,]]', () => {
        expect(stringify([[null, null, null]])).toBe('[[,,]]');
        expect(parse('[[,,]]')).toEqual([[null, null, null]]);
      });

      test('三层嵌套 [,[,],] 往返', () => {
        const arr = [null, [null], null];
        expect(parse(stringify(arr))).toEqual(arr);
      });
    });

    // ---- 对象序列化 ----
    describe('对象', () => {
      test('简单对象', () => {
        expect(stringify({ a: 1, b: null, c: 'x' }))
          .toBe('{a:1,b:null,c:x}');
        expect(parse('{a:1,b:null,c:x}')).toEqual({ a: 1, b: null, c: 'x' });
      });

      test('对象中数组字段含 null → 省略', () => {
        const obj = { name: 'test', items: [1, null, 3] };
        const str = stringify(obj);
        expect(str).toBe('{name:test,items:[1,,3]}');
        expect(parse(str)).toEqual(obj);
      });

      test('对象中嵌套数组全部 null（2个）', () => {
        const obj = { a: [null, null] };
        expect(stringify(obj)).toBe('{a:[,]}');
        expect(parse(stringify(obj))).toEqual(obj);
      });

      test('空对象', () => {
        expect(stringify({})).toBe('{}');
        expect(parse('{}')).toEqual({});
      });
    });

    // ---- 与 compress/decompress 联用 ----
    describe('与 compress/decompress 联用', () => {
      test('样例1 往返：compress → stringify → parse → decompress', () => {
        const cmp = compress(src1);
        const str = stringify(cmp);
        const restored = parse(str);
        expect(restored).toEqual(cmp);
        expect(decompress(restored)).toEqual(src1);
      });

      test('样例2 往返', () => {
        const cmp = compress(src2);
        const str = stringify(cmp);
        const restored = parse(str);
        expect(restored).toEqual(cmp);
        expect(decompress(restored)).toEqual(src2);
      });

      test('场景3（缺失字段→null）往返', () => {
        const cmp = compress(src3);
        const str = stringify(cmp);
        const restored = parse(str);
        expect(restored).toEqual(cmp);
        expect(decompress(restored)).toEqual(src3Normalized);
      });

      test('场景4（嵌套子 key 不全）往返', () => {
        const cmp = compress(src4);
        const str = stringify(cmp);
        const restored = parse(str);
        expect(restored).toEqual(cmp);
        expect(decompress(restored)).toEqual(src4Normalized);
      });

      test('场景5（复杂嵌套+缺失成绩）往返', () => {
        const cmp = compress(src5);
        const str = stringify(cmp);
        const restored = parse(str);
        expect(restored).toEqual(cmp);
        expect(decompress(restored)).toEqual(src5Normalized);
      });

      test('stringify 输出不含 null 关键字的实例（验证省略效果）', () => {
        // 构造一个有大量 null 的压缩结构，验证文本化后不含 "null"
        const src = [
          { name: 'a', extra: null },
          { name: 'b', extra: null }
        ];
        const cmp = compress(src);
        const str = stringify(cmp);
        // rows 中的 null 应该被省略
        // rows: [["a",null],["b",null]] → [["a",],["b",]]
        expect(str).not.toContain('null');
      });
    });

    // ---- 边界 / 特殊值 ----
    describe('边界 / 特殊值', () => {
      test('含有布尔值', () => {
        const obj = { a: true, b: false, c: [true, null, false] };
        expect(parse(stringify(obj))).toEqual(obj);
      });

      test('含有数字（含负数、小数、科学计数法）', () => {
        const obj = { nums: [-1, 0, 3.14, 1e10, null] };
        expect(parse(stringify(obj))).toEqual(obj);
      });

      test('含有转义字符串', () => {
        const obj = { msg: 'hello "world"\n\t\\' };
        expect(parse(stringify(obj))).toEqual(obj);
      });

      test('字符串 "null" 与真正的 null 能区分', () => {
        const arr = ['null', null, 'null'];
        const str = stringify(arr);
        expect(str).toBe('["null",,"null"]');
        expect(parse(str)).toEqual(['null', null, 'null']);
      });

      test('NaN → null', () => {
        const str = stringify([NaN]);
        expect(str).toBe('[null]');
        expect(parse(str)).toEqual([null]);
      });

      test('undefined 视为 null', () => {
        const str = stringify([undefined, 1]);
        expect(str).toBe('[,1]');
        expect(parse(str)).toEqual([null, 1]);
      });

      test('全部 null 的嵌套结构', () => {
        const arr = [null, [null, null, null], null];
        const str = stringify(arr);
        expect(parse(str)).toEqual(arr);
      });

      test('空行 / 空白容忍', () => {
        expect(parse('  [  1  ,  ,  3  ]  ')).toEqual([1, null, 3]);
      });

      test('parse 对非法输入抛错', () => {
        expect(() => parse('not json')).toThrow();
        expect(() => parse('[1,,')).toThrow();
      });

      // ---- 覆盖率补齐 ----
      test('非常规类型（Symbol）→ null', () => {
        expect(stringify([Symbol('x')])).toBe('[null]');
      });

      test('转义字符 \\/ \\b \\f \\r', () => {
        // 这些转义只在 parse 直接输入时出现（stringify 用 JSON.stringify 会直接输出字符）
        expect(parse('["a\\/b"]')).toEqual(['a/b']);
        expect(parse('["a\\bb"]')).toEqual(['a\bb']);
        expect(parse('["a\\fb"]')).toEqual(['a\fb']);
        expect(parse('["a\\rb"]')).toEqual(['a\rb']);
      });

      test('unicode 转义 \\uXXXX', () => {
        expect(parse('["\\u0041"]')).toEqual(['A']);
        expect(parse('["\\u4e2d"]')).toEqual(['中']);
      });

      test('未闭合引号报错', () => {
        expect(() => parse('"hello')).toThrow();
      });

      test('数组中非法字符报错', () => {
        expect(() => parse('[1x]')).toThrow();
      });

      test('对象中非法分隔符报错', () => {
        expect(() => parse('{key:1x}')).toThrow();
      });

      test('转义字符 default 分支（非标准转义）', () => {
        // \q 不是标准 JSON 转义，走 default 分支
        expect(parse('["a\\qb"]')).toEqual(['aqb']);
      });

      test('科学计数法 e+ e-', () => {
        expect(parse('[1e+10,1.5E-3]')).toEqual([1e+10, 1.5e-3]);
      });

      test('科学计数法 e-（单独测 - 分支）', () => {
        expect(parse('[1e-3]')).toEqual([0.001]);
      });

      test('过大数字 → null', () => {
        expect(parse('[1e1000]')).toEqual([null]);
      });

      test('对象 key 为 null/true/false（bare string 防御分支）', () => {
        expect(parse('{null:1,true:2,false:3}'))
          .toEqual({ null: 1, true: 2, false: 3 });
      });

      test('对象缺冒号报错', () => {
        expect(() => parse('{key}')).toThrow();
      });

      test('对象 key 为空报错', () => {
        expect(() => parse('{:1}')).toThrow();
      });
    });

  });

  /* =========================================================
     stringify 省略引号测试
     ========================================================= */
  describe('stringify 省略引号', () => {

    describe('基础：省略引号', () => {
      test('安全字符串省略引号', () => {
        expect(stringify(['hello'])).toBe('[hello]');
      });

      test('含空格的字符串保留引号', () => {
        expect(stringify(['hello world'])).toBe('["hello world"]');
      });

      test('含特殊字符的字符串保留引号', () => {
        expect(stringify(['a,b'])).toBe('["a,b"]');
        expect(stringify(['a:b'])).toBe('["a:b"]');
        expect(stringify(['[a]'])).toBe('["[a]"]');
      });

      test('空字符串保留引号', () => {
        expect(stringify([''])).toBe('[""]');
      });

      test('null/true/false 保留引号', () => {
        expect(stringify(['null'])).toBe('["null"]');
        expect(stringify(['true'])).toBe('["true"]');
        expect(stringify(['false'])).toBe('["false"]');
      });

      test('数字字符串保留引号', () => {
        expect(stringify(['123'])).toBe('["123"]');
        expect(stringify(['-5'])).toBe('["-5"]');
        expect(stringify(['3.14'])).toBe('["3.14"]');
      });

      test('数字开头的中文字符串保留引号', () => {
        // "23班" 以数字开头，parseValue 会误入 parseNumber 分支 → 必须保留引号
        expect(stringify(['23班'])).toBe('["23班"]');
      });

      test('中文字符串省略引号', () => {
        expect(stringify(['你好'])).toBe('[你好]');
        expect(stringify(['张三'])).toBe('[张三]');
      });
    });

    describe('数组中的省略引号', () => {
      test('数组元素全部省略引号', () => {
        expect(stringify(['a', 'b', 'c'])).toBe('[a,b,c]');
      });

      test('混合：安全的省略，不安全的保留', () => {
        expect(stringify(['hello', 'hello world', 'a,b']))
          .toBe('[hello,"hello world","a,b"]');
      });

      test('null 省略规则仍然生效', () => {
        expect(stringify(['a', null, 'b'])).toBe('[a,,b]');
      });
    });

    describe('对象中的省略引号', () => {
      test('对象 key 和值都省略引号', () => {
        expect(stringify({ name: 'alice', age: 25 }))
          .toBe('{name:alice,age:25}');
      });

      test('仅安全 key 省略，不安全 key 保留', () => {
        expect(stringify({ 'hello world': 1 }))
          .toBe('{"hello world":1}');
      });

      test('不安全值保留引号、安全 key 省略', () => {
        expect(stringify({ name: 'hello world' }))
          .toBe('{name:"hello world"}');
      });
    });

    describe('与 compress/decompress 联用', () => {
      test('compress → stringify → parse → decompress', () => {
        const data = [
          { name: '张三', age: 25, city: '北京' },
          { name: '李四', age: 30 }
        ];
        const expected = [
          { name: '张三', age: 25, city: '北京' },
          { name: '李四', age: 30, city: null }
        ];
        const compressed = compress(data);
        const text = stringify(compressed);
        const parsed = parse(text);
        expect(decompress(parsed)).toEqual(expected);
      });

      test('含空格字符串保留引号', () => {
        expect(stringify(['hello world'])).toBe('["hello world"]');
      });
    });

    describe('parse 兼容有/无引号格式', () => {
      test('解析无引号字符串', () => {
        expect(parse('[hello]')).toEqual(['hello']);
        expect(parse('[hello,world]')).toEqual(['hello', 'world']);
      });

      test('解析混合格式', () => {
        expect(parse('[hello,"world",123]')).toEqual(['hello', 'world', 123]);
      });

      test('解析含中文字符串', () => {
        expect(parse('[你好,张三]')).toEqual(['你好', '张三']);
      });

      test('关键字后无边界符时视为裸字符串', () => {
        expect(parse('[nullx]')).toEqual(['nullx']);
        expect(parse('[truex]')).toEqual(['truex']);
      });

      test('空槽仍为 null', () => {
        expect(parse('[,1,]')).toEqual([null, 1, null]);
      });

      test('解析对象 bare key', () => {
        expect(parse('{name:alice,age:25}')).toEqual({ name: 'alice', age: 25 });
      });

      test('解析对象混合 key', () => {
        expect(parse('{name:alice,"full name":"hello world"}'))
          .toEqual({ name: 'alice', 'full name': 'hello world' });
      });

      test('数字 key 保留引号 → 解析为字符串 key', () => {
        expect(parse('{"123":hello}')).toEqual({ '123': 'hello' });
      });

      test('对象 bare key 往返', () => {
        const obj = {
          name: '张三',
          age: 25,
          items: [1, null, 3],
          profile: { avatar: 'a.jpg', bio: 'hello' }
        };
        const str = stringify(obj);
        const parsed = parse(str);
        expect(parsed).toEqual(obj);
      });
    });

  });

});
