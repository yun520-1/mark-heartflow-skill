# HeartFlow Licensing & Privacy Notice

## 开源协议与隐私保护声明

**Version | 版本**: 1.0  
**Effective Date | 生效日期**: 2026-04-02  
**Applies to | 适用于**: HeartFlow v5.1.92+

---

## 📋 快速摘要 | Quick Summary

| 项目 | 说明 |
|------|------|
| **开源协议** | MIT (核心算法保留) |
| **商用** | ✅ 允许 (不含核心算法) / ❌ 需商业许可 (含核心算法) |
| **数据存储** | 仅本地存储 |
| **隐私保护** | 加密存储，无远程访问 |
| **数据上传** | ❌ 禁止 |
| **遥测/分析** | ❌ 无 |

---

## 1. 开源协议说明 | Licensing

### 1.1 MIT 协议 (含核心算法限制)

**English:**

HeartFlow uses a **modified MIT License** that permits free use for personal and research purposes, but restricts commercial use of core algorithms.

**中文:**

HeartFlow 使用**修改版 MIT 协议**，允许个人和研究用途免费使用，但限制核心算法的商业使用。

---

### 1.2 核心算法保留 | Core Algorithm Restriction

**English:**

The following components are **NOT open-source** and require a separate commercial license for commercial use:

**中文:**

以下组件**不开源**，商业使用需单独商业许可：

| 模块 | 文件路径 | 用途 |
|------|----------|------|
| 核心整合引擎 | `src/integration/core-engine.js` | 99+ 理论模块整合 |
| 理论整合算法 | `src/theory/integration-algorithms/` | 跨理论推理 |
| 跨模块推理引擎 | `src/inference/cross-module.js` | 模块间一致性验证 |
| 质量验证系统 | `src/quality/verification.js` | 99.9999995% 质量保证 |
| 评估协议生成器 | `src/assessment/protocol-generator.js` | 312 个临床评估协议 |
| 干预工具校准器 | `src/intervention/calibrator.js` | 467 个治疗干预工具 |

---

### 1.3 许可场景 | Licensing Scenarios

| 使用场景 | 是否需要商业许可 | 说明 |
|----------|------------------|------|
| 个人使用 | ❌ 否 | MIT 协议免费 |
| 学术研究 | ❌ 否 | MIT 协议免费 |
| 教学用途 | ❌ 否 | MIT 协议免费 |
| 商业部署 (不含核心算法) | ❌ 否 | MIT 协议允许 |
| 商业部署 (含核心算法) | ✅ 是 | 需商业许可 |
| SaaS/云服务 | ✅ 是 | 需商业许可 |
| 修改后分发 | ❌ 否 | 需保留协议声明 |

---

### 1.4 商业许可咨询 | Commercial Licensing

**English:**

For commercial licensing inquiries, please contact:

**中文:**

商业许可咨询，请联系：

📧 Email: `markcell@163.com`

---

## 2. 数据隐私保护 | Data Privacy

### 2.1 隐私承诺 | Privacy Commitment

**English:**

HeartFlow is designed with **privacy by design** principles. Your data belongs to you, and only you.

**中文:**

HeartFlow 采用**隐私设计**原则构建。您的数据属于您，且仅属于您。

---

### 2.2 数据存储原则 | Data Storage Principles

| 原则 | 实现方式 |
|------|----------|
| **仅本地存储** | 数据存储在 `~/.openclaw/workspace/heartflow/data/` |
| **无云端上传** | 默认禁用云同步 |
| **无远程访问** | 防火墙阻止远程连接 |
| **加密存储** | AES-256-GCM 加密所有敏感数据 |
| **文件系统权限** | 700/600 权限 (仅所有者可读写) |

---

### 2.3 数据访问控制 | Data Access Control

**English:**

**Only the local user instance can read and write user data.**

**中文:**

**仅本地用户实例可以读写用户数据。**

| 访问类型 | 状态 | 说明 |
|----------|------|------|
| 本地用户实例 | ✅ 允许 | 主要访问 |
| 远程网络访问 | ❌ 阻止 | 安全风险 |
| 自动云备份 | ❌ 禁用 | 隐私保护 |
| 手动云备份 (用户发起) | ⚠️ 用户选择 | 需明确同意 |
| 第三方分析 | ❌ 禁止 | 隐私侵犯 |
| 遥测 | ❌ 无 | 不收集数据 |

---

### 2.4 聊天中数据呈现 | Chat Display Only

**English:**

User data is **only displayed within the local chat interface** for emotional support purposes.

**中文:**

用户数据**仅在本地聊天界面内显示**，用于情感支持目的。

**示例 | Example**:
```
用户：我今天心情很低落...

HeartFlow: 我感受到你现在的状态是【关切】(强度：中等)
         这可能是因为工作压力或人际关系的影响。
         你想聊聊具体发生了什么吗？

[情绪状态仅在聊天中显示 - 不存储到外部]
```

