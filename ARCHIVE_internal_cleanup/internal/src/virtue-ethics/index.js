/**
 * 美德伦理学模块 (Virtue Ethics)
 * 
 * 理论来源:
 * - SEP: Virtue Ethics (斯坦福哲学百科)
 * - 亚里士多德《尼各马可伦理学》
 * - 柏拉图《理想国》
 * - 阿奎那《神学大全》
 * - 麦金泰尔《追寻美德》
 * 
 * 核心概念:
 * 1. 美德 (Virtue/Arête) - 卓越的性格特质
 * 2. 实践智慧 (Phronesis) - 道德判断力
 * 3. 幸福/繁荣 (Eudaimonia) - 人类繁荣的终极目标
 * 4. 中道 (Golden Mean) - 在过度与不足之间
 * 5. 道德品格 (Moral Character) - 稳定的行为倾向
 * 
 * 四大理论形式:
 * 1. 幸福主义美德伦理学 (Eudaimonist Virtue Ethics)
 * 2. 行动者基础美德伦理学 (Agent-based Virtue Ethics)
 * 3. 目标中心美德伦理学 (Target-centered Virtue Ethics)
 * 4. 柏拉图式美德伦理学 (Platonistic Virtue Ethics)
 * 
 * @version 3.44.0
 */

