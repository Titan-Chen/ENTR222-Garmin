import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { navControl } from '../phone/nav';
import { buddyStore } from '../features/buddy-strip/buddyStore';
import { sendIncomingInvite } from '../features/buddy-strip/BuddyStageControls';

// USER TEST PANEL (moderator only). Steps follow the team's "Garmin Connect Workout Buddy User Test Plan"
// (Revised User Test Plan tab in the Google Doc). Opened from the "User test" button above the devices.
// Hide it while the participant is looking at the screen.

type Dispatch = ReturnType<typeof useStore>['dispatch'];
interface Ctx { dispatch: Dispatch; prepare: () => void }
interface Action { label: string; run: (c: Ctx) => void }
interface Step { title: string; prompt?: string; notes: string[]; actions?: Action[] }

export const SCENARIO = 'Easy lift today at 6 p.m. at the Rice Rec Center';

const goHome = () => { navControl.current?.goRoot('home'); document.querySelector('.phone-screen .scroll')?.scrollTo({ top: 0 }); };

const STEPS: Step[] = [
  {
    title: 'Before the session',
    notes: [
      'Prepare the session: resets the demo, starts on Home and skips the automatic “Both ready” banner and watch alert, so the participant makes their own first choice.',
      'Read the context: “Imagine you want to work out with a friend later today… Think aloud and tell us what you would actually do. The accounts and replies are fictional.”',
      `Use the same scenario with everyone: ${SCENARIO}.`,
    ],
    actions: [{ label: 'Prepare session', run: c => c.prepare() }],
  },
  { title: 'Warm-up', prompt: 'Tell me about the last time you opened Garmin Connect. What were you trying to do?', notes: [] },
  { title: 'Warm-up', prompt: 'Tell me about the last time you arranged a workout with someone. What did you need to find out before making the plan?', notes: [] },
  {
    title: 'Choose a friend',
    prompt: 'You want to do an easy lift today at 6 p.m. at the Rice Rec Center. Assume you know the friends shown equally well. Starting here, who, if anyone, would you invite, and what would you do first?',
    notes: ['Let them explore Home. Record their first action and who they choose before pointing out any feature.', 'Fits an easy lift: Peter (Go light). Ethan and Galen are Go hard.'],
    actions: [{ label: 'Go to Home', run: goHome }],
  },
  {
    title: 'Why that friend',
    prompt: 'What influenced your choice? Is there anything you’d want to ask before sending the invite?',
    notes: ['Record whether they mention readiness on their own, and whether they would ask how the friend feels, propose the workout directly, or do something else.'],
  },
  {
    title: 'Readiness labels',
    prompt: 'What do the readiness labels tell you about your friends? What else would you want to know before counting on someone to join?',
    notes: ['If they haven’t found the labels yet, show “Work out together” in the Daily Readiness card at the top of Home and mark that they needed help.'],
    actions: [{ label: 'Show buddy readiness', run: goHome }],
  },
  {
    title: 'Send the invite',
    prompt: 'Show me how you’d send the invitation.',
    notes: ['Let them invite their chosen friend (tap a buddy, then Invite). If they passed or prefer to text outside the app, record that, then ask them to try a sample invitation to Peter.'],
    actions: [{ label: 'Open sample invite to Peter', run: () => { goHome(); buddyStore.openSheet('invite', 'peter'); } }],
  },
  {
    title: 'Did they agree?',
    prompt: 'Has your friend agreed to the plan? Show me how you know.',
    notes: ['The friend replies a few seconds after the invite is sent (anyone on Recover declines). Record whether they notice the reply and can tell the plan is confirmed.'],
  },
  {
    title: 'Find the plan',
    prompt: 'Where would you check the time and place later?',
    notes: ['Ask this if the friend accepted. The plan is on the Calendar (time and place) and in the Daily Readiness card.'],
    actions: [{ label: 'Open Calendar', run: () => navControl.current?.goRoot('calendar') }],
  },
  { title: 'Privacy', prompt: 'Who do you think can see your workout suggestion? What would you be comfortable sharing with friends?', notes: ['Sharing can be turned off under Work out together → Edit.'] },
  {
    title: 'Incoming invite',
    prompt: 'A workout invitation just arrived. Show me what you’d do if you got it while walking to class.',
    notes: ['Press the button, then ask the prompt. Record whether they use the watch or phone, wait, or dismiss the invite, and ask why.'],
    actions: [{ label: 'Send Ethan’s invite', run: c => sendIncomingInvite(c.dispatch) }],
  },
  { title: 'When to open the app', prompt: 'Think about the last time you planned a workout with a friend. At what point, if any, would you have opened Garmin Connect?', notes: [] },
  { title: 'Wrap-up', prompt: 'What, if anything, would make you more likely to accept a workout invitation like this from a friend?', notes: ['Afterwards, fill in one row for this participant: first action, friend chosen, whether their status fit the easy lift, what influenced the choice, invite directly or ask first, sent invite without help, understood the reply, found the plan, device used for the incoming invite.'] },
];

const STORE_KEY = 'testplan-step';
const readStep = () => { try { return Math.min(STEPS.length - 1, Math.max(0, Number(localStorage.getItem(STORE_KEY)) || 0)); } catch { return 0; } };

export function TestPlanPanel({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { dispatch } = useStore();
  const [i, setI] = useState(readStep);
  useEffect(() => { try { localStorage.setItem(STORE_KEY, String(i)); } catch { /* storage unavailable */ } }, [i]);

  const prepare = () => {
    onReset();
    buddyStore.markBothReadyPushed();   // no automatic "Both ready" banner or watch alert this session
  };
  const step = STEPS[i];

  return (
    <aside className="testplan" aria-label="User test steps">
      <div className="tp-head">
        <span><b>User test</b> · {i === 0 ? 'Setup' : `Prompt ${i} of ${STEPS.length - 1}`}</span>
        <button onClick={onClose} aria-label="Hide user test panel">Hide</button>
      </div>
      <div className="tp-scenario">Scenario: {SCENARIO}</div>
      <div className="tp-title">{step.title}</div>
      {step.prompt && <div className="tp-prompt">“{step.prompt}”</div>}
      {step.notes.map(n => <div key={n} className="tp-note">{n}</div>)}
      {step.actions && (
        <div className="tp-actions">
          {step.actions.map(a => <button key={a.label} onClick={() => a.run({ dispatch, prepare })}>{a.label}</button>)}
        </div>
      )}
      <div className="tp-nav">
        <button disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
        <select value={i} onChange={e => setI(Number(e.target.value))} aria-label="Jump to step">
          {STEPS.map((s, k) => <option key={k} value={k}>{k === 0 ? 'Setup' : `${k}. ${s.title}`}</option>)}
        </select>
        <button disabled={i === STEPS.length - 1} onClick={() => setI(i + 1)}>Next →</button>
      </div>
    </aside>
  );
}