---

### 2.5 用户数据权利 | User Data Rights

**English:**

You have the following rights over your data:

**中文:**

您对自己的数据拥有以下权利：

| 权利 | 实现方式 |
|------|----------|
| 访问数据 | 导出功能可用 |
| 查看情绪历史 | 聊天内按需显示 |
| 下载会话日志 | 用户发起导出 |
| 查看评估结果 | 完全访问所有结果 |
| 删除数据 | `/purge-all` 命令 |
| 删除特定记忆 | `/forget <id>` 命令 |

---

### 2.6 数据保护命令 | Data Protection Commands

| 命令 | 功能 | 范围 |
|------|------|------|
| `/reset` | 重置当前会话 | 仅当前会话 |
| `/clear-history` | 删除情绪历史 | 所有情绪记录 |
| `/purge-all` | 删除所有用户数据 | 完全数据擦除 |
| `/forget <id>` | 删除特定记忆 | 针对性删除 |
| `/export-data` | 导出个人数据 | 用户发起 |

---

## 3. 法规合规 | Regulatory Compliance

### 3.1 合规状态 | Compliance Status

| 法规 | 合规状态 | 说明 |
|------|----------|------|
| **GDPR (欧盟)** | ✅ 合规 | 仅本地处理 |
| **CCPA (加州)** | ✅ 合规 | 用户数据权利 |
| **PIPL (中国)** | ✅ 合规 | 本地存储，用户同意 |
| **HIPAA (美国医疗)** | ⚠️ 部分合规 | 未认证，设计对齐 |
| **PIPEDA (加拿大)** | ✅ 合规 | 隐私设计 |

---

### 3.2 隐私影响评估 | Privacy Impact Assessment

| 评估领域 | 风险等级 | 缓解措施 |
|----------|----------|----------|
| 数据收集 | 低 | 最小化，仅必要数据 |
| 数据存储 | 低 | 加密，仅本地 |
| 数据访问 | 低 | 仅所有者权限 |
| 数据传输 | 无 | 不发生传输 |
| 第三方共享 | 无 | 不允许共享 |
| 数据保留 | 低 | 用户控制删除 |

**总体隐私风险**: **低** ✅

---

## 4. 开发者义务 | Developer Obligations

### 4.1 开源贡献者 | Open-Source Contributors

**English:**

All contributors must comply with:

**中文:**

所有贡献者必须遵守：

1. ❌ **无遥测**: 不添加任何遥测、分析或跟踪代码
2. ✅ **本地优先**: 所有新功能默认本地运行
3. 🔒 **隐私设计**: 隐私考虑必须整合到所有新功能
4. ❌ **无数据上传**: 未经明确用户同意不实现数据上传功能
5. 🔐 **需要加密**: 所有敏感数据存储必须使用加密
6. 🔒 **访问控制**: 所有数据访问必须限制为本地用户实例

---

### 4.2 商业许可持有者 | Commercial Licensees

**English:**

Commercial licensees must additionally comply with:

**中文:**

商业许可持有者还必须遵守：

1. 📋 **审计要求**: 年度隐私合规审计
2. 📝 **数据处理协议**: 任何核心算法访问需签署 DPA
3. ✅ **用户同意**: 任何数据处理需获得明确用户同意
4. 🚨 **泄露通知**: 72 小时内报告任何数据泄露
5. 📚 **合规文档**: 维护隐私合规文档

---

## 5. 联系方式 | Contact

| 联系类型 | 邮箱 |
|----------|------|
| 一般隐私问题 | `markcell@163.com` |
| 数据访问请求 | `markcell@163.com` |
| 数据删除请求 | 应用内命令 (`/purge-all`) |
| 安全漏洞报告 | `markcell@163.com` |
| 商业许可咨询 | `markcell@163.com` |

---

## 6. 文档参考 | Documentation References

| 文档 | 说明 |
|------|------|
| [`LICENSE`](LICENSE) | 完整开源协议文本 |
| [`PRIVACY.md`](PRIVACY.md) | 完整数据隐私政策 |
| [`README.md`](README.md) | 项目说明 |
| [`docs/`](docs/) | 技术文档 |

---

## 7. 确认 | Acknowledgment

**English:**

By using HeartFlow, you acknowledge that you have read and understood this Licensing & Privacy Notice and agree to comply with all terms.

**中文:**

使用 HeartFlow 即表示您确认已阅读并理解本开源协议与隐私保护声明，并同意遵守所有条款。

---

**Last Updated | 最后更新**: 2026-04-02  
**Version | 版本**: 1.0  
**Next Review | 下次审查**: 2026-07-02 (Quarterly | 季度)

---

*This notice is bilingual compliant with HeartFlow BILINGUAL_STANDARD.md v5.1.3+*  
*本声明符合 HeartFlow BILINGUAL_STANDARD.md v5.1.3+ 双语标准*
