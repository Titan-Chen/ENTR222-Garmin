import { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { NavBar } from '../../components/common';
import { AreaLine, Bars, Gauge, Ring, SleepStages, StressBars } from '../../components/charts';
import { healthHistory, todayHealth, intradaySeries, weeklyIntensityGoal } from '../../data/health';
import { fmtHrMin, weekdayLetter, shortDate } from '../../data/dates';
import { METRICS, type MetricId } from '../metrics';
import { Slot } from '../../slots';

const RANGES = ['Day', '7 Days', '4 Weeks'];

// One detail screen per metric, same skeleton as the app: Day / 7 Days / 4 Weeks, hero reading, chart,
// breakdown stats, then "About" explanatory text.
export function MetricDetailScreen({ params }: { params: { id: MetricId; range?: number } }) {
  const m = METRICS[params.id];
  const [range, setRange] = useState(params.range ?? 0);
  const [about, setAbout] = useState(false);
  const week = healthHistory.slice(-7);
  const labels = week.map(d => weekdayLetter(d.date));
  const t = todayHealth;
  // For 4 Weeks we only have 14 days of history; show 2 weeks of bars + placeholder older weeks.
  const longVals = (pick: (d: typeof t) => number) => healthHistory.map(pick);

  return (
    <div className="screen">
      <NavBar title={m.name} right={<button onClick={() => setAbout(a => !a)} aria-label="About"><Info size={21} /></button>} />
      <div className="seg">{RANGES.map((r, i) => <button key={r} className={i === range ? 'on' : ''} onClick={() => setRange(i)}>{r}</button>)}</div>
      <div className="between pad" style={{ marginBottom: 6 }}>
        <ChevronLeft size={20} color="var(--gc-blue)" />
        <span className="small muted">{range === 0 ? 'Today' : range === 1 ? `${shortDate(week[0].date)} – ${shortDate(week[6].date)}` : `${shortDate(healthHistory[0].date)} – Today`}</span>
        <ChevronRight size={20} color="var(--gc-text-3)" />
      </div>
      <div className="scroll">
        {about && <div className="pad"><div className="card small muted" style={{ marginBottom: 10 }}>{m.about}</div></div>}
        <div className="pad">
          {params.id === 'steps' && (
            <>
              <div className="card" style={{ textAlign: 'center' }}>
                {range === 0 ? (
                  <>
                    <Ring value={t.steps} max={t.stepGoal} size={170} stroke={12} color="var(--m-steps)">
                      <div className="huge-num" style={{ fontSize: 38 }}>{t.steps.toLocaleString()}</div>
                      <div className="tiny">Goal {t.stepGoal.toLocaleString()}</div>
                    </Ring>
                    <div style={{ marginTop: 16 }}><Bars values={hourly(t.steps)} color="#11a9ed" height={90} highlightLast={false} labels={['12a', '', '', '6a', '', '', '12p', '', '', '6p', '', '']} /></div>
                  </>
                ) : (
                  <>
                    <div className="big-num">{Math.round((range === 1 ? week : healthHistory).reduce((a, d) => a + d.steps, 0) / (range === 1 ? 7 : 14)).toLocaleString()}</div>
                    <div className="tiny" style={{ marginBottom: 12 }}>Daily average</div>
                    <Bars values={range === 1 ? week.map(d => d.steps) : longVals(d => d.steps)} goal={9000} color="#11a9ed" labels={range === 1 ? labels : undefined} />
                  </>
                )}
              </div>
              <Stats rows={[['Distance', `${(t.steps / 2100).toFixed(2)} mi`], ['Floors Climbed', String(t.floorsClimbed)], ['Step Goal', t.stepGoal.toLocaleString()]]} />
            </>
          )}

          {params.id === 'sleep' && (
            <>
              <div className="card">
                {range === 0 ? (
                  <>
                    <Gauge value={t.sleepScore} color="var(--m-sleep)" label={t.sleepQuality} sub="Sleep Score" />
                    <div className="between" style={{ margin: '10px 0 8px' }}><span className="small">{fmtHrMin(t.sleepSec)}</span><span className="tiny">{t.bedtime} – {t.wake}</span></div>
                    <SleepStages stages={t.sleepStagesMin} />
                    <div className="grid-2" style={{ marginTop: 14, rowGap: 8 }}>
                      {(['deep', 'light', 'rem', 'awake'] as const).map(k => (
                        <div key={k} className="row" style={{ gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: `var(--m-sleep-${k})` }} />
                          <span className="small" style={{ textTransform: k === 'rem' ? 'uppercase' : 'capitalize' }}>{k}</span>
                          <span className="small muted" style={{ marginLeft: 'auto' }}>{fmtHrMin(t.sleepStagesMin[k] * 60)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="big-num">{Math.round((range === 1 ? week : healthHistory).reduce((a, d) => a + d.sleepScore, 0) / (range === 1 ? 7 : 14))}</div>
                    <div className="tiny" style={{ marginBottom: 12 }}>Average sleep score</div>
                    <Bars values={(range === 1 ? week : healthHistory).map(d => d.sleepScore)} color="#7b61ff" labels={range === 1 ? labels : undefined} />
                  </>
                )}
              </div>
              <div className="card" style={{ marginTop: 10 }}>
                <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Sleep Score Factors</div>
                {[['Sleep Duration', t.sleepSec > 27000 ? 'Good' : 'Fair'], ['Stress', 'Excellent'], ['Deep Sleep', t.sleepStagesMin.deep > 80 ? 'Good' : 'Fair'], ['REM Sleep', 'Good'], ['Restlessness', 'Fair']].map(([k, v]) => (
                  <div key={k} className="between small" style={{ padding: '7px 0', borderTop: '1px solid var(--gc-separator)' }}><span>{k}</span><span className="muted">{v}</span></div>
                ))}
              </div>
              <Stats rows={[['Avg Overnight HRV', `${t.hrvOvernight} ms`], ['Resting Heart Rate', `${t.restingHr} bpm`], ['Body Battery Change', `+${t.bodyBatteryCharged}`], ['Avg SpO2', '96%'], ['Avg Respiration', '14 brpm']]} />
            </>
          )}

          {params.id === 'bodyBattery' && (
            <>
              <div className="card">
                {range === 0 ? (
                  <>
                    <div className="row"><div className="huge-num" style={{ color: 'var(--m-body-battery)' }}>{t.bodyBatteryLow}</div><div className="tiny">Current</div></div>
                    <div style={{ marginTop: 12 }}><AreaLine values={intradaySeries('bodyBattery')} color="#1fa0ff" height={150} min={0} max={100} axis={['12a', '6a', '12p', 'Now']} /></div>
                  </>
                ) : (
                  <>
                    <div className="small muted" style={{ marginBottom: 10 }}>Daily high and low</div>
                    <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      {(range === 1 ? week : healthHistory).map(d => (
                        <div key={d.date} style={{ flex: 1, height: '100%', position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${d.bodyBatteryLow}%`, height: `${d.bodyBatteryHigh - d.bodyBatteryLow}%`, background: '#1fa0ff', borderRadius: 3 }} />
                        </div>
                      ))}
                    </div>
                    {range === 1 && <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{labels.map((l, i) => <span key={i} className="tiny" style={{ flex: 1, textAlign: 'center' }}>{l}</span>)}</div>}
                  </>
                )}
              </div>
              <Stats rows={[['Charged', `+${t.bodyBatteryCharged}`], ['Drained', `−${t.bodyBatteryDrained}`], ['Highest', String(t.bodyBatteryHigh)], ['Lowest', String(t.bodyBatteryLow)]]} />
            </>
          )}

          {params.id === 'stress' && (
            <>
              <div className="card">
                {range === 0 ? (
                  <>
                    <div className="row"><div className="huge-num">{t.stressAvg}</div><div><div style={{ fontWeight: 600 }}>{METRICS.stress.sub()}</div><div className="tiny">Overall stress level</div></div></div>
                    <Slot name="metric.stress" />
                    <div style={{ marginTop: 14 }}><StressBars values={intradaySeries('stress', 96)} /></div>
                    <div className="between tiny" style={{ marginTop: 4 }}><span>12a</span><span>6a</span><span>12p</span><span>Now</span></div>
                  </>
                ) : (
                  <>
                    <div className="big-num">{Math.round((range === 1 ? week : healthHistory).reduce((a, d) => a + d.stressAvg, 0) / (range === 1 ? 7 : 14))}</div>
                    <div className="tiny" style={{ marginBottom: 12 }}>Average stress</div>
                    <Bars values={(range === 1 ? week : healthHistory).map(d => d.stressAvg)} color="#ff9f3d" labels={range === 1 ? labels : undefined} />
                  </>
                )}
              </div>
              <div className="card" style={{ marginTop: 10 }}>
                <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>Stress Duration</div>
                <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ flex: 9.2, background: 'var(--m-stress-rest)' }} /><div style={{ flex: 6.1, background: 'var(--m-stress-low)' }} />
                  <div style={{ flex: 2.4, background: 'var(--m-stress-med)' }} /><div style={{ flex: 0.6, background: 'var(--m-stress-high)' }} />
                </div>
                {[['Rest', '9h 12m', 'rest'], ['Low', '6h 06m', 'low'], ['Medium', '2h 24m', 'med'], ['High', '36m', 'high']].map(([k, v, c]) => (
                  <div key={k} className="between small" style={{ padding: '7px 0' }}>
                    <span className="row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: `var(--m-stress-${c})` }} />{k}</span><span className="muted">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {params.id === 'hrv' && (
            <>
              <div className="card">
                <div className="row"><div className="huge-num">{t.hrvOvernight}<span className="unit">ms</span></div><div><div style={{ fontWeight: 600, color: 'var(--m-hrv)' }}>{t.hrvStatus}</div><div className="tiny">Last night avg</div></div></div>
                <div style={{ position: 'relative', marginTop: 14 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 30, height: 50, background: 'rgba(48,199,123,.12)', borderRadius: 4 }} />
                  <AreaLine values={(range === 0 ? week : range === 1 ? week : healthHistory).map(d => d.hrvOvernight)} color="#30c77b" height={130} min={50} max={80} fill={false} />
                </div>
                <div className="tiny" style={{ marginTop: 6 }}>Shaded band = your baseline (61–76 ms)</div>
              </div>
              <Stats rows={[['7-Day Avg', `${Math.round(week.reduce((a, d) => a + d.hrvOvernight, 0) / 7)} ms`], ['Baseline', '61–76 ms'], ['Last Night 5-Min High', `${t.hrvOvernight + 31} ms`]]} />
            </>
          )}

          {params.id === 'hr' && (
            <>
              <div className="card">
                <div className="row"><div className="huge-num">{t.restingHr}<span className="unit">bpm</span></div><div className="tiny">Resting</div></div>
                <div style={{ marginTop: 14 }}>
                  {range === 0
                    ? <AreaLine values={intradaySeries('hr')} color="#e5304c" height={140} axis={['12a', '6a', '12p', 'Now']} />
                    : <Bars values={(range === 1 ? week : healthHistory).map(d => d.restingHr)} color="#e5304c" labels={range === 1 ? labels : undefined} />}
                </div>
              </div>
              <Stats rows={[['Resting', `${t.restingHr} bpm`], ['High', '154 bpm'], ['7-Day Avg Resting', `${Math.round(week.reduce((a, d) => a + d.restingHr, 0) / 7)} bpm`]]} />
            </>
          )}

          {params.id === 'intensity' && (
            <>
              <div className="card" style={{ textAlign: 'center' }}>
                <Ring value={week.reduce((a, d) => a + d.intensityMin, 0)} max={weeklyIntensityGoal} size={160} stroke={12} color="var(--m-intensity)">
                  <div className="huge-num" style={{ fontSize: 38 }}>{week.reduce((a, d) => a + d.intensityMin, 0)}</div>
                  <div className="tiny">of {weeklyIntensityGoal}</div>
                </Ring>
                <div style={{ marginTop: 16 }}><Bars values={week.map(d => d.intensityMin)} color="#f5a623" labels={labels} /></div>
              </div>
              <Stats rows={[['Moderate', `${Math.round(week.reduce((a, d) => a + d.intensityMin, 0) * 0.55)} min`], ['Vigorous', `${Math.round(week.reduce((a, d) => a + d.intensityMin, 0) * 0.225)} min (×2)`]]} />
            </>
          )}

          {params.id === 'calories' && (
            <>
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="huge-num">{(t.activeCalories + t.restingCalories).toLocaleString()}</div>
                <div className="tiny" style={{ marginBottom: 12 }}>Total calories burned</div>
                <Bars values={week.map(d => d.activeCalories + d.restingCalories)} color="#ff5a36" labels={labels} />
              </div>
              <Stats rows={[['Resting', `${t.restingCalories}`], ['Active', `${t.activeCalories}`], ['Consumed', '-- (log food in a connected app)']]} />
            </>
          )}

          {params.id === 'readiness' && (
            <>
              <div className="card">
                <Gauge value={t.trainingReadiness} color="var(--m-readiness)" label={METRICS.readiness.sub()} sub="Training Readiness" />
                <div className="small muted" style={{ textAlign: 'center', marginTop: 4 }}>You're well recovered and ready for a normal training day.</div>
              </div>
              <div className="card" style={{ marginTop: 10 }}>
                {[['Sleep Score', `${t.sleepScore} · Good`], ['Recovery Time', '14 hrs · Moderate'], ['HRV Status', `${t.hrvStatus}`], ['Acute Load', '412 · Good'], ['Sleep History', 'Good'], ['Stress History', 'Good']].map(([k, v]) => (
                  <div key={k} className="between small" style={{ padding: '8px 0', borderBottom: '1px solid var(--gc-separator)' }}><span>{k}</span><span className="muted">{v}</span></div>
                ))}
              </div>
            </>
          )}

          {params.id === 'floors' && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="huge-num">{t.floorsClimbed}</div><div className="tiny" style={{ marginBottom: 12 }}>Floors climbed today</div>
              <Bars values={week.map(d => d.floorsClimbed)} color="#30c77b" labels={labels} goal={10} />
            </div>
          )}

          <div className="list-header" style={{ padding: '22px 0 6px' }}>About {m.name}</div>
          <div className="small muted" style={{ lineHeight: 1.5 }}>{m.about}</div>
        </div>
      </div>
    </div>
  );
}

function Stats({ rows }: { rows: [string, string][] }) {
  return (
    <div className="list" style={{ marginTop: 10 }}>
      {rows.map(([k, v]) => <div key={k} className="list-row"><div className="grow title small">{k}</div><span className="small muted">{v}</span></div>)}
    </div>
  );
}

function hourly(total: number): number[] {
  const shape = [0, 0, 0, 0, 0, 0, 0, 2, 9, 7, 5, 6, 8, 5, 4, 6, 9, 0, 0, 0, 0, 0, 0, 0];
  const sum = shape.reduce((a, b) => a + b, 0);
  const now = new Date().getHours();
  return shape.slice(0, 24).map((s, i) => (i <= now ? Math.round((s / sum) * total * 1.6) : 0)).filter((_, i) => i % 2 === 0);
}
