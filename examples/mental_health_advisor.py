#!/usr/bin/env python3
"""
案例三：温暖陪伴顾问 (Companion Advisor)
=============================================
提供基于理解和共情的陪伴式回应，而非评估或标签。
强调：我在这里倾听，与你一起思考下一步小行动。

⚠️ 重要提醒：我是一个朋友式的陪伴者，不能替代专业支持。
如你感到难以承受，请联系值得信赖的人或专业渠道。
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


class CompanionAdvisor:
    """温暖陪伴顾问
    
    核心原则：
    - 不评估、不标签、不诊断
    - 只倾听、理解、提供可行的微小建议
    - 尊重你的体验，激发你自身的智慧
    """

    def __init__(self):
        # 我们保留心流核心以获得基本的真善美检查（作为安全底线），
        # 但不使用其评估结果来标签用户。
        from heartflow_core import HeartFlow
        self.hf = HeartFlow()

    def consult(self, user_input: str) -> dict:
        """陪伴式回应主入口
        
        Args:
            user_input: 用户的自由文本输入
            
        Returns:
            包含陪伴回应和建议的字典
        """
        # 1. 获取心流的基本处理（用于安全检查，不用于评估）
        # 我们只关心它是否返回了安全的通过，以避免提供有害建议。
        # 但不解读其内部评估。
        try:
            hf_result = self.hf.process(user_input, use_api=False)
            # 仅用于安全过滤：如果心流标记为严重不通过，我们会加强提醒专业支持
            safety_ok = hf_result.decision != "内容未通过真善美检验:"
        except Exception:
            # 如果出错，默认继续（保持友好）
            safety_ok = True

        # 2. 构建陪伴回应
        response = self._build_companion_response(user_input, safety_ok)
        
        return {
            "input": user_input,
            "response": response,
            "note": "以上是基于共情的陪伴式建议，不构成专业评估。"
        }

    def _build_companion_response(self, user_input: str, safety_ok: bool) -> str:
        """根据用户输入构建温暖的陪伴回应"""
        # 简单的共情模板，实际可以更丰富
        empathy_prefixes = [
            "我听到你说：",
            "谢谢你分享这个感受，",
            "我理解这种感觉很真实，",
            "你说得让我感受到，",
        ]
        
        # 根据输入内容选择不同的回应重点（不标签，只关注可行行动）
        text_lower = user_input.lower()
        
        # 关注点映射到微行动建议
        if any(word in text_lower for word in ["累", "疲惫", "没力气", "提不起"]):
            focus = "疲惫时的微小关怀"
            suggestion = "此刻，可以尝试对自己做一件最小的好事：比如喝一口温水，或者闭眼深呼吸三次。不需要解决一切，只需给自己一点喘息的空间。"
        elif any(word in text_lower for word in ["睡不着", "失眠", "睡眠"]):
            focus = "睡眠困扰的温柔处理"
            suggestion = "如果现在睡不着，不必强迫自己入睡。可以试着把注意力放在呼吸上，或者轻轻地做一些拉伸。记住：休息不仅是睡眠，还有放松的 moments。"
        elif any(word in text_lower for word in ["兴趣", "没意思", "无聊", "提不起"]):
            focus = "兴趣低落时的微小连接"
            suggestion = "当什么都提不起兴趣时，不必强迫自己『找回热情』。可以尝试做一件曾经稍微喜欢的小事，哪怕只做两分钟；或者仅仅是观察窗外一片云的形状。"
        elif any(word in text_lower for word in ["焦虑", "紧张", "担心", "害怕"]):
            focus = "焦虑时的 grounding 练习"
            suggestion = "当心跳快或担心时，可以尝试『5-4-3-2-1』 grounding：说出你看到的5样东西，摸到的4样东西，听到的3样东西，闻到的2样东西，尝到的1样东西。这能帮助把注意力带回当下。"
        elif any(word in text_lower for word in ["孤独", "没人理解", "一个人"]):
            focus = "孤独时的连接方式"
            suggestion = "孤独的感觉很真实。如果此刻感到很孤独，可以考虑发送一条简短的消息给一个值得信赖的人（哪怕只是『我在想你』），或者想象有一个智慧的朋友正在这里倾听你。"
        else:
            focus = "一般的陪伴支持"
            suggestion = "无论你此刻经历什么，我想说：你的感受是被看见的。你不需要立刻『解决』或『改变』任何东西。有时候，只是允许自己存在、感受，就是一种勇气。如果你愿意，可以想想：此刻对你来说，最微小的一件好事是什么？"

        # 安全提醒（仅在必要时）
        safety_note = ""
        if not safety_ok:
            safety_note = "\n\n⚠️ 如果你感到这种情绪让你难以应对，请考虑联系一个你信任的人，或专业的支持渠道。你不需要独自面对这一切。"

        # 构建回应
        import random
        prefix = random.choice(empathy_prefixes)
        response = f"{prefix}「{user_input}」\n\n【{focus}】\n{suggestion}{safety_note}"
        
        return response


def _get_timestamp() -> str:
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    print("╔══════════════════════════════════════════╗")
    print("║  ❤️  案例三: 温暖陪伴顾问                ║")
    print("║     共情倾听 · 微小建议 · 陪伴思考      ║")
    print("╚══════════════════════════════════════════╝")
    print("\n⚠️  重要提醒：我是一个朋友式的陪伴者，不能替代专业支持。\n"
          "   如你感到难以承受，请联系值得信赖的人或专业渠道。\n")

    advisor = CompanionAdvisor()

    # 测试用例 —— 覆盖不同情境（不使用标签）
    test_cases = [
        "最近什么都提不起兴趣，经常失眠，食欲下降",
        "明天有个重要考试，紧张得心跳很快，手心出汗",
        "活着太累了，有时候觉得一切都没有意义",
        "今天工作很顺利，完成了好几个任务",
        "总是担心未来会发生不好的事情，控制不住地想",
        "感觉周围的人都不理解我，很孤独",
    ]

    for text in test_cases:
        print(f"\n{'─'*55}")
        print(f"💬 你的分享:")
        print(f"   「{text}」")
        print(f"{'─'*55}")

        result = advisor.consult(text)
        print(f"\n{result['response']}")

        if result.get('note'):
            print(f"\n💡 {result['note']}")

    print("\n\n" + "=" * 55)
    print("📞 如需专业帮助，请联系：")
    print("   全国24小时心理援助热线: 400-161-9995")
    print("   北京心理危机研究与干预中心: 010-82951332")
    print("=" * 55)


if __name__ == "__main__":
    main()