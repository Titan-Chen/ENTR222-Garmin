/**
 * FEATURE FLAGS
 *
 * The baseline = all flags false. With every flag off the prototype should look like
 * today's Garmin Connect app. New team features get a flag here and register a component
 * into a slot (see src/slots.tsx). Flip a flag to true to show it.
 *
 * Planned features from the PRD / roadmap (not built yet):
 *  - dailyReadiness:   "Go hard / Go light / Recover" card at the top of Home, with reason + confidence
 *  - feelsOff:         "Feels off" button on readiness / stress readings
 *  - weeklyHealth:     7-day readiness, stress and sleep on one screen
 *  - strengthAware:    readiness + summaries that count lifting and pickup sports
 *  - workoutBuddies:   buddy list, readiness sharing, "Both ready", "Lift with me at 6?" invites, streaks
 *  - bothReady:        "You and Peter are both Go light" prompt + phone banner + watch alert
 *  - watchAlerts:      matching readiness glance + invite alerts on the watch
 *
 * Flags can also be turned on from the URL for user testing, e.g. ?features=dailyReadiness,workoutBuddies
 * Use ?features=none to turn every flag off and see the plain current-app baseline.
 */
export const FEATURES = {
  dailyReadiness: true,   // ON: Daily Readiness card at the top of Home (src/features/readiness)
  feelsOff: true,         // ON: confidence + "Doesn't feel right?" on Stress and Daily Readiness (src/features/feels-off)
  weeklyHealth: false,
  strengthAware: false,
  workoutBuddies: true,   // ON: Workout Buddies card + picker, sharing toggle, invites (phone + watch) (src/features/buddy-strip)
  bothReady: true,        // ON: "Both ready" prompt on Daily Readiness + one-time phone/watch alert
  watchAlerts: false,
};

export type FeatureName = keyof typeof FEATURES;

const fromUrl = new URLSearchParams(window.location.search).get('features');
if (fromUrl === 'none') {
  for (const name of Object.keys(FEATURES)) FEATURES[name as FeatureName] = false;
} else if (fromUrl) {
  for (const name of fromUrl.split(',')) {
    if (name in FEATURES) FEATURES[name as FeatureName] = true;
  }
}

export function isOn(name: FeatureName): boolean {
  return FEATURES[name];
}
