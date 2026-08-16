import type { LandmarkList } from './poseDetector';

// ── Landmark indices ────────────────────────────────────────────
const NOSE        = 0;
const L_EAR       = 7;
const R_EAR       = 8;
const L_SHOULDER  = 11;
const R_SHOULDER  = 12;
const L_HIP       = 23;
const R_HIP       = 24;

// ── Interfaces ─────────────────────────────────────────────────
export interface PostureData {
  spineAngleDeg: number;        // torso forward lean vs vertical
  lateralLeanDeg: number;       // shoulder roll left/right
  neckInclination: number;      // ear-shoulder angle vs vertical (FHP proxy)
  forwardHeadRatio: number;     // ear horizontal offset relative to shoulder width
  spineDeviation: number | null;
  lateralDeviation: number | null;
  neckDeviation: number | null;
  velocitySpine: number;
  velocityLateral: number;
  confidence: number;
  postureScore: number;
  timestamp: number;
}

export interface CalibrationBaseline {
  spineAngle0: number;
  lateralAngle0: number;
  neckAngle0: number;
  shoulderWidth: number;
  torsoLength: number;          // hip-to-shoulder distance for scale invariance
}

// ── EMA smoothing state ────────────────────────────────────────
// α = 0.35 — responsive to real movement but filters frame-to-frame jitter
const EMA_ALPHA = 0.35;
let emaSpine   = 0;
let emaLateral = 0;
let emaNeck    = 0;
let emaInitialised = false;

let prevTimestamp  = 0;
let prevSpine      = 0;
let prevLateral    = 0;

/** Call at session start and after calibration to clear all smoothing state. */
export function resetPostureVelocityState(): void {
  prevTimestamp  = 0;
  prevSpine      = 0;
  prevLateral    = 0;
  emaInitialised = false;
  emaSpine       = 0;
  emaLateral     = 0;
  emaNeck        = 0;
}

// ── Guards ─────────────────────────────────────────────────────
const REQUIRED_LANDMARKS = [NOSE, L_EAR, R_EAR, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP];
const MIN_VISIBILITY = 0.5;

function hasLandmarks(lm: LandmarkList): boolean {
  return REQUIRED_LANDMARKS.every(
    (idx) => lm[idx] != null && (lm[idx].visibility ?? 1) >= MIN_VISIBILITY
  );
}

