import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { LandmarkList, PoseDetector, DetectorState, DrawingUtils, PoseLandmarker } from '../poseDetector';
import type { PostureData } from '../postureAnalyzer';

interface CameraViewProps {
  isTracking: boolean;
  score: number | null;
  onLandmarks: (landmarks: LandmarkList, worldLandmarks?: LandmarkList) => void;
  latestPosture?: PostureData | null;
  targetPositions?: number[];
}

const overlayCenter: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 10, 12, 0.88)',
  backdropFilter: 'blur(6px)',
  zIndex: 10,
  gap: 8,
};

// ── Posture-aware skeleton colors ───────────────────────────────
function getSkeletonColor(score: number | null): { dot: string; line: string; spine: string } {
  const s = score ?? 100;
  if (s >= 75) return { dot: '#facc15', line: 'rgba(250,204,21,0.6)', spine: '#22c55e' };
  if (s >= 50) return { dot: '#facc15', line: 'rgba(250,204,21,0.5)', spine: '#f59e0b' };
  return { dot: '#facc15', line: 'rgba(250,204,21,0.4)', spine: '#ef4444' };
}

export const CameraView: React.FC<CameraViewProps> = ({
  isTracking,
  score,
  onLandmarks,
  latestPosture,
  targetPositions = [0, 0, 0, 0, 0, 0],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const detectorReadyRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  const [detectorState, setDetectorState] = useState<DetectorState>('idle');
  const [detectorError, setDetectorError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (isTracking) {
        detectorReadyRef.current = false;
        setDetectorState('loading');
        setDetectorError(null);

        try {
          const detector = new PoseDetector();
          await detector.init();
          detectorRef.current = detector;
          setDetectorState('ready');

          // Initialise DrawingUtils once canvas exists
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) drawingUtilsRef.current = new DrawingUtils(ctx);
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
          });
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch((err: Error) => {
              console.warn('Autoplay blocked:', err.message);
              setDetectorState('error');
              setDetectorError('Camera autoplay blocked. Click "Stop Camera" then "Enable Tracking" after the page fully loads.');
            });
          }

          detectorReadyRef.current = true;
        } catch (err: unknown) {
          const name = (err as DOMException).name;
          const msg =
            name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access in browser settings.'
              : name === 'NotFoundError'
              ? 'No camera found. Connect a webcam and try again.'
              : `Model/camera error: ${(err as Error).message}`;
          setDetectorState('error');
          setDetectorError(msg);
          detectorReadyRef.current = false;
        }
      } else {
        stopCamera();
      }
    }
    setupCamera();
    return () => stopCamera();
  }, [isTracking]);

  const stopCamera = () => {
    detectorReadyRef.current = false;
    drawingUtilsRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setDetectorState('idle');
    setDetectorError(null);
  };

  // Keep a ref to the latest score so the loop closure always reads current value
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    if (!isTracking) return;

    const loop = () => {
      if (!detectorReadyRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const video   = videoRef.current;
      const canvas  = canvasRef.current;
      const detector = detectorRef.current;
      const drawUtils = drawingUtilsRef.current;

      if (video && canvas && detector && video.readyState >= 2) {
        const result = detector.detectFull(video);

        if (result && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];
          onLandmarks(landmarks, result.worldLandmarks?.[0]);

          // ── Draw full body skeleton ──────────────────────────
          const ctx = canvas.getContext('2d');
          if (ctx && drawUtils) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const colors = getSkeletonColor(scoreRef.current);

            // Draw all skeletal connections using official POSE_CONNECTIONS
            drawUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: colors.line,
              lineWidth: 2,
            });

            // Draw all 33 landmark dots in yellow (like the reference photo)
            drawUtils.drawLandmarks(landmarks, {
              color: colors.dot,
              fillColor: colors.dot,
              lineWidth: 1,
              radius: (data) => {
                const idx = data?.index ?? 0;
                const KEY = [0, 7, 8, 11, 12, 23, 24]; // nose, ears, shoulders, hips
                return KEY.includes(idx) ? 8 : 5;
              },
            });

            // ── Highlight spine line in posture color ────────
            const midShoulder = {
              x: (landmarks[11].x + landmarks[12].x) / 2,
              y: (landmarks[11].y + landmarks[12].y) / 2,
            };
            const midHip = {
              x: (landmarks[23].x + landmarks[24].x) / 2,
              y: (landmarks[23].y + landmarks[24].y) / 2,
            };
            const midEar = {
              x: (landmarks[7].x + landmarks[8].x) / 2,
              y: (landmarks[7].y + landmarks[8].y) / 2,
            };

            const W = canvas.width;
            const H = canvas.height;

            ctx.lineWidth = 4;
            ctx.strokeStyle = colors.spine;
            ctx.lineCap = 'round';

            // Spine line (hip → shoulder → ear)
            ctx.beginPath();
            ctx.moveTo(midHip.x * W, midHip.y * H);
            ctx.lineTo(midShoulder.x * W, midShoulder.y * H);
            ctx.lineTo(midEar.x * W, midEar.y * H);
            ctx.stroke();

            // ── Posture angle arc indicator ──────────────────
            if (latestPosture?.spineDeviation != null && Math.abs(latestPosture.spineDeviation) > 3) {
              const cx = midShoulder.x * W;
              const cy = midShoulder.y * H;
              const radius = 28;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (latestPosture.spineDeviation / 45) * Math.PI);
              ctx.strokeStyle = colors.spine;
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          }
        } else {
          // No pose detected — clear canvas
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTracking, onLandmarks]);

  const scoreColor =
    score !== null
      ? score >= 75
        ? 'var(--accent-cyan)'
        : score >= 50
        ? 'var(--accent-orange)'
        : 'var(--accent-red)'
      : 'var(--text-muted)';

  const postureLabel =
    score !== null
      ? score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : score >= 30 ? 'Poor' : 'Critical'
      : null;

  return (
    <div className="glass-panel" style={{ position: 'relative' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Camera size={18} style={{ color: 'var(--accent-cyan)' }} />
        Live Posture Video
        {detectorState === 'ready' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent-green)', fontWeight: 500 }}>
            ● Full Model Active
          </span>
        )}
      </h3>

      <div
        className="camera-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          background: 'linear-gradient(135deg, #0a0a0c 0%, #12121a 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
      >
        {isTracking ? (
          <>
            <video
              ref={videoRef}
              className="camera-feed"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
                transform: 'scaleX(-1)', // mirror to match video
              }}
            />

            {/* Loading overlay */}
            {detectorState === 'loading' && (
              <div style={overlayCenter}>
                <Loader2
                  size={40}
                  style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-cyan)' }}
                />
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, marginTop: 8 }}>
                  Loading AI Pose Model
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  Full model — first load may take 8–15 seconds
                </p>
                <div style={{
                  marginTop: 16, width: 200, height: 3,
                  borderRadius: 2, background: 'var(--bg-dark)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: '60%', height: '100%',
                    background: 'var(--accent-cyan)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                </div>
              </div>
            )}

            {/* Error overlay */}
            {detectorState === 'error' && (
              <div style={{ ...overlayCenter }}>
                <Camera size={36} style={{ color: 'var(--accent-red)' }} />
                <p style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: 14 }}>
                  Camera / Model Error
                </p>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: 12,
                  textAlign: 'center', maxWidth: 280, padding: '0 16px',
                }}>
                  {detectorError}
                </p>
              </div>
            )}

            {/* Score badge — top left */}
            {detectorState === 'ready' && (
              <div style={{
                position: 'absolute', top: 14, left: 14,
                background: 'rgba(7, 13, 28, 0.82)',
                backdropFilter: 'blur(10px)',
                padding: '10px 18px', borderRadius: '14px',
                border: `1px solid ${scoreColor}40`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 72,
                boxShadow: `0 0 20px ${scoreColor}22`,
                zIndex: 12,
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Score
                </span>
                <span style={{
                  fontSize: '32px', fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: scoreColor,
                  lineHeight: 1.1,
                }}>
                  {score !== null ? score : '—'}
                </span>
                {postureLabel && (
                  <span style={{ fontSize: '10px', color: scoreColor, fontWeight: 600, marginTop: 2 }}>
                    {postureLabel}
                  </span>
                )}
              </div>
            )}

            {/* ── TOP RIGHT: Chair Hardware Simulation Widget ──────── */}
            {detectorState === 'ready' && (
              <ChairHardwareWidget positions={targetPositions} />
            )}

            {/* Live metrics bar — bottom overlay */}
            {detectorState === 'ready' && latestPosture && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(7, 13, 28, 0.75)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid var(--color-border)',
                padding: '8px 14px',
                display: 'flex', gap: 20, alignItems: 'center',
                fontSize: 11,
                zIndex: 12,
              }}>
                <MetricPill
                  label="Spine"
                  value={latestPosture.spineDeviation ?? latestPosture.spineAngleDeg}
                  unit="°"
                  threshold={8}
                />
                <MetricPill
                  label="Lateral"
                  value={latestPosture.lateralDeviation ?? latestPosture.lateralLeanDeg}
                  unit="°"
                  threshold={5}
                />
                <MetricPill
                  label="Neck"
                  value={latestPosture.neckDeviation ?? latestPosture.neckInclination}
                  unit="°"
                  threshold={10}
                />
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                  {Math.round(latestPosture.confidence * 100)}% conf
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', gap: '14px',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--color-border)',
            }}>
              <Camera size={32} />
            </div>
            <p style={{ fontSize: 14 }}>Click &ldquo;Enable Tracking&rdquo; to activate camera</p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Full body skeleton with 33 landmarks</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Chair Hardware Live Simulation Widget (Top-Right Overlay) ─────
