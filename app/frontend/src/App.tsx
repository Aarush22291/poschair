import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Bluetooth, RefreshCw, Activity, Sliders, Eye, Cpu, ShieldAlert, PauseCircle, User } from 'lucide-react';
import { createBLEManager, StatusData } from './bleManager';
import { LandmarkList } from './poseDetector';
import { analyzePose, CalibrationBaseline, PostureData, resetPostureVelocityState } from './postureAnalyzer';
import { CONFIDENCE_THRESHOLD, computeTargetPositions, Mode, resetDecisionState } from './decisionEngine';
import {
  getProfile,
  createProfile,
  getSessions,
  getCalibration,
  saveCalibration as saveCalToApi,
  logSession
} from './apiClient';

// Import components
import { CameraView } from './components/CameraView';
import { SpineVisualizer } from './components/SpineVisualizer';
import { CalibrationModal } from './components/CalibrationModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BLEStatusBar } from './components/BLEStatusBar';
import { ModeSelector } from './components/ModeSelector';
import { LateralLeanAlert } from './components/LateralLeanAlert';

interface PersonalizationProfile {
  bodyProfile: 'petite' | 'standard' | 'tall';
  workStyle: 'focused' | 'balanced' | 'relaxed';
  sensitivity: number;
  maxSupportMm: number;
  cooldownSeconds: number;
  injurySafeMode: boolean;
}

const DEFAULT_PROFILE: PersonalizationProfile = {
  bodyProfile: 'standard',
  workStyle: 'balanced',
  sensitivity: 1,
  maxSupportMm: 55,
  cooldownSeconds: 30,
  injurySafeMode: true,
};

