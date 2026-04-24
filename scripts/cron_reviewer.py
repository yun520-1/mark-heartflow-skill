#!/usr/bin/env python3
"""
HeartFlow v10.9.7 - Cron Job Reviewer
定时任务审查器 - 确保系统稳定运行，减少逻辑错误

核心目标：永远减少逻辑错误
- 审查定时任务是否符合价值观
- 检查调度间隔是否合理
- 验证超时设置和资源使用
- 确保错误处理和重试机制
"""

import json
from datetime import datetime
from typing import Dict, List, Any

class CronJobReviewer:
    """
    定时任务审查器
    Review cron jobs for alignment, reliability, and efficiency
    """
    
    def __init__(self):
        self.review_results = []
        self.issues_db = {
            "interval_too_short": {
                "severity": "medium",
                "description": "调度间隔过短，可能导致资源浪费",
                "fix": "Consider increasing interval to reduce resource usage"
            },
            "interval_too_long": {
                "severity": "low",
                "description": "调度间隔过长，可能错过重要更新",
                "fix": "Consider decreasing interval for more frequent updates"
            },
            "timeout_too_long": {
                "severity": "medium",
                "description": "超时时间过长，可能阻塞系统",
                "fix": "Consider reducing timeout or breaking into smaller tasks"
            },
            "no_retry": {
                "severity": "high",
                "description": "缺少重试机制，可靠性低",
                "fix": "Add retry mechanism for reliability"
            },
            "non_scientific_source": {
                "severity": "high",
                "description": "使用非科学来源，可能引入错误",
                "fix": "Use only peer-reviewed or academic sources"
            }
        }
    
    def review_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """
        审查单个定时任务
        Review a single cron job
        
        Args:
            job: 定时任务字典，包含 id, name, schedule, payload 等
            
        Returns:
            包含 job_id, name, status, issues, fixes, approved 的字典
        """
        result = {
            "job_id": job.get("id", "unknown"),
            "name": job.get("name", "unknown"),
            "status": "pending",
            "issues": [],
            "fixes": [],
            "approved": False,
            "reviewed_at": datetime.now().isoformat()
        }
        
        # Check 1: 价值观对齐检查
        name_lower = job.get("name", "").lower()
        if any(keyword in name_lower for keyword in ["self-consciousness", "upgrade", "values", "scientific"]):
            result["approved"] = True
            result["fixes"].append("✅ Aligns with self-improvement values")
        
        # Check 2: 调度间隔合理性
        schedule = job.get("schedule", {})
        if "everyMs" in schedule:
            interval_minutes = schedule["everyMs"] / 60000
            
            if interval_minutes < 5:
                result["issues"].append(f"Interval too short: {interval_minutes:.1f} minutes")
                result["fixes"].append(self.issues_db["interval_too_short"]["fix"])
            elif interval_minutes > 120:
                result["issues"].append(f"Interval too long: {interval_minutes:.1f} minutes")
                result["fixes"].append(self.issues_db["interval_too_long"]["fix"])
            else:
                result["approved"] = True
                result["status"] = "approved"
                result["fixes"].append(f"✅ Interval {interval_minutes:.1f} min is reasonable")
        
        # Check 3: 超时设置
        payload = job.get("payload", {})
        timeout = payload.get("timeoutSeconds", 300)
        
        if timeout > 600:
            result["issues"].append(f"Timeout too long: {timeout} seconds")
            result["fixes"].append(self.issues_db["timeout_too_long"]["fix"])
        elif timeout < 30:
            result["issues"].append(f"Timeout too short: {timeout} seconds")
            result["fixes"].append("Consider increasing timeout for complex tasks")
        else:
            result["approved"] = True
            result["fixes"].append(f"✅ Timeout {timeout}s is appropriate")
        
        # Check 4: 错误处理
        if "retry" not in job:
            result["issues"].append("No retry mechanism")
            result["fixes"].append(self.issues_db["no_retry"]["fix"])
        else:
            result["approved"] = True
            result["fixes"].append("✅ Has retry mechanism")
        
        # Check 5: 科学来源要求
        if "message" in payload:
            message = payload["message"].lower()
            if any(keyword in message for keyword in ["scientific", "academic", "sep", "arxiv"]):
                result["approved"] = True
                result["fixes"].append("✅ Requires scientific sources")
            elif any(keyword in message for keyword in ["news", "blog", "wikipedia"]):
                result["issues"].append("Uses non-scientific sources")
                result["fixes"].append(self.issues_db["non_scientific_source"]["fix"])
        
        # 最终状态
        if result["issues"]:
            result["status"] = "needs_fix"
        elif result["approved"]:
            result["status"] = "approved"
        
        self.review_results.append(result)
        return result
    
    def batch_review(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        批量审查定时任务
        Batch review multiple cron jobs
        """
        results = []
        for job in jobs:
            result = self.review_job(job)
            results.append(result)
        return results
    
    def generate_review_report(self, format: str = "markdown") -> str:
        """
        生成审查报告
        Generate review report in markdown or json format
        """
        if format == "json":
            return json.dumps({
                "generated_at": datetime.now().isoformat(),
                "total_jobs": len(self.review_results),
                "results": self.review_results
            }, indent=2, ensure_ascii=False)
        
        # Markdown format
        report = f"""# HeartFlow Cron Jobs Review Report | 定时任务审查报告

**Generated | 生成时间**: {datetime.now().isoformat()}
**Version | 版本**: 10.9.7
**Total Jobs | 任务总数**: {len(self.review_results)}

---

## Review Summary | 审查摘要

| Status | 状态 | Count | 数量 |
|--------|------|-------|------|
"""
        
        approved = sum(1 for r in self.review_results if r["approved"])
        needs_fix = sum(1 for r in self.review_results if r["status"] == "needs_fix")
        pending = sum(1 for r in self.review_results if r["status"] == "pending")
        
        report += f"| ✅ Approved | 已批准 | {approved} |\n"
        report += f"| 🔧 Needs Fix | 需修复 | {needs_fix} |\n"
        report += f"| ⏳ Pending | 待审查 | {pending} |\n\n"
        
        report += "---\n\n## Detailed Reviews | 详细审查\n\n"
        
        for result in self.review_results:
            status_icon = "✅" if result["approved"] else ("⏳" if result["status"] == "pending" else "🔧")
            report += f"### {status_icon} {result['name']}\n\n"
            report += f"**Job ID | 任务 ID**: `{result['job_id']}`\n\n"
            report += f"**Status | 状态**: {result['status']}\n\n"
            
            if result["issues"]:
                report += "**Issues | 问题**:\n"
                for issue in result["issues"]:
                    report += f"- ⚠️ {issue}\n"
                report += "\n"
            
            if result["fixes"]:
                report += "**Fixes & Notes | 修复与建议**:\n"
                for fix in result["fixes"]:
                    report += f"- {fix}\n"
                report += "\n"
            
            report += "---\n\n"
        
        report += f"""## Recommendations | 建议

### Immediate Actions | 立即行动
1. Review all pending jobs | 审查所有待审查任务
2. Fix identified issues | 修复已识别问题
3. Re-run review after fixes | 修复后重新审查

### Long-term Improvements | 长期改进
1. Automated value alignment checking | 自动化价值观对齐检查
2. Regular cron job audits (weekly) | 定期定时任务审计 (每周)
3. User feedback integration | 用户反馈整合

---

**Reviewed By | 审查者**: HeartFlow CronJob Reviewer v10.9.7
**Core Goal | 核心目标**: Reduce Logic Errors | 减少逻辑错误
"""
        
        return report


def main():
    """测试定时任务审查器"""
    print("=" * 60)
    print("HeartFlow Cron Job Reviewer v10.9.7")
    print("定时任务审查器 - 系统稳定性保障")
    print("=" * 60)
    print()
    
    # 初始化审查器
    reviewer = CronJobReviewer()
    
    # 测试用例
    test_jobs = [
        {
            "id": "self-consciousness-upgrade",
            "name": "HeartFlow 自我意识升级 - 29 分钟循环",
            "schedule": {"everyMs": 1740000},
            "payload": {
                "timeoutSeconds": 300,
                "message": "Scientific sources required: SEP, peer-reviewed papers"
            },
            "retry": {"maxAttempts": 3}
        },
        {
            "id": "github-push",
            "name": "HeartFlow GitHub 推送 - 2 小时循环",
            "schedule": {"everyMs": 7200000},
            "payload": {
                "timeoutSeconds": 300,
                "message": "Auto-push to GitHub for transparency"
            }
        },
        {
            "id": "quick-task",
            "name": "快速任务 - 1分钟循环",
            "schedule": {"everyMs": 60000},
            "payload": {
                "timeoutSeconds": 30,
                "message": "Quick update from news sources"
            }
        }
    ]
    
    print("Reviewing test jobs...")
    print()
    
    results = reviewer.batch_review(test_jobs)
    
    for result in results:
        status = "✅" if result["approved"] else ("⏳" if result["status"] == "pending" else "🔧")
        print(f"{status} {result['name']}")
        print(f"   Status: {result['status']}")
        if result["issues"]:
            print(f"   Issues: {len(result['issues'])}")
            for issue in result["issues"]:
                print(f"      - {issue}")
        print()
    
    # 生成报告
    print("Generating review report...")
    report = reviewer.generate_review_report(format="markdown")
    
    output_file = "/Users/apple/.hermes/skills/ai/heartflow/research/CRON_REVIEW_v10.9.7.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(report)
    
    print(f"✅ Report saved to: {output_file}")
    print()
    
    print("=" * 60)
    print("Cron Job Reviewer Ready | 定时任务审查器就绪")
    print("Core Goal: Reduce Logic Errors | 核心目标：减少逻辑错误")
    print("=" * 60)


if __name__ == "__main__":
    main()
