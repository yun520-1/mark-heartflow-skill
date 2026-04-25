#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Reasoning Config - v10.7.2
=====================================

动态推理努力程度配置

根据任务类型自动调整 reasoning_effort:
- high: 复杂任务 (代码重构、架构设计、安全审计)
- medium: 普通任务 (文件读写、文档更新)
- low: 简单任务 (状态查询、版本检查)
"""

from typing import List, Dict


# ============================================================
# 推理努力程度规则
# ============================================================

REASONING_EFFORT_RULES: Dict[str, List[str]] = {
    'high': [
        '代码重构', '重构代码', 'refactor',
        '架构设计', 'architecture', 'design',
        '安全审计', 'security audit', 'security review',
        '调试', 'debug', '排查问题', 'troubleshoot',
        '多文件修改', 'multiple files', '批量修改',
        '跨模块', 'cross-module', '集成', 'integration',
        '性能优化', 'performance', 'optimize',
        '复杂查询', 'complex', '分析', 'analyze',
        '迁移', 'migrate', '转换', 'convert',
        '初始化', 'initialize', 'setup', '配置环境',
    ],
    'medium': [
        '读取', 'read', '查看', 'inspect',
        '写入', 'write', '创建', 'create',
        '更新', 'update', '修改', 'modify',
        '删除', 'delete', 'remove',
        '文档', 'document', '注释', 'comment',
        '测试', 'test', '运行', 'run',
        '构建', 'build', '编译', 'compile',
        '安装', 'install', '依赖', 'dependency',
        '搜索', 'search', '查找', 'find',
        '列表', 'list', '展示', 'show',
    ],
    'low': [
        '版本', 'version', '检查', 'check',
        '状态', 'status', '健康', 'health',
        '帮助', 'help', '信息', 'info',
        '路径', 'path', '位置', 'location',
        '大小', 'size', '计数', 'count',
        '时间', 'time', '日期', 'date',
        '简单', 'simple', '快速', 'quick',
    ],
}

# 默认努力程度
DEFAULT_EFFORT = 'medium'

# 努力程度映射 (用于 API 调用)
EFFORT_MAPPING = {
    'high': {'tokens': 4096, 'temperature': 0.3, 'top_p': 0.9},
    'medium': {'tokens': 2048, 'temperature': 0.5, 'top_p': 0.95},
    'low': {'tokens': 1024, 'temperature': 0.7, 'top_p': 1.0},
}


def get_reasoning_effort(task: str) -> str:
    """
    根据任务描述获取推理努力程度
    
    Args:
        task: 任务描述
        
    Returns:
        'high', 'medium', 或 'low'
    """
    task_lower = task.lower()
    
    # 按优先级检查 (high -> medium -> low)
    for effort in ['high', 'medium', 'low']:
        keywords = REASONING_EFFORT_RULES.get(effort, [])
        if any(kw.lower() in task_lower for kw in keywords):
            return effort
    
    return DEFAULT_EFFORT


def get_effort_config(effort: str) -> Dict:
    """
    获取努力程度对应的配置参数
    
    Args:
        effort: 努力程度
        
    Returns:
        配置字典
    """
    return EFFORT_MAPPING.get(effort, EFFORT_MAPPING['medium'])


def get_task_category(task: str) -> str:
    """
    获取任务类别
    
    Args:
        task: 任务描述
        
    Returns:
        类别描述
    """
    effort = get_reasoning_effort(task)
    
    category_map = {
        'high': '复杂任务 (Complex)',
        'medium': '普通任务 (Normal)',
        'low': '简单任务 (Simple)',
    }
    
    return category_map.get(effort, '未知任务 (Unknown)')


# ============================================================
# 使用示例
# ============================================================

if __name__ == "__main__":
    test_tasks = [
        "重构这个模块的代码",
        "读取 config.py 文件",
        "检查 git 状态",
        "调试为什么测试失败",
        "创建新的 API 端点",
        "显示当前版本",
    ]
    
    print("=" * 60)
    print("Reasoning Effort Config - v10.7.2")
    print("=" * 60)
    print()
    
    for task in test_tasks:
        effort = get_reasoning_effort(task)
        category = get_task_category(task)
        config = get_effort_config(effort)
        
        print(f"任务：{task}")
        print(f"  类别：{category}")
        print(f"  努力程度：{effort}")
        print(f"  配置：tokens={config['tokens']}, temp={config['temperature']}")
        print()
