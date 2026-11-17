import type { Activity } from './types';
import { daysAgo } from './dates';

const loop = (n: number, wobble = 0.08): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / (n - 1)) * Math.PI * 2;
    return [0.5 + Math.cos(a) * (0.32 + Math.sin(a * 3) * wobble), 0.5 + Math.sin(a) * (0.26 + Math.cos(a * 2) * wobble)];
  });

const outAndBack = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const x = t < 0.5 ? 0.12 + t * 1.5 : 0.87 - (t - 0.5) * 1.5;
    return [x, 0.5 + Math.sin(x * 9) * 0.12 + (t < 0.5 ? -0.02 : 0.02)];
  });

// Activities for Alex ('me') and his connections.
// Note the strength + basketball entries: the current app summarizes them like cardio
// (time, HR, calories, training effect) with little lifting-specific detail — a pain point from the Ethan interview.
export const seedActivities: Activity[] = [
  {
    id: 'a1', ownerId: 'me', type: 'strength', title: 'Strength', date: daysAgo(1, 17, 30).toISOString(),
    durationSec: 3480, avgHr: 112, maxHr: 158, calories: 312,
    trainingEffect: { aerobic: 1.6, anaerobic: 0.8, label: 'Recovery' },
    hrZonesMin: [24, 22, 9, 3, 0], sets: undefined, reps: undefined,
    likes: ['ethan'], comments: [], device: 'Forerunner 265',
  },
  {
    id: 'a2', ownerId: 'me', type: 'basketball', title: 'Basketball', date: daysAgo(2, 20, 15).toISOString(),
    durationSec: 4020, avgHr: 141, maxHr: 182, calories: 618,
    trainingEffect: { aerobic: 3.2, anaerobic: 2.4, label: 'Tempo' },
    hrZonesMin: [6, 14, 21, 18, 8], likes: ['peter', 'ethan'],
    comments: [{ personId: 'peter', text: 'Good runs tonight 🏀' }], device: 'Forerunner 265',
  },
  {
    id: 'a3', ownerId: 'me', type: 'run', title: 'Houston Running', date: daysAgo(3, 7, 10).toISOString(),
    durationSec: 1862, distanceMi: 3.42, avgPace: '9:05 /mi', elevGainFt: 39, avgHr: 156, maxHr: 174, calories: 402,
    trainingEffect: { aerobic: 3.0, anaerobic: 0.4, label: 'Base' },
    hrZonesMin: [1, 4, 12, 13, 1],
    splits: [
      { label: '1', time: '9:12', pace: '9:12 /mi', avgHr: 149 },
      { label: '2', time: '9:03', pace: '9:03 /mi', avgHr: 157 },
      { label: '3', time: '8:58', pace: '8:58 /mi', avgHr: 161 },
      { label: '0.42', time: '3:49', pace: '9:05 /mi', avgHr: 163 },
    ],
    route: loop(60), likes: ['galen'], comments: [], device: 'Forerunner 265',
  },
  {
    id: 'a4', ownerId: 'me', type: 'strength', title: 'Strength', date: daysAgo(4, 16, 45).toISOString(),
    durationSec: 3120, avgHr: 108, maxHr: 151, calories: 276,
    trainingEffect: { aerobic: 1.4, anaerobic: 0.6, label: 'Recovery' },
    hrZonesMin: [26, 18, 6, 2, 0], likes: [], comments: [], device: 'Forerunner 265',
  },
  {
    id: 'a5', ownerId: 'me', type: 'walk', title: 'Walk', date: daysAgo(6, 13, 5).toISOString(),
    durationSec: 1510, distanceMi: 1.18, avgPace: '21:20 /mi', avgHr: 92, maxHr: 104, calories: 118,
    hrZonesMin: [20, 4, 0, 0, 0], route: outAndBack(40), likes: [], comments: [], device: 'Forerunner 265',
  },
  // Friends
  {
    id: 'f1', ownerId: 'galen', type: 'bike', title: 'Houston Cycling', date: daysAgo(0, 6, 40).toISOString(),
    durationSec: 6120, distanceMi: 31.6, avgSpeedMph: 18.6, elevGainFt: 210, avgHr: 142, maxHr: 171, calories: 1104,
    trainingEffect: { aerobic: 3.8, anaerobic: 1.1, label: 'Tempo' },
    hrZonesMin: [8, 22, 41, 26, 5], route: loop(80, 0.14), likes: ['peter'], comments: [], device: 'Forerunner 255',
  },
  {
    id: 'f2', ownerId: 'ethan', type: 'strength', title: 'Strength', date: daysAgo(1, 15, 20).toISOString(),
    durationSec: 3900, avgHr: 118, maxHr: 162, calories: 355,
    trainingEffect: { aerobic: 1.8, anaerobic: 1.0, label: 'Recovery' },
    hrZonesMin: [22, 26, 12, 4, 1], likes: ['me'], comments: [], device: 'Forerunner 245',
  },
  {
    id: 'f3', ownerId: 'peter', type: 'basketball', title: 'Basketball', date: daysAgo(2, 20, 10).toISOString(),
    durationSec: 4200, avgHr: 146, maxHr: 186, calories: 702,
    trainingEffect: { aerobic: 3.4, anaerobic: 2.7, label: 'Anaerobic' },
    hrZonesMin: [4, 12, 22, 21, 11], likes: ['me'], comments: [], device: 'Forerunner 55',
  },
  {
    id: 'f4', ownerId: 'joe', type: 'walk', title: 'Dallas Walking', date: daysAgo(3, 12, 15).toISOString(),
    durationSec: 2460, distanceMi: 2.05, avgPace: '19:59 /mi', avgHr: 98, maxHr: 112, calories: 196,
    hrZonesMin: [36, 5, 0, 0, 0], route: outAndBack(40), likes: [], comments: [], device: 'Venu Sq 2',
  },
  {
    id: 'f5', ownerId: 'galen', type: 'bike', title: 'Houston Cycling', date: daysAgo(4, 6, 30).toISOString(),
    durationSec: 4800, distanceMi: 24.2, avgSpeedMph: 18.1, elevGainFt: 160, avgHr: 138, maxHr: 166, calories: 860,
    trainingEffect: { aerobic: 3.3, anaerobic: 0.7, label: 'Base' },
    hrZonesMin: [10, 25, 33, 12, 0], route: loop(80, 0.12), likes: ['me'], comments: [], device: 'Forerunner 255',
  },
  {
    id: 'f6', ownerId: 'ethan', type: 'run', title: 'Houston Running', date: daysAgo(5, 7, 0).toISOString(),
    durationSec: 1680, distanceMi: 3.1, avgPace: '9:02 /mi', elevGainFt: 22, avgHr: 160, maxHr: 178, calories: 380,
    trainingEffect: { aerobic: 3.1, anaerobic: 0.5, label: 'Tempo' },
    hrZonesMin: [1, 3, 10, 13, 1], route: loop(60, 0.1), likes: [], comments: [], device: 'Forerunner 245',
  },
];

export const sportLabel: Record<string, string> = {
  run: 'Running', bike: 'Cycling', strength: 'Strength', basketball: 'Basketball', walk: 'Walking', football: 'Football',
};

export const sportColor: Record<string, string> = {
  run: '#11a9ed', bike: '#11a9ed', strength: '#11a9ed', basketball: '#11a9ed', walk: '#11a9ed', football: '#11a9ed',
};
