import { buddyStatuses, getRecommendation, type RecType } from './buddies';
import type { ReadinessLevel } from '../readiness/readiness';

// Friend readiness uses the mockup rule (Body Battery + Sleep Score); map it to the shared levels.
const MAP: Record<RecType, ReadinessLevel> = { hard: 'hard', easy: 'light', rest: 'recover' };

export function friendLevel(personId: string): ReadinessLevel | null {
  const s = buddyStatuses.find(b => b.personId === personId);
  return s ? MAP[getRecommendation(s.bodyBattery, s.sleepScore).type] : null;
}

// "Both ready": buddies whose answer today matches yours (Go hard or Go light, never Recover).
// Needs readiness sharing on, since matching only works when both sides share.
export function bothReadyMatches(myLevel: ReadinessLevel, buddies: string[], sharing: boolean): string[] {
  if (!sharing || myLevel === 'recover') return [];
  return buddies.filter(id => friendLevel(id) === myLevel);
}
