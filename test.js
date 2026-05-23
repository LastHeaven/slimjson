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

// 场景6：四层嵌套（组织→部门→团队→成员+技能标签）
const src6 = [
    {
        "org": "TechCorp",
        "departments": [
            {
                "name": "Engineering",
                "teams": [
                    {
                        "lead": "Alice",
                        "members": [
                            { "name": "Bob", "level": "L5", "skills": ["Go", "K8s"] },
                            { "name": "Carol", "level": "L4", "skills": ["Python", "ML"] }
                        ]
                    },
                    {
                        "lead": "Dave",
                        "members": [
                            { "name": "Eve", "level": "L6" }
                        ]
                    }
                ]
            },
            {
                "name": "Design",
                "teams": [
                    {
                        "lead": "Frank",
                        "members": [
                            { "name": "Grace", "level": "L3", "skills": ["Figma", "CSS"] }
                        ]
                    }
                ]
            }
        ]
    }
];

// 场景7：同层混合 — 对象同时包含嵌套对象和嵌套数组，且字段不对称
const src7 = [
    {
        "product": "Keyboard",
        "spec": { "weight": "800g", "layout": "104-key", "switch": "Cherry MX" },
        "reviews": [
            { "user": "Alice", "rating": 5, "comment": "Great!" },
            { "user": "Bob", "rating": 4 }
        ],
        "tags": ["mechanical", "RGB"]
    },
    {
        "product": "Mouse",
        "spec": { "weight": "60g", "dpi": 16000 },
        "reviews": [
            { "user": "Carol", "rating": 3, "comment": "Too light" },
            { "user": "Dave", "rating": 5, "comment": "Perfect" },
            { "user": "Eve", "rating": 4 }
        ]
    },
    {
        "product": "Monitor",
        "spec": { "weight": "5kg", "size": "27in", "resolution": "4K", "refresh": 144 },
        "reviews": []
    }
];

// 场景8：数组的数组内含对象（矩阵 + 内层对象不对称）
const src8 = [
    {
        "matrix": [
            [{ "x": 1, "y": "a" }, { "x": 2, "y": "b", "z": 99 }],
            [{ "x": 3, "y": "c" }]
        ],
        "label": "grid-A"
    },
    {
        "matrix": [
            [{ "x": 10, "y": "d", "z": 88 }],
            [{ "x": 20, "y": "e" }, { "x": 30, "y": "f", "z": 77 }],
            [{ "x": 40, "y": "g" }]
        ],
        "label": "grid-B"
    }
];

// 场景9：深层缺失 — 每层都有字段缺失
const src9 = [
    {
        "company": "Acme",
        "address": { "city": "Beijing", "zip": "100000" },
        "departments": [
            {
                "name": "Sales",
                "head": { "name": "Tom", "age": 40 },
                "staff": [
                    { "name": "Amy", "phone": "111" },
                    { "name": "Ben" }
                ]
            }
        ]
    },
    {
        "company": "Globex",
        "departments": [
            {
                "name": "Tech",
                "head": { "name": "Cat", "age": 35, "title": "VP" },
                "staff": [
                    { "name": "Dan", "phone": "222", "email": "dan@x.com" },
                    { "name": "Eve", "email": "eve@x.com" }
                ]
            },
            {
                "name": "Ops",
                "staff": [
                    { "name": "Fox" }
                ]
            }
        ]
    }
];

// 场景10：数组内含不同结构的对象（同一数组内对象 key 完全不同）
const src10 = [
    {
        "events": [
            { "type": "click", "target": "button", "timestamp": 1000 },
            { "type": "scroll", "offset": 500, "direction": "down" },
            { "type": "input", "field": "email", "value": "a@b.com", "valid": true }
        ],
        "session": "abc"
    },
    {
        "events": [
            { "type": "submit", "form": "login", "success": false, "error": "timeout" }
        ],
        "session": "xyz"
    }
];

// decompress 始终返回规范化数据（补齐缺失 key 为 null）
const src3Decompressed = [
    { "姓名": "张三", "年龄": 19, "家人": [{ "姓名": "张四", "年龄": 40 }], "伴侣": null },
    { "姓名": "李小花", "年龄": 28, "家人": [{ "姓名": "李大国", "年龄": 55 }], "伴侣": { "姓名": "赵明", "年龄": 30 } }
];

const src4Decompressed = [
    {
        "姓名": "张三", "年龄": 19,
        "家人": [
            { "姓名": "张四", "年龄": 40, "关系": null },
            { "姓名": "李五", "年龄": 41, "关系": "母亲" }
        ]
    }
];

