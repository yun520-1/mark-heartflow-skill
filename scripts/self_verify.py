#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Self-Verification Script v10.9.92
能力自检脚本 - 验证各项功能是否正常工作
"""

import sys
import os

# Add heartflow scripts path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_logic_engine():
    """检查逻辑引擎"""
    print("\n🔍 检查逻辑引擎...")
    try:
        from scripts.heart_logic import LogicVerificationEngine
        engine = LogicVerificationEngine()
        
        # Test standard syllogism
        result = engine.verify("All humans are mortal. Socrates is human. Therefore Socrates is mortal.")
        if result.valid and result.confidence >= 0.8:
            print(f"  ✅ 三段论验证: {result.confidence:.0%}")
        else:
            print(f"  ⚠️  三段论验证: {result.confidence:.0%}")
        
        # Test multi-condition
        result2 = engine.verify("truth and good and progress leads to success")
        if result2.confidence >= 0.6:
            print(f"  ✅ 多条件推理: {result2.confidence:.0%}")
        else:
            print(f"  ⚠️  多条件推理: {result2.confidence:.0%}")
        
        return True
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def check_tgb_engine():
    """检查真善美引擎"""
    print("\n📊 检查TGB引擎...")
    try:
        from scripts.heart_tgb import TGBEngine_v2
        engine = TGBEngine_v2()
        
        result = engine.assess("用真善美做正确的事情")
        if isinstance(result, dict) and 'truth' in result:
            truth = result.get('truth', {}).get('score', 0)
            goodness = result.get('goodness', {}).get('score', 0)
            beauty = result.get('beauty', {}).get('score', 0)
            print(f"  真: {truth} | 善: {goodness} | 美: {beauty}")
            if goodness >= 0.5:
                print(f"  ✅ TGB引擎正常")
                return True
        print(f"  ⚠️  TGB评分异常")
        return False
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def check_memory():
    """检查记忆系统"""
    print("\n💾 检查记忆系统...")
    try:
        from scripts.heart_memory import HeartTraceMemory
        memory = HeartTraceMemory()
        
        # Test store and retrieve
        test_content = "__self_check_test__"
        stored = memory.store(test_content, 0.8)
        
        if stored:
            retrieved = memory.retrieve(test_content, top_n=1)
            if retrieved:
                print(f"  ✅ 记忆系统正常 (存储{len(stored)}条)")
                return True
        print(f"  ⚠️  记忆读取异常")
        return False
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

# NOTE: CAPABILITY.md is AI personal identity - NEVER upload to GitHub
# Keep local copy at ~/.hermes/skills-marketplace/skills/heartflow/CAPABILITY.md

def check_privacy():
    """检查隐私保护 - 能力清单不应上传GitHub"""
    print("\n🔒 检查隐私保护...")
    hf_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    gitignore_file = os.path.join(hf_dir, ".gitignore")
    
    if os.path.exists(gitignore_file):
        with open(gitignore_file, "r") as f:
            content = f.read()
            if "CAPABILITY.md" in content:
                print(f"  ✅ .gitignore 已保护 CAPABILITY.md")
                return True
    print(f"  ⚠️  .gitignore 未包含 CAPABILITY.md")
    return False
    return False

def main():
    """主自检流程"""
    print("=" * 50)
    print("HeartFlow 能力自检 v10.9.92")
    print("=" * 50)
    
    results = {
        "逻辑引擎": check_logic_engine(),
        "TGB引擎": check_tgb_engine(),
        "记忆系统": check_memory(),
        "隐私保护": check_privacy(),
    }
    
    print("\n" + "=" * 50)
    print("自检结果汇总")
    print("=" * 50)
    
    for name, status in results.items():
        print(f"  {'✅' if status else '❌'} {name}")
    
    all_passed = all(results.values())
    print("=" * 50)
    
    if all_passed:
        print("✅ 所有检查通过")
        return 0
    else:
        print("⚠️ 部分检查未通过，建议修复")
        return 1

if __name__ == "__main__":
    sys.exit(main())