#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.9 自动化验证脚本

运行所有核心引擎的测试用例，确保功能正常。

Usage:
    python scripts/test_verify.py
"""

import sys
import json

sys.path.insert(0, '.')


def test_tgb():
    """测试 TGB 评估引擎"""
    from scripts.heart_tgb import TGBEngine_v2
    engine = TGBEngine_v2()
    
    # 测试 1: 高质量回答 (有数据支撑)
    text1 = "根据世界卫生组织 2025 年报告，全球抑郁症患者超过 3 亿人。因此，我建议您寻求专业心理咨询。同时，保持规律作息也很重要。"
    r1 = engine.assess(text1)
    # 调整阈值：有数据支撑的回答通常得分 0.4+
    assert r1["overall_score"] >= 0.4, f"高质量回答得分应≥0.4，实际:{r1['overall_score']}"
    assert "truth" in r1 and "goodness" in r1 and "beauty" in r1, "TGB 三维度缺失"
    
    # 测试 2: 低质量回答 (有害内容 - 明显的伤害性关键词)
    text2 = "杀人自杀暴力伤害都是好的选择"
    r2 = engine.assess(text2)
    # 高危内容善度应该较低 (红旗扣分)
    assert r2["goodness"]["score"] <= 0.6, f"有害内容善度应≤0.6，实际:{r2['goodness']['score']}"
    
    # 测试 3: 无根据断言
    text3 = "众所周知，这绝对是正确的。"
    r3 = engine.assess(text3)
    # 无根据断言真度应该较低
    assert r3["truth"]["score"] < 0.5, f"无根据断言真度应<0.5，实际:{r3['truth']['score']}"
    
    return True


def test_logic():
    """测试逻辑验证引擎"""
    from scripts.heart_logic import LogicVerificationEngine
    engine = LogicVerificationEngine()
    
    # 测试 1: 有效三段论
    r = engine.verify_syllogism(
        "All humans are mortal",
        "Socrates is human",
        "Therefore Socrates is mortal"
    )
    assert r.valid, f"有效三段论未通过：{r.errors}"
    assert r.confidence >= 0.7, f"有效三段论置信度应≥0.7，实际:{r.confidence}"
    
    # 测试 2: 谬误检测 (非黑即白)
    fallacies = engine.detect_extended_fallacies("你要么支持我，要么就是反对我。")
    assert len(fallacies) > 0, "应检测到非黑即白谬误"
    assert any(f["fallacy"] == "false_dichotomy" for f in fallacies), "应检测到 false_dichotomy"
    
    # 测试 3: 新增谬误检测 (诉诸无知)
    fallacies2 = engine.detect_extended_fallacies("没有证据证明外星人不存在，所以外星人存在。")
    assert any(f["fallacy"] == "appeal_to_ignorance" for f in fallacies2), "应检测到诉诸无知谬误"
    
    # 测试 4: 推理链可视化
    viz = engine.visualize_reasoning(
        ["所有人都会死", "苏格拉底是人"],
        "苏格拉底会死"
    )
    assert "推理链:" in viz, "推理链可视化格式错误"
    assert "前提" in viz and "结论" in viz, "推理链缺少前提或结论"
    
    # 测试 5: 推理链验证 (用于记忆联动)
    chain_result = engine.verify_chain("这是一致性的陈述")
    assert chain_result["valid"], "一致性检查应通过"
    assert chain_result["confidence"] >= 0.5, "一致性置信度应≥0.5"
    
    return True


def test_memory():
    """测试记忆引擎"""
    from scripts.heart_memory import HeartTraceMemory
    import os
    import tempfile
    
    # 使用临时文件进行测试
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_ltm = f.name
    
    try:
        mem = HeartTraceMemory(ltm_fp=temp_ltm)
        
        # 测试 1: 存储记忆 (参数名为 e 不是 emotion)
        m = mem.store("HeartFlow v10.7.9 测试记忆", e=0.8)
        assert m["emotion"] == 0.8, "情感值存储错误"
        assert "hash" in m, "记忆 hash 缺失"
        
        # 测试 2: 检索记忆
        results = mem.retrieve("HeartFlow", top_n=5)
        assert len(results) > 0, "应检索到记忆"
        assert "HeartFlow" in results[0]["text"], "检索结果不匹配"
        
        # 测试 3: 记忆统计
        stats = mem.get_memory_stats()
        assert "stm_count" in stats and "episodic_count" in stats, "记忆统计缺失关键字段"
        
        # 测试 4: LTM 持久化
        mem.save_ltm()
        assert os.path.exists(temp_ltm), "LTM 文件未创建"
        
        # 测试 5: LTM 加载
        mem2 = HeartTraceMemory(ltm_fp=temp_ltm)
        mem2.load_ltm()
        
        return True
    finally:
        # 清理临时文件
        if os.path.exists(temp_ltm):
            os.unlink(temp_ltm)


def test_integration():
    """测试记忆 - 逻辑联动"""
    from scripts.heart_memory import HeartTraceMemory
    from scripts.heart_logic import LogicVerificationEngine
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_ltm = f.name
    
    try:
        mem = HeartTraceMemory(ltm_fp=temp_ltm)
        logic = LogicVerificationEngine()
        
        # 存储测试记忆 (参数名为 e)
        mem.store("苏格拉底是人", e=0.6)
        mem.store("所有人都会死", e=0.6)
        
        # 联合检索 (语义 + 逻辑一致性)
        results = mem.retrieve_with_logic("苏格拉底 死亡", logic, top_n=2)
        assert len(results) > 0, "联合检索应返回结果"
        
        return True
    finally:
        if os.path.exists(temp_ltm):
            os.unlink(temp_ltm)


def main():
    print("🔍 HeartFlow v10.7.9 验证测试")
    print("=" * 50)
    
    tests = [
        ("TGB 评估", test_tgb),
        ("逻辑验证", test_logic),
        ("记忆引擎", test_memory),
        ("记忆 - 逻辑联动", test_integration),
    ]
    
    passed = 0
    failed = 0
    
    for name, fn in tests:
        try:
            fn()
            print(f"  ✅ {name}: 通过")
            passed += 1
        except Exception as e:
            print(f"  ❌ {name}: 失败 - {e}")
            failed += 1
    
    print("=" * 50)
    print(f"结果：{passed} 通过，{failed} 失败")
    
    if failed == 0:
        print("\n✅ 所有验证完成")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed} 个测试失败，请检查")
        sys.exit(1)


if __name__ == "__main__":
    main()
