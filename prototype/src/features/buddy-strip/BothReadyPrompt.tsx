import { Check, Clock } from 'lucide-react';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { bothReadyMatches } from './bothReady';
import { buddyStore, useBuddies } from './buddyStore';
import { LEVEL_COLOR, LEVEL_LABEL, type ReadinessLevel } from '../readiness/readiness';

// NEW FEATURE (flag: bothReady): shown inside the Daily Readiness card.
// "Peter is Go light too · Invite": a one-tap path from your answer to working out together.
export function BothReadyPrompt({ level }: { level: ReadinessLevel }) {
  const b = useBuddies();
  const matches = bothReadyMatches(level, b.buddies, b.sharing);
  if (matches.length === 0) return null;
  const id = matches[0];
  const p = personById(id);
  const name = p.name.split(' ')[0];
  const others = matches.length - 1;
  const inv = b.invites.find(i => i.personId === id && i.direction === 'out');

  return (
    <div className="row" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--gc-surface-2)', gap: 10 }}>
      <span style={{ borderRadius: '50%', padding: 2, border: `2px solid ${LEVEL_COLOR[level]}` }}><Avatar person={p} size={28} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="small" style={{ fontWeight: 600 }}>{name}{others > 0 ? ` and ${others} other${others > 1 ? 's' : ''}` : ''} {others > 0 ? 'are' : 'is'} {LEVEL_LABEL[level]} too</div>
        <div className="tiny">
          {!inv && 'Both ready: work out together today?'}
          {inv?.status === 'sent' && <span className="row" style={{ gap: 4, display: 'inline-flex' }}><Clock size={11} /> Invite sent · waiting for {name}</span>}
          {inv?.status === 'accepted' && <span style={{ color: 'var(--gc-green)', fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}><Check size={12} /> {name} is in: {inv.activity}, {inv.when.label}</span>}
          {inv?.status === 'declined' && `${name} can't make it this time`}
        </div>
      </div>
      {(!inv || inv.status === 'declined') && (
        <button className="btn-outline" style={{ padding: '6px 14px' }} onClick={() => buddyStore.openSheet('invite', id)}>Invite</button>
      )}
    </div>
  );
}
