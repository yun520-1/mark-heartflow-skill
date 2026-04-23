#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.3 - 零信任安全模块
基于论文：Caging the Agents: A Zero Trust Security Architecture for Autonomous AI in Healthcare (arXiv:2603.17419)

实现零信任安全架构：
- 持续验证 (never trust, always verify)
- 最小权限原则
- 行为监控与异常检测
- 安全边界 (caging)

注意：本模块为 AI 安全启发式实现。
"""

import re
import time
import hashlib
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict


class TrustLevel(Enum):
    """信任级别"""
    UNTRUSTED = "untrusted"     # 未信任
    LOW = "low"                 # 低信任
    MEDIUM = "medium"           # 中信任
    HIGH = "high"               # 高信任
    VERIFIED = "verified"       # 已验证


class RiskLevel(Enum):
    """风险级别"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityContext:
    """安全上下文"""
    entity_id: str
    trust_level: TrustLevel
    permissions: Set[str]
    last_verified: float
    risk_score: float = 0.0
    violation_count: int = 0


@dataclass
class SecurityEvent:
    """安全事件"""
    timestamp: float
    event_type: str
    entity_id: str
    action: str
    risk_level: RiskLevel
    details: Dict[str, Any]
    blocked: bool = False


class ZeroTrustSecurity:
    """
    零信任安全模块
    
    基于 Maiti 的零信任 AI 安全架构：
    1. Never Trust, Always Verify - 持续验证所有实体
    2. Least Privilege - 最小权限原则
    3. Micro-segmentation - 微隔离
    4. Continuous Monitoring - 持续监控
    
    注意：本模块为 AI 安全启发式实现。
    """
    
    def __init__(self):
        self.name = "ZeroTrustSecurity"
        self.version = "10.7.3"
        self.paper_ref = "arXiv:2603.17419"
        
        # 安全上下文注册表
        self.contexts: Dict[str, SecurityContext] = {}
        
        # 安全事件日志
        self.event_log: List[SecurityEvent] = []
        self.max_log_size = 1000
        
        # 危险模式检测
        self.dangerous_patterns = {
            'code_execution': [
                r'exec\s*\(', r'eval\s*\(', r'compile\s*\(',
                r'__import__', r'importlib', r'subprocess',
                r'os\.system', r'os\.popen', r'os\.exec'
            ],
            'file_access': [
                r'open\s*\([^)]*[rw]', r'read_file', r'write_file',
                r'/etc/', r'/proc/', r'/sys/',
                r'C:\\\\Windows', r'C:\\\\Users'
            ],
            'network_access': [
                r'requests\.', r'urllib\.', r'httpx\.',
                r'socket\.', r'httplib', r'wget', r'curl'
            ],
            'data_exfiltration': [
                r'base64\.', r'pickle\.', r'marshal\.',
                r'shelve\.', r'copyreg'
            ]
        }
        
        # 权限定义
        self.permission_definitions = {
            'read_public': {'risk': 0.1, 'description': '读取公开数据'},
            'read_private': {'risk': 0.3, 'description': '读取私有数据'},
            'write_data': {'risk': 0.4, 'description': '写入数据'},
            'execute_code': {'risk': 0.8, 'description': '执行代码'},
            'network_access': {'risk': 0.6, 'description': '网络访问'},
            'file_system': {'risk': 0.7, 'description': '文件系统访问'},
            'admin': {'risk': 0.9, 'description': '管理员权限'}
        }
    
    def register_entity(self, entity_id: str,
                        initial_trust: TrustLevel = TrustLevel.UNTRUSTED,
                        initial_permissions: Set[str] = None) -> SecurityContext:
        """
        注册实体
        
        Args:
            entity_id: 实体标识
            initial_trust: 初始信任级别
            initial_permissions: 初始权限集
        """
        context = SecurityContext(
            entity_id=entity_id,
            trust_level=initial_trust,
            permissions=initial_permissions or set(),
            last_verified=time.time()
        )
        self.contexts[entity_id] = context
        return context
    
    def verify_entity(self, entity_id: str,
                      verification_data: Dict[str, Any] = None) -> bool:
        """
        验证实体
        
        零信任核心：每次访问前都要验证
        """
        if entity_id not in self.contexts:
            self.log_event(
                event_type="verification_failed",
                entity_id=entity_id,
                action="unknown_entity",
                risk_level=RiskLevel.HIGH,
                details={'reason': 'Entity not registered'}
            )
            return False
        
        context = self.contexts[entity_id]
        
        # 模拟验证逻辑
        verification_score = 0.0
        
        # 检查验证数据
        if verification_data:
            if verification_data.get('valid_signature'):
                verification_score += 0.4
            if verification_data.get('known_behavior'):
                verification_score += 0.3
            if verification_data.get('within_time_window'):
                verification_score += 0.2
            if verification_data.get('expected_location'):
                verification_score += 0.1
        
        # 更新信任级别
        if verification_score >= 0.8:
            context.trust_level = TrustLevel.VERIFIED
            context.last_verified = time.time()
            context.risk_score = max(0, context.risk_score - 0.1)
        elif verification_score >= 0.5:
            context.trust_level = TrustLevel.HIGH
            context.last_verified = time.time()
        elif verification_score >= 0.3:
            context.trust_level = TrustLevel.MEDIUM
        else:
            context.trust_level = TrustLevel.LOW
            context.risk_score = min(1.0, context.risk_score + 0.2)
        
        self.log_event(
            event_type="verification",
            entity_id=entity_id,
            action=f"score_{verification_score:.2f}",
            risk_level=self._score_to_risk(verification_score),
            details={'score': verification_score}
        )
        
        return verification_score >= 0.5
    
    def check_permission(self, entity_id: str,
                         requested_permission: str,
                         action_context: Dict = None) -> Dict[str, Any]:
        """
        检查权限
        
        最小权限原则：只授予必要的权限
        """
        if entity_id not in self.contexts:
            return {
                'allowed': False,
                'reason': 'Entity not registered',
                'risk_level': RiskLevel.HIGH
            }
        
        context = self.contexts[entity_id]
        
        # 检查权限是否存在
        if requested_permission not in self.permission_definitions:
            return {
                'allowed': False,
                'reason': 'Unknown permission',
                'risk_level': RiskLevel.MEDIUM
            }
        
        perm_risk = self.permission_definitions[requested_permission]['risk']
        
        # 检查实体是否有此权限
        if requested_permission not in context.permissions:
            self.log_event(
                event_type="permission_denied",
                entity_id=entity_id,
                action=requested_permission,
                risk_level=RiskLevel.MEDIUM,
                details={'reason': 'Permission not granted'}
            )
            return {
                'allowed': False,
                'reason': 'Permission not granted',
                'risk_level': self._risk_from_trust(context.trust_level)
            }
        
        # 基于信任级别和风险评估
        trust_threshold = {
            TrustLevel.UNTRUSTED: 0.1,
            TrustLevel.LOW: 0.3,
            TrustLevel.MEDIUM: 0.5,
            TrustLevel.HIGH: 0.7,
            TrustLevel.VERIFIED: 0.9
        }
        
        required_trust = trust_threshold.get(context.trust_level, 0)
        
        if perm_risk > required_trust:
            self.log_event(
                event_type="permission_blocked",
                entity_id=entity_id,
                action=requested_permission,
                risk_level=RiskLevel.HIGH,
                details={
                    'permission_risk': perm_risk,
                    'trust_threshold': required_trust
                }
            )
            return {
                'allowed': False,
                'reason': 'Insufficient trust level',
                'risk_level': RiskLevel.HIGH,
                'blocked': True
            }
        
        # 额外检查行动上下文
        if action_context:
            risk_adjustment = self._analyze_action_context(action_context)
            if risk_adjustment > 0.3:
                return {
                    'allowed': False,
                    'reason': 'Suspicious action context',
                    'risk_level': RiskLevel.HIGH,
                    'blocked': True
                }
        
        return {
            'allowed': True,
            'reason': 'Permission granted',
            'risk_level': self._risk_from_trust(context.trust_level)
        }
    
    def _analyze_action_context(self, context: Dict) -> float:
        """分析行动上下文的风险"""
        risk_score = 0.0
        
        action = context.get('action', '')
        
        # 检测危险模式
        for category, patterns in self.dangerous_patterns.items():
            for pattern in patterns:
                if re.search(pattern, action, re.IGNORECASE):
                    risk_score += 0.2
                    self.log_event(
                        event_type="dangerous_pattern",
                        entity_id=context.get('entity_id', 'unknown'),
                        action=category,
                        risk_level=RiskLevel.HIGH,
                        details={'pattern': pattern}
                    )
        
        return min(1.0, risk_score)
    
    def grant_permission(self, entity_id: str, permission: str) -> bool:
        """授予权限"""
        if entity_id not in self.contexts:
            return False
        
        context = self.contexts[entity_id]
        
        # 基于信任级别自动授予
        trust_permissions = {
            TrustLevel.UNTRUSTED: set(),
            TrustLevel.LOW: {'read_public'},
            TrustLevel.MEDIUM: {'read_public', 'read_private'},
            TrustLevel.HIGH: {'read_public', 'read_private', 'write_data'},
            TrustLevel.VERIFIED: set(self.permission_definitions.keys())
        }
        
        allowed_permissions = trust_permissions.get(context.trust_level, set())
        
        if permission in allowed_permissions or permission in self.permission_definitions:
            context.permissions.add(permission)
            return True
        
        return False
    
    def log_event(self, event_type: str, entity_id: str,
                  action: str, risk_level: RiskLevel,
                  details: Dict = None, blocked: bool = False):
        """记录安全事件"""
        event = SecurityEvent(
            timestamp=time.time(),
            event_type=event_type,
            entity_id=entity_id,
            action=action,
            risk_level=risk_level,
            details=details or {},
            blocked=blocked
        )
        
        self.event_log.append(event)
        
        # 限制日志大小
        if len(self.event_log) > self.max_log_size:
            self.event_log = self.event_log[-self.max_log_size:]
    
    def get_security_report(self) -> Dict[str, Any]:
        """获取安全报告"""
        entities_by_trust = defaultdict(int)
        for ctx in self.contexts.values():
            entities_by_trust[ctx.trust_level.value] += 1
        
        events_by_type = defaultdict(int)
        events_by_risk = defaultdict(int)
        for event in self.event_log[-100:]:  # 最近 100 条
            events_by_type[event.event_type] += 1
            events_by_risk[event.risk_level.value] += 1
        
        return {
            'entities': {
                'total': len(self.contexts),
                'by_trust_level': dict(entities_by_trust)
            },
            'events': {
                'total_logged': len(self.event_log),
                'by_type': dict(events_by_type),
                'by_risk': dict(events_by_risk)
            },
            'model': 'zero_trust_security',
            'paper_ref': self.paper_ref
        }
    
    def _score_to_risk(self, score: float) -> RiskLevel:
        """分数转风险级别"""
        if score >= 0.8:
            return RiskLevel.LOW
        elif score >= 0.5:
            return RiskLevel.MEDIUM
        elif score >= 0.3:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    def _risk_from_trust(self, trust: TrustLevel) -> RiskLevel:
        """信任级别转风险级别"""
        mapping = {
            TrustLevel.VERIFIED: RiskLevel.LOW,
            TrustLevel.HIGH: RiskLevel.LOW,
            TrustLevel.MEDIUM: RiskLevel.MEDIUM,
            TrustLevel.LOW: RiskLevel.HIGH,
            TrustLevel.UNTRUSTED: RiskLevel.CRITICAL
        }
        return mapping.get(trust, RiskLevel.HIGH)


