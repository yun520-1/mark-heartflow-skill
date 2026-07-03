/**
 * DebateConductor v1.0.0 — 多智能体辩论协调器
 *
 *  orchestrates structured debates between AI agents with different perspectives.
 *
 * Debate Protocol:
 *   Round 1:  Opening statements
 *   Round 2-N: Rebuttals + cross-examination
 *   Final round: Consensus attempt
 *
 * 集成到 HeartFlow 引擎，通过 dispatch('debateConductor.conductDebate', ...) 调用。
 * 零 npm 依赖，纯 JavaScript。
 */

class DebateConductor {
  constructor(hf) {
    this.hf = hf;
    this.VERSION = '1.0.0';

    // 已注册的智能体 { role: { stance, personality, position } }
    this.agents = new Map();

    // 允许的角色定义及默认立场
    this.ROLES = {
      proponent:        { label: '支持方',     defaultStance: 'affirmative' },
      critic:           { label: '批判方',     defaultStance: 'negative' },
      devils_advocate:  { label: '魔鬼代言人', defaultStance: 'oppositional' },
      synthesizer:      { label: '综合方',     defaultStance: 'neutral' },
      mediator:         { label: '调停方',     defaultStance: 'facilitator' },
    };

    // 辩论协议配置
    this.PROTOCOL = {
      openingPhase:    'opening',
      rebuttalPhase:   'rebuttal',
      crossExamPhase:  'cross_examination',
      consensusPhase:  'consensus',
    };

    // 统计
    this.stats = {
      totalDebates: 0,
      convergedDebates: 0,
      avgRoundsToConverge: 0,
      avgAgreementLevel: 0,
    };

    // 收敛检测参数
    this.convergenceThreshold = 0.75;
    this.stagnationThreshold = 2; // 连续N轮无改进视为停滞
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  注册智能体
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 注册辩论参与者
   * @param {string} role — 角色（proponent/critic/devils_advocate/synthesizer/mediator）
   * @param {string} [stance] — 立场描述（可选，使用角色默认立场）
   * @param {object} [personality] — 性格特征 { tone, style, emphasis }
   * @returns {object} { registered: bool, role, label }
   */
  addAgent(role, stance, personality) {
    const roleDef = this.ROLES[role];
    if (!roleDef) {
      return {
        registered: false,
        error: `角色 "${role}" 不合法。允许的角色: ${Object.keys(this.ROLES).join(', ')}`,
        role,
      };
    }

    if (this.agents.has(role)) {
      return {
        registered: false,
        error: `角色 "${role}" 已注册`,
        role,
      };
    }

    const agentConfig = {
      role,
      label: roleDef.label,
      stance: stance || roleDef.defaultStance,
      personality: personality || this._defaultPersonality(role),
      position: null,     // 当前轮次的位置表述
      history: [],        // 历史位置记录
      metadata: {
        registeredAt: Date.now(),
        participationCount: 0,
      },
    };

    this.agents.set(role, agentConfig);

    return {
      registered: true,
      role,
      label: roleDef.label,
      stance: agentConfig.stance,
    };
  }

  /**
   * 为每个角色提供默认性格模板
   */
  _defaultPersonality(role) {
    const templates = {
      proponent:       { tone: '理性建设', style: '正向论证', emphasis: '证据与收益' },
      critic:          { tone: '严谨质疑', style: '反向论证', emphasis: '风险与漏洞' },
      devils_advocate: { tone: '尖锐挑战', style: '极端反证', emphasis: '边界情况' },
      synthesizer:     { tone: '包容整合', style: '中正调和', emphasis: '共同基础' },
      mediator:        { tone: '客观中正', style: '过程管理', emphasis: '公平与进展' },
    };
    return templates[role] || { tone: '中立', style: '平衡', emphasis: '全面' };
  }

  /**
   * 获取已注册的角色列表
   */
  getRegisteredRoles() {
    return Array.from(this.agents.keys());
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  核心方法：conductDebate — 执行结构化辩论
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 执行结构化辩论
   * @param {string} topic — 辩论主题
   * @param {Array<string>} [agentRoles] — 参与的智能体角色列表（省略则使用所有已注册角色）
   * @param {number} [maxRounds] — 最大轮次（默认5）
   * @returns {object} 完整辩论记录
   */
  conductDebate(topic, agentRoles, maxRounds) {
    if (!topic || typeof topic !== 'string') {
      return { error: 'topic 为必填参数', topic };
    }

    // 确定参与者
    let roles = agentRoles && agentRoles.length > 0
      ? agentRoles
      : this.getRegisteredRoles();

    if (roles.length < 2) {
      return {
        error: '至少需要2个智能体才能进行辩论',
        registered: this.getRegisteredRoles(),
        requested: roles,
      };
    }

    // 验证角色都已注册
    const validRoles = roles.filter(r => this.agents.has(r));
    if (validRoles.length < 2) {
      return {
        error: '部分角色未注册',
        registered: this.getRegisteredRoles(),
        requested: roles,
      };
    }

    maxRounds = Math.min(maxRounds || 5, 10); // 上限10轮防止失控

    const debate = {
      id: `debate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      topic,
      agents: roles,
      protocol: this.PROTOCOL,
      maxRounds: maxRounds,
      rounds: [],
      startTime: Date.now(),
      endTime: null,
      status: 'running',
      convergence: {
        detected: false,
        round: null,
        score: 0,
        trajectory: [], // 每轮 agreementLevel 的轨迹
      },
      consensus: null,
      disagreements: null,
      meta: {
        version: this.VERSION,
        roundCount: 0,
        agentPositions: {}, // 最终的立场汇总
      },
    };

    // ── 执行辩论轮次 ──────────────────────────────────────────────────
    let agreementLevel = 0;
    let stagnationCounter = 0;
    let previousScore = 0;

    for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
      let phase, positions;

      if (roundNum === 1) {
        // Round 1: Opening statements
        phase = this.PROTOCOL.openingPhase;
        positions = this._roundOpeningStatements(validRoles, topic);
      } else if (roundNum < maxRounds) {
        // Round 2..N-1: Rebuttals + cross-examination
        if (roundNum % 2 === 0) {
          phase = this.PROTOCOL.rebuttalPhase;
          positions = this._roundRebuttals(validRoles, topic, roundNum);
        } else {
          phase = this.PROTOCOL.crossExamPhase;
          positions = this._roundCrossExamination(validRoles, topic, roundNum);
        }
      } else {
        // Final round: Consensus attempt
        phase = this.PROTOCOL.consensusPhase;
        positions = this._roundConsensusAttempt(validRoles, topic);
      }

      // 计算本轮共识度
      agreementLevel = this._computeAgreementLevel(positions, validRoles);
      const converged = agreementLevel >= this.convergenceThreshold;

      // 停滞检测
      const scoreDelta = agreementLevel - previousScore;
      if (scoreDelta < 0.05 && roundNum > 1) {
        stagnationCounter++;
      } else {
        stagnationCounter = 0;
      }

      const roundResult = {
        round: roundNum,
        phase,
        positions,
        agreementLevel,
        converged,
        scoreDelta: scoreDelta,
        stagnation: stagnationCounter,
      };

      debate.rounds.push(roundResult);
      debate.convergence.trajectory.push({ round: roundNum, level: agreementLevel });
      debate.meta.roundCount = roundNum;

      // 更新智能体位置历史
      this._updateAgentHistory(validRoles, positions);

      // 收敛判断
      if (converged) {
        debate.convergence.detected = true;
        debate.convergence.round = roundNum;
        debate.convergence.score = agreementLevel;
        debate.status = 'converged';
        break;
      }

      // 停滞提前终止
      if (stagnationCounter >= this.stagnationThreshold) {
        debate.status = 'stagnated';
        debate.meta.stagnationReason = `连续 ${stagnationCounter} 轮无显著进展`;
        break;
      }

      previousScore = agreementLevel;
    }

    // ── 辩论结束处理 ──────────────────────────────────────────────────
    debate.endTime = Date.now();
    debate.convergence.score = agreementLevel;

    // 如果未收敛，使用最终轮次的一致度
    if (!debate.convergence.detected) {
      debate.convergence.score = agreementLevel;
    }

    // 提取共识与分歧
    debate.consensus = this.extractConsensus(debate);
    debate.disagreements = this.extractDisagreements(debate);

    // 更新统计
    this.stats.totalDebates++;
    if (debate.convergence.detected) {
      this.stats.convergedDebates++;
      this.stats.avgRoundsToConverge =
        (this.stats.avgRoundsToConverge * (this.stats.convergedDebates - 1) + debate.meta.roundCount)
        / this.stats.convergedDebates;
    }
    this.stats.avgAgreementLevel =
      (this.stats.avgAgreementLevel * (this.stats.totalDebates - 1) + agreementLevel)
      / this.stats.totalDebates;

    return debate;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  辩论轮次执行
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Round 1: Opening statements — 各方发表开场立场
   */
  _roundOpeningStatements(roles, topic) {
    return roles.map(role => {
      const agent = this.agents.get(role);
      const statement = this._generateStatement(agent, topic, 'opening');
      agent.position = statement;
      agent.metadata.participationCount++;
      return {
        role,
        label: agent.label,
        statement,
        stance: agent.stance,
        personality: agent.personality,
        round: 1,
      };
    });
  }

  /**
   * Round 2..N-1: Rebuttals — 针对对方观点进行反驳
   */
  _roundRebuttals(roles, topic, roundNum) {
    return roles.map(role => {
      const agent = this.agents.get(role);
      const previousPositions = agent.history.length > 0
        ? agent.history[agent.history.length - 1]
        : null;
      const rebuttal = this._generateStatement(agent, topic, 'rebuttal', previousPositions);
      agent.position = rebuttal;
      agent.metadata.participationCount++;
      return {
        role,
        label: agent.label,
        statement: rebuttal,
        stance: agent.stance,
        targets: this._identifyTargets(role, roles, previousPositions),
        round: roundNum,
      };
    });
  }

  /**
   * Round 2..N-1: Cross-examination — 交叉质询
   */
  _roundCrossExamination(roles, topic, roundNum) {
    const result = [];
    // 每个角色质询与之立场差异最大的另一个角色
    for (const role of roles) {
      const agent = this.agents.get(role);
      const targetRole = this._findOpposingRole(role, roles);
      const targetAgent = this.agents.get(targetRole);
      const challenge = this._generateChallenge(agent, targetAgent, topic, roundNum);
      // Include a statement-like field so agreement calculation can process this round
      const agentStatement = agent.position || this._generateStatement(agent, topic, 'opening');
      result.push({
        from: role,
        fromLabel: agent.label,
        target: targetRole,
        targetLabel: targetAgent.label,
        challenge,
        statement: agentStatement, // for agreement level computation
        round: roundNum,
      });
    }
    return result;
  }

  /**
   * Final round: Consensus attempt — 共识尝试
   */
  _roundConsensusAttempt(roles, topic) {
    // synthesizer 和 mediator 主导共识尝试
    const activeRoles = roles.filter(r =>
      r === 'synthesizer' || r === 'mediator' || !this.agents.get(r).position
    );

    const positions = roles.map(role => {
      const agent = this.agents.get(role);
      const synthesis = this._generateStatement(agent, topic, 'consensus');
      agent.position = synthesis;
      return {
        role,
        label: agent.label,
        statement: synthesis,
        stance: agent.stance,
        phase: 'consensus_attempt',
      };
    });

    return positions;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  立场生成（结构化模板，不依赖外部LLM）
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 根据角色、主题和辩论阶段生成结构化立场声明
   * 这是核心的立场推理引擎，纯算法实现。
   */
  _generateStatement(agent, topic, phase, previousPositions) {
    const { role, stance, personality } = agent;
    const topicShort = topic.length > 30 ? topic.slice(0, 30) + '...' : topic;

    // 基于角色、立场和阶段生成结构化声明
    const stanceKeywords = this._stanceKeywords(stance);
    const phaseContext = this._phaseContext(phase);

    let statement;
    if (phase === 'opening') {
      statement = this._openingStatement(role, stanceKeywords, topicShort, personality);
    } else if (phase === 'rebuttal') {
      statement = this._rebuttalStatement(role, stanceKeywords, topicShort, previousPositions, personality);
    } else if (phase === 'consensus') {
      statement = this._consensusStatement(role, stanceKeywords, topicShort, personality);
    } else {
      statement = this._openingStatement(role, stanceKeywords, topicShort, personality);
    }

    return statement;
  }

  _stanceKeywords(stance) {
    const map = {
      affirmative:     { core: '支持',  counter: '反驳' },
      negative:        { core: '反对',  counter: '质疑' },
      oppositional:   { core: '否定',  counter: '挑战' },
      neutral:         { core: '分析',  counter: '对比' },
      facilitator:     { core: '协调',  counter: '平衡' },
    };
    return map[stance] || { core: '讨论', counter: '审视' };
  }

  _phaseContext(phase) {
    const map = {
      opening:         '基于初步分析',
      rebuttal:        '回应前述观点',
      cross_examination: '深入质询',
      consensus:        '寻求共识',
    };
    return map[phase] || '';
  }

  _openingStatement(role, keywords, topic, personality) {
    const openings = {
      proponent:       `基于${keywords.core}立场，我认为「${topic}」具有重要价值，${personality.emphasis}是论证的关键维度。`,
      critic:          `从${keywords.core}视角审视，「${topic}」存在值得深入探讨的问题，特别是在${personality.emphasis}方面。`,
      devils_advocate: `即便在${keywords.core}角度下，「${topic}」也面临严峻的边界挑战。`,
      synthesizer:     `综合各方立场，「${topic}」呈现多面性特征，需要${personality.emphasis}才能全面理解。`,
      mediator:        `作为调停方，我关注辩论进展与${personality.emphasis}的平衡，确保各方的「${topic}」观点都得到尊重。`,
    };
    return openings[role] || `${keywords.core}关于「${topic}」的观点。`;
  }

  _rebuttalStatement(role, keywords, topic, previousPositions, personality) {
    const rebuttals = {
      proponent:       `回应前述观点：关于「${topic}」，我认为${keywords.counter}的意见需要更充分的证据支撑。${personality.emphasis}将证明立场的合理性。`,
      critic:          `针对前述观点，「${topic}」的分析仍有关键遗漏。${keywords.counter}的论证在${personality.emphasis}方面仍有缺陷。`,
      devils_advocate: `即便对方有充分理由，「${topic}」在最极端情况下依然可能失效。${keywords.counter}的边界条件值得警惕。`,
      synthesizer:     `综合双方观点，「${topic}」的核心争论在于${personality.emphasis}的权衡。各方都有合理之处。`,
      mediator:        `当前辩论中，「${topic}」已有多方交锋。我需要引导讨论回归${personality.emphasis}，聚焦核心分歧。`,
    };
    return rebuttals[role] || `关于「${topic}」的${keywords.counter}。`;
  }

  _consensusStatement(role, keywords, topic, personality) {
    const consensus = {
      proponent:       `在共识层面，「${topic}」的核心价值已得到认可。我愿意在${personality.emphasis}方面作出调整以达成一致。`,
      critic:          `共识尝试中，我认可「${topic}」的某些方面。但在${personality.emphasis}上仍需明确保障。`,
      devils_advocate: `即便在共识框架下，「${topic}」的风险边界仍需被充分记录。`,
      synthesizer:     `通过${personality.emphasis}的综合分析，「${topic}」存在各方可以接受的共同基础。`,
      mediator:        `共识尝试显示「${topic}」的多方立场开始趋同。建议记录共同点，明确剩余分歧。`,
    };
    return consensus[role] || `关于「${topic}」的共识立场。`;
  }

  /**
   * 生成质询声明
   */
  _generateChallenge(challenger, target, topic, roundNum) {
    return `${challenger.label}质询${target.label}：关于「${topic}」，${challenger.personality.emphasis}方面，请问您的立场如何应对关键的反例？`;
  }

  /**
   * 识别反驳目标
   */
  _identifyTargets(role, allRoles, previousPositions) {
    if (!previousPositions) return [];
    // 寻找立场差异最大的角色
    const opposing = ['critic', 'devils_advocate'];
    return allRoles.filter(r => r !== role && opposing.includes(r));
  }

  /**
   * 寻找立场对立角色
   */
  _findOpposingRole(role, roles) {
    const oppositionMap = {
      proponent:       'critic',
      critic:          'proponent',
      devils_advocate: 'synthesizer',
      synthesizer:     'devils_advocate',
      mediator:        null,
    };
    const target = oppositionMap[role];
    if (target && roles.includes(target)) return target;
    // 回退：找第一个非自己的角色
    return roles.find(r => r !== role) || roles[0];
  }

  /**
   * 中英文混合分词：用于立场相似度比较
   * - 英文按空格分词
   * - 中文按单字 + 双字bigram提取
   */
  _tokenizeForComparison(text) {
    const cleaned = text.replace(/[。，！？、；：""''「」【】\s]/g, '');
    const tokens = new Set();
    const hasCJK = /[一-鿿]/.test(cleaned);

    if (!hasCJK) {
      // 纯英文：按空格分词
      const words = text.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length >= 2);
      for (const w of words) tokens.add(w.toLowerCase());
    } else {
      // 中英混合：提取单字 + 双字bigram
      for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (/[一-鿿]/.test(ch)) {
          tokens.add(ch); // 单字
          if (i + 1 < cleaned.length) {
            tokens.add(cleaned[i] + cleaned[i + 1]); // 双字bigram
          }
        } else if (/[a-zA-Z]/.test(ch)) {
          // 连续英文字母组成一个token
          let word = '';
          let j = i;
          while (j < cleaned.length && /[a-zA-Z]/.test(cleaned[j])) {
            word += cleaned[j];
            j++;
          }
          if (word.length >= 2) tokens.add(word.toLowerCase());
          i = j - 1;
        }
      }
    }
    return Array.from(tokens);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  共识度计算（0-1）
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 计算当前轮次的共识水平
   * 基于各智能体立场之间的语义重叠度
   * @returns {number} 0-1
   */
  _computeAgreementLevel(positions, roles) {
    if (!positions || positions.length < 2) return 0;

    const statements = positions
      .filter(p => p.statement && p.statement.length > 5)
      .map(p => p.statement);

    if (statements.length < 2) return 0;

    // 方法1: 词汇重叠度（Jaccard相似度）— 支持中英文混合分词
    const wordSets = statements.map(s => new Set(
      this._tokenizeForComparison(s)
    ));

    let totalSimilarity = 0;
    let pairCount = 0;
    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const intersection = new Set([...wordSets[i]].filter(w => wordSets[j].has(w)));
        const union = new Set([...wordSets[i], ...wordSets[j]]);
        const jaccard = union.size > 0 ? intersection.size / union.size : 0;
        totalSimilarity += jaccard;
        pairCount++;
      }
    }

    const lexicalAgreement = pairCount > 0 ? totalSimilarity / pairCount : 0;

    // 方法2: 立场关键词一致性
    const stanceWords = {
      affirmative:    ['支持', '认可', '肯定', '合理', '价值'],
      negative:       ['反对', '质疑', '缺陷', '风险', '问题'],
      oppositional:   ['极端', '边界', '失效', '挑战', '最'],
      neutral:        ['综合', '分析', '多方面', '权衡', '中'],
      facilitator:    ['协调', '平衡', '公平', '引导', '双方'],
    };

    const stanceCounts = {};
    for (const role of roles) {
      const agent = this.agents.get(role);
      if (!agent) continue;
      const stance = agent.stance;
      const posWords = stanceWords[stance] || [];
      const statement = agent.position || '';
      const matches = posWords.filter(w => statement.includes(w)).length;
      stanceCounts[role] = matches / Math.max(posWords.length, 1);
    }

    const stanceValues = Object.values(stanceCounts);
    const stanceVariance = stanceValues.length > 0
      ? stanceValues.reduce((a, b) => a + b, 0) / stanceValues.length
      : 0;

    // 方法3: 长度相似度（立场越相似，陈述长度越接近）
    const lengths = statements.map(s => s.length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lengthVariance = lengths.reduce((a, l) => a + Math.abs(l - avgLen), 0) / (avgLen || 1);
    const lengthSimilarity = Math.max(0, 1 - lengthVariance / (avgLen || 1));

    // 综合加权
    const agreement =
      lexicalAgreement * 0.4 +
      stanceVariance * 0.3 +
      lengthSimilarity * 0.3;

    return Math.min(1, Math.max(0, Math.round(agreement * 100) / 100));
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  共识与分歧提取
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 从辩论记录中提取共识点
   * @param {object} debate — 辩论结果对象
   * @returns {object} { points: [...], agreementLevel: number, summary: string }
   */
  extractConsensus(debate) {
    if (!debate || !debate.rounds || debate.rounds.length === 0) {
      return { points: [], agreementLevel: 0, summary: '无辩论数据' };
    }

    const allPositions = debate.rounds.flatMap(r => r.positions || []);
    if (allPositions.length < 2) {
      return { points: [], agreementLevel: 0, summary: '立场数据不足' };
    }

    // 提取共识点：出现在多个智能体声明中的关键词/概念
    const wordFreq = {};
    const statementsByRole = {};

    for (const pos of allPositions) {
      if (!pos.statement) continue;
      const words = pos.statement.replace(/[。，！？、；：""''「」]/g, ' ').split(/\s+/);
      statementsByRole[pos.role] = pos.statement;

      for (const w of words) {
        if (w.length >= 2) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      }
    }

    const roles = debate.agents || Object.keys(this.agents);
    const threshold = Math.ceil(roles.length * 0.5); // 超过半数角色提到
    const consensusWords = Object.entries(wordFreq)
      .filter(([, count]) => count >= threshold)
      .map(([word]) => word)
      .filter(w => !this._stopWord(w));

    // 从共识轮的声明中提取完整共识句
    const consensusRound = debate.rounds.find(r =>
      r.phase === this.PROTOCOL.consensusPhase
    );

    const points = [];
    if (consensusRound && consensusRound.positions) {
      for (const pos of consensusRound.positions) {
        if (pos.statement && pos.statement.length > 5) {
          points.push({
            role: pos.role,
            label: pos.label || pos.role,
            statement: pos.statement,
          });
        }
      }
    }

    // 提取共同主题
    const commonThemes = consensusWords.slice(0, 10);

    return {
      points,
      commonThemes,
      agreementLevel: debate.convergence?.score || this._computeFinalAgreement(allPositions, roles),
      summary: points.length > 0
        ? `在「${debate.topic}」上，${roles.length}方中有共识记录`
        : '未检测到明确共识',
    };
  }

  /**
   * 从辩论记录中提取分歧点
   * @param {object} debate — 辩论结果对象
   * @returns {object} { points: [...], count: number }
   */
  extractDisagreements(debate) {
    if (!debate || !debate.rounds || debate.rounds.length === 0) {
      return { points: [], count: 0, summary: '无辩论数据' };
    }

    const roles = debate.agents || Object.keys(this.agents);
    const allPositions = debate.rounds.flatMap(r => r.positions || []);
    const points = [];

    // 按角色分组的位置
    const byRole = {};
    for (const pos of allPositions) {
      if (!byRole[pos.role]) byRole[pos.role] = [];
      byRole[pos.role].push(pos.statement || '');
    }

    // 比较不同角色的立场差异
    const roleArray = roles.filter(r => byRole[r] && byRole[r].length > 0);
    for (let i = 0; i < roleArray.length; i++) {
      for (let j = i + 1; j < roleArray.length; j++) {
        const roleA = roleArray[i];
        const roleB = roleArray[j];
        const agentA = this.agents.get(roleA);
        const agentB = this.agents.get(roleB);

        if (!agentA || !agentB) continue;

        // 立场根本不同的角色组
        const conflictingStances = ['affirmative', 'negative', 'oppositional'];
        const aConflicts = conflictingStances.includes(agentA.stance);
        const bConflicts = conflictingStances.includes(agentB.stance);

        if (aConflicts || bConflicts) {
          const divergence = this._computeDivergence(
            byRole[roleA],
            byRole[roleB],
            roleA, roleB
          );
          if (divergence.severity > 0.3) {
            points.push({
              topic: divergence.topic,
              roleA: { role: roleA, label: agentA.label, position: divergence.positionA },
              roleB: { role: roleB, label: agentB.label, position: divergence.positionB },
              severity: divergence.severity,
            });
          }
        }
      }
    }

    // 也检查交叉质询中的分歧
    const crossExamRounds = debate.rounds.filter(r => r.phase === this.PROTOCOL.crossExamPhase);
    for (const round of crossExamRounds) {
      if (round.positions) continue; // cross_exam 使用不同的结构
      // 质询本身就是分歧信号
      if (round.challenges) {
        for (const ch of round.challenges) {
          points.push({
            topic: debate.topic,
            roleA: { role: ch.from, label: ch.fromLabel },
            roleB: { role: ch.target, label: ch.targetLabel },
            divergence: ch.challenge,
            severity: 0.5,
          });
        }
      }
    }

    return {
      points: points.slice(0, 10), // 最多返回10个分歧点
      count: points.length,
      summary: points.length > 0
        ? `检测到 ${points.length} 处核心分歧`
        : '未检测到显著分歧',
    };
  }

  /**
   * 尝试将辩论推向共识
   * @param {object} debate — 辩论结果对象
   * @returns {object} { converged, agreementLevel, synthesized, remainingGaps }
   */
  converge(debate) {
    if (!debate) {
      return { converged: false, error: '缺少辩论数据' };
    }

    const roles = debate.agents || Object.keys(this.agents);
    const currentAgreement = debate.convergence?.score || 0;
    const wasConverged = debate.convergence?.detected || false;

    // 如果已经收敛，直接返回
    if (wasConverged && currentAgreement >= this.convergenceThreshold) {
      return {
        converged: true,
        agreementLevel: currentAgreement,
        synthesized: this._buildSynthesis(debate, roles),
        remainingGaps: [],
        method: 'already_converged',
      };
    }

    // 尝试综合：优先使用 synthesizer 的立场
    const synthesizer = this.agents.get('synthesizer');
    const mediator = this.agents.get('mediator');

    const synthesized = synthesizer
      ? synthesizer.position || this._buildSynthesis(debate, roles)
      : this._buildSynthesis(debate, roles);

    // 计算综合后的预期共识度
    const consensusResult = this.extractConsensus(debate);
    const agreementLevel = Math.min(1, currentAgreement + 0.1); // 综合后略有提升

    // 识别剩余差距
    const disagreements = this.extractDisagreements(debate);
    const remainingGaps = disagreements.points
      .filter(p => p.severity > 0.6)
      .map(p => ({
        topic: p.topic,
        parties: [p.roleA?.role, p.roleB?.role].filter(Boolean),
        suggestion: '需要进一步协商或引入外部判断',
      }));

    const converged = agreementLevel >= this.convergenceThreshold && remainingGaps.length === 0;

    return {
      converged,
      agreementLevel: Math.round(agreementLevel * 100) / 100,
      synthesized,
      synthesizedBy: synthesizer?.role || 'mediator',
      remainingGaps,
      method: 'active_synthesis',
      recommendation: converged
        ? '共识达成'
        : `共识未完全达成，剩余 ${remainingGaps.length} 处关键分歧需要处理`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  辅助方法
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 构建综合陈述
   */
  _buildSynthesis(debate, roles) {
    const topic = debate.topic || '';
    const synthesizer = this.agents.get('synthesizer');
    const mediator = this.agents.get('mediator');

    const rolesWithPositions = roles
      .filter(r => this.agents.get(r)?.position)
      .map(r => this.agents.get(r).label);

    const leadRole = synthesizer ? synthesizer.label : (mediator ? mediator.label : '综合方');

    return `[综合] ${leadRole}综合${rolesWithPositions.join('、')}各方的立场：关于「${topic}」，各方在核心框架上趋于一致，但在具体执行维度上仍有差异。建议在${synthesizer?.personality?.emphasis || '关键维度'}方面进一步明确，以实现实质性共识。`;
  }

  /**
   * 计算最终共识度
   */
  _computeFinalAgreement(positions, roles) {
    return this._computeAgreementLevel(positions, roles);
  }

  /**
   * 计算两条立场陈述之间的差异度
   */
  _computeDivergence(statementsA, statementsB, roleA, roleB) {
    const textA = (statementsA || []).join(' ');
    const textB = (statementsB || []).join(' ');

    const wordsA = new Set(textA.replace(/[。，！？]/g, ' ').split(/\s+/).filter(w => w.length >= 2));
    const wordsB = new Set(textB.replace(/[。，！？]/g, ' ').split(/\s+/).filter(w => w.length >= 2));

    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    const jaccard = union.size > 0 ? 1 - intersection.size / union.size : 1;

    // 立场差异加成
    const agentA = this.agents.get(roleA);
    const agentB = this.agents.get(roleB);
    const stancePenalty = this._stanceDivergencePenalty(agentA?.stance, agentB?.stance);

    return {
      severity: Math.min(1, jaccard * 0.6 + stancePenalty * 0.4),
      topic: agentA?.stance === agentB?.stance ? '执行细节' : '根本立场',
      positionA: textA.slice(0, 120),
      positionB: textB.slice(0, 120),
    };
  }

  _stanceDivergencePenalty(stanceA, stanceB) {
    if (!stanceA || !stanceB) return 0.5;
    if (stanceA === stanceB) return 0.1;
    const pairs = [
      ['affirmative', 'negative'],
      ['affirmative', 'oppositional'],
      ['negative', 'oppositional'],
      ['neutral', 'oppositional'],
    ];
    return pairs.some(([a, b]) => (stanceA === a && stanceB === b) || (stanceA === b && stanceB === a))
      ? 0.8
      : 0.3;
  }

  /**
   * 过滤停用词
   */
  _stopWord(word) {
    const stops = new Set([
      '的', '了', '是', '在', '和', '有', '就', '都', '要', '这', '那',
      'the', 'is', 'and', 'of', 'to', 'in', 'a', 'for', 'on', 'with',
      '认为', '关于', '基于', '作为', '需要', '方面',
    ]);
    return stops.has(word.toLowerCase());
  }

  /**
   * 更新智能体位置历史
   */
  _updateAgentHistory(roles, positions) {
    for (const pos of positions) {
      const agent = this.agents.get(pos.role);
      if (agent && pos.statement) {
        agent.history.push(pos.statement);
        agent.position = pos.statement;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  状态查询
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 获取导体状态
   */
  getStatus() {
    return {
      version: this.VERSION,
      registeredAgents: this.getRegisteredRoles(),
      agentDetails: Array.from(this.agents.entries()).map(([role, cfg]) => ({
        role,
        label: cfg.label,
        stance: cfg.stance,
        personality: cfg.personality,
        participationCount: cfg.metadata.participationCount,
      })),
      stats: { ...this.stats },
      convergenceThreshold: this.convergenceThreshold,
      stagnationThreshold: this.stagnationThreshold,
    };
  }

  /**
   * 重置智能体（清空历史，保留配置）
   */
  resetAgents() {
    for (const [, agent] of this.agents) {
      agent.position = null;
      agent.history = [];
      agent.metadata.participationCount = 0;
    }
  }
}

module.exports = { DebateConductor };
