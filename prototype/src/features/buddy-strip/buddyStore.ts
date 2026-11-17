import { useSyncExternalStore } from 'react';
import { daysAgo, isoDate } from '../../data/dates';

// WORKOUT BUDDIES feature state (kept inside the feature; the baseline store is untouched).
// In memory only: cleared by reloading the page or "Reset demo".

export const MAX_BUDDIES = 5;
export const MIN_BUDDIES = 1;

export type InviteStatus = 'sent' | 'accepted' | 'declined' | 'incoming';
export interface Invite {
  id: string;
  personId: string;            // the friend
  direction: 'out' | 'in';     // out = you invited them, in = they invited you
  activity: string;            // "Lift"
  when: WhenOption;
  place: string;
  message: string;             // "Lift with me at 6?"
  status: InviteStatus;
  reply?: string;              // friend's reply text when declined/accepted
}

export interface WhenOption { id: string; label: string; short: string; date: string }

function nextSaturday(): Date {
  const d = daysAgo(0, 9, 0);
  const add = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d;
}

export const WHEN_OPTIONS: WhenOption[] = [
  { id: 'today6', label: 'Today, 6:00 PM', short: '6', date: isoDate(daysAgo(0)) },
  { id: 'today730', label: 'Today, 7:30 PM', short: '7:30', date: isoDate(daysAgo(0)) },
  { id: 'tom7', label: 'Tomorrow, 7:00 AM', short: '7 tomorrow', date: isoDate(daysAgo(-1)) },
  { id: 'sat9', label: 'Saturday, 9:00 AM', short: '9 on Saturday', date: isoDate(nextSaturday()) },
];
export const ACTIVITIES = ['Lift', 'Run', 'Pickup basketball', 'Ride', 'Walk'];
export const PLACES = ['Rice Rec Center', 'Rice Stadium track', 'Tudor Fieldhouse courts', 'Outer Loop'];

export function inviteMessage(activity: string, when: WhenOption): string {
  const verb: Record<string, string> = {
    Lift: 'Lift with me', Run: 'Run with me', 'Pickup basketball': 'Pickup basketball', Ride: 'Ride with me', Walk: 'Walk with me',
  };
  return `${verb[activity] ?? activity} at ${when.short}?`;
}

interface BuddyState {
  buddies: string[];          // chosen workout buddies (person ids)
  sharing: boolean;           // "Share my readiness with buddies"
  invites: Invite[];
  cheered: string[];
  sheet: { kind: 'buddy' | 'invite'; personId: string } | null;   // which phone sheet is open
  bothReadyPushed: boolean;   // the one-time "Both ready" notification already fired
  banner: Banner | null;      // phone notification banner at the top of the screen
}

export interface Banner { id: string; title: string; body: string; actions?: { label: string; run: () => void }[] }

const initial = (): BuddyState => ({
  buddies: ['ethan', 'galen', 'peter'],
  sharing: true,
  invites: [],
  cheered: [],
  sheet: null,
  bothReadyPushed: false,
  banner: null,
});

let state = initial();
const listeners = new Set<() => void>();
const set = (patch: Partial<BuddyState>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };

export const buddyStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  reset() { state = initial(); listeners.forEach(l => l()); },

  toggleBuddy(id: string): 'added' | 'removed' | 'full' | 'min' {
    if (state.buddies.includes(id)) {
      if (state.buddies.length <= MIN_BUDDIES) return 'min';
      set({ buddies: state.buddies.filter(b => b !== id) });
      return 'removed';
    }
    if (state.buddies.length >= MAX_BUDDIES) return 'full';
    set({ buddies: [...state.buddies, id] });
    return 'added';
  },
  setSharing(on: boolean) { set({ sharing: on }); },
  cheer(id: string) { if (!state.cheered.includes(id)) set({ cheered: [...state.cheered, id] }); },

  openSheet(kind: 'buddy' | 'invite', personId: string) { set({ sheet: { kind, personId }, banner: null }); },
  closeSheet() { set({ sheet: null }); },

  addInvite(inv: Invite) { set({ invites: [inv, ...state.invites.filter(i => i.id !== inv.id)] }); },
  updateInvite(id: string, patch: Partial<Invite>) { set({ invites: state.invites.map(i => (i.id === id ? { ...i, ...patch } : i)) }); },

  markBothReadyPushed() { set({ bothReadyPushed: true }); },
  showBanner(b: Banner | null) { set({ banner: b }); },
};

export function useBuddies() {
  return useSyncExternalStore(buddyStore.subscribe, buddyStore.get);
}