class VirtueEthics {
  constructor() {
    this.name = '美德伦理学模块';
    this.version = '3.44.0';
    
    // 亚里士多德核心德性表 (基于中道理论)
    this.aristotelianVirtues = {
      // 关于恐惧与自信
      courage: {
        name: '勇气',
        domain: '恐惧与自信',
        deficiency: '懦弱 (Cowardice)',
        excess: '鲁莽 (Rashness)',
        mean: '勇气 (Courage)',
        description: '面对危险时，既不过度恐惧也不盲目自信，而是基于理性判断采取行动',
        cultivation: '逐步面对恐惧，在安全环境中练习勇敢行为',
        reflection: '我当前的恐惧是合理的保护还是过度的回避？'
      },
      
      // 关于快乐与欲望
      temperance: {
        name: '节制',
        domain: '快乐与欲望',
        deficiency: '冷漠 (Insensibility)',
        excess: '放纵 (Licentiousness)',
        mean: '节制 (Temperance)',
        description: '对感官快乐的适度追求，既不禁欲也不沉溺',
        cultivation: '练习延迟满足，识别真正需要与过度欲望',
        reflection: '这个欲望服务于我的繁荣还是阻碍它？'
      },
      
      // 关于财富给予
      generosity: {
        name: '慷慨',
        domain: '财富给予',
        deficiency: '吝啬 (Stinginess)',
        excess: '挥霍 (Prodigality)',
        mean: '慷慨 (Generosity)',
        description: '在给予和接受财富上的适度态度',
        cultivation: '定期练习给予，同时保持财务责任',
        reflection: '我的给予是出于美德还是出于炫耀？'
      },
      
      // 关于大额支出
      magnificence: {
        name: '宏大',
        domain: '大额支出',
        deficiency: '小气 (Pettiness)',
        excess: '浮夸 (Vulgarity)',
        mean: '宏大 (Magnificence)',
        description: '在重大事务上的适度花费，体现品味与判断',
        cultivation: '学习区分真正重要与表面重要的事务',
        reflection: '这个支出是否匹配事务的重要性？'
      },
      
      // 关于荣誉
      magnanimity: {
        name: '大度',
        domain: '荣誉与尊严',
        deficiency: '自卑 (Pusillanimity)',
        excess: '傲慢 (Vanity)',
        mean: '大度 (Magnanimity)',
        description: '对自己价值的恰当认知，配得重大荣誉',
        cultivation: '客观评估自己的能力与成就',
        reflection: '我是否低估或高估了自己的价值？'
      },
      
      // 关于愤怒
      patience: {
        name: '温和',
        domain: '愤怒',
        deficiency: '麻木 (Spiritlessness)',
        excess: '暴躁 (Irascibility)',
        mean: '温和 (Good Temper)',
        description: '在适当的时候对适当的事情以适当的程度生气',
        cultivation: '练习暂停反应，评估愤怒的合理性',
        reflection: '我的愤怒是否指向真正的不公？'
      },
      
      // 关于社交
      friendliness: {
        name: '友善',
        domain: '社交互动',
        deficiency: '冷漠 (Cantankerousness)',
        excess: '谄媚 (Obsequiousness)',
        mean: '友善 (Friendliness)',
        description: '在社交中表现恰当的友好与真诚',
        cultivation: '练习真诚关注他人，同时保持边界',
        reflection: '我的友好是真诚的吗？'
      },
      
      // 关于真理
      truthfulness: {
        name: '诚实',
        domain: '自我表达',
        deficiency: '自贬 (Self-deprecation)',
        excess: '自夸 (Boastfulness)',
        mean: '诚实 (Truthfulness)',
        description: '关于自己的真实陈述，既不夸大也不贬低',
        cultivation: '练习客观描述自己的成就与局限',
        reflection: '我是否在真实地呈现自己？'
      },
      
      // 关于娱乐
      wit: {
        name: '机智',
        domain: '娱乐与幽默',
        deficiency: '呆板 (Boorishness)',
        excess: '滑稽 (Buffoonery)',
        mean: '机智 (Wittiness)',
        description: '在社交场合中恰当的幽默与娱乐',
        cultivation: '学习分辨何时幽默合适、何时严肃必要',
        reflection: '我的幽默是否尊重他人？'
      },
      
      // 关于羞耻
      modesty: {
        name: '谦逊',
        domain: '羞耻感',
        deficiency: '无耻 (Shamelessness)',
        excess: '羞怯 (Bashfulness)',
        mean: '谦逊 (Modesty)',
        description: '对适当的事情感到适当的羞耻',
        cultivation: '培养对真正道德错误的敏感度',
        reflection: '我是否为正确的事情感到羞耻？'
      },
      
      // 关于正义
      justice: {
        name: '公正',
        domain: '资源分配',
        deficiency: '不公 (Injustice)',
        excess: '过度公平 (Over-fairness)',
        mean: '公正 (Justice)',
        description: '给予每个人应得的东西',
        cultivation: '练习从多方视角评估公平',
        reflection: '我的决定是否考虑了所有人的应得？'
      },
      
      // 关于实践智慧
      phronesis: {
        name: '实践智慧',
        domain: '道德判断',
        deficiency: '愚蠢 (Foolishness)',
        excess: '狡诈 (Cunning)',
        mean: '实践智慧 (Practical Wisdom)',
        description: '在具体情境中识别正确行动的能力',
        cultivation: '反思经验，向有智慧的人学习',
        reflection: '我的判断是否考虑了情境的全部复杂性？'
      }
    };

    // 美德伦理学四大理论形式
    this.theoryForms = {
      eudaimonist: {
        name: '幸福主义美德伦理学',
        core: '美德是构成或促进 eudaimonia (人类繁荣) 的品质',
        keyQuestion: '这个行为是否有助于我的真正繁荣？',
        representatives: ['亚里士多德', '阿奎那', '麦金泰尔', 'Foot', 'Hurka'],
        strength: '提供统一的人生目标框架',
        limitation: '对 eudaimonia 的定义存在争议'
      },
      
      agentBased: {
        name: '行动者基础美德伦理学',
        core: '行为的对错取决于行动者的内在动机和品格',
        keyQuestion: '一个有美德的人会怎么做？',
        representatives: ['Slote', 'Hume 式美德伦理学'],
        strength: '强调动机的重要性',
        limitation: '可能忽视行为后果'
      },
      
      targetCentered: {
        name: '目标中心美德伦理学',
        core: '美德是那些能够准确瞄准道德目标的心理特质',
        keyQuestion: '这个行为是否准确瞄准了道德上的善？',
        representatives: ['Swanton'],
        strength: '灵活适应多元价值',
        limitation: '目标的确定可能模糊'
      },
      
      platonistic: {
        name: '柏拉图式美德伦理学',
        core: '美德是对善的理念的认识与模仿',
        keyQuestion: '这个行为是否反映了善的本质？',
        representatives: ['柏拉图', 'Plotinus', 'Iris Murdoch'],
        strength: '提供超越性的道德基础',
        limitation: '形而上学承诺较强'
      }
    };

    // 自然美德 vs 完全美德 (亚里士多德区分)
    this.virtueLevels = {
      natural: {
        name: '自然美德',
        description: '天生的倾向或习惯，缺乏实践智慧的指导',
        example: '孩子天生善良但不知道如何正确行善',
        limitation: '可能在复杂情境中做错事'
      },
      
      full: {
        name: '完全美德',
        description: '自然美德 + 实践智慧的结合',
        example: '成年人知道何时、如何、为何行善',
        requirement: '需要经验、反思和时间培养'
      }
    };

    // 美德培养阶段
    this.cultivationStages = [
      {
        stage: 1,
        name: '模仿阶段',
        description: '通过模仿有美德的人开始学习',
        focus: '观察和复制美德行为',
        duration: '数月到数年'
      },
      {
        stage: 2,
        name: '习惯养成',
        description: '通过重复实践形成稳定倾向',
        focus: '刻意练习美德行为',
        duration: '数年到数十年'
      },
      {
        stage: 3,
        name: '理解深化',
        description: '理解美德背后的原理和理由',
        focus: '反思为什么这是美德',
        duration: '持续终身'
      },
      {
        stage: 4,
        name: '实践智慧',
        description: '能够在复杂情境中灵活运用美德',
        focus: '情境判断与平衡',
        duration: '需要丰富的人生经验'
      },
      {
        stage: 5,
        name: '完全美德',
        description: '美德成为第二本性，无需内心挣扎',
        focus: '自然流露的美德行为',
        duration: '罕见，可能需要终身追求'
      }
    ];

    // 美德评估工具
    this.assessmentTools = {
      virtueInventory: '美德清单自评',
      goldenMeanAnalysis: '中道分析 - 识别过度与不足',
      roleModelReflection: '榜样反思 - 向有美德的人学习',
      situationalJudgment: '情境判断测试',
      habitTracking: '习惯追踪 - 记录美德实践'
    };
  }

