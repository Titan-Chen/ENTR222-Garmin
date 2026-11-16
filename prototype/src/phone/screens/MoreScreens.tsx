import { useState } from 'react';
import { ChevronRight, Search, UserPlus, Watch, RefreshCw, Users, Dumbbell, CalendarCheck, Route, Gauge as GaugeIcon, Settings, HelpCircle, Shield, CreditCard, Store, BarChart3, HeartPulse, Lightbulb, Award, Package, Activity as ActivityIcon, Medal } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../nav';
import { NavBar, Avatar, SportIcon } from '../../components/common';
import { Slot } from '../../slots';
import { me, personById, suggestedPeople, allPeople } from '../../data/people';
import { moreMenu } from '../../data/social';
import { fmtDuration, relDay, timeOf } from '../../data/dates';

const icons: Record<string, React.ComponentType<any>> = {
  'Garmin Devices': Watch, 'Connect IQ Store': Store, 'Activities & Apps': ActivityIcon, 'Performance Stats': BarChart3, 'Health Stats': HeartPulse,
  'Training & Planning': CalendarCheck, 'Insights': Lightbulb, 'Garmin Coach': Medal, 'Connections': UserPlus, 'Groups': Users, 'Badges & Records': Award,
  'Gear': Package, 'Safety & Tracking': Shield, 'Garmin Pay': CreditCard, 'Settings': Settings, 'Help & Support': HelpCircle,
};

const routes: Record<string, [string, Record<string, any>?]> = {
  'Garmin Devices': ['devices'], 'Connections': ['connections'], 'Groups': ['groups'], 'Training & Planning': ['training'],
  'Garmin Coach': ['training'], 'Activities & Apps': ['activitiesList'], 'Health Stats': ['allMetrics'], 'Performance Stats': ['metric', { id: 'readiness' }],
  'Badges & Records': ['profile'],
};

// More tab: long list of everything else. Connections and Groups live here (hard to find — interview finding).
export function MoreScreen() {
  const nav = useNav();
  return (
    <div className="screen">
      <NavBar title="More" back={false} />
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 12 }}>
          <button className="card row" onClick={() => nav.push('profile')}>
            <Avatar person={me} size={48} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{me.name}</div><div className="tiny">View profile</div></div>
            <ChevronRight size={18} className="chev" />
          </button>
        </div>
        {moreMenu.map(sec => (
          <div key={sec.section} className="pad" style={{ marginTop: 12 }}><div className="list">
            {sec.items.map(item => {
              const Icon = icons[item] ?? Settings;
              const r = routes[item];
              return (
                <button key={item} className="list-row" onClick={() => r ? nav.push(r[0], r[1]) : nav.push('placeholder', { title: item })}>
                  <Icon size={20} color="var(--gc-blue)" /><span className="grow title">{item}</span><ChevronRight size={18} className="chev" />
                </button>
              );
            })}
          </div></div>
        ))}
      </div>
    </div>
  );
}

export function PlaceholderScreen({ params }: { params: { title: string } }) {
  return (
    <div className="screen">
      <NavBar title={params.title} />
      <div className="scroll"><div className="pad" style={{ paddingTop: 30, textAlign: 'center' }}>
        <div className="small muted">This screen exists in the real app but isn't needed for the user tests, so it's a placeholder in the prototype.</div>
      </div></div>
    </div>
  );
}

export function ConnectionsScreen() {
  const { state } = useStore();
  const nav = useNav();
  const [seg, setSeg] = useState(0);
  const [q, setQ] = useState('');
  const list = state.connections.map(personById).filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="screen">
      <NavBar title="Connections" right={<button onClick={() => nav.push('addConnection')} aria-label="Add connection"><UserPlus size={22} /></button>} />
      <div className="seg">{['Connections', 'Requests'].map((s, i) => <button key={s} className={i === seg ? 'on' : ''} onClick={() => setSeg(i)}>{s}</button>)}</div>
      <div className="scroll">
        <Slot name="connections.top" />
        {seg === 0 ? (
          <>
            <div className="pad" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 28, top: 11, color: 'var(--gc-text-3)' }} />
              <input className="text-input" style={{ paddingLeft: 34 }} placeholder="Search connections" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div className="pad" style={{ marginTop: 10 }}><div className="list">
              {list.map(p => (
                <button key={p.id} className="list-row" onClick={() => nav.push('friend', { id: p.id })}>
                  <Avatar person={p} size={38} /><div className="grow"><div className="title">{p.name}</div><div className="sub">{p.location}</div></div><ChevronRight size={18} className="chev" />
                </button>
              ))}
            </div></div>
          </>
        ) : (
          <div className="pad"><div className="list">
            {state.sentRequests.length === 0 && <div className="list-row small muted">No pending requests</div>}
            {state.sentRequests.map(id => <div key={id} className="list-row"><Avatar person={personById(id)} size={34} /><span className="grow title">{personById(id).name}</span><span className="tiny">Sent</span></div>)}
          </div></div>
        )}
      </div>
    </div>
  );
}

