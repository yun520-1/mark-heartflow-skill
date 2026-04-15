#!/usr/bin/env python3
"""
HeartFlow 通用安装脚本
=======================
适用于任何支持 Skill/Plugin 的 AI 系统。

用法:
    python3 install_heartflow.py [--target TARGET]

参数:
    --target    目标 AI 系统: hermes, claude, opencode, custom
                默认: auto (自动检测)
"""

import os
import sys
import argparse
from pathlib import Path

# 支持的 AI 系统配置
AI_SYSTEMS = {
    "hermes": {
        "skill_dir": Path.home() / ".hermes/skills",
        "config_file": Path.home() / ".hermes/config.yaml",
        "external_dirs_key": "skills.external_dirs",
    },
    "claude": {
        "skill_dir": Path.home() / ".claude/skills",
        "config_file": Path.home() / ".claude/settings.json",
    },
    "opencode": {
        "skill_dir": Path.home() / ".opencode/skills",
        "config_file": Path.home() / ".opencode/config.json",
    },
}

def detect_ai_system() -> str:
    """自动检测 AI 系统"""
    # 检查 Hermes
    if (Path.home() / ".hermes").exists():
        return "hermes"
    # 检查 Claude Code
    if (Path.home() / ".claude").exists():
        return "claude"
    # 检查 OpenCode
    if (Path.home() / ".opencode").exists():
        return "opencode"
    return "unknown"

def install_for_hermes(skill_path: Path) -> bool:
    """为 Hermes 系统安装"""
    config_path = AI_SYSTEMS["hermes"]["config_file"]
    skills_dir = AI_SYSTEMS["hermes"]["skill_dir"]
    
    # 创建符号链接或复制
    target_dir = skills_dir / "mark-heartflow"
    if not target_dir.exists():
        print(f"  📁 创建技能目录: {target_dir}")
        target_dir.mkdir(parents=True, exist_ok=True)
    
    # 复制文件
    import shutil
    for item in skill_path.iterdir():
        if item.name == ".git":
            continue
        dest = target_dir / item.name
        if item.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)
    
    # 更新 config.yaml
    if config_path.exists():
        content = config_path.read_text()
        if "mark-heartflow" not in content:
            # 添加 external_dirs
            lines = content.split("\n")
            new_lines = []
            for i, line in enumerate(lines):
                new_lines.append(line)
                if line.strip().startswith("skills:"):
                    # 检查是否已有 external_dirs
                    has_external = any("external_dirs" in l for l in lines[i:i+10])
                    if not has_external:
                        new_lines.append("  external_dirs:")
                        new_lines.append(f"    - {target_dir}")
            
            config_path.write_text("\n".join(new_lines))
            print(f"  ✅ 已更新 config.yaml")
    
    return True

def install_for_generic(skill_path: Path, target_dir: Path) -> bool:
    """通用安装 - 复制到目标目录"""
    target_dir.mkdir(parents=True, exist_ok=True)
    
    import shutil
    for item in skill_path.iterdir():
        if item.name == ".git":
            continue
        dest = target_dir / item.name
        if item.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)
    
    return True

def main():
    parser = argparse.ArgumentParser(description="HeartFlow 通用安装脚本")
    parser.add_argument("--target", choices=["auto", "hermes", "claude", "opencode", "custom"], 
                        default="auto", help="目标 AI 系统")
    parser.add_argument("--skill-dir", type=str, help="自定义技能目录（用于 custom）")
    args = parser.parse_args()
    
    print("🎯 HeartFlow 安装")
    print("=" * 40)
    
    # 获取脚本所在目录
    script_dir = Path(__file__).parent.parent.resolve()
    print(f"\n📂 技能目录: {script_dir}")
    
    # 检测 AI 系统
    if args.target == "auto":
        detected = detect_ai_system()
        print(f"🔍 检测到 AI 系统: {detected}")
        args.target = detected
    
    # 安装
    print(f"\n⚙️  安装到: {args.target}")
    
    if args.target == "hermes":
        success = install_for_hermes(script_dir)
    elif args.target == "custom":
        if not args.skill_dir:
            print("❌ 错误: custom 模式需要 --skill-dir 参数")
            sys.exit(1)
        success = install_for_generic(script_dir, Path(args.skill_dir))
    else:
        # 对于其他系统，使用通用方式
        system_config = AI_SYSTEMS.get(args.target)
        if system_config:
            target_dir = system_config["skill_dir"]
            success = install_for_generic(script_dir, target_dir / "heartflow")
        else:
            print(f"❌ 未知系统: {args.target}")
            sys.exit(1)
    
    if success:
        print("\n" + "=" * 40)
        print("✅ 安装完成!")
        print("\n🚀 启动你的 AI 系统，HeartFlow 将自动加载。")
    else:
        print("\n❌ 安装失败")
        sys.exit(1)

if __name__ == "__main__":
    main()