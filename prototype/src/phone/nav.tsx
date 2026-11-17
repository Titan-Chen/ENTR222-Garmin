import React, { createContext, useContext, useState } from 'react';

// Simple per-tab navigation stack, like a UITabBarController with a UINavigationController in each tab.

export type TabId = 'home' | 'challenges' | 'calendar' | 'feed' | 'more';
export interface Route { screen: string; params?: Record<string, any>; key: number }

interface NavApi {
  tab: TabId;
  stack: Route[];
  canPop: boolean;
  push: (screen: string, params?: Record<string, any>) => void;
  pop: () => void;
  setTab: (t: TabId) => void;
  resetAll: () => void;
  goRoot: (t: TabId) => void;   // switch to a tab and go back to its first screen
}

const roots: Record<TabId, string> = {
  home: 'home', challenges: 'challenges', calendar: 'calendar', feed: 'feed', more: 'more',
};

let keySeq = 1;
const freshStacks = (): Record<TabId, Route[]> => ({
  home: [{ screen: roots.home, key: 0 }],
  challenges: [{ screen: roots.challenges, key: 0 }],
  calendar: [{ screen: roots.calendar, key: 0 }],
  feed: [{ screen: roots.feed, key: 0 }],
  more: [{ screen: roots.more, key: 0 }],
});

// Scroll positions per screen (tab + route key). Read and written by the screen frame in PhoneApp.
export const scrollMemory = new Map<string, number>();
function forgetScroll(key?: string) { if (key) scrollMemory.delete(key); else scrollMemory.clear(); }

// Lets controls outside the phone (the user-test panel above the devices) move the phone to a screen.
export const navControl: { current: NavApi | null } = { current: null };

const NavCtx = createContext<NavApi | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTabState] = useState<TabId>('home');
  const [stacks, setStacks] = useState(freshStacks);

  const api: NavApi = {
    tab,
    stack: stacks[tab],
    canPop: stacks[tab].length > 1,
    push: (screen, params) => setStacks(s => ({ ...s, [tab]: [...s[tab], { screen, params, key: keySeq++ }] })),
    pop: () => setStacks(s => {
      // Forget the popped screen's scroll spot so opening it again starts at the top.
      const popped = s[tab][s[tab].length - 1];
      if (s[tab].length > 1) forgetScroll(`${tab}-${popped.key}`);
      return { ...s, [tab]: s[tab].length > 1 ? s[tab].slice(0, -1) : s[tab] };
    }),
    setTab: t => {
      // Tapping the active tab again pops to root (iOS behavior).
      if (t === tab) setStacks(s => ({ ...s, [t]: s[t].slice(0, 1) }));
      setTabState(t);
    },
    resetAll: () => { setStacks(freshStacks()); setTabState('home'); forgetScroll(); },
    goRoot: t => { setStacks(s => ({ ...s, [t]: s[t].slice(0, 1) })); setTabState(t); },
  };
  navControl.current = api;
  return <NavCtx.Provider value={api}>{children}</NavCtx.Provider>;
}

export function useNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error('useNav outside NavProvider');
  return ctx;
}
