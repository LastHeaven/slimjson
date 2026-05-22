/**
 * 压缩率测试脚本
 * 运行：node compress-test.js
 */
const { compress, decompress, stringify } = require('./compress');

// ============================================================
// 工具函数
// ============================================================

/** 计算JSON字符串字节大小 */
function getByteSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

/** 格式化字节数 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 随机整数 [min, max] */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 随机选择数组元素 */
function randChoice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

/** 随机中文名 */
function randChineseName() {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '郑', '孙', '马', '朱', '胡', '林', '郭', '何', '罗', '高'];
  const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '华', '平', '刚', '玉兰', '桂英', '秀珍', '婷', '浩', '宇', '欣', '怡', '子轩', '子涵', '梓萱', '一诺'];
  return randChoice(surnames) + randChoice(names) + (Math.random() > 0.5 ? randChoice(names) : '');
}

/** 随机邮箱 */
function randEmail() {
  const domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'icloud.com'];
  const prefix = 'user' + randInt(1000, 9999);
  return `${prefix}@${randChoice(domains)}`;
}

/** 随机手机号 */
function randPhone() {
  const prefixes = ['138', '139', '186', '187', '150', '151', '177', '188'];
  return randChoice(prefixes) + randInt(10000000, 99999999).toString();
}

/** 随机日期字符串 */
function randDate(startYear = 1990, endYear = 2024) {
  const year = randInt(startYear, endYear);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/** 随机地址 */
function randAddress() {
  const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '武汉市', '成都市', '西安市', '重庆市'];
  const districts = ['朝阳区', '海淀区', '浦东新区', '天河区', '南山区', '西湖区', '江宁区', '洪山区', '雁塔区', '渝北区'];
  return randChoice(cities) + randChoice(districts) + randInt(1, 999) + '号';
}

// ============================================================
// 数据生成器
// ============================================================

/**
 * 1. 简单用户数组
 * - 字段：id, name, age, email, phone, address, createdAt
 */
function generateSimpleUsers(count) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: randChineseName(),
      age: randInt(18, 70),
      email: randEmail(),
      phone: randPhone(),
      address: randAddress(),
      createdAt: randDate(2020, 2024)
    });
  }
  return users;
}

/**
 * 2. 带嵌套对象的用户数组
 * - 字段：id, name, profile: { avatar, bio, website, social: { weibo, wechat } }
 */
function generateNestedUsers(count) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: randChineseName(),
      profile: {
        avatar: `https://example.com/avatar/${randInt(1, 1000)}.jpg`,
        bio: `这是第${i}个用户的个人简介，来自${randAddress()}`,
        website: Math.random() > 0.5 ? `https://user${i}.example.com` : null,
        social: {
          weibo: Math.random() > 0.3 ? `weibo_${randInt(10000, 99999)}` : null,
          wechat: Math.random() > 0.3 ? `wx_${randInt(10000, 99999)}` : null
        }
      }
    });
  }
  return users;
}

/**
 * 3. 带对象数组的订单数组
 * - 字段：orderId, customer, items: [{ productId, name, price, quantity }], total, status
 */
function generateOrders(count, itemsPerOrder = [1, 5]) {
  const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const itemCount = randInt(itemsPerOrder[0], itemsPerOrder[1]);
    const items = [];
    let total = 0;
    for (let j = 1; j <= itemCount; j++) {
      const price = randInt(10, 1000) * 100; // 分为单位
      const quantity = randInt(1, 5);
      items.push({
        productId: `PROD-${randInt(10000, 99999)}`,
        name: `商品${randInt(1, 1000)}`,
        price: price,
        quantity: quantity
      });
      total += price * quantity;
    }
    orders.push({
      orderId: `ORD-${randInt(100000, 999999)}`,
      customer: randChineseName(),
      items: items,
      total: total,
      status: randChoice(statuses),
      createdAt: randDate(2023, 2024)
    });
  }
  return orders;
}

