import { useCallback, useEffect, useRef, useState } from 'react';
import { Footprints, Battery, Heart, Bike, Dumbbell, PersonStanding, Trophy, Moon, Zap, Gauge, Bell, Sun, Check, X, Play, Activity as ActivityIcon, MessageSquare } from 'lucide-react';
import { useStore } from '../store';
import { todayHealth } from '../data/health';
import { fmtDuration } from '../data/dates';
import type { Activity, SportType } from '../data/types';
import { slotEntries } from '../slots';

// Garmin Forerunner-style watch (5 buttons):
//   LIGHT (left top) · UP (left middle) · DOWN (left bottom) · START/STOP (right top) · BACK (right bottom)
// Keyboard: ↑ / ↓ = UP / DOWN, Enter = START, Esc or Backspace = BACK, L = LIGHT.

type Btn = 'light' | 'up' | 'down' | 'start' | 'back';
type Mode = 'face' | 'glances' | 'glance' | 'activities' | 'gps' | 'ready' | 'recording' | 'paused' | 'saved';

const SPORTS: { type: SportType; label: string; Icon: React.ComponentType<any>; indoor: boolean }[] = [
  { type: 'run', label: 'Run', Icon: PersonStanding, indoor: false },
  { type: 'bike', label: 'Bike', Icon: Bike, indoor: false },
  { type: 'strength', label: 'Strength', Icon: Dumbbell, indoor: true },
  { type: 'basketball', label: 'Basketball', Icon: Trophy, indoor: true },
  { type: 'walk', label: 'Walk', Icon: Footprints, indoor: false },
];

interface Glance { id: string; title: string; value: string; sub: string; Icon: React.ComponentType<any>; color: string }

function baseGlances(): Glance[] {
  const t = todayHealth;
  return [
    { id: 'myday', title: 'My Day', value: `${t.steps.toLocaleString()}`, sub: 'steps · 1 activity yesterday', Icon: Footprints, color: '#11a9ed' },
    { id: 'bb', title: 'Body Battery', value: String(t.bodyBatteryLow), sub: `+${t.bodyBatteryCharged} / −${t.bodyBatteryDrained}`, Icon: Zap, color: '#1fa0ff' },
    { id: 'stress', title: 'Stress', value: String(t.stressAvg), sub: t.stressAvg <= 25 ? 'Rest' : t.stressAvg <= 50 ? 'Low' : 'Medium', Icon: ActivityIcon, color: '#ff9f3d' },
    { id: 'sleep', title: 'Sleep', value: String(t.sleepScore), sub: `${Math.floor(t.sleepSec / 3600)}h ${Math.round((t.sleepSec % 3600) / 60)}m · ${t.sleepQuality}`, Icon: Moon, color: '#7b61ff' },
    { id: 'hr', title: 'Heart Rate', value: '68', sub: `Resting ${t.restingHr} bpm`, Icon: Heart, color: '#e5304c' },
    { id: 'tr', title: 'Training Readiness', value: String(t.trainingReadiness), sub: t.trainingReadiness >= 75 ? 'High' : 'Moderate', Icon: Gauge, color: '#b05cff' },
    { id: 'notif', title: 'Notifications', value: '', sub: 'No new notifications', Icon: Bell, color: '#9fa3a8' },
  ];
}

