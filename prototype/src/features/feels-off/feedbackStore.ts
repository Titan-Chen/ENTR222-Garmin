import { useSyncExternalStore } from 'react';

// Tiny store for "Feels off" feedback, kept inside the feature so the baseline store is untouched.
// In-memory only (resets on reload / Reset demo reloads the stage).

export type Target = 'stress' | 'readiness';
export interface FeedbackEntry { target: Target; measured: string; felt: string; reasons: string[]; note: string; at: string }

// Like the team's stress-feedback prototype: 5 check-ins until readings are personalized,
// and the user starts with 2 earlier check-ins so progress is visible right away.
export const LEARN_GOAL = 5;
const EARLIER_CHECKINS = 2;

let entries: FeedbackEntry[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const feedbackStore = {
  add(e: FeedbackEntry) { entries = [...entries.filter(x => x.target !== e.target), e]; emit(); },
  get(target: Target) { return entries.find(e => e.target === target); },
  reset() { entries = []; emit(); },
  count() { return EARLIER_CHECKINS + entries.length; },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  snapshot() { return entries; },
};

export function useFeedback() {
  useSyncExternalStore(feedbackStore.subscribe, feedbackStore.snapshot);
  return feedbackStore;
}

// Confidence → how wide the likely range is (+/-), same spreads as the stress-feedback prototype.
export type Confidence = 'High' | 'Moderate' | 'Low';
export const SPREAD: Record<Confidence, number> = { High: 4, Moderate: 8, Low: 13 };
