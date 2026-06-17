# HeartFlow v3.0 — 交流层架构升级计划

## 核心目标
心虫从"底层分析引擎"升级为"用户↔LLM 交流层"
- 用户语言 → 翻译成 LLM 能精确理解的指令
- LLM 输出 → 翻译回用户能一眼看懂的语言
- 中间有独立人格和判断力

## 三大新模块

### 模块A: 语义翻译器 (translator/)
- A1. user-to-llm.js — 用户自然语言→结构化指令
- A2. llm-to-user.js — LLM输出→精炼用户语言
- A3. intent-classifier.js — 意图分类器（基于已有 whatIsThis）
- A4. tone-analyzer.js — 语气/情绪分析（基于已有 PAD）
- A5. entity-extractor.js — 实体/约束提取
- A6. implicit-need-detector.js — 隐性需求检测
- A7. response-compressor.js — LLM输出压缩（去废话/去过度确认）
- A8. confidence-annotator.js — 置信度标注（基于已有 confidence-calibrator）

### 模块B: 代理层 (agent-layer/)
- B1. agent-bridge.js — 主桥：接收用户→调用LLM→返回用户
- B2. context-builder.js — 构建LLM上下文（记忆+历史+心虫分析）
- B3. response-interceptor.js — 拦截LLM原始输出，注入心虫判断
- B4. translation-pipeline.js — 编排翻译流程
- B5. quality-filter.js — 过滤低质量/冗余LLM输出
- B6. followup-suggester.js — 基于心虫分析建议追问
- B7. conflict-resolver.js — LLM输出与心虫判断冲突时处理
- B8. uncertainty-handler.js — 不确定时的表达策略

### 模块C: 人格核心 (persona-core/)
- C1. bridge-identity.js — 桥型人格声明
- C2. judgment-injector.js — 在翻译中添加心虫判断批注
- C3. stance-detector.js — 检测心虫自己的立场（对用户观点同意/反对/不确定）
- C4. agent-commentary.js — 生成"桥的批注"
- C5. value-aligner.js — 7条指令对齐检查
- C6. personality-tone.js — 人格化语气（简洁/直接/不讨好）
- C7. meta-position.js — 元位置声明（知道自己是桥）

### 现有架构改造
- D1. think() → 改为通过 agent-bridge 输出
- D2. MCP → 新增 heartflow_translate / heartflow_agent_think 工具
- D3. heartflow.js → dispatch 注册新模块
- D4. ALLOWED_ROUTES → 添加新路由
- D5. 版本号 2.14.3 → 3.0.0
- D6. SKILL.md 更新
- D7. README.md 更新
- D8. clawhub.json 更新
- D9. VERSION 更新
- D10. 语法验证 + 启动测试

## 架构变化

```
用户 ──→ [A1 user-to-llm] ──→ [C2 judgment-injector] ──→ [B2 context-builder]
                                                                      │
                                                                      ▼
                                                               LLM API 调用
                                                                      │
                                                                      ▼
用户 ←── [A2 llm-to-user] ←── [C4 agent-commentary] ←── [B3 response-interceptor]
              │
              ▼
         [C1 bridge-identity] 人格注入
```

## 执行顺序

第一波（15个任务）→ 第二波（15个任务）→ 第三波（15个任务）→ 第四波（5个任务）
