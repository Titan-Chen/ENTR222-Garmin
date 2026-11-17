import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { House, Trophy, CalendarDays, Newspaper, Ellipsis, RefreshCw, Signal, Wifi, BatteryFull } from 'lucide-react';
import { useStore } from '../store';
import { NavProvider, useNav, scrollMemory, type TabId } from './nav';
import { HomeScreen } from './screens/HomeScreen';
import { MetricDetailScreen } from './screens/MetricDetailScreen';
import { ActivityDetailScreen, ActivitiesListScreen } from './screens/ActivityScreens';
import { AllMetricsScreen, EditHomeScreen, ProfileScreen, NotificationsScreen } from './screens/HomeExtras';
import { ChallengesScreen, ChallengeDetailScreen, CreateChallengeScreen } from './screens/ChallengesScreens';
import { CalendarScreen } from './screens/CalendarScreen';
import { FeedScreen } from './screens/FeedScreen';
import {
  MoreScreen, PlaceholderScreen, ConnectionsScreen, AddConnectionScreen, FriendProfileScreen,
  GroupsScreen, GroupScreen, DevicesScreen, TrainingScreen, WorkoutsScreen,
} from './screens/MoreScreens';
import { Slot, featureScreens } from '../slots';

// Screen registry: route name → component. New feature screens get registered here too.
const SCREENS: Record<string, React.ComponentType<{ params: any }>> = {
  home: HomeScreen, metric: MetricDetailScreen, activity: ActivityDetailScreen, activitiesList: ActivitiesListScreen,
  allMetrics: AllMetricsScreen, editHome: EditHomeScreen, profile: ProfileScreen, notifications: NotificationsScreen,
  challenges: ChallengesScreen, challenge: ChallengeDetailScreen, createChallenge: CreateChallengeScreen,
  calendar: CalendarScreen, feed: FeedScreen,
  more: MoreScreen, placeholder: PlaceholderScreen, connections: ConnectionsScreen, addConnection: AddConnectionScreen,
  friend: FriendProfileScreen, groups: GroupsScreen, group: GroupScreen, devices: DevicesScreen, training: TrainingScreen, workouts: WorkoutsScreen,
};

const TABS: { id: TabId; label: string; Icon: React.ComponentType<any> }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'challenges', label: 'Challenges', Icon: Trophy },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'feed', label: 'News Feed', Icon: Newspaper }, // TODO verify against screenshot: tab labels/icons
  { id: 'more', label: 'More', Icon: Ellipsis },
];

export function PhoneApp() {
  return (
    <div className="phone-frame">
      <div className="phone-screen">
        <div className="dynamic-island" />
        <StatusBar />
        <NavProvider><AppBody /></NavProvider>
        <div className="home-indicator" />
      </div>
    </div>
  );
}

function StatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = window.setInterval(() => setNow(new Date()), 15000); return () => window.clearInterval(iv); }, []);
  return (
    <div className="ios-status">
      <span>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ ?[AP]M/, '')}</span>
      <span className="icons"><Signal size={16} /><Wifi size={16} /><BatteryFull size={22} /></span>
    </div>
  );
}

// Remembers how far each screen in the stack was scrolled, so going Back returns you
// to the same spot (like iOS) instead of the top. Keyed by tab + route, so each tab keeps its own place.

function ScreenFrame({ memoryKey, animate, children }: { memoryKey: string; animate: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const restored = scrollMemory.has(memoryKey);
  useLayoutEffect(() => {
    const frame = ref.current;
    const el = frame?.querySelector<HTMLElement>('.scroll');
    const saved = scrollMemory.get(memoryKey);
    if (el && saved) el.scrollTop = saved;
    // Save while scrolling (not on close), so a screen you go Back from is forgotten and reopens at the top.
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.classList?.contains('scroll')) scrollMemory.set(memoryKey, t.scrollTop);
    };
    frame?.addEventListener('scroll', onScroll, true);
    return () => frame?.removeEventListener('scroll', onScroll, true);
  }, [memoryKey]);
  // Don't replay the slide-in animation when coming back to a screen you've already seen.
  return <div ref={ref} className={`screen ${animate && !restored ? 'push-in' : ''}`}>{children}</div>;
}

function AppBody() {
  const nav = useNav();
  const { state } = useStore();
  const top = nav.stack[nav.stack.length - 1];
  const Screen = SCREENS[top.screen] ?? featureScreens[top.screen] ?? PlaceholderScreen;
  return (
    <>
      {state.sync.status === 'syncing' && (
        <div className="sync-banner">
          <RefreshCw size={14} className="spin" />
          <span>Syncing {state.device.name}…</span>
          <div className="bar"><div style={{ width: `${state.sync.progress}%` }} /></div>
        </div>
      )}
      <div className="app-body">
        <ScreenFrame key={`${nav.tab}-${top.key}`} memoryKey={`${nav.tab}-${top.key}`} animate={top.key > 0}>
          <Screen params={top.params ?? {}} />
        </ScreenFrame>
      </div>
      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab ${nav.tab === id ? 'active' : ''}`} onClick={() => nav.setTab(id)}>
            <Icon size={24} />{label}
          </button>
        ))}
      </nav>
      {state.toast && <div className="toast">{state.toast}</div>}
      <Slot name="phone.overlay" />
    </>
  );
}