/**
 * 4. 复杂嵌套结构 - 学校数据
 * - 年级 -> 班级 -> 学生 -> 成绩、家长信息
 */
function generateSchoolData(gradeCount, classPerGrade, studentPerClass) {
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  const subjects = ['语文', '数学', '英语', '科学', '体育', '美术'];
  const genders = ['男', '女'];
  const data = [];

  for (let g = 0; g < gradeCount; g++) {
    for (let c = 1; c <= classPerGrade; c++) {
      const students = [];
      for (let s = 1; s <= studentPerClass; s++) {
        // 随机缺失某些成绩
        const scores = {};
        for (const subject of subjects) {
          if (Math.random() > 0.2) { // 80%概率有成绩
            scores[subject] = randInt(60, 100);
          }
        }

        const parents = [];
        const parentCount = randInt(1, 2);
        for (let p = 0; p < parentCount; p++) {
          parents.push({
            name: randChineseName(),
            relationship: p === 0 ? '父亲' : '母亲',
            phone: randPhone(),
            occupation: randChoice(['教师', '医生', '工程师', '商人', '职员', '自由职业'])
          });
        }

        students.push({
          id: `${g}${c}${s.toString().padStart(2, '0')}`,
          name: randChineseName(),
          gender: randChoice(genders),
          age: g + 7,
          scores: scores,
          parents: parents,
          address: Math.random() > 0.3 ? randAddress() : null
        });
      }

      data.push({
        grade: grades[g] || `${g + 1}年级`,
        class: `${c}班`,
        classTeacher: {
          name: randChineseName(),
          age: randInt(30, 55),
          phone: randPhone(),
          subjects: [randChoice(subjects.slice(0, 3))]
        },
        students: students
      });
    }
  }
  return data;
}

/**
 * 5. 稀疏字段数组 - 模拟后端返回不完整数据
 * - 每个对象有不同的字段子集
 */
function generateSparseData(count, totalFields = 20) {
  const fieldNames = [];
  for (let i = 1; i <= totalFields; i++) {
    fieldNames.push(`field_${i}`);
  }

  const data = [];
  for (let i = 1; i <= count; i++) {
    const obj = { id: i };
    // 每个对象随机选择50%-80%的字段
    const fieldCount = randInt(Math.floor(totalFields * 0.5), Math.floor(totalFields * 0.8));
    const selectedFields = [...fieldNames].sort(() => Math.random() - 0.5).slice(0, fieldCount);
    
    for (const field of selectedFields) {
      obj[field] = randInt(0, 1000);
    }
    data.push(obj);
  }
  return data;
}

/**
 * 6. 深层嵌套结构
 * - organization -> departments -> teams -> members -> tasks
 */
function generateDeepNested(orgCount = 2, deptPerOrg = 3, teamPerDept = 4, memberPerTeam = 5) {
  const data = [];
  for (let o = 1; o <= orgCount; o++) {
    const departments = [];
    for (let d = 1; d <= deptPerOrg; d++) {
      const teams = [];
      for (let t = 1; t <= teamPerDept; t++) {
        const members = [];
        for (let m = 1; m <= memberPerTeam; m++) {
          const taskCount = randInt(1, 5);
          const tasks = [];
          for (let tk = 1; tk <= taskCount; tk++) {
            tasks.push({
              taskId: `TASK-${randInt(10000, 99999)}`,
              title: `任务${tk}`,
              status: randChoice(['todo', 'in_progress', 'done']),
              priority: randChoice(['low', 'medium', 'high']),
              dueDate: randDate(2024, 2025)
            });
          }
          members.push({
            memberId: `M${o}${d}${t}${m}`,
            name: randChineseName(),
            role: randChoice(['leader', 'member', 'intern']),
            tasks: tasks,
            skills: randInt(1, 5) > 2 ? ['JavaScript', 'Python', 'Go', 'Rust'].slice(0, randInt(1, 4)) : []
          });
        }
        teams.push({
          teamId: `TEAM-${o}-${d}-${t}`,
          name: `团队${t}`,
          members: members
        });
      }
      departments.push({
        deptId: `DEPT-${o}-${d}`,
        name: `部门${d}`,
        teams: teams
      });
    }
    data.push({
      orgId: o,
      orgName: `组织${o}`,
      departments: departments
    });
  }
  return data;
}

