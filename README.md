# ENTR222 Garmin Connect prototype

A clickable prototype of the Garmin Connect iPhone app with a paired watch, built for ENTR 222 by Titan Chen, Sara Kalra, Olivia Qiu and Michael Zito. It adds new features (Daily Readiness, "Doesn't feel right?" stress feedback, Workout Buddies and "Both ready") on top of a recreation of how the app works today.

This is a class project. It is not affiliated with or made by Garmin, and all the data is made up.

## Open it

- **No setup:** double-click `prototype/Open Prototype.html`. It is one self-contained file you can also send to user testers.
- **GitHub Pages:** the site root redirects to `prototype/dist/`.
- **Baseline only:** add `?features=none` to the URL to hide all new features.

Setup, features and the demo flow are in [`prototype/README.md`](prototype/README.md).

## What's where

| Location | Contents |
|---|---|
| `prototype/` | The working copy (React + Vite). Make changes here. |
| `baseline-prototype/` | The untouched "current app" version, used for comparison in user tests. Don't edit it. |
| `baseline-connect-prototype` branch | The same baseline on its own branch. |
| `stress-feedback-prototype` branch | The team's first single-page stress-feedback demo. It has since been rebuilt in `prototype/src/features/feels-off/`. |
