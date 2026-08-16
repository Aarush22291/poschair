// BASE uses /api proxy (defined in vite.config.ts) so it works identically
// in local dev, Docker, and Electron — no VITE_API_URL env var needed.
const BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function createProfile(name: string, heightCm: number, mode: string) {
  const r = await fetch(`${BASE}/profile/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, height_cm: heightCm, mode }),
  });
  if (!r.ok) throw new Error(`createProfile failed: ${r.status}`);
  return r.json();
}

export async function getProfile(userId: number) {
  const r = await fetch(`${BASE}/profile/${userId}`);
  if (!r.ok) throw new Error(`getProfile failed: ${r.status}`);
  return r.json();
}

export async function saveCalibration(
  userId: number,
  spineAngle0: number,
  lateralAngle0: number,
  shoulderWidth: number
) {
  const r = await fetch(`${BASE}/calibration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      spine_angle_0: spineAngle0,
      lateral_angle_0: lateralAngle0,
      shoulder_width: shoulderWidth,
    }),
  });
  if (!r.ok) throw new Error(`saveCalibration failed: ${r.status}`);
  return r.json();
}

export async function getCalibration(userId: number) {
  const r = await fetch(`${BASE}/calibration/${userId}`);
  if (!r.ok) throw new Error(`getCalibration failed: ${r.status}`);
  return r.json();
}

export async function logSession(
  userId: number,
  scoreAvg: number,
  pctGood: number,
  pctBad: number,
  scoreHistory: object[]
) {
  const r = await fetch(`${BASE}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      score_avg: scoreAvg,
      pct_good: pctGood,
      pct_bad: pctBad,
      score_history: scoreHistory,
    }),
  });
  if (!r.ok) throw new Error(`logSession failed: ${r.status}`);
  return r.json();
}

export async function getSessions(userId: number) {
  const r = await fetch(`${BASE}/sessions/${userId}`);
  if (!r.ok) throw new Error(`getSessions failed: ${r.status}`);
  return r.json();
}
