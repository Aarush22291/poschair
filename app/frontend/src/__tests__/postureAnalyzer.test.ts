import { beforeEach, describe, expect, it } from 'vitest';
import { analyzePose, resetPostureVelocityState } from '../postureAnalyzer';
import type { LandmarkList } from '../poseDetector';

function buildLandmarks(overrides: Partial<Record<number, { x: number; y: number; z?: number; visibility?: number }>> = {}): LandmarkList {
  const landmarks: LandmarkList = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));

  for (const [idx, value] of Object.entries(overrides)) {
    if (!value) continue;
    landmarks[Number(idx)] = {
      x: value.x,
      y: value.y,
      z: value.z ?? 0,
      visibility: value.visibility ?? 1,
    };
  }

  return landmarks;
}

describe('postureAnalyzer', () => {
  beforeEach(() => resetPostureVelocityState());

  it('returns high score for a calibrated neutral posture', () => {
    const lm = buildLandmarks({
      7: { x: 0.4, y: 0.3 },
      8: { x: 0.6, y: 0.3 },
      11: { x: 0.4, y: 0.4 },
      12: { x: 0.6, y: 0.4 },
      23: { x: 0.4, y: 0.7 },
      24: { x: 0.6, y: 0.7 },
    });

    const baseline = {
      spineAngle0: 0,
      lateralAngle0: 0,
      neckAngle0: 0,
      shoulderWidth: 0.2,
      torsoLength: 0.3,
    };

    const posture = analyzePose(lm, baseline);

    expect(posture).not.toBeNull();
    expect(posture?.postureScore).toBeGreaterThan(95);
    expect(posture?.spineDeviation).toBeCloseTo(0, 5);
    expect(posture?.measurementSource).toBe('image-2d');
    expect(posture?.confidence).toBeLessThan(0.65);
  });

  it('uses world depth to measure sagittal forward lean', () => {
    const image = buildLandmarks({
      7: { x: 0.4, y: 0.3 },
      8: { x: 0.6, y: 0.3 },
      11: { x: 0.4, y: 0.4 },
      12: { x: 0.6, y: 0.4 },
      23: { x: 0.4, y: 0.7 },
      24: { x: 0.6, y: 0.7 },
    });
    const world = buildLandmarks({
      7: { x: -0.1, y: -0.65, z: -0.28 },
      8: { x: 0.1, y: -0.65, z: -0.28 },
      11: { x: -0.2, y: -0.4, z: -0.2 },
      12: { x: 0.2, y: -0.4, z: -0.2 },
      23: { x: -0.15, y: 0, z: 0 },
      24: { x: 0.15, y: 0, z: 0 },
    });

    const posture = analyzePose(image, null, world);

    expect(posture?.measurementSource).toBe('world-3d');
    expect(posture?.confidence).toBe(1);
    expect(posture?.spineAngleDeg).toBeCloseTo(26.565, 2);
  });

  it('returns null when required landmarks are low-visibility', () => {
    const lm = buildLandmarks({
      7: { x: 0.4, y: 0.3 },
      8: { x: 0.6, y: 0.3 },
      11: { x: 0.4, y: 0.4 },
      12: { x: 0.6, y: 0.4 },
      23: { x: 0.4, y: 0.7 },
      24: { x: 0.6, y: 0.7, visibility: 0.2 },
    });

    expect(analyzePose(lm, null)).toBeNull();
  });
});
