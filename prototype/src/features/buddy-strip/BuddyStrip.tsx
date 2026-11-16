import { useStore } from '../../store';
import { useNav } from '../../phone/nav';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { buddyStatuses, getRecommendation, REC_COLORS } from './buddies';

// NEW FEATURE (flag: workoutBuddies, slot: home.afterGlance)
// Compact "Friends Today" row on Home: each connection's avatar, first name and
// workout recommendation (Hard / Easy / Rest from their Body Battery + Sleep Score).
// Tap a friend to open their profile. Carried over from the team's first friends mockup.
export function BuddyStrip() {
  const { state } = useStore();
  const nav = useNav();
  const buddies = buddyStatuses.filter(b => state.connections.includes(b.personId));
  if (buddies.length === 0) return null;

  return (
    <>
      <div className="section-title">
        Friends Today
        <button className="link" onClick={() => nav.push('connections')}>See All</button>
      </div>
      <div className="pad">
        <div className="card" style={{ display: 'grid', gridTemplateColumns: `repeat(${buddies.length}, 1fr)`, padding: '12px 6px' }}>
          {buddies.map(b => {
            const p = personById(b.personId);
            const rec = getRecommendation(b.bodyBattery, b.sleepScore);
            const color = REC_COLORS[rec.type];
            return (
              <button key={b.personId} onClick={() => nav.push('friend', { id: p.id })}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ borderRadius: '50%', padding: 2, border: `2px solid ${color}` }}><Avatar person={p} size={34} /></span>
                <span className="tiny" style={{ color: 'var(--gc-text)' }}>{p.name.split(' ')[0]}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color }}>{rec.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
