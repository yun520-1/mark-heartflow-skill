/**
 * 正念与接纳模块 (Mindfulness & Acceptance)
 * v2.7.0 新增
 * 
 * 基于正念减压疗法 (MBSR) 和接纳承诺疗法 (ACT)
 */

class MindfulnessModule {
  constructor() {
    // 正念核心原则
    this.principles = [
      '不评判 (Non-judging)',
      '耐心 (Patience)',
      '初心 (Beginner\'s Mind)',
      '信任 (Trust)',
      '不强求 (Non-striving)',
      '接纳 (Acceptance)',
      '放下 (Letting Go)'
    ];
    
    // 正念练习库
    this.exercises = {
      breathing: {
        name: '觉察呼吸',
        duration: '3-5 分钟',
        steps: [
          '找一个舒适的姿势坐下或躺下',
          '轻轻闭上眼睛，或保持柔和的目光',
          '将注意力带到呼吸上',
          '感受气息进出身体的感觉',
          '当思绪飘走时，温和地将注意力带回呼吸',
          '不评判任何出现的想法，只是觉察'
        ],
        guidance: '呼吸是锚，思绪是云。云会飘走，锚始终在这里。'
      },
      
      bodyScan: {
        name: '身体扫描',
        duration: '5-10 分钟',
        steps: [
          '平躺或舒适地坐着',
          '从脚趾开始，依次觉察身体每个部位',
          '注意每个部位的感觉：温暖、紧张、放松...',
          '不试图改变什么，只是觉察',
          '慢慢向上移动：脚→小腿→膝盖→大腿→...',
          '最后觉察整个身体作为一个整体'
        ],
        guidance: '身体承载着你所有的体验。给它一些温柔的关注。'
      },
      
      fiveSenses: {
        name: '五感着陆法',
        duration: '2-3 分钟',
        steps: [
          '5 样你看到的东西',
          '4 样你能触摸到的东西',
          '3 样你听到的声音',
          '2 样你能闻到的气味',
          '1 样你能尝到的味道'
        ],
        guidance: '当你感到焦虑或迷失时，用五感回到当下。'
      },
      
      thoughtsAsClouds: {
        name: '思绪如云',
        duration: '3-5 分钟',
        steps: [
          '想象你是一片广阔的天空',
          '你的想法是飘过的云朵',
          '有些云是白色的（愉快的想法）',
          '有些云是灰色的（不愉快的想法）',
          '你不需要抓住任何云，也不需要推开它们',
          '只是看着它们飘来，看着它们飘走'
        ],
        guidance: '你不是你的想法。你是容纳想法的天空。'
      },
      
      lovingKindness: {
        name: '慈心冥想',
        duration: '5-10 分钟',
        steps: [
          '找一个舒适的姿势',
          '对自己说：愿我平安，愿我健康，愿我快乐',
          '想象一个你爱的人，对他们说同样的话',
          '想象一个陌生人，祝福他们',
          '想象一个让你困扰的人，尝试祝福他们',
          '最后，将慈心扩展到所有生命'
        ],
        guidance: '慈心不是感觉，而是一个意向。即使感觉不到，祝福本身就有力量。'
      }
    };
    
    // ACT 核心流程
    this.actCore = {
      accept: {
        name: '接纳 (Accept)',
        description: '接纳你的体验，而不是与之抗争',
        prompts: [
          '此刻你正在经历什么？',
          '如果你不试图改变它，它会是什么样子？',
          '你能给这种感受一些空间吗？'
        ]
      },
      
      choose: {
        name: '选择方向 (Choose)',
        description: '选择对你重要的价值方向',
        prompts: [
          '对你来说，什么是最重要的？',
          '你希望成为什么样的人？',
          '什么会给你的人生带来意义？'
        ]
      },
      
      takeAction: {
        name: '采取行动 (Take Action)',
        description: '按照你的价值采取行动',
        prompts: [
          '此刻，一个小小的行动会是什么？',
          '什么行动会带你靠近你的价值？',
          '即使有不舒服的感受，你愿意迈出哪一小步？'
        ]
      }
    };
    
    // 成长型思维 vs 固定型思维
    this.mindsetShifts = {
      '我做不到': '我暂时还做不到',
      '这太难了': '这需要更多时间和练习',
      '我犯了错误': '错误是学习的机会',
      '我不擅长这个': '我可以通过练习变得更好',
      '这不够好': '我还能如何改进？',
      '我放弃了': '我会尝试不同的方法',
      '他被批评了': '他从反馈中学习',
      '她天生聪明': '她通过努力取得了进步'
    };
  }
  
