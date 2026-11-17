import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import type { Activity, Challenge, Device } from './data/types';
import { seedActivities } from './data/activities';
import { seedChallenges, seedDevice } from './data/social';
import { friends } from './data/people';
import { DEFAULT_GLANCE, type MetricId } from './phone/metrics';

// One shared store for phone + watch. New features add fields/actions here
// (or keep their own store) — the baseline only models what the current app does.

export interface WatchNotification {
  id: string; from: string; text: string; app: string;
  // Optional actions (e.g. Accept / Decline). UP/DOWN picks one, START chooses it, BACK dismisses.
  actions?: string[];
  onAction?: (action: string) => void;
}
export interface ScheduledItem { id: string; date: string; title: string; note?: string }

export interface State {
  activities: Activity[];
  pendingUpload: Activity[];          // saved on the watch, not yet synced to the phone
  challenges: Challenge[];
  connections: string[];              // person ids you're connected with
  sentRequests: string[];             // connection requests you sent
  device: Device;
  sync: { status: 'idle' | 'syncing'; progress: number };
  watchNotifications: WatchNotification[];
  scheduled: ScheduledItem[];         // workouts added to your own calendar
  home: { sections: Record<HomeSection, boolean>; glance: MetricId[] }; // "Edit Home" settings
  toast: string | null;
}

export type HomeSection = 'todaysActivity' | 'inFocus' | 'atAGlance' | 'last7Days' | 'challenges' | 'trainingPlans' | 'events';

const initialState: State = {
  activities: seedActivities,
  pendingUpload: [],
  challenges: seedChallenges,
  connections: friends.map(f => f.id),
  sentRequests: [],
  device: seedDevice,
  sync: { status: 'idle', progress: 0 },
  watchNotifications: [],
  scheduled: [],
  home: {
    sections: { todaysActivity: true, inFocus: true, atAGlance: true, last7Days: true, challenges: true, trainingPlans: false, events: true },
    glance: DEFAULT_GLANCE,
  },
  toast: null,
};

export type Action =
  | { type: 'like'; activityId: string }
  | { type: 'comment'; activityId: string; text: string }
  | { type: 'joinChallenge'; challengeId: string }
  | { type: 'createChallenge'; challenge: Challenge }
  | { type: 'sendConnectionRequest'; personId: string }
  | { type: 'saveWatchActivity'; activity: Activity }
  | { type: 'syncStart' }
  | { type: 'syncProgress'; progress: number }
  | { type: 'syncDone' }
  | { type: 'pushWatchNotification'; notification: WatchNotification }
  | { type: 'dismissWatchNotification'; id: string }
  | { type: 'schedule'; item: ScheduledItem }
  | { type: 'toggleHomeSection'; section: HomeSection }
  | { type: 'setGlance'; glance: MetricId[] }
  | { type: 'toast'; text: string | null }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'like':
      return {
        ...state,
        activities: state.activities.map(a =>
          a.id !== action.activityId ? a : {
            ...a,
            likes: a.likes.includes('me') ? a.likes.filter(x => x !== 'me') : [...a.likes, 'me'],
          }),
      };
    case 'comment':
      return {
        ...state,
        activities: state.activities.map(a =>
          a.id !== action.activityId ? a : { ...a, comments: [...a.comments, { personId: 'me', text: action.text }] }),
      };
    case 'joinChallenge':
      return {
        ...state,
        challenges: state.challenges.map(c =>
          c.id !== action.challengeId ? c : { ...c, status: 'active', participants: [...c.participants, { personId: 'me', value: 0 }] }),
        toast: 'You joined the challenge',
      };
    case 'createChallenge':
      return { ...state, challenges: [action.challenge, ...state.challenges], toast: 'Challenge created. Invites sent.' };
    case 'sendConnectionRequest':
      return { ...state, sentRequests: [...state.sentRequests, action.personId], toast: 'Connection request sent' };
    case 'saveWatchActivity':
      return { ...state, pendingUpload: [...state.pendingUpload, action.activity] };
    case 'syncStart':
      return { ...state, sync: { status: 'syncing', progress: 0 } };
    case 'syncProgress':
      return { ...state, sync: { status: 'syncing', progress: action.progress } };
    case 'syncDone':
      return {
        ...state,
        sync: { status: 'idle', progress: 100 },
        activities: [...state.pendingUpload, ...state.activities],
        pendingUpload: [],
        device: { ...state.device, lastSync: new Date().toISOString() },
      };
    case 'pushWatchNotification':
      return { ...state, watchNotifications: [action.notification, ...state.watchNotifications] };
    case 'dismissWatchNotification':
      return { ...state, watchNotifications: state.watchNotifications.filter(n => n.id !== action.id) };
    case 'schedule':
      return { ...state, scheduled: [...state.scheduled, action.item], toast: 'Added to your calendar' };
    case 'toggleHomeSection':
      return { ...state, home: { ...state.home, sections: { ...state.home.sections, [action.section]: !state.home.sections[action.section] } } };
    case 'setGlance':
      return { ...state, home: { ...state.home, glance: action.glance } };
    case 'toast':
      return { ...state, toast: action.text };
    case 'reset':
      return initialState;
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action>; startSync: () => void } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const syncing = useRef(false);

  // Simulated Bluetooth sync: progress bar over ~3s, then pending watch activities land on the phone.
  const startSync = () => {
    if (syncing.current) return;
    syncing.current = true;
    dispatch({ type: 'syncStart' });
    let p = 0;
    const iv = window.setInterval(() => {
      p += 12 + Math.random() * 10;
      if (p >= 100) {
        window.clearInterval(iv);
        dispatch({ type: 'syncDone' });
        syncing.current = false;
      } else {
        dispatch({ type: 'syncProgress', progress: Math.round(p) });
      }
    }, 380);
  };

  // Auto-sync shortly after an activity is saved on the watch (like the real app does when nearby).
  useEffect(() => {
    if (state.pendingUpload.length === 0) return;
    const t = window.setTimeout(startSync, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingUpload.length]);

  useEffect(() => {
    if (!state.toast) return;
    const t = window.setTimeout(() => dispatch({ type: 'toast', text: null }), 2200);
    return () => window.clearTimeout(t);
  }, [state.toast]);

  return <Ctx.Provider value={{ state, dispatch, startSync }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
