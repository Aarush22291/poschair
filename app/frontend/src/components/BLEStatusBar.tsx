import React from 'react';
import { StatusData } from '../bleManager';
import { CheckCircle2, Cpu, Loader2, Shield, ShieldAlert, XCircle } from 'lucide-react';

interface BLEStatusBarProps {
  bleConnected: boolean;
  bleStatus: StatusData | null;
  lastPacketTime: number | null;
}

export const BLEStatusBar: React.FC<BLEStatusBarProps> = ({
  bleConnected,
  bleStatus,
  lastPacketTime,
}) => {
  return (
    <footer
      className="glass-panel"
      style={{
        marginTop: '24px',
        padding: '12px 24px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        gap: '18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} style={{ color: bleConnected ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
          Hardware: {bleConnected ? 'Connected' : 'Disconnected'}
        </span>

        {bleConnected && bleStatus && (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: bleStatus.isHomed ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
              {bleStatus.isHomed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {bleStatus.isHomed ? 'Homed' : 'Not Homed'}
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: bleStatus.isMoving ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
              {bleStatus.isMoving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Moving: {bleStatus.isMoving ? 'Yes' : 'No'}
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: bleStatus.isFailsafe ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {bleStatus.isFailsafe ? <ShieldAlert size={14} className="pulsing-glow" /> : <Shield size={14} />}
              {bleStatus.isFailsafe ? 'Failsafe Active' : 'Failsafe Armed'}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {lastPacketTime && (
          <span>
            Last Status: {new Date(lastPacketTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        {bleStatus && (
          <>
            <span>{(bleStatus.batteryMv / 1000).toFixed(2)} V</span>
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              Est. positions: [{bleStatus.currentPositions.join(', ')}]
            </span>
          </>
        )}
      </div>
    </footer>
  );
};
