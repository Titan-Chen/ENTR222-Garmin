import { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../nav';
import { NavBar, Avatar, SportIcon, Sheet } from '../../components/common';
import { RouteMap, ZoneBars, AreaLine } from '../../components/charts';
import { personById } from '../../data/people';
import { fmtDuration, relDay, timeOf, shortDate } from '../../data/dates';
import { sportLabel } from '../../data/activities';
import { Slot } from '../../slots';
import type { Activity } from '../../data/types';

// Activity detail, as the current app shows it. Note for the team: a Strength or Basketball
// activity gets the same cardio-style summary (time, HR, calories, training effect) with
// sets/reps only if you logged them on the watch — the "nothing for strength" pain point (Ethan).
export function ActivityDetailScreen({ params }: { params: { id: string } }) {
  const { state, dispatch } = useStore();
  const a = state.activities.find(x => x.id === params.id);
  const [tab, setTab] = useState(0);
  const [commenting, setCommenting] = useState(false);
  const [text, setText] = useState('');
  if (!a) return <div className="screen"><NavBar title="Activity" /></div>;
  const owner = personById(a.ownerId);
  const isCardioDistance = a.distanceMi !== undefined;
  const tabs = isCardioDistance ? ['Overview', 'Stats', 'Laps'] : ['Overview', 'Stats'];

  return (
    <div className="screen">
      <NavBar title={a.title} right={<><Share size={20} /><MoreHorizontal size={20} /></>} />
      <div className="scroll">
        {a.route ? <RouteMap route={a.route} /> : (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gc-surface)' }}>
            <SportIcon type={a.type} size={48} color="var(--gc-blue)" />
          </div>
        )}
        <div className="pad" style={{ paddingTop: 14 }}>
          <div className="row">
            <Avatar person={owner} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{owner.id === 'me' ? a.title : owner.name}</div>
              <div className="tiny">{shortDate(a.date)} @ {timeOf(a.date)} · {a.device}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 18, margin: '12px 0 4px', color: 'var(--gc-text-2)' }}>
            <button className="row" style={{ gap: 6, color: a.likes.includes('me') ? 'var(--gc-blue)' : undefined }} onClick={() => dispatch({ type: 'like', activityId: a.id })}>
              <Heart size={18} fill={a.likes.includes('me') ? 'currentColor' : 'none'} /> <span className="small">{a.likes.length}</span>
            </button>
            <button className="row" style={{ gap: 6 }} onClick={() => setCommenting(true)}><MessageCircle size={18} /> <span className="small">{a.comments.length}</span></button>
          </div>
        </div>
        <div className="seg">{tabs.map((t, i) => <button key={t} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>)}</div>
        <div className="pad">
          {tab === 0 && <Overview a={a} />}
          {tab === 1 && <StatsTab a={a} />}
          {tab === 2 && a.splits && (
            <div className="list">
              <div className="list-row tiny"><span style={{ width: 40 }}>Lap</span><span className="grow">Time</span><span style={{ width: 90 }}>Avg Pace</span><span style={{ width: 50, textAlign: 'right' }}>HR</span></div>
              {a.splits.map(s => (
                <div key={s.label} className="list-row small"><span style={{ width: 40 }}>{s.label}</span><span className="grow">{s.time}</span><span style={{ width: 90 }}>{s.pace}</span><span style={{ width: 50, textAlign: 'right' }}>{s.avgHr}</span></div>
              ))}
            </div>
          )}
          <Slot name="activity.summary" activity={a} />
          {a.comments.length > 0 && (
            <>
              <div className="list-header" style={{ padding: '20px 0 6px' }}>Comments</div>
              <div className="list">
                {a.comments.map((c, i) => (
                  <div key={i} className="list-row"><Avatar person={personById(c.personId)} size={28} /><div className="grow"><div className="small" style={{ fontWeight: 600 }}>{personById(c.personId).name}</div><div className="small">{c.text}</div></div></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {commenting && (
        <Sheet onClose={() => setCommenting(false)}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Add a comment</div>
          <textarea className="text-input" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment…" autoFocus />
          <button className="btn-primary" style={{ marginTop: 12 }} disabled={!text.trim()} onClick={() => { dispatch({ type: 'comment', activityId: a.id, text: text.trim() }); setText(''); setCommenting(false); }}>Post</button>
        </Sheet>
      )}
    </div>
  );
}

function Overview({ a }: { a: Activity }) {
  const cells: [string, string][] = [];
  if (a.distanceMi !== undefined) cells.push(['Distance', `${a.distanceMi.toFixed(2)} mi`]);
  cells.push(['Time', fmtDuration(a.durationSec)]);
  if (a.avgPace) cells.push(['Avg Pace', a.avgPace]);
  if (a.avgSpeedMph) cells.push(['Avg Speed', `${a.avgSpeedMph} mph`]);
  cells.push(['Avg HR', `${a.avgHr} bpm`], ['Calories', `${a.calories}`]);
  if (a.elevGainFt !== undefined) cells.push(['Total Ascent', `${a.elevGainFt} ft`]);
  if (a.type === 'strength') cells.push(['Total Sets', a.sets ? String(a.sets) : '--'], ['Total Reps', a.reps ? String(a.reps) : '--']);
  return (
    <>
      <div className="card"><div className="grid-3" style={{ rowGap: 16 }}>
        {cells.map(([k, v]) => <div key={k}><div style={{ fontSize: 18, fontWeight: 600 }}>{v}</div><div className="tiny">{k}</div></div>)}
      </div></div>
      {a.trainingEffect && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>Training Effect</div>
          <div className="grid-3">
            <div><div style={{ fontSize: 20, fontWeight: 600 }}>{a.trainingEffect.aerobic.toFixed(1)}</div><div className="tiny">Aerobic</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 600 }}>{a.trainingEffect.anaerobic.toFixed(1)}</div><div className="tiny">Anaerobic</div></div>
            <div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 3 }}>{a.trainingEffect.label}</div><div className="tiny">Primary Benefit</div></div>
          </div>
        </div>
      )}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="small" style={{ fontWeight: 600, marginBottom: 10 }}>Heart Rate</div>
        <AreaLine values={hrTrace(a)} color="#e5304c" height={90} />
      </div>
      <div className="card" style={{ marginTop: 10 }}>
        <div className="small" style={{ fontWeight: 600, marginBottom: 10 }}>Time in Zones</div>
        <ZoneBars minutes={a.hrZonesMin} />
      </div>
      {a.type === 'strength' && !a.sets && (
        <div className="card small muted" style={{ marginTop: 10 }}>No sets recorded. Use the Strength activity's rep counting on your watch, or edit sets here after the workout.</div>
      )}
    </>
  );
}

function StatsTab({ a }: { a: Activity }) {
  const rows: [string, string][] = [
    ['Moving Time', fmtDuration(Math.round(a.durationSec * 0.94))], ['Elapsed Time', fmtDuration(a.durationSec)],
    ['Avg HR', `${a.avgHr} bpm`], ['Max HR', `${a.maxHr} bpm`], ['Active Calories', `${Math.round(a.calories * 0.82)}`], ['Total Calories', `${a.calories}`],
    ['Intensity Minutes', `${Math.round(a.durationSec / 60 * 0.6)}`], ['Body Battery Impact', `−${Math.round(a.calories / 45)}`], ['Est. Sweat Loss', `${Math.round(a.durationSec / 6)} ml`],
  ];
  return <div className="list">{rows.map(([k, v]) => <div key={k} className="list-row small"><span className="grow">{k}</span><span className="muted">{v}</span></div>)}</div>;
}

function hrTrace(a: Activity): number[] {
  let seed = a.id.charCodeAt(1) * 31;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: 60 }, (_, i) => {
    const warm = Math.min(1, i / 8);
    const burst = a.type === 'basketball' || a.type === 'strength' ? (rnd() > 0.7 ? 25 : 0) : 0;
    return Math.round(a.avgHr * (0.75 + 0.25 * warm) + (rnd() - 0.5) * 10 + burst);
  });
}

export function ActivitiesListScreen() {
  const { state } = useStore();
  const nav = useNav();
  const mine = state.activities.filter(a => a.ownerId === 'me').sort((x, y) => +new Date(y.date) - +new Date(x.date));
  return (
    <div className="screen">
      <NavBar title="Activities" />
      <div className="scroll"><div className="pad" style={{ paddingTop: 12 }}><div className="list">
        {mine.map(a => (
          <button key={a.id} className="list-row" onClick={() => nav.push('activity', { id: a.id })}>
            <SportIcon type={a.type} color="var(--gc-blue)" />
            <div className="grow">
              <div className="title">{a.title}</div>
              <div className="sub">{relDay(a.date)} · {a.distanceMi ? `${a.distanceMi.toFixed(2)} mi · ` : ''}{fmtDuration(a.durationSec)}</div>
            </div>
            <span className="tiny">{sportLabel[a.type]}</span>
          </button>
        ))}
      </div></div></div>
    </div>
  );
}
