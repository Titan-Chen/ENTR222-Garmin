import { useState } from 'react';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../nav';
import { NavBar, Avatar, SportIcon, Sheet } from '../../components/common';
import { RouteMap } from '../../components/charts';
import { personById } from '../../data/people';
import { fmtDuration, relDay, timeOf } from '../../data/dates';
import { Slot } from '../../slots';

// News Feed tab: you + your connections' activities, newest first. Like + comment only.
export function FeedScreen() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [commentOn, setCommentOn] = useState<string | null>(null);
  const [text, setText] = useState('');
  const items = state.activities
    .filter(a => a.ownerId === 'me' || state.connections.includes(a.ownerId))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="screen">
      <NavBar title="News Feed" back={false} right={<button onClick={() => nav.push('addConnection')} aria-label="Find connections"><UserPlus size={22} /></button>} />
      <div className="scroll">
        <Slot name="social.top" />
        {items.map(a => {
          const p = personById(a.ownerId);
          const liked = a.likes.includes('me');
          return (
            <div key={a.id} style={{ background: 'var(--gc-surface)', marginTop: 10 }}>
              <div className="row" style={{ padding: '12px 16px' }}>
                <button onClick={() => p.id !== 'me' && nav.push('friend', { id: p.id })}><Avatar person={p} size={38} /></button>
                <div style={{ flex: 1 }}>
                  <button onClick={() => p.id !== 'me' && nav.push('friend', { id: p.id })} style={{ fontWeight: 600 }}>{p.id === 'me' ? p.name : p.name}</button>
                  <div className="tiny">{relDay(a.date)} @ {timeOf(a.date)}</div>
                </div>
              </div>
              <button style={{ width: '100%' }} onClick={() => nav.push('activity', { id: a.id })}>
                <div className="row" style={{ padding: '0 16px 10px' }}><SportIcon type={a.type} color="var(--gc-blue)" /><b>{a.title}</b></div>
                <div className="grid-3" style={{ padding: '0 16px 12px' }}>
                  {a.distanceMi !== undefined
                    ? <div><div style={{ fontWeight: 600 }}>{a.distanceMi.toFixed(2)} mi</div><div className="tiny">Distance</div></div>
                    : <div><div style={{ fontWeight: 600 }}>{a.calories}</div><div className="tiny">Calories</div></div>}
                  <div><div style={{ fontWeight: 600 }}>{fmtDuration(a.durationSec)}</div><div className="tiny">Time</div></div>
                  <div><div style={{ fontWeight: 600 }}>{a.avgPace ?? (a.avgSpeedMph ? `${a.avgSpeedMph} mph` : `${a.avgHr} bpm`)}</div><div className="tiny">{a.avgPace ? 'Avg Pace' : a.avgSpeedMph ? 'Avg Speed' : 'Avg HR'}</div></div>
                </div>
                {a.route && <RouteMap route={a.route} height={140} />}
              </button>
              <div className="row" style={{ padding: '10px 16px', gap: 22, color: 'var(--gc-text-2)' }}>
                <button className="row" style={{ gap: 6, color: liked ? 'var(--gc-blue)' : undefined }} onClick={() => dispatch({ type: 'like', activityId: a.id })}>
                  <Heart size={18} fill={liked ? 'currentColor' : 'none'} /><span className="small">{a.likes.length || ''} Like</span>
                </button>
                <button className="row" style={{ gap: 6 }} onClick={() => setCommentOn(a.id)}><MessageCircle size={18} /><span className="small">{a.comments.length || ''} Comment</span></button>
              </div>
            </div>
          );
        })}
      </div>
      {commentOn && (
        <Sheet onClose={() => setCommentOn(null)}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Comment</div>
          <textarea className="text-input" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment…" autoFocus />
          <button className="btn-primary" style={{ marginTop: 12 }} disabled={!text.trim()} onClick={() => { dispatch({ type: 'comment', activityId: commentOn, text: text.trim() }); setText(''); setCommentOn(null); dispatch({ type: 'toast', text: 'Comment posted' }); }}>Post</button>
        </Sheet>
      )}
    </div>
  );
}
