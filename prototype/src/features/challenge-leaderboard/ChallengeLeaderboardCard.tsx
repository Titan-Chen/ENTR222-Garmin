import { ChevronRight } from 'lucide-react';
import { Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { shortDate, today } from '../../data/dates';
import type { Challenge } from '../../data/types';

// Larger active-challenge card for the Challenges tab: every friend's rank, name,
// progress bar and total at a glance, plus where you stand against the person ahead.
// Replaces the baseline card (rank + initials only) when the `challengeLeaderboard` flag is on.

const MAX_ROWS = 5;

function unit(c: Challenge, n: number): string {
  return c.kind === 'distance' ? `${n.toLocaleString()} mi` : `${n.toLocaleString()} steps`;
}

function firstName(personId: string): string {
  return personId === 'me' ? 'You' : personById(personId).name.split(' ')[0];
}

export function ChallengeLeaderboardCard({ c, onClick }: { c: Challenge; onClick: () => void }) {
  const sorted = [...c.participants].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map(p => p.value), 1);
  const myIndex = sorted.findIndex(p => p.personId === 'me');
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysLeft = Math.max(0, Math.round((dayStart(new Date(c.endDate)) - dayStart(today)) / 86_400_000));

  let standing = '';
  if (myIndex === 0 && sorted.length > 1) {
    standing = `You're in the lead by ${unit(c, sorted[0].value - sorted[1].value)}`;
  } else if (myIndex > 0) {
    const ahead = sorted[myIndex - 1];
    standing = `You're #${myIndex + 1} · ${unit(c, ahead.value - sorted[myIndex].value)} behind ${firstName(ahead.personId)}`;
  }

  const shown = sorted.slice(0, MAX_ROWS);
  // Always show your own row, even if you're outside the top rows.
  if (myIndex >= MAX_ROWS) shown[MAX_ROWS - 1] = sorted[myIndex];

  return (
    <button className="card cl-card" onClick={onClick}>
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="cl-title">{c.title}</div>
          <div className="tiny" style={{ marginTop: 2 }}>
            {c.kind === 'distance' ? 'Distance' : 'Steps'} · Ends {shortDate(c.endDate)} · {daysLeft === 0 ? 'Last day' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
          </div>
        </div>
      </div>

      {standing && <div className="cl-standing">{standing}</div>}

      <div className="cl-rows">
        {shown.map(p => {
          const rank = sorted.indexOf(p) + 1;
          const isMe = p.personId === 'me';
          return (
            <div key={p.personId} className={`cl-row${isMe ? ' me' : ''}`}>
              <span className={`cl-rank${rank === 1 ? ' first' : ''}`}>{rank}</span>
              <Avatar person={personById(p.personId)} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="between">
                  <span className="cl-name">{firstName(p.personId)}</span>
                  <span className="cl-value">{p.value.toLocaleString()}</span>
                </div>
                <div className="cl-bar">
                  <div style={{ width: `${(p.value / max) * 100}%`, background: isMe ? 'var(--gc-blue)' : personById(p.personId).color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cl-more">
        {sorted.length > shown.length ? `See all ${sorted.length}` : 'See leaderboard'} <ChevronRight size={16} />
      </div>
    </button>
  );
}
