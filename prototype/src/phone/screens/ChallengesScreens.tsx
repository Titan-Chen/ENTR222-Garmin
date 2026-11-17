import { useState } from 'react';
import { Plus, Trophy, Footprints, Flame, Sunrise, Moon, Dumbbell, Check, Medal } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../nav';
import { NavBar, Avatar } from '../../components/common';
import { personById } from '../../data/people';
import { badges, levelInfo } from '../../data/social';
import { daysAgo, shortDate } from '../../data/dates';
import type { Challenge } from '../../data/types';
import { slotEntries } from '../../slots';

const badgeIcon: Record<string, React.ComponentType<any>> = { footprints: Footprints, flame: Flame, sunrise: Sunrise, moon: Moon, dumbbell: Dumbbell };

export function ChallengesScreen() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [seg, setSeg] = useState(0);
  const active = state.challenges.filter(c => c.status === 'active');
  const available = state.challenges.filter(c => c.status === 'available');
  const Card = slotEntries('challenges.card')[0]?.component ?? ChallengeCard;
  return (
    <div className="screen">
      <NavBar title="Challenges" back={false} right={<button onClick={() => nav.push('createChallenge')} aria-label="Create challenge"><Plus size={24} /></button>} />
      <div className="seg">{['Challenges', 'Badges'].map((s, i) => <button key={s} className={i === seg ? 'on' : ''} onClick={() => setSeg(i)}>{s}</button>)}</div>
      <div className="scroll">
        {seg === 0 ? (
          <>
            <div className="list-header">Active</div>
            <div className="pad">{active.map(c => <Card key={c.id} c={c} onClick={() => nav.push('challenge', { id: c.id })} />)}</div>
            <div className="list-header">Available</div>
            <div className="pad">
              {available.map(c => (
                <div key={c.id} className="card">
                  <div className="row">
                    <Trophy size={22} color="var(--m-intensity)" />
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{c.title}</div><div className="tiny">{c.description}</div></div>
                  </div>
                  <button className="btn-outline" style={{ marginTop: 12, width: '100%' }} onClick={() => dispatch({ type: 'joinChallenge', challengeId: c.id })}>Join</button>
                </div>
              ))}
              {available.length === 0 && <div className="card small muted">No more challenges to join right now.</div>}
            </div>
          </>
        ) : (
          <>
            <div className="pad" style={{ marginTop: 6 }}>
              <div className="card">
                <div className="between"><b>Level {levelInfo.level}</b><span className="tiny">{levelInfo.points} / {levelInfo.nextLevelPoints} pts</span></div>
                <div style={{ height: 8, background: '#2e2f31', borderRadius: 4, marginTop: 10 }}><div style={{ height: '100%', width: `${(levelInfo.points / levelInfo.nextLevelPoints) * 100}%`, background: 'var(--gc-blue)', borderRadius: 4 }} /></div>
              </div>
            </div>
            <div className="pad grid-3" style={{ marginTop: 12 }}>
              {badges.map(b => {
                const Icon = badgeIcon[b.icon] ?? Medal;
                return (
                  <div key={b.id} style={{ textAlign: 'center', opacity: b.earned ? 1 : 0.35 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 36, margin: '0 auto', background: b.earned ? b.color : '#2e2f31', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={30} color="#fff" /></div>
                    <div className="small" style={{ marginTop: 6 }}>{b.name}</div>
                    <div className="tiny">{b.earned ? shortDate(b.earnedDate!) : `${b.points} pts`}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({ c, onClick }: { c: Challenge; onClick: () => void }) {
  const sorted = [...c.participants].sort((a, b) => b.value - a.value);
  return (
    <button className="card" onClick={onClick}>
      <div className="between"><b>{c.title}</b><span className="tiny">Ends {shortDate(c.endDate)}</span></div>
      <div className="row" style={{ marginTop: 10 }}>
        {sorted.slice(0, 4).map((p, i) => (
          <div key={p.personId} className="row" style={{ gap: 6 }}>
            <span className="tiny">{i + 1}</span><Avatar person={personById(p.personId)} size={26} />
          </div>
        ))}
      </div>
    </button>
  );
}

export function ChallengeDetailScreen({ params }: { params: { id: string } }) {
  const { state } = useStore();
  const c = state.challenges.find(x => x.id === params.id);
  if (!c) return <div className="screen"><NavBar title="Challenge" /></div>;
  const sorted = [...c.participants].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map(p => p.value), 1);
  return (
    <div className="screen">
      <NavBar title={c.title} />
      <div className="scroll"><div className="pad" style={{ paddingTop: 14 }}>
        <div className="small muted">{shortDate(c.startDate)} – {shortDate(c.endDate)} · {c.kind === 'steps' ? 'Steps' : 'Distance'}</div>
        <div className="small" style={{ margin: '6px 0 14px' }}>{c.description}</div>
        <div className="list">
          {sorted.map((p, i) => (
            <div key={p.personId} className="list-row">
              <span style={{ width: 18 }} className="small muted">{i + 1}</span>
              <Avatar person={personById(p.personId)} size={32} />
              <div className="grow">
                <div className="title">{p.personId === 'me' ? 'You' : personById(p.personId).name}</div>
                <div style={{ height: 6, background: '#2e2f31', borderRadius: 3, marginTop: 6 }}><div style={{ height: '100%', width: `${(p.value / max) * 100}%`, background: 'var(--gc-blue)', borderRadius: 3 }} /></div>
              </div>
              <span className="small">{p.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div></div>
    </div>
  );
}

// Create challenge: type → name/dates → invite connections. (Current app flow, simplified.)
export function CreateChallengeScreen() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<'steps' | 'distance'>('steps');
  const [title, setTitle] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  const types: [typeof kind, string, string][] = [
    ['steps', 'Most Steps', 'Whoever takes the most steps wins.'],
    ['distance', 'Most Distance', 'Running, cycling, swimming or walking distance.'],
  ];
  const create = () => {
    dispatch({
      type: 'createChallenge',
      challenge: {
        id: `c${Date.now()}`, title: title.trim() || (kind === 'steps' ? 'Step Challenge' : 'Distance Challenge'), kind, status: 'active',
        startDate: daysAgo(-1).toISOString(), endDate: daysAgo(-8).toISOString(), createdBy: 'me',
        description: kind === 'steps' ? 'Most steps wins.' : 'Most distance wins.',
        participants: [{ personId: 'me', value: 0 }, ...invited.map(id => ({ personId: id, value: 0 }))],
      },
    });
    nav.pop();
  };
  return (
    <div className="screen">
      <NavBar title="Create Challenge" />
      <div className="scroll"><div className="pad" style={{ paddingTop: 14 }}>
        {step === 0 && (
          <>
            <div className="small muted" style={{ marginBottom: 10 }}>Choose a challenge type</div>
            <div className="list">
              {types.map(([k, name, desc]) => (
                <button key={k} className="list-row" onClick={() => { setKind(k); setStep(1); }}>
                  <div className="grow"><div className="title">{name}</div><div className="sub">{desc}</div></div>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="small muted" style={{ marginBottom: 6 }}>Challenge name</div>
            <input className="text-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'steps' ? 'Step Challenge' : 'Distance Challenge'} />
            <div className="list" style={{ marginTop: 14 }}>
              <div className="list-row"><span className="grow title">Start</span><span className="muted small">{shortDate(daysAgo(-1).toISOString())}</span></div>
              <div className="list-row"><span className="grow title">End</span><span className="muted small">{shortDate(daysAgo(-8).toISOString())}</span></div>
            </div>
            <button className="btn-primary" style={{ marginTop: 18 }} onClick={() => setStep(2)}>Next</button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="small muted" style={{ marginBottom: 10 }}>Invite connections</div>
            <div className="list">
              {state.connections.map(id => {
                const p = personById(id);
                const on = invited.includes(id);
                return (
                  <button key={id} className="list-row" onClick={() => setInvited(on ? invited.filter(x => x !== id) : [...invited, id])}>
                    <Avatar person={p} size={32} /><span className="grow title">{p.name}</span>
                    <span style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${on ? 'var(--gc-blue)' : '#5b5e62'}`, background: on ? 'var(--gc-blue)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Check size={14} />}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn-primary" style={{ marginTop: 18 }} disabled={invited.length === 0} onClick={create}>Create Challenge</button>
          </>
        )}
      </div></div>
    </div>
  );
}