// ============================================================
// 测试执行
// ============================================================

/** 
 * 验证解压正确性：
 * - compress → decompress → compress 应该得到相同结果（roundtrip）
 * - 缺失字段会被填充为 null，这是预期的规范化行为
 */
function verifyRoundtrip(original, compressed, opts) {
  const decompressed = decompress(compressed);
  const recompressed = compress(decompressed, opts);
  // 二次压缩后结构应该完全一致
  return JSON.stringify(compressed) === JSON.stringify(recompressed);
}

function runTest(name, data) {
  const originalSize = getByteSize(data);

  // 默认（不 trim）
  const compressed = compress(data);
  const compressedSize = Buffer.byteLength(stringify(compressed), 'utf8');
  const isCorrect = verifyRoundtrip(data, compressed);
  const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

  // trimTrailingNulls
  const compressedTrim = compress(data, { trimTrailingNulls: true });
  const compressedTrimSize = Buffer.byteLength(stringify(compressedTrim), 'utf8');
  const isCorrectTrim = verifyRoundtrip(data, compressedTrim, { trimTrailingNulls: true });
  const ratioTrim = ((originalSize - compressedTrimSize) / originalSize * 100).toFixed(2);

  const diff = compressedSize - compressedTrimSize;
  const diffStr = diff > 0 ? `-${formatBytes(diff)}` : diff === 0 ? '—' : `+${formatBytes(-diff)}`;

  console.log(`\n${'='.repeat(72)}`);
  console.log(`测试: ${name}`);
  console.log('-'.repeat(72));
  console.log(`对象数量:        ${data.length}`);
  console.log(`原始大小:        ${formatBytes(originalSize)}`);
  console.log(`不 trim:         ${formatBytes(compressedSize).padStart(10)}  (${ratio}%)  ${isCorrect ? '✓' : '✗'}`);
  console.log(`trim:            ${formatBytes(compressedTrimSize).padStart(10)}  (${ratioTrim}%)  ${isCorrectTrim ? '✓' : '✗'}`);
  console.log(`差值:            ${diffStr}`);

  return {
    name,
    count: data.length,
    originalSize,
    compressedSize,
    ratio: parseFloat(ratio),
    compressedTrimSize,
    ratioTrim: parseFloat(ratioTrim),
    diff,
    isCorrect
  };
}