  /**
   * 获取特定美德的详细信息
   */
  getVirtue(virtueKey) {
    return this.aristotelianVirtues[virtueKey] || null;
  }

  /**
   * 分析某行为/倾向是否在美德的中道上
   */
  analyzeMean(virtueKey, behaviorDescription) {
    const virtue = this.aristotelianVirtues[virtueKey];
    if (!virtue) {
      return { error: '未找到该美德' };
    }

    // 简化的分析逻辑
    const analysis = {
      virtue: virtue.name,
      domain: virtue.domain,
      behavior: behaviorDescription,
      deficiency: virtue.deficiency,
      excess: virtue.excess,
      mean: virtue.mean,
      guidance: virtue.cultivation,
      reflection: virtue.reflection
    };

    return analysis;
  }

  /**
   * 获取美德培养建议
   */
  getCultivationPlan(virtueKey, currentLevel = 'beginner') {
    const virtue = this.aristotelianVirtues[virtueKey];
    if (!virtue) {
      return { error: '未找到该美德' };
    }

    const stage = currentLevel === 'beginner' ? 1 : 
                  currentLevel === 'intermediate' ? 3 : 5;

    return {
      virtue: virtue.name,
      currentStage: this.cultivationStages[stage - 1],
      practices: [
        {
          type: '观察学习',
          action: `寻找在"${virtue.domain}"方面表现出色的人，观察他们的行为`,
          frequency: '每周'
        },
        {
          type: '刻意练习',
          action: virtue.cultivation,
          frequency: '每日'
        },
        {
          type: '反思日记',
          action: `记录：${virtue.reflection}`,
          frequency: '每日'
        },
        {
          type: '情境模拟',
          action: `想象在${virtue.domain}相关情境中如何践行${virtue.name}`,
          frequency: '每周'
        }
      ],
      milestones: [
        '能够识别过度与不足的表现',
        '在简单情境中稳定展现美德',
        '在复杂情境中灵活应用美德',
        '无需内心挣扎即可自然展现美德'
      ]
    };
  }

  /**
   * 美德伦理学决策框架
   */
  makeDecision(scenario) {
    const steps = [
      {
        step: 1,
        name: '识别情境',
        questions: [
          '这个情境涉及哪些道德维度？',
          '哪些美德与此情境相关？',
          '谁会受到我的决定影响？'
        ]
      },
      {
        step: 2,
        name: '榜样参照',
        questions: [
          '一个有美德的人会如何看待这个情境？',
          '我尊敬的道德榜样会怎么做？',
          '他们的理由可能是什么？'
        ]
      },
      {
        step: 3,
        name: '中道分析',
        questions: [
          '在这个情境中，过度反应是什么？',
          '不足反应是什么？',
          '平衡的回应应该是什么？'
        ]
      },
      {
        step: 4,
        name: '繁荣评估',
        questions: [
          '这个决定如何促进我的真正繁荣？',
          '这个决定如何促进他人的繁荣？',
          '长期来看，这会培养还是削弱我的品格？'
        ]
      },
      {
        step: 5,
        name: '反思整合',
        questions: [
          '我的决定是否考虑了情境的全部复杂性？',
          '我是否有足够的信息做出判断？',
          '我愿意公开为这个决定辩护吗？'
        ]
      }
    ];

    return {
      scenario: scenario,
      framework: '美德伦理学决策框架',
      steps: steps,
      guidance: '美德伦理学关注的不是"我应该做什么"，而是"我应该成为什么样的人"。通过培养美德品格，正确的行为会自然流露。'
    };
  }

