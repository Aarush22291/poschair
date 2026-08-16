import React from 'react';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';

interface SpineVisualizerProps {
  targetPositions: number[];
  currentPositions: number[];
  isHomed?: boolean;
  isMoving?: boolean;
}

const MODULES = [
  { index: 0, label: 'Upper-Left', short: 'UL' },
  { index: 1, label: 'Upper-Right', short: 'UR' },
  { index: 2, label: 'Mid-Left', short: 'ML' },
  { index: 3, label: 'Mid-Right', short: 'MR' },
  { index: 4, label: 'Lower-Left', short: 'LL' },
  { index: 5, label: 'Lower-Right', short: 'LR' },
];

// Must match MAX_POSITION_MM in firmware/config.h
const MAX_MM = 55;

function positionColor(position: number) {
  if (position <= 0)        return 'var(--text-dim)';
  if (position <= MAX_MM * 0.33) return 'var(--accent-cyan)';
  if (position <= MAX_MM * 0.66) return 'var(--accent-violet)';
  return 'var(--accent-orange)';
}

export const SpineVisualizer: React.FC<SpineVisualizerProps> = ({
  targetPositions,
  currentPositions,
  isHomed = false,
  isMoving = false,
}) => {
  return (
    <div className="glass-panel glass-panel-glow">
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
        <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
        Worm-Rack Actuator Grid
      </h3>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} style={{ color: isHomed ? 'var(--accent-green)' : 'var(--accent-orange)' }} />
          Homed: {isHomed ? 'Yes' : 'No'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isMoving && <Loader2 size={14} style={{ color: 'var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />}
          Moving: {isMoving ? 'Active' : 'Idle'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '10px',
            bottom: '10px',
            width: '2px',
            background: 'var(--text-dim)',
            transform: 'translateX(-50%)',
            zIndex: 1,
            opacity: 0.3,
          }}
        />

        {MODULES.map((module) => {
          const target = Math.min(MAX_MM, Math.max(0, targetPositions[module.index] ?? 0));
          const current = Math.min(MAX_MM, Math.max(0, currentPositions[module.index] ?? 0));
          const targetPct = (target / MAX_MM) * 100;
          const currentPct = (current / MAX_MM) * 100;
          const activeColor = positionColor(target);
          const active = target > 0 || current > 0;

          return (
            <div
              key={module.index}
              className={`spine-vertebra ${active ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: active ? 'var(--bg-card-hover)' : 'var(--bg-dark)',
                border: active ? `1px solid ${activeColor}` : '1px solid var(--color-border)',
                boxShadow: active ? 'var(--btn-shadow-pressed)' : 'var(--btn-shadow)',
                transition: 'all 0.3s ease',
                zIndex: 2,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {module.label} ({module.short})
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Target: {target}mm | Actual: {current}mm
                </span>
              </div>

              <div
                style={{
                  height: '8px',
                  width: '100%',
                  borderRadius: '4px',
                  background: 'var(--bg-dark)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: activeColor,
                    width: `${targetPct}%`,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    background: 'rgba(255,255,255,0.45)',
                    width: `${currentPct}%`,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    mixBlendMode: 'screen',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
