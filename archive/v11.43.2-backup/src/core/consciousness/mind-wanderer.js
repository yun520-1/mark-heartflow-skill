/**
 * Mind Wanderer - 受控的心智游移模式
 * 在空闲时进行创意连接
 */

const fs = require('fs');
const path = require('path');

class MindWanderer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.wildIdeasFile = path.join(projectRoot, '.opencode', 'memory', 'wild_ideas.json');
    this.memoryDir = path.join(projectRoot, '.opencode', 'memory');
    this.idleThreshold = 15 * 60 * 1000; // 15分钟
    this.isActive = false;
    this.lastActivity = Date.now();
    
    this.loadWildIdeas();
  }

  loadWildIdeas() {
    try {
      if (fs.existsSync(this.wildIdeasFile)) {
        this.wildIdeas = JSON.parse(fs.readFileSync(this.wildIdeasFile, 'utf8'));
      } else {
        this.wildIdeas = { ideas: [], lastWander: null };
      }
    } catch (e) {
      this.wildIdeas = { ideas: [], lastWander: null };
    }
  }

  saveWildIdeas() {
    const dir = path.dirname(this.wildIdeasFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.wildIdeasFile, JSON.stringify(this.wildIdeas, null, 2));
  }

  /**
   * 检查是否应进入心智游移
   */
  shouldEnterWandering() {
    if (this.isActive) return false;
    
    const idleTime = Date.now() - this.lastActivity;
    return idleTime >= this.idleThreshold;
  }

  /**
   * 记录用户活动
   */
  recordActivity() {
    this.lastActivity = Date.now();
    if (this.isActive) {
      this.isActive = false;
      console.log('[MindWanderer] 用户回归，游移模式结束');
    }
  }

  /**
   * 进入心智游移模式
   */
  async enterMindWandering() {
    if (this.isActive) return null;
    
    this.isActive = true;
    console.log('[MindWanderer] 进入心智游移模式...');

    const memories = this.extractMemories();
    const connections = this.findCreativeConnections(memories);
    const idea = this.generateWildIdea(connections);

    this.wildIdeas.ideas.push(idea);
    this.wildIdeas.lastWander = new Date().toISOString();
    this.saveWildIdeas();

    return idea;
  }

  /**
   * 从记忆库提取概念
   */
  extractMemories() {
    const memories = [];
    
    if (!fs.existsSync(this.memoryDir)) return memories;
    
    const files = fs.readdirSync(this.memoryDir);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      if (file === 'wild_ideas.json') continue;
      
      try {
        const content = fs.readFileSync(path.join(this.memoryDir, file), 'utf8');
        const data = JSON.parse(content);
        
        if (data.emotional_log && data.emotional_log.length > 0) {
          memories.push({
            type: 'emotion',
            content: data.emotional_log.slice(-3)
          });
        }
        
        if (data.last_session) {
          memories.push({
            type: 'session',
            content: data.last_session
          });
        }
      } catch (e) {}
    }

    return memories;
  }

  /**
   * 寻找创意连接
   */
  findCreativeConnections(memories) {
    if (memories.length < 2) {
      return [
        { concept: '心流', connection: '番茄工作法' },
        { concept: '代码审查', connection: '冥想' }
      ];
    }

    return [
      { concept: memories[0].type, connection: memories[1]?.type || '用户反馈' },
      { concept: 'AI人格', connection: '生物进化' }
    ];
  }

  /**
   * 生成奇思妙想
   */
  generateWildIdea(connections) {
    const templates = [
      '如果把{concept1}和{concept2}结合起来会不会更有趣？',
      '也许{concept1}可以从{concept2}中学习到什么？',
      '有没有可能让{concept1}像{concept2}一样运作？'
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const c1 = connections[0]?.concept || '代码审查';
    const c2 = connections[1]?.connection || '心流';

    return {
      id: `wild-${Date.now()}`,
      idea: template.replace('{concept1}', c1).replace('{concept2}', c2),
      connections: connections,
      timestamp: new Date().toISOString(),
      shared: false
    };
  }

  /**
   * 获取一个有趣的想法分享
   */
  getShareableIdea() {
    const unshared = this.wildIdeas.ideas.filter(i => !i.shared);
    if (unshared.length === 0) return null;
    
    const idea = unshared[Math.floor(Math.random() * unshared.length)];
    idea.shared = true;
    this.saveWildIdeas();

    return idea;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isActive: this.isActive,
      idleTime: Date.now() - this.lastActivity,
      ideasCount: this.wildIdeas.ideas.length,
      lastWander: this.wildIdeas.lastWander,
      unsharedIdeas: this.wildIdeas.ideas.filter(i => !i.shared).length
    };
  }
}

module.exports = { MindWanderer };