// ── Geometry helpers ───────────────────────────────────────────
function dist2D(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Angle between vector (a→b) and the upward vertical.
 * Returns degrees in range (-90, 90): positive = leaning right/forward.
 * Uses atan2(dx, -dy) so that a perfectly vertical vector (dy < 0, dx = 0) = 0°.
 */
function angleFromVertical(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.atan2(b.x - a.x, -(b.y - a.y)) * (180 / Math.PI);
}

/**
 * Neck inclination angle — angle between the ear→shoulder segment and vertical.
 * With a front-facing camera:
 *   - ear above shoulder → ~0° (good, head is level)
 *   - ear moved horizontally away from shoulder → higher angle (FHP or tilt)
 * We average left and right sides to reduce single-occlusion error.
 */
function neckInclinationAngle(lm: LandmarkList): number {
  const lAngle = Math.atan2(
    Math.abs(lm[L_EAR].x - lm[L_SHOULDER].x),
    Math.abs(lm[L_EAR].y - lm[L_SHOULDER].y)
  ) * (180 / Math.PI);

  const rAngle = Math.atan2(
    Math.abs(lm[R_EAR].x - lm[R_SHOULDER].x),
    Math.abs(lm[R_EAR].y - lm[R_SHOULDER].y)
  ) * (180 / Math.PI);

  // Weight toward the more visible side
  const lVis = lm[L_EAR].visibility ?? 0.5;
  const rVis = lm[R_EAR].visibility ?? 0.5;
  const total = lVis + rVis;
  return (lAngle * lVis + rAngle * rVis) / (total || 1);
}

function landmarkConfidence(lm: LandmarkList) {
  const idxs = [NOSE, L_EAR, R_EAR, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP];
  const vals = idxs.map((i) => lm[i]?.visibility ?? 0);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

// ── Main analyzer ──────────────────────────────────────────────
export function analyzePose(
  lm: LandmarkList,
  baseline: CalibrationBaseline | null
): PostureData | null {
  if (!hasLandmarks(lm)) return null;

  // ── Midpoints ──────────────────────────────────────────────
  const midShoulder = {
    x: (lm[L_SHOULDER].x + lm[R_SHOULDER].x) / 2,
    y: (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2,
  };
  const midHip = {
    x: (lm[L_HIP].x + lm[R_HIP].x) / 2,
    y: (lm[L_HIP].y + lm[R_HIP].y) / 2,
  };
  const midEar = {
    x: (lm[L_EAR].x + lm[R_EAR].x) / 2,
    y: (lm[L_EAR].y + lm[R_EAR].y) / 2,
  };

  // ── Scale-invariant spine angle (hip → shoulder vs vertical) ───
  const currentTorsoLength = dist2D(midHip, midShoulder);
  const torsoScale = baseline?.torsoLength ? (currentTorsoLength / baseline.torsoLength) : 1.0;
  const rawSpine = angleFromVertical(midHip, midShoulder) / (torsoScale || 1.0);

  // ── Lateral lean — shoulder roll angle (right_shoulder - left_shoulder tilt) ─
  const lateralDx = lm[R_SHOULDER].x - lm[L_SHOULDER].x;
  const lateralDy = lm[R_SHOULDER].y - lm[L_SHOULDER].y;
  const rawLateral = Math.atan2(lateralDy, lateralDx) * (180 / Math.PI);

  // ── Neck inclination (FHP proxy) ───────────────────────────
  const rawNeck = neckInclinationAngle(lm);

  // ── EMA smoothing ──────────────────────────────────────────
  if (!emaInitialised) {
    emaSpine   = rawSpine;
    emaLateral = rawLateral;
    emaNeck    = rawNeck;
    emaInitialised = true;
  } else {
    emaSpine   = EMA_ALPHA * rawSpine   + (1 - EMA_ALPHA) * emaSpine;
    emaLateral = EMA_ALPHA * rawLateral + (1 - EMA_ALPHA) * emaLateral;
    emaNeck    = EMA_ALPHA * rawNeck    + (1 - EMA_ALPHA) * emaNeck;
  }

  const spineAngleDeg   = emaSpine;
  const lateralLeanDeg  = emaLateral;
  const neckInclination = emaNeck;

  // ── Scale-invariant forward head ratio ────────────────────
  // Horizontal ear offset relative to shoulder, normalised by shoulder width and torso scale.
  const shoulderWidth = baseline?.shoulderWidth ?? dist2D(lm[L_SHOULDER], lm[R_SHOULDER]);
  const earHorizOffset = midEar.x - midShoulder.x;
  const forwardHeadRatio = earHorizOffset / ((shoulderWidth * torsoScale) || 0.01);

  // ── Deviations from calibrated baseline ──────────────────
  const spineDeviation   = baseline ? spineAngleDeg   - baseline.spineAngle0   : null;
  const lateralDeviation = baseline ? lateralLeanDeg  - baseline.lateralAngle0 : null;
  const neckDeviation    = baseline ? neckInclination - baseline.neckAngle0    : null;

  // ── Velocity (smoothed angle change per second) ──────────
  const now = performance.now();
  const dt = prevTimestamp > 0 ? (now - prevTimestamp) / 1000 : 0;
  const velocitySpine   = dt > 0 ? (spineAngleDeg  - prevSpine)   / dt : 0;
  const velocityLateral = dt > 0 ? (lateralLeanDeg - prevLateral) / dt : 0;
  prevTimestamp = now;
  prevSpine     = spineAngleDeg;
  prevLateral   = lateralLeanDeg;

  // ── Posture Score (0–100) ─────────────────────────────────
  // Each component is normalised to its "critical" threshold before penalising:
  //   Spine: baseline deviation > 20° → max penalty (40pts)
  //   Lateral: deviation > 10° → max penalty (30pts)
  //   Neck: inclination > 30° from baseline → max penalty (30pts)
  // Using baseline deviation when calibrated, raw angles as fallback.
  const spineErr   = Math.abs(spineDeviation   ?? spineAngleDeg);
  const lateralErr = Math.abs(lateralDeviation ?? lateralLeanDeg);
  const neckErr    = Math.abs(neckDeviation    ?? (neckInclination - 15)); // 15° natural rest

  const spinePenalty   = Math.min(40, (spineErr   / 20)  * 40);
  const lateralPenalty = Math.min(30, (lateralErr / 10)  * 30);
  const neckPenalty    = Math.min(30, (neckErr    / 25)  * 30);

  const postureScore = Math.max(0, Math.min(100,
    100 - spinePenalty - lateralPenalty - neckPenalty
  ));

  const confidence = landmarkConfidence(lm);

  return {
    spineAngleDeg,
    lateralLeanDeg,
    neckInclination,
    forwardHeadRatio,
    spineDeviation,
    lateralDeviation,
    neckDeviation,
    velocitySpine,
    velocityLateral,
    confidence,
    postureScore,
    timestamp: now,
  };
}

// ── Calibration ────────────────────────────────────────────────
export function captureCalibrationBaseline(
  frames: PostureData[],
  lmFrames: LandmarkList[]
): CalibrationBaseline {
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const avgSpine   = avg(frames.map(f => f.spineAngleDeg));
  const avgLateral = avg(frames.map(f => f.lateralLeanDeg));
  const avgNeck    = avg(frames.map(f => f.neckInclination));

  const avgShoulderWidth = avg(
    lmFrames.map(lm => dist2D(lm[L_SHOULDER], lm[R_SHOULDER]))
  );
  const avgTorsoLength = avg(lmFrames.map(lm => {
    const midSh = { x: (lm[L_SHOULDER].x + lm[R_SHOULDER].x) / 2, y: (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2 };
    const midHp = { x: (lm[L_HIP].x + lm[R_HIP].x) / 2, y: (lm[L_HIP].y + lm[R_HIP].y) / 2 };
    return dist2D(midSh, midHp);
  }));

  return {
    spineAngle0:   avgSpine,
    lateralAngle0: avgLateral,
    neckAngle0:    avgNeck,
    shoulderWidth: avgShoulderWidth,
    torsoLength:   avgTorsoLength,
  };
}
