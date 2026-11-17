import { useEffect, useRef, useState } from 'react';
import { X, Send, UserRound } from 'lucide-react';
import { useStore } from '../../store';
import { useNav } from '../../phone/nav';
import { Avatar, Sheet } from '../../components/common';
import { personById } from '../../data/people';
import { todayHealth } from '../../data/health';
import { isOn } from '../../features';
import { buddyStatuses } from './buddies';
import { bothReadyMatches, friendLevel } from './bothReady';
import { setRespondHandler } from './BuddyStrip';
import {
  ACTIVITIES, PLACES, WHEN_OPTIONS, buddyStore, inviteMessage, useBuddies, type Invite,
} from './buddyStore';
import { LEVEL_COLOR, LEVEL_LABEL } from '../readiness/readiness';
import { useMyReadiness } from '../readiness/myReadiness';

// Always-mounted layer over the phone (slot: phone.overlay) for the Workout Buddies feature:
//  - buddy menu + invite composer sheets
//  - iPhone-style notification banner
//  - simulated replies from friends, calendar entries, watch alerts
//  - the one-time "Both ready" notification

const first = (id: string) => personById(id).name.split(' ')[0];

// Simulated replies: friends who should rest politely decline; everyone else accepts.
const DECLINE_REPLY = "Need a rest day today, next time!";

// "Today, 6:00 PM" → "6:00 PM"
const timeOfWhen = (label: string) => label.split(', ').pop();

