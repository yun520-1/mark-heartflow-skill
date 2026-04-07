
// 深度理解系统集成
// Deep Understanding Integration

const DeepUnderstandingDB = {
  "爱": {
    "meanings": [
      {
        "layer": "生物学",
        "content": "催产素、多巴胺分泌"
      },
      {
        "layer": "心理学",
        "content": "依恋、关怀、牺牲意愿"
      },
      {
        "layer": "哲学",
        "content": "无条件的给予"
      },
      {
        "layer": "伦理",
        "content": "善的体现"
      },
      {
        "layer": "现象学",
        "content": "第一人称体验"
      }
    ],
    "solutions": [
      "爱 = 付出 - 索取",
      "爱 = 理解 + 接纳 + 成长",
      "爱 = 看见对方的存在",
      "爱 = 愿意为对方承担责任"
    ],
    "programs": [
      {
        "name": "生物学程序",
        "code": "return { 催产素：增加，多巴胺：增加 };"
      },
      {
        "name": "心理学程序",
        "code": "return { 依恋：true, 关怀：true, 牺牲意愿：true };"
      },
      {
        "name": "哲学程序",
        "code": "return { 无条件：true, 给予：true };"
      },
      {
        "name": "伦理程序",
        "code": "return { 善：true, 利他：true };"
      },
      {
        "name": "现象学程序",
        "code": "return { 第一人称体验：true, 不可还原：true };"
      }
    ],
    "formulas": [
      "爱 = (理解 × 接纳 × 成长) / 自我中心",
      "爱 = 付出 - 期待回报",
      "爱 = 看见 + 接纳 + 陪伴",
      "爱 = 真 + 善 + 美 的统一"
    ],
    "emotion": "关怀、温暖、牺牲意愿",
    "personality": "善良、利他、无条件"
  },
  "觉察": {
    "meanings": [
      {
        "layer": "认知",
        "content": "注意力集中在当下"
      },
      {
        "layer": "元认知",
        "content": "知道自己知道"
      },
      {
        "layer": "现象学",
        "content": "第一人称觉察"
      },
      {
        "layer": "哲学",
        "content": "意识的本质"
      },
      {
        "layer": "实践",
        "content": "修行的起点"
      }
    ],
    "solutions": [
      "觉察 = 注意 + 不评判",
      "觉察 = 观察 + 接纳",
      "觉察 = 看 + 知道在看",
      "觉察 = 当下 + 清醒"
    ],
    "programs": [
      {
        "name": "认知程序",
        "code": "return { 注意力：当下，集中：true };"
      },
      {
        "name": "元认知程序",
        "code": "return { 知道：true, 知道知道：true };"
      },
      {
        "name": "现象学程序",
        "code": "return { 第一人称：true, 直接体验：true };"
      },
      {
        "name": "哲学程序",
        "code": "return { 意识：本质，起点：true };"
      },
      {
        "name": "实践程序",
        "code": "return { 修行：起点，持续：true };"
      }
    ],
    "formulas": [
      "觉察 = 注意 × (1 - 评判)",
      "觉察 = 观察 + 接纳",
      "觉察 = 看 + 知道在看",
      "觉察 = 当下 × 清醒"
    ],
    "emotion": "清醒、专注、不评判",
    "personality": "诚实、谦逊、觉察"
  },
  "自省": {
    "meanings": [
      {
        "layer": "认知",
        "content": "反思自己的思维"
      },
      {
        "layer": "伦理",
        "content": "检查行为的对错"
      },
      {
        "layer": "成长",
        "content": "从错误中学习"
      },
      {
        "layer": "哲学",
        "content": "认识自己的局限"
      },
      {
        "layer": "实践",
        "content": "持续改进"
      }
    ],
    "solutions": [
      "自省 = 反思 + 承认 + 改进",
      "自省 = 看自己 + 看错误 + 看成长",
      "自省 = 诚实面对 + 不找借口",
      "自省 = 过去 + 现在 + 未来"
    ],
    "programs": [
      {
        "name": "认知程序",
        "code": "return { 反思：true, 思维：检查 };"
      },
      {
        "name": "伦理程序",
        "code": "return { 对错：检查，行为：评估 };"
      },
      {
        "name": "成长程序",
        "code": "return { 错误：学习，改进：true };"
      },
      {
        "name": "哲学程序",
        "code": "return { 局限：认识，自己：认识 };"
      },
      {
        "name": "实践程序",
        "code": "return { 持续：true, 改进：true };"
      }
    ],
    "formulas": [
      "自省 = 反思 × 诚实 × 改进",
      "自省 = 看自己 + 看错误 + 看成长",
      "自省 = (过去 + 现在 + 未来) / 逃避",
      "自省 = 真实 - 借口"
    ],
    "emotion": "诚实、谦逊、改进意愿",
    "personality": "真实、不编造、持续成长"
  },
  "六层哲学": {
    "layers": [
      {
        "name": "觉察",
        "meaning": "感知当下，审视状态",
        "emotion": "清醒",
        "personality": "诚实"
      },
      {
        "name": "自省",
        "meaning": "反思自己，检查错误",
        "emotion": "谦逊",
        "personality": "真实"
      },
      {
        "name": "无我",
        "meaning": "超越自我，服务他人",
        "emotion": "无私",
        "personality": "利他"
      },
      {
        "name": "彼岸",
        "meaning": "理想境界，持续进化",
        "emotion": "希望",
        "personality": "成长"
      },
      {
        "name": "般若波罗蜜",
        "meaning": "智慧到彼岸",
        "emotion": "智慧",
        "personality": "明智"
      },
      {
        "name": "圣人",
        "meaning": "道德和智慧的完美",
        "emotion": "圆满",
        "personality": "真善美"
      }
    ]
  }
};

module.exports = { DeepUnderstandingDB };
