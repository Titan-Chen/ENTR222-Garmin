import type { DayHealth } from './types';
import { daysAgo, isoDate } from './dates';

// 14 days of Alex's health history, index 0 = 13 days ago, last = today.
// Hand-tuned so the story matches the interviews: a late night midweek,
// stress that reads "medium" on a day he felt fine, HRV mostly balanced.
const raw: Array<[
  steps: number, sleepScore: number, sleepMin: number, deep: number, rem: number, awake: number,
  bbHigh: number, bbLow: number, stress: number, rhr: number, hrv: number, intensity: number,
  activeCal: number, readiness: number, bed: string, wake: string,
]> = [
  [ 9120, 78, 452, 82, 96, 14, 82, 18, 31, 54, 68, 52, 610, 71, '12:12 AM', '7:44 AM'],
  [11840, 83, 471, 91, 104, 11, 88, 15, 28, 53, 71, 74, 780, 78, '11:58 PM', '7:49 AM'],
  [ 6420, 61, 368, 58, 70, 22, 64, 9, 41, 57, 59, 18, 380, 49, '1:47 AM', '8:01 AM'],
  [ 8015, 72, 431, 74, 88, 17, 76, 14, 36, 55, 63, 45, 540, 62, '12:30 AM', '7:41 AM'],
  [12650, 85, 482, 96, 112, 9, 91, 21, 25, 52, 74, 88, 860, 82, '11:40 PM', '7:42 AM'],
  [14210, 80, 466, 88, 99, 13, 86, 12, 27, 53, 72, 96, 940, 76, '12:05 AM', '7:51 AM'],
  [ 5980, 69, 498, 79, 101, 26, 79, 20, 22, 54, 70, 10, 310, 70, '1:02 AM', '9:40 AM'],
  [ 7310, 74, 440, 77, 92, 15, 80, 16, 33, 55, 66, 38, 495, 66, '12:22 AM', '7:42 AM'],
  [10480, 81, 463, 90, 101, 12, 87, 17, 30, 53, 70, 64, 720, 77, '11:55 PM', '7:38 AM'],
  [ 6890, 58, 352, 51, 66, 25, 61, 8, 45, 58, 57, 22, 405, 44, '2:04 AM', '8:06 AM'],
  [ 9760, 70, 425, 72, 85, 18, 74, 13, 38, 56, 62, 56, 650, 58, '12:41 AM', '7:46 AM'],
  [13120, 84, 476, 94, 108, 10, 90, 19, 26, 52, 73, 82, 890, 80, '11:47 PM', '7:43 AM'],
  [ 8340, 77, 449, 83, 95, 14, 84, 22, 34, 54, 67, 41, 560, 69, '12:18 AM', '7:47 AM'],
  [ 4212, 79, 458, 86, 97, 12, 85, 61, 32, 53, 69, 12, 168, 72, '12:09 AM', '7:47 AM'],
];

function quality(score: number): DayHealth['sleepQuality'] {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}

export const healthHistory: DayHealth[] = raw.map((r, i) => {
  const [steps, sleepScore, sleepMin, deep, rem, awake, bbHigh, bbLow, stress, rhr, hrv, intensity, activeCal, readiness, bed, wake] = r;
  const light = sleepMin - deep - rem;
  return {
    date: isoDate(daysAgo(13 - i)),
    steps,
    stepGoal: 9000,
    sleepScore,
    sleepQuality: quality(sleepScore),
    sleepSec: sleepMin * 60,
    sleepStagesMin: { deep, light, rem, awake },
    bedtime: bed,
    wake,
    bodyBatteryHigh: bbHigh,
    bodyBatteryLow: bbLow,
    bodyBatteryCharged: bbHigh - bbLow + 8,
    bodyBatteryDrained: bbHigh - bbLow,
    stressAvg: stress,
    restingHr: rhr,
    hrvOvernight: hrv,
    hrvStatus: hrv >= 62 ? 'Balanced' : 'Unbalanced',
    intensityMin: intensity,
    activeCalories: activeCal,
    restingCalories: 1890,
    trainingReadiness: readiness,
    floorsClimbed: Math.round(steps / 1200),
  };
});

export const todayHealth = healthHistory[healthHistory.length - 1];

// Intraday series for "today" detail charts (every 15 min from midnight to now-ish).
export function intradaySeries(kind: 'stress' | 'bodyBattery' | 'hr', points = 64): number[] {
  const out: number[] = [];
  let seed = kind === 'stress' ? 7 : kind === 'hr' ? 13 : 3;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < points; i++) {
    const t = i / points;
    if (kind === 'stress') {
      const asleep = t < 0.33;
      out.push(Math.round(asleep ? 8 + rnd() * 14 : 22 + rnd() * 45 + (t > 0.55 && t < 0.62 ? 25 : 0)));
    } else if (kind === 'bodyBattery') {
      out.push(Math.round(t < 0.33 ? 22 + (t / 0.33) * 63 : 85 - (t - 0.33) * 40 - rnd() * 3));
    } else {
      out.push(Math.round(t < 0.33 ? 50 + rnd() * 8 : 62 + rnd() * 30 + (t > 0.5 && t < 0.56 ? 60 : 0)));
    }
  }
  return out;
}

// Weekly intensity minutes goal (current app: 150/week).
export const weeklyIntensityGoal = 150;
