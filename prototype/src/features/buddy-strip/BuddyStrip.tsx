import { useState } from 'react';
import { Zap, Moon, Footprints } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../../phone/nav';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { buddyStatuses, getRecommendation, REC_COLORS } from './buddies';

// NEW FEATURE (flag: workoutBuddies, slot: home.top)
// "Friends Today" strip at the top of Home: each connection's workout recommendation
// (Hard / Easy / Rest from their Body Battery + Sleep Score), steps, and a cheer button.
// Carried over from the team's first friends mockup.
export function BuddyStrip() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [cheered, setCheered] = useState<string[]>([]);
  const buddies = buddyStatuses.filter(b => state.connections.includes(b.personId));
  if (buddies.length === 0) return null;

  const cheer = (id: string) => {
    setCheered(c => [...c, id]);
    dispatch({ type: 'toast', text: `You cheered on ${personById(id).name.split(' ')[0]}!` });
  };

  return (
    <>
      <div className="section-title">
        Friends Today
        <button className="link" onClick={() => nav.push('connections')}>See All</button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
        {buddies.map(b => {
          const p = personById(b.personId);
          const rec = getRecommendation(b.bodyBattery, b.sleepScore);
          const color = REC_COLORS[rec.type];
          const done = cheered.includes(b.personId);
          return (
            <div key={b.personId} className="card" style={{ flex: '0 0 148px', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => nav.push('friend', { id: p.id })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ borderRadius: '50%', padding: 2, border: `2px solid ${color}` }}><Avatar person={p} size={40} /></span>
                <span className="small" style={{ fontWeight: 600 }}>{p.name.split(' ')[0]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}22`, borderRadius: 999, padding: '2px 8px' }}>{rec.title}</span>
              </button>
              <div className="tiny" style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><Zap size={11} color="#1fa0ff" />{b.bodyBattery}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><Moon size={11} color="#7b61ff" />{b.sleepScore}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><Footprints size={11} color="#11a9ed" />{(b.stepsToday / 1000).toFixed(1)}k</span>
              </div>
              <button
                onClick={() => cheer(b.personId)}
                disabled={done}
                aria-label={`Cheer on ${p.name}`}
                style={{
                  borderRadius: 999, padding: '6px 0', textAlign: 'center', fontSize: 13, fontWeight: 600,
                  background: done ? 'var(--gc-surface-3)' : 'var(--gc-surface-2)', color: done ? 'var(--gc-text-2)' : 'var(--gc-text)',
                }}
              >
                {done ? '✅ Cheered' : '👏 Cheer'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