export function WatchApp() {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<Mode>('face');
  const [sel, setSel] = useState(0);
  const [sport, setSport] = useState(SPORTS[0]);
  const [elapsed, setElapsed] = useState(0);
  const [page, setPage] = useState(0);
  const [light, setLight] = useState(false);
  const [saved, setSaved] = useState<Activity | null>(null);
  const [now, setNow] = useState(new Date());
  const hrRef = useRef(92);

  const glances = [...baseGlances(), ...slotEntries('watch.glances').map(e => ({ id: e.feature, title: e.feature, value: '', sub: '', Icon: Bell, color: '#fff' }))];
  const notif = state.watchNotifications[0];

  useEffect(() => { const iv = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(iv); }, []);
  useEffect(() => {
    if (mode !== 'recording') return;
    const iv = window.setInterval(() => {
      setElapsed(e => e + 1);
      const target = sport.type === 'run' ? 152 : sport.type === 'bike' ? 140 : sport.type === 'basketball' ? 145 : sport.type === 'walk' ? 96 : 112;
      hrRef.current = Math.round(hrRef.current + (target - hrRef.current) * 0.15 + (Math.random() - 0.5) * 6);
    }, 1000);
    return () => window.clearInterval(iv);
  }, [mode, sport]);
  useEffect(() => { if (mode === 'gps') { const t = window.setTimeout(() => setMode('ready'), 2200); return () => window.clearTimeout(t); } }, [mode]);

  const distanceMi = sport.type === 'run' ? elapsed / 545 : sport.type === 'bike' ? elapsed / 194 : sport.type === 'walk' ? elapsed / 1250 : 0;
  const calories = Math.round(elapsed * (sport.type === 'walk' ? 0.08 : sport.type === 'strength' ? 0.09 : 0.18));

  const saveActivity = () => {
    const outdoor = !sport.indoor;
    const titles: Record<SportType, string> = { run: 'Houston Running', bike: 'Houston Cycling', strength: 'Strength', basketball: 'Basketball', walk: 'Houston Walking', football: 'Football' };
    const a: Activity = {
      id: `w${Date.now()}`, ownerId: 'me', type: sport.type, title: titles[sport.type], date: new Date(Date.now() - elapsed * 1000).toISOString(),
      durationSec: Math.max(elapsed, 1), avgHr: hrRef.current - 4, maxHr: hrRef.current + 9, calories: Math.max(calories, 1),
      distanceMi: outdoor ? Math.max(distanceMi, 0.01) : undefined,
      avgPace: sport.type === 'run' ? '9:05 /mi' : sport.type === 'walk' ? '20:50 /mi' : undefined,
      avgSpeedMph: sport.type === 'bike' ? 18.6 : undefined,
      elevGainFt: outdoor ? Math.round(distanceMi * 12) : undefined,
      trainingEffect: { aerobic: Math.min(5, 0.5 + elapsed / 900), anaerobic: 0.2, label: 'Recovery' },
      hrZonesMin: [Math.ceil(elapsed / 240), Math.ceil(elapsed / 180), Math.floor(elapsed / 300), 0, 0],
      route: outdoor ? Array.from({ length: 30 }, (_, i) => [0.2 + i * 0.02, 0.5 + Math.sin(i / 4) * 0.2] as [number, number]) : undefined,
      likes: [], comments: [], device: 'Forerunner 265',
    };
    dispatch({ type: 'saveWatchActivity', activity: a });
    setSaved(a);
    setMode('saved');
  };

  const press = useCallback((b: Btn) => {
    if (b === 'light') { setLight(true); window.setTimeout(() => setLight(false), 1500); return; }
    if (notif) { // any button dismisses a notification
      dispatch({ type: 'dismissWatchNotification', id: notif.id });
      return;
    }
    switch (mode) {
      case 'face':
        if (b === 'up' || b === 'down') { setSel(b === 'up' ? glances.length - 1 : 0); setMode('glances'); }
        if (b === 'start') { setSel(0); setMode('activities'); }
        break;
      case 'glances':
        if (b === 'up') setSel(s => (s - 1 + glances.length) % glances.length);
        if (b === 'down') setSel(s => (s + 1) % glances.length);
        if (b === 'start') setMode('glance');
        if (b === 'back') setMode('face');
        break;
      case 'glance':
        if (b === 'back' || b === 'start') setMode('glances');
        break;
      case 'activities':
        if (b === 'up') setSel(s => (s - 1 + SPORTS.length) % SPORTS.length);
        if (b === 'down') setSel(s => (s + 1) % SPORTS.length);
        if (b === 'start') { setSport(SPORTS[sel]); setElapsed(0); setPage(0); hrRef.current = 92; setMode(SPORTS[sel].indoor ? 'ready' : 'gps'); }
        if (b === 'back') setMode('face');
        break;
      case 'gps':
      case 'ready':
        if (b === 'start') setMode('recording');
        if (b === 'back') { setSel(0); setMode('activities'); }
        break;
      case 'recording':
        if (b === 'up') setPage(p => (p + 2) % 3);
        if (b === 'down') setPage(p => (p + 1) % 3);
        if (b === 'start') { setSel(0); setMode('paused'); }
        break;
      case 'paused':
        if (b === 'up') setSel(s => (s + 2) % 3);
        if (b === 'down') setSel(s => (s + 1) % 3);
        if (b === 'back') setMode('recording');
        if (b === 'start') {
          if (sel === 0) setMode('recording');
          if (sel === 1) saveActivity();
          if (sel === 2) setMode('face');
        }
        break;
      case 'saved':
        if (b === 'start' || b === 'back') setMode('face');
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sel, glances.length, notif, elapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const map: Record<string, Btn> = { ArrowUp: 'up', ArrowDown: 'down', Enter: 'start', Escape: 'back', Backspace: 'back', l: 'light', L: 'light' };
      const b = map[e.key];
      if (b) { e.preventDefault(); press(b); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ ?[AP]M/, '');
  const pace = elapsed > 5 && distanceMi > 0 ? fmtDuration(Math.round(elapsed / distanceMi)) : '--:--';
  const zone = hrRef.current >= 165 ? 5 : hrRef.current >= 150 ? 4 : hrRef.current >= 135 ? 3 : hrRef.current >= 115 ? 2 : 1;

  let content: React.ReactNode = null;
  if (mode === 'face') {
    const t = todayHealth;
    content = (
      <div className="w-center">
        <div style={{ fontSize: 13, color: '#9fa3a8', letterSpacing: 1 }}>{now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).toUpperCase()}</div>
        <div style={{ fontSize: 86, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>{time}</div>
        <div className="row" style={{ gap: 18, marginTop: 10, fontSize: 15 }}>
          <span className="row" style={{ gap: 4 }}><Footprints size={16} color="#11a9ed" />{t.steps.toLocaleString()}</span>
          <span className="row" style={{ gap: 4 }}><Zap size={16} color="#1fa0ff" />{t.bodyBatteryLow}</span>
        </div>
        <div className="row" style={{ gap: 4, marginTop: 8, fontSize: 15 }}><Heart size={16} color="#e5304c" />68</div>
        <svg style={{ position: 'absolute', inset: 6 }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#1d1e20" strokeWidth="2.4" />
          <circle cx="50" cy="50" r="48" fill="none" stroke="#11a9ed" strokeWidth="2.4" strokeDasharray={`${(t.steps / t.stepGoal) * 301} 301`} transform="rotate(-90 50 50)" strokeLinecap="round" />
        </svg>
      </div>
    );
  } else if (mode === 'glances') {
    // Selected glance is centered and taller; neighbors above/below.
    const prev = glances[(sel - 1 + glances.length) % glances.length];
    const cur = glances[sel];
    const next = glances[(sel + 1) % glances.length];
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {[prev, cur, next].map((g, i) => (
          <div key={`${g.id}${i}`} className={`w-glance${i === 1 ? ' sel' : ''}`}>
            <div className="w-icon" style={{ background: i === 1 ? g.color : '#2a2c2f' }}><g.Icon size={18} color="#fff" /></div>
            <div><div className="gt">{g.title}</div><div className="gv">{g.value}</div>{i === 1 && <div className="gt">{g.sub}</div>}</div>
          </div>
        ))}
      </div>
    );
  } else if (mode === 'glance') {
    const g = glances[sel];
    content = (
      <div className="w-center">
        <g.Icon size={28} color={g.color} />
        <div className="w-sub" style={{ marginTop: 6 }}>{g.title.toUpperCase()}</div>
        <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -2 }}>{g.value || '—'}</div>
        <div className="w-sub">{g.sub}</div>
      </div>
    );
  } else if (mode === 'activities') {
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="w-sub" style={{ textAlign: 'center', marginBottom: 8 }}>ACTIVITIES</div>
        {[-1, 0, 1].map(o => {
          const s = SPORTS[(sel + o + SPORTS.length) % SPORTS.length];
          return (
            <div key={o} className={`w-list-item${o === 0 ? ' sel' : ''}`} style={{ opacity: o === 0 ? 1 : 0.5 }}>
              <span className="w-icon"><s.Icon size={18} /></span>{s.label}
            </div>
          );
        })}
      </div>
    );
  } else if (mode === 'gps' || mode === 'ready') {
    content = (
      <div className="w-center">
        <sport.Icon size={30} />
        <div className="w-title" style={{ marginTop: 8, fontSize: 18 }}>{sport.label}</div>
        {mode === 'gps'
          ? <div className="w-sub" style={{ marginTop: 10 }}>Locating GPS…</div>
          : <div style={{ marginTop: 10, color: '#30c77b', fontSize: 14 }}>{sport.indoor ? 'Ready' : 'GPS Ready'} · Press START</div>}
        <div style={{ width: 120, height: 4, borderRadius: 2, background: '#2a2c2f', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: mode === 'gps' ? '45%' : '100%', background: mode === 'gps' ? '#f5a623' : '#30c77b', transition: 'width 2s' }} />
        </div>
      </div>
    );
  } else if (mode === 'recording') {
    const fields: [string, string][][] = sport.indoor
      ? [[['TIMER', fmtDuration(elapsed)], ['HEART RATE', String(hrRef.current)], ['CALORIES', String(calories)]],
         [['HEART RATE', String(hrRef.current)], ['HR ZONE', `Z${zone}`], ['TIMER', fmtDuration(elapsed)]],
         [['TIME OF DAY', time], ['TIMER', fmtDuration(elapsed)], ['CALORIES', String(calories)]]]
      : [[['TIMER', fmtDuration(elapsed)], ['DISTANCE', distanceMi.toFixed(2)], [sport.type === 'bike' ? 'SPEED' : 'PACE', sport.type === 'bike' ? '18.6' : pace]],
         [['HEART RATE', String(hrRef.current)], ['HR ZONE', `Z${zone}`], ['TIMER', fmtDuration(elapsed)]],
         [['TIME OF DAY', time], ['DISTANCE', distanceMi.toFixed(2)], ['CALORIES', String(calories)]]];
    const f = fields[page];
    content = (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', top: 18, left: 0, right: 0, textAlign: 'center' }}><span className="w-rec-dot" /></div>
        <div className="w-data-field" style={{ position: 'absolute', top: 40, left: 0, right: 0 }}><span className="lbl">{f[0][0]}</span><span className="val">{f[0][1]}</span></div>
        <div className="w-hline" style={{ top: 120 }} />
        <div className="w-data-field" style={{ position: 'absolute', top: 128, left: 0, right: 0 }}><span className="lbl">{f[1][0]}</span><span className="val">{f[1][1]}</span></div>
        <div className="w-hline" style={{ top: 206 }} />
        <div className="w-data-field" style={{ position: 'absolute', top: 212, left: 0, right: 0 }}><span className="lbl">{f[2][0]}</span><span className="val" style={{ fontSize: 30 }}>{f[2][1]}</span></div>
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: 3, background: i === page ? '#fff' : '#444' }} />)}
        </div>
      </div>
    );
  } else if (mode === 'paused') {
    const opts: [string, React.ComponentType<any>, string][] = [['Resume', Play, '#30c77b'], ['Save', Check, '#11a9ed'], ['Discard', X, '#e5304c']];
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="w-sub" style={{ textAlign: 'center', marginBottom: 6 }}>STOPPED · {fmtDuration(elapsed)}</div>
        {opts.map(([label, Icon, c], i) => (
          <div key={label} className={`w-list-item${i === sel ? ' sel' : ''}`}>
            <span className="w-icon" style={{ background: i === sel ? c : '#2a2c2f' }}><Icon size={18} color="#fff" /></span>{label}
          </div>
        ))}
      </div>
    );
  } else if (mode === 'saved' && saved) {
    content = (
      <div className="w-center">
        <Check size={26} color="#30c77b" />
        <div className="w-title" style={{ marginTop: 4 }}>Activity Saved</div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 6 }}>{fmtDuration(saved.durationSec)}</div>
        <div className="w-sub">{saved.distanceMi !== undefined ? `${saved.distanceMi.toFixed(2)} mi · ` : ''}{saved.calories} kcal · {saved.avgHr} bpm</div>
        <div className="w-sub" style={{ marginTop: 8, fontSize: 11 }}>{state.sync.status === 'syncing' ? 'Syncing to phone…' : state.pendingUpload.length ? 'Waiting to sync' : 'Synced to Garmin Connect'}</div>
      </div>
    );
  }

  return (
    <WatchFrame onPress={press}>
      {content}
      {notif && (
        <div className="w-center" style={{ background: '#000', padding: '0 40px' }}>
          <MessageSquare size={24} color="#30c77b" />
          <div className="w-sub" style={{ marginTop: 6 }}>{notif.app.toUpperCase()}</div>
          <div className="w-title" style={{ fontSize: 18, marginTop: 2 }}>{notif.from}</div>
          <div style={{ fontSize: 15, marginTop: 6, lineHeight: 1.3 }}>{notif.text}</div>
          <div className="w-sub" style={{ fontSize: 11, marginTop: 10 }}>Press any button to dismiss</div>
        </div>
      )}
      {light && <div className="w-light" />}
      {light && mode === 'face' && <Sun size={14} color="#ffd666" style={{ position: 'absolute', top: 16, left: '50%', marginLeft: -7 }} />}
    </WatchFrame>
  );
}

