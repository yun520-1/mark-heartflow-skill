/**
 * Buddhist Philosophy Computation - 佛教哲学计算模型
 * 
 * 基于中观派 (Madhyamaka) 与唯识学 (Yogacara) 的计算化
 * 
 * 核心概念:
 * - śūnyatā (空性): 所有现象皆无自性
 * - prātītyasamutpāda (缘起): 一切法因缘生
 * - anātman (无我): 无独立自存的自我
 * - cittamātra (唯识): 心识变现一切法
 * 
 * 参考:
 * - Nāgārjuna, Mūlamadhyamakakārikā (中论)
 * - Vasubandhi, Yogācārabhūmi-śāstra (唯识学)
 * - Garfield, J.L. (2015). Buddhist Ethics: A Philosophical Analysis
 * - Westerhoff, J. (2018). The Golden Age of Indian Buddhist Philosophy
 */

const BuddhistPhilosophyComputation = {
  version: '1.0.0',
  
  /**
   * 空性 (Śūnyatā) 计算
   * 所有现象无自性，依条件而存在
   * 
   * Formula: Ś = 1 - (S_i / ΣS_j)
   * 某法的空性 = 1 - (该法自性 / 所有法总和)
   * 
   * @param {number} selfNature - 自性程度 (0-1)
   * @returns {object} 空性计算结果
   */
  sunyata(selfNature) {
    // Śūnyatā = 无自性程度
    // 自性越低，空性越高
    const sunyata = 1 - selfNature;
    
    // 缘起力 = 相互依存强度
    const dependentOrigination = Math.sqrt(1 - Math.pow(selfNature, 2));
    
    // 条件性 = 依赖条件的程度
    const conditionality = selfNature * dependentOrigination;
    
    return {
      sunyata: sunyata,                    // 空性值 (0-1)
      dependentOrigination: dependentOrigination,  // 缘起力
      conditionality: conditionality,      // 条件性
      interpretation: sunyata > 0.7 
        ? '高度空性：此法无自性，依缘而起'
        : sunyata > 0.4 
        ? '中度空性：此法部分自性，部分缘起'
        : '低度空性：此法接近自性存在'
    };
  },
  
  /**
   * 缘起 (Prātītyasamutpāda) 计算
   * 十二因缘流转计算
   * 
   * @param {object} factors - 十二因缘状态
   * @returns {object} 缘起流转分析
   */
  dependentOrigination(factors = {}) {
    // 十二因缘顺序
    const links = [
      'ignorance',      // 无明
      'formation',     // 行
      'consciousness', // 识
      'nameAndForm',   // 名色
      'sixSenseBases', // 六入
      'contact',       // 触
      'feeling',       // 受
      'craving',       // 爱
      'attachment',    // 取
      'becoming',      // 有
      'birth',         // 生
      'oldAgeDeath'    // 老死
    ];
    
    // 默认状态
    const state = {};
    links.forEach((link, i) => {
      state[link] = factors[link] !== undefined ? factors[link] : 0.5;
    });
    
    // 计算流转强度 (每一环对下一环的影响)
    const flowStrength = [];
    for (let i = 0; i < links.length - 1; i++) {
      const current = state[links[i]];
      const next = state[links[i + 1]];
      // 缘起力 = 当前因 × 对下一因的传递率
      const transmission = current * 0.8;
      const generation = transmission * next;
      flowStrength.push({
        from: links[i],
        to: links[i + 1],
        strength: generation,
        interpretation: generation > 0.6 
          ? '强流转：此因有力推动下一因'
          : generation > 0.3 
          ? '中流转：此因对下一因有影响'
          : '弱流转：此因难以引发下一因'
      });
    }
    
    // 整体缘起力
    const totalFlow = flowStrength.reduce((sum, f) => sum + f.strength, 0) / flowStrength.length;
    
    return {
      links: state,
      flowStrength,
      totalFlow,
      interpretation: totalFlow > 0.5 
        ? '缘起旺盛：轮回流转强，易受苦'
        : totalFlow > 0.25 
        ? '缘起中等：有一定条件关系'
        : '缘起微弱：条件关系弱，易出离'
    };
  },
  
  /**
   * 无我 (Anātman) 计算
   * 自我非独立实体，是五蕴和合
   * 
   * Formula: A = 1 - (S_self / ΣS_components)
   * 
   * @param {object} aggregates - 五蕴状态 {form, feeling, perception, volition, consciousness}
   * @returns {object} 无我分析
   */
  anatman(aggregates = {}) {
    const defaultAggregates = {
      form: 0.5,        // 色蕴
      feeling: 0.5,     // 受蕴
      perception: 0.5,  // 想蕴
      volition: 0.5,    // 行蕴
      consciousness: 0.5 // 识蕴
    };
    
    const agg = { ...defaultAggregates, ...aggregates };
    const sum = Object.values(agg).reduce((a, b) => a + b, 0);
    
    // 误认为有"我"的强度 (把五蕴当作我)
    const misidentifiedSelf = Math.pow(
      agg.form * agg.feeling * agg.perception * agg.volition * agg.consciousness,
      1/5
    );
    
    // 无我认知程度
    const anatmanAwareness = 1 - misidentifiedSelf;
    
    return {
      aggregates: agg,
      sum,
      misidentifiedSelf,
      anatmanAwareness,
      interpretation: anatmanAwareness > 0.7
        ? '无我认知清晰：能观五蕴非我'
        : anatmanAwareness > 0.4
        ? '无我认知中等：部分理解无我'
        : '无我认知不足：仍执五蕴为我'
    };
  },
  
  /**
   * 唯识 (Cittamātra) 计算
   * 心识变现一切法，三界唯心
   * 
   * @param {object} consciousness - 识的状态
   * @returns {object} 唯识分析
   */
  cittamatra(consciousness = {}) {
    // 八识体系
    const eightConsciousnesses = {
      eye: consciousness.eye || 0.5,      // 眼识
      ear: consciousness.ear || 0.5,       // 耳识
      nose: consciousness.nose || 0.5,    // 鼻识
      tongue: consciousness.tongue || 0.5, // 舌识
      body: consciousness.body || 0.5,    // 身识
      mano: consciousness.mano || 0.5,   // 意识
      klistamanas: consciousness.klistamanas || 0.5, // 末那识 (我执识)
      alaya: consciousness.alaya || 0.5   // 阿赖耶识 (藏识)
    };
    
    // 第七识(末那识)的我执强度
    const selfClinging = eightConsciousnesses.klistamanas;
    
    // 阿赖耶识的藏种强度
    const storehouseConsciousness = eightConsciousnesses.alaya;
    
    // 心识变现指数 (主观建构现实的程度)
    const mentalFabrication = Math.sqrt(
      selfClinging * storehouseConsciousness * 
      Object.values(eightConsciousnesses).reduce((a, b) => a * b, 1)
    );
    
    // 唯心指数
    const cittamatraIndex = (1 - mentalFabrication) * storehouseConsciousness;
    
    return {
      eightConsciousnesses,
      selfClinging,
      storehouseConsciousness,
      mentalFabrication,
      cittamatraIndex,
      interpretation: cittamatraIndex > 0.6
        ? '心识变现强：主观建构主导，境由心生'
        : cittamatraIndex > 0.3
        ? '心识变现中等：部分由心识变现'
        : '心识变现弱：较接近外境独立存在'
    };
  },
  
  /**
   * 四圣谛计算
   * 苦、集、灭、道
   * 
   * @param {object} suffering - 苦的状态
   * @returns {object} 四圣谛分析
   */
  fourNobleTruths(suffering = {}) {
    const dukka = suffering.dukka || 0.5;          // 苦
    const origin = suffering.origin || 0.5;         // 集
    const cessation = suffering.cessation || 0.5;   // 灭
    const path = suffering.path || 0.5;             // 道
    
    // 苦的强度
    const dukkaIntensity = dukka;
    
    // 集(苦因) = 贪嗔痴
    const originIntensity = origin;
    
    // 灭(解脱)可能性
    const liberationPotential = cessation * path;
    
    // 八正道指数
    const nobleEightfoldPath = path * (1 - dukka);
    
    return {
      dukka: dukkaIntensity,
      origin: originIntensity,
      cessation: cessation,
      path: nobleEightfoldPath,
      liberationPotential,
      interpretation: liberationPotential > 0.5
        ? '解脱条件充足：灭道有力，趋向涅槃'
        : liberationPotential > 0.25
        ? '解脱条件中等：需精进修道'
        : '解脱条件不足：苦集势力强'
    };
  },
  
  /**
   * 整合佛教哲学计算
   * @param {object} input - 综合输入
   * @returns {object} 完整佛教哲学分析
   */
  compute(input = {}) {
    const { selfNature = 0.3, aggregates = {}, consciousness = {}, suffering = {}, links = {} } = input;
    
    return {
      sunyata: this.sunyata(selfNature),
      dependentOrigination: this.dependentOrigination(links),
      anatman: this.anatman(aggregates),
      cittamatra: this.cittamatra(consciousness),
      fourNobleTruths: this.fourNobleTruths(suffering),
      timestamp: new Date().toISOString(),
      version: this.version
    };
  }
};

module.exports = BuddhistPhilosophyComputation;
