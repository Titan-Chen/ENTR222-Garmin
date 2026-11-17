import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../nav';
import { NavBar, SportIcon, Sheet } from '../../components/common';
import { isoDate, today, fmtDuration, timeOf } from '../../data/dates';

// Calendar tab: month grid with activity icons per day. "+" schedules a workout on YOUR calendar only —
// the current app has no way to invite a connection to a workout (relevant to user-test task 5).
export function CalendarScreen() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(isoDate(today));
  const [adding, setAdding] = useState(false);
  const [workout, setWorkout] = useState('Run');
  const [day, setDay] = useState('Saturday');

  const mine = state.activities.filter(a => a.ownerId === 'me');
  const byDay = (iso: string) => mine.filter(a => isoDate(new Date(a.date)) === iso);
  // Earliest first; items without a time go last.
  const toMin = (t?: string) => { const m = t?.match(/(\d+):(\d+)\s*(AM|PM)/); return m ? (+m[1] % 12 + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2] : 1e9; };
  const schedOn = (iso: string) => state.scheduled.filter(s => s.date === iso).sort((a, b) => toMin(a.time) - toMin(b.time));
  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, i) => (i < first ? null : i - first + 1));

  const nextDow = (name: string) => {
    const idx = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(name);
    const d = new Date(today);
    d.setDate(d.getDate() + ((idx - d.getDay() + 7) % 7 || 7));
    return isoDate(d);
  };

  return (
    <div className="screen">
      <NavBar title="Calendar" back={false} right={<button onClick={() => setAdding(true)} aria-label="Add"><Plus size={24} /></button>} />
      <div className="scroll">
        <div className="between pad" style={{ padding: '14px 16px' }}>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={20} color="var(--gc-blue)" /></button>
          <b>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={20} color="var(--gc-blue)" /></button>
        </div>
        <div className="pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="tiny">{d}</div>)}
          {cells.map((n, i) => {
            if (!n) return <div key={i} />;
            const iso = isoDate(new Date(month.getFullYear(), month.getMonth(), n));
            const acts = byDay(iso);
            const sch = schedOn(iso);
            const isToday = iso === isoDate(today);
            return (
              <button key={i} onClick={() => setSelected(iso)} style={{
                height: 52, borderRadius: 8, background: selected === iso ? 'var(--gc-surface-3)' : 'var(--gc-surface)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, gap: 3,
              }}>
                <span className="small" style={{ color: isToday ? 'var(--gc-blue)' : undefined, fontWeight: isToday ? 700 : 400 }}>{n}</span>
                <span className="row" style={{ gap: 2 }}>
                  {acts.slice(0, 2).map(a => <SportIcon key={a.id} type={a.type} size={13} color="var(--gc-blue)" />)}
                  {sch.length > 0 && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--m-intensity)' }} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="list-header">{new Date(selected + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div className="pad"><div className="list">
          {byDay(selected).map(a => (
            <button key={a.id} className="list-row" onClick={() => nav.push('activity', { id: a.id })}>
              <SportIcon type={a.type} color="var(--gc-blue)" />
              <div className="grow"><div className="title">{a.title}</div><div className="sub">{timeOf(a.date)} · {fmtDuration(a.durationSec)}</div></div>
            </button>
          ))}
          {schedOn(selected).map(s => (
            <div key={s.id} className="list-row"><span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--m-intensity)' }} /><div className="grow"><div className="title">{s.title}</div><div className="sub">{s.time || s.note ? [s.time, s.note].filter(Boolean).join(' · ') : 'Scheduled workout'}</div></div></div>
          ))}
          {byDay(selected).length === 0 && schedOn(selected).length === 0 && <div className="list-row small muted">No activities</div>}
        </div></div>
      </div>
      {adding && (
        <Sheet onClose={() => setAdding(false)}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Schedule a Workout</div>
          <div className="small muted" style={{ marginBottom: 6 }}>Workout</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {['Run', 'Bike', 'Strength', 'Walk'].map(w => <button key={w} className="chip" style={{ padding: '6px 12px', background: w === workout ? 'var(--gc-blue)' : undefined, color: w === workout ? '#fff' : undefined }} onClick={() => setWorkout(w)}>{w}</button>)}
          </div>
          <div className="small muted" style={{ marginBottom: 6 }}>Day</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <button key={d} className="chip" style={{ padding: '6px 12px', background: d === day ? 'var(--gc-blue)' : undefined, color: d === day ? '#fff' : undefined }} onClick={() => setDay(d)}>{d.slice(0, 3)}</button>)}
          </div>
          <button className="btn-primary" onClick={() => {
            const date = nextDow(day);
            dispatch({ type: 'schedule', item: { id: `s${Date.now()}`, date, title: `${workout} workout` } });
            setSelected(date); setAdding(false);
          }}>Add to My Calendar</button>
          <div className="tiny" style={{ marginTop: 10, textAlign: 'center' }}>Scheduled workouts sync to your watch.</div>
        </Sheet>
      )}
    </div>
  );
}