function WatchFrame({ children, onPress }: { children: React.ReactNode; onPress: (b: Btn) => void }) {
  const S = 300; // matches --watch-size
  const cx = (S + 120) / 2;
  const caseR = (S + 40) / 2;
  const cy = (S + 280) / 2;
  // Button positions on the case edge (angles in degrees, 0 = right, clockwise)
  const btn = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { left: cx + Math.cos(rad) * (caseR + 4) - 9, top: cy + Math.sin(rad) * (caseR + 4) - 20, transform: `rotate(${angle}deg)` };
  };
  const label = (angle: number, text: string, side: 'l' | 'r') => {
    const rad = (angle * Math.PI) / 180;
    const x = cx + Math.cos(rad) * (caseR + 26);
    const y = cy + Math.sin(rad) * (caseR + 26) - 7;
    return <span className="watch-btn-label" style={side === 'l' ? { right: S + 120 - x, top: y } : { left: x, top: y }}>{text}</span>;
  };
  const buttons: [Btn, number, string, 'l' | 'r', string][] = [
    ['light', 210, 'Light', 'l', ''], ['up', 180, 'Up', 'l', ''], ['down', 150, 'Down', 'l', ''],
    ['start', 330, 'Start · Stop', 'r', 'right start'], ['back', 30, 'Back · Lap', 'r', 'right'],
  ];
  return (
    <div className="watch-wrap">
      <div className="watch-strap top"><div className="holes" /></div>
      <div className="watch-strap bottom"><div className="holes">{[0, 1, 2, 3].map(i => <span key={i} />)}</div></div>
      {buttons.map(([b, a, , , cls]) => (
        <button key={b} className={`watch-btn ${cls}`} style={btn(a)} onClick={() => onPress(b)} aria-label={`Watch ${b.toUpperCase()} button`} title={`${b.toUpperCase()} button`} />
      ))}
      {buttons.map(([b, a, text, side]) => <span key={`l${b}`}>{label(a, text, side)}</span>)}
      <div className="watch-case">
        <div className="watch-bezel">
          <div className="watch-screen">{children}</div>
        </div>
      </div>
    </div>
  );
}
