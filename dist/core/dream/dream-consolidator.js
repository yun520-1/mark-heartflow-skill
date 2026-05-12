"use strict";
/**
 * HeartFlow Dream Consolidator
 * TypeScript ESM · Zero Dependencies
 *
 * Core consolidation logic: pattern extraction, importance recalibration,
 * connection discovery, and block merging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidate = consolidate;
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
function now() {
    return Date.now();
}
// ── Main Consolidator ──────────────────────────────────────────────────────
function consolidate(recall, blocks, config, onInsight) {
    let iterations = 0;
    // ── Phase 1: Pattern Detection ─────────────────────────────────────────
    const tagFreq = buildTagFrequency(blocks);
    const patterns = extractPatterns(tagFreq, config.patternThreshold);
    for (const pattern of patterns) {
        onInsight({
            type: 'pattern',
            description: `Recurring tag cluster: ${pattern.tags.join(' + ')} (${pattern.freq}×)`,
            weight: Math.min(1, pattern.freq / 10),
            relatedTags: pattern.tags,
            blockIds: pattern.blockIds,
        });
    }
    // ── Phase 2: Importance Recalibration (Decay/Growth) ───────────────────
    const nowTs = now();
    for (const block of blocks) {
        if (iterations >= config.maxIterations)
            break;
        const age = (nowTs - block.createdAt) / (24 * 3600 * 1000); // days
        if (block.importance >= config.strengthenAbove) {
            // Strengthen: importance grows slowly with repeated access
            const boost = block.accessCount * 0.01 * config.consolidationStrength;
            block.importance = Math.min(1, block.importance + boost);
        }
        else if (block.importance <= config.weakenBelow) {
            // Weaken: natural decay
            const decay = Math.pow(0.95, age / 7); // gentle weekly decay
            block.importance = Math.max(0, block.importance * decay);
        }
        iterations++;
    }
    // ── Phase 3: Connection Discovery ─────────────────────────────────────
    const connections = findConnections(blocks, patterns);
    for (const conn of connections) {
        onInsight({
            type: 'connection',
            description: `Cross-block connection: ${conn.tag} bridges ${conn.blockIds.length} blocks`,
            weight: conn.strength,
            relatedTags: [conn.tag],
            blockIds: conn.blockIds,
        });
    }
    // ── Phase 4: Block Merging ────────────────────────────────────────────
    if (config.consolidationStrength >= 0.4) {
        const merges = findMergeCandidates(blocks, patterns, config);
        for (const [a, b] of merges) {
            const merged = mergeBlocks(recall, a, b);
            if (merged) {
                onInsight({
                    type: 'merge',
                    description: `Merged blocks: ${a.id.slice(0, 8)} + ${b.id.slice(0, 8)} → ${merged.id.slice(0, 8)}`,
                    weight: 0.6,
                    relatedTags: merged.tags,
                    blockIds: [a.id, b.id, merged.id],
                });
            }
        }
    }
    return iterations;
}
// ── Helpers ─────────────────────────────────────────────────────────────────
function buildTagFrequency(blocks) {
    const freq = new Map();
    for (const block of blocks) {
        for (const tag of block.tags) {
            if (!freq.has(tag)) {
                freq.set(tag, { freq: 0, blockIds: [] });
            }
            const entry = freq.get(tag);
            entry.freq++;
            if (!entry.blockIds.includes(block.id)) {
                entry.blockIds.push(block.id);
            }
        }
    }
    return freq;
}
function extractPatterns(tagFreq, threshold) {
    const patterns = [];
    // Single-tag patterns
    for (const [tag, data] of tagFreq.entries()) {
        if (data.freq >= threshold) {
            patterns.push({ tags: [tag], freq: data.freq, blockIds: data.blockIds });
        }
    }
    // Multi-tag patterns (pairs that co-occur)
    const tags = Array.from(tagFreq.keys());
    for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
            const a = tagFreq.get(tags[i]);
            const b = tagFreq.get(tags[j]);
            const coOccur = a.blockIds.filter((id) => b.blockIds.includes(id));
            if (coOccur.length >= threshold) {
                patterns.push({
                    tags: [tags[i], tags[j]],
                    freq: coOccur.length,
                    blockIds: coOccur,
                });
            }
        }
    }
    return patterns.sort((x, y) => y.freq - x.freq);
}
function findConnections(blocks, patterns) {
    const connections = [];
    for (const pattern of patterns) {
        if (pattern.tags.length === 1) {
            connections.push({
                tag: pattern.tags[0],
                blockIds: pattern.blockIds,
                strength: Math.min(1, pattern.freq / 5),
            });
        }
    }
    return connections;
}
function findMergeCandidates(blocks, patterns, config) {
    const candidates = [];
    const merged = new Set();
    for (const pattern of patterns) {
        if (pattern.tags.length >= 2 && pattern.freq >= config.patternThreshold * 2) {
            // Find blocks sharing this multi-tag pattern
            const relevantBlocks = blocks.filter((b) => pattern.blockIds.includes(b.id));
            for (let i = 0; i < relevantBlocks.length; i++) {
                for (let j = i + 1; j < relevantBlocks.length; j++) {
                    const a = relevantBlocks[i];
                    const b = relevantBlocks[j];
                    if (!merged.has(a.id) && !merged.has(b.id)) {
                        // Merge if similar importance and both above threshold
                        if (Math.abs(a.importance - b.importance) < 0.2) {
                            candidates.push([a, b]);
                            merged.add(a.id);
                            merged.add(b.id);
                        }
                    }
                }
            }
        }
    }
    return candidates;
}
function mergeBlocks(recall, a, b) {
    if (a.id === b.id)
        return null;
    const mergedEntries = [...a.entries, ...b.entries].sort((x, y) => x.timestamp - y.timestamp);
    const merged = {
        id: generateId(),
        entries: mergedEntries,
        summary: `[Merged] ${a.summary.slice(0, 40)} + ${b.summary.slice(0, 40)}`,
        tags: Array.from(new Set([...a.tags, ...b.tags])).slice(0, 5),
        createdAt: Math.min(a.createdAt, b.createdAt),
        lastAccessed: now(),
        accessCount: a.accessCount + b.accessCount,
        importance: (a.importance + b.importance) / 2,
        size: a.size + b.size,
    };
    // Remove old blocks
    recall.blocks.delete(a.id);
    recall.blocks.delete(b.id);
    // Add merged block
    recall.blocks.set(merged.id, merged);
    // Update timeline (approximate — use earliest day)
    const dayTs = Math.floor(merged.createdAt / (24 * 3600 * 1000)) * (24 * 3600 * 1000);
    if (!recall.timeline.has(dayTs)) {
        recall.timeline.set(dayTs, []);
    }
    recall.timeline.get(dayTs).push(merged.id);
    return merged;
}
//# sourceMappingURL=dream-consolidator.js.map