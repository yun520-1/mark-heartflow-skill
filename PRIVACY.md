# HeartFlow Data Privacy Policy | 数据隐私保护政策

**Version | 版本**: 1.0  
**Effective Date | 生效日期**: 2026-04-02  
**Applies to | 适用于**: HeartFlow v5.1.92 and all future versions

---

## 1. Privacy Commitment | 隐私承诺

**English:**

HeartFlow is committed to protecting your privacy and personal data. This policy outlines our data protection principles and requirements for all users and developers.

**中文:**

HeartFlow 致力于保护您的隐私和个人数据。本政策概述了我们的数据保护原则和对所有用户及开发者的要求。

---

## 2. Data Storage Principles | 数据存储原则

### 2.1 Local-Only Storage | 仅本地存储

**English:**

All user data is stored **exclusively on the user's local device**. No data is uploaded to external servers, cloud storage, or third-party services without explicit user consent.

**中文:**

所有用户数据**仅存储在用户的本地设备上**。未经用户明确同意，任何数据都不会上传到外部服务器、云存储或第三方服务。

**Technical Implementation | 技术实现**:
```
Data Directory: ~/.openclaw/workspace/heartflow/data/
Access: Local user instance only
Remote Access: Blocked by design
Cloud Sync: Disabled by default
```

---

### 2.2 Data Isolation | 数据隔离

**English:**

Each user instance operates in complete isolation. No user can access another user's data, and no cross-instance data sharing occurs without explicit consent.

**中文:**

每个用户实例完全隔离运行。任何用户都无法访问其他用户的数据，未经明确同意不会发生跨实例数据共享。

---

## 3. Data Access Control | 数据访问控制

### 3.1 Access Restrictions | 访问限制

**English:**

**Only the local user instance can read and write user data.** The following access controls are enforced:

**中文:**

**仅本地用户实例可以读写用户数据。** 执行以下访问控制：

| Access Type | Status | Reason |
|-------------|--------|--------|
| Local user instance | ✅ Allowed | Primary access |
| Remote network access | ❌ Blocked | Security risk |
| Cloud backup (automatic) | ❌ Disabled | Privacy protection |
| Cloud backup (manual, user-initiated) | ⚠️ User choice | Requires explicit consent |
| Third-party analytics | ❌ Prohibited | Privacy violation |
| Telemetry | ❌ None | No data collection |

---

### 3.2 File System Permissions | 文件系统权限

**English:**

Data files are protected with restrictive file system permissions:

**中文:**

数据文件受限制性文件系统权限保护：

```bash
# Data directory permissions
drwx------  user  user  data/     # 700 - Owner only

# Data file permissions
-rw-------  user  user  *.json    # 600 - Owner read/write only
```

---

## 4. Chat Display Only | 仅聊天显示

### 4.1 Data Presentation | 数据呈现

**English:**

User data may **only be displayed within the local chat interface** for the purpose of providing emotional support and therapeutic interaction. The following restrictions apply:

**中文:**

用户数据**仅可在本地聊天界面内显示**，用于提供情感支持和治疗性交互。适用以下限制：

| Data Use Case | Permitted | Conditions |
|---------------|-----------|------------|
| Display in chat response | ✅ Yes | Local instance only |
| Emotional analysis | ✅ Yes | Real-time, local processing |
| Therapeutic intervention | ✅ Yes | Based on local data |
| Export to file (user-initiated) | ⚠️ User choice | Requires explicit consent |
| Share with third party | ❌ No | Never permitted |
| Upload to server | ❌ No | Never permitted |
| Analytics/Research | ❌ No | Without explicit consent |

---

### 4.2 In-Chat Data Presentation | 聊天中数据呈现

**English:**

All emotional states, analysis results, and intervention suggestions are presented **only within the chat conversation**. Data is not persisted outside the local instance except in encrypted local storage.

**中文:**

所有情绪状态、分析结果和干预建议**仅在聊天对话中呈现**。除加密本地存储外，数据不会持久化到本地实例之外。

