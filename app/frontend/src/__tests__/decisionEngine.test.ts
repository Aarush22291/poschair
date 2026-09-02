import { beforeEach, describe, expect, it } from 'vitest';
import { computeTargetPositions, resetDecisionState, type Mode } from '../decisionEngine';
import type { PostureData } from '../postureAnalyzer';

function buildPosture(overrides: Partial<PostureData> = {}): PostureData {
  return {
    spineAngleDeg: 0,
    lateralLeanDeg: 0,
    neckInclination: 15,
    forwardHeadRatio: 0,
    spineDeviation: 0,
    lateralDeviation: 0,
    neckDeviation: 0,
    velocitySpine: 0,
    velocityLateral: 0,
    confidence: 1,
    postureScore: 100,
    timestamp: 1,
    ...overrides,
  };
}

describe('decisionEngine', () => {
  const mode: Mode = 'office';

  beforeEach(() => {
    resetDecisionState();
  });

  it('keeps previous positions when confidence is too low', () => {
    const first = computeTargetPositions(buildPosture({ spineDeviation: 12, confidence: 1 }), mode);
    const lowConfidence = computeTargetPositions(buildPosture({ spineDeviation: 30, confidence: 0.2 }), mode);

    expect(first.some((v) => v > 0)).toBe(true);
    expect(lowConfidence).toEqual(first);
  });

  it('applies right-column boost for right lateral lean', () => {
    const result = computeTargetPositions(
      buildPosture({ spineDeviation: 10, lateralDeviation: 5, velocitySpine: 4 }),
      mode,
    );

    expect(result[1]).toBeGreaterThan(result[0]);
    expect(result[3]).toBeGreaterThan(result[2]);
    expect(result[5]).toBeGreaterThan(result[4]);
    expect(result.every((value) => value >= 0 && value <= 55)).toBe(true);
  });

  it('applies dead-band and ignores tiny changes', () => {
    const first = computeTargetPositions(buildPosture({ spineDeviation: 8 }), mode);
    const second = computeTargetPositions(buildPosture({ spineDeviation: 9 }), mode);

    expect(second).toEqual(first);
  });
});
