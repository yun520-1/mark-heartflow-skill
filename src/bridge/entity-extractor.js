/**
 * EntityExtractor — 8种实体类型提取器
 * 从用户输入中提取实体，每个实体返回：
 *   {type, value, position: [start, end], confidence}
 *
 * 实体类型:
 *   product, person, technology, concept, number, time, url, language
 */
class EntityExtractor {
  constructor() {
    this.name = 'entity-extractor';
    this.version = '2.0.0';
  }

  /**
   * 主入口：提取所有8种实体
   * @param {string} input
   * @returns {Array<{type:string, value:string, position:[number,number], confidence:number}>}
   */
  extract(input) {
    if (!input || typeof input !== 'string') return [];

    const entities = [
      ...this._extractUrl(input),
      ...this._extractNumber(input),
      ...this._extractTime(input),
      ...this._extractProduct(input),
      ...this._extractPerson(input),
      ...this._extractTechnology(input),
      ...this._extractLanguage(input),
      ...this._extractConcept(input),
    ];

    // 按 position 排序
    entities.sort((a, b) => a.position[0] - b.position[0]);

    return entities;
  }

  // ── 1. URL ──
  _extractUrl(input) {
    const results = [];
    const re = /(https?:\/\/|ftp:\/\/)[^\s'"）\)\]》】,，。；;：:、]+/gi;
    let m;
    while ((m = re.exec(input)) !== null) {
      results.push({
        type: 'url',
        value: m[0],
        position: [m.index, m.index + m[0].length],
        confidence: 0.98,
      });
    }
    return results;
  }

  // ── 2. Number（含单位） ──
  _extractNumber(input) {
    const results = [];
    // 数字+可选单位：100元, 5个, 3次, 2.5倍, 第1, 100%, 50kg, 3.14
    const re = /(\d+(?:[.,]\d+)?)\s*(元|个|次|倍|%|公斤|kg|KG|g|G|斤|米|cm|CM|毫米|km|岁|年|月|日|天|小时|分钟|秒|人|位|种|类|条|篇|张|台|辆|只|件|双|把|根|块|瓶|盒|包|箱|份|碗|杯|盘|桌|层|栋|间|家|所|座|项|笔|款|版|号|期|页|章|节|段|行|列|点|分|秒)?/gi;
    let m;
    while ((m = re.exec(input)) !== null) {
      // 避免匹配到日期中的纯数字（如"2024"被时间正则覆盖）
      if (this._isPartOfDate(input, m.index)) continue;
      const num = m[1];
      const unit = m[2] || '';
      const raw = m[0];
      results.push({
        type: 'number',
        value: raw.trim(),
        position: [m.index, m.index + raw.length],
        confidence: unit ? 0.95 : 0.85,
      });
    }
    return results;
  }

  // 判断一个数字是否属于日期表达的一部分（如"2024年"由time正则处理）
  _isPartOfDate(input, index) {
    // 看后面是否有年/月/日且是纯4位数字
    const slice = input.slice(index, index + 10);
    return /^\d{4}\s*年/.test(slice) || /^\d{1,2}\s*月/.test(slice);
  }

  // ── 3. Time ──
  _extractTime(input) {
    const results = [];
    const patterns = [
      // 完整日期：2024年12月1日, 2024-12-01, 2024/12/01
      { re: /\d{4}\s*[年/-]\s*\d{1,2}\s*[月/-]\s*\d{1,2}\s*[日]?/g, conf: 0.97 },
      // 年月：2024年12月, 2024-12
      { re: /\d{4}\s*[年/-]\s*\d{1,2}\s*月?/g, conf: 0.95 },
      // 月日：12月1日, Dec 25
      { re: /\d{1,2}\s*月\s*\d{1,2}\s*[日号]?/g, conf: 0.94 },
      { re: /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?/gi, conf: 0.94 },
      // 相对时间词
      { re: /(今天|明天|昨天|后天|前天|本周|上周|下周|本月|上月|下月|今年|去年|明年|今早|今晚|今明|早上|上午|中午|下午|晚上|深夜|凌晨)/g, conf: 0.90 },
      // 时间段：最近X天, 过去X年
      { re: /(?:最近|过去|未来|接下来|前|后)\s*\d*\s*(?:天|周|个月|年|小时|分钟|秒)/g, conf: 0.88 },
      // 时间点：3点, 14:30, 3:00pm
      { re: /\d{1,2}\s*[：:]\s*\d{2}\s*(?:am|pm|AM|PM)?/g, conf: 0.93 },
      { re: /\d{1,2}\s*点\s*(?:半|整|\d+\s*分)?/g, conf: 0.90 },
      // 泛时间词
      { re: /(未来|以后|接下来|下一步|过去|以前|之前|曾经|刚才|刚刚|现在|目前|当前|如今|暂时|一直|始终|总是|偶尔|有时|经常|每天|每年|每月|每周)/g, conf: 0.75 },
    ];

    for (const { re, conf } of patterns) {
      let m;
      while ((m = re.exec(input)) !== null) {
        // 去重：避免嵌套匹配
        if (!this._overlapsWithExisting(results, m.index, m[0].length)) {
          results.push({
            type: 'time',
            value: m[0],
            position: [m.index, m.index + m[0].length],
            confidence: conf,
          });
        }
      }
    }
    return results;
  }

  // ── 4. Product ──
  _extractProduct(input) {
    const results = [];
    // 已知产品名关键词（大小写不敏感，精确匹配边界）
    const productKeywords = [
      'ChatGPT', 'DeepSeek', 'Claude', 'Gemini', 'Copilot', 'GitHub Copilot',
      'iPhone', 'iPad', 'MacBook', 'iMac', 'Mac Pro', 'Apple Watch', 'AirPods',
      '微信', 'WeChat', '支付宝', 'Alipay', '抖音', 'TikTok', '微博', 'Weibo',
      '淘宝', '京东', '拼多多', '美团', '滴滴', '百度', 'Baidu', 'Google',
      'YouTube', 'Netflix', 'Spotify', 'Zoom', 'Slack', 'Notion', 'Figma',
      'VS Code', 'WebStorm', 'IntelliJ', 'PyCharm', 'Docker', 'Kubernetes',
      'Windows', 'macOS', 'Linux', 'Ubuntu', 'CentOS', 'Android', 'iOS',
      'Photoshop', 'Premiere', 'Excel', 'Word', 'PowerPoint', 'Outlook',
      '特斯拉', 'Tesla', 'Midjourney', 'Stable Diffusion', 'DALL·E', 'DALL-E',
      'Sora', 'Oculus', 'Quest', 'PlayStation', 'Xbox', 'Nintendo', 'Switch',
      '阿里云', 'AWS', 'Azure', '腾讯云', '华为云',
    ];

    for (const keyword of productKeywords) {
      this._findWord(input, keyword, (start, end) => {
        results.push({
          type: 'product',
          value: keyword,
          position: [start, end],
          confidence: 0.92,
        });
      });
    }

    // 引号包裹的产品名（"XXX"）
    const quotedRe = /["""]'?([A-Za-z][A-Za-z0-9\s.-]{1,30}?)[\s"'""]?["""]/g;
    let m;
    while ((m = quotedRe.exec(input)) !== null) {
      const val = m[1].trim();
      if (val.length >= 2 && !this._isKnownEntity(results, m.index, val.length)) {
        results.push({
          type: 'product',
          value: val,
          position: [m.index, m.index + m[0].length],
          confidence: 0.70,
        });
      }
    }

    return results;
  }

  // ── 5. Person ──
  _extractPerson(input) {
    const results = [];

    // 英文人名（2-3个词，首字母大写）
    const enRe = /\b([A-Z][a-z]{1,20})\s+([A-Z][a-z]{1,20})(?:\s+([A-Z][a-z]{1,20}))?\b/g;
    let m;
    while ((m = enRe.exec(input)) !== null) {
      const fullName = m[0];
      // 排除常见非人名的大写词
      if (/^(January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Hello|Hi|Hey|Thanks|Thank|Please|Sorry|Great|Good|Best|This|That|These|Those|What|When|Where|Why|How|Which|Who|Whom|Whose|The|A|An|In|On|At|To|For|Of|With|By|From|As|Is|Are|Was|Were|Be|Been|Has|Have|Had|Do|Does|Did|Will|Would|Can|Could|Shall|Should|May|Might|Must|Not|No|Yes|All|Each|Every|Some|Any|Many|Much|Few|Several|Both|Either|Neither|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)$/i.test(fullName)) continue;
      results.push({
        type: 'person',
        value: fullName,
        position: [m.index, m.index + fullName.length],
        confidence: 0.85,
      });
    }

    // 中文人名（2-4字中文，通过常见称呼线索触发）
    const cnRe = /(?:像|比如|例如|参考|问|找|叫|联系|认识|知道|听说|给|帮|请|让|和|与|跟|对|向|把|被|由|据|据我所知)\s*([\u4e00-\u9fa5]{2,4})/g;
    while ((m = cnRe.exec(input)) !== null) {
      const name = m[1];
      if (!this._isKnownEntity(results, m.index, name.length)) {
        results.push({
          type: 'person',
          value: name,
          position: [m.index + m[0].indexOf(name), m.index + m[0].indexOf(name) + name.length],
          confidence: 0.72,
        });
      }
    }

    // 姓+称谓：王老师, 李总, 张先生
    const titleRe = /([\u4e00-\u9fa5]{1,2})(老师|先生|女士|小姐|总|经理|主任|教授|博士|医生|局长|处长|科长|院长|校长|部长|主席|书记|工|哥|姐|同学|老板)/g;
    while ((m = titleRe.exec(input)) !== null) {
      const name = m[0];
      if (!this._isKnownEntity(results, m.index, name.length)) {
        results.push({
          type: 'person',
          value: name,
          position: [m.index, m.index + name.length],
          confidence: 0.88,
        });
      }
    }

    return results;
  }

  // ── 6. Technology ──
  _extractTechnology(input) {
    const results = [];

    const techKeywords = [
      'AI', '人工智能', 'LLM', '大模型', 'NLP', 'CV', 'ML', '机器学习',
      '深度学习', 'Deep Learning', 'RL', '强化学习', 'Transformer',
      'GPT', 'GAN', 'CNN', 'RNN', 'LSTM', 'BERT', 'T5',
      'blockchain', '区块链', 'NFT', 'Web3', 'DeFi', 'Smart Contract',
      'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Node.js', 'Deno',
      'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Rails',
      'TensorFlow', 'PyTorch', 'JAX', 'Keras', 'scikit-learn', 'XGBoost',
      'Docker', 'Kubernetes', 'k8s', 'Git', 'REST', 'GraphQL', 'gRPC',
      'API', 'SDK', 'Microservice', '微服务', 'Serverless', '无服务器',
      'Cloud Computing', '云计算', 'Edge Computing', '边缘计算',
      'IoT', '物联网', '5G', 'AR', 'VR', 'MR', 'XR', '元宇宙', 'Metaverse',
      'Big Data', '大数据', 'Data Mining', '数据挖掘', 'Database', '数据库',
      'SQL', 'NoSQL', 'Redis', 'MongoDB', 'PostgreSQL', 'MySQL',
      'GitHub', 'GitLab', 'CI/CD', 'DevOps', 'Agile', 'Scrum',
      'Blockchain', 'Distributed System', '分布式系统',
      'Cryptography', '密码学', 'Zero Knowledge', '零知识证明',
      'Computer Vision', '计算机视觉', 'Speech Recognition', '语音识别',
      'Recommendation System', '推荐系统', 'Search Engine', '搜索引擎',
      'Neural Network', '神经网络', 'Genetic Algorithm', '遗传算法',
      'Federated Learning', '联邦学习', 'Transfer Learning', '迁移学习',
      'Reinforcement Learning', 'AutoML', 'MLOps',
    ];

    for (const keyword of techKeywords) {
      this._findWord(input, keyword, (start, end) => {
        results.push({
          type: 'technology',
          value: keyword,
          position: [start, end],
          confidence: 0.93,
        });
      });
    }

    return results;
  }

  // ── 7. Language ──
  _extractLanguage(input) {
    const results = [];

    const langKeywords = [
      // 编程语言
      'Python', 'JavaScript', 'TypeScript', 'Java', 'C\\+\\+', 'C#', 'CSharp',
      'Ruby', 'Go', 'Golang', 'Rust', 'Swift', 'Kotlin', 'Scala',
      'PHP', 'Perl', 'Lua', 'R', 'MATLAB', 'Julia', 'Dart', 'Elixir',
      'Haskell', 'Clojure', 'Erlang', 'F#', 'FSharp', 'Shell', 'Bash',
      'Zsh', 'PowerShell', 'SQL', 'HTML', 'CSS', 'Sass', 'Less',
      'Assembly', 'COBOL', 'Fortran', 'Lisp', 'Scheme', 'Prolog',
      'Objective-C', 'Visual Basic', 'VB\\.NET', 'Delphi', 'Pascal',
      'Solidity', 'Vyper', 'Move',
      // 自然语言
      '中文', '英文', '英语', '日语', '日文', '韩语', '韩文', '法语', '法文',
      '德语', '德文', '西班牙语', '西班牙文', '葡萄牙语', '葡萄牙文',
      '俄语', '俄文', '阿拉伯语', '阿拉伯文', '意大利语', '意大利文',
      'Chinese', 'English', 'Japanese', 'Korean', 'French', 'German',
      'Spanish', 'Portuguese', 'Russian', 'Arabic', 'Italian',
    ];

    for (const keyword of langKeywords) {
      this._findWord(input, keyword, (start, end) => {
        const raw = keyword.includes('\\') ? input.slice(start, end) : keyword;
        results.push({
          type: 'language',
          value: raw,
          position: [start, end],
          confidence: 0.94,
        });
      });
    }

    return results;
  }

  // ── 8. Concept ──
  _extractConcept(input) {
    const results = [];

    const conceptKeywords = [
      '相对论', '进化论', '量子力学', '广义相对论', '狭义相对论',
      '熵增', '熵', '热力学', '万有引力', '电磁理论', '量子纠缠',
      '弦理论', '黑洞', '暗物质', '暗能量', '大爆炸', '宇宙膨胀',
      'DNA', '基因', '基因编辑', 'CRISPR', '进化', '自然选择',
      '资本主义', '社会主义', '共产主义', '民主主义', '自由主义',
      '市场经济', '计划经济', '全球化', '供应链', '通货膨胀',
      '通货紧缩', 'GDP', 'CPI', '复利', '边际效应',
      '心理学', '认知偏差', '行为经济学', '锚定效应', '沉没成本',
      '机会成本', '帕累托最优', '纳什均衡', '囚徒困境', '博弈论',
      '第一性原理', '思维模型', '系统思维', '批判性思维', '设计思维',
      '敏捷开发', '瀑布模型', 'TDD', 'BDD', 'DDD', 'SOLID', 'DRY',
      'KISS', 'YAGNI', 'MVC', 'MVP', 'MVVM', '微内核', '插件架构',
      '事件驱动', '响应式编程', '函数式编程', '面向对象', 'AOP',
      'IoC', 'DI', '依赖注入', '控制反转', 'RESTful', '幂等性',
      'CAP定理', 'BASE理论', 'ACID', '最终一致性', '分布式事务',
      '负载均衡', '限流', '熔断', '降级', '服务发现', '服务网格',
      'Sidecar', 'CQRS', '事件溯源', 'Saga', '两阶段提交',
      '信息论', '香农熵', 'KL散度', '交叉熵', '损失函数',
      '梯度下降', '反向传播', '正则化', 'Dropout', 'Batch Normalization',
      '注意力机制', '自注意力', '多头注意力', '位置编码', 'Embedding',
      '向量数据库', 'RAG', 'Prompt Engineering', 'Few-shot', 'Zero-shot',
      'Chain of Thought', '思维链', 'Agent', 'Multi-agent', 'Tool Use',
      'Fine-tuning', '微调', 'RLHF', 'DPO', 'PPO', 'LoRA', 'QLoRA',
      '量化', '蒸馏', 'Pruning', '剪枝', '知识蒸馏',
      '微分', '积分', '线性代数', '概率论', '统计学', '拓扑学',
      '数论', '集合论', '图论', '组合数学', '运筹学',
    ];

    for (const keyword of conceptKeywords) {
      this._findWord(input, keyword, (start, end) => {
        results.push({
          type: 'concept',
          value: keyword,
          position: [start, end],
          confidence: 0.90,
        });
      });
    }

    // 引号内的抽象概念（2-10字中文）
    const quotedRe = /["""]'?([\u4e00-\u9fa5]{2,10}?)['""]?["""]/g;
    let m;
    while ((m = quotedRe.exec(input)) !== null) {
      const val = m[1];
      if (!this._isKnownEntity(results, m.index, val.length)) {
        results.push({
          type: 'concept',
          value: val,
          position: [m.index, m.index + m[0].length],
          confidence: 0.65,
        });
      }
    }

    // "关于X" 结构中的 X
    const aboutRe = /关于\s*([\u4e00-\u9fa5a-zA-Z]{2,20})/g;
    while ((m = aboutRe.exec(input)) !== null) {
      const val = m[1];
      if (!this._isKnownEntity(results, m.index, val.length)) {
        results.push({
          type: 'concept',
          value: val,
          position: [m.index + m[0].indexOf(val), m.index + m[0].indexOf(val) + val.length],
          confidence: 0.70,
        });
      }
    }

    return results;
  }

  // ── 辅助方法 ──

  /**
   * 在输入中查找关键词（支持大小写不敏感、标点/空格感知）
   */
  _findWord(input, keyword, callback) {
    const flags = this._isMixedCase(keyword) ? '' : 'i';
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g' + flags);
    let m;
    while ((m = re.exec(input)) !== null) {
      const val = m[0];
      callback(m.index, m.index + val.length);
    }
  }

  _isMixedCase(str) {
    return /[a-z]/.test(str) && /[A-Z]/.test(str);
  }

  /**
   * 检查位置是否与已有实体重叠
   */
  _overlapsWithExisting(results, start, length) {
    const end = start + length;
    return results.some(e => {
      const [es, ee] = e.position;
      return start < ee && end > es;
    });
  }

  _isKnownEntity(results, start, length) {
    return this._overlapsWithExisting(results, start, length);
  }

  destroy() {}
  stop() {}
}

module.exports = { EntityExtractor };