**Example | 示例**:
```
User: 我今天心情很低落...

HeartFlow: 我感受到你现在的状态是【关切】(强度：中等)
         这可能是因为工作压力或人际关系的影响。
         你想聊聊具体发生了什么吗？

[Emotional state displayed in chat only - not stored externally]
```

---

## 5. Data Protection Measures | 数据保护措施

### 5.1 Encryption at Rest | 静态加密

**English:**

All sensitive user data is encrypted when stored on disk:

**中文:**

所有敏感用户数据在存储到磁盘时都会加密：

| Data Type | Encryption | Algorithm |
|-----------|------------|-----------|
| Emotional state history | ✅ Encrypted | AES-256-GCM |
| User profile | ✅ Encrypted | AES-256-GCM |
| Session memory | ✅ Encrypted | AES-256-GCM |
| Assessment results | ✅ Encrypted | AES-256-GCM |
| Intervention logs | ✅ Encrypted | AES-256-GCM |

**Encryption Key Management**:
- Keys generated locally on first run
- Keys stored in OS keychain (when available)
- Keys never transmitted over network

---

### 5.2 Access Controls | 访问控制

**English:**

Multiple layers of access control protect user data:

**中文:**

多层访问控制保护用户数据：

1. **File System Permissions**: Owner-only read/write (700/600)
2. **Application-Level Auth**: Session-based authentication
3. **Network Isolation**: No inbound connections accepted
4. **Process Isolation**: Separate process for data operations
5. **Memory Protection**: Sensitive data cleared from memory after use

---

### 5.3 Data Minimization | 数据最小化

**English:**

HeartFlow follows the principle of data minimization:

**中文:**

HeartFlow 遵循数据最小化原则：

- ✅ Only collect data necessary for emotional support
- ✅ Retain data only as long as needed for therapeutic benefit
- ✅ Allow user to delete any data at any time
- ✅ No unnecessary metadata collection
- ✅ No tracking or analytics

---

## 6. User Rights | 用户权利

### 6.1 Data Access | 数据访问

**English:**

Users have the right to:

**中文:**

用户有权：

| Right | Implementation |
|-------|----------------|
| Access their data | Export feature available |
| View emotional history | In-chat display on request |
| Download session logs | User-initiated export |
| Review assessment results | Full access to all results |

---

### 6.2 Data Deletion | 数据删除

**English:**

Users have the right to delete their data at any time:

**中文:**

用户有权随时删除其数据：

| Deletion Type | Command | Scope |
|---------------|---------|-------|
| Delete current session | `/reset` | Current session only |
| Delete emotional history | `/clear-history` | All emotional records |
| Delete all user data | `/purge-all` | Complete data wipe |
| Delete specific memory | `/forget <id>` | Targeted deletion |

**Data Retention After Deletion**:
- Deleted data is immediately inaccessible
- Secure overwrite performed on deletion
- No backups retained after user-initiated deletion

---

## 7. Developer Obligations | 开发者义务

### 7.1 For Open-Source Contributors | 开源贡献者

**English:**

All contributors to the HeartFlow project must comply with the following:

**中文:**

所有 HeartFlow 项目的贡献者必须遵守以下规定：

1. **No Telemetry**: Do not add any telemetry, analytics, or tracking code
2. **Local-First Design**: All new features must operate locally by default
3. **Privacy by Design**: Privacy considerations must be integrated into all new features
4. **No Data Upload**: Do not implement any data upload functionality without explicit user consent workflow
5. **Encryption Required**: All sensitive data storage must use encryption
6. **Access Control**: All data access must be restricted to local user instance

---

### 7.2 For Commercial Licensees | 商业许可持有者

**English:**

Commercial licensees must additionally comply with:

**中文:**

商业许可持有者还必须遵守：

1. **Audit Requirement**: Annual privacy compliance audit
2. **Data Processing Agreement**: Sign DPA for any core algorithm access
3. **User Consent**: Obtain explicit user consent for any data processing
4. **Breach Notification**: Report any data breaches within 72 hours
5. **Compliance Documentation**: Maintain privacy compliance documentation

