import { useState } from 'react';
import { useStore } from '../../store';
import { useNav } from '../../phone/nav';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { buddyStatuses, getRecommendation, REC_COLORS } from './buddies';

// NEW FEATURE (flag: workoutBuddies, slot: home.afterGlance)
// Compact "Friends Today" row on Home: each connection's avatar, first name and
// workout recommendation (Hard / Easy / Rest from their Body Battery + Sleep Score).
// Tap a friend to cheer them on (once per friend per day). "See All" opens Connections.
// Carried over from the team's first friends mockup.
export function BuddyStrip() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [cheered, setCheered] = useState<string[]>([]);
  const [popping, setPopping] = useState<string | null>(null);
  const buddies = buddyStatuses.filter(b => state.connections.includes(b.personId));
  if (buddies.length === 0) return null;

  const cheer = (id: string) => {
    const first = personById(id).name.split(' ')[0];
    if (cheered.includes(id)) {
      dispatch({ type: 'toast', text: `You already cheered on ${first} today` });
      return;
    }
    setCheered(c => [...c, id]);
    setPopping(id);
    window.setTimeout(() => setPopping(null), 450);
    dispatch({ type: 'toast', text: `👏 You cheered on ${first}!` });
  };

  return (
    <>
      <style>{`@keyframes cheerPop { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }`}</style>
      <div className="section-title">
        Friends Today
        <button className="link" onClick={() => nav.push('connections')}>See All</button>
      </div>
      <div className="pad">
        <div className="card" style={{ padding: '12px 6px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${buddies.length}, 1fr)` }}>
            {buddies.map(b => {
              const p = personById(b.personId);
              const rec = getRecommendation(b.bodyBattery, b.sleepScore);
              const color = REC_COLORS[rec.type];
              const done = cheered.includes(b.personId);
              return (
                <button key={b.personId} onClick={() => cheer(b.personId)} aria-label={`Cheer on ${p.name}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ position: 'relative', borderRadius: '50%', padding: 2, border: `2px solid ${color}`, animation: popping === b.personId ? 'cheerPop .45s ease-out' : undefined }}>
                    <Avatar person={p} size={34} />
                    {done && (
                      <span style={{ position: 'absolute', right: -6, bottom: -4, width: 20, height: 20, borderRadius: 10, background: 'var(--gc-surface-3)', border: '2px solid var(--gc-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>👏</span>
                    )}
                  </span>
                  <span className="tiny" style={{ color: 'var(--gc-text)' }}>{p.name.split(' ')[0]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color }}>{rec.title}</span>
                </button>
              );
            })}
          </div>
          <div className="tiny" style={{ textAlign: 'center', marginTop: 8, color: 'var(--gc-text-3)' }}>Tap a friend to cheer them on</div>
        </div>
      </div>
    </>
  );
}