export function AddConnectionScreen() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  const results = (q ? allPeople.filter(p => p.id !== 'me' && p.name.toLowerCase().includes(q.toLowerCase())) : suggestedPeople);
  return (
    <div className="screen">
      <NavBar title="Add Connections" />
      <div className="scroll">
        <div className="pad" style={{ position: 'relative', paddingTop: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: 23, color: 'var(--gc-text-3)' }} />
          <input className="text-input" style={{ paddingLeft: 34 }} placeholder="Search by name or email" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="list-header">{q ? 'Results' : 'Suggested'}</div>
        <div className="pad"><div className="list">
          {results.map(p => {
            const connected = state.connections.includes(p.id);
            const sent = state.sentRequests.includes(p.id);
            return (
              <div key={p.id} className="list-row">
                <Avatar person={p} size={38} /><div className="grow"><div className="title">{p.name}</div><div className="sub">{p.location}</div></div>
                {connected ? <span className="tiny">Connected</span> : sent ? <span className="tiny">Requested</span>
                  : <button className="btn-outline" onClick={() => dispatch({ type: 'sendConnectionRequest', personId: p.id })}>Connect</button>}
              </div>
            );
          })}
        </div></div>
      </div>
    </div>
  );
}

// A connection's profile. Note: no message / invite-to-workout action exists in the current app.
export function FriendProfileScreen({ params }: { params: { id: string } }) {
  const { state } = useStore();
  const nav = useNav();
  const p = personById(params.id);
  const acts = state.activities.filter(a => a.ownerId === p.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const weekSec = acts.filter(a => +new Date(a.date) > Date.now() - 7 * 86400000).reduce((s, a) => s + a.durationSec, 0);
  return (
    <div className="screen">
      <NavBar title={p.name} />
      <div className="scroll">
        <div style={{ textAlign: 'center', padding: '22px 16px 6px' }}>
          <Avatar person={p} size={80} />
          <div style={{ fontSize: 21, fontWeight: 700, marginTop: 10 }}>{p.name}</div>
          <div className="small muted">{p.location}</div>
          {p.bio && <div className="small muted" style={{ marginTop: 4 }}>{p.bio}</div>}
          <div className="chip" style={{ marginTop: 10 }}>{state.connections.includes(p.id) ? 'Connected' : 'Not connected'}</div>
        </div>
        <div className="pad grid-3" style={{ marginTop: 14 }}>
          <div className="card" style={{ textAlign: 'center' }}><div style={{ fontWeight: 600 }}>{acts.length}</div><div className="tiny">Activities</div></div>
          <div className="card" style={{ textAlign: 'center' }}><div style={{ fontWeight: 600 }}>{fmtDuration(weekSec)}</div><div className="tiny">Last 7 days</div></div>
          <div className="card" style={{ textAlign: 'center' }}><div style={{ fontWeight: 600 }}>{3 + p.name.length % 4}</div><div className="tiny">Badges</div></div>
        </div>
        <div className="list-header">Recent Activities</div>
        <div className="pad"><div className="list">
          {acts.map(a => (
            <button key={a.id} className="list-row" onClick={() => nav.push('activity', { id: a.id })}>
              <SportIcon type={a.type} color="var(--gc-blue)" />
              <div className="grow"><div className="title">{a.title}</div><div className="sub">{relDay(a.date)} @ {timeOf(a.date)} · {fmtDuration(a.durationSec)}</div></div>
              <ChevronRight size={18} className="chev" />
            </button>
          ))}
          {acts.length === 0 && <div className="list-row small muted">No public activities</div>}
        </div></div>
      </div>
    </div>
  );
}

export function GroupsScreen() {
  const nav = useNav();
  const groups = [
    { id: 'g1', name: 'Rice Run Club', members: 48, desc: 'Tue/Thu 6:30am from the stadium' },
    { id: 'g2', name: 'Baker College Fitness', members: 23, desc: 'Lifting + intramurals' },
  ];
  return (
    <div className="screen">
      <NavBar title="Groups" right={<button onClick={() => nav.push('placeholder', { title: 'Create Group' })} style={{ fontSize: 15 }}>Create</button>} />
      <div className="scroll"><div className="pad" style={{ paddingTop: 12 }}><div className="list">
        {groups.map(g => (
          <button key={g.id} className="list-row" onClick={() => nav.push('group', { id: g.id, name: g.name, members: g.members, desc: g.desc })}>
            <div className="avatar" style={{ width: 40, height: 40, background: '#2b3a4a' }}><Users size={20} /></div>
            <div className="grow"><div className="title">{g.name}</div><div className="sub">{g.members} members</div></div><ChevronRight size={18} className="chev" />
          </button>
        ))}
      </div></div></div>
    </div>
  );
}

export function GroupScreen({ params }: { params: { name: string; members: number; desc: string } }) {
  const { state } = useStore();
  const nav = useNav();
  const acts = state.activities.filter(a => a.ownerId !== 'me').slice(0, 4);
  return (
    <div className="screen">
      <NavBar title={params.name} />
      <div className="scroll"><div className="pad" style={{ paddingTop: 12 }}>
        <div className="card"><div style={{ fontWeight: 600 }}>{params.name}</div><div className="small muted">{params.desc}</div><div className="tiny" style={{ marginTop: 6 }}>{params.members} members · Public group</div></div>
        <div className="list-header" style={{ padding: '18px 0 6px' }}>Group Activities</div>
        <div className="list">
          {acts.map(a => (
            <button key={a.id} className="list-row" onClick={() => nav.push('activity', { id: a.id })}>
              <Avatar person={personById(a.ownerId)} size={30} /><div className="grow"><div className="title">{a.title}</div><div className="sub">{personById(a.ownerId).name} · {relDay(a.date)}</div></div>
            </button>
          ))}
        </div>
        <div className="list-header" style={{ padding: '18px 0 6px' }}>Leaderboard · Steps this week</div>
        <div className="list">
          {['peter', 'me', 'galen', 'ethan'].map((id, i) => <div key={id} className="list-row"><span className="small muted" style={{ width: 16 }}>{i + 1}</span><Avatar person={personById(id)} size={28} /><span className="grow title">{id === 'me' ? 'You' : personById(id).name}</span><span className="small">{(72000 - i * 9100).toLocaleString()}</span></div>)}
        </div>
      </div></div>
    </div>
  );
}

export function DevicesScreen() {
  const { state, startSync } = useStore();
  const d = state.device;
  const syncing = state.sync.status === 'syncing';
  return (
    <div className="screen">
      <NavBar title="Garmin Devices" />
      <div className="scroll"><div className="pad" style={{ paddingTop: 14 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 90, height: 90, borderRadius: 45, margin: '6px auto 10px', background: '#111', border: '6px solid #3a3c40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Watch size={34} color="var(--gc-blue)" /></div>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{d.name}</div>
          <div className="small muted" style={{ marginTop: 4 }}>{syncing ? `Syncing… ${state.sync.progress}%` : `Last synced ${relDay(d.lastSync).toLowerCase()} at ${timeOf(d.lastSync)}`}</div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <span className="chip">Battery {d.battery}%</span><span className="chip">Software {d.firmware}</span>
          </div>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={startSync} disabled={syncing}>
            <span className="row" style={{ justifyContent: 'center', gap: 8 }}><RefreshCw size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing' : 'Sync Now'}</span>
          </button>
        </div>
        <div className="list" style={{ marginTop: 12 }}>
          {['Activities & App Management', 'Watch Faces', 'Appearance', 'Sensors & Accessories', 'Notifications & Alerts', 'Health & Wellness Settings', 'System', 'About'].map(x => (
            <div key={x} className="list-row"><span className="grow title">{x}</span><ChevronRight size={18} className="chev" /></div>
          ))}
        </div>
      </div></div>
    </div>
  );
}

// Training & Planning: where Garmin Coach and Strength workouts live today (Ethan didn't know these existed).
export function TrainingScreen() {
  const nav = useNav();
  return (
    <div className="screen">
      <NavBar title="Training & Planning" />
      <div className="scroll"><div className="pad" style={{ paddingTop: 12 }}>
        <div className="list">
          {[['Training Plans', CalendarCheck], ['Garmin Coach', Medal], ['Workouts', Dumbbell], ['Courses', Route], ['Training Status', GaugeIcon]].map(([t, I]) => {
            const Icon = I as React.ComponentType<any>;
            return (
              <button key={t as string} className="list-row" onClick={() => t === 'Workouts' ? nav.push('workouts') : nav.push('placeholder', { title: t })}>
                <Icon size={20} color="var(--gc-blue)" /><span className="grow title">{t as string}</span><ChevronRight size={18} className="chev" />
              </button>
            );
          })}
        </div>
      </div></div>
    </div>
  );
}

export function WorkoutsScreen() {
  const { dispatch } = useStore();
  const ws: [string, 'strength' | 'run' | 'bike', string][] = [
    ['Full Body Strength', 'strength', '8 exercises · 45 min'], ['Upper Body Push', 'strength', '6 exercises · 35 min'],
    ['Core Circuit', 'strength', '5 exercises · 20 min'], ['Easy Run 30:00', 'run', 'Zone 2 · 30 min'], ['Intervals 6x400', 'run', '6 repeats'],
  ];
  return (
    <div className="screen">
      <NavBar title="Workouts" />
      <div className="scroll"><div className="pad" style={{ paddingTop: 12 }}><div className="list">
        {ws.map(([n, t, d]) => (
          <div key={n} className="list-row">
            <SportIcon type={t} color="var(--gc-blue)" /><div className="grow"><div className="title">{n}</div><div className="sub">{d}</div></div>
            <button className="btn-outline" onClick={() => dispatch({ type: 'toast', text: 'Sent to Forerunner 265' })}>Send</button>
          </div>
        ))}
      </div></div></div>
    </div>
  );
}
