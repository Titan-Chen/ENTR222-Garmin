// Buddy strip data + recommendation rule, carried over from the team's first friends mockup.
// Each friend's Body Battery and Sleep Score are made up (like all prototype data).

export type RecType = 'hard' | 'easy' | 'rest';

export interface Recommendation { type: RecType; title: string; short: string; text: string }

// Same rule as the mockup's getRecommendation() (labels now match the Daily Readiness card):
//   Rest  if Body Battery < 35 or Sleep Score < 50
//   Hard  if Body Battery >= 70 and Sleep Score >= 75
//   Easy  otherwise
export function getRecommendation(battery: number, sleep: number): Recommendation {
  if (battery < 35 || sleep < 50) {
    return { type: 'rest', title: 'Recover', short: 'Recover', text: 'Your body needs to recover. Try stretching or a short walk.' };
  }
  if (battery >= 70 && sleep >= 75) {
    return { type: 'hard', title: 'Go hard', short: 'Go hard', text: "You're well rested. Go for intervals, a long run, or heavy lifting." };
  }
  return { type: 'easy', title: 'Go light', short: 'Go light', text: 'Keep it light today. An easy jog, bike ride, or yoga is perfect.' };
}

export const REC_COLORS: Record<RecType, string> = {
  hard: '#f04e4e',
  easy: '#f5b83d',
  rest: '#3ddc97',
};

export interface BuddyStatus { personId: string; bodyBattery: number; sleepScore: number; stepsToday: number }

// One of each status so the strip shows the full range.
export const buddyStatuses: BuddyStatus[] = [
  { personId: 'ethan', bodyBattery: 88, sleepScore: 90, stepsToday: 12301 },
  { personId: 'galen', bodyBattery: 81, sleepScore: 84, stepsToday: 15872 },
  { personId: 'peter', bodyBattery: 58, sleepScore: 72, stepsToday: 9455 },
  { personId: 'joe', bodyBattery: 24, sleepScore: 41, stepsToday: 4120 },
];
