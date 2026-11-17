import React from 'react';
import { isOn, type FeatureName } from './features';
import { BuddyStrip } from './features/buddy-strip/BuddyStrip';
import { ReadinessCard } from './features/readiness/ReadinessCard';
import { StressConfidence } from './features/feels-off/StressConfidence';
import { BuddyOverlay } from './features/buddy-strip/BuddyOverlay';
import { BuddyStageControls } from './features/buddy-strip/BuddyStageControls';
import { WorkoutBuddiesScreen } from './features/buddy-strip/WorkoutBuddiesScreen';
import { buddyStore } from './features/buddy-strip/buddyStore';
import { feedbackStore } from './features/feels-off/feedbackStore';
import { ChallengeLeaderboardCard } from './features/challenge-leaderboard/ChallengeLeaderboardCard';

/**
 * SLOTS: named places in the baseline UI where new features plug in
 * without editing the baseline screens.
 *
 *   home.top           top of the Home card stack (e.g. Daily Readiness card)
 *   home.afterGlance   after "At a Glance" on Home (e.g. 7-day health view)
 *   social.top         top of the News Feed tab (e.g. workout buddy list / "Both ready")
 *   connections.top    top of the Connections screen (e.g. readiness sharing toggle)
 *   metric.stress      under the Stress reading (e.g. confidence range, "Feels off")
 *   activity.summary   under an activity summary (e.g. strength-aware summary)
 *   watch.glances      extra glances appended to the watch glance loop
 *   watch.notifications custom watch alerts (e.g. "Lift with me at 6?" accept/decline)
 *   phone.overlay      always-mounted layer over the whole phone (banners, sheets, background timers)
 *   stage.controls     extra demo buttons in the bar above the devices
 *   challenges.card    replaces each active-challenge card on the Challenges tab (gets { c, onClick })
 *
 * Features can also add full phone screens (featureScreens) and clean up on "Reset demo" (resetHooks).
 *
 * To add a feature:
 *   1. Add a flag in src/features.ts
 *   2. Build your component in src/features/<name>/...
 *   3. Register it below: registry['home.top'].push({ feature: 'dailyReadiness', component: ReadinessCard })
 */
export type SlotName =
  | 'home.top' | 'home.afterGlance' | 'social.top' | 'connections.top'
  | 'metric.stress' | 'activity.summary' | 'watch.glances' | 'watch.notifications'
  | 'phone.overlay' | 'stage.controls' | 'challenges.card';

export interface SlotEntry { feature: FeatureName; component: React.ComponentType<any> }

export const registry: Record<SlotName, SlotEntry[]> = {
  'home.top': [{ feature: 'dailyReadiness', component: ReadinessCard }],
  'home.afterGlance': [{ feature: 'workoutBuddies', component: BuddyStrip }],
  'social.top': [],
  'connections.top': [],
  'metric.stress': [{ feature: 'feelsOff', component: StressConfidence }],
  'activity.summary': [],
  'watch.glances': [],
  'watch.notifications': [],
  'phone.overlay': [{ feature: 'workoutBuddies', component: BuddyOverlay }],
  'stage.controls': [{ feature: 'workoutBuddies', component: BuddyStageControls }],
  'challenges.card': [{ feature: 'challengeLeaderboard', component: ChallengeLeaderboardCard }],
};

// Extra phone screens added by features: route name → component (opened with nav.push(name, params)).
export const featureScreens: Record<string, React.ComponentType<{ params: any }>> = {
  workoutBuddies: WorkoutBuddiesScreen,
};

// Called by "Reset demo" so feature-owned state is cleared too.
export const resetHooks: Array<() => void> = [buddyStore.reset, feedbackStore.reset];
export function runResetHooks() { resetHooks.forEach(h => h()); }

export function Slot({ name, ...props }: { name: SlotName } & Record<string, unknown>) {
  const entries = registry[name].filter(e => isOn(e.feature));
  if (entries.length === 0) return null;
  return <>{entries.map((E, i) => <E.component key={i} {...props} />)}</>;
}

export function slotEntries(name: SlotName): SlotEntry[] {
  return registry[name].filter(e => isOn(e.feature));
}
