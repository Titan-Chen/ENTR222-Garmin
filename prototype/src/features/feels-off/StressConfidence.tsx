import { useState } from 'react';
import { todayHealth } from '../../data/health';
import { FeelsOffButton, FeelsOffSheet, FlagNote } from './FeelsOffSheet';
import { SPREAD, useFeedback, type Confidence } from './feedbackStore';

// NEW FEATURE (flag: feelsOff, slot: metric.stress)
// Under the Stress reading: likely range + confidence tag, and a "Doesn't feel right?" button.
// Carried over from the team's stress-feedback prototype (repo root).

const LEVELS = [
  { name: 'Rest', max: 25, color: 'var(--m-stress-rest)' },
  { name: 'Low', max: 50, color: 'var(--m-stress-low)' },
  { name: 'Medium', max: 75, color: 'var(--m-stress-med)' },
  { name: 'High', max: 100, color: 'var(--m-stress-high)' },
];
const levelOf = (v: number) => LEVELS.find(l => v <= l.max)!;

export function StressConfidence() {
  const fb = useFeedback();
  const [open, setOpen] = useState(false);
  const value = todayHealth.stressAvg;
  // Daytime average with some movement in it → moderate confidence.
  const confidence: Confidence = 'Moderate';
  const low = Math.max(0, value - SPREAD[confidence]);
  const high = Math.min(100, value + SPREAD[confidence]);
  const lowL = levelOf(low).name, highL = levelOf(high).name;
  const flagged = fb.get('stress');

  return (
    <div style={{ marginTop: 14 }}>
      <div className="between small">
        <span>Likely range <b>{low}–{high}</b></span>
        <span className="chip" style={{ color: '#f5b83d', background: 'rgba(245,184,61,.14)' }}>{confidence} confidence</span>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 5, marginTop: 8, background: 'linear-gradient(90deg, var(--m-stress-rest) 0 25%, var(--m-stress-low) 25% 50%, var(--m-stress-med) 50% 75%, var(--m-stress-high) 75% 100%)', opacity: 0.35 }} />
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', top: -10, left: `${low}%`, width: `${high - low}%`, height: 10, borderRadius: 5, border: '2px solid #fff', boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', top: -13, left: `calc(${value}% - 8px)`, width: 16, height: 16, borderRadius: 8, background: '#fff', border: '3px solid var(--gc-surface)' }} />
      </div>
      <div className="between tiny" style={{ marginTop: 6 }}><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      <div className="tiny" style={{ marginTop: 8, lineHeight: 1.45 }}>
        Based on your daytime readings. You moved around a lot, which makes stress harder to read.
        {lowL !== highL && ` The range covers both ${lowL} and ${highL}, so it could be either.`}
      </div>

      {flagged && <FlagNote text={`You said you felt ${flagged.felt.toLowerCase()}${flagged.reasons.length ? ` · ${flagged.reasons.join(', ')}` : ''}`} />}
      <FeelsOffButton flagged={!!flagged} onClick={() => setOpen(true)} />

      {open && (
        <FeelsOffSheet
          target="stress"
          title="How do you actually feel?"
          measured={`Garmin measured ${levelOf(value).name} (${value}) today`}
          options={[
            { label: 'Calm / resting', color: 'var(--m-stress-rest)' },
            { label: 'Fine / a little stressed', color: 'var(--m-stress-low)' },
            { label: 'Moderately stressed', color: 'var(--m-stress-med)' },
            { label: 'Very stressed', color: 'var(--m-stress-high)' },
          ]}
          reasons={['Just exercised', 'Caffeine', 'Excited / happy', 'Feeling sick', 'Alcohol', 'Slept badly', 'Watch was loose']}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