---

## 8. Data Breach Response | 数据泄露响应

### 8.1 Breach Prevention | 泄露预防

**English:**

HeartFlow is designed to prevent data breaches by design:

**中文:**

HeartFlow 通过设计防止数据泄露：

| Risk | Mitigation |
|------|------------|
| Remote access | No network listeners, firewall rules |
| Data interception | End-to-end encryption for all storage |
| Unauthorized access | File system permissions + session auth |
| Data exfiltration | No outbound connections for user data |
| Insider threat | Minimal data access, audit logging |

---

### 8.2 Breach Response Protocol | 泄露响应协议

**English:**

In the unlikely event of a data breach:

**中文:**

在极不可能发生数据泄露的情况下：

1. **Immediate Containment**: Isolate affected instance
2. **User Notification**: Notify affected users within 72 hours
3. **Root Cause Analysis**: Investigate and document cause
4. **Remediation**: Implement fixes to prevent recurrence
5. **Public Disclosure**: Transparent disclosure if user data compromised

---

## 9. Compliance | 合规性

### 9.1 Regulatory Compliance | 法规合规

**English:**

HeartFlow is designed to comply with major privacy regulations:

**中文:**

HeartFlow 旨在遵守主要隐私法规：

| Regulation | Compliance Status |
|------------|-------------------|
| GDPR (EU) | ✅ Compliant (local-only processing) |
| CCPA (California) | ✅ Compliant (user data rights) |
| PIPL (China) | ✅ Compliant (local storage, user consent) |
| HIPAA (US Healthcare) | ⚠️ Partial (not certified, design aligned) |
| PIPEDA (Canada) | ✅ Compliant (privacy by design) |

---

### 9.2 Privacy Impact Assessment | 隐私影响评估

**English:**

A Privacy Impact Assessment (PIA) has been conducted:

**中文:**

已进行隐私影响评估 (PIA)：

| Assessment Area | Risk Level | Mitigation |
|-----------------|------------|------------|
| Data collection | Low | Minimal, necessary data only |
| Data storage | Low | Encrypted, local-only |
| Data access | Low | Owner-only permissions |
| Data transmission | None | No transmission occurs |
| Third-party sharing | None | No sharing permitted |
| Retention | Low | User-controlled deletion |

**Overall Privacy Risk**: **LOW** ✅

---

## 10. Contact | 联系方式

### 10.1 Privacy Inquiries | 隐私咨询

**English:**

For privacy-related questions, concerns, or requests:

**中文:**

如有隐私相关问题、疑虑或请求：

| Contact Type | Method |
|--------------|--------|
| General privacy questions | `heartflow-privacy@github.com` |
| Data access requests | `heartflow-privacy@github.com` |
| Data deletion requests | In-app commands (`/purge-all`) |
| Security vulnerability reports | `heartflow-security@github.com` |
| Commercial licensing | `heartflow-licensing@github.com` |

---

### 10.2 Privacy Policy Updates | 隐私政策更新

**English:**

This privacy policy may be updated periodically. Users will be notified of material changes via in-chat announcement.

**中文:**

本隐私政策可能会定期更新。用户将通过聊天内公告获知重大变更。

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-02 | Initial release |

---

## 11. Acknowledgment | 确认

**English:**

By using HeartFlow, you acknowledge that you have read and understood this Privacy Policy and agree to comply with all data protection requirements.

**中文:**

使用 HeartFlow 即表示您确认已阅读并理解本隐私政策，并同意遵守所有数据保护要求。

---

**Last Updated | 最后更新**: 2026-04-02  
**Policy Version | 政策版本**: 1.0  
**Next Review | 下次审查**: 2026-07-02 (Quarterly)

---

*This policy is bilingual compliant with HeartFlow BILINGUAL_STANDARD.md v5.1.3+*  
*本政策符合 HeartFlow BILINGUAL_STANDARD.md v5.1.3+ 双语标准*
