import React from 'react';
import { isOn, type FeatureName } from './features';

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
 *
 * To add a feature:
 *   1. Add a flag in src/features.ts
 *   2. Build your component in src/features/<name>/...
 *   3. Register it below: registry['home.top'].push({ feature: 'dailyReadiness', component: ReadinessCard })
 */
export type SlotName =
  | 'home.top' | 'home.afterGlance' | 'social.top' | 'connections.top'
  | 'metric.stress' | 'activity.summary' | 'watch.glances' | 'watch.notifications';

export interface SlotEntry { feature: FeatureName; component: React.ComponentType<any> }

export const registry: Record<SlotName, SlotEntry[]> = {
  'home.top': [],
  'home.afterGlance': [],
  'social.top': [],
  'connections.top': [],
  'metric.stress': [],
  'activity.summary': [],
  'watch.glances': [],
  'watch.notifications': [],
};

export function Slot({ name, ...props }: { name: SlotName } & Record<string, unknown>) {
  const entries = registry[name].filter(e => isOn(e.feature));
  if (entries.length === 0) return null;
  return <>{entries.map((E, i) => <E.component key={i} {...props} />)}</>;
}

export function slotEntries(name: SlotName): SlotEntry[] {
  return registry[name].filter(e => isOn(e.feature));
}
