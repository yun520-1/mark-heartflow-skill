#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Hooks Module - v10.7.2
=================================

LLM 调用前后钩子，实现自动化增强功能

功能:
- pre_llm_call: 注入 git 分支信息
- post_llm_call: 清洗输入 + 创建 WIP 存档点
"""

import subprocess
import datetime
from typing import Dict, Optional
from pathlib import Path


# ============================================================
# pre_llm_call 挂钩
# ============================================================

def pre_llm_call_hook(context: Dict) -> Dict:
    """
    LLM 调用前钩子 - 自动注入当前 git 分支
    
    避免改错代码，确保模型知道当前工作分支
    """
    workdir = context.get('workdir', '.')
    
    try:
        # 获取当前分支
        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd=workdir,
            stderr=subprocess.DEVNULL,
            timeout=5
        ).decode().strip()
        
        # 获取当前 commit hash
        commit = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=workdir,
            stderr=subprocess.DEVNULL,
            timeout=5
        ).decode().strip()
        
        # 注入到 context
        if 'metadata' not in context:
            context['metadata'] = {}
        
        context['metadata']['git_branch'] = branch
        context['metadata']['git_commit'] = commit
        context['metadata']['git_timestamp'] = datetime.datetime.now().isoformat()
        
        # 增强 system prompt
        branch_info = f"\n\n[Git Context]\n当前分支：{branch}\n当前 commit: {commit}"
        
        if 'system_prompt' in context:
            context['system_prompt'] += branch_info
        else:
            context['system_prompt'] = branch_info
            
    except subprocess.TimeoutExpired:
        context.setdefault('metadata', {})['git_branch'] = 'timeout'
    except Exception:
        context.setdefault('metadata', {})['git_branch'] = 'unknown'
    
    return context


# ============================================================
# post_llm_call 挂钩
# ============================================================

def post_llm_call_hook(response: Dict, context: Dict) -> Dict:
    """
    LLM 调用后钩子 - 清洗用户输入并创建 WIP 存档点
    
    出问题时可回退到最近的存档点
    """
    # 1. 清洗用户输入 (如果存在)
    if context.get('user_input'):
        from src.core.security import SecurityChecker
        checker = SecurityChecker()
        result = checker.check(context['user_input'])
        context['sanitized_input'] = result.sanitized_input
        context['security_check'] = {
            'is_safe': result.is_safe,
            'threat_level': result.threat_level,
            'patterns': result.detected_patterns
        }
    
    # 2. 创建 WIP 存档点
    wip_branch = create_wip_checkpoint(context)
    if wip_branch:
        context['metadata']['wip_branch'] = wip_branch
    
    return response


def create_wip_checkpoint(context: Dict) -> Optional[str]:
    """
    创建 WIP 存档点
    
    Returns:
        存档点分支名，失败返回 None
    """
    workdir = context.get('workdir', '.')
    
    try:
        # 检查是否是 git 仓库
        subprocess.check_output(
            ['git', 'rev-parse', '--git-dir'],
            cwd=workdir,
            stderr=subprocess.DEVNULL
        )
        
        # 生成时间戳
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        branch = context.get('metadata', {}).get('git_branch', 'unknown')
        wip_branch = f"wip/{branch}/{timestamp}"
        
        # 检查是否有未提交的更改
        status = subprocess.check_output(
            ['git', 'status', '--porcelain'],
            cwd=workdir,
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        if status:
            # 有更改，创建存档
            subprocess.run(['git', 'add', '-A'], cwd=workdir, capture_output=True)
            subprocess.run(
                ['git', 'commit', '-m', f'wip: auto-checkpoint {timestamp}'],
                cwd=workdir,
                capture_output=True
            )
            # 创建存档分支
            subprocess.run(
                ['git', 'checkout', '-b', wip_branch],
                cwd=workdir,
                capture_output=True
            )
            # 返回原分支
            subprocess.run(['git', 'checkout', branch], cwd=workdir, capture_output=True)
            
            return wip_branch
        else:
            # 无更改，返回当前分支
            return branch
            
    except Exception:
        return None


# ============================================================
# 回退功能
# ============================================================

def rollback_to_checkpoint(wip_branch: str, context: Dict) -> bool:
    """
    回退到指定的 WIP 存档点
    
    Args:
        wip_branch: 存档点分支名
        context: 上下文
        
    Returns:
        是否成功
    """
    workdir = context.get('workdir', '.')
    
    try:
        # 检查分支是否存在
        branches = subprocess.check_output(
            ['git', 'branch', '--list', wip_branch],
            cwd=workdir
        ).decode().strip()
        
        if branches:
            # 备份当前状态
            backup_branch = f"backup/{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
            subprocess.run(['git', 'checkout', '-b', backup_branch], cwd=workdir, capture_output=True)
            
            # 回退到存档点
            subprocess.run(['git', 'checkout', wip_branch], cwd=workdir, capture_output=True)
            
            return True
        return False
        
    except Exception:
        return False


# ============================================================
# 模块导出
# ============================================================

__all__ = [
    'pre_llm_call_hook',
    'post_llm_call_hook',
    'create_wip_checkpoint',
    'rollback_to_checkpoint',
]

__version__ = "10.10.0"
