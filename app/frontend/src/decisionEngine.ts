import type { PostureData } from './postureAnalyzer';

export type Mode = 'office' | 'gaming' | 'study' | 'relax';
export interface DecisionOptions {
  sensitivityScale?: number;
  maxPositionMm?: number;
  injurySafeMode?: boolean;
}

// Module index → 2×3 grid position
// 0=UL  1=UR
// 2=ML  3=MR
// 4=LL  5=LR
export const MODULE_LABELS = [
  'Upper-Left',
  'Upper-Right',
  'Mid-Left',
  'Mid-Right',
  'Lower-Left',
  'Lower-Right',
];

// Must match MAX_POSITION_MM in firmware/config.h
const MAX_POSITION_MM = 55;

const MODE_SCALE: Record<Mode, number> = {
  office: 1.0,
  gaming: 1.2,
  study: 0.85,
  relax: 0.5,
};

export const CONFIDENCE_THRESHOLD = 0.65;
const MIN_POSITION_CHANGE = 3;

/**
 * Map forward-lean deviation (degrees) to raw module positions (0–MAX_POSITION_MM).
 * Multipliers tuned so 25° forward deviation → roughly full mid extension (~55mm).
 *   upper: 25 * 1.4 = 35mm  (upper back needs less correction)
 *   mid:   25 * 2.2 = 55mm  (lumbar bears the most load)
 *   lower: 25 * 1.8 = 45mm  (sacral support)
 */
function forwardPositions(deviation: number, maxPosition: number): { upper: number; mid: number; lower: number } {
  const d = Math.max(0, deviation);
  return {
    upper: Math.min(maxPosition, d * 1.4),
    mid:   Math.min(maxPosition, d * 2.2),
    lower: Math.min(maxPosition, d * 1.8),
  };
}

/**
 * Velocity bonus: adds extra extension (mm) when the user is slumping fast.
 * Returned value is added directly to position, not to the angle.
 * Capped at 15mm so it can't push beyond MAX_POSITION_MM on its own.
 */
function velocityBonus(velocitySpine: number): number {
  if (velocitySpine < 1) return 0;
  if (velocitySpine < 3) return 4;
  if (velocitySpine < 6) return 9;
  return 15;
}

/**
 * Lateral split: when the user leans RIGHT, the RIGHT column must push harder
 * (it presses them back toward centre). When leaning LEFT, LEFT column pushes harder.
 *
 * NOTE: This was previously inverted (left bonus on right lean), which made
 *       the chair actively push the user further into their lean.
 */
function lateralSplit(lateralDeviation: number, maxPosition: number): { leftBonus: number; rightBonus: number } {
  const boost = Math.min(maxPosition * 0.7, Math.abs(lateralDeviation) * 3.0);
  if (lateralDeviation > 2)  return { leftBonus: 0,     rightBonus: boost }; // lean right → right column pushes
  if (lateralDeviation < -2) return { leftBonus: boost,  rightBonus: 0   }; // lean left  → left  column pushes
  return { leftBonus: 0, rightBonus: 0 };
}

let prevPositions = [0, 0, 0, 0, 0, 0];

/** Call at session start and end to clear the dead-band reference positions. */
export function resetDecisionState(): void {
  prevPositions = [0, 0, 0, 0, 0, 0];
}

export function computeTargetPositions(posture: PostureData, mode: Mode, options: DecisionOptions = {}): number[] {
  const sensitivityScale = Math.min(1.5, Math.max(0.5, options.sensitivityScale ?? 1));
  const requestedMax = Math.min(MAX_POSITION_MM, Math.max(20, options.maxPositionMm ?? MAX_POSITION_MM));
  const dynamicMax = options.injurySafeMode ? Math.min(requestedMax, 40) : requestedMax;

  if (posture.confidence < CONFIDENCE_THRESHOLD) {
    prevPositions = prevPositions.map((value) => Math.min(dynamicMax, value));
    return prevPositions;
  }

  const scale = MODE_SCALE[mode] * sensitivityScale;
  const fwd = Math.max(0, posture.spineDeviation ?? posture.spineAngleDeg);
  const lat = posture.lateralDeviation ?? posture.lateralLeanDeg;

  // Velocity bonus is in mm, applied after scale so it respects mode aggressiveness
  const vBonus = velocityBonus(posture.velocitySpine) * scale;
  const fwdPos = forwardPositions(fwd * scale, dynamicMax);
  const latMod = lateralSplit(lat, dynamicMax);

  const raw = [
    fwdPos.upper + latMod.leftBonus  + vBonus, // UL
    fwdPos.upper + latMod.rightBonus + vBonus, // UR
    fwdPos.mid   + latMod.leftBonus  + vBonus, // ML
    fwdPos.mid   + latMod.rightBonus + vBonus, // MR
    fwdPos.lower + latMod.leftBonus  + vBonus, // LL
    fwdPos.lower + latMod.rightBonus + vBonus, // LR
  ].map((value) => Math.min(dynamicMax, Math.max(0, Math.round(value))));

  const result = raw.map((value, index) =>
    Math.abs(value - prevPositions[index]) >= MIN_POSITION_CHANGE ? value : prevPositions[index]
  );
  prevPositions = result;
  return result;
}

export function isLateralLean(posture: PostureData): boolean {
  return Math.abs(posture.lateralDeviation ?? posture.lateralLeanDeg) > 3;
}

export function lateralLeanDirection(posture: PostureData): 'left' | 'right' | null {
  const lat = posture.lateralDeviation ?? posture.lateralLeanDeg;
  if (lat > 3)  return 'right';
  if (lat < -3) return 'left';
  return null;
}

export function getPostureLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

export function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}