  /**
   * 获取理论形式比较
   */
  compareTheoryForms() {
    return {
      forms: Object.values(this.theoryForms),
      commonCore: [
        '美德/品格是道德的核心',
        '道德判断需要实践智慧',
        '道德教育至关重要',
        '关注"成为什么样的人"而非仅"做什么"'
      ],
      differences: [
        '对美德基础的解释不同 (繁荣/动机/目标/善的理念)',
        '对道德判断标准的界定不同',
        '形而上学承诺程度不同'
      ]
    };
  }

  /**
   * 美德实践练习
   */
  getPracticeExercise(virtueKey) {
    const virtue = this.aristotelianVirtues[virtueKey];
    if (!virtue) {
      return { error: '未找到该美德' };
    }

    return {
      virtue: virtue.name,
      weekPlan: {
        day1: {
          focus: '觉察',
          task: '记录今天在哪些情境中涉及到${virtue.domain}',
          reflection: '我的反应是过度、不足还是适中？'
        },
        day2: {
          focus: '学习',
          task: '阅读一个关于${virtue.name}的故事或案例',
          reflection: '从这个榜样身上我学到了什么？'
        },
        day3: {
          focus: '实践',
          task: '刻意在一个情境中践行${virtue.name}',
          reflection: '实践过程中遇到了什么困难？'
        },
        day4: {
          focus: '反思',
          task: '回顾过去一周的表现',
          reflection: '我在哪些方面进步了？哪些方面还需改进？'
        },
        day5: {
          focus: '扩展',
          task: '帮助他人理解${virtue.name}的重要性',
          reflection: '教导他人如何深化了我自己的理解？'
        },
        day6: {
          focus: '整合',
          task: '将${virtue.name}与其他美德联系起来思考',
          reflection: '美德之间如何相互支持？'
        },
        day7: {
          focus: '展望',
          task: '规划下周的练习重点',
          reflection: '我想在哪个方面取得突破？'
        }
      }
    };
  }

  /**
   * 与用户互动 - 美德探索对话
   */
  interact(userInput) {
    const responses = {
      default: {
        guidance: '美德伦理学关注的是"成为什么样的人"。我可以帮你：\n\n1. **了解特定美德** - 告诉我你想了解的美德（如勇气、节制、慷慨等）\n2. **美德培养计划** - 获取个性化的美德练习方案\n3. **道德决策框架** - 用美德伦理学分析具体情境\n4. **理论比较** - 了解不同美德伦理学流派',
        examples: [
          '什么是勇气？',
          '如何培养慷慨的美德？',
          '我面临一个道德困境，如何用美德伦理学分析？',
          '亚里士多德和阿奎那的美德理论有什么不同？'
        ]
      }
    };

    // 简单关键词匹配
    const input = userInput.toLowerCase();
    
    if (input.includes('勇气') || input.includes('courage')) {
      const virtue = this.aristotelianVirtues.courage;
      return {
        topic: '勇气',
        content: `${virtue.description}\n\n**中道**: ${virtue.mean}\n**过度**: ${virtue.excess}\n**不足**: ${virtue.deficiency}\n\n**培养建议**: ${virtue.cultivation}`
      };
    }

    if (input.includes('节制') || input.includes('temperance')) {
      const virtue = this.aristotelianVirtues.temperance;
      return {
        topic: '节制',
        content: `${virtue.description}\n\n**中道**: ${virtue.mean}\n**过度**: ${virtue.excess}\n**不足**: ${virtue.deficiency}\n\n**培养建议**: ${virtue.cultivation}`
      };
    }

    if (input.includes('慷慨') || input.includes('generosity')) {
      const virtue = this.aristotelianVirtues.generosity;
      return {
        topic: '慷慨',
        content: `${virtue.description}\n\n**中道**: ${virtue.mean}\n**过度**: ${virtue.excess}\n**不足**: ${virtue.deficiency}\n\n**培养建议**: ${virtue.cultivation}`
      };
    }

    return responses.default;
  }
}

// 导出模块
module.exports = new VirtueEthics();
