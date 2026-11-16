// Lightweight SVG charts in the Garmin Connect style. No chart library needed.

export function Ring({ value, max, size = 64, stroke = 7, color, track = '#2e2f31', children }: {
  value: number; max: number; size?: number; stroke?: number; color: string; track?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>{children}</div>}
    </div>
  );
}

// Semi-circle gauge (used for Sleep Score, Training Readiness, HRV style readings)
export function Gauge({ value, max = 100, size = 180, color, label, sub }: {
  value: number; max?: number; size?: number; color: string; label?: string; sub?: string;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const half = Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 26, margin: '0 auto' }}>
      <svg width={size} height={size / 2 + stroke}>
        <path d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`} fill="none" stroke="#2e2f31" strokeWidth={stroke} strokeLinecap="round" />
        <path d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${half * pct} ${half}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: size / 2 - 44, textAlign: 'center' }}>
        <div className="huge-num">{value}</div>
        {label && <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{label}</div>}
        {sub && <div className="tiny">{sub}</div>}
      </div>
    </div>
  );
}

export function Bars({ values, color, height = 120, labels, goal, highlightLast = true, colors }: {
  values: number[]; color: string; height?: number; labels?: string[]; goal?: number; highlightLast?: boolean; colors?: string[];
}) {
  const max = Math.max(...values, goal ?? 0) * 1.1 || 1;
  return (
    <div>
      <div style={{ position: 'relative', height, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        {goal !== undefined && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: (goal / max) * height, borderTop: '1px dashed #6f7276' }} />
        )}
        {values.map((v, i) => (
          <div key={i} style={{
            flex: 1, height: Math.max(2, (v / max) * height), borderRadius: '3px 3px 0 0',
            background: colors?.[i] ?? color, opacity: highlightLast && i !== values.length - 1 ? 0.55 : 1,
          }} />
        ))}
      </div>
      {labels && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {labels.map((l, i) => <div key={i} className="tiny" style={{ flex: 1, textAlign: 'center', color: '#6f7276' }}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

export function AreaLine({ values, color, height = 120, min, max, fill = true, axis }: {
  values: number[]; color: string; height?: number; min?: number; max?: number; fill?: boolean; axis?: string[];
}) {
  const w = 340;
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - ((v - lo) / (hi - lo || 1)) * (height - 6) - 3]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const id = `g${color.replace('#', '')}${height}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && <path d={`${d} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />}
        <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {axis && <div className="between" style={{ marginTop: 4 }}>{axis.map(a => <span key={a} className="tiny" style={{ color: '#6f7276' }}>{a}</span>)}</div>}
    </div>
  );
}

// Stress-style colored bars (rest = blue, low/med/high = oranges)
export function StressBars({ values, height = 110 }: { values: number[]; height?: number }) {
  const col = (v: number) => v <= 25 ? 'var(--m-stress-rest)' : v <= 50 ? 'var(--m-stress-low)' : v <= 75 ? 'var(--m-stress-med)' : 'var(--m-stress-high)';
  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
      {values.map((v, i) => <div key={i} style={{ flex: 1, height: (v / 100) * height, background: col(v), borderRadius: 1 }} />)}
    </div>
  );
}

export function SleepStages({ stages, height = 90 }: { stages: { deep: number; light: number; rem: number; awake: number }; height?: number }) {
  // Build a plausible hypnogram from stage totals.
  const pattern: Array<keyof typeof stages> = ['light', 'deep', 'light', 'rem', 'light', 'deep', 'light', 'rem', 'awake', 'light', 'rem', 'light', 'rem', 'awake'];
  const counts: Record<string, number> = {};
  pattern.forEach(p => (counts[p] = (counts[p] ?? 0) + 1));
  const level: Record<string, number> = { awake: 0, rem: 1, light: 2, deep: 3 };
  const color: Record<string, string> = { awake: 'var(--m-sleep-awake)', rem: 'var(--m-sleep-rem)', light: 'var(--m-sleep-light)', deep: 'var(--m-sleep-deep)' };
  const total = stages.deep + stages.light + stages.rem + stages.awake;
  return (
    <div style={{ position: 'relative', height, display: 'flex', alignItems: 'flex-start' }}>
      {pattern.map((p, i) => {
        const w = (stages[p] / counts[p] / total) * 100;
        return <div key={i} style={{ width: `${w}%`, marginTop: (level[p] / 4) * height, height: height / 4, background: color[p] }} />;
      })}
    </div>
  );
}

export function ZoneBars({ minutes }: { minutes: number[] }) {
  const total = minutes.reduce((a, b) => a + b, 0) || 1;
  const names = ['Zone 1 · Warm Up', 'Zone 2 · Easy', 'Zone 3 · Aerobic', 'Zone 4 · Threshold', 'Zone 5 · Maximum'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {minutes.map((m, i) => i).reverse().map(i => (
        <div key={i}>
          <div className="between small"><span>{names[i]}</span><span className="muted">{minutes[i]} min · {Math.round((minutes[i] / total) * 100)}%</span></div>
          <div style={{ height: 8, background: '#2e2f31', borderRadius: 4, marginTop: 4 }}>
            <div style={{ height: '100%', width: `${(minutes[i] / total) * 100}%`, background: `var(--zone-${i + 1})`, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RouteMap({ route, height = 190 }: { route?: [number, number][]; height?: number }) {
  // Map placeholder: stylized streets + route line (no real map tiles).
  return (
    <div style={{ height, background: '#1f2a33', position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
        {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" x2="100" y1={i * 7.5} y2={i * 7.5 + 3} stroke="#2b3944" strokeWidth=".8" />)}
        {Array.from({ length: 12 }, (_, i) => <line key={`v${i}`} y1="0" y2="60" x1={i * 9} x2={i * 9 - 4} stroke="#2b3944" strokeWidth=".8" />)}
        <path d="M0,40 C20,35 40,50 60,42 S90,30 100,34" stroke="#2c5b7a" strokeWidth="3" fill="none" />
        <rect x="62" y="6" width="18" height="12" fill="#22392b" />
        {route && (
          <>
            <polyline points={route.map(([x, y]) => `${x * 100},${y * 60}`).join(' ')} fill="none" stroke="#11a9ed" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx={route[0][0] * 100} cy={route[0][1] * 60} r="1.6" fill="#30c77b" />
            <circle cx={route[route.length - 1][0] * 100} cy={route[route.length - 1][1] * 60} r="1.6" fill="#e5304c" />
          </>
        )}
      </svg>
      <div className="tiny" style={{ position: 'absolute', right: 8, bottom: 6, color: '#6f7276' }}>Map placeholder</div>
    </div>
  );
}
