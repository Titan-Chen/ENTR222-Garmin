import { Check, Clock, X, EyeOff } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../../phone/nav';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { todayHealth } from '../../data/health';
import { buddyStatuses } from './buddies';
import { friendLevel } from './bothReady';
import { buddyStore, useBuddies, type Invite } from './buddyStore';
import { computeReadiness, LEVEL_COLOR, LEVEL_LABEL } from '../readiness/readiness';
import { isOn } from '../../features';

// NEW FEATURE (flag: workoutBuddies, slot: home.afterGlance)
// "Workout Buddies" card on Home: your chosen buddies (3–5) and their Go hard / Go light / Recover
// status, your sharing status, and your workout invites. Tap a buddy to invite or cheer.
// When Daily Readiness is on, buddies are shown inside that card instead (ReadinessBuddies), so this hides.
export function BuddyStrip() {
  const { state } = useStore();
  const nav = useNav();
  const b = useBuddies();
  if (isOn('dailyReadiness')) return null;
  const buddies = b.buddies.filter(id => state.connections.includes(id) && buddyStatuses.some(s => s.personId === id));
  const me = computeReadiness(todayHealth, state.activities);

  return (
    <>
      <div className="section-title">
        Workout Buddies
        <button className="link" onClick={() => nav.push('workoutBuddies')}>Edit</button>
      </div>
      <div className="pad">
        <div className="card" style={{ padding: '12px 6px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(buddies.length, 3)}, 1fr)` }}>
            {buddies.map(id => {
              const p = personById(id);
              const level = friendLevel(id)!;
              const color = LEVEL_COLOR[level];
              return (
                <button key={id} onClick={() => buddyStore.openSheet('buddy', id)} aria-label={`${p.name}, ${LEVEL_LABEL[level]}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ position: 'relative', borderRadius: '50%', padding: 2, border: `2px solid ${color}` }}>
                    <Avatar person={p} size={34} />
                    {b.cheered.includes(id) && (
                      <span style={{ position: 'absolute', right: -6, bottom: -4, width: 20, height: 20, borderRadius: 10, background: 'var(--gc-surface-3)', border: '2px solid var(--gc-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>👏</span>
                    )}
                  </span>
                  <span className="tiny" style={{ color: 'var(--gc-text)' }}>{p.name.split(' ')[0]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color }}>{LEVEL_LABEL[level]}</span>
                </button>
              );
            })}
          </div>
          <div className="tiny" style={{ textAlign: 'center', marginTop: 8, color: 'var(--gc-text-3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            {b.sharing
              ? <>Buddies can see you're <b style={{ color: LEVEL_COLOR[me.level] }}>{LEVEL_LABEL[me.level]}</b> · Tap a buddy to invite or cheer</>
              : <><EyeOff size={12} /> Your readiness is hidden from buddies · Tap a buddy to invite or cheer</>}
          </div>
          {b.invites.length > 0 && (
            <div style={{ marginTop: 10, borderTop: '1px solid var(--gc-separator)', padding: '6px 8px 0' }}>
              {b.invites.map(inv => <InviteRow key={inv.id} inv={inv} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function InviteRow({ inv }: { inv: Invite }) {
  const p = personById(inv.personId);
  const first = p.name.split(' ')[0];
  const status = inv.status === 'accepted'
    ? { icon: <Check size={14} color="var(--gc-green)" />, text: inv.direction === 'out' ? `${first} is in` : "You're in", color: 'var(--gc-green)' }
    : inv.status === 'declined'
      ? { icon: <X size={14} color="var(--gc-text-3)" />, text: inv.direction === 'out' ? `${first} can't make it` : 'You declined', color: 'var(--gc-text-3)' }
      : inv.status === 'incoming'
        ? { icon: <Clock size={14} color="#f5b83d" />, text: 'Waiting for you', color: '#f5b83d' }
        : { icon: <Clock size={14} color="var(--gc-text-2)" />, text: `Waiting for ${first}`, color: 'var(--gc-text-2)' };
  return (
    <div className="row" style={{ padding: '6px 0', gap: 10 }}>
      <Avatar person={p} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="small" style={{ fontWeight: 600 }}>{inv.activity} with {first}</div>
        <div className="tiny">{inv.when.label} · {inv.place}{inv.reply ? ` · “${inv.reply}”` : ''}</div>
      </div>
      {inv.status === 'incoming' ? (
        <span className="row" style={{ gap: 6 }}>
          <button className="btn-outline" style={{ padding: '4px 10px' }} onClick={() => respondToInvite(inv.id, 'Accept')}>Accept</button>
        </span>
      ) : (
        <span className="row tiny" style={{ gap: 4, color: status.color, fontWeight: 600 }}>{status.icon}{status.text}</span>
      )}
    </div>
  );
}

// Set by BuddyOverlay so rows and banners can respond with access to the app store.
export let respondToInvite: (id: string, action: 'Accept' | 'Decline') => void = () => {};
export function setRespondHandler(fn: typeof respondToInvite) { respondToInvite = fn; }
