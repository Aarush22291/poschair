const BASE = import.meta.env.VITE_API_URL ?? '/api';
const USE_LOCAL_STORE = import.meta.env.VITE_DATA_MODE === 'local'
  || window.location.protocol === 'file:';

type JsonRecord = Record<string, unknown>;

interface StoredUser extends JsonRecord {
  id: number;
  name: string;
  height_cm: number | null;
  chair_type: string;
  mode: string;
  created_at: string;
}

interface StoredCalibration extends JsonRecord {
  id: number;
  user_id: number;
  spine_angle_0: number;
  lateral_angle_0: number;
  neck_angle_0: number;
  shoulder_width: number;
  torso_length: number;
  created_at: string;
}

interface StoredSession extends JsonRecord {
  id: number;
  user_id: number;
  score_avg: number;
  pct_good: number;
  pct_bad: number;
  score_history: object[];
  started_at: string;
  ended_at: string;
}

const STORAGE_KEYS = {
  users: 'poschair.users.v1',
  calibrations: 'poschair.calibrations.v1',
  sessions: 'poschair.sessions.v1',
} as const;

function readStore<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T[] : [];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, values: T[]): void {
  localStorage.setItem(key, JSON.stringify(values));
}

function nextId(values: Array<{ id: number }>): number {
  return values.reduce((max, value) => Math.max(max, value.id), 0) + 1;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function createProfile(name: string, heightCm: number, mode: string) {
  if (USE_LOCAL_STORE) {
    const users = readStore<StoredUser>(STORAGE_KEYS.users);
    const user: StoredUser = {
      id: nextId(users),
      name,
      height_cm: heightCm,
      chair_type: 'office',
      mode,
      created_at: new Date().toISOString(),
    };
    writeStore(STORAGE_KEYS.users, [...users, user]);
    return user;
  }

  return requestJson<StoredUser>('/profile/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, height_cm: heightCm, mode }),
  });
}

export async function getProfile(userId: number) {
  if (USE_LOCAL_STORE) {
    const user = readStore<StoredUser>(STORAGE_KEYS.users).find((item) => item.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }
  return requestJson<StoredUser>(`/profile/${userId}`);
}

export async function saveCalibration(
  userId: number,
  spineAngle0: number,
  lateralAngle0: number,
  neckAngle0: number,
  shoulderWidth: number,
  torsoLength: number
) {
  const payload = {
    user_id: userId,
    spine_angle_0: spineAngle0,
    lateral_angle_0: lateralAngle0,
    neck_angle_0: neckAngle0,
    shoulder_width: shoulderWidth,
    torso_length: torsoLength,
  };

  if (USE_LOCAL_STORE) {
    const calibrations = readStore<StoredCalibration>(STORAGE_KEYS.calibrations);
    const calibration: StoredCalibration = {
      id: nextId(calibrations),
      ...payload,
      created_at: new Date().toISOString(),
    };
    writeStore(STORAGE_KEYS.calibrations, [...calibrations, calibration]);
    return calibration;
  }

  return requestJson<StoredCalibration>('/calibration/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getCalibration(userId: number) {
  if (USE_LOCAL_STORE) {
    const calibrations = readStore<StoredCalibration>(STORAGE_KEYS.calibrations)
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (!calibrations[0]) throw new Error('No calibration found');
    return calibrations[0];
  }
  return requestJson<StoredCalibration>(`/calibration/${userId}`);
}

export async function logSession(
  userId: number,
  scoreAvg: number,
  pctGood: number,
  pctBad: number,
  scoreHistory: object[]
) {
  const payload = {
    user_id: userId,
    score_avg: scoreAvg,
    pct_good: pctGood,
    pct_bad: pctBad,
    score_history: scoreHistory,
  };

  if (USE_LOCAL_STORE) {
    const sessions = readStore<StoredSession>(STORAGE_KEYS.sessions);
    const firstSample = scoreHistory[0] as { t?: number } | undefined;
    const session: StoredSession = {
      id: nextId(sessions),
      ...payload,
      started_at: new Date(firstSample?.t ?? Date.now()).toISOString(),
      ended_at: new Date().toISOString(),
    };
    writeStore(STORAGE_KEYS.sessions, [...sessions, session]);
    return session;
  }

  return requestJson<StoredSession>('/sessions/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getSessions(userId: number) {
  if (USE_LOCAL_STORE) {
    return readStore<StoredSession>(STORAGE_KEYS.sessions)
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, 30);
  }
  return requestJson<StoredSession[]>(`/sessions/${userId}`);
}
