#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.3 - 多智能体协调模块
基于论文：
- Augmenting the action space with conventions to improve multi-agent cooperation (arXiv:2412.06333)
- A Survey of Multi-Agent Deep Reinforcement Learning with Communication (arXiv:2203.08975)

实现多智能体协作功能：
- 智能体通信协议
- 协作约定 (conventions)
- 任务分配与协调

注意：本模块为多智能体系统启发式实现。
"""

import time
import uuid
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict


class AgentRole(Enum):
    """智能体角色"""
    LEADER = "leader"           # 领导者
    COORDINATOR = "coordinator" # 协调者
    WORKER = "worker"           # 执行者
    OBSERVER = "observer"       # 观察者
    CRITIC = "critic"           # 评估者


class MessageType(Enum):
    """消息类型"""
    TASK_ASSIGN = "task_assign"
    TASK_COMPLETE = "task_complete"
    REQUEST_HELP = "request_help"
    OFFER_HELP = "offer_help"
    STATUS_UPDATE = "status_update"
    CONVENTION_UPDATE = "convention_update"


@dataclass
class Agent:
    """智能体"""
    id: str
    role: AgentRole
    capabilities: List[str]
    workload: float = 0.0  # 0-1
    availability: float = 1.0  # 0-1
    trust_score: float = 0.5  # 0-1
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'role': self.role.value,
            'capabilities': self.capabilities,
            'workload': self.workload,
            'availability': self.availability,
            'trust_score': self.trust_score
        }


@dataclass
class Message:
    """智能体间消息"""
    id: str
    sender_id: str
    receiver_id: Optional[str]
    message_type: MessageType
    content: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)
    priority: int = 0  # 0-10


@dataclass
class Convention:
    """协作约定"""
    name: str
    description: str
    conditions: List[str]
    action: str
    adoption_rate: float = 0.0  # 采用率


class MultiAgentCoordinator:
    """
    多智能体协调器
    
    基于多智能体协作研究：
    1. 使用约定 (conventions) 增强行动空间
    2. 建立通信协议
    3. 动态任务分配
    
    注意：本模块为多智能体系统启发式实现。
    """
    
    def __init__(self):
        self.name = "MultiAgentCoordinator"
        self.version = "10.7.3"
        self.paper_refs = [
            "arXiv:2412.06333",
            "arXiv:2203.08975"
        ]
        
        # 智能体注册表
        self.agents: Dict[str, Agent] = {}
        
        # 消息队列
        self.message_queue: List[Message] = []
        
        # 协作约定
        self.conventions: List[Convention] = []
        
        # 任务跟踪
        self.tasks: Dict[str, Dict] = {}
        
        # 初始化默认约定
        self._init_default_conventions()
    
    def _init_default_conventions(self):
        """初始化默认协作约定"""
        self.conventions = [
            Convention(
                name="help_request",
                description="当工作负载超过阈值时请求帮助",
                conditions=["workload > 0.8", "task_critical"],
                action="broadcast REQUEST_HELP",
                adoption_rate=0.9
            ),
            Convention(
                name="task_handoff",
                description="任务交接协议",
                conditions=["task_complete", "next_agent_available"],
                action="send TASK_COMPLETE with context",
                adoption_rate=0.85
            ),
            Convention(
                name="priority_override",
                description="高优先级任务覆盖",
                conditions=["priority >= 8", "leader_approval"],
                action="preempt_current_task",
                adoption_rate=0.7
            )
        ]
    
    def register_agent(self, agent_id: str, role: AgentRole,
                       capabilities: List[str]) -> Agent:
        """注册智能体"""
        agent = Agent(
            id=agent_id,
            role=role,
            capabilities=capabilities
        )
        self.agents[agent_id] = agent
        return agent
    
    def send_message(self, sender_id: str, receiver_id: Optional[str],
                     message_type: MessageType, content: Dict[str, Any],
                     priority: int = 0) -> Message:
        """发送消息"""
        message = Message(
            id=str(uuid.uuid4())[:8],
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=message_type,
            content=content,
            priority=priority
        )
        self.message_queue.append(message)
        return message
    
    def process_messages(self) -> List[Dict[str, Any]]:
        """处理消息队列"""
        results = []
        
        for message in self.message_queue:
            result = self._handle_message(message)
            results.append(result)
        
        # 清空队列
        self.message_queue = []
        
        return results
    
    def _handle_message(self, message: Message) -> Dict[str, Any]:
        """处理单条消息"""
        if message.message_type == MessageType.TASK_ASSIGN:
            return self._handle_task_assign(message)
        elif message.message_type == MessageType.TASK_COMPLETE:
            return self._handle_task_complete(message)
        elif message.message_type == MessageType.REQUEST_HELP:
            return self._handle_request_help(message)
        else:
            return {'status': 'processed', 'type': message.message_type.value}
    
    def _handle_task_assign(self, message: Message) -> Dict[str, Any]:
        """处理任务分配"""
        task_id = message.content.get('task_id')
        agent_id = message.receiver_id
        
        if agent_id and agent_id in self.agents:
            agent = self.agents[agent_id]
            agent.workload = min(1.0, agent.workload + 0.2)
            agent.availability = max(0, agent.availability - 0.2)
            
            self.tasks[task_id] = {
                'assigned_to': agent_id,
                'status': 'in_progress',
                'content': message.content
            }
            
            return {'status': 'assigned', 'task_id': task_id, 'agent': agent_id}
        
        return {'status': 'failed', 'reason': 'agent_not_found'}
    
    def _handle_task_complete(self, message: Message) -> Dict[str, Any]:
        """处理任务完成"""
        task_id = message.content.get('task_id')
        agent_id = message.sender_id
        
        if task_id in self.tasks:
            self.tasks[task_id]['status'] = 'complete'
            
            # 更新智能体负载
            if agent_id in self.agents:
                agent = self.agents[agent_id]
                agent.workload = max(0, agent.workload - 0.2)
                agent.availability = min(1.0, agent.availability + 0.2)
                agent.trust_score = min(1.0, agent.trust_score + 0.05)
            
            return {'status': 'completed', 'task_id': task_id}
        
        return {'status': 'unknown_task'}
    
    def _handle_request_help(self, message: Message) -> Dict[str, Any]:
        """处理求助请求"""
        requester_id = message.sender_id
        
        # 寻找可用的帮助者
        available_helpers = []
        for agent_id, agent in self.agents.items():
            if agent_id != requester_id and agent.availability > 0.5:
                available_helpers.append({
                    'id': agent_id,
                    'role': agent.role.value,
                    'availability': agent.availability,
                    'capabilities': agent.capabilities
                })
        
        # 发送帮助提供消息
        for helper in available_helpers[:3]:  # 最多 3 个
            self.send_message(
                sender_id="coordinator",
                receiver_id=helper['id'],
                message_type=MessageType.OFFER_HELP,
                content={'requester': requester_id, 'task': message.content}
            )
        
        return {
            'status': 'help_requested',
            'available_helpers': len(available_helpers),
            'helpers': available_helpers
        }
    
    def assign_task(self, task_id: str, task_description: str,
                    required_capabilities: List[str] = None) -> Dict[str, Any]:
        """
        智能任务分配
        
        基于智能体能力、负载和信任度进行分配
        """
        required_capabilities = required_capabilities or []
        
        # 寻找合适的智能体
        candidates = []
        for agent_id, agent in self.agents.items():
            if agent.role == AgentRole.OBSERVER:
                continue
            
            # 计算匹配分数
            score = 0.0
            
            # 能力匹配
            if required_capabilities:
                capability_match = sum(1 for c in required_capabilities
                                      if c in agent.capabilities) / len(required_capabilities)
                score += capability_match * 0.5
            else:
                score += 0.3
            
            # 可用性
            score += agent.availability * 0.3
            
            # 信任度
            score += agent.trust_score * 0.2
            
            # 负载 (越低越好)
            score += (1 - agent.workload) * 0.1
            
            candidates.append((agent_id, score))
        
        if not candidates:
            return {'status': 'failed', 'reason': 'no_agents_available'}
        
        # 选择最高分
        candidates.sort(key=lambda x: x[1], reverse=True)
        selected_id, selected_score = candidates[0]
        
        # 发送任务分配消息
        message = self.send_message(
            sender_id="coordinator",
            receiver_id=selected_id,
            message_type=MessageType.TASK_ASSIGN,
            content={
                'task_id': task_id,
                'description': task_description,
                'required_capabilities': required_capabilities
            },
            priority=5
        )
        
        return {
            'status': 'assigned',
            'task_id': task_id,
            'assigned_to': selected_id,
            'confidence': selected_score,
            'message_id': message.id
        }
    
    def get_coordination_state(self) -> Dict[str, Any]:
        """获取协调状态"""
        return {
            'agents': {aid: a.to_dict() for aid, a in self.agents.items()},
            'pending_messages': len(self.message_queue),
            'active_tasks': sum(1 for t in self.tasks.values()
                               if t.get('status') == 'in_progress'),
            'conventions': [
                {'name': c.name, 'adoption_rate': c.adoption_rate}
                for c in self.conventions
            ],
            'model': 'multi_agent_coordination',
            'paper_refs': self.paper_refs
        }
    
    def update_conventions(self, feedback: Dict[str, float]):
        """
        更新约定采用率
        
        Args:
            feedback: {convention_name: success_rate}
        """
        for convention in self.conventions:
            if convention.name in feedback:
                # 指数移动平均更新
                alpha = 0.3
                convention.adoption_rate = (
                    alpha * feedback[convention.name] +
                    (1 - alpha) * convention.adoption_rate
                )
    
    def reset(self):
        """重置协调器"""
        self.agents = {}
        self.message_queue = []
        self.tasks = {}


# 便捷函数
def coordinate_agents(agents_config: List[Dict],
                      tasks: List[Dict]) -> Dict[str, Any]:
    """
    多智能体协调便捷函数
    
    Args:
        agents_config: 智能体配置列表
        tasks: 任务列表
        
    Returns:
        协调结果
    """
    coordinator = MultiAgentCoordinator()
    
    # 注册智能体
    for config in agents_config:
        coordinator.register_agent(
            agent_id=config['id'],
            role=AgentRole(config.get('role', 'worker')),
            capabilities=config.get('capabilities', [])
        )
    
    # 分配任务
    assignments = []
    for task in tasks:
        result = coordinator.assign_task(
            task_id=task.get('id', str(uuid.uuid4())[:8]),
            task_description=task.get('description', ''),
            required_capabilities=task.get('required_capabilities')
        )
        assignments.append(result)
    
    return {
        'assignments': assignments,
        'state': coordinator.get_coordination_state()
    }


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("MultiAgentCoordinator v10.7.3 测试")
    print("=" * 60)
    
    coordinator = MultiAgentCoordinator()
    
    # 注册智能体
    print("\n🤖 注册智能体:")
    coordinator.register_agent("agent_1", AgentRole.LEADER, ["planning", "coordination"])
    coordinator.register_agent("agent_2", AgentRole.WORKER, ["coding", "testing"])
    coordinator.register_agent("agent_3", AgentRole.WORKER, ["coding", "debugging"])
    coordinator.register_agent("agent_4", AgentRole.CRITIC, ["review", "analysis"])
    print(f"  已注册 {len(coordinator.agents)} 个智能体")
    
    # 分配任务
    print("\n📋 分配任务:")
    result = coordinator.assign_task(
        task_id="task_001",
        task_description="实现新功能",
        required_capabilities=["coding"]
    )
    print(f"  任务分配：{result['status']} -> {result.get('assigned_to', 'N/A')}")
    
    # 模拟任务完成
    print("\n✅ 模拟任务完成:")
    if result['status'] == 'assigned':
        coordinator.send_message(
            sender_id=result['assigned_to'],
            receiver_id=None,
            message_type=MessageType.TASK_COMPLETE,
            content={'task_id': 'task_001'}
        )
        coordinator.process_messages()
    
    # 获取状态
    print("\n📊 协调状态:")
    state = coordinator.get_coordination_state()
    print(f"  智能体数：{len(state['agents'])}")
    print(f"  约定数：{len(state['conventions'])}")
    
    print("\n✅ 测试完成")