export default function App() {
  const [userId, setUserId] = useState<number | null>(1);
  const [mode, setMode] = useState<Mode>('office');

  // Operational tracking mode: 'cv' (Computer Vision only) vs 'both' (CV + hardware BLE write control)
  const [trackingMode, setTrackingMode] = useState<'cv' | 'both'>('both');

  // BLE states
  const [bleConnected, setBleConnected] = useState(false);
  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [bleStatus, setBleStatus] = useState<StatusData | null>(null);
  const [lastPacketTime, setLastPacketTime] = useState<number | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);

  // System states
  const [isTracking, setIsTracking] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [baseline, setBaseline] = useState<CalibrationBaseline | null>(null);
  const [latestPosture, setLatestPosture] = useState<PostureData | null>(null);
  const [targetPositions, setTargetPositions] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [currentLandmarks, setCurrentLandmarks] = useState<LandmarkList | null>(null);

  // Session stats
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState('');
  const [sessionScoreHistory, setSessionScoreHistory] = useState<{ t: number; score: number }[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [profileSettings, setProfileSettings] = useState<PersonalizationProfile>(DEFAULT_PROFILE);
  const [discomfortStart, setDiscomfortStart] = useState(5);
  const [discomfortCurrent, setDiscomfortCurrent] = useState(5);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [uiNow, setUiNow] = useState(Date.now());

  // Instantiate BLE manager
  const bleManager = useMemo(() => createBLEManager(), []);

  // Hook BLE status listeners
  useEffect(() => {
    bleManager.onStatus = (status) => {
      setBleStatus(status);
      setBleConnected(true);
      setLastPacketTime(Date.now());
    };
    bleManager.onDisconnect = () => {
      setBleConnected(false);
      setBleStatus(null);
    };
  }, [bleManager]);

  // BLE packet watchdog — drops "Connected" state after 3s silence (matches firmware 2s failsafe)
  useEffect(() => {
    if (!bleConnected || !lastPacketTime) return;
    const id = setInterval(() => {
      if (Date.now() - lastPacketTime > 3000) {
        setBleConnected(false);
        setBleStatus(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [bleConnected, lastPacketTime]);

  // Load user data on startup — retry loop handles slow backend boot in docker-compose
  useEffect(() => {
    async function loadWithRetry(retries = 5): Promise<void> {
      for (let i = 0; i < retries; i++) {
        try {
          let user = await getProfile(1).catch(() => null);
          if (!user) user = await createProfile('User', 175, 'office');
          setUserId(user.id);
          setMode(user.mode as Mode);

          const logs = await getSessions(user.id).catch(() => []);
          setPastSessions(logs || []);

          const cal = await getCalibration(user.id).catch(() => null);
          if (cal) {
            setBaseline({
              spineAngle0:   cal.spine_angle_0,
              lateralAngle0: cal.lateral_angle_0 ?? 0.0,
              neckAngle0:    cal.neck_angle_0    ?? 15.0,
              shoulderWidth: cal.shoulder_width,
              torsoLength:   cal.torso_length    ?? 0.3,
            });
          }
          return; // success — exit retry loop
        } catch {
          if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
        }
      }
      console.warn('Backend offline — running in offline mode.');
    }
    loadWithRetry();
  }, []);

  useEffect(() => {
    const storedProfile = localStorage.getItem('poschair.personalization');
    if (storedProfile) {
      try {
        setProfileSettings({ ...DEFAULT_PROFILE, ...JSON.parse(storedProfile) });
      } catch {
        console.warn('Profile settings could not be loaded from local storage.');
      }
    }
    const storedDiscomfort = localStorage.getItem('poschair.discomfort');
    if (storedDiscomfort) {
      try {
        const parsed = JSON.parse(storedDiscomfort);
        setDiscomfortStart(parsed.start ?? 5);
        setDiscomfortCurrent(parsed.current ?? parsed.start ?? 5);
      } catch {
        console.warn('Discomfort scores could not be loaded from local storage.');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('poschair.personalization', JSON.stringify(profileSettings));
  }, [profileSettings]);

  useEffect(() => {
    localStorage.setItem('poschair.discomfort', JSON.stringify({ start: discomfortStart, current: discomfortCurrent }));
  }, [discomfortStart, discomfortCurrent]);

  useEffect(() => {
    const id = setInterval(() => setUiNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Session elapsed timer — updates every second while session is active
  useEffect(() => {
    if (!sessionStartTime) { setSessionElapsed(''); return; }
    const tick = () => {
      const s = Math.floor((Date.now() - sessionStartTime) / 1000);
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      setSessionElapsed(`${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionStartTime]);

  // Frame processing
  const lastSendTime = useRef<number>(0);
  const handleLandmarks = useCallback((landmarks: LandmarkList) => {
    setCurrentLandmarks(landmarks);

    // Analyze pose relative to baseline
    const posture = analyzePose(landmarks, baseline);
    if (!posture) return; // incomplete landmark set — skip frame
    setLatestPosture(posture);

    const bodyScale = profileSettings.bodyProfile === 'petite' ? 0.9 : profileSettings.bodyProfile === 'tall' ? 1.05 : 1;
    const workScale = profileSettings.workStyle === 'focused' ? 1.1 : profileSettings.workStyle === 'relaxed' ? 0.85 : 1;
    const rawPositions = computeTargetPositions(posture, mode, {
      sensitivityScale: profileSettings.sensitivity * bodyScale * workScale,
      maxPositionMm: profileSettings.maxSupportMm,
      injurySafeMode: profileSettings.injurySafeMode,
    });
    const cooldownActive = cooldownUntil !== null && Date.now() < cooldownUntil;
    const positions = (emergencyStop || cooldownActive) ? [0, 0, 0, 0, 0, 0] : rawPositions;
    setTargetPositions(positions);

    // Throttled BLE send (Only transmits to ESP32 if trackingMode is 'both')
    const now = Date.now();
    if (now - lastSendTime.current >= 100) {
      lastSendTime.current = now;
      if (bleConnected && trackingMode === 'both' && posture.confidence >= CONFIDENCE_THRESHOLD) {
        bleManager.sendPositions(positions);
      }
    }

    // Capture score history if session is active
    if (sessionStartTime) {
      setSessionScoreHistory(prev => {
        const next = [...prev, { t: Date.now(), score: posture.postureScore }];
        return next.slice(-60); // Keep last 60 samples
      });
    }
  }, [baseline, bleConnected, bleManager, mode, sessionStartTime, trackingMode, profileSettings, emergencyStop, cooldownUntil]);

  const handleCalibrated = async (newBaseline: CalibrationBaseline) => {
    setBaseline(newBaseline);
    resetPostureVelocityState(); // clear stale velocity after recalibration
    if (userId) {
      try {
        await saveCalToApi(
          userId,
          newBaseline.spineAngle0,
          newBaseline.lateralAngle0,
          newBaseline.neckAngle0,
          newBaseline.shoulderWidth,
          newBaseline.torsoLength
        );
      } catch {
        console.warn('Unable to save calibration to backend database.');
      }
    }
  };

  const toggleBLE = async () => {
    if (bleConnected) {
      bleManager.disconnect();
    } else {
      try {
        setIsBleConnecting(true);
        await bleManager.connect();
      } catch (err) {
        const msg = (err as Error).message;
        setBleError(msg);
        setTimeout(() => setBleError(null), 5000);
      } finally {
        setIsBleConnecting(false);
      }
    }
  };

  const startSession = () => {
    resetPostureVelocityState();
    resetDecisionState();
    setSessionStartTime(Date.now());
    setSessionScoreHistory([]);
    setDiscomfortCurrent(discomfortStart);
  };

  const endSession = async () => {
    resetDecisionState();

    if (!sessionStartTime || sessionScoreHistory.length === 0) {
      setSessionStartTime(null);
      setSessionElapsed('');
      return;
    }

    const scores = sessionScoreHistory.map(h => h.score);
    const avgScore = scores.reduce((s, val) => s + val, 0) / scores.length;
    const goodCount = scores.filter(s => s >= 75).length;
    const goodPct = (goodCount / scores.length) * 100;

    if (userId) {
      try {
        await logSession(userId, avgScore, goodPct, 100 - goodPct, sessionScoreHistory);
        const refreshed = await getSessions(userId);
        setPastSessions(refreshed || []);
      } catch {
        console.warn('Backend logs write failed.');
      }
    }

    setSessionStartTime(null);
    setSessionElapsed('');
    setSessionScoreHistory([]);
    setTargetPositions([0, 0, 0, 0, 0, 0]);
    if (bleConnected && trackingMode === 'both') {
      bleManager.sendPositions([0, 0, 0, 0, 0, 0]);
    }
  };

  const handleManualPositionChange = (idx: number, val: number) => {
    const next = [...targetPositions];
    next[idx] = val;
    setTargetPositions(next);
    if (bleConnected && trackingMode === 'both') {
      bleManager.sendPositions(next);
    }
  };

  const triggerCooldown = useCallback(() => {
    const until = Date.now() + (profileSettings.cooldownSeconds * 1000);
    setCooldownUntil(until);
    setEmergencyStop(false);
    setTargetPositions([0, 0, 0, 0, 0, 0]);
    if (bleConnected && trackingMode === 'both') {
      bleManager.sendPositions([0, 0, 0, 0, 0, 0]);
    }
  }, [profileSettings.cooldownSeconds, bleConnected, trackingMode, bleManager]);

  const toggleEmergencyStop = useCallback(() => {
    setEmergencyStop((prev) => {
      const next = !prev;
      if (next) {
        setCooldownUntil(null);
        setTargetPositions([0, 0, 0, 0, 0, 0]);
        if (bleConnected && trackingMode === 'both') {
          bleManager.sendPositions([0, 0, 0, 0, 0, 0]);
        }
      }
      return next;
    });
  }, [bleConnected, trackingMode, bleManager]);

  const confidencePct = latestPosture ? Math.round(latestPosture.confidence * 100) : 0;
  const confidenceColor = confidencePct >= 65 ? 'var(--accent-green)' : confidencePct >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)';
  const spineVelocity = latestPosture?.velocitySpine ?? 0;
  const velocityColor = spineVelocity > 3 ? 'var(--accent-red)' : spineVelocity < -1 ? 'var(--accent-green)' : 'var(--text-secondary)';
  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - uiNow) / 1000)) : 0;
  const cooldownActive = cooldownRemaining > 0;

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header bar */}
      <header className="glass-panel" style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: '0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-blue-dark)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.03)' }}>
            P
          </div>
          <div>
            <h1 style={{ fontSize: '20px', letterSpacing: '0.05em' }}>POS<span style={{ color: 'var(--accent-cyan)' }}>CHAIR</span></h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Active Posture Correction System</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Connect button */}
          <button onClick={toggleBLE} className={`btn ${bleConnected ? 'btn-success' : 'btn-secondary'}`} disabled={isBleConnecting}>
            {isBleConnecting ? (
              <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }} />
            ) : (
              <Bluetooth size={16} />
            )}
            <span>{isBleConnecting ? 'Connecting...' : bleConnected ? 'Connected' : 'Connect Chair'}</span>
          </button>

          {/* Camera Button */}
          <button onClick={() => setIsTracking(!isTracking)} className={`btn ${isTracking ? 'btn-primary' : 'btn-secondary'}`}>
            <span>{isTracking ? 'Stop Camera' : 'Enable Tracking'}</span>
          </button>
        </div>
      </header>

      {/* CV-only mode banner */}
      {trackingMode === 'cv' && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.06)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.18)',
          padding: '6px 40px',
          fontSize: 12,
          color: 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: '0',
        }}>
          <Eye size={12} />
          Computer Vision Mode — posture is analysed but actuator output is not transmitted to chair
        </div>
      )}

      {/* BLE error toast */}
      {bleError && (
        <div style={{
          position: 'fixed', top: 80, right: 24,
          background: 'var(--accent-red-dark)',
          border: '1px solid var(--accent-red)',
          borderRadius: 10, padding: '12px 18px',
          color: 'var(--text-primary)', fontSize: 13,
          zIndex: 200, maxWidth: 320,
          boxShadow: 'var(--glass-shadow)',
        }}>
          <strong>BLE Error:</strong> {bleError}
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        {/* Main Grid */}
        <div className="dashboard-grid">

          {/* Left Column */}
          <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <CameraView
              isTracking={isTracking}
              score={latestPosture?.postureScore ?? null}
              onLandmarks={handleLandmarks}
              latestPosture={latestPosture}
              targetPositions={targetPositions}
            />

            <LateralLeanAlert posture={latestPosture} />

            {latestPosture && (
              <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Detection Confidence</span>
                    <strong style={{ color: confidenceColor }}>{confidencePct}%</strong>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-dark)', overflow: 'hidden' }}>
                    <div style={{ width: `${confidencePct}%`, height: '100%', background: confidenceColor, transition: 'width 0.2s ease' }} />
                  </div>
                  {latestPosture.confidence < 0.4 && (
                    <span style={{ color: 'var(--accent-red)', fontSize: '12px' }}>
                      Low detection confidence - move camera closer or improve lighting.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Spine Velocity</span>
                  <strong style={{ color: velocityColor, fontSize: '18px' }}>
                    {spineVelocity >= 0 ? '+' : ''}{spineVelocity.toFixed(1)} deg/s
                  </strong>
                </div>
              </div>
            )}

            {/* Calibration & Session Clock Controls */}
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setCalibrating(true)} className="btn btn-secondary" disabled={!isTracking}>
                  Calibrate Baseline
                </button>

                <button
                  onClick={sessionStartTime ? endSession : startSession}
                  className={`btn ${sessionStartTime ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={!isTracking}
                >
                  {sessionStartTime ? 'End Monitoring' : 'Start Session'}
                </button>
              </div>

              {sessionStartTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} className="pulsing-glow" style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    Session Active
                  </span>
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
                    {sessionElapsed}
                  </span>
                </div>
              )}
            </div>

            <AnalyticsDashboard
              sessionScoreHistory={sessionScoreHistory}
              pastSessions={pastSessions}
              discomfortStart={discomfortStart}
              discomfortCurrent={discomfortCurrent}
            />

          </div>

          {/* Right Column */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <SpineVisualizer
              targetPositions={targetPositions}
              currentPositions={bleConnected && bleStatus ? bleStatus.currentPositions : targetPositions}
              isHomed={bleStatus?.isHomed ?? false}
              isMoving={bleStatus?.isMoving ?? false}
            />

            <ModeSelector
              currentMode={mode}
              onChange={(m) => setMode(m)}
            />

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <User size={18} style={{ color: 'var(--accent-cyan)' }} />
                Personalized Correction Profile
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Body Profile
                  <select
                    value={profileSettings.bodyProfile}
                    onChange={(e) => setProfileSettings((prev) => ({ ...prev, bodyProfile: e.target.value as PersonalizationProfile['bodyProfile'] }))}
                    style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px' }}
                  >
                    <option value="petite">Petite</option>
                    <option value="standard">Standard</option>
                    <option value="tall">Tall</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Work Style
                  <select
                    value={profileSettings.workStyle}
                    onChange={(e) => setProfileSettings((prev) => ({ ...prev, workStyle: e.target.value as PersonalizationProfile['workStyle'] }))}
                    style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px' }}
                  >
                    <option value="focused">Focused</option>
                    <option value="balanced">Balanced</option>
                    <option value="relaxed">Relaxed</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                Sensitivity ({profileSettings.sensitivity.toFixed(2)}×)
                <input
                  type="range"
                  min="0.5"
                  max="1.4"
                  step="0.05"
                  value={profileSettings.sensitivity}
                  onChange={(e) => setProfileSettings((prev) => ({ ...prev, sensitivity: Number(e.target.value) }))}
                  className="custom-range"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                Max Support Travel ({profileSettings.maxSupportMm}mm)
                <input
                  type="range"
                  min="20"
                  max="55"
                  step="1"
                  value={profileSettings.maxSupportMm}
                  onChange={(e) => setProfileSettings((prev) => ({ ...prev, maxSupportMm: Number(e.target.value) }))}
                  className="custom-range"
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={profileSettings.injurySafeMode}
                  onChange={(e) => setProfileSettings((prev) => ({ ...prev, injurySafeMode: e.target.checked }))}
                />
                Injury-safe mode (caps support at 40mm)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Discomfort Before Session ({discomfortStart.toFixed(1)})
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={discomfortStart}
                    onChange={(e) => setDiscomfortStart(Number(e.target.value))}
                    className="custom-range"
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Discomfort Now ({discomfortCurrent.toFixed(1)})
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={discomfortCurrent}
                    onChange={(e) => setDiscomfortCurrent(Number(e.target.value))}
                    className="custom-range"
                  />
                </label>
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--accent-cyan)' }} />
                Safety & Trust Controls
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={toggleEmergencyStop} className={`btn ${emergencyStop ? 'btn-secondary' : 'btn-primary'}`} style={{ justifyContent: 'center' }}>
                  {emergencyStop ? 'Release Emergency Stop' : 'Emergency Stop'}
                </button>
                <button
                  onClick={triggerCooldown}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                  disabled={cooldownActive || emergencyStop}
                >
                  <PauseCircle size={14} />
                  {cooldownActive ? `Cooldown ${cooldownRemaining}s` : 'Start Cooldown'}
                </button>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                Cooldown Duration ({profileSettings.cooldownSeconds}s)
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={profileSettings.cooldownSeconds}
                  onChange={(e) => setProfileSettings((prev) => ({ ...prev, cooldownSeconds: Number(e.target.value) }))}
                  className="custom-range"
                />
              </label>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Privacy guarantee: posture vision processing runs locally in-browser; no webcam stream is uploaded.
              </p>
            </div>

            {/* Settings: Operational Mode (CV only vs Both) */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
                Integration Settings
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setTrackingMode('cv')}
                  className="btn"
                  style={{
                    padding: '12px 10px',
                    borderRadius: '12px',
                    background: trackingMode === 'cv' ? 'var(--accent-blue-dark)' : 'var(--bg-dark)',
                    border: trackingMode === 'cv' ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--color-border)',
                    color: 'var(--text-primary)',
                    boxShadow: trackingMode === 'cv' ? 'var(--btn-shadow-pressed)' : 'var(--btn-shadow)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <Eye size={14} />
                  <span>Local CV Only</span>
                </button>

                <button
                  onClick={() => setTrackingMode('both')}
                  className="btn"
                  style={{
                    padding: '12px 10px',
                    borderRadius: '12px',
                    background: trackingMode === 'both' ? 'var(--accent-blue-dark)' : 'var(--bg-dark)',
                    border: trackingMode === 'both' ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--color-border)',
                    color: 'var(--text-primary)',
                    boxShadow: trackingMode === 'both' ? 'var(--btn-shadow-pressed)' : 'var(--btn-shadow)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <Cpu size={14} />
                  <span>Active BLE Loop</span>
                </button>
              </div>
            </div>

            {/* Manual controls override when tracking is off */}
            {!isTracking && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                  <Sliders size={18} style={{ color: 'var(--accent-cyan)' }} />
                  Manual Position Command
                </h3>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Module {idx + 1}: {targetPositions[idx] || 0} / 55mm
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="55"
                      value={targetPositions[idx] || 0}
                      onChange={(e) => handleManualPositionChange(idx, parseInt(e.target.value))}
                      className="custom-range"
                    />
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

      <BLEStatusBar
        bleConnected={bleConnected}
        bleStatus={bleStatus}
        lastPacketTime={lastPacketTime}
      />

      <CalibrationModal
        isOpen={calibrating}
        onClose={() => setCalibrating(false)}
        currentPosture={latestPosture}
        currentLandmarks={currentLandmarks}
        onCalibrated={handleCalibrated}
      />

    </div>
  );
}
