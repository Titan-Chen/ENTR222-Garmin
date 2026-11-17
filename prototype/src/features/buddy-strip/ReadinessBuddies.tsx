import { useState } from 'react';
import { Check, Clock, EyeOff } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../../phone/nav';
import { isOn } from '../../features';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { buddyStatuses } from './buddies';
import { friendLevel, bothReadyMatches } from './bothReady';
import { buddyStore, useBuddies } from './buddyStore';
import { InviteRow } from './BuddyStrip';
import { LEVEL_COLOR, LEVEL_LABEL, type ReadinessLevel } from '../readiness/readiness';

// NEW FEATURE (flags: workoutBuddies + bothReady), shown inside the Daily Readiness card.
// "Work out together": all your buddies in one row with their Go hard / Go light / Recover status.
// The best match (same answer as you) is picked first, but you can tap any buddy to invite them instead.
// Replaces the separate Workout Buddies card and the single "Peter is Go light too" prompt.
export function ReadinessBuddies({ level }: { level: ReadinessLevel }) {
  const { state } = useStore();
  const nav = useNav();
  const b = useBuddies();
  const buddies = b.buddies.filter(id => state.connections.includes(id) && buddyStatuses.some(s => s.personId === id));
  const matches = isOn('bothReady') ? bothReadyMatches(level, buddies, b.sharing) : [];

  // Order: matches first, then others who can work out, then anyone on Recover.
  const rank = (id: string) => (matches.includes(id) ? 0 : friendLevel(id) === 'recover' ? 2 : 1);
  const ordered = [...buddies].sort((x, y) => rank(x) - rank(y));
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked && ordered.includes(picked) ? picked : ordered[0];

  if (ordered.length === 0) return null;

  return (
    <div style={{ marginTop: 12, padding: '10px 12px 12px', borderRadius: 10, background: 'var(--gc-surface-2)' }}>
      <div className="between">
        <span className="small" style={{ fontWeight: 700 }}>Work out together</span>
        <button className="tiny" style={{ color: 'var(--gc-blue)', fontWeight: 600 }} onClick={() => nav.push('workoutBuddies')}>Edit</button>
      </div>

      <div role="radiogroup" aria-label="Choose a buddy" style={{ display: 'flex', gap: 4, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {ordered.map(id => {
          const p = personById(id);
          const lv = friendLevel(id)!;
          const on = id === selected;
          return (
            <button key={id} role="radio" aria-checked={on} onClick={() => setPicked(id)} aria-label={`${p.name}, ${LEVEL_LABEL[lv]}`}
              style={{ flex: '1 0 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 2px', borderRadius: 10,
                background: on ? 'rgba(17,169,237,.14)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1.5px var(--gc-blue)' : 'none',
                opacity: lv === 'recover' && !on ? 0.6 : 1 }}>
              <span style={{ position: 'relative', borderRadius: '50%', padding: 2, border: `2px solid ${LEVEL_COLOR[lv]}` }}>
                <Avatar person={p} size={32} />
                {matches.includes(id) && (
                  <span title="Same as you" style={{ position: 'absolute', right: -5, bottom: -3, width: 16, height: 16, borderRadius: 8, background: LEVEL_COLOR[lv], border: '2px solid var(--gc-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={9} color="#000" strokeWidth={3.5} />
                  </span>
                )}
                {b.cheered.includes(id) && (
                  <span style={{ position: 'absolute', left: -6, bottom: -4, fontSize: 11 }}>👏</span>
                )}
              </span>
              <span className="tiny" style={{ color: 'var(--gc-text)' }}>{p.name.split(' ')[0]}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: LEVEL_COLOR[lv] }}>{LEVEL_LABEL[lv]}</span>
            </button>
          );
        })}
      </div>

      <SelectedBuddy id={selected} myLevel={level} isMatch={matches.includes(selected)} />

      <div className="tiny" style={{ marginTop: 8, color: 'var(--gc-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {b.sharing
          ? <>Buddies can see you're <b style={{ color: LEVEL_COLOR[level] }}>{LEVEL_LABEL[level]}</b></>
          : <><EyeOff size={12} /> Your readiness is hidden from buddies</>}
      </div>

      {b.invites.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid var(--gc-separator)', paddingTop: 4 }}>
          {b.invites.map(inv => <InviteRow key={inv.id} inv={inv} />)}
        </div>
      )}
    </div>
  );
}

function SelectedBuddy({ id, myLevel, isMatch }: { id: string; myLevel: ReadinessLevel; isMatch: boolean }) {
  const b = useBuddies();
  const name = personById(id).name.split(' ')[0];
  const lv = friendLevel(id)!;
  const inv = b.invites.find(i => i.personId === id && i.direction === 'out');
  const cheered = b.cheered.includes(id);

  let line: React.ReactNode;
  if (inv?.status === 'sent') line = <span className="row" style={{ gap: 4, display: 'inline-flex' }}><Clock size={11} /> Invite sent · waiting for {name}</span>;
  else if (inv?.status === 'accepted') line = <span style={{ color: 'var(--gc-green)', fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}><Check size={12} /> {name} is in: {inv.activity}, {inv.when.label}</span>;
  else if (inv?.status === 'declined') line = `${name} can't make it this time`;
  else if (lv === 'recover') line = `${name} is recovering today. Send a cheer instead?`;
  else if (myLevel === 'recover') line = `You're recovering today. Invite ${name} to something easy, like a walk?`;
  else if (isMatch) line = `${name} is ${LEVEL_LABEL[myLevel]} too. Work out together today?`;
  else line = `${name} is ${LEVEL_LABEL[lv]}, you're ${LEVEL_LABEL[myLevel]}. Invite anyway?`;

  const canInvite = lv !== 'recover' && (!inv || inv.status === 'declined');
  return (
    <div className="row" style={{ marginTop: 10, gap: 10 }}>
      <div className="tiny" style={{ flex: 1, minWidth: 0, color: 'var(--gc-text)', lineHeight: 1.4 }}>{line}</div>
      {canInvite && (
        <button className="btn-outline" style={{ padding: '6px 14px', flex: 'none' }} onClick={() => buddyStore.openSheet('invite', id)}>Invite {name}</button>
      )}
      {lv === 'recover' && (
        <button className="btn-outline" style={{ padding: '6px 14px', flex: 'none' }} disabled={cheered} onClick={() => buddyStore.cheer(id)}>
          {cheered ? 'Cheered 👏' : 'Cheer'}
        </button>
      )}
    </div>
  );
}
