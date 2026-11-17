import { useStore } from '../../store';
import { todayHealth } from '../../data/health';
import { isOn } from '../../features';
import { feedbackStore, useFeedback } from '../feels-off/feedbackStore';
import { computeReadiness, LEVEL_COLOR, type Readiness, type ReadinessLevel } from './readiness';

// The "I feel…" answers in the Daily Readiness feedback sheet, and the level each one switches you to.
export const FELT_OPTIONS: { label: string; level: ReadinessLevel; color: string }[] = [
  { label: 'Ready to go hard', level: 'hard', color: LEVEL_COLOR.hard },
  { label: 'Okay, but want to take it light', level: 'light', color: LEVEL_COLOR.light },
  { label: 'I need to recover', level: 'recover', color: LEVEL_COLOR.recover },
];

export interface MyReadiness extends Readiness {
  garminLevel: ReadinessLevel;   // what Garmin worked out
  overridden: boolean;           // you said you feel different, so `level` is your answer
}

// Today's readiness as the rest of the app should use it: Garmin's suggestion, unless you told
// "Doesn't feel right?" you feel different, in which case your answer wins (card, buddies, alerts).
export function useMyReadiness(): MyReadiness {
  const { state } = useStore();
  useFeedback();   // re-render when feedback changes
  const r = computeReadiness(todayHealth, state.activities);
  const felt = isOn('feelsOff') ? FELT_OPTIONS.find(o => o.label === feedbackStore.get('readiness')?.felt)?.level : undefined;
  return { ...r, garminLevel: r.level, level: felt ?? r.level, overridden: !!felt && felt !== r.level };
}
