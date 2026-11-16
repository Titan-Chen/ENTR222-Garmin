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

const NavCtx = createContext<NavApi | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTabState] = useState<TabId>('home');
  const [stacks, setStacks] = useState(freshStacks);

  const api: NavApi = {
    tab,
    stack: stacks[tab],
    canPop: stacks[tab].length > 1,
    push: (screen, params) => setStacks(s => ({ ...s, [tab]: [...s[tab], { screen, params, key: keySeq++ }] })),
    pop: () => setStacks(s => ({ ...s, [tab]: s[tab].length > 1 ? s[tab].slice(0, -1) : s[tab] })),
    setTab: t => {
      // Tapping the active tab again pops to root (iOS behavior).
      if (t === tab) setStacks(s => ({ ...s, [t]: s[t].slice(0, 1) }));
      setTabState(t);
    },
    resetAll: () => { setStacks(freshStacks()); setTabState('home'); },
  };
  return <NavCtx.Provider value={api}>{children}</NavCtx.Provider>;
}

export function useNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error('useNav outside NavProvider');
  return ctx;
}
