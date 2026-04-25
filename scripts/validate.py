#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Quick Validate Script v10.7.5

快速验证技能是否符合 Agent Skills 开放标准。
Quick validation for Agent Skills Open Standard compliance.

用法 | Usage:
    python scripts/validate.py --check .
    python scripts/validate.py --help
"""

import argparse
import os
import sys
from pathlib import Path


def check_file_exists(path: Path, required: bool = True) -> bool:
    """检查文件是否存在"""
    exists = path.exists()
    if required:
        status = "✅" if exists else "❌"
    else:
        status = "✅" if exists else "⚪"
    print(f"  {status} {path.name}")
    return exists


def check_directory_exists(path: Path) -> bool:
    """检查目录是否存在"""
    exists = path.exists() and path.is_dir()
    status = "✅" if exists else "❌"
    print(f"  {status} {path.name}/")
    return exists


def validate_skill(skill_path: str) -> int:
    """验证技能目录"""
    path = Path(skill_path)
    
    print("=" * 60)
    print("HeartFlow 技能验证报告 | Skill Validation Report")
    print("=" * 60)
    print(f"技能目录 | Skill Path: {path.absolute()}")
    print("-" * 60)
    
    score = 0
    total = 0
    
    # 必需文件 | Required Files
    print("\n必需文件 | Required Files:")
    required_files = ['SKILL.md', 'VERSION', 'README.md', 'CHANGELOG.md']
    for f in required_files:
        total += 1
        if check_file_exists(path / f, required=True):
            score += 1
    
    # 推荐文件 | Recommended Files
    print("\n推荐文件 | Recommended Files:")
    optional_files = ['LICENSE', '.gitignore']
    for f in optional_files:
        total += 1
        if check_file_exists(path / f, required=False):
            score += 1
    
    # 必需目录 | Required Directories
    print("\n必需目录 | Required Directories:")
    required_dirs = ['scripts', 'references']
    for d in required_dirs:
        total += 1
        if check_directory_exists(path / d):
            score += 1
    
    # 推荐目录 | Recommended Directories
    print("\n推荐目录 | Recommended Directories:")
    optional_dirs = ['checklist', 'templates']
    for d in optional_dirs:
        total += 1
        if check_directory_exists(path / d):
            score += 1
    
    # 检查 scripts 内容 | Check scripts content
    print("\n脚本文件 | Script Files:")
    scripts_dir = path / 'scripts'
    if scripts_dir.exists():
        scripts = list(scripts_dir.glob('*.py'))
        if scripts:
            for s in scripts:
                print(f"  ✅ {s.name}")
                total += 1
                score += 1
        else:
            print("  ⚠️  无 Python 脚本 | No Python scripts")
    
    # 检查 references 内容 | Check references content
    print("\n参考文档 | Reference Documents:")
    refs_dir = path / 'references'
    if refs_dir.exists():
        refs = list(refs_dir.glob('*.md'))
        if refs:
            for r in refs:
                print(f"  ✅ {r.name}")
                total += 1
                score += 1
        else:
            print("  ⚠️  无参考文档 | No reference documents")
    
    # 版本号检查 | Version Check
    print("\n版本号一致性 | Version Consistency:")
    versions = {}
    
    # SKILL.md
    skill_md = path / 'SKILL.md'
    if skill_md.exists():
        content = skill_md.read_text(encoding='utf-8')
        for line in content.split('\n'):
            if line.startswith('version:'):
                versions['SKILL.md'] = line.split(':')[1].strip()
                break
    
    # VERSION 文件
    version_file = path / 'VERSION'
    if version_file.exists():
        versions['VERSION'] = version_file.read_text(encoding='utf-8').strip()
    
    if versions:
        version_values = list(versions.values())
        if len(set(version_values)) == 1:
            print(f"  ✅ 版本号一致 | Consistent: {version_values[0]}")
            score += 1
        else:
            print(f"  ❌ 版本号不一致 | Inconsistent: {versions}")
        total += 1
    
    # 综合评分 | Overall Score
    print("\n" + "-" * 60)
    percentage = (score / total * 100) if total > 0 else 0
    
    if percentage >= 90:
        status = "✅ 优秀 | Excellent"
    elif percentage >= 70:
        status = "✅ 合格 | Pass"
    else:
        status = "⚠️  需改进 | Needs Improvement"
    
    print(f"综合评分 | Score: {score}/{total} ({percentage:.0f}%)")
    print(f"验证状态 | Status: {status}")
    print("=" * 60)
    
    return 0 if percentage >= 70 else 1


def main():
    parser = argparse.ArgumentParser(
        description='HeartFlow Quick Validate | 快速验证技能',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例 | Examples:
  python scripts/validate.py --check .
  python scripts/validate.py --check /path/to/heartflow
        """
    )
    parser.add_argument('--check', metavar='DIR', help='验证技能目录 | Validate skill directory')
    
    args = parser.parse_args()
    
    if args.check:
        sys.exit(validate_skill(args.check))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
