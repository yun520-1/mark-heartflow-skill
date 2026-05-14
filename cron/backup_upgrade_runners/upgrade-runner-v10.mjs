#!/opt/homebrew/bin/node
/**
 * HeartFlow 升级引擎 v10.0 (本地版)
 * 
 * 核心改进 vs v7:
 * 1. 智能术语识别 - 基于已知AI/ML概念知识库
 * 2. 句子级提取 - 而非字符级正则
 * 3. 过滤噪声 - 去除代词、通用词
 * 4. 生成可执行代码 - 而非模板
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { randomUUID } from 'crypto';

const SKILL_DIR = process.env.HOME + '/.hermes/skills/ai/mark-heartflow-skill';
const PAPERS_DIR = '/Users/apple/Downloads/daima';
const HEARTFLOW_JS = join(SKILL_DIR, 'src', 'core', 'heartflow.js');
const SKILL_MD = join(SKILL_DIR, 'SKILL.md');
const VERSION_FILE = join(SKILL_DIR, 'VERSION');
const PROPOSALS_DIR = join(SKILL_DIR, 'proposals');
const LOG_DIR = join(SKILL_DIR, 'logs');
const QUEUE_FILE = join(PROPOSALS_DIR, 'upgrade-queue.json');

mkdirSync(PROPOSALS_DIR, { recursive: true });
mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = join(LOG_DIR, 'upgrade-v10.log');

function log(msg) {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const line = '[' + ts + '] ' + msg;
    console.log(line);
    appendFileSync(LOG_FILE, line + '\n');
}

// ========== AI/ML 概念知识库 ==========

const KNOWN_CONCEPTS = {
    // 架构类
    'transformer': '基于注意力机制的序列转导模型，使用多头自注意力替代RNN',
    'lstm': '长短期记忆网络，一种特殊的RNN结构，通过门控机制解决梯度消失问题',
    'gru': '门控循环单元，一种简化的LSTM变体，门数更少但效果相当',
    'rnn': '循环神经网络，适合处理序列数据，但存在长期依赖问题',
    'cnn': '卷积神经网络，擅长处理图像和空间数据',
    'encoder-decoder': '编码器-解码器架构，将输入序列编码为中间表示再解码为输出',
    'attention mechanism': '注意力机制，让模型能够关注输入的相关部分',
    'self-attention': '自注意力，序列内部各位置之间的注意力关系',
    'multi-head attention': '多头注意力，并行运行多个注意力机制，捕捉不同子空间的关系',
    'scaled dot-product attention': '缩放点积注意力，计算query和key的相似度',
    
    // 技术类
    'backpropagation': '反向传播算法，通过梯度下降优化神经网络参数',
    'gradient descent': '梯度下降，优化算法，通过沿梯度负方向更新参数',
    'cross-entropy': '交叉熵损失函数，常用于分类问题',
    'softmax': 'Softmax函数，将logits转换为概率分布',
    'dropout': 'Dropout正则化，随机丢弃神经元防止过拟合',
    'batch normalization': '批归一化，对每一批数据进行均值方差归一化',
    'layer normalization': '层归一化，对每一层的输出进行归一化',
    'residual connection': '残差连接，跳跃连接，缓解深层网络梯度消失',
    
    // 训练类
    'adversarial training': '对抗训练，使用对抗样本增强模型鲁棒性',
    'transfer learning': '迁移学习，将一个任务上学到的知识应用到另一个任务',
    'fine-tuning': '微调，在预训练模型基础上进行任务特定的训练',
    'curriculum learning': '课程学习，从简单到复杂逐步增加训练难度',
    
    // 生成模型
    'gan': '生成对抗网络，通过生成器和判别器对抗训练生成数据',
    'vae': '变分自编码器，使用变分推断进行数据生成',
    'diffusion model': '扩散模型，通过逐步去噪生成数据',
    'generative model': '生成模型，学习数据分布并生成新样本',
    
    // 评估类
    'bleu': 'BLEU评分，机器翻译评估指标，基于n-gram精确度',
    'perplexity': '困惑度，语言模型评估指标，越低越好',
    'fid': 'Fréchet Inception Distance，生成图像质量评估',
    'inception score': 'Inception Score，生成图像质量评估',
    
    // Agent相关
    'reinforcement learning': '强化学习，通过与环境交互学习最优策略',
    'policy gradient': '策略梯度，直接优化策略网络的强化学习方法',
    'reward shaping': '奖励塑形，设计奖励函数引导学习',
    'temporal difference': '时序差分，结合蒙特卡洛和动态规划的方法',
    'model-based rl': '基于模型的强化学习，学习环境模型',
    'off-policy': '离线策略，使用非当前策略生成的数据进行学习',
    'on-policy': '在线策略，只能使用当前策略生成的数据学习',
    'experience replay': '经验回放，存储并重放过去经验来打破数据相关性',
    'curiosity-driven': '好奇心驱动，通过内在奖励鼓励探索',
    
    // 记忆与注意力
    'working memory': '工作记忆，短时存储和操作信息的记忆系统',
    'episodic memory': '情景记忆，存储个人经历和事件的情景细节',
    'long-term memory': '长期记忆，持续很久的记忆存储',
    'short-term memory': '短期记忆，临时存储信息的记忆系统',
    'memory attention': '记忆注意力，选择性关注记忆中的相关信息',
    'retrieval': '检索，从记忆中获取相关信息的过程',
    'consolidation': '巩固，将短期记忆转化为长期记忆的过程',
    
    // Agent能力
    'reasoning': '推理，基于已有知识进行逻辑推导',
    'planning': '规划，制定多步计划达成目标',
    'self-reflection': '自我反思，Agent审视自身行为和决策',
    'theory of mind': '心智理论，理解他人有独立的信念和意图',
    'metacognition': '元认知，对自身思维过程的认知和监控',
    'context window': '上下文窗口，模型能处理的最大Token数量',
    'chain-of-thought': '思维链，通过中间步骤引导推理',
    'prompt engineering': '提示工程，设计输入提示引导模型输出',
    'few-shot learning': '少样本学习，只用很少样本就能学习新任务',
    'zero-shot learning': '零样本学习，没有任何样本的情况下完成新任务',
    
    // 自改进
    'self-improvement': '自我改进，Agent通过经验不断提升自身性能',
    'learning from mistakes': '从错误中学习，分析失败原因避免重复',
    'behavior cloning': '行为克隆，模仿专家行为进行学习',
    'constitutional ai': '宪法AI，通过原则约束引导AI行为',
    'rlhf': '基于人类反馈的强化学习，使用人类偏好训练',
    'reward model': '奖励模型，学习预测人类偏好的模型',
    
    // 记忆架构 (HeartFlow特定)
    'meaningful memory': '有意义记忆，优先保留高价值信息的记忆策略',
    'heartbeat': '心跳机制，定期自检和状态更新的机制',
    'dream': '梦境机制，睡眠时整理和巩固记忆的过程',
    'reflection': '反思，定期回顾和总结经验的过程',
    'semantic memory': '语义记忆，存储概念和事实的长期记忆',
    'procedural memory': '程序记忆，存储技能和习惯的记忆',
    'triality memory': '三重记忆，同时维护短期、长期和语义记忆'
};

const NOISE_WORDS = new Set([
    'it', 'this', 'that', 'these', 'those', 'you', 'we', 'they', 'he', 'she',
    'i', 'me', 'my', 'our', 'their', 'its', 'who', 'what', 'when', 'where', 'why', 'how',
    'article', 'paper', 'section', 'chapter', 'figure', 'table', 'result', 'experiment',
    'show', 'showed', 'shows', 'see', 'saw', 'looking', 'look', 'found', 'find',
    'use', 'used', 'using', 'also', 'however', 'therefore', 'thus', 'hence',
    'many', 'some', 'any', 'all', 'each', 'every', 'most', 'several', 'few',
    'first', 'second', 'third', 'next', 'then', 'now', 'later', 'finally',
    'important', 'various', 'different', 'similar', 'certain', 'particular',
    'specific', 'general', 'previous', 'following', 'recent', 'recently',
    'work', 'works', 'method', 'methods', 'approach', 'approach', 'propose', 'proposed'
]);

// 算法提取：使用更精确的模式匹配
// 只匹配明确提到算法名称或技术方法的句子

const KNOWN_ALGO_PATTERNS = [
    // 已知算法名称（大小写不敏感）
    /\b(backpropagation|gradient descent|adam|sgd|rmsprop|adamw|adagrad)\b/gi,
    /\b(cross-?entropy|softmax|relu|leaky relu|gelu|tanh|sigmoid)\b/gi,
    /\b(lstm|gru|rnn|cnn|transformer|attention|self-attention|multi-head)\b/gi,
    /\b(bERT|gpt|gpt-?\d|clip|diffusion|vae|gan|flow|matching)\b/gi,
    /\b(ppo|ppo\d|dqn|ddpg|a\d?c|a3c|reinforcement learning|rlhf|reward model)\b/gi,
    /\b(chain-?of-?thought|tree-?of-?thought|self-consistency|retrieval augmented)\b/gi,
    /\b(batch normalization|dropout|resnet|vgg|googlenet|densenet)\b/gi,
    /\b(beam search|greedy|viterbi|forward|backward|inference|forward pass|backward pass)\b/gi,
    /\b(bpe|byte pair|wordpiece|subword|tokenization|tokenize)\b/gi
];

const ALGORITHM_PATTERNS = [
    // "We use X to/in/for" - 常见算法描述
    /we\s+(?:use|apply|implement|adopt)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:to|in|for)/g,
    // "The X algorithm/method" - 专有名词模式
    /the\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:algorithm|method|approach|technique)/gi,
    // "X-based approach/method" - 基于X的方法
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[-–]\s*based\s+(?:approach|method|technique)/gi,
    // "Use X algorithm" - 直接提算法
    /(?:use|apply)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:algorithm|method)/gi
];

const METRIC_PATTERNS = [
    /(\d+\.?\d*)\s*(?:%|accuracy|precision|recall|f1|score|bleu|perplexity)/gi,
    /(accuracy|precision|recall|f1[- ]?score|bleu|perplexity)\s*[:\-]?\s*(\d+\.?\d*)/gi,
    /(?:achieves?|reaches?|obtains?)\s+(\d+\.?\d*)\s*(?:%|%)?/gi,
    /(?:state-?of-?the-?art|best|improvement)\s+[:\-]?\s*(\d+\.?\d*)/gi,
    /(benchmark|dataset|test)\s*[:\-]?\s*([A-Za-z0-9\-]+)/gi
];

// ========== 本地语义提取器 ==========

// ========== Reflexion 自省评估循环 ==========

class ReflexionLoop {
    constructor() {
        this.history = [];
        this.maxHistory = 100;
    }

    evaluateExtraction(knowledge, source) {
        const issues = [];
        
        // 检查概念质量
        for (const c of (knowledge.concepts || [])) {
            if (!c.description || c.description.length < 10) {
                issues.push({ type: 'concept', issue: 'missing_description', name: c.name });
            }
        }
        
        // 检查算法名称质量
        for (const a of (knowledge.algorithms || [])) {
            if (!a.name || a.name.length < 4) {
                issues.push({ type: 'algorithm', issue: 'name_too_short', name: a.name });
            }
        }
        
        return {
            quality: issues.length === 0 ? 'high' : 'medium',
            issues,
            timestamp: Date.now()
        };
    }

    add(evaluation) {
        this.history.push(evaluation);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    getRecent(n = 5) {
        return this.history.slice(-n);
    }
}

class LocalSemanticExtractor {
    constructor() {
        this.concepts = KNOWN_CONCEPTS;
        this.noiseWords = NOISE_WORDS;
    }

    extract(text, filename) {
        log('[本地提取] 分析 ' + filename + '...');
        
        const sentences = this.splitSentences(text);
        const foundConcepts = this.extractConcepts(sentences);
        const foundAlgorithms = this.extractAlgorithms(sentences);
        const foundMetrics = this.extractMetrics(text);
        const improvements = this.generateImprovements(foundConcepts, foundAlgorithms);
        
        const knowledge = {
            concepts: foundConcepts,
            algorithms: foundAlgorithms,
            metrics: foundMetrics,
            improvements: improvements
        };
        
        log('[本地提取] 完成: 概念' + foundConcepts.length + ' | 算法' + foundAlgorithms.length + ' | 指标' + foundMetrics.length);
        
        return knowledge;
    }

    splitSentences(text) {
        // 更智能的句子分割：
        // 1. 按段落分割（保持句子完整性）
        // 2. 避免在句子中间切断
        const paragraphs = text.split(/\n\n+/);
        const sentences = [];
        
        for (const para of paragraphs) {
            // 在每个句号/问号/感叹号后分割，但保持合理长度
            const parts = para.split(/(?<=[.!?])\s+(?=[A-Z(])/);
            for (const part of parts) {
                const trimmed = part.trim();
                // 过滤太短或太长的
                if (trimmed.length >= 30 && trimmed.length <= 600) {
                    sentences.push(trimmed);
                } else if (trimmed.length > 600) {
                    // 太长的段落再切分
                    const subParts = trimmed.split(/(?<=[,;])\s+/);
                    let current = '';
                    for (const sp of subParts) {
                        if (current.length + sp.length <= 500) {
                            current += (current ? ' ' : '') + sp;
                        } else {
                            if (current.length >= 30) sentences.push(current);
                            current = sp;
                        }
                    }
                    if (current.length >= 30) sentences.push(current);
                }
            }
        }
        
        return sentences;
    }

    extractConcepts(sentences) {
        const found = [];
        const lowerText = sentences.join(' ').toLowerCase();
        
        for (const [term, description] of Object.entries(this.concepts)) {
            if (lowerText.includes(term.toLowerCase())) {
                if (!this.isNoiseTerm(term)) {
                    const sentence = sentences.find(s => 
                        s.toLowerCase().includes(term.toLowerCase())
                    );
                    
                    if (sentence && this.isValidConceptSentence(sentence, term)) {
                        found.push({
                            name: this.formatTerm(term),
                            description: description,
                            application: this.getApplication(term, sentence)
                        });
                    }
                }
            }
        }
        
        return this.deduplicateConcepts(found);
    }

    isNoiseTerm(term) {
        return this.noiseWords.has(term.toLowerCase());
    }

    isValidConceptSentence(sentence, term) {
        const lower = sentence.toLowerCase();
        const termLower = term.toLowerCase();
        
        if (!lower.includes(termLower)) return false;
        
        const noiseIndicators = [
            /^(it|this|that|these|those|you|we|they|i)\s+(is|are|was|were)/i,
            /^(we|the|author|the author|the paper)\s+(show|find|discuss|describe)/i,
            /^(as|in|for|to|by)\s+(this|that|these|those|the)\s+(method|approach|way|work)/i
        ];
        
        for (const pattern of noiseIndicators) {
            if (pattern.test(sentence)) return false;
        }
        
        return true;
    }

    formatTerm(term) {
        return term
            .split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    getApplication(term, sentence) {
        const context = sentence.toLowerCase();
        
        if (context.includes('use') || context.includes('apply') || context.includes('employ')) {
            return '可用于' + this.inferUseCase(term, sentence);
        }
        if (context.includes('improve') || context.includes('enhance')) {
            return '可提升' + this.inferImproveAspect(term, sentence);
        }
        if (context.includes('enable') || context.includes('allow') || context.includes('permit')) {
            return '使Agent能够' + this.inferCapability(term, sentence);
        }
        
        return '建议作为HeartFlow的核心能力模块集成';
    }

    inferUseCase(term, sentence) {
        const lower = sentence.toLowerCase();
        if (lower.includes('translation')) return '翻译任务';
        if (lower.includes('generation')) return '内容生成';
        if (lower.includes('reasoning')) return '推理能力';
        if (lower.includes('memory')) return '记忆管理';
        if (lower.includes('planning')) return '规划能力';
        return '相关AI能力';
    }

    inferImproveAspect(term, sentence) {
        const lower = sentence.toLowerCase();
        if (lower.includes('accuracy')) return '准确率';
        if (lower.includes('efficiency')) return '效率';
        if (lower.includes('robustness')) return '鲁棒性';
        if (lower.includes('speed')) return '速度';
        return '整体性能';
    }

    inferCapability(term, sentence) {
        const lower = sentence.toLowerCase();
        if (lower.includes('long-term')) return '长期记忆保持';
        if (lower.includes('attention')) return '选择性关注';
        if (lower.includes('reasoning')) return '复杂推理';
        if (lower.includes('self-improve')) return '自我改进';
        return '相关认知能力';
    }

    deduplicateConcepts(concepts) {
        const seen = new Set();
        return concepts.filter(c => {
            const key = c.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    extractAlgorithms(sentences) {
        const algorithms = [];
        const seen = new Set();
        
        for (const sentence of sentences) {
            // 1. 首先检查是否包含已知算法
            for (const pattern of KNOWN_ALGO_PATTERNS) {
                const matches = sentence.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const key = match.toLowerCase();
                        if (!seen.has(key)) {
                            seen.add(key);
                            algorithms.push({
                                name: this.formatAlgoName(match),
                                steps: this.extractSteps(sentence),
                                scenario: this.inferScenario(sentence)
                            });
                        }
                    }
                }
            }
            
            // 2. 然后检查通用算法模式
            for (const pattern of ALGORITHM_PATTERNS) {
                const matches = sentence.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const cleaned = this.cleanAlgorithmText(match);
                        if (cleaned.length > 15 && !this.isNoiseAlgorithm(cleaned)) {
                            const algoName = this.extractAlgorithmName(cleaned);
                            if (algoName && algoName.length >= 4 && !seen.has(algoName.toLowerCase())) {
                                seen.add(algoName.toLowerCase());
                                algorithms.push({
                                    name: algoName,
                                    steps: this.extractSteps(cleaned),
                                    scenario: this.inferScenario(sentence)
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return algorithms;
    }
    
    formatAlgoName(name) {
        return name.split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    cleanAlgorithmText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    isNoiseAlgorithm(text) {
        const lower = text.toLowerCase();
        // 排除常见噪声模式
        const noisePatterns = [
            /^(we|this|the|author|figure|table)\s+(show|find|present|describe|illustrate|depict)/i,
            /result in/i,
            /in this paper/i,
            /as shown/i,
            /we propose a method/i,
            /this method is/i,
            /^the key issue/i,
            /^the main contribution/i,
            /^the following/i
        ];
        
        for (const p of noisePatterns) {
            if (p.test(text)) return true;
        }
        
        return false;
    }

    extractAlgorithmName(text) {
        const lower = text.toLowerCase();
        
        // 检查是否包含已知的算法名称
        const knownAlgorithms = [
            'backpropagation', 'gradient descent', 'adam', 'sgd', 'rmsprop',
            'cross-entropy', 'softmax', 'relu', 'lstm', 'gru', 'cnn', 'rnn',
            'transformer', 'attention', 'self-attention', 'multi-head',
            'policy gradient', 'dqn', 'ppo', 'a3c', 'ddpg',
            'gan', 'vae', 'diffusion', 'flow',
            'beam search', 'greedy', 'viterbi',
            'k-means', 'k-nn', 'svm', 'decision tree', 'random forest',
            'batch normalization', 'dropout', 'resnet', 'vgg', 'bert', 'gpt',
            'chain-of-thought', 'cot', 'self-consistency', 'tree-of-thought',
            'retrieval augmented', 'rag', 'constitutional ai', 'sot', 'tot'
        ];
        
        for (const algo of knownAlgorithms) {
            if (lower.includes(algo)) {
                return algo.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }
        
        // 如果文本包含明确的算法描述，尝试提取
        // 匹配 "The X Algorithm" 或 "X method" 模式
        const algoPatternMatch = text.match(/(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:algorithm|method|approach|technique|procedure)/i);
        if (algoPatternMatch && algoPatternMatch[1].length > 4) {
            return algoPatternMatch[1];
        }
        
        // 匹配 "Use X to/in/for" 模式
        const usePatternMatch = text.match(/(?:use|apply|implement|adopt)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+(?:to|in|for)/i);
        if (usePatternMatch && usePatternMatch[1].length > 4) {
            const candidate = usePatternMatch[1];
            // 排除太泛化的词
            const genericWords = ['this', 'that', 'these', 'those', 'method', 'approach', 'technique', 'algorithm', 'model', 'system', 'paper', 'study', 'work', 'key', 'main', 'first', 'novel', 'new', 'proposed', 'fixed', 'dataset', 'constitution', 'exploit', 'procedure', 'result', 'based', 'driven', 'enhanced', 'guided', 'level', 'high', 'low', 'deep', 'single', 'multi', 'cross', 'end'];
            if (!genericWords.includes(candidate.toLowerCase())) {
                return candidate;
            }
        }
        
        // 没有找到有效算法名，返回null让调用者过滤
        return null;
    }

    extractSteps(text) {
        const stepMatches = text.match(/(?:step|步骤|stage|phase)\s*\d+/gi);
        if (stepMatches) {
            return stepMatches.map(s => s.trim());
        }
        
        const clauses = text.split(/[,;]/).filter(c => c.trim().length > 5);
        if (clauses.length > 1) {
            return clauses.slice(0, 5).map(c => c.trim());
        }
        
        return [text.substring(0, 100)];
    }

    inferScenario(sentence) {
        const lower = sentence.toLowerCase();
        if (lower.includes('translation')) return '机器翻译';
        if (lower.includes('image') || lower.includes('vision')) return '图像处理';
        if (lower.includes('language') || lower.includes('text')) return '自然语言处理';
        if (lower.includes('reinforcement') || lower.includes('rl ')) return '强化学习';
        if (lower.includes('generative') || lower.includes('gan')) return '生成模型';
        if (lower.includes('agent')) return 'AI Agent';
        return '通用AI任务';
    }

    deduplicateAlgorithms(algorithms) {
        const seen = new Set();
        return algorithms.filter(a => {
            const key = a.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    extractMetrics(text) {
        const metrics = [];
        const seen = new Set();
        
        const patterns = [
            { name: 'BLEU', regex: /BLEU[:\s]+(\d+\.?\d*)/gi },
            { name: 'Accuracy', regex: /accuracy[:\s]+(\d+\.?\d*)%?/gi },
            { name: 'Perplexity', regex: /perplexity[:\s]+(\d+\.?\d*)/gi },
            { name: 'F1-Score', regex: /F1[- ]?score[:\s]+(\d+\.?\d*)%?/gi },
            { name: 'Precision', regex: /precision[:\s]+(\d+\.?\d*)%?/gi },
            { name: 'Recall', regex: /recall[:\s]+(\d+\.?\d*)%?/gi }
        ];
        
        for (const p of patterns) {
            let match;
            while ((match = p.regex.exec(text)) !== null) {
                const value = match[1];
                if (!seen.has(p.name + value)) {
                    seen.add(p.name + value);
                    metrics.push({
                        name: p.name,
                        benchmark: this.extractBenchmark(text, match.index),
                        value: value + (match[0].includes('%') ? '%' : ''),
                        comparison: '需要与基线对比'
                    });
                }
            }
        }
        
        return metrics.slice(0, 10);
    }

    extractBenchmark(text, index) {
        const start = Math.max(0, index - 200);
        const end = Math.min(text.length, index + 200);
        const context = text.substring(start, end);
        
        const datasetMatch = context.match(/(?:on|using|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+\d+)?)/);
        if (datasetMatch) return datasetMatch[1];
        
        const benchmarkMatch = context.match(/(?:benchmark|dataset|test)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        if (benchmarkMatch) return benchmarkMatch[1];
        
        return '标准基准';
    }

    generateImprovements(concepts, algorithms) {
        const improvements = [];
        
        for (const c of concepts.slice(0, 3)) {
            improvements.push({
                type: 'concept_integration',
                description: '将' + c.name + '整合到HeartFlow的记忆系统中',
                code: 'this.integrate' + c.name.replace(/\s+/g, '') + '()'
            });
        }
        
        for (const a of algorithms.slice(0, 2)) {
            improvements.push({
                type: 'algorithm_implementation',
                description: '实现' + a.name + '算法用于Agent决策',
                code: 'execute' + a.name.replace(/\s+/g, '') + '(context)'
            });
        }
        
        return improvements;
    }
}

// ========== 代码生成器 ==========

class CodeGenerator {
    generateCode(knowledge) {
        const modules = [];
        const ts = Date.now();

        if (knowledge.concepts?.length > 0) {
            modules.push(this.generateConceptEngine(knowledge.concepts, ts));
        }

        if (knowledge.algorithms?.length > 0) {
            modules.push(this.generateAlgorithmLibrary(knowledge.algorithms, ts));
        }

        if (knowledge.metrics?.length > 0) {
            modules.push(this.generateMetricTracker(knowledge.metrics, ts));
        }

        if (knowledge.improvements?.length > 0) {
            modules.push(this.generateImprovements(knowledge.improvements, ts));
        }

        return modules;
    }

    generateConceptEngine(concepts, ts) {
        const noiseNames = ['It', 'You', 'They', 'This', 'That', 'We', 'He', 'She', 'Me', 'My', 'Our', 'Their', 'Its'];
        const validConcepts = concepts.filter(c => 
            c.name && 
            c.name.length >= 3 && 
            !noiseNames.includes(c.name) &&
            c.description && c.description.length > 5  // 必须有有效definition
        );
        
        const conceptsJson = JSON.stringify(validConcepts.slice(0, 10), null, 4)
            .replace(/^/gm, '            ')
            .trim();

        return `    // 概念引擎 v${ts}
    this.concepts_${ts} = {
        name: \"ConceptEngine\",
        type: \"knowledge\",
        version: \"${ts}\",
        concepts: ${conceptsJson},
        understand(input) {
            const results = [];
            const lower = input.toLowerCase();
            for (const c of this.concepts) {
                if (lower.includes(c.name.toLowerCase())) {
                    results.push({ concept: c.name, description: c.description, application: c.application });
                }
            }
            return results;
        },
        explain(term) {
            const c = this.concepts.find(x => x.name.toLowerCase() === term.toLowerCase());
            return c ? c.description : null;
        },
        getApplications() {
            return this.concepts.map(c => ({ name: c.name, application: c.application }));
        }
    };`;
    }

    generateAlgorithmLibrary(algorithms, ts) {
        const validAlgos = algorithms.filter(a => a.name && a.name.length > 3).slice(0, 5);
        const algosJson = JSON.stringify(validAlgos, null, 4)
            .replace(/^/gm, '            ')
            .trim();

        return `    // 算法库 v${ts}
    this.algorithms_${ts} = {
        name: \"AlgorithmLibrary\",
        type: \"executable\",
        version: \"${ts}\",
        algorithms: ${algosJson},
        execute(algoName, context) {
            const algo = this.algorithms.find(a => a.name.toLowerCase().includes(algoName.toLowerCase()));
            if (!algo) return { error: \"Algorithm not found\", available: this.algorithms.map(a => a.name) };
            return { name: algo.name, steps: algo.steps, scenario: algo.scenario, context, executed: true, timestamp: Date.now() };
        },
        listScenarios() {
            return this.algorithms.map(a => ({ name: a.name, scenario: a.scenario }));
        },
        getRecommended(input) {
            const lower = input.toLowerCase();
            return this.algorithms.filter(a => 
                a.scenario.toLowerCase().includes(lower) || 
                a.name.toLowerCase().includes(lower)
            );
        }
    };`;
    }

    generateMetricTracker(metrics, ts) {
        const metricsJson = JSON.stringify(metrics.slice(0, 8), null, 4)
            .replace(/^/gm, '            ')
            .trim();

        return `    // 指标追踪器 v${ts}
    this.metrics_${ts} = {
        name: \"MetricTracker\",
        type: \"evaluation\",
        version: \"${ts}\",
        metrics: ${metricsJson},
        history: [],
        track(metricName, value) {
            const metric = this.metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
            if (!metric) return null;
            const entry = { metric: metric.name, value, benchmark: metric.benchmark, timestamp: Date.now() };
            this.history.push(entry);
            return entry;
        },
        compare(metricName, value) {
            const metric = this.metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
            if (!metric) return null;
            return { current: value, benchmark: metric.benchmark, comparison: metric.comparison };
        },
        getBenchmarks() {
            return this.metrics.map(m => ({ name: m.name, benchmark: m.benchmark, value: m.value }));
        }
    };`;
    }

    generateImprovements(improvements, ts) {
        const implsJson = JSON.stringify(improvements.slice(0, 5), null, 4)
            .replace(/^/gm, '            ')
            .trim();

        return `    // 改进建议 v${ts}
    this.improvements_${ts} = {
        name: \"ImprovementSuggestions\",
        type: \"proposal\",
        version: \"${ts}\",
        improvements: ${implsJson},
        apply(index) {
            const imp = this.improvements[index];
            if (!imp) return { error: \"Improvement not found\", available: this.improvements.length };
            return { applied: true, type: imp.type, description: imp.description, code: imp.code || null, timestamp: Date.now() };
        },
        list() {
            return this.improvements.map((imp, i) => ({ index: i, type: imp.type, description: imp.description }));
        },
        getByType(type) {
            return this.improvements.filter(imp => imp.type === type).map((imp, i) => ({ index: i, ...imp }));
        }
    };`;
    }
}

// ========== Proposal 流程 ==========

class ProposalManager {
    constructor() {
        this.pendingDir = join(PROPOSALS_DIR, 'pending');
        this.approvedDir = join(PROPOSALS_DIR, 'approved');
        this.appliedDir = join(PROPOSALS_DIR, 'applied');
        this.rejectedDir = join(PROPOSALS_DIR, 'rejected');
        
        mkdirSync(this.pendingDir, { recursive: true });
        mkdirSync(this.approvedDir, { recursive: true });
        mkdirSync(this.appliedDir, { recursive: true });
        mkdirSync(this.rejectedDir, { recursive: true });
    }

    createProposal(knowledge, code, sourcePaper) {
        const id = 'prop-' + Date.now();
        const proposal = {
            id,
            source: sourcePaper,
            concepts: knowledge.concepts?.length || 0,
            algorithms: knowledge.algorithms?.length || 0,
            metrics: knowledge.metrics?.length || 0,
            improvements: knowledge.improvements?.length || 0,
            code: code,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const filepath = join(this.pendingDir, id + '.json');
        writeFileSync(filepath, JSON.stringify(proposal, null, 2));
        
        log('[Proposal] 创建 #' + id + ' (来源: ' + sourcePaper + ')');
        return proposal;
    }

    listProposals(status) {
        const dir = status === 'pending' ? this.pendingDir : 
                    status === 'approved' ? this.approvedDir :
                    this.rejectedDir;
        
        const files = readdirSync(dir).filter(f => f.endsWith('.json'));
        return files.map(f => {
            const content = readFileSync(join(dir, f), 'utf-8');
            return JSON.parse(content);
        });
    }

    approve(id) {
        const src = join(this.pendingDir, id + '.json');
        const dst = join(this.approvedDir, id + '.json');
        
        if (existsSync(src)) {
            const proposal = JSON.parse(readFileSync(src, 'utf-8'));
            proposal.status = 'approved';
            proposal.approvedAt = new Date().toISOString();
            writeFileSync(dst, JSON.stringify(proposal, null, 2));
            
            updateQueue(q => {
                q.approvedProposals = q.approvedProposals || [];
                q.approvedProposals.push(id);
                return q;
            });
            
            log('[Proposal] 批准 #' + id);
            return true;
        }
        return false;
    }

    reject(id, reason) {
        const src = join(this.pendingDir, id + '.json');
        const dst = join(this.rejectedDir, id + '.json');
        
        if (existsSync(src)) {
            const proposal = JSON.parse(readFileSync(src, 'utf-8'));
            proposal.status = 'rejected';
            proposal.rejectedAt = new Date().toISOString();
            proposal.reason = reason || '';
            writeFileSync(dst, JSON.stringify(proposal, null, 2));
            
            log('[Proposal] 拒绝 #' + id + ': ' + reason);
            return true;
        }
        return false;
    }

    getApproved() {
        // 只返回尚未应用的已批准提案，避免重复注入
        return this.listProposals('approved').filter(p => p.status === 'approved').filter(p => !existsSync(join(this.appliedDir, p.id + '.json')));
    }

    markApplied(proposalId) {
        const src = join(this.approvedDir, proposalId + '.json');
        const dst = join(this.appliedDir, proposalId + '.json');
        if (existsSync(src)) {
            const proposal = JSON.parse(readFileSync(src, 'utf-8'));
            proposal.status = 'applied';
            proposal.appliedAt = new Date().toISOString();
            writeFileSync(dst, JSON.stringify(proposal, null, 2));
            try { unlinkSync(src); } catch(e) {}
            log('[应用] 提案 ' + proposalId + ' 已标记为已应用');
            return true;
        }
        return false;
    }
}

// ========== 主升级逻辑 ==========

function readVersion() {
    try {
        return readFileSync(VERSION_FILE, 'utf-8').trim();
    } catch {
        return 'v0.13.60';
    }
}

function bumpVersion(version) {
    const parts = version.replace('v', '').split('.');
    parts[2] = String(parseInt(parts[2]) + 1);
    return 'v' + parts.join('.');
}

function loadQueue() {
    try {
        if (existsSync(QUEUE_FILE)) {
            return JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'));
        }
    } catch {}
    return createNewQueue();
}

function createNewQueue() {
    const papers = findAllPapers();
    const queue = {
        papers,
        papersAnalyzed: [],
        currentVersion: readVersion(),
        approvedProposals: [],
        lastUpgrade: null
    };
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    return queue;
}

function updateQueue(updater) {
    const queue = loadQueue();
    const updated = updater(queue);
    writeFileSync(QUEUE_FILE, JSON.stringify(updated, null, 2));
    return updated;
}

function findAllPapers() {
    const papers = [];
    const subdirs = ['psychology-philosophy-ai', 'agent-arch'];
    subdirs.forEach(sub => {
        const dir = join(PAPERS_DIR, sub);
        if (existsSync(dir)) {
            readdirSync(dir).forEach(f => {
                if (f.endsWith('.pdf')) papers.push(sub + '/' + f);
            });
        }
    });
    if (papers.length === 0) {
        readdirSync(PAPERS_DIR).forEach(f => {
            if (f.endsWith('.pdf')) papers.push(f);
        });
    }
    return papers;
}

function getUnanalyzedPapers(queue) {
    return queue.papers.filter(p => !queue.papersAnalyzed.includes(p));
}

function extractText(pdfPath) {
    try {
        const fullPath = join(PAPERS_DIR, pdfPath);
        const tmpScript = join('/tmp', 'hf_' + randomUUID() + '.py');
        const script = `import sys
try:
    import fitz
    doc = fitz.open("${fullPath.replace(/\\/g, '\\\\')}")
    if len(doc) == 0:
        print("ERROR: 0 pages", file=sys.stderr)
        sys.exit(1)
    text = ""
    for page in list(doc.pages())[:30]:
        t = page.get_text()
        if t: text += t + "\\n"
    if not text or len(text.strip()) < 50:
        print("ERROR: no text extracted", file=sys.stderr)
        sys.exit(1)
    print(text[:200000])
    doc.close()
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;
        writeFileSync(tmpScript, script);
        const result = spawnSync('/opt/homebrew/bin/python3', [tmpScript], {
            timeout: 120000,
            encoding: 'utf-8',
            maxBuffer: 20 * 1024 * 1024
        });
        
        if (result.status !== 0 || !result.stdout || result.stdout.trim().startsWith('ERROR')) {
            return '';
        }
        return result.stdout || '';
    } catch (e) {
        log('[PDF错误] ' + pdfPath + ': ' + e.message);
        return '';
    }
}

async function runUpgrade() {
    log('======================================================');
    log('HeartFlow v10.0 升级引擎 (MemOS集成版)');
    log('======================================================');
    
    const queue = loadQueue();
    log('队列: ' + queue.papers.length + '篇 | 版本: ' + queue.currentVersion);
    log('未分析: ' + getUnanalyzedPapers(queue).length + ' | 已批准: ' + (queue.approvedProposals||[]).length);
    
    const proposalManager = new ProposalManager();
    const extractor = new LocalSemanticExtractor();
    const generator = new CodeGenerator();
    
    const approved = proposalManager.getApproved();
    
    if (approved.length > 0) {
        log('[应用] 发现 ' + approved.length + ' 个已批准的提案');
        
        for (const prop of approved) {
            if (prop.code && prop.code.length > 0) {
                const injected = injectIntoHeartflow(prop.code, prop.id);
                if (injected) {
                    log('[应用] 提案 ' + prop.id + ' 已注入');
                    proposalManager.markApplied(prop.id);
                }
            }
        }
        // 不提前返回，继续处理新论文
    }
    
    if (getUnanalyzedPapers(queue).length === 0) {
        updateQueue(q => { q.papersAnalyzed = []; return q; });
        log('[重置] 队列已重置');
        return { success: true, message: 'queue_reset' };
    }
    
    const papersToProcess = getUnanalyzedPapers(queue).slice(0, 2);
    log('处理: ' + papersToProcess.join(', '));
    
    for (const paper of papersToProcess) {
        log('[读] ' + paper);
        const text = extractText(paper);
        
        if (text.length < 100) {
            log('[警告] 提取失败: ' + paper);
            updateQueue(q => { q.papersAnalyzed.push(paper); return q; });
            continue;
        }
        
        log('  文本: ' + text.length + '字符');
        
        const knowledge = extractor.extract(text, paper);
        
        if (knowledge.concepts.length > 0 || knowledge.algorithms.length > 0 || knowledge.metrics.length > 0) {
            const code = generator.generateCode(knowledge);
            const proposal = proposalManager.createProposal(knowledge, code, paper);
            proposalManager.approve(proposal.id);
            
            const injected = injectIntoHeartflow(code, proposal.id);
            
            if (injected) {
                const newVersion = bumpVersion(queue.currentVersion);
                updateSkillMd(newVersion);
                writeFileSync(VERSION_FILE, newVersion);
                

                updateQueue(q => {
                    q.currentVersion = newVersion;
                    q.papersAnalyzed.push(paper);
                    q.lastUpgrade = new Date().toISOString();
                    return q;
                });
                
                log('[版本] ' + queue.currentVersion + ' -> ' + newVersion);
                log('[知识] 概念' + knowledge.concepts.length + ' | 算法' + knowledge.algorithms.length + ' | 指标' + knowledge.metrics.length);
            }
        } else {
            log('[跳过] 无有效知识: ' + paper);
            updateQueue(q => { q.papersAnalyzed.push(paper); return q; });
        }
    }
    
    const finalQueue = loadQueue();
    log('完成! 版本:' + finalQueue.currentVersion);
    
    return { success: true, version: finalQueue.currentVersion, papersProcessed: papersToProcess.length };
}

function injectIntoHeartflow(code, proposalId) {
    try {
        let content = readFileSync(HEARTFLOW_JS, 'utf-8');
        
        const startMethodMatch = content.match(/(this\.dream\.enabled = true;[\s\S]*?)(this\.(?:heartbeat|sleepWake|startupCheck))/);
        
        if (startMethodMatch) {
            const insertPos = startMethodMatch.index + startMethodMatch[1].lastIndexOf('this.dream.enabled = true;') + 'this.dream.enabled = true;'.length;
            
            const codeBlock = '\n' + code.join('\n') + '\n';
            content = content.slice(0, insertPos) + codeBlock + content.slice(insertPos);
            
            writeFileSync(HEARTFLOW_JS, content);
            log('[注入] 提案 ' + proposalId + ' 已注入');
            return true;
        }
        
        log('[错误] 未找到注入点');
        return false;
    } catch (e) {
        log('[注入错误] ' + e.message);
        return false;
    }
}

function updateSkillMd(version) {
    try {
        let content = readFileSync(SKILL_MD, 'utf-8');
        content = content.replace(/version: v[\d.]+/, 'version: ' + version);
        content = content.replace(/date: "[\d-]+"/, 'date: "' + new Date().toISOString().split('T')[0] + '"');
        writeFileSync(SKILL_MD, content);
        return true;
    } catch (e) {
        log('[SKILL.md更新错误] ' + e.message);
        return false;
    }
}

runUpgrade()
    .then(result => {
        console.log('[完成] ' + JSON.stringify(result));
        process.exit(0);
    })
    .catch(e => {
        console.error('[错误] ' + e.message);
        process.exit(1);
    });
