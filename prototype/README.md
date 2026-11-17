# Garmin Connect prototype (watch + iPhone): working copy

> **This is the working copy on `main`.** Edit it and add features here.
> The untouched original ("how the app works today") is kept on the **`baseline-connect-prototype`** branch, in `baseline-prototype/`. Use that branch for the "current app" side of user tests, and don't edit it.

## Features added in this working copy

| Feature | Flag (`src/features.ts`) | Where | What it does |
|---|---|---|---|
| Daily Readiness card | `dailyReadiness` (on) | Top of Home (`src/features/readiness/`) | One plain answer for today (Go hard / Go light / Recover) with a one-line reason and a suggestion. "Why?" expands the five factors behind it (Sleep, Body Battery, HRV, Recent Activity incl. lifting and pickup games, Stress). Simple weighted formula in `readiness.ts`; wording includes a wellness-not-medical note. |
| Confidence + "Doesn't feel right?" | `feelsOff` (on) | Stress screen (Day) and the Daily Readiness card (`src/features/feels-off/`) | Stress shows a likely range (e.g. 24–40) and a confidence tag; Daily Readiness shows a confidence tag, with the reason under "Why?" (how close the score is to the next cut-off). "Doesn't feel right?" opens a sheet: how you actually feel, optional reasons and a note, then a thank-you with "3 of 5 check-ins until your readings are personalized". Afterwards a "You said…" note shows on the reading. On Daily Readiness your answer also **replaces the suggestion** (e.g. Go light → Recover) everywhere, including what buddies see and "Both ready" matching, with a note saying what Garmin suggested and a **Use Garmin's suggestion** link to undo. Carried over from the team's stress-feedback prototype. |
| Workout Buddies | `workoutBuddies` (on) | **Work out together** section inside the Daily Readiness card at the top of Home (`src/features/buddy-strip/ReadinessBuddies.tsx`). If Daily Readiness is off, it falls back to its own card below At a Glance. | Your chosen buddies (pick up to 5 under **Edit**) in one row with their Go hard / Go light / Recover status. The best match is picked first; tap any buddy to switch who you invite. **Invite** opens the composer (activity, time, place, editable "Lift with me at 6?"); buddies on Recover get **Cheer** instead. **Share my readiness** toggle under Edit. Friends reply after a few seconds (anyone on Recover declines); accepted invites go on your Calendar and show on the watch. Your invites and their status are listed on the card. |
| Both ready | `bothReady` (on) | Inside the Daily Readiness card + phone banner + watch | When a buddy's answer matches yours (and sharing is on), they're listed first in Work out together with a check mark and picked by default: "Peter is Go light too. Work out together today?" Also fires once as a phone notification and a watch alert ~6 s after opening (Invite / Not now; inviting from the watch sends "Lift with me at 6?"). |