const src5Decompressed = [
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

// 场景6 decompressed：四层嵌套，skills 缺失补 null
const src6Decompressed = [
    {
        "org": "TechCorp",
        "departments": [
            {
                "name": "Engineering",
                "teams": [
                    {
                        "lead": "Alice",
                        "members": [
                            { "name": "Bob", "level": "L5", "skills": ["Go", "K8s"] },
                            { "name": "Carol", "level": "L4", "skills": ["Python", "ML"] }
                        ]
                    },
                    {
                        "lead": "Dave",
                        "members": [
                            { "name": "Eve", "level": "L6", "skills": null }
                        ]
                    }
                ]
            },
            {
                "name": "Design",
                "teams": [
                    {
                        "lead": "Frank",
                        "members": [
                            { "name": "Grace", "level": "L3", "skills": ["Figma", "CSS"] }
                        ]
                    }
                ]
            }
        ]
    }
];

// 场景7 decompressed：同层混合，缺失字段补 null
const src7Decompressed = [
    {
        "product": "Keyboard",
        "spec": { "weight": "800g", "layout": "104-key", "switch": "Cherry MX", "dpi": null, "size": null, "resolution": null, "refresh": null },
        "reviews": [
            { "user": "Alice", "rating": 5, "comment": "Great!" },
            { "user": "Bob", "rating": 4, "comment": null }
        ],
        "tags": ["mechanical", "RGB"]
    },
    {
        "product": "Mouse",
        "spec": { "weight": "60g", "layout": null, "switch": null, "dpi": 16000, "size": null, "resolution": null, "refresh": null },
        "reviews": [
            { "user": "Carol", "rating": 3, "comment": "Too light" },
            { "user": "Dave", "rating": 5, "comment": "Perfect" },
            { "user": "Eve", "rating": 4, "comment": null }
        ],
        "tags": null
    },
    {
        "product": "Monitor",
        "spec": { "weight": "5kg", "layout": null, "switch": null, "dpi": null, "size": "27in", "resolution": "4K", "refresh": 144 },
        "reviews": [],
        "tags": null
    }
];

// 场景8 decompressed：数组的数组内含对象
const src8Decompressed = [
    {
        "matrix": [
            [{ "x": 1, "y": "a", "z": null }, { "x": 2, "y": "b", "z": 99 }],
            [{ "x": 3, "y": "c", "z": null }]
        ],
        "label": "grid-A"
    },
    {
        "matrix": [
            [{ "x": 10, "y": "d", "z": 88 }],
            [{ "x": 20, "y": "e", "z": null }, { "x": 30, "y": "f", "z": 77 }],
            [{ "x": 40, "y": "g", "z": null }]
        ],
        "label": "grid-B"
    }
];

// 场景9 decompressed：深层缺失
const src9Decompressed = [
    {
        "company": "Acme",
        "address": { "city": "Beijing", "zip": "100000" },
        "departments": [
            {
                "name": "Sales",
                "head": { "name": "Tom", "age": 40, "title": null },
                "staff": [
                    { "name": "Amy", "phone": "111", "email": null },
                    { "name": "Ben", "phone": null, "email": null }
                ]
            }
        ]
    },
    {
        "company": "Globex",
        "address": null,
        "departments": [
            {
                "name": "Tech",
                "head": { "name": "Cat", "age": 35, "title": "VP" },
                "staff": [
                    { "name": "Dan", "phone": "222", "email": "dan@x.com" },
                    { "name": "Eve", "phone": null, "email": "eve@x.com" }
                ]
            },
            {
                "name": "Ops",
                "head": null,
                "staff": [
                    { "name": "Fox", "phone": null, "email": null }
                ]
            }
        ]
    }
];

// 场景10 decompressed：数组内含不同结构的对象
const src10Decompressed = [
    {
        "events": [
            { "type": "click", "target": "button", "timestamp": 1000, "offset": null, "direction": null, "field": null, "value": null, "valid": null, "form": null, "success": null, "error": null },
            { "type": "scroll", "target": null, "timestamp": null, "offset": 500, "direction": "down", "field": null, "value": null, "valid": null, "form": null, "success": null, "error": null },
            { "type": "input", "target": null, "timestamp": null, "offset": null, "direction": null, "field": "email", "value": "a@b.com", "valid": true, "form": null, "success": null, "error": null }
        ],
        "session": "abc"
    },
    {
        "events": [
            { "type": "submit", "target": null, "timestamp": null, "offset": null, "direction": null, "field": null, "value": null, "valid": null, "form": "login", "success": false, "error": "timeout" }
        ],
        "session": "xyz"
    }
];

// ============================================================
//  测试
// ============================================================

describe('compress / decompress', () => {

    // —— compress / decompress / roundtrip 测试：trim=false 和 trim=true 两套 ——
    [false, true].forEach(trim => {
        const label = trim ? 'trimTrailingNulls' : '默认';
        const copt = trim ? { trimTrailingNulls: true } : undefined;

        describe(`[${label}]`, () => {

            describe('样例1：基础嵌套', () => {
                const r1 = compress(src1, copt);

                test('schema 一致', () => {
                    expect(r1.schema).toEqual([[
                        "姓名", "年龄", { "家人": [["姓名", "年龄"]] }, { "伴侣": ["姓名", "年龄"] }
                    ]]);
                });

                test('data 一致', () => {
                    if (trim) {
                        expect(r1.data).toEqual([
                            ['张三', 19, [['张四', 40], ['李五', 41]], ['王六', 18]],
                            ['李小花', 28, [['李大国', 55], ['王淑芬', 53]], ['赵明', 30]]
                        ]);
                    } else {
                        expect(r1.data).toEqual([
                            ['张三', 19, [['张四', 40], ['李五', 41]], ['王六', 18]],
                            ['李小花', 28, [['李大国', 55], ['王淑芬', 53]], ['赵明', 30]]
                        ]);
                    }
                });

                test('还原一致', () => {
                    expect(decompress(r1)).toEqual(src1);
                });

                test('stringify/parse 往返', () => {
                    const str = stringify(r1);
                    expect(parse(str)).toEqual(r1);
                    expect(decompress(parse(str))).toEqual(src1);
                });
            });

            describe('样例2：原始类型数组字段', () => {
                const r2 = compress(src2, copt);

                test('schema 一致', () => {
                    expect(r2.schema).toEqual([["姓名", "班级"]]);
                });

                test('data 一致', () => {
                    expect(r2.data).toEqual([
                        [["张三", "李四", "王五"], "23班"],
                        [["李小花", "张晓", "李旺", "张思"], "24班"]
                    ]);
                });

                test('还原一致', () => {
                    expect(decompress(r2)).toEqual(src2);
                });

                test('stringify/parse 往返', () => {
                    const str = stringify(r2);
                    expect(parse(str)).toEqual(r2);
                    expect(decompress(parse(str))).toEqual(src2);
                });
            });

            describe('场景3：顶层缺失字段（后端省略 null）', () => {
                const r3 = compress(src3, copt);

                test('schema 一致', () => {
                    expect(r3.schema).toEqual([["姓名", "年龄", { "家人": [["姓名", "年龄"]] }, { "伴侣": ["姓名", "年龄"] }]]);
                });

                test('data 一致', () => {
                    if (trim) {
                        expect(r3.data).toEqual([
                            ['张三', 19, [['张四', 40]]],
                            ['李小花', 28, [['李大国', 55]], ['赵明', 30]]
                        ]);
                    } else {
                        expect(r3.data).toEqual([
                            ["张三", 19, [["张四", 40]], null],
                            ["李小花", 28, [["李大国", 55]], ["赵明", 30]]
                        ]);
                    }
                });

                test('还原一致', () => {
                    expect(decompress(r3)).toEqual(src3Decompressed);
                });

                test('stringify/parse 往返', () => {
                    const str = stringify(r3);
                    expect(parse(str)).toEqual(r3);
                    expect(decompress(parse(str))).toEqual(src3Decompressed);
                });
            });

            describe('场景4：嵌套对象子 key 不全', () => {
                const r4 = compress(src4, copt);

                test('schema 一致', () => {
                    expect(r4.schema).toEqual([["姓名", "年龄", { "家人": [["姓名", "年龄", "关系"]] }]]);
                });

                test('data 一致', () => {
                    if (trim) {
                        expect(r4.data).toEqual([
                            ["张三", 19, [["张四", 40], ["李五", 41, "母亲"]]]
                        ]);
                    } else {
                        expect(r4.data).toEqual([
                            ["张三", 19, [["张四", 40, null], ["李五", 41, "母亲"]]]
                        ]);
                    }
                });

                test('还原一致', () => {
                    expect(decompress(r4)).toEqual(src4Decompressed);
                });

                test('stringify/parse 往返', () => {
                    const str = stringify(r4);
                    expect(parse(str)).toEqual(r4);
                    expect(decompress(parse(str))).toEqual(src4Decompressed);
                });
            });

            describe('场景5：复杂嵌套（年级/班级/班主任/其他老师/学生+成绩）', () => {
                const r5 = compress(src5, copt);

                test('schema 一致', () => {
                    expect(r5.schema).toEqual([[
                        "年级",
                        "班级",
                        { "班主任": ["姓名", "年龄", "科目"] },
                        { "其他老师": [["姓名", "年龄", "科目"]] },
                        { "学生": [["姓名", "年龄", "性别", { "成绩": ["语文", "数学", "英语"] }]] }
                    ]]);
                });

                test('data 一致', () => {
                    if (trim) {
                        expect(r5.data).toEqual([
                            ['一年级', '1班', ['王老师', 35, '语文'], [['李老师', 28, '数学'], ['张老师', 40, '英语']], [['小明', 7, '男', [95, 88, 92]], ['小红', 7, '女', [90, 96, 89]]]],
                            ['一年级', '2班', ['赵老师', 42, '数学'], [['钱老师', 31, '语文'], ['孙老师', 33, '英语'], ['周老师', 26, '体育']], [['小刚', 7, '男', [78, 85]], ['小丽', 7, '女', [99, 100, 97]], ['小强', 8, '男', [null, 60]]]]
                        ]);
                    } else {
                        expect(r5.data).toEqual([
                            ['一年级', '1班', ['王老师', 35, '语文'], [['李老师', 28, '数学'], ['张老师', 40, '英语']], [['小明', 7, '男', [95, 88, 92]], ['小红', 7, '女', [90, 96, 89]]]],
                            ['一年级', '2班', ['赵老师', 42, '数学'], [['钱老师', 31, '语文'], ['孙老师', 33, '英语'], ['周老师', 26, '体育']], [['小刚', 7, '男', [78, 85, null]], ['小丽', 7, '女', [99, 100, 97]], ['小强', 8, '男', [null, 60, null]]]]
                        ]);
                    }
                });

                test('还原一致', () => {
                    expect(decompress(r5)).toEqual(src5Decompressed);
                });

                test('stringify/parse 往返', () => {
                    const str = stringify(r5);
                    expect(parse(str)).toEqual(r5);
                    expect(decompress(parse(str))).toEqual(src5Decompressed);
                });
            });

            /* =========================================================
               场景6-10：复杂嵌套对象和数组
               ========================================================= */

            describe('场景6：四层嵌套（组织→部门→团队→成员+技能标签）', () => {
                const r6 = compress(src6, copt);

                test('schema 一致', () => {
                    expect(r6.schema).toEqual([['org', { departments: [['name', { teams: [['lead', { members: [['name', 'level', 'skills']] }]] }]] }]]);
                });
                test('data 一致', () => {
                    if (trim) {
                        expect(r6.data).toEqual([['TechCorp',[['Engineering',[['Alice',[['Bob','L5',['Go','K8s']],['Carol','L4',['Python','ML']]]],['Dave',[['Eve','L6']]]]],['Design',[['Frank',[['Grace','L3',['Figma','CSS']]]]]]]]]);
                    } else {
                        expect(r6.data).toEqual([['TechCorp',[['Engineering',[['Alice',[['Bob','L5',['Go','K8s']],['Carol','L4',['Python','ML']]]],['Dave',[['Eve','L6',null]]]]],['Design',[['Frank',[['Grace','L3',['Figma','CSS']]]]]]]]]);
                    }
                });
                test('还原一致', () => { expect(decompress(r6)).toEqual(src6Decompressed); });
                test('stringify/parse 往返', () => {
                    const str = stringify(r6);
                    expect(parse(str)).toEqual(r6);
                    expect(decompress(parse(str))).toEqual(src6Decompressed);
                });
            });

            describe('场景7：同层混合 — 嵌套对象+嵌套数组+原始数组，字段不对称', () => {
                const r7 = compress(src7, copt);

                test('schema 一致', () => {
                    expect(r7.schema).toEqual([['product', { spec: ['weight', 'layout', 'switch', 'dpi', 'size', 'resolution', 'refresh'] }, { reviews: [['user', 'rating', 'comment']] }, 'tags']]);
                });
                test('data 一致', () => {
                    if (trim) {
                        expect(r7.data).toEqual([
                            ['Keyboard', ['800g', '104-key', 'Cherry MX'], [['Alice', 5, 'Great!'], ['Bob', 4]], ['mechanical', 'RGB']],
                            ['Mouse', ['60g', null, null, 16000], [['Carol', 3, 'Too light'], ['Dave', 5, 'Perfect'], ['Eve', 4]]],
                            ['Monitor', ['5kg', null, null, null, '27in', '4K', 144], []]
                        ]);
                    } else {
                        expect(r7.data).toEqual([
                            ['Keyboard', ['800g', '104-key', 'Cherry MX', null, null, null, null], [['Alice', 5, 'Great!'], ['Bob', 4, null]], ['mechanical', 'RGB']],
                            ['Mouse', ['60g', null, null, 16000, null, null, null], [['Carol', 3, 'Too light'], ['Dave', 5, 'Perfect'], ['Eve', 4, null]], null],
                            ['Monitor', ['5kg', null, null, null, '27in', '4K', 144], [], null]
                        ]);
                    }
                });
                test('还原一致', () => { expect(decompress(r7)).toEqual(src7Decompressed); });
                test('stringify/parse 往返', () => {
                    const str = stringify(r7);
                    expect(parse(str)).toEqual(r7);
                    expect(decompress(parse(str))).toEqual(src7Decompressed);
                });
            });

            describe('场景8：数组的数组内含对象（矩阵，内层对象 key 不对称）', () => {
                const r8 = compress(src8, copt);

                test('schema 一致', () => {
                    expect(r8.schema).toEqual([[{ matrix: [[['x', 'y', 'z']]] }, 'label']]);
                });
                test('data 一致', () => {
                    if (trim) {
                        expect(r8.data).toEqual([
                            [[[[1, 'a'], [2, 'b', 99]], [[3, 'c']]], 'grid-A'],
                            [[[[10, 'd', 88]], [[20, 'e'], [30, 'f', 77]], [[40, 'g']]], 'grid-B']
                        ]);
                    } else {
                        expect(r8.data).toEqual([
                            [[[[1, 'a', null], [2, 'b', 99]], [[3, 'c', null]]], 'grid-A'],
                            [[[[10, 'd', 88]], [[20, 'e', null], [30, 'f', 77]], [[40, 'g', null]]], 'grid-B']
                        ]);
                    }
                });
                test('还原一致', () => { expect(decompress(r8)).toEqual(src8Decompressed); });
                test('stringify/parse 往返', () => {
                    const str = stringify(r8);
                    expect(parse(str)).toEqual(r8);
                    expect(decompress(parse(str))).toEqual(src8Decompressed);
                });
            });

            describe('场景9：深层缺失 — 每层都有字段缺失', () => {
                const r9 = compress(src9, copt);

                test('schema 一致', () => {
                    expect(r9.schema).toEqual([['company', { address: ['city', 'zip'] }, { departments: [['name', { head: ['name', 'age', 'title'] }, { staff: [['name', 'phone', 'email']] }]] }]]);
                });
                test('data 一致', () => {
                    if (trim) {
                        expect(r9.data).toEqual([
                            ['Acme', ['Beijing', '100000'], [['Sales', ['Tom', 40], [['Amy', '111'], ['Ben']]]]],
                            ['Globex', null, [['Tech', ['Cat', 35, 'VP'], [['Dan', '222', 'dan@x.com'], ['Eve', null, 'eve@x.com']]], ['Ops', null, [['Fox']]]]]]);
                    } else {
                        expect(r9.data).toEqual([
                            ['Acme', ['Beijing', '100000'], [['Sales', ['Tom', 40, null], [['Amy', '111', null], ['Ben', null, null]]]]],
                            ['Globex', null, [['Tech', ['Cat', 35, 'VP'], [['Dan', '222', 'dan@x.com'], ['Eve', null, 'eve@x.com']]], ['Ops', null, [['Fox', null, null]]]]]]);
                    }
                });
                test('还原一致', () => { expect(decompress(r9)).toEqual(src9Decompressed); });
                test('stringify/parse 往返', () => {
                    const str = stringify(r9);
                    expect(parse(str)).toEqual(r9);
                    expect(decompress(parse(str))).toEqual(src9Decompressed);
                });
            });

            describe('场景10：数组内含不同结构的对象（同数组 key 并集）', () => {
                const r10 = compress(src10, copt);

                test('schema 一致', () => {
                    expect(r10.schema).toEqual([[{ events: [['type', 'target', 'timestamp', 'offset', 'direction', 'field', 'value', 'valid', 'form', 'success', 'error']] }, 'session']]);
                });
                test('data 一致', () => {
                    if (trim) {
                        expect(r10.data).toEqual([
                            [[['click', 'button', 1000], ['scroll', null, null, 500, 'down'], ['input', null, null, null, null, 'email', 'a@b.com', true]], 'abc'],
                            [[['submit', null, null, null, null, null, null, null, 'login', false, 'timeout']], 'xyz']
                        ]);
                    } else {
                        expect(r10.data).toEqual([
                            [[['click', 'button', 1000, null, null, null, null, null, null, null, null], ['scroll', null, null, 500, 'down', null, null, null, null, null, null], ['input', null, null, null, null, 'email', 'a@b.com', true, null, null, null]], 'abc'],
                            [[['submit', null, null, null, null, null, null, null, 'login', false, 'timeout']], 'xyz']
                        ]);
                    }
                });
                test('还原一致', () => { expect(decompress(r10)).toEqual(src10Decompressed); });
                test('stringify/parse 往返', () => {
                    const str = stringify(r10);
                    expect(parse(str)).toEqual(r10);
                    expect(decompress(parse(str))).toEqual(src10Decompressed);
                });
            });

            /* =========================================================
               覆盖率补充测试
               ========================================================= */
            describe('覆盖率补充', () => {
                // line 35-36: mergeSchemas 对象 schema 合并不同 key（需经 array-of-arrays 路径）
                test('数组的数组内含不同 key 的对象 → mergeSchemas 合并', () => {
                    const src = [[{ a: 1, b: 2 }], [{ a: 3, c: 4 }]];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[['a', 'b', 'c']]]);
                    if (trim) {
                        expect(r.data).toEqual([[[1, 2]], [[3, null, 4]]]);
                    } else {
                        expect(r.data).toEqual([[[1, 2, null]], [[3, null, 4]]]);
                    }
                    expect(decompress(r)).toEqual([[{ a: 1, b: 2, c: null }], [{ a: 3, b: null, c: 4 }]]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([[{ a: 1, b: 2, c: null }], [{ a: 3, b: null, c: 4 }]]);
                });

                // line 79: inferSchema 原始值数组返回 undefined
                test('原始值数组作为字段值 → 不拆解', () => {
                    const src = [{ name: 'x', nums: [1, 2, 3] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'nums']]);
                    expect(r.data).toEqual([['x', [1, 2, 3]]]);
                    expect(decompress(r)).toEqual(src);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual(src);
                });
            });

            /* =========================================================
               边界 / 异常
               ========================================================= */
            describe('边界 / 异常', () => {

                test('compress 空数组 → 返回原值', () => {
                    expect(compress([], copt)).toEqual([]);
                });

                test('compress(null) → 返回原值', () => {
                    expect(compress(null, copt)).toBeNull();
                });

                test('compress 单个对象', () => {
                    const obj = { name: '张三', age: 25 };
                    const r = compress(obj, copt);
                    expect(r.schema).toEqual(['name', 'age']);
                    expect(r.data).toEqual(['张三', 25]);
                    expect(decompress(r)).toEqual(obj);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual(obj);
                });

                test('compress 非数组 → 返回原值', () => {
                    expect(compress('hello', copt)).toBe('hello');
                });

                test('源数组含 null 元素', () => {
                    const src = [{ name: 'a', age: 10 }, null, { name: 'b' }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'age']]);
                    if (trim) {
                        expect(r.data).toEqual([['a', 10], null, ['b']]);
                    } else {
                        expect(r.data).toEqual([['a', 10], null, ['b', null]]);
                    }
                    expect(decompress(r)).toEqual([
                        { name: 'a', age: 10 },
                        null,
                        { name: 'b', age: null }
                    ]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([
                        { name: 'a', age: 10 },
                        null,
                        { name: 'b', age: null }
                    ]);
                });

                test('空对象数组字段', () => {
                    const src = [{ name: 'test', items: [] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'items']]);
                    expect(r.data).toEqual([['test', []]]);
                    expect(decompress(r)).toEqual(src);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual(src);
                });

                test('嵌套对象数组中含 null 元素（首元 null→退化为 primitive-array）', () => {
                    const src = [{ name: 'a', kids: [null, { name: 'child' }] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'kids']]);
                    expect(r.data).toEqual([['a', [null, { name: 'child' }]]]);
                    expect(decompress(r)).toEqual(src);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual(src);
                });

                test('字段值为 undefined 转 null', () => {
                    const src = [{ a: undefined, b: 1 }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['a', 'b']]);
                    expect(r.data).toEqual([[null, 1]]);
                    expect(decompress(r)).toEqual([{ a: null, b: 1 }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([{ a: null, b: 1 }]);
                });

                test('字段值为 null 在 decompress 中还原', () => {
                    const src = [{ a: 1, b: null }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['a', 'b']]);
                    if (trim) {
                        expect(r.data).toEqual([[1]]);
                    } else {
                        expect(r.data).toEqual([[1, null]]);
                    }
                    expect(decompress(r)).toEqual([{ a: 1, b: null }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([{ a: 1, b: null }]);
                });

                test('对象数组中含非对象元素（item typeof!=="object" 分支）', () => {
                    const src = [{ name: 'x', kids: [{ name: 'kid' }, 'string', null] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', { kids: [['name']] }]]);
                    if (trim) {
                        expect(r.data).toEqual([['x', [['kid'], 'string']]]);
                    } else {
                        expect(r.data).toEqual([['x', [['kid'], 'string', null]]]);
                    }
                    const decompressed = decompress(r);
                    expect(decompressed[0].name).toBe('x');
                    expect(decompressed[0].kids[0]).toEqual({ name: 'kid' });
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('原数组含数字元素（typeof obj!=="object" 各分支）', () => {
                    const src = [42, { name: 'a' }, true, { name: 'b' }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name']]);
                    expect(r.data).toEqual([42, ['a'], true, ['b']]);
                    expect(decompress(r)).toEqual([42, { name: 'a' }, true, { name: 'b' }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('getValueKind：数组首元素也是数组 → primitive-array', () => {
                    const src = [{ name: 'x', matrix: [[1, 2], [3, 4]] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'matrix']]);
                    expect(r.data).toEqual([['x', [[1, 2], [3, 4]]]]);
                    expect(decompress(r)).toEqual(src);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual(src);
                });

                test('普通原始类型数组 [1,2,3] 不拆解', () => {
                    const src = [{ name: 'x', scores: [1, 2, 3] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'scores']]);
                    expect(r.data).toEqual([['x', [1, 2, 3]]]);
                    expect(decompress(r)).toEqual(src);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual(src);
                });

                test('非对象元素 + 嵌套 key（buildRow line 108 三元 false 分支）', () => {
                    const src = [42, { name: 'a', detail: { x: 1 } }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', { detail: ['x'] }]]);
                    expect(r.data).toEqual([42, ['a', [1]]]);
                    expect(decompress(r)).toEqual([42, { name: 'a', detail: { x: 1 } }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('非对象元素 + 对象数组（buildKeys line 73 typeof false 分支）', () => {
                    const src = [42, { items: [{ name: 'a' }] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[{ items: [['name']] }]]);
                    expect(r.data).toEqual([42, [[['a']]]]);
                    expect(decompress(r)).toEqual([42, { items: [{ name: 'a' }] }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('字段值为 null 且 repValue 为 object-array（line 75 Array.isArray false 分支）', () => {
                    const src = [
                        { items: [{ name: 'a' }] },
                        { items: null }
                    ];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[{ items: [['name']] }]]);
                    if (trim) {
                        expect(r.data).toEqual([[[['a']]], []]);
                    } else {
                        expect(r.data).toEqual([[[['a']]], [null]]);
                    }
                    expect(decompress(r)).toEqual([
                        { items: [{ name: 'a' }] },
                        { items: null }
                    ]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([
                        { items: [{ name: 'a' }] },
                        { items: null }
                    ]);
                });

                test('trimTrailingNulls 端到端', () => {
                    const src = [
                        { name: '张三', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello' } },
                        { name: '李四', age: 35, profile: { avatar: 'b.jpg', file: null } },
                        { name: '王五' },
                    ];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([['name', 'age', { profile: ['avatar', 'bio', 'file'] }]]);
                    if (trim) {
                        expect(r.data).toEqual([['张三', 28, ['a.jpg', 'Hello']], ['李四', 35, ['b.jpg']], ['王五']]);
                    } else {
                        expect(r.data).toEqual([['张三', 28, ['a.jpg', 'Hello', null]], ['李四', 35, ['b.jpg', null, null]], ['王五', null, null]]);
                    }
                    expect(decompress(r)).toEqual([
                        { name: '张三', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello', file: null } },
                        { name: '李四', age: 35, profile: { avatar: 'b.jpg', bio: null, file: null } },
                        { name: '王五', age: null, profile: null },
                    ]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([
                        { name: '张三', age: 28, profile: { avatar: 'a.jpg', bio: 'Hello', file: null } },
                        { name: '李四', age: 35, profile: { avatar: 'b.jpg', bio: null, file: null } },
                        { name: '王五', age: null, profile: null },
                    ]);
                });

                test('数组的数组含原始值子数组', () => {
                    const src = [[1, 2], [{ a: 1 }]];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[['a']]]);
                    expect(r.data).toEqual([[1, 2], [[1]]]);
                    expect(decompress(r)).toEqual([[1, 2], [{ a: 1 }]]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                    expect(decompress(parse(str))).toEqual([[1, 2], [{ a: 1 }]]);
                });

                test('数组的数组含不同 key 对象（mergeSchemas 不同 key 合并）', () => {
                    const src = [[{ a: 1, b: 2 }], [{ c: 3 }]];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[['a', 'b', 'c']]]);
                    if (trim) {
                        expect(r.data).toEqual([[[1, 2]], [[null, null, 3]]]);
                    } else {
                        expect(r.data).toEqual([[[1, 2, null]], [[null, null, 3]]]);
                    }
                    expect(decompress(r)).toEqual([[{ a: 1, b: 2, c: null }], [{ a: null, b: null, c: 3 }]]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('数组的数组混合含对象和原始值（mergeSchemas s2=undefined 分支）', () => {
                    const src = [{ matrix: [[{ a: 1 }]] }, { matrix: [[1, 2]] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[{ matrix: [[['a']]] }]]);
                    expect(r.data).toEqual([[[[[1]]]], [[[1, 2]]]]);
                    expect(decompress(r)).toEqual([{ matrix: [[{ a: 1 }]] }, { matrix: [[1, 2]] }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('数组的数组含空子数组（inferSchema 空数组分支）', () => {
                    const src = [[{ a: 1 }], []];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[['a']]]);
                    expect(r.data).toEqual([[[1]], []]);
                    expect(decompress(r)).toEqual([[{ a: 1 }], []]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('数组的数组含不同嵌套 key 对象（mergeSchemas 对象 fieldDef 合并）', () => {
                    const src = [[{ a: { x: 1 } }], [{ b: { y: 2 } }]];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[[{ a: ['x'] }, { b: ['y'] }]]]);
                    if (trim) {
                        expect(r.data).toEqual([[[[1]]], [[null, [2]]]]);
                    } else {
                        expect(r.data).toEqual([[[[1], null]], [[null, [2]]]]);
                    }
                    expect(decompress(r)).toEqual([[{ a: { x: 1 }, b: null }], [{ a: null, b: { y: 2 } }]]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('对象数组字段含空数组值（compressWithSchema 数组值分支）', () => {
                    const src = [{ items: [{ name: 'a' }] }, { items: [] }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[{ items: [['name']] }]]);
                    expect(r.data).toEqual([[[['a']]], [[]]]);
                    expect(decompress(r)).toEqual([{ items: [{ name: 'a' }] }, { items: [] }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('对象数组字段含非数组值（Array.isArray(v) false 分支）', () => {
                    const src = [{ items: [{ name: 'a' }] }, { items: 'string' }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[{ items: [['name']] }]]);
                    if (trim) {
                        expect(r.data).toEqual([[[['a']]], []]);
                    } else {
                        expect(r.data).toEqual([[[['a']]], [null]]);
                    }
                    expect(decompress(r)).toEqual([{ items: [{ name: 'a' }] }, { items: null }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

                test('数组的数组字段含非数组值（array-of-arrays Array.isArray(v) false 分支）', () => {
                    const src = [{ matrix: [[{ a: 1 }]] }, { matrix: 'string' }];
                    const r = compress(src, copt);
                    expect(r.schema).toEqual([[{ matrix: [[['a']]] }]]);
                    if (trim) {
                        expect(r.data).toEqual([[[[[1]]]], []]);
                    } else {
                        expect(r.data).toEqual([[[[[1]]]], [null]]);
                    }
                    expect(decompress(r)).toEqual([{ matrix: [[{ a: 1 }]] }, { matrix: null }]);
                    const str = stringify(r);
                    expect(parse(str)).toEqual(r);
                });

            });

        }); // end [label] describe
    }); // end forEach

    // line 285: decompressWithSchema 中 fieldDef 既非 string 也非 object → continue
    describe('decompress 特殊 schema', () => {
        test('schema 含非字符串非对象元素 → 跳过', () => {
            const r = decompress({ schema: [1, 'name'], data: [42, 'test'] });
            expect(r).toEqual({ name: 'test' });
        });

        test('decompress(null) → null', () => {
            expect(decompress(null)).toBeNull();
        });

        test('decompress([]) → []', () => {
            expect(decompress([])).toEqual([]);
        });

        test('decompress 无 data 属性的对象 → 原样返回', () => {
            expect(decompress({ foo: 1 })).toEqual({ foo: 1 });
        });

        test('decompress 非对象值 → 原样返回', () => {
            expect(decompress('hello')).toBe('hello');
            expect(decompress(42)).toBe(42);
        });
    });

    /* =========================================================
       stringify / parse — 省略 null 文本化 与 还原
       （以下测试不依赖 compress，不需要按 trim 分组）
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

        // ---- 与 compress/decompress 联用（纯 stringify/parse，不按 trim 分组）----
        describe('与 compress/decompress 联用', () => {
            test('compress → stringify → parse → decompress（顶层缺失字段）', () => {
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