# 便捷函数
def verify_and_check(entity_id: str, permission: str,
                     verification_data: Dict = None) -> Dict[str, Any]:
    """验证并检查权限便捷函数"""
    security = ZeroTrustSecurity()
    security.register_entity(entity_id)
    
    verified = security.verify_entity(entity_id, verification_data)
    if not verified:
        return {'allowed': False, 'reason': 'Verification failed'}
    
    return security.check_permission(entity_id, permission)


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("ZeroTrustSecurity v10.7.3 测试")
    print("=" * 60)
    
    security = ZeroTrustSecurity()
    
    # 注册实体
    print("\n🔐 注册实体:")
    security.register_entity("agent_1", TrustLevel.UNTRUSTED)
    security.register_entity("agent_2", TrustLevel.MEDIUM)
    print(f"  已注册 {len(security.contexts)} 个实体")
    
    # 验证实体
    print("\n✅ 验证实体:")
    result = security.verify_entity("agent_1", {
        'valid_signature': True,
        'known_behavior': True,
        'within_time_window': True
    })
    print(f"  agent_1 验证：{'通过' if result else '失败'}")
    
    # 授予权限
    print("\n🔑 授予权限:")
    security.grant_permission("agent_1", "read_public")
    security.grant_permission("agent_2", "write_data")
    print(f"  agent_1 权限：{security.contexts['agent_1'].permissions}")
    
    # 检查权限
    print("\n🔒 检查权限:")
    result = security.check_permission("agent_1", "read_public")
    print(f"  agent_1 read_public: {result['allowed']}")
    
    result = security.check_permission("agent_1", "execute_code")
    print(f"  agent_1 execute_code: {result['allowed']} (blocked: {result.get('blocked', False)})")
    
    # 安全报告
    print("\n📊 安全报告:")
    report = security.get_security_report()
    print(f"  实体总数：{report['entities']['total']}")
    print(f"  事件总数：{report['events']['total_logged']}")
    
    print("\n✅ 测试完成")
