import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { PostureData, CalibrationBaseline, captureCalibrationBaseline } from '../postureAnalyzer';
import { LandmarkList } from '../poseDetector';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPosture: PostureData | null;
  currentLandmarks: LandmarkList | null;
  onCalibrated: (baseline: CalibrationBaseline) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  currentPosture,
  currentLandmarks,
  onCalibrated
}) => {
  const [step, setStep] = useState<'idle' | 'natural' | 'perfect' | 'done'>('idle');
  const [countdown, setCountdown] = useState(5);
  const [progress, setProgress] = useState(0);

  const postureFrames = useRef<PostureData[]>([]);
  const landmarkFrames = useRef<LandmarkList[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setCountdown(5);
      setProgress(0);
      postureFrames.current = [];
      landmarkFrames.current = [];
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Frame sampling during calibration — only accept high-confidence frames
  useEffect(() => {
    if (step === 'natural' && currentPosture && currentLandmarks) {
      if (currentPosture.confidence >= 0.65) {
        postureFrames.current.push(currentPosture);
        landmarkFrames.current.push(currentLandmarks);
      }
    }
  }, [step, currentPosture, currentLandmarks]);

  const startCapture = () => {
    setStep('natural');
    setCountdown(5);
    setProgress(0);
    postureFrames.current = [];
    landmarkFrames.current = [];

    if (timerRef.current) clearInterval(timerRef.current);
    
    let ticks = 50; // 50 * 100ms = 5 seconds
    timerRef.current = setInterval(() => {
      ticks--;
      setProgress(Math.round(((50 - ticks) / 50) * 100));
      if (ticks % 10 === 0) {
        setCountdown(ticks / 10);
      }
      if (ticks <= 0) {
        clearInterval(timerRef.current!);
        completeCalibration();
      }
    }, 100);
  };

  const completeCalibration = () => {
    const minFrames = 10;
    if (postureFrames.current.length < minFrames) {
      alert(`Too few high-confidence frames captured (${postureFrames.current.length}/${minFrames}). Ensure your full upper body is visible and try again.`);
      setStep('idle');
      return;
    }

    if (postureFrames.current.length > 0 && landmarkFrames.current.length > 0) {
      // Use the shared captureCalibrationBaseline — includes neck angle and torso length
      const baseline = captureCalibrationBaseline(postureFrames.current, landmarkFrames.current);

      onCalibrated(baseline);
      setStep('done');
    } else {
      alert("Error: No pose frames captured. Make sure tracking is active.");
      setStep('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-panel" style={{ width: '450px', padding: '32px', textAlign: 'center', position: 'relative' }}>
        
        {step === 'idle' && (
          <div>
            <RefreshCw size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto 16px', animation: 'pulse 2s infinite' }} />
            <h2 style={{ fontSize: '22px', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>Calibrate Spine Baseline</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Sit in your typical relaxed posture. The system will record your baseline angles for 5 seconds.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={startCapture} className="btn btn-primary">Start Capture</button>
              <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {step === 'natural' && (
          <div>
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  fill="transparent" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth="6" 
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.1s linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '28px', fontWeight: 'bold' }}>{countdown}</span>
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Capturing Posture...</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Keep sitting naturally. Do not move.</p>
          </div>
        )}

        {step === 'done' && (
          <div>
            <CheckCircle size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>Calibration Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Your natural sitting baseline has been captured and saved for this device.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ width: '120px', justifyContent: 'center' }}>Done</button>
          </div>
        )}

      </div>
    </div>
  );
};