function ChairHardwareWidget({ positions }: { positions: number[] }) {
  return (
    <div style={{
      position: 'absolute',
      top: 14,
      right: 14,
      background: 'rgba(7, 13, 28, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      zIndex: 15,
    }}>
      <div style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: 'var(--accent-cyan)',
        textTransform: 'uppercase',
      }}>
        Hardware Motor State
      </div>

      {/* Blue Oval Chair Backrest Diagram */}
      <div style={{
        width: '90px',
        height: '110px',
        background: '#0099ff', // Vibrant blue backrest from reference drawing
        borderRadius: '45px / 55px', // Oval shape
        border: '2px solid #000', // Solid black outline
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 12px',
        gap: '6px',
        position: 'relative',
        boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.4)',
      }}>
        {/* 2x3 Grid of 6 Actuator Circles */}
        {[0, 1, 2].map((rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {[0, 1].map((colIdx) => {
              const moduleIdx = rowIdx * 2 + colIdx;
              const pos = Math.round(positions[moduleIdx] ?? 0);
              const isActive = pos > 3; // Actuator motor actively extending/rotating

              return (
                <div
                  key={colIdx}
                  title={`Module ${moduleIdx + 1}: ${pos}mm`}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isActive ? '#ef4444' : '#facc15', // Red when motor extends/rotates, Yellow when resting!
                    border: '2px solid #000', // Solid black border like reference drawing
                    boxShadow: isActive
                      ? '0 0 12px #ef4444, inset 0 0 4px #990000'
                      : 'inset 0 0 2px rgba(0,0,0,0.3)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 800,
                    color: isActive ? '#ffffff' : '#000000',
                    transform: isActive ? 'scale(1.15)' : 'scale(1.0)',
                  }}
                >
                  {pos > 0 ? `${pos}` : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{
        fontSize: '9px',
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        letterSpacing: '0.02em',
      }}>
        front side of chair
      </div>
    </div>
  );
}

// ── Mini metric pill shown in the bottom bar ────────────────────
function MetricPill({
  label,
  value,
  unit,
  threshold,
}: {
  label: string;
  value: number;
  unit: string;
  threshold: number;
}) {
  const abs = Math.abs(value);
  const color =
    abs < threshold * 0.5
      ? 'var(--accent-green)'
      : abs < threshold
      ? 'var(--accent-orange)'
      : 'var(--accent-red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ color, fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>
        {value >= 0 ? '+' : ''}{value.toFixed(1)}{unit}
      </span>
    </div>
  );
}
