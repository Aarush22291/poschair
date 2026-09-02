import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts';

interface AnalyticsDashboardProps {
  sessionScoreHistory: { t: number; score: number }[];
  pastSessions: any[];
  discomfortStart: number;
  discomfortCurrent: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  sessionScoreHistory,
  pastSessions,
  discomfortStart,
  discomfortCurrent,
}) => {
  // Format live session history data for display (relative time)
  const lineChartData = sessionScoreHistory.map((item, idx) => ({
    time: `${sessionScoreHistory.length - idx}s ago`,
    score: item.score
  }));

  // Group past sessions by day for the BarChart
  const dailyAverages = pastSessions.reduce((acc: Record<string, { sum: number; count: number }>, s) => {
    const day = new Date(s.started_at).toLocaleDateString([], { weekday: 'short' });
    if (!acc[day]) acc[day] = { sum: 0, count: 0 };
    acc[day].sum += s.score_avg;
    acc[day].count += 1;
    return acc;
  }, {});

  const barChartData = Object.entries(dailyAverages).map(([day, val]) => ({
    day,
    score: Math.round(val.sum / val.count)
  })).reverse();

  // Fallback placeholder data for cold demos — shown only when no real sessions exist
  const DEMO_BAR_DATA = [
    { day: 'Mon', score: 74 }, { day: 'Tue', score: 81 },
    { day: 'Wed', score: 68 }, { day: 'Thu', score: 87 },
    { day: 'Fri', score: 79 },
  ];
  const isUsingDemoData = barChartData.length === 0;
  const displayBarData = isUsingDemoData ? DEMO_BAR_DATA : barChartData;

  const firstScore = sessionScoreHistory[0]?.score ?? null;
  const latestScore = sessionScoreHistory[sessionScoreHistory.length - 1]?.score ?? null;
  const liveDelta = firstScore != null && latestScore != null ? latestScore - firstScore : null;
  const liveGoodPct = sessionScoreHistory.length
    ? Math.round((sessionScoreHistory.filter((s) => s.score >= 75).length / sessionScoreHistory.length) * 100)
    : null;
  const discomfortDelta = discomfortStart - discomfortCurrent;

  const recentSessions = pastSessions.slice(0, 3);
  const priorSessions = pastSessions.slice(3, 6);
  const avg = (arr: any[]) => arr.length ? arr.reduce((acc, s) => acc + s.score_avg, 0) / arr.length : null;
  const recentAvg = avg(recentSessions);
  const priorAvg = avg(priorSessions);
  const trendDelta = recentAvg != null && priorAvg != null ? recentAvg - priorAvg : null;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {[
          {
            label: 'Before → Now',
            value: liveDelta == null ? '—' : `${liveDelta >= 0 ? '+' : ''}${liveDelta.toFixed(1)} pts`,
            hint: 'Current session score delta',
            color: liveDelta == null ? 'var(--text-muted)' : liveDelta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          },
          {
            label: 'Good Posture Time',
            value: liveGoodPct == null ? '—' : `${liveGoodPct}%`,
            hint: 'Frames with score ≥ 75',
            color: 'var(--accent-cyan)',
          },
          {
            label: 'Discomfort Change',
            value: `${discomfortDelta >= 0 ? '-' : '+'}${Math.abs(discomfortDelta).toFixed(1)}`,
            hint: 'Self-reported (0-10 scale)',
            color: discomfortDelta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          },
          {
            label: '3 vs 3 Session Trend',
            value: trendDelta == null ? '—' : `${trendDelta >= 0 ? '+' : ''}${trendDelta.toFixed(1)} pts`,
            hint: 'Latest 3 avg vs prior 3 avg',
            color: trendDelta == null ? 'var(--text-muted)' : trendDelta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          },
        ].map((metric) => (
          <div key={metric.label} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{metric.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: metric.color, marginBottom: 4 }}>{metric.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{metric.hint}</p>
          </div>
        ))}
      </div>
      
      {/* Recharts Live Line graph */}
      <div>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-cyan)' }} />
          Session Posture Trend
        </h3>
        <div style={{ width: '100%', height: '200px' }}>
          {lineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-dark)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="score" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Waiting for active monitoring session data...
            </div>
          )}
        </div>
      </div>

      {/* Recharts Bar graph & History Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Weekly average bars */}
        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Daily Aggregates</h4>
          <div style={{ width: '100%', height: '150px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayBarData}>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Bar dataKey="score" fill="var(--accent-violet)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {isUsingDemoData && (
              <p style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 4 }}>
                (demo data — start a session to record real scores)
              </p>
            )}
          </div>
        </div>

        {/* Sessions log list */}
        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            Recent Session Summaries
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {pastSessions.length > 0 ? (
              pastSessions.slice(0, 5).map((s, idx) => {
                const dateStr = new Date(s.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}>
                    <span>{dateStr}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Good: {Math.round(s.pct_good)}%</span>
                    <span style={{ fontWeight: 'bold', color: s.score_avg >= 75 ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>
                      {Math.round(s.score_avg)} pts
                    </span>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Logs list will populate upon completing a session.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
