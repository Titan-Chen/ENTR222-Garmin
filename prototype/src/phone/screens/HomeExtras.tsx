import { ArrowDown, ArrowUp, Bell } from 'lucide-react';
import { useStore, type HomeSection } from '../../store';
import { NavBar, Avatar } from '../../components/common';
import { GlanceCard } from './HomeScreen';
import { ALL_METRICS, METRICS, type MetricId } from '../metrics';
import { me } from '../../data/people';
import { isOn } from '../../features';
import { levelInfo } from '../../data/social';

export function AllMetricsScreen() {
  return (
    <div className="screen">
      <NavBar title="At a Glance" />
      <div className="scroll"><div className="pad grid-2 glance-grid" style={{ paddingTop: 12 }}>
        {ALL_METRICS.map(id => <GlanceCard key={id} id={id} />)}
      </div></div>
    </div>
  );
}

const SECTION_LABELS: Record<HomeSection, string> = {
  todaysActivity: "Today's Activity", inFocus: 'In Focus', atAGlance: 'At a Glance', last7Days: 'Last 7 Days',
  challenges: 'Challenges', trainingPlans: 'Training Plans', events: 'Events',
};

// "Edit Home": toggle sections and choose/reorder At a Glance cards (max 8 on Home).
export function EditHomeScreen() {
  const { state, dispatch } = useStore();
  const g = state.home.glance;
  const move = (i: number, d: number) => {
    const next = [...g];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    dispatch({ type: 'setGlance', glance: next });
  };
  const toggleMetric = (id: MetricId) => {
    if (g.includes(id)) dispatch({ type: 'setGlance', glance: g.filter(x => x !== id) });
    else if (g.length < 8) dispatch({ type: 'setGlance', glance: [...g, id] });
    else dispatch({ type: 'toast', text: 'At a Glance holds up to 8 cards' });
  };
  return (
    <div className="screen">
      <NavBar title="Edit Home" />
      <div className="scroll">
        <div className="list-header">Sections</div>
        <div className="pad"><div className="list">
          {(Object.keys(SECTION_LABELS) as HomeSection[]).filter(k => !(k === 'inFocus' && isOn('noInFocus'))).map(k => (
            <div key={k} className="list-row">
              <span className="grow title">{SECTION_LABELS[k]}</span>
              <Toggle on={state.home.sections[k]} onClick={() => dispatch({ type: 'toggleHomeSection', section: k })} />
            </div>
          ))}
        </div></div>
        <div className="list-header">At a Glance · order</div>
        <div className="pad"><div className="list">
          {g.map((id, i) => (
            <div key={id} className="list-row">
              <span className="grow title">{METRICS[id].name}</span>
              <button onClick={() => move(i, -1)} aria-label="Move up" style={{ color: i === 0 ? 'var(--gc-text-3)' : 'var(--gc-blue)' }}><ArrowUp size={18} /></button>
              <button onClick={() => move(i, 1)} aria-label="Move down" style={{ color: i === g.length - 1 ? 'var(--gc-text-3)' : 'var(--gc-blue)' }}><ArrowDown size={18} /></button>
            </div>
          ))}
        </div></div>
        <div className="list-header">Available cards</div>
        <div className="pad"><div className="list">
          {ALL_METRICS.map(id => (
            <div key={id} className="list-row"><span className="grow title">{METRICS[id].name}</span><Toggle on={g.includes(id)} onClick={() => toggleMetric(id)} /></div>
          ))}
        </div></div>
      </div>
    </div>
  );
}

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ width: 50, height: 30, borderRadius: 15, background: on ? 'var(--gc-green)' : '#3a3b3e', position: 'relative', transition: 'background .2s', flex: 'none' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 26, height: 26, borderRadius: 13, background: '#fff', transition: 'left .2s' }} />
    </button>
  );
}

export function ProfileScreen() {
  return (
    <div className="screen">
      <NavBar title="Profile" />
      <div className="scroll">
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <Avatar person={me} size={84} />
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{me.name}</div>
          <div className="small muted">{me.location}</div>
          <div className="small muted" style={{ marginTop: 6 }}>{me.bio}</div>
          <div className="chip" style={{ marginTop: 12 }}>Level {levelInfo.level} · {levelInfo.points} pts</div>
        </div>
        <div className="pad"><div className="list">
          {['Personal Records', 'Badges', 'Stats', 'Gear', 'Privacy'].map(x => <div key={x} className="list-row"><span className="grow title">{x}</span></div>)}
        </div></div>
      </div>
    </div>
  );
}

export function NotificationsScreen() {
  return (
    <div className="screen">
      <NavBar title="Notifications" />
      <div className="scroll"><div className="pad" style={{ paddingTop: 12 }}><div className="list">
        {[['Peter liked your Basketball activity', '2d'], ['Galen liked your run', '3d'], ['You earned the Early Bird badge', '3d'], ['Weekend Warrior challenge started', '4d']].map(([t, d]) => (
          <div key={t} className="list-row"><Bell size={18} color="var(--gc-blue)" /><span className="grow small">{t}</span><span className="tiny">{d}</span></div>
        ))}
      </div></div></div>
    </div>
  );
}
