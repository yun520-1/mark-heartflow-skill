/**
 * Emotion Engine — TypeScript ESM wrapper over deep-emotion.js (CommonJS)
 */

export interface EmotionResult {
  emotion: string;
  intensity: number;
  embodied: Record<string, number>;
  expression: { emoji: string; text: string; body: string };
}

export interface EmotionEngine {
  feel(stimulus: string, context?: Record<string, unknown>): EmotionResult;
  regulate(strategy?: string): { strategy: string; effectiveness: number; currentState: unknown };
  getCurrentState(): { mood: string; dimensions: { valence: number; arousal: number; dominance: number }; embodied: Record<string, unknown>; intensity: number };
  remember(event: unknown, emotionalSignificance: number): unknown;
  attach(target: string, bondStrength?: number): { bonding: number; trust: number };
  empathize(target: string, emotionalState: unknown): { response: string; emotionalState: unknown; body: unknown };
  getSummary(): Record<string, unknown>;
}

interface DeepEmotionBase {
  feel(stimulus: string, context?: Record<string, unknown>): unknown;
  regulate(strategy?: string): unknown;
  getCurrentState(): unknown;
  remember(event: unknown, emotionalSignificance: number): unknown;
  attach(target: string, bondStrength?: number): unknown;
  empathize(target: string, emotionalState: unknown): unknown;
  getSummary(): unknown;
}

export async function createEmotionEngine(_projectRoot?: string): Promise<EmotionEngine> {
  let DeepEmotion: new (projectRoot?: string) => DeepEmotionBase;
  try {
    const mod = await import('./deep-emotion.js');
    DeepEmotion = mod.DeepEmotion;
  } catch (e) {
    throw new Error(`Failed to load deep-emotion.js: ${e instanceof Error ? e.message : String(e)}`);
  }
  const instance = new DeepEmotion(_projectRoot) as unknown as DeepEmotionBase;

  return {
    feel(stimulus: string, context?: Record<string, unknown>) {
      return instance.feel(stimulus, context) as EmotionResult;
    },
    regulate(strategy?: string) {
      return instance.regulate(strategy) as ReturnType<EmotionEngine['regulate']>;
    },
    getCurrentState() {
      return instance.getCurrentState() as ReturnType<EmotionEngine['getCurrentState']>;
    },
    remember(event: unknown, emotionalSignificance: number) {
      return instance.remember(event, emotionalSignificance);
    },
    attach(target: string, bondStrength = 0.5) {
      return instance.attach(target, bondStrength) as ReturnType<EmotionEngine['attach']>;
    },
    empathize(target: string, emotionalState: unknown) {
      return instance.empathize(target, emotionalState) as ReturnType<EmotionEngine['empathize']>;
    },
    getSummary() {
      return instance.getSummary() as Record<string, unknown>;
    },
  };
}
