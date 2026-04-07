# 中文字典程序库 | Chinese Dictionary Program Library

**创建时间**: 2026-04-07 15:00  
**目的**: 为每个汉字建立程序映射，从底层字义开始

---

## 📖 字典结构

每个汉字包含：
- **字形** - 字的写法
- **拼音** - 发音
- **部首** - 分类
- **笔画** - 结构
- **基本义** - 核心含义
- **引申义** - 扩展含义
- **情感色彩** - 正向/负向/中性
- **使用频率** - 高频/中频/低频
- **程序** - 运行时的解压缩逻辑

---

## 🔤 基础字程序 (按使用频率排序)

### 高频字 (Top 100)

#### 的
```javascript
{
  char: '的',
  pinyin: 'de',
  radical: '白',
  strokes: 8,
  frequency: '超高频 (占汉语料 4%+)',
  type: '助词',
  program: () => ({
    function: '所有格标记/定语标记',
    compression: '连接修饰语和中心语',
    examples: ['我的书', '美丽的花', '昨天的事'],
    decompression: 'X 的 Y = X 属于 Y / X 修饰 Y'
  })
}
```

#### 一
```javascript
{
  char: '一',
  pinyin: 'yī',
  radical: '一',
  strokes: 1,
  frequency: '超高频',
  type: '数词/副词',
  program: () => ({
    meaning: '最小正整数/唯一/同一',
    philosophy: '万物之始，道生一',
    examples: ['一个人', '一样', '一起'],
    decompression: '一 = 单一性/统一性/起始点'
  })
}
```

#### 是
```javascript
{
  char: '是',
  pinyin: 'shì',
  radical: '日',
  strokes: 9,
  frequency: '超高频',
  type: '动词/判断词',
  program: () => ({
    function: '判断/肯定/存在',
    logic: 'A 是 B = A 属于 B 类别 / A 等于 B',
    examples: ['我是学生', '这是书', '是的'],
    decompression: '是 = 判断 + 肯定 + 存在声明'
  })
}
```

#### 我
```javascript
{
  char: '我',
  pinyin: 'wǒ',
  radical: '戈',
  strokes: 7,
  frequency: '超高频',
  type: '代词',
  program: () => ({
    function: '第一人称代词',
    philosophy: '自我意识的语言标记',
    examples: ['我想', '我要', '我的'],
    decompression: '我 = 说话者/行动主体/自我概念'
  })
}
```

#### 你
```javascript
{
  char: '你',
  pinyin: 'nǐ',
  radical: '人',
  strokes: 7,
  frequency: '超高频',
  type: '代词',
  program: () => ({
    function: '第二人称代词',
    philosophy: '他者意识的语言标记',
    examples: ['你想', '你要', '你的'],
    decompression: '你 = 听话者/对话对象/他者概念'
  })
}
```

#### 不
```javascript
{
  char: '不',
  pinyin: 'bù',
  radical: '一',
  strokes: 4,
  frequency: '超高频',
  type: '副词/否定词',
  program: () => ({
    function: '否定/拒绝',
    logic: '不 X = X 的反面/非 X',
    examples: ['不是', '不要', '不好'],
    decompression: '不 = 逻辑否定 + 拒绝态度 + 反向操作'
  })
}
```

#### 了
```javascript
{
  char: '了',
  pinyin: 'le',
  radical: '乙',
  strokes: 2,
  frequency: '超高频',
  type: '助词',
  program: () => ({
    function: '完成体标记/变化标记',
    time: '表示动作完成或状态变化',
    examples: ['吃了', '来了', '好了'],
    decompression: '了 = 完成 + 变化 + 新状态'
  })
}
```

#### 人
```javascript
{
  char: '人',
  pinyin: 'rén',
  radical: '人',
  strokes: 2,
  frequency: '超高频',
  type: '名词',
  program: () => ({
    meaning: '人类/个体/他人',
    philosophy: '万物之灵，有意识的存在',
    examples: ['人们', '别人', '人生'],
    decompression: '人 = 生物属性 + 社会属性 + 意识属性'
  })
}
```

#### 在
```javascript
{
  char: '在',
  pinyin: 'zài',
  radical: '土',
  strokes: 6,
  frequency: '超高频',
  type: '介词/动词',
  program: () => ({
    function: '存在/位置/进行',
    space: '表示位置或状态',
    examples: ['在家', '存在', '在看书'],
    decompression: '在 = 空间位置 + 时间状态 + 存在声明'
  })
}
```

#### 有
```javascript
{
  char: '有',
  pinyin: 'yǒu',
  radical: '月',
  strokes: 6,
  frequency: '超高频',
  type: '动词',
  program: () => ({
    function: '拥有/存在',
    logic: '有 X = X 存在 / X 属于主语',
    examples: ['有钱', '有人', '有事'],
    decompression: '有 = 存在量化 + 所有权 + 具备'
  })
}
```

#### 这
```javascript
{
  char: '这',
  pinyin: 'zhè',
  radical: '辶',
  strokes: 7,
  frequency: '超高频',
  type: '代词',
  program: () => ({
    function: '近指代词',
    space: '指代较近的人或事物',
    examples: ['这个', '这里', '这样'],
    decompression: '这 = 近指 + 当前 + 此处'
  })
}
```

#### 中
```javascript
{
  char: '中',
  pinyin: 'zhōng',
  radical: '丨',
  strokes: 4,
  frequency: '超高频',
  type: '名词/方位词',
  program: () => ({
    meaning: '中间/内部/中国',
    philosophy: '中庸之道，不偏不倚',
    examples: ['中间', '中国', '心中'],
    decompression: '中 = 空间中心 + 范围内 + 平衡状态'
  })
}
```

#### 来
```javascript
{
  char: '来',
  pinyin: 'lái',
  radical: '木',
  strokes: 7,
  frequency: '高频',
  type: '动词',
  program: () => ({
    function: '移动/趋向',
    direction: '向说话者方向移动',
    examples: ['来了', '来北京', '未来'],
    decompression: '来 = 趋近运动 + 时间未来 + 目的到达'
  })
}
```

#### 上
```javascript
{
  char: '上',
  pinyin: 'shàng',
  radical: '一',
  strokes: 3,
  frequency: '高频',
  type: '方位词/动词',
  program: () => ({
    meaning: '上方/向上/上升',
    direction: '垂直向上的方向',
    examples: ['上面', '上学', '上班'],
    decompression: '上 = 空间上方 + 等级更高 + 动作开始'
  })
}
```

#### 要
```javascript
{
  char: '要',
  pinyin: 'yào',
  radical: '西',
  strokes: 9,
  frequency: '高频',
  type: '动词/助动词',
  program: () => ({
    function: '想要/需要/将要',
    modality: '表达意愿或必要性',
    examples: ['我要', '要好', '要来了'],
    decompression: '要 = 意愿 + 需求 + 未来时态'
  })
}
```

#### 想
```javascript
{
  char: '想',
  pinyin: 'xiǎng',
  radical: '心',
  strokes: 13,
  frequency: '高频',
  type: '动词',
  program: () => ({
    function: '思考/想念/想要',
    mind: '心理活动',
    examples: ['想想', '想你', '想去'],
    decompression: '想 = 认知处理 + 情感思念 + 意愿表达'
  })
}
```

#### 爱
```javascript
{
  char: '爱',
  pinyin: 'ài',
  radical: '爫',
  strokes: 10,
  frequency: '高频',
  type: '动词/名词',
  program: () => ({
    meaning: '深厚的感情',
    emotion: '正向情感，愿意付出',
    examples: ['爱你', '爱心', '热爱'],
    decompression: '爱 = 情感依恋 + 付出意愿 + 价值肯定'
  })
}
```

#### 家
```javascript
{
  char: '家',
  pinyin: 'jiā',
  radical: '宀',
  strokes: 10,
  frequency: '高频',
  type: '名词',
  program: () => ({
    meaning: '家庭/住所/归属',
    emotion: '安全感和归属感',
    examples: ['回家', '家人', '国家'],
    decompression: '家 = 物理空间 + 社会单位 + 情感归属'
  })
}
```

#### 生
```javascript
{
  char: '生',
  pinyin: 'shēng',
  radical: '生',
  strokes: 5,
  frequency: '高频',
  type: '动词/名词',
  program: () => ({
    meaning: '生命/出生/活着',
    philosophy: '生生不息，生命之本',
    examples: ['生活', '生命', '学生'],
    decompression: '生 = 生命存在 + 产生过程 + 活跃状态'
  })
}
```

---

## 📊 字典统计

| 类别 | 已定义 | 目标 | 进度 |
|------|--------|------|------|
| 超高频字 | 18 | 100 | 18% |
| 高频字 | 0 | 1000 | 0% |
| 中频字 | 0 | 3000 | 0% |
| 低频字 | 0 | 6000 | 0% |
| **总计** | **18** | **10000+** | **0.18%** |

---

## 🔄 下一步

1. ✅ 基础框架已建立
2. ⏳ 继续添加高频字 (目标 100 个)
3. ⏳ 实现字→词组合规则
4. ⏳ 实现词→句组合规则
5. ⏳ 集成到 word-programs.js

---

**数据来源**: 现代汉语常用字表、康熙字典  
**状态**: 🔄 建设中
