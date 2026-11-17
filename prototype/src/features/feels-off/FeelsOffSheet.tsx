import { useState } from 'react';
import { Check, Flag } from 'lucide-react';
import { Sheet } from '../../components/common';
import { feedbackStore, LEARN_GOAL, useFeedback, type Target } from './feedbackStore';

// "Doesn't feel right?" sheet, carried over from the team's stress-feedback prototype:
// pick how you actually feel → optional reasons + note → thank-you with personalization progress.

export interface FeltOption { label: string; color: string }

export function FeelsOffSheet({ target, title, measured, options, reasons, onClose }: {
  target: Target;
  title: string;             // "How do you actually feel?"
  measured: string;          // "Garmin measured Low (32) today"
  options: FeltOption[];
  reasons: string[];
  onClose: () => void;
}) {
  useFeedback();
  const prev = feedbackStore.get(target);
  const [felt, setFelt] = useState<string | null>(prev?.felt ?? null);
  const [picked, setPicked] = useState<string[]>(prev?.reasons ?? []);
  const [note, setNote] = useState(prev?.note ?? '');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!felt) return;
    feedbackStore.add({ target, measured, felt, reasons: picked, note: note.trim(), at: new Date().toISOString() });
    setSent(true);
  };
  const count = Math.min(feedbackStore.count(), LEARN_GOAL);

  return (
    <Sheet onClose={onClose}>
      {!sent ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
          <div className="small muted" style={{ marginTop: 4 }}>{measured}</div>

          <div className="small" style={{ fontWeight: 600, margin: '16px 0 8px' }}>I feel…</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map(o => (
              <button key={o.label} onClick={() => setFelt(o.label)} className="row"
                style={{ padding: '10px 12px', borderRadius: 10, gap: 10, background: felt === o.label ? 'var(--gc-surface-3)' : 'var(--gc-surface-2)', border: `1px solid ${felt === o.label ? 'var(--gc-blue)' : 'transparent'}` }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: o.color, flex: 'none' }} />
                <span className="small" style={{ flex: 1 }}>{o.label}</span>
                {felt === o.label && <Check size={16} color="var(--gc-blue)" />}
              </button>
            ))}
          </div>

          <div className="small" style={{ fontWeight: 600, margin: '16px 0 8px' }}>What might explain the difference? <span className="tiny">Optional</span></div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {reasons.map(r => {
              const on = picked.includes(r);
              return (
                <button key={r} className="chip" onClick={() => setPicked(on ? picked.filter(x => x !== r) : [...picked, r])}
                  style={{ padding: '6px 10px', background: on ? 'var(--gc-blue)' : undefined, color: on ? '#fff' : undefined }}>{r}</button>
              );
            })}
          </div>

          <div className="small" style={{ fontWeight: 600, margin: '16px 0 8px' }}>Anything else? <span className="tiny">Optional</span></div>
          <textarea className="text-input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. I was laughing with friends" />

          <button className="btn-primary" style={{ marginTop: 16 }} disabled={!felt} onClick={send}>Send feedback</button>
          <button style={{ width: '100%', textAlign: 'center', marginTop: 12, color: 'var(--gc-blue)', fontSize: 15 }} onClick={onClose}>Cancel</button>
        </>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(48,199,123,.15)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={28} color="var(--gc-green)" /></div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>Thanks, got it</div>
          <div className="small muted" style={{ marginTop: 6, lineHeight: 1.45 }}>
            We'll use this to tune how your {target === 'stress' ? 'stress readings' : 'readiness suggestions'} are worked out for you.
          </div>
          <div style={{ height: 8, background: 'var(--gc-surface-3)', borderRadius: 4, margin: '16px 0 8px' }}>
            <div style={{ height: '100%', width: `${(count / LEARN_GOAL) * 100}%`, background: 'var(--gc-blue)', borderRadius: 4, transition: 'width .4s' }} />
          </div>
          <div className="tiny">{count >= LEARN_GOAL ? 'Your readings are now personalized to you.' : `${count} of ${LEARN_GOAL} check-ins until your readings are personalized.`}</div>
          <button className="btn-primary" style={{ marginTop: 18 }} onClick={onClose}>Done</button>
        </div>
      )}
    </Sheet>
  );
}

// Row button that opens the sheet (matches the app's list-row style).
export function FeelsOffButton({ flagged, onClick }: { flagged: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="row" style={{ width: '100%', gap: 10, padding: '10px 0 0', marginTop: 12, borderTop: '1px solid var(--gc-separator)' }}>
      <Flag size={16} color="var(--gc-blue)" />
      <span style={{ flex: 1, textAlign: 'left' }}>
        <span className="small" style={{ color: 'var(--gc-blue)', fontWeight: 600 }}>{flagged ? 'Edit your feedback' : "Doesn't feel right?"}</span>
        <span className="tiny" style={{ display: 'block' }}>{flagged ? 'Change how you said you felt' : 'Tell us how you actually feel so Garmin can learn'}</span>
      </span>
    </button>
  );
}

export function FlagNote({ text }: { text: string }) {
  return (
    <div className="tiny" style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(17,169,237,.1)', color: '#bfe6fa' }}>⚑ {text}</div>
  );
}