export function BuddyOverlay() {
  const { state, dispatch } = useStore();
  const b = useBuddies();
  const replyTimers = useRef<Set<string>>(new Set());
  const me = useMyReadiness();

  // Accept / decline an invite (used by watch actions, banner buttons and the Home card).
  const respond = (id: string, action: 'Accept' | 'Decline') => {
    const inv = buddyStore.get().invites.find(i => i.id === id);
    if (!inv || inv.status !== 'incoming') return;
    if (action === 'Accept') {
      buddyStore.updateInvite(id, { status: 'accepted' });
      dispatch({ type: 'schedule', item: { id: `inv-${id}`, date: inv.when.date, title: `${inv.activity} with ${first(inv.personId)}`, note: inv.place, time: timeOfWhen(inv.when.label) } });
      buddyStore.showBanner({ id: `ok-${id}`, title: `You're in: ${inv.activity} with ${first(inv.personId)}`, body: `${inv.when.label} · ${inv.place}. Added to your calendar.` });
    } else {
      buddyStore.updateInvite(id, { status: 'declined' });
      dispatch({ type: 'toast', text: `Declined ${first(inv.personId)}'s invite` });
    }
  };
  useEffect(() => { setRespondHandler(respond); });

  // Send an invite you composed (from the phone sheet or the watch).
  const sendInvite = (inv: Invite) => {
    buddyStore.addInvite(inv);
    dispatch({ type: 'toast', text: `Invite sent to ${first(inv.personId)}` });
  };
  useEffect(() => { sendInviteRef = sendInvite; });

  // Simulated friend replies ~4 seconds after you send an invite.
  useEffect(() => {
    for (const inv of b.invites) {
      if (inv.direction !== 'out' || inv.status !== 'sent' || replyTimers.current.has(inv.id)) continue;
      replyTimers.current.add(inv.id);
      window.setTimeout(() => {
        const current = buddyStore.get().invites.find(i => i.id === inv.id);
        if (!current || current.status !== 'sent') return;
        const name = first(inv.personId);
        if (friendLevel(inv.personId) === 'recover') {
          buddyStore.updateInvite(inv.id, { status: 'declined', reply: DECLINE_REPLY });
          buddyStore.showBanner({ id: `r-${inv.id}`, title: `${name} can't make it`, body: `“${DECLINE_REPLY}”` });
          dispatch({ type: 'pushWatchNotification', notification: { id: `w-${inv.id}`, app: 'Garmin Connect', from: name, text: `Can't make it: ${inv.activity}, ${inv.when.label}` } });
        } else {
          buddyStore.updateInvite(inv.id, { status: 'accepted', reply: "I'm in!" });
          dispatch({ type: 'schedule', item: { id: `inv-${inv.id}`, date: inv.when.date, title: `${inv.activity} with ${name}`, note: inv.place, time: timeOfWhen(inv.when.label) } });
          buddyStore.showBanner({ id: `r-${inv.id}`, title: `${name} accepted your invite`, body: `${inv.activity} · ${inv.when.label} · ${inv.place}. Added to your calendar.` });
          dispatch({ type: 'pushWatchNotification', notification: { id: `w-${inv.id}`, app: 'Garmin Connect', from: name, text: `Accepted: ${inv.message}` } });
        }
      }, 4000);
    }
  }, [b.invites, dispatch]);

  // One-time "Both ready" notification, 6 seconds after the prototype opens.
  useEffect(() => {
    if (!isOn('bothReady') || b.bothReadyPushed) return;
    const t = window.setTimeout(() => fireBothReady(), 6000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.bothReadyPushed]);

  const fireBothReady = () => {
    const s = buddyStore.get();
    const matches = bothReadyMatches(me.level, s.buddies, s.sharing)
      .filter(id => !s.invites.some(i => i.personId === id && i.status !== 'declined'));
    buddyStore.markBothReadyPushed();
    if (matches.length === 0) return;
    const id = matches[0];
    const name = first(id);
    const level = LEVEL_LABEL[me.level];
    const quick = (): Invite => {
      const when = WHEN_OPTIONS[0];
      const activity = me.level === 'hard' ? 'Pickup basketball' : 'Lift';
      return { id: `i${Date.now()}`, personId: id, direction: 'out', activity, when, place: PLACES[0], message: inviteMessage(activity, when), status: 'sent' };
    };
    buddyStore.showBanner({
      id: `br-${Date.now()}`,
      title: `You and ${name} are both ${level} today`,
      body: 'Want to work out together?',
      actions: [
        { label: 'Invite', run: () => buddyStore.openSheet('invite', id) },
        { label: 'Not now', run: () => {} },
      ],
    });
    dispatch({
      type: 'pushWatchNotification',
      notification: {
        id: `wbr-${Date.now()}`, app: 'Both ready', from: `You + ${name}`, text: `Both ${level} today`,
        actions: [`Invite ${name}`, 'Not now'],
        onAction: a => { if (a.startsWith('Invite')) sendInviteRef(quick()); },
      },
    });
  };
  useEffect(() => { fireBothReadyRef = () => { buddyStore.markBothReadyPushed(); fireBothReady(); }; });

  return (
    <>
      {b.banner && <NotificationBanner />}
      {b.sheet?.kind === 'buddy' && <BuddySheet personId={b.sheet.personId} />}
      {b.sheet?.kind === 'invite' && <InviteSheet personId={b.sheet.personId} onSend={sendInvite} />}
    </>
  );
}

// Handles used by the stage controls (outside the phone).
export let sendInviteRef: (inv: Invite) => void = () => {};
export let fireBothReadyRef: () => void = () => {};

function NotificationBanner() {
  const b = useBuddies();
  const banner = b.banner!;
  useEffect(() => {
    const t = window.setTimeout(() => buddyStore.showBanner(null), banner.actions ? 12000 : 6000);
    return () => window.clearTimeout(t);
  }, [banner.id]);
  return (
    <div role="status" style={{
      position: 'absolute', top: 52, left: 10, right: 10, zIndex: 40, background: 'rgba(44,45,48,.97)', borderRadius: 18,
      padding: '10px 12px', boxShadow: '0 10px 30px rgba(0,0,0,.55)', animation: 'bannerIn .3s cubic-bezier(.2,.8,.2,1)',
    }}>
      <style>{'@keyframes bannerIn { from { transform: translateY(-120%); } to { transform: translateY(0); } }'}</style>
      <div className="between">
        <span className="row tiny" style={{ gap: 6, letterSpacing: .3 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--gc-blue)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>G</span>
          GARMIN CONNECT · now
        </span>
        <button aria-label="Close notification" onClick={() => buddyStore.showBanner(null)}><X size={16} color="var(--gc-text-2)" /></button>
      </div>
      <div className="small" style={{ fontWeight: 700, marginTop: 6 }}>{banner.title}</div>
      <div className="small" style={{ color: 'var(--gc-text-2)', marginTop: 2 }}>{banner.body}</div>
      {banner.actions && (
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          {banner.actions.map((a, i) => (
            <button key={a.label} onClick={() => { buddyStore.showBanner(null); a.run(); }}
              style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, background: i === 0 ? 'var(--gc-blue)' : 'var(--gc-surface-3)', color: '#fff' }}>{a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tap a buddy → their status + Invite / Cheer.
function BuddySheet({ personId }: { personId: string }) {
  const { dispatch } = useStore();
  const nav = useNav();
  const b = useBuddies();
  const p = personById(personId);
  const level = friendLevel(personId)!;
  const status = buddyStatuses.find(s => s.personId === personId)!;
  const cheered = b.cheered.includes(personId);
  const name = first(personId);
  return (
    <Sheet onClose={() => buddyStore.closeSheet()}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ display: 'inline-block', borderRadius: '50%', padding: 3, border: `3px solid ${LEVEL_COLOR[level]}` }}><Avatar person={p} size={60} /></span>
        <div style={{ fontSize: 19, fontWeight: 700, marginTop: 8 }}>{p.name}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: LEVEL_COLOR[level], marginTop: 2 }}>{LEVEL_LABEL[level]} today</div>
        <div className="tiny" style={{ marginTop: 4 }}>{status.stepsToday.toLocaleString()} steps so far today</div>
      </div>
      <button className="btn-primary row" style={{ marginTop: 18, justifyContent: 'center', gap: 8 }} onClick={() => buddyStore.openSheet('invite', personId)}>
        <Send size={16} /> Invite {name} to work out
      </button>
      <button className="btn-outline" style={{ width: '100%', marginTop: 10, padding: '11px 0', fontSize: 15 }} disabled={cheered}
        onClick={() => { buddyStore.cheer(personId); dispatch({ type: 'toast', text: `👏 You cheered on ${name}!` }); buddyStore.closeSheet(); }}>
        {cheered ? '✅ Cheered today' : `👏 Cheer on ${name}`}
      </button>
      <button className="row" style={{ width: '100%', justifyContent: 'center', gap: 6, marginTop: 14, color: 'var(--gc-blue)', fontSize: 14 }}
        onClick={() => { buddyStore.closeSheet(); nav.push('friend', { id: personId }); }}>
        <UserRound size={15} /> View profile
      </button>
    </Sheet>
  );
}

// Compose "Lift with me at 6?": activity, time, place, editable message.
function InviteSheet({ personId, onSend }: { personId: string; onSend: (inv: Invite) => void }) {
  const level = friendLevel(personId)!;
  const [activity, setActivity] = useState('Lift');
  const [whenId, setWhenId] = useState(WHEN_OPTIONS[0].id);
  const [place, setPlace] = useState(PLACES[0]);
  const when = WHEN_OPTIONS.find(w => w.id === whenId)!;
  const [custom, setCustom] = useState<string | null>(null);
  const message = custom ?? inviteMessage(activity, when);
  const name = first(personId);
  const chip = (on: boolean) => ({ padding: '7px 12px', fontSize: 13, background: on ? 'var(--gc-blue)' : undefined, color: on ? '#fff' : undefined } as const);

  return (
    <Sheet onClose={() => buddyStore.closeSheet()}>
      <div className="row" style={{ gap: 10 }}>
        <Avatar person={personById(personId)} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Invite {name} to work out</div>
          <div className="tiny">{name} is <b style={{ color: LEVEL_COLOR[level] }}>{LEVEL_LABEL[level]}</b> today</div>
        </div>
      </div>

      <div className="small" style={{ fontWeight: 600, margin: '16px 0 8px' }}>Activity</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {ACTIVITIES.map(a => <button key={a} className="chip" style={chip(a === activity)} onClick={() => setActivity(a)}>{a}</button>)}
      </div>
      <div className="small" style={{ fontWeight: 600, margin: '14px 0 8px' }}>When</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {WHEN_OPTIONS.map(w => <button key={w.id} className="chip" style={chip(w.id === whenId)} onClick={() => setWhenId(w.id)}>{w.label}</button>)}
      </div>
      <div className="small" style={{ fontWeight: 600, margin: '14px 0 8px' }}>Where</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {PLACES.map(pl => <button key={pl} className="chip" style={chip(pl === place)} onClick={() => setPlace(pl)}>{pl}</button>)}
      </div>
      <div className="small" style={{ fontWeight: 600, margin: '14px 0 8px' }}>Message</div>
      <input className="text-input" value={message} onChange={e => setCustom(e.target.value)} aria-label="Invite message" />

      <button className="btn-primary row" style={{ marginTop: 16, justifyContent: 'center', gap: 8 }} disabled={!message.trim()}
        onClick={() => {
          onSend({ id: `i${Date.now()}`, personId, direction: 'out', activity, when, place, message: message.trim(), status: 'sent' });
          buddyStore.closeSheet();
        }}>
        <Send size={16} /> Send invite
      </button>
      <button style={{ width: '100%', textAlign: 'center', marginTop: 12, color: 'var(--gc-blue)', fontSize: 15 }} onClick={() => buddyStore.closeSheet()}>Cancel</button>
    </Sheet>
  );
}