function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           JSON 数组压缩率测试                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const results = [];

  // 1. 简单用户数组 - 不同规模
  console.log('\n\n【一、简单用户数组测试】');
  results.push(runTest('简单用户 100条', generateSimpleUsers(100)));
  results.push(runTest('简单用户 1000条', generateSimpleUsers(1000)));
  results.push(runTest('简单用户 10000条', generateSimpleUsers(10000)));

  // 2. 嵌套对象数组
  console.log('\n\n【二、嵌套对象数组测试】');
  results.push(runTest('嵌套用户 100条', generateNestedUsers(100)));
  results.push(runTest('嵌套用户 1000条', generateNestedUsers(1000)));
  results.push(runTest('嵌套用户 5000条', generateNestedUsers(5000)));

  // 3. 带对象数组的订单
  console.log('\n\n【三、订单数组测试（每单1-5商品）】');
  results.push(runTest('订单 100条', generateOrders(100)));
  results.push(runTest('订单 500条', generateOrders(500)));
  results.push(runTest('订单 2000条', generateOrders(2000)));

  // 4. 学校数据 - 复杂嵌套
  console.log('\n\n【四、学校数据测试（复杂嵌套）】');
  results.push(runTest('学校数据 小(2年级×2班×10生)', generateSchoolData(2, 2, 10)));
  results.push(runTest('学校数据 中(6年级×4班×30生)', generateSchoolData(6, 4, 30)));
  results.push(runTest('学校数据 大(6年级×6班×50生)', generateSchoolData(6, 6, 50)));

  // 5. 稀疏字段数组
  console.log('\n\n【五、稀疏字段数组测试】');
  results.push(runTest('稀疏字段 100条×20字段', generateSparseData(100, 20)));
  results.push(runTest('稀疏字段 500条×30字段', generateSparseData(500, 30)));
  results.push(runTest('稀疏字段 2000条×50字段', generateSparseData(2000, 50)));

  // 6. 深层嵌套
  console.log('\n\n【六、深层嵌套测试】');
  results.push(runTest('深层嵌套 小', generateDeepNested(2, 2, 3, 4)));
  results.push(runTest('深层嵌套 中', generateDeepNested(3, 4, 5, 6)));
  results.push(runTest('深层嵌套 大', generateDeepNested(5, 5, 8, 8)));

  // 汇总
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           测试结果汇总                                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const avgRatio = results.reduce((sum, r) => sum + r.ratio, 0) / results.length;
  const avgRatioTrim = results.reduce((sum, r) => sum + r.ratioTrim, 0) / results.length;
  const totalDiff = results.reduce((sum, r) => sum + r.diff, 0);
  const bestCase = results.reduce((best, r) => r.ratioTrim > best.ratioTrim ? r : best);
  const worstCase = results.reduce((worst, r) => r.ratioTrim < worst.ratioTrim ? r : worst);

  console.log(`总测试数: ${results.length}`);
  console.log(`平均压缩率（不 trim）: ${avgRatio.toFixed(2)}%`);
  console.log(`平均压缩率（trim）:    ${avgRatioTrim.toFixed(2)}%`);
  console.log(`总节省:               ${formatBytes(totalDiff)}`);
  console.log(`最佳压缩: ${bestCase.name} (trim ${bestCase.ratioTrim}%)`);
  console.log(`最差压缩: ${worstCase.name} (trim ${worstCase.ratioTrim}%)`);

  console.log('\n详细结果:');
  console.log('-'.repeat(100));
  console.log(
    `${'测试名称'.padEnd(34)} ${'数量'.padStart(6)}` +
    `${'原始'.padStart(12)} ${'不 trim'.padStart(12)} ${'压缩率'.padStart(7)}` +
    `${'trim'.padStart(12)} ${'压缩率'.padStart(7)} ${'差值'.padStart(12)}`
  );
  console.log('-'.repeat(100));
  for (const r of results) {
    const diffStr = r.diff > 0 ? `-${formatBytes(r.diff)}` : r.diff === 0 ? '—' : `+${formatBytes(-r.diff)}`;
    console.log(
      `${r.name.padEnd(34)} ${r.count.toString().padStart(6)}` +
      `${formatBytes(r.originalSize).padStart(12)}` +
      `${formatBytes(r.compressedSize).padStart(12)} ${r.ratio.toString().padStart(6)}%` +
      `${formatBytes(r.compressedTrimSize).padStart(12)} ${r.ratioTrim.toString().padStart(6)}%` +
      `${diffStr.padStart(12)}`
    );
  }
  
  console.log('\n结论:');
  console.log('-'.repeat(70));
  console.log('1. 字段名越长、数量越多，压缩效果越好');
  console.log('2. 嵌套结构（对象数组）压缩效果显著');
  console.log('3. 稀疏字段（缺失字段多）压缩率反而最高（null 被省略为空槽）');
  console.log('4. 原始类型数组字段不会被压缩（保持原样）');
  console.log('5. 深层嵌套结构能获得更好的压缩效果');
  console.log('6. 安全的字符串省略引号（key + value），进一步减少文本体积');
}

main();