Everything else (including Garmin's own Training Readiness and the rest of Home) still matches the current Garmin Connect app.

**Demo buttons above the devices:** "Ethan invites you to work out" sends an invite to your watch and phone (Accept / Decline on either; on the watch use UP/DOWN and START). "Show 'Both ready' alert" fires the alert again. "Reset demo" clears everything, including invites and feedback.

**Core flow for testing:** Home → Daily Readiness says *Go light* → Work out together has Peter picked ("Peter is Go light too") → **Invite Peter** (or tap Ethan or Galen to invite them instead) → pick time/place → **Send invite** → Peter accepts → it's on your Calendar and your watch. Add `?features=none` to the URL to hide all new features and see the plain baseline.

## About the starting point

A clickable recreation of the **current** Garmin Connect iPhone app with a paired Forerunner-style watch next to it, built for the ENTR222 Garmin project (Titan Chen, Sara Kalra, Olivia Qiu, Michael Zito).

This is the **baseline**: it shows how the app works *today*, so user tests can compare it against our redesign. New features (Daily Readiness, "Feels off", workout buddies, etc.) get built on top of it with feature flags. They are **not** built yet.

Class project. Not affiliated with or made by Garmin. All data is made up. No Garmin logos or image files are used.

## Open it (no setup)

Double-click **`prototype/Open Prototype.html`**. It opens in your browser with no Terminal or install. The whole prototype is in that one file, so you can also email or AirDrop it to user testers.

## Run it for development

```bash
cd prototype
npm install
npm run dev        # local dev server
npm run build      # static build in prototype/dist + refreshes "Open Prototype.html"
```

After changing the code, run `npm run build` so the double-click file picks up your changes.

The built site in `dist/` is committed, so it can also be opened through GitHub Pages at `<pages-url>/prototype/dist/` with no build step.

It's laid out for a laptop or projector (about 1440×900) and scales down to fit smaller windows.

## What you can do

**Phone (Garmin Connect):**
- **Home:** Today's/Latest Activity, swipeable In Focus panels (Sleep, Body Battery, Training Readiness), Sleep Coach, At a Glance cards, Last 7 Days, Challenges and Events. **Edit Home** at the bottom toggles sections and reorders cards.
- **Detail screens** for Steps, Sleep, Body Battery, Stress, HRV, Heart Rate, Intensity Minutes, Calories, Training Readiness and Floors, each with Day / 7 Days / 4 Weeks.
- **Activity detail:** map placeholder, overview, stats, laps, training effect, HR zones, likes and comments. Strength and Basketball activities get the same cardio-style summary the real app gives them, with sets and reps showing "--" (Ethan's pain point).
- **Challenges** (join, create a step challenge and invite connections, leaderboard, badges), **Calendar** (month view, schedule a workout for yourself), **News Feed** (like and comment), **More** (Connections, Add Connections, friend profiles, Groups, Garmin Devices with Sync Now, Training & Planning, Workouts).

**Watch (5 buttons, click them or use the keyboard):**

| Button | Key | Does |
|---|---|---|
| LIGHT (left top) | `L` | backlight |
| UP / DOWN (left) | `↑` `↓` | glances, scroll lists, data pages |
| START · STOP (right top) | `Enter` | activity list, start/pause, select |
| BACK · LAP (right bottom) | `Esc` / `Backspace` | back |

Flow: watch face → START → pick Run/Bike/Strength/Basketball/Walk → GPS → START records → START stops → Save. **The saved activity syncs to the phone** (blue sync banner, then it appears in Today's Activity, the News Feed and the Calendar).

The **"Send a phone notification to the watch"** button at the top shows a message on the watch. **Reset demo** clears everything.

## User-test tasks (from our User Test Plan)

| Task | How it works in the current app (baseline) |
|---|---|
| 4. See what your friends did this week | News Feed tab, or More → Connections → a friend's profile |
| 5. Invite a friend to a run on Saturday | **There's no way to do this in the current app.** Calendar → + only schedules a workout for yourself. The closest options are commenting on a friend's activity or Groups. This is intentional, so it can be compared with the redesign. |
| 6. Join or create a step challenge with two friends | Challenges → Join, or + → Most Steps → Next → pick 2 connections → Create Challenge |
| 7. Find last night's sleep score | Home → In Focus (Sleep) or the Sleep Score card |

## Folder structure

```
prototype/
  index.html, vite.config.ts, tsconfig.json, package.json
  dist/                    built site (committed for GitHub Pages)
  src/
    App.tsx                stage: watch on the left, phone on the right, demo controls
    store.tsx              ONE shared store for phone + watch (activities, sync, challenges, connections…)
    features.ts            feature flags (all off = today's app)
    slots.tsx              named places where new features plug in
    data/                  all mock data (typed): people, health (14 days), activities, challenges, device
    styles/tokens.css      design tokens: colors, type, spacing, radii (use these in new features)
    styles/global.css      layout + component styles
    components/            charts (rings, gauges, bars, sleep stages, zones, map) and shared UI
    phone/                 PhoneApp (frame, tab bar, sync banner), nav stack, metric definitions
    phone/screens/         one file per area: Home, metric detail, activities, challenges, calendar, feed, more
    watch/WatchApp.tsx     watch frame, buttons and every watch screen
```

## Adding a new feature (how the redesign plugs in)

1. Add a flag in `src/features.ts`, e.g. `dailyReadiness: false`.
2. Build the component in its own folder, e.g. `src/features/daily-readiness/ReadinessCard.tsx`. Use the CSS variables in `tokens.css` and read data from `src/data/` or the store.
3. Register it in a slot in `src/slots.tsx`:
   ```ts
   registry['home.top'].push({ feature: 'dailyReadiness', component: ReadinessCard });
   ```
4. Turn it on in `features.ts`, or from the URL for a test session: `?features=dailyReadiness,workoutBuddies`.

With every flag off, the prototype stays identical to the baseline, so the same link can serve both arms of a user test.

**Slots available:** `home.top`, `home.afterGlance`, `social.top`, `connections.top`, `metric.stress`, `activity.summary`, `watch.glances`, `watch.notifications`. New full screens get added to the `SCREENS` registry in `src/phone/PhoneApp.tsx` and opened with `nav.push('screenName', params)`.

## Things to check against real screenshots

These were built from public descriptions of Garmin Connect 5.x, not from screenshots of a teammate's phone. Each one is marked `TODO verify against screenshot` in the code:

- `src/styles/tokens.css`: exact colors (matched by eye)
- `src/phone/screens/HomeScreen.tsx`: Home section titles and order, and the header (title, avatar, right-side icons)
- `src/phone/PhoneApp.tsx`: bottom tab labels and icons
- `src/data/social.ts`: More tab items and their order
- `src/components/common.tsx`: run and basketball icons (stand-ins from the Lucide icon set)

Garmin has also added an optional "Essentials" home view (Connect 5.27, off by default). It isn't included.
