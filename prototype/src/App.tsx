import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { PhoneApp } from './phone/PhoneApp';
import { WatchApp } from './watch/WatchApp';
import { FEATURES } from './features';
import { Slot, runResetHooks } from './slots';

export default function App() {
  return (
    <StoreProvider>
      <Stage />
    </StoreProvider>
  );
}

function Stage() {
  const { dispatch } = useStore();
  const [scale, setScale] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  // Scale both devices to fit laptop / projector screens.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 70) / 880, (window.innerWidth - 40) / 1000));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const on = Object.entries(FEATURES).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="stage">
      <div className="stage-bar">
        <div>
          <strong>Garmin Connect prototype</strong>
          <span style={{ marginLeft: 10 }}>ENTR222 class project · not affiliated with Garmin · all data is made up</span>
          {on.length > 0 && <span style={{ marginLeft: 10, color: '#0b6f9c' }}>Features on: {on.join(', ')}</span>}
        </div>
        <div className="controls">
          <Slot name="stage.controls" />
          {/* A plain text message mirrored to the watch (read-only, like the real app). Workout invites with Accept / Decline come from "Ethan invites you to work out". */}
          <button title="A plain text message mirrored from the phone. It has no Accept button; use “Ethan invites you to work out” for an invite." onClick={() => dispatch({ type: 'pushWatchNotification', notification: { id: String(Date.now()), from: 'Ethan Larimore', app: 'Messages', text: 'yo you lifting today?' } })}>
            Ethan texts you (watch only)
          </button>
          <button onClick={() => { runResetHooks(); dispatch({ type: 'reset' }); setResetKey(k => k + 1); }}>Reset demo</button>
        </div>
      </div>
      <div className="stage-main">
        <div className="stage-scale" style={{ transform: `scale(${scale})` }} key={resetKey}>
          <div className="device-col">
            <WatchApp />
            <div className="device-caption">
              <b>Forerunner 265.</b> Click the side buttons or use <span className="kbd">↑</span> <span className="kbd">↓</span> <span className="kbd">Enter</span> START <span className="kbd">Esc</span> BACK <span className="kbd">L</span> LIGHT
            </div>
          </div>
          <div className="device-col">
            <PhoneApp />
          </div>
        </div>
      </div>
    </div>
  );
}
