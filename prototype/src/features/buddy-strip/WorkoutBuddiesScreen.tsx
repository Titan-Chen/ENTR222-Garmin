import { Check } from 'lucide-react';
import { useStore } from '../../store';
import { NavBar, Avatar } from '../../components/common';
import { Toggle } from '../../phone/screens/HomeExtras';
import { personById } from '../../data/people';
import { todayHealth } from '../../data/health';
import { buddyStatuses } from './buddies';
import { friendLevel } from './bothReady';
import { buddyStore, useBuddies, MAX_BUDDIES } from './buddyStore';
import { computeReadiness, LEVEL_COLOR, LEVEL_LABEL } from '../readiness/readiness';

// NEW SCREEN: pick 3–5 workout buddies and choose whether they can see your readiness.
export function WorkoutBuddiesScreen() {
  const { state, dispatch } = useStore();
  const b = useBuddies();
  const me = computeReadiness(todayHealth, state.activities);
  const candidates = state.connections.filter(id => buddyStatuses.some(s => s.personId === id));

  const toggle = (id: string) => {
    const r = buddyStore.toggleBuddy(id);
    if (r === 'full') dispatch({ type: 'toast', text: `You can pick up to ${MAX_BUDDIES} buddies` });
    if (r === 'min') dispatch({ type: 'toast', text: 'Keep at least one buddy' });
  };

  return (
    <div className="screen">
      <NavBar title="Workout Buddies" />
      <div className="scroll">
        <div className="list-header">Sharing</div>
        <div className="pad"><div className="list">
          <div className="list-row">
            <div className="grow">
              <div className="title">Share my readiness with buddies</div>
              <div className="sub">{b.sharing
                ? <>Buddies see you're <b style={{ color: LEVEL_COLOR[me.level] }}>{LEVEL_LABEL[me.level]}</b> today. Only the answer is shared, never your health data.</>
                : 'Buddies can’t see your readiness, and you won’t get “Both ready” alerts.'}</div>
            </div>
            <Toggle on={b.sharing} onClick={() => buddyStore.setSharing(!b.sharing)} />
          </div>
        </div></div>

        <div className="list-header">My buddies · {b.buddies.length} picked (up to {MAX_BUDDIES})</div>
        <div className="pad"><div className="list">
          {candidates.map(id => {
            const p = personById(id);
            const on = b.buddies.includes(id);
            const level = friendLevel(id)!;
            return (
              <button key={id} className="list-row" onClick={() => toggle(id)} aria-pressed={on}>
                <Avatar person={p} size={36} />
                <div className="grow">
                  <div className="title">{p.name}</div>
                  <div className="sub" style={{ color: LEVEL_COLOR[level], fontWeight: 600 }}>{LEVEL_LABEL[level]} today</div>
                </div>
                <span style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${on ? 'var(--gc-blue)' : '#5b5e62'}`, background: on ? 'var(--gc-blue)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Check size={15} color="#fff" />}
                </span>
              </button>
            );
          })}
        </div></div>
        <div className="pad tiny" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Tick the connections you want as workout buddies. They appear in Daily Readiness on your Home screen. You'll get a “Both ready” alert when a buddy's readiness matches yours, so it's easy to plan a workout together.
        </div>
      </div>
    </div>
  );
}
