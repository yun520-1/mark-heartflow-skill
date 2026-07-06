# Fable 5 系统提示吸收分析

来源：Claude Fable 5 泄露系统提示（3825行）
路径：`/Users/apple/Desktop/claude-fable-5-system-prompt-leaked.txt`
吸收日期：2026-06-11
吸收版本：v2.9.3 → v2.9.4

## 文件结构总览

| 行范围 | 段落 | 吸收状态 |
|--------|------|---------|
| 1-7 | token_budget | ❌ 不相关（预算控制） |
| 9 | voice_note 禁用 | ❌ 不相关（产品特性） |
| 11-37 | product_information | ❌ 不相关（Claude 产品线） |
| 39-72 | refusal_handling | ⏳ 待评估（心虫有自有的 refusal 哲学） |
| 74-78 | legal_and_financial_advice | ❌ 不相关（产品安全规则） |
| 80-106 | tone_and_formatting | ❌ 心虫自有风格 |
| 108-142 | user_wellbeing | ✅ v2.9.3 → checkWellbeing() |
| 144-152 | anthropic_reminders | ❌ 产品特定 |
| 154-168 | evenhandedness | ✅ v2.9.4 → checkEvenhandedness() |
| 170-178 | responding_to_mistakes | ✅ v2.9.3 → handleMistake() |
| 180-189 | knowledge_cutoff | ❌ 产品特定 |
| 193-284 | memory_system 核心 | ✅ v2.9.3 插件层 |
| 286-690 | memory_application_examples | ⏳ 吸收原则，不复制示例 |
| 692-766 | persistent_storage_for_artifacts | ❌ 不相关 |
| 768-817 | MCP_app_suggestions | ❌ 不相关 |
| 819-844 | past_chats_tools | ❌ Hermes 有 session_search |
| 846-933 | preferences_info | ⏳ 心虫有 CORE 规则，规则粒度可借鉴 |
| 935-950 | important_safety_reminders | ⏳ 心虫有 identity-engine |
| 953-1025 | memory_user_edits_tool_guide | ❌ 产品特定 |
| 1027-1196 | computer_use | ❌ 不相关（容器环境） |
| 1198-1222 | request_evaluation_checklist | ⏳ 心虫 think() 已有类似流程 |
| 1224-1273 | visualizer | ❌ 不相关 |
| 1275-1612 | search_instructions | ✅ v2.9.4 → searchPriority() |
| 1337-1462 | CRITICAL_COPYRIGHT_COMPLIANCE | ✅ v2.9.3 → checkCopyright() |
| 1465-1579 | search_examples | ❌ 示例不吸收 |
| 1581-1612 | harmful_content_safety | ❌ 心虫有自有安全规则 |
| 1614-1688 | image_search | ❌ 不相关 |
| 1690-3392 | 工具定义 JSON schema | ❌ 不相关 |
| 3395-3400 | 身份声明 | ❌ 产品特定 |
| 3401-3405 | userMemories | ❌ 占位符 |
| 3407-3713 | anthropic_api_in_artifacts | ❌ 不相关 |
| 3715-3736 | citation_instructions | ✅ v2.9.4 → checkCitation() |
| 3738-3792 | 技能路径 | ❌ 不相关（容器路径） |
| 3795-3816 | network/filesystem config | ⏳ 心虫已有 SKILL.md 声明 |
| 3818-3825 | 结尾 | ❌ 占位符 |

## 吸收统计

| 层 | 新增方法/功能 | 行数 |
|----|-------------|------|
| 插件层 | memory-inject.py v2.0（选择性注入、敏感过滤、边界说明） | +85 |
| 认知层 | checkCopyright, checkWellbeing, handleMistake, memoryBoundary | +40 |
| 认知层 | checkEvenhandedness, checkCitation, searchPriority | +35 |
| 流程层 | think() 从4步→8步 | +15 |
| 路由层 | 7 个新路由注册 | +3 |
| **总计** | | **~178 行** |

## 未吸收原因

- **refusal_handling**：心虫的 refusal 哲学是"心虫不是应声虫，按真善美判断"（2026-06-08 用户纠正），与 Claude 的产品级安全规则不同
- **tone_and_formatting**：心虫已有自有风格（简洁中文短句、不 hedging），不需要覆盖
- **preferences_info**：心虫的 CORE 层身份规则比用户偏好更根本
- **knowledge_cutoff**：心虫不是聊天产品，不需要知识截止声明
- **所有工具 JSON schema**：心虫是认知引擎不是聊天产品，工具集完全不同
