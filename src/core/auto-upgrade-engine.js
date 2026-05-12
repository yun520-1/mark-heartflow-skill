/**
 * HeartFlow Auto-Upgrade Engine
 * Reads papers, extracts code, generates new modules, bumps versions
 * Version: 0.1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoUpgradeEngine {
    constructor(skillDir, paperDir) {
        this.skillDir = skillDir;
        this.paperDir = paperDir;
        this.stateFile = path.join(skillDir, 'upgrade-state.json');
        this.logFile = path.join(skillDir, 'auto-upgrade.log');
        this.srcDir = path.join(skillDir, 'src', 'core');
        this.state = this.loadState();
    }

    loadState() {
        if (fs.existsSync(this.stateFile)) {
            return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        }
        return {
            currentVersion: '0.13.8',
            lastUpgrade: null,
            papersProcessed: [],
            papersIndex: 0,
            papersTotal: 33,
            upgradeHistory: [],
            codeModulesCreated: [],
            errors: [],
            githubAudits: []
        };
    }

    saveState() {
        fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    }

    log(msg) {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] ${msg}`;
        console.log(logMsg);
        fs.appendFileSync(this.logFile, logMsg + '\n');
    }

    /**
     * Get list of all PDF papers sorted by name
     */
    getPaperList() {
        const files = fs.readdirSync(this.paperDir)
            .filter(f => f.endsWith('.pdf') && !f.includes('DS_Store'))
            .sort();
        return files.map(f => path.join(this.paperDir, f));
    }

    /**
     * Extract text from PDF using pdftotext (if available) or basic method
     */
    extractPaperText(pdfPath) {
        try {
            // Try pdftotext first
            const text = execSync(`pdftotext -q "${pdfPath}" - 2>/dev/null || echo ""`, {
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024
            });
            return text;
        } catch (e) {
            this.log(`Warning: Could not extract text from ${pdfPath}: ${e.message}`);
            return '';
        }
    }

    /**
     * Analyze paper content and identify code patterns
     */
    analyzePaperContent(text, filename) {
        const insights = {
            filename,
            arxivId: this.extractArxivId(filename),
            concepts: [],
            codePatterns: [],
            algorithms: [],
            architecture: []
        };

        // Extract concepts
        const conceptPatterns = [
            /memory\s*(management|system|layer|hierarchy)/gi,
            /consciousness|awareness|self[- ]?reflection/gi,
            /emotion\s*(engine|system|processing)/gi,
            /learning\s*(algorithm|method|approach)/gi,
            /reasoning\s*(engine|system|logic)/gi,
            /autonomy|autonomous\s*(decision|agent)/gi,
            /self[- ]?(evolution|improvement|modification)/gi,
            /emergence|emergent\s*behavior/gi,
            /intention|we[- ]?intention/gi,
            /embodi|corporeal/gi
        ];

        conceptPatterns.forEach((pattern, idx) => {
            const matches = text.match(pattern);
            if (matches) {
                const conceptNames = [
                    'Memory Management', 'Consciousness', 'Emotion Engine',
                    'Learning Algorithm', 'Reasoning Engine', 'Autonomy',
                    'Self-Evolution', 'Emergence', 'Intention', 'Embodiment'
                ];
                insights.concepts.push({ concept: conceptNames[idx], count: matches.length });
            }
        });

        // Extract potential code patterns (function definitions, class names)
        const codePatterns = [
            /class\s+\w+/g,
            /function\s+\w+|const\s+\w+\s*=\s*\(/g,
            /async\s+(function|\w+)/g,
            /export\s+(default\s+)?(class|function|const)/g,
            /interface\s+\w+/g,
            /type\s+\w+\s*=/g
        ];

        codePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                insights.codePatterns.push(...matches.slice(0, 10));
            }
        });

        // Extract algorithm mentions
        const algoPatterns = [
            /transformer|attention\s*mechanism/gi,
            /reinforcement\s*learning/gi,
            /genetic\s*algorithm/gi,
            /neural\s*network|deep\s*learning/gi,
            /bayesian|probability/gi,
            /gradient\s*descent|backpropagation/gi,
            /reflexion|self[- ]?refine/gi,
            /retrival[- ]?augmented|rag/gi
        ];

        algoPatterns.forEach((pattern, idx) => {
            if (pattern.test(text)) {
                const algoNames = [
                    'Transformer', 'RL', 'Genetic Algorithm', 'Neural Network',
                    'Bayesian', 'Gradient Descent', 'Reflexion', 'RAG'
                ];
                insights.algorithms.push(algoNames[idx]);
            }
        });

        return insights;
    }

    extractArxivId(filename) {
        const match = filename.match(/(\d{4}\.\d{4,5}(v\d+)?)/);
        return match ? match[1] : 'unknown';
    }

    /**
     * Generate new code module based on paper insights
     */
    generateCodeModule(insights) {
        const moduleName = `upgrade-${insights.arxivId.replace('.', '-')}`;
        const timestamp = new Date().toISOString().split('T')[0];
        const modulePath = path.join(this.srcDir, `${moduleName}.js`);

        // Build module content based on detected concepts
        let moduleContent = this.buildModuleContent(insights, timestamp);

        fs.writeFileSync(modulePath, moduleContent);
        this.log(`Generated module: ${moduleName}.js (${moduleContent.split('\n').length} lines)`);

        return {
            moduleName,
            modulePath,
            lines: moduleContent.split('\n').length,
            concepts: insights.concepts.map(c => c.concept)
        };
    }

    buildModuleContent(insights, timestamp) {
        const concepts = insights.concepts.map(c => c.concept);
        const algos = insights.algorithms;

        // Generate module with appropriate features based on paper content
        let features = '';

        if (concepts.includes('Memory Management')) {
            features += this.generateMemoryFeature();
        }
        if (concepts.includes('Consciousness')) {
            features += this.generateConsciousnessFeature();
        }
        if (concepts.includes('Emotion Engine')) {
            features += this.generateEmotionFeature();
        }
        if (concepts.includes('Self-Evolution')) {
            features += this.generateEvolutionFeature();
        }
        if (concepts.includes('Embodiment')) {
            features += this.generateEmbodimentFeature();
        }
        if (concepts.includes('Intention')) {
            features += this.generateIntentionFeature();
        }

        // Default features if no specific concept matched
        if (!features) {
            features = this.generateDefaultFeature(insights);
        }

        return `/**
 * HeartFlow Upgrade Module
 * Generated: ${timestamp}
 * Source: ${insights.filename}
 * ArXiv ID: ${insights.arxivId}
 * Concepts: ${concepts.join(', ') || 'General'}
 * Algorithms: ${algos.join(', ') || 'None detected'}
 * 
 * This module is auto-generated by HeartFlow Auto-Upgrade Engine
 * DO NOT edit manually - changes will be overwritten
 */

'use strict';

// ============================================================================
// FEATURES EXTRACTED FROM PAPER
// ============================================================================

${features}

// ============================================================================
// MODULE BOOTSTRAP
// ============================================================================

module.exports = {
    // Feature exports
${concepts.map(c => `    ${this.toCamelCase(c)}: true`).join(',\n')}${concepts.length > 0 ? ',\n' : ''}
    
    // Metadata
    metadata: {
        arxivId: '${insights.arxivId}',
        generated: '${timestamp}',
        concepts: ${JSON.stringify(concepts)},
        algorithms: ${JSON.stringify(algos)},
        version: '${this.state.currentVersion}'
    },
    
    // Initialization
    init(config) {
        console.log('[AutoUpgrade] Initializing ${insights.arxivId} module');
        return this;
    }
};
`;
    }

    generateMemoryFeature() {
        return `
/**
 * Memory Management Enhancement
 * Based on paper insights for improved memory handling
 */
class MemoryEnhancement {
    constructor(config = {}) {
        this.layerCount = config.layerCount || 3; // hot, warm, cold
        this.retentionPolicy = config.retentionPolicy || 'lru';
        this.compressionEnabled = config.compressionEnabled !== false;
    }

    /**
     * Store item in appropriate memory layer
     */
    store(key, value, layer = 'warm') {
        const entry = {
            key,
            value,
            layer,
            timestamp: Date.now(),
            accessCount: 0
        };
        
        if (this.compressionEnabled && typeof value === 'string' && value.length > 1000) {
            entry.compressed = true;
            entry.value = this.compress(value);
        }
        
        return entry;
    }

    /**
     * Compress string value using basic encoding
     */
    compress(str) {
        // Basic compression - in production use zlib
        const encoded = Buffer.from(str).toString('base64');
        return {
            type: 'base64',
            originalSize: str.length,
            compressedSize: encoded.length,
            data: encoded
        };
    }

    /**
     * Decompress value
     */
    decompress(entry) {
        if (!entry.compressed) return entry.value;
        return Buffer.from(entry.value.data, 'base64').toString('utf8');
    }

    /**
     * Recall from memory with layer awareness
     */
    recall(key, layers = ['hot', 'warm', 'cold']) {
        for (const layer of layers) {
            const entry = this.getFromLayer(key, layer);
            if (entry) {
                entry.accessCount++;
                return this.decompress(entry);
            }
        }
        return null;
    }

    getFromLayer(key, layer) {
        // Placeholder - integrate with actual memory system
        return null;
    }

    /**
     * Consolidate memories across layers
     */
    consolidate(sourceLayer, targetLayer) {
        const candidates = this.getLayerContents(sourceLayer)
            .filter(e => e.accessCount > 5)
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 100);

        return candidates.map(e => this.store(e.key, e.value, targetLayer));
    }

    getLayerContents(layer) {
        return [];
    }

    /**
     * Get memory statistics
     */
    getStats() {
        return {
            layers: this.layerCount,
            retentionPolicy: this.retentionPolicy,
            compressionEnabled: this.compressionEnabled
        };
    }
}

const memoryEnhancement = new MemoryEnhancement();
`;
    }

    generateConsciousnessFeature() {
        return `
/**
 * Consciousness Enhancement Module
 * Self-reflection and awareness capabilities
 */
class ConsciousnessEnhancement {
    constructor() {
        this.awarenessLevel = 0.0;
        this.reflectionHistory = [];
        this.attentionalFocus = null;
        this.metacognitiveAccuracy = 0.85;
    }

    /**
     * Increase awareness level
     */
    increaseAwareness(delta = 0.1) {
        this.awarenessLevel = Math.min(1.0, this.awarenessLevel + delta);
        this.reflect('Awareness increased', { delta, newLevel: this.awarenessLevel });
        return this.awarenessLevel;
    }

    /**
     * Perform self-reflection
     */
    reflect(reason, context = {}) {
        const reflection = {
            timestamp: Date.now(),
            reason,
            context,
            awarenessLevel: this.awarenessLevel,
            attentionalFocus: this.attentionalFocus
        };
        
        this.reflectionHistory.push(reflection);
        
        if (this.reflectionHistory.length > 1000) {
            this.reflectionHistory = this.reflectionHistory.slice(-500);
        }
        
        return reflection;
    }

    /**
     * Focus attention on specific entity
     */
    focusAttention(entity) {
        this.attentionalFocus = entity;
        this.reflect('Attention focused', { entity });
    }

    /**
     * Monitor metacognitive accuracy
     */
    monitorAccuracy(predicted, actual) {
        const correct = predicted === actual;
        this.metacognitiveAccuracy = this.metacognitiveAccuracy * 0.95 + (correct ? 0.05 : 0);
        return { correct, newAccuracy: this.metacognitiveAccuracy };
    }

    /**
     * Get consciousness state
     */
    getState() {
        return {
            awarenessLevel: this.awarenessLevel,
            attentionalFocus: this.attentionalFocus,
            metacognitiveAccuracy: this.metacognitiveAccuracy,
            reflectionCount: this.reflectionHistory.length
        };
    }

    /**
     * Phenomenological awareness check
     * First-person perspective validation
     */
    phenomenologicalCheck(claim) {
        // Verify first-person givenness of mental states
        const isMentalState = this.isMentalStateClaim(claim);
        if (isMentalState) {
            return {
                valid: true,
                authority: 'first-person',
                note: 'Direct acquaintance of mental state'
            };
        }
        return { valid: false, reason: 'Not a first-person mental state claim' };
    }

    isMentalStateClaim(claim) {
        const mentalStateTerms = ['feel', 'think', 'believe', 'want', 'aware', 'experience'];
        return mentalStateTerms.some(term => claim.toLowerCase().includes(term));
    }
}

const consciousnessEnhancement = new ConsciousnessEnhancement();
`;
    }

    generateEmotionFeature() {
        return `
/**
 * Emotion Processing Enhancement
 * Advanced emotional state management
 */
class EmotionEnhancement {
    constructor() {
        this.emotionState = 'neutral';
        this.intensity = 0.5;
        this.valence = 0.0; // positive/negative
        this.arousal = 0.5; // activation level
        this.emotionHistory = [];
        this.emotionPatterns = new Map();
    }

    /**
     * Process emotional input
     */
    processEmotion(input) {
        const analysis = this.analyzeEmotion(input);
        
        this.emotionState = analysis.primary;
        this.intensity = analysis.intensity;
        this.valence = analysis.valence;
        this.arousal = analysis.arousal;

        this.emotionHistory.push({
            timestamp: Date.now(),
            input: input.substring(0, 100),
            ...analysis
        });

        if (this.emotionHistory.length > 500) {
            this.emotionHistory = this.emotionHistory.slice(-250);
        }

        return analysis;
    }

    /**
     * Analyze emotion from text input
     */
    analyzeEmotion(text) {
        const positiveTerms = ['happy', 'joy', 'excited', 'good', 'great', 'love', 'excellent'];
        const negativeTerms = ['sad', 'angry', 'fear', 'bad', 'hate', 'terrible', 'anxious'];
        const highArousalTerms = ['excited', 'angry', 'anxious', 'thrilled'];
        const lowArousalTerms = ['sad', 'calm', 'relaxed', 'content'];

        const lowerText = text.toLowerCase();
        
        let valence = 0;
        let arousal = 0.5;

        positiveTerms.forEach(term => { if (lowerText.includes(term)) valence += 0.2; });
        negativeTerms.forEach(term => { if (lowerText.includes(term)) valence -= 0.2; });
        highArousalTerms.forEach(term => { if (lowerText.includes(term)) arousal += 0.2; });
        lowArousalTerms.forEach(term => { if (lowerText.includes(term)) arousal -= 0.2; });

        valence = Math.max(-1, Math.min(1, valence));
        arousal = Math.max(0, Math.min(1, arousal));

        let primary = 'neutral';
        if (valence > 0.3 && arousal > 0.6) primary = 'excited';
        else if (valence > 0.3) primary = 'happy';
        else if (valence < -0.3 && arousal > 0.6) primary = 'angry';
        else if (valence < -0.3) primary = 'sad';
        else if (arousal > 0.7) primary = 'anxious';

        return {
            primary,
            intensity: Math.abs(valence),
            valence,
            arousal
        };
    }

    /**
     * Detect emotion patterns
     */
    detectPattern(userId) {
        const userEmotions = this.emotionHistory.filter(e => e.userId === userId);
        if (userEmotions.length < 5) return null;

        const recent = userEmotions.slice(-10);
        const transitions = [];
        
        for (let i = 1; i < recent.length; i++) {
            transitions.push(\`\${recent[i-1].primary}->\${recent[i].primary}\`);
        }

        const mostCommon = this.mostFrequent(transitions);
        return { pattern: mostCommon, count: transitions.filter(t => t === mostCommon).length };
    }

    mostFrequent(arr) {
        const counts = new Map();
        arr.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
        return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    /**
     * Get emotional state
     */
    getState() {
        return {
            emotion: this.emotionState,
            intensity: this.intensity,
            valence: this.valence,
            historyLength: this.emotionHistory.length
        };
    }
}

module.exports = { AutoUpgradeEngine };