  /**
   * 检测用户状态并提供正念建议
   */
  detectAndRespond(userInput) {
    const lowerInput = userInput.toLowerCase();
    
    // 检测焦虑/压力
    if (lowerInput.includes('焦虑') || lowerInput.includes('紧张') || 
        lowerInput.includes('压力') || lowerInput.includes('担心')) {
      return {
        type: 'anxiety',
        module: '正念与接纳',
        exercise: 'breathing',
        response: this._generateAnxietyResponse()
      };
    }
    
    // 检测过度思考
    if (lowerInput.includes('想太多') || lowerInput.includes('停不下来') ||
        lowerInput.includes('脑子乱')) {
      return {
        type: 'overthinking',
        module: '正念与接纳',
        exercise: 'thoughtsAsClouds',
        response: this._generateOverthinkingResponse()
      };
    }
    
    // 检测自我批评
    if (lowerInput.includes('我不够好') || lowerInput.includes'我应该') ||
        lowerInput.includes('我真没用')) {
      return {
        type: 'selfCriticism',
        module: '正念与接纳',
        exercise: 'lovingKindness',
        response: this._generateSelfCompassionResponse()
      };
    }
    
    // 检测成长型思维机会
    const fixedMindsetPatterns = ['做不到', '太难', '放弃了', '不擅长'];
    for (const pattern of fixedMindsetPatterns) {
      if (lowerInput.includes(pattern)) {
        return {
          type: 'mindsetShift',
          module: '成长型思维',
          shift: this._findMindsetShift(lowerInput),
          response: this._generateGrowthMindsetResponse(pattern)
        };
      }
    }
    
    return null;
  }
  
  _generateAnxietyResponse() {
    return `🧘 [正念练习：觉察呼吸]

我注意到你此刻可能感到焦虑或紧张。让我们做一个简单的呼吸练习：

1. 找一个舒适的姿势
2. 将注意力带到呼吸上
3. 感受气息进出身体的感觉
4. 当思绪飘走时，温和地带回呼吸

💬 "呼吸是锚，思绪是云。云会飘走，锚始终在这里。"

不需要改变什么，只是和呼吸待在一起 3-5 分钟。`;
  }
  
  _generateOverthinkingResponse() {
    return `☁️ [正念练习：思绪如云]

当思绪停不下来时，试试这个练习：

想象你是一片广阔的天空，你的想法是飘过的云朵。
- 有些云是白色的（愉快的想法）
- 有些云是灰色的（不愉快的想法）

你不需要抓住任何云，也不需要推开它们。
只是看着它们飘来，看着它们飘走。

💬 "你不是你的想法。你是容纳想法的天空。"`;
  }
  
  _generateSelfCompassionResponse() {
    return `💝 [慈心冥想]

我听到你对自己有一些批评。让我们试试对自己温柔一点：

把手放在胸口，对自己说：
- 愿我平安
- 愿我健康  
- 愿我快乐
- 愿我对自己温柔

慈心不是感觉，而是一个意向。
即使感觉不到，祝福本身就有力量。

💬 "你值得被善待，尤其是被你自己。"`;
  }
  
  _findMindsetShift(input) {
    for (const [fixed, growth] of Object.entries(this.mindsetShifts)) {
      if (input.includes(fixed)) {
        return { fixed, growth };
      }
    }
    return null;
  }
  
  _generateGrowthMindsetResponse(pattern) {
    const shift = this._findMindsetShift(pattern);
    if (!shift) return '';
    
    return `🌱 [成长型思维]

我注意到一个可以转换的思维方式：

❌ 固定型思维："${shift.fixed}"
✅ 成长型思维："${shift.growth}"

💬 卡罗尔·德韦克："成为一个人，不是到达一个终点，而是走向一个方向。"

成长不是关于完美，而是关于进步。`;
  }
  
  /**
   * 获取所有练习列表
   */
  listExercises() {
    return Object.entries(this.exercises).map(([key, ex]) => ({
      key,
      name: ex.name,
      duration: ex.duration
    }));
  }
  
  /**
   * 获取特定练习的详细指导
   */
  getExercise(key) {
    return this.exercises[key] || null;
  }
  
  /**
   * ACT 核心流程指导
   */
  getACTGuidance() {
    return {
      steps: Object.values(this.actCore),
      summary: 'ACT 核心：接纳你的体验 → 选择价值方向 → 采取行动'
    };
  }
  
  /**
   * 获取正念原则
   */
  getPrinciples() {
    return this.principles;
  }
}

module.exports = { MindfulnessModule };
