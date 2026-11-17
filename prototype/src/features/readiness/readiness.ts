import type { Activity, DayHealth } from '../../data/types';
import { isoDate, daysAgo, fmtHrMin } from '../../data/dates';

// DAILY READINESS: "Go hard / Go light / Recover" (PRD P0, Theme 1).
// A simple, explainable weighted formula on data the watch already collects.
// It's a stand-in for a real algorithm; the weights are easy to tune here.

export type ReadinessLevel = 'hard' | 'light' | 'recover';

// Shared labels + colors (also used by the Friends Today strip so wording matches everywhere).
export const LEVEL_LABEL: Record<ReadinessLevel, string> = { hard: 'Go hard', light: 'Go light', recover: 'Recover' };
export const LEVEL_COLOR: Record<ReadinessLevel, string> = { hard: '#f04e4e', light: '#f5b83d', recover: '#3ddc97' };
export const LEVEL_SUGGESTION: Record<ReadinessLevel, string> = {
  hard: "You're well recovered. Good day for a heavy lift, intervals or a long run.",
  light: 'Keep it easy today: a light lift, easy run, ride or mobility work.',
  recover: 'Your body needs to recover. Try stretching, a walk or a full rest day.',
};

export interface Factor {
  name: string;
  value: string;        // what we show, e.g. "7h 38m · Score 79"
  rating: 'Good' | 'Fair' | 'Low';
  score: number;        // 0–100, this factor's sub-score
  weight: number;       // share of the total
}

export interface Readiness {
  level: ReadinessLevel;
  confidence: 'High' | 'Moderate' | 'Low';
  confidenceNote: string;
  score: number;        // 0–100 (kept internal; the card shows the plain answer)
  reason: string;       // one line, e.g. "Slept 7h 38m, HRV balanced, lifted yesterday"
  factors: Factor[];
}

const rate = (s: number): Factor['rating'] => (s >= 75 ? 'Good' : s >= 50 ? 'Fair' : 'Low');

// "Recent activity" = how hard you trained in the last ~36 hours. Lifting and pickup games count
// (the current app mostly ignores them for readiness — Ethan's pain point).
function recentLoad(activities: Activity[]): { score: number; label: string; phrase: string | null } {
  const yesterday = isoDate(daysAgo(1));
  const today = isoDate(daysAgo(0));
  const recent = activities
    .filter(a => a.ownerId === 'me')
    .filter(a => { const d = isoDate(new Date(a.date)); return d === yesterday || d === today; })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  if (recent.length === 0) return { score: 90, label: 'Rest day yesterday', phrase: 'rested yesterday' };
  const a = recent[0];
  const effort = (a.trainingEffect?.aerobic ?? 1) + (a.trainingEffect?.anaerobic ?? 0);
  const mins = Math.round(a.durationSec / 60);
  const when = isoDate(new Date(a.date)) === today ? 'today' : 'yesterday';
  const verb = a.type === 'strength' ? 'lifted' : a.type === 'basketball' || a.type === 'football' ? 'played pickup' : a.type === 'bike' ? 'rode' : a.type === 'walk' ? 'walked' : 'ran';
  // Strength/team sports add muscular load the HR-based effort undercounts.
  const extra = a.type === 'strength' || a.type === 'basketball' || a.type === 'football' ? 1.5 : 0;
  const score = Math.max(20, Math.min(95, 100 - (effort + extra) * 9 - mins * 0.1));
  const name = a.type === 'strength' ? 'Strength' : a.title.replace('Houston ', '');
  return { score: Math.round(score), label: `${name} ${when} · ${mins} min`, phrase: `${verb} ${when}` };
}

export function computeReadiness(day: DayHealth, activities: Activity[]): Readiness {
  const sleepS = day.sleepScore;
  const hrvS = day.hrvStatus === 'Balanced' ? 85 : day.hrvStatus === 'Unbalanced' ? 55 : 30;
  const bbS = day.bodyBatteryHigh;                // morning Body Battery
  const stressS = Math.max(0, 100 - day.stressAvg * 1.2);
  const load = recentLoad(activities);

  const factors: Factor[] = [
    { name: 'Sleep', value: `${fmtHrMin(day.sleepSec)} · Score ${day.sleepScore}`, rating: rate(sleepS), score: sleepS, weight: 0.3 },
    { name: 'Body Battery', value: `${day.bodyBatteryHigh} when you woke up`, rating: rate(bbS), score: bbS, weight: 0.25 },
    { name: 'HRV Status', value: `${day.hrvStatus} · ${day.hrvOvernight} ms`, rating: rate(hrvS), score: hrvS, weight: 0.2 },
    { name: 'Recent Activity', value: load.label, rating: rate(load.score), score: load.score, weight: 0.15 },
    { name: 'Stress', value: `Avg ${day.stressAvg} yesterday`, rating: rate(stressS), score: Math.round(stressS), weight: 0.1 },
  ];
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));

  // Safety rules first (same as the friends rule): very poor sleep or a drained battery → Recover.
  let level: ReadinessLevel;
  if (day.sleepScore < 50 || day.bodyBatteryHigh < 35 || score < 50) level = 'recover';
  else if (score >= 78) level = 'hard';
  else level = 'light';

  const parts = [
    `Slept ${fmtHrMin(day.sleepSec)}`,
    `HRV ${day.hrvStatus.toLowerCase()}`,
    load.phrase,
  ].filter(Boolean);
  // Confidence: how far the score is from the nearest cut-off (50 = Recover/Go light, 78 = Go light/Go hard).
  const forced = day.sleepScore < 50 || day.bodyBatteryHigh < 35;
  const dist = forced ? 99 : Math.min(Math.abs(score - 50), Math.abs(score - 78));
  const confidence: Readiness['confidence'] = dist >= 8 ? 'High' : dist >= 3 ? 'Moderate' : 'Low';
  const neighbour = level === 'light' ? (Math.abs(score - 78) < Math.abs(score - 50) ? 'Go hard' : 'Recover') : 'Go light';
  const confidenceNote = confidence === 'High'
    ? 'Your data points clearly to this answer.'
    : `Your readiness score (${score}) is close to the line for ${neighbour}, so this could go either way. Trust how you feel.`;
  return { level, confidence, confidenceNote, score, reason: parts.join(', '), factors };
}
