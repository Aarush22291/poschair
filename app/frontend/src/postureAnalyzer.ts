import type { LandmarkList } from './poseDetector';

export interface PostureData {
  spineAngleDeg: number;
  lateralLeanDeg: number;
  forwardHeadRatio: number;
  spineDeviation: number | null;
  lateralDeviation: number | null;
  velocitySpine: number;
  velocityLateral: number;
  confidence: number;
  postureScore: number;
  timestamp: number;
}

export interface CalibrationBaseline {
  spineAngle0: number;
  lateralAngle0: number;
  shoulderWidth: number;
}

const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;

let prevTimestamp = 0;
let prevSpine = 0;
let prevLateral = 0;

/** Call at session start and after calibration to clear stale velocity state. */
export function resetPostureVelocityState(): void {
  prevTimestamp = 0;
  prevSpine = 0;
  prevLateral = 0;
}

const REQUIRED_LANDMARKS = [NOSE, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP];
const MIN_VISIBILITY = 0.5;

function hasLandmarks(lm: LandmarkList): boolean {
  return REQUIRED_LANDMARKS.every(
    (idx) => lm[idx] != null && (lm[idx].visibility ?? 1) >= MIN_VISIBILITY
  );
}

function dist2D(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function landmarkConfidence(lm: LandmarkList) {
  const indexes = [NOSE, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP];
  const values = indexes.map((idx) => lm[idx]?.visibility ?? 1);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function analyzePose(lm: LandmarkList, baseline: CalibrationBaseline | null): PostureData | null {
  // Guard: skip frames where required landmarks are missing or low-confidence
  if (!hasLandmarks(lm)) return null;

  const midShoulder = {
    x: (lm[L_SHOULDER].x + lm[R_SHOULDER].x) / 2,
    y: (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2,
  };
  const midHip = {
    x: (lm[L_HIP].x + lm[R_HIP].x) / 2,
    y: (lm[L_HIP].y + lm[R_HIP].y) / 2,
  };

  const dx = midShoulder.x - midHip.x;
  const dy = midShoulder.y - midHip.y;
  const spineAngleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);

  const lateralDx = lm[R_SHOULDER].x - lm[L_SHOULDER].x;
  const lateralDy = lm[R_SHOULDER].y - lm[L_SHOULDER].y;
  const lateralLeanDeg = Math.atan2(lateralDy, lateralDx) * (180 / Math.PI);

  const shoulderWidth = baseline?.shoulderWidth ?? dist2D(lm[L_SHOULDER], lm[R_SHOULDER]);
  const forwardHeadRatio = (lm[NOSE].x - midShoulder.x) / (shoulderWidth || 1);

  const spineDeviation = baseline ? spineAngleDeg - baseline.spineAngle0 : null;
  const lateralDeviation = baseline ? lateralLeanDeg - baseline.lateralAngle0 : null;

  const now = performance.now();
  const dt = prevTimestamp > 0 ? (now - prevTimestamp) / 1000 : 0;
  const velocitySpine = dt > 0 ? (spineAngleDeg - prevSpine) / dt : 0;
  const velocityLateral = dt > 0 ? (lateralLeanDeg - prevLateral) / dt : 0;
  prevTimestamp = now;
  prevSpine = spineAngleDeg;
  prevLateral = lateralLeanDeg;

  const confidence = landmarkConfidence(lm);
  const spinePenalty = Math.min(50, Math.abs(spineDeviation ?? spineAngleDeg) * 2.5);
  const lateralPenalty = Math.min(25, Math.abs(lateralDeviation ?? lateralLeanDeg) * 3.0);
  const headPenalty = Math.min(25, Math.abs(forwardHeadRatio) * 50);
  const postureScore = Math.max(0, Math.min(100, 100 - spinePenalty - lateralPenalty - headPenalty));

  return {
    spineAngleDeg,
    lateralLeanDeg,
    forwardHeadRatio,
    spineDeviation,
    lateralDeviation,
    velocitySpine,
    velocityLateral,
    confidence,
    postureScore,
    timestamp: now,
  };
}

export function captureCalibrationBaseline(
  frames: PostureData[],
  lmFrames: LandmarkList[]
): CalibrationBaseline {
  const avgSpine = frames.reduce((sum, frame) => sum + frame.spineAngleDeg, 0) / frames.length;
  const avgLateral = frames.reduce((sum, frame) => sum + frame.lateralLeanDeg, 0) / frames.length;
  const avgShoulderWidth = lmFrames.reduce(
    (sum, lm) => sum + dist2D(lm[L_SHOULDER], lm[R_SHOULDER]),
    0
  ) / lmFrames.length;

  return { spineAngle0: avgSpine, lateralAngle0: avgLateral, shoulderWidth: avgShoulderWidth };
}
