import { useStore } from '../../store';
import { isOn } from '../../features';
import { buddyStore, WHEN_OPTIONS, PLACES, inviteMessage } from './buddyStore';
import { respondToInvite } from './BuddyStrip';
import { fireBothReadyRef } from './BuddyOverlay';

// Demo buttons in the bar above the devices (slot: stage.controls). These simulate things that
// would come from a friend's phone in real life, so testers can try receiving an invite on the watch.
export function BuddyStageControls() {
  const { dispatch } = useStore();

  const incomingInvite = () => {
    const when = WHEN_OPTIONS[1];
    const activity = 'Pickup basketball';
    const id = `in${Date.now()}`;
    buddyStore.addInvite({ id, personId: 'ethan', direction: 'in', activity, when, place: PLACES[2], message: inviteMessage(activity, when), status: 'incoming' });
    dispatch({
      type: 'pushWatchNotification',
      notification: {
        id: `w${id}`, app: 'Workout invite', from: 'Ethan Larimore', text: `${inviteMessage(activity, when)} ${PLACES[2]}`,
        actions: ['Accept', 'Decline'], onAction: a => respondToInvite(id, a as 'Accept' | 'Decline'),
      },
    });
    buddyStore.showBanner({
      id: `b${id}`, title: 'Ethan invited you to work out', body: `${activity} · ${when.label} · ${PLACES[2]}`,
      actions: [{ label: 'Accept', run: () => respondToInvite(id, 'Accept') }, { label: 'Decline', run: () => respondToInvite(id, 'Decline') }],
    });
  };

  return (
    <>
      <button onClick={incomingInvite}>Ethan invites you to work out</button>
      {isOn('bothReady') && <button onClick={() => fireBothReadyRef()}>Show “Both ready” alert</button>}
    </>
  );
}
