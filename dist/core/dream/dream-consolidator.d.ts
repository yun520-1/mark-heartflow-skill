/**
 * HeartFlow Dream Consolidator
 * TypeScript ESM · Zero Dependencies
 *
 * Core consolidation logic: pattern extraction, importance recalibration,
 * connection discovery, and block merging.
 */
import type { EpisodicBlock, RecallIndex } from '../memory/recall.js';
import type { DreamConfig, Insight } from './dream.js';
export declare function consolidate(recall: RecallIndex, blocks: EpisodicBlock[], config: DreamConfig, onInsight: (insight: Insight) => void): number;
//# sourceMappingURL=dream-consolidator.d.ts.map