import { useRef, useState } from 'react';
import { Bell, RefreshCw, ChevronRight, Moon, Pencil, Trophy, CalendarDays } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../nav';
import { NavBar, Avatar, SportIcon } from '../../components/common';
import { AreaLine, Gauge, Ring, SleepStages } from '../../components/charts';
import { me, personById } from '../../data/people';
import { healthHistory, todayHealth, intradaySeries } from '../../data/health';
import { fmtDuration, fmtHrMin, relDay, isoDate, today, timeOf, shortDate } from '../../data/dates';
import { sportLabel } from '../../data/activities';
import { METRICS, type MetricId } from '../metrics';
import { Slot } from '../../slots';

// HOME TAB (Garmin Connect 5.x "Home"): Today's Activity → In Focus → (Sleep Coach) → At a Glance
// → Last 7 Days → Challenges / Events. TODO verify against screenshot: section titles and order.

export function HomeScreen() {
  const { state, startSync } = useStore();
  const nav = useNav();
  const s = state.home.sections;

  return (
    <div className="screen">
      <NavBar
        title="Home" /* TODO verify against screenshot: header title, avatar and right-side icons */
        back={false}
        left={<button onClick={() => nav.push('profile')} aria-label="Profile"><Avatar person={me} size={30} /></button>}
        right={<>
          <button onClick={startSync} aria-label="Sync"><RefreshCw size={21} className={state.sync.status === 'syncing' ? 'spin' : ''} /></button>
          <button onClick={() => nav.push('notifications')} aria-label="Notifications"><Bell size={21} /></button>
        </>}
      />
      <div className="scroll">
        <Slot name="home.top" />
        {s.todaysActivity && <TodaysActivity />}
        {s.inFocus && <InFocus />}
        {s.inFocus && <SleepCoachStrip />}
        {s.atAGlance && <AtAGlance glance={state.home.glance} />}
        <Slot name="home.afterGlance" />
        {s.last7Days && <Last7Days />}
        {s.challenges && <ChallengesSection />}
        {s.events && <EventsSection />}
        <div className="pad" style={{ marginTop: 24 }}>
          <button className="btn-outline" style={{ width: '100%', display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }} onClick={() => nav.push('editHome')}>
            <Pencil size={14} /> Edit Home
          </button>
        </div>
      </div>
    </div>
  );
}

function TodaysActivity() {
  const { state } = useStore();
  const nav = useNav();
  const mine = state.activities.filter(a => a.ownerId === 'me').sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const todays = mine.filter(a => isoDate(new Date(a.date)) === isoDate(today));
  const shown = todays.length ? todays : mine.slice(0, 1);
  return (
    <>
      <div className="section-title">{todays.length ? "Today's Activity" : 'Latest Activity'}</div>
      <div className="pad">
        {shown.map(a => (
          <button key={a.id} className="card" onClick={() => nav.push('activity', { id: a.id })}>
            <div className="row">
              <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--gc-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SportIcon type={a.type} color="var(--gc-blue)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div className="tiny">{relDay(a.date)} @ {timeOf(a.date)}</div>
              </div>
              <ChevronRight size={18} className="chev" />
            </div>
            <div className="grid-3" style={{ marginTop: 12 }}>
              {a.distanceMi !== undefined
                ? <div><div style={{ fontSize: 18, fontWeight: 600 }}>{a.distanceMi.toFixed(2)}<span className="unit">mi</span></div><div className="tiny">Distance</div></div>
                : <div><div style={{ fontSize: 18, fontWeight: 600 }}>{a.calories}<span className="unit">kcal</span></div><div className="tiny">Calories</div></div>}
              <div><div style={{ fontSize: 18, fontWeight: 600 }}>{fmtDuration(a.durationSec)}</div><div className="tiny">Time</div></div>
              <div><div style={{ fontSize: 18, fontWeight: 600 }}>{a.avgHr}<span className="unit">bpm</span></div><div className="tiny">Avg HR</div></div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function InFocus() {
  const nav = useNav();
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const t = todayHealth;
  const panels = [
    <button key="sleep" className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }} onClick={() => nav.push('metric', { id: 'sleep' })}>
      <div className="between"><b>Sleep</b><span className="tiny">Last night</span></div>
      <Gauge value={t.sleepScore} color="var(--m-sleep)" label={t.sleepQuality} sub={fmtHrMin(t.sleepSec)} size={170} />
      <SleepStages stages={t.sleepStagesMin} height={44} />
      <div className="between tiny" style={{ marginTop: 4 }}><span>{t.bedtime}</span><span>{t.wake}</span></div>
    </button>,
    <button key="bb" className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }} onClick={() => nav.push('metric', { id: 'bodyBattery' })}>
      <div className="between"><b>Body Battery</b><span className="tiny">Today</span></div>
      <div className="row" style={{ marginTop: 10 }}>
        <div className="huge-num" style={{ color: 'var(--m-body-battery)' }}>{t.bodyBatteryLow}</div>
        <div className="tiny">+{t.bodyBatteryCharged} charged<br />−{t.bodyBatteryDrained} drained</div>
      </div>
      <div style={{ marginTop: 14 }}><AreaLine values={intradaySeries('bodyBattery')} color="#1fa0ff" height={110} min={0} max={100} axis={['12a', '6a', '12p', 'Now']} /></div>
    </button>,
    <button key="tr" className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }} onClick={() => nav.push('metric', { id: 'readiness' })}>
      <div className="between"><b>Training Readiness</b><span className="tiny">Today</span></div>
      <Gauge value={t.trainingReadiness} color="var(--m-readiness)" label={METRICS.readiness.sub()} size={170} />
      <div className="small muted" style={{ textAlign: 'center', marginTop: 4 }}>Recovery time 14 hrs · HRV {t.hrvStatus.toLowerCase()}</div>
    </button>,
  ];
  return (
    <>
      <div className="section-title">In Focus</div>
      <div
        ref={ref}
        onScroll={e => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.clientWidth - 40))); }}
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 10, padding: '0 16px', scrollbarWidth: 'none' }}
      >
        {panels.map((p, i) => <div key={i} style={{ flex: '0 0 calc(100% - 32px)', scrollSnapAlign: 'center', height: 300 }}>{p}</div>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {panels.map((_, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i === idx ? '#fff' : '#48494c' }} />)}
      </div>
    </>
  );
}

function SleepCoachStrip() {
  const nav = useNav();
  return (
    <div className="pad" style={{ marginTop: 14 }}>
      <button className="card row" onClick={() => nav.push('metric', { id: 'sleep' })}>
        <Moon size={22} color="var(--m-sleep)" />
        <div style={{ flex: 1 }}>
          <div className="small" style={{ fontWeight: 600 }}>Sleep Coach</div>
          <div className="tiny">You need 8h 15m of sleep tonight.</div>
        </div>
        <ChevronRight size={18} className="chev" />
      </button>
    </div>
  );
}

export function GlanceCard({ id }: { id: MetricId }) {
  const nav = useNav();
  const m = METRICS[id];
  const t = todayHealth;
  let visual: React.ReactNode = null;
  if (id === 'steps') visual = <Ring value={t.steps} max={t.stepGoal} size={46} stroke={5} color={m.color} />;
  else if (id === 'sleep') visual = <Ring value={t.sleepScore} max={100} size={46} stroke={5} color={m.color} />;
  else if (id === 'bodyBattery') visual = (
    <div style={{ width: 18, height: 40, border: '2px solid #5b5e62', borderRadius: 4, padding: 2, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', height: `${t.bodyBatteryLow}%`, background: m.color, borderRadius: 1 }} />
    </div>
  );
  else if (id === 'readiness') visual = <Ring value={t.trainingReadiness} max={100} size={46} stroke={5} color={m.color} />;
  else if (id === 'intensity') visual = <Ring value={healthHistory.slice(-7).reduce((a, d) => a + d.intensityMin, 0)} max={150} size={46} stroke={5} color={m.color} />;
  else {
    const series = id === 'stress' ? healthHistory.map(d => d.stressAvg) : id === 'hrv' ? healthHistory.map(d => d.hrvOvernight)
      : id === 'hr' ? healthHistory.map(d => d.restingHr) : id === 'calories' ? healthHistory.map(d => d.activeCalories) : healthHistory.map(d => d.floorsClimbed);
    visual = <div style={{ width: 64 }}><AreaLine values={series.slice(-7)} color={m.color.startsWith('var') ? getComputedColor(id) : m.color} height={36} fill={false} /></div>;
  }
  return (
    <button className="card" style={{ minHeight: 112, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => nav.push('metric', { id })}>
      <div className="small" style={{ fontWeight: 600 }}>{m.name}</div>
      <div className="between" style={{ alignItems: 'flex-end', marginTop: 8 }}>
        <div>
          <div className="big-num" style={{ fontSize: 26 }}>{m.value()}{m.unit && <span className="unit">{m.unit}</span>}</div>
          <div className="tiny">{m.sub()}</div>
        </div>
        {visual}
      </div>
    </button>
  );
}

function getComputedColor(id: MetricId): string {
  return ({ stress: '#ff9f3d', hrv: '#30c77b', hr: '#e5304c', calories: '#ff5a36', floors: '#30c77b' } as Record<string, string>)[id] ?? '#11a9ed';
}

function AtAGlance({ glance }: { glance: MetricId[] }) {
  const nav = useNav();
  return (
    <>
      <div className="section-title">At a Glance <button className="link" onClick={() => nav.push('allMetrics')}>See All</button></div>
      <div className="pad grid-2">
        {glance.slice(0, 8).map(id => <GlanceCard key={id} id={id} />)}
      </div>
    </>
  );
}

function Last7Days() {
  const { state } = useStore();
  const nav = useNav();
  const week = healthHistory.slice(-7);
  const cutoff = +today - 7 * 86400000;
  const acts = state.activities.filter(a => a.ownerId === 'me' && +new Date(a.date) >= cutoff);
  const time = acts.reduce((a, x) => a + x.durationSec, 0);
  const rows: [string, string, () => void][] = [
    ['Activities', `${acts.length} · ${fmtHrMin(time)}`, () => nav.push('activitiesList')],
    ['Steps', `${week.reduce((a, d) => a + d.steps, 0).toLocaleString()} total`, () => nav.push('metric', { id: 'steps', range: 1 })],
    ['Sleep', `${fmtHrMin(week.reduce((a, d) => a + d.sleepSec, 0) / 7)} avg`, () => nav.push('metric', { id: 'sleep', range: 1 })],
    ['Intensity Minutes', `${week.reduce((a, d) => a + d.intensityMin, 0)} of 150`, () => nav.push('metric', { id: 'intensity', range: 1 })],
    ['Resting Heart Rate', `${Math.round(week.reduce((a, d) => a + d.restingHr, 0) / 7)} bpm avg`, () => nav.push('metric', { id: 'hr', range: 1 })],
  ];
  return (
    <>
      <div className="section-title">Last 7 Days</div>
      <div className="pad"><div className="list">
        {rows.map(([title, value, go]) => (
          <button key={title} className="list-row" onClick={go}>
            <div className="grow title">{title}</div><span className="muted small">{value}</span><ChevronRight size={18} className="chev" />
          </button>
        ))}
      </div></div>
    </>
  );
}

function ChallengesSection() {
  const { state } = useStore();
  const nav = useNav();
  const active = state.challenges.filter(c => c.status === 'active');
  return (
    <>
      <div className="section-title">Challenges <button className="link" onClick={() => nav.setTab('challenges')}>See All</button></div>
      <div className="pad">
        {active.length === 0 && <div className="card small muted">No active challenges.</div>}
        {active.map(c => {
          const sorted = [...c.participants].sort((a, b) => b.value - a.value);
          const leader = personById(sorted[0]?.personId ?? 'me');
          const myRank = sorted.findIndex(p => p.personId === 'me') + 1;
          return (
            <button key={c.id} className="card" onClick={() => { nav.setTab('challenges'); }}>
              <div className="row">
                <Trophy size={22} color="var(--m-intensity)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{c.title}</div>
                  <div className="tiny">Ends {shortDate(c.endDate)} · {c.participants.length} participants</div>
                </div>
              </div>
              <div className="between small" style={{ marginTop: 10 }}>
                <span>Leader: {leader.name.split(' ')[0]}</span><span className="muted">You're #{myRank}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function EventsSection() {
  const nav = useNav();
  return (
    <>
      <div className="section-title">Events</div>
      <div className="pad">
        <button className="card row" onClick={() => nav.setTab('calendar')}>
          <CalendarDays size={22} color="var(--gc-blue)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Add an event</div>
            <div className="tiny">Races and goal events show here with a countdown.</div>
          </div>
          <ChevronRight size={18} className="chev" />
        </button>
      </div>
    </>
  );
}

export { sportLabel };
