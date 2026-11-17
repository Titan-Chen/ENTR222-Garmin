import { useState } from 'react';
import { ChevronDown, ChevronUp, Flame, Footprints, BedDouble } from 'lucide-react';
import { useStore } from '../../store';
import { todayHealth } from '../../data/health';
import { computeReadiness, LEVEL_COLOR, LEVEL_LABEL, LEVEL_SUGGESTION, type ReadinessLevel } from './readiness';
import { isOn } from '../../features';
import { FeelsOffButton, FeelsOffSheet, FlagNote } from '../feels-off/FeelsOffSheet';
import { useFeedback } from '../feels-off/feedbackStore';

// NEW FEATURE (flag: dailyReadiness, slot: home.top)
// One card at the top of Home with a plain answer for today (Go hard / Go light / Recover)
// and a one-line reason. Tap "Why?" to see the factors behind it. Styled like the app's other cards.

const ICON: Record<ReadinessLevel, React.ComponentType<any>> = { hard: Flame, light: Footprints, recover: BedDouble };

export function ReadinessCard() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const fb = useFeedback();
  const showFeelsOff = isOn('feelsOff');   // confidence + "Doesn't feel right?" (feelsOff flag)
  const r = computeReadiness(todayHealth, state.activities);
  const flagged = fb.get('readiness');
  const confColor = r.confidence === 'High' ? 'var(--gc-green)' : r.confidence === 'Moderate' ? '#f5b83d' : '#ff8a3d';
  const color = LEVEL_COLOR[r.level];
  const Icon = ICON[r.level];

  return (
    <>
      <div className="section-title">Daily Readiness</div>
      <div className="pad">
        <div className="card">
          <div className="row" style={{ alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Icon size={24} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="between">
                <span className="tiny">Today's suggestion</span>
                {showFeelsOff && <span className="chip" style={{ color: confColor, background: 'rgba(255,255,255,.06)' }}>{r.confidence} confidence</span>}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.15 }}>{LEVEL_LABEL[r.level]}</div>
            </div>
          </div>
          <div className="small" style={{ marginTop: 10 }}>{r.reason}.</div>
          <div className="small muted" style={{ marginTop: 4 }}>{LEVEL_SUGGESTION[r.level]}</div>
          {showFeelsOff && flagged && <FlagNote text={`You said: ${flagged.felt}${flagged.reasons.length ? ` · ${flagged.reasons.join(', ')}` : ''}`} />}

          <button onClick={() => setOpen(o => !o)} className="row" aria-expanded={open}
            style={{ marginTop: 12, width: '100%', justifyContent: 'center', gap: 4, color: 'var(--gc-blue)', fontSize: 13, fontWeight: 600, paddingTop: 10, borderTop: '1px solid var(--gc-separator)' }}>
            {open ? 'Hide' : 'Why?'} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {open && (
            <div style={{ marginTop: 6 }}>
              {showFeelsOff && (
                <div className="tiny" style={{ padding: '6px 0 8px', lineHeight: 1.45, borderBottom: '1px solid var(--gc-separator)' }}>
                  <b style={{ color: confColor }}>{r.confidence} confidence.</b> {r.confidenceNote}
                </div>
              )}
              {r.factors.map(f => (
                <div key={f.name} className="between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gc-separator)' }}>
                  <div>
                    <div className="small">{f.name}</div>
                    <div className="tiny">{f.value}</div>
                  </div>
                  <span className="small" style={{ fontWeight: 600, color: f.rating === 'Good' ? 'var(--gc-green)' : f.rating === 'Fair' ? '#f5b83d' : 'var(--gc-red)' }}>{f.rating}</span>
                </div>
              ))}
              <div className="tiny" style={{ marginTop: 10, lineHeight: 1.45 }}>
                Based on data your watch already collects, including strength and pickup games. This is general wellness guidance, not medical advice.
              </div>
            </div>
          )}

          {showFeelsOff && <FeelsOffButton flagged={!!flagged} onClick={() => setSheet(true)} />}
        </div>
      </div>
      {sheet && (
        <FeelsOffSheet
          target="readiness"
          title="How do you actually feel today?"
          measured={`Garmin suggested ${LEVEL_LABEL[r.level]} (${r.confidence.toLowerCase()} confidence)`}
          options={[
            { label: 'Ready to go hard', color: LEVEL_COLOR.hard },
            { label: 'Okay, but want to take it light', color: LEVEL_COLOR.light },
            { label: 'I need to recover', color: LEVEL_COLOR.recover },
          ]}
          reasons={['Sore muscles', 'Slept badly', 'Stressed', 'Feeling sick', 'Feel great', 'Busy day']}
          onClose={() => setSheet(false)}
        />
      )}
    </>
  );
}
