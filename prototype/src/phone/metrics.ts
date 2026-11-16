import { healthHistory, todayHealth } from '../data/health';
import { fmtHrMin } from '../data/dates';

// Metric definitions shared by At a Glance cards, Edit Home and detail screens.
export type MetricId = 'steps' | 'sleep' | 'bodyBattery' | 'stress' | 'hrv' | 'hr' | 'intensity' | 'calories' | 'readiness' | 'floors';

export interface MetricDef {
  id: MetricId;
  name: string;
  color: string;
  value: () => string;
  unit?: string;
  sub: () => string;
  about: string;
}

const t = todayHealth;
const weekIntensity = healthHistory.slice(-7).reduce((a, d) => a + d.intensityMin, 0);

export const METRICS: Record<MetricId, MetricDef> = {
  steps: {
    id: 'steps', name: 'Steps', color: 'var(--m-steps)',
    value: () => t.steps.toLocaleString(), sub: () => `Goal ${t.stepGoal.toLocaleString()}`,
    about: 'Your step goal adjusts automatically based on your recent activity. Reach your goal and it goes up a little; miss it and it eases back.',
  },
  sleep: {
    id: 'sleep', name: 'Sleep Score', color: 'var(--m-sleep)',
    value: () => String(t.sleepScore), sub: () => `${t.sleepQuality} · ${fmtHrMin(t.sleepSec)}`,
    about: 'Your sleep score is based on your sleep duration, stress during sleep, and how much time you spent in deep, light and REM sleep.',
  },
  bodyBattery: {
    id: 'bodyBattery', name: 'Body Battery', color: 'var(--m-body-battery)',
    // Current level = today's latest reading (bodyBatteryLow so far today).
    value: () => String(t.bodyBatteryLow), sub: () => `+${t.bodyBatteryCharged} charged · −${t.bodyBatteryDrained} drained`,
    about: 'Body Battery uses heart rate variability, stress, sleep and activity to estimate your energy reserves on a scale of 5 to 100.',
  },
  stress: {
    id: 'stress', name: 'Stress', color: 'var(--m-stress-med)',
    value: () => String(t.stressAvg), sub: () => t.stressAvg <= 25 ? 'Rest' : t.stressAvg <= 50 ? 'Low' : t.stressAvg <= 75 ? 'Medium' : 'High',
    about: 'Stress level is measured from your heart rate variability while you are inactive. Higher numbers mean more stress. Values from 0–25 are a resting state.',
  },
  hrv: {
    id: 'hrv', name: 'HRV Status', color: 'var(--m-hrv)',
    value: () => String(t.hrvOvernight), unit: 'ms', sub: () => t.hrvStatus,
    about: 'HRV Status compares your 7-day average overnight heart rate variability to your personal baseline.',
  },
  hr: {
    id: 'hr', name: 'Heart Rate', color: 'var(--m-hr)',
    value: () => String(t.restingHr), unit: 'bpm', sub: () => 'Resting',
    about: 'Resting heart rate is your lowest 30-minute average heart rate for the day.',
  },
  intensity: {
    id: 'intensity', name: 'Intensity Minutes', color: 'var(--m-intensity)',
    value: () => String(weekIntensity), sub: () => 'This week · Goal 150',
    about: 'Moderate activity counts 1 minute; vigorous activity counts 2 minutes. Health organizations recommend 150 minutes a week.',
  },
  calories: {
    id: 'calories', name: 'Calories', color: 'var(--m-calories)',
    value: () => (t.activeCalories + t.restingCalories).toLocaleString(), unit: 'kcal', sub: () => `${t.activeCalories} active`,
    about: 'Total calories include resting calories (your BMR) plus active calories burned from activity.',
  },
  readiness: {
    id: 'readiness', name: 'Training Readiness', color: 'var(--m-readiness)',
    value: () => String(t.trainingReadiness), sub: () => t.trainingReadiness >= 75 ? 'High' : t.trainingReadiness >= 50 ? 'Moderate' : 'Low',
    about: 'Training Readiness uses sleep, recovery time, HRV status, acute load, sleep history and stress history. Available on compatible devices only.',
  },
  floors: {
    id: 'floors', name: 'Floors Climbed', color: '#30c77b',
    value: () => String(t.floorsClimbed), sub: () => 'Goal 10',
    about: 'One floor is about 10 feet (3 m) of elevation gain.',
  },
};

export const DEFAULT_GLANCE: MetricId[] = ['steps', 'sleep', 'bodyBattery', 'stress', 'hrv', 'hr', 'intensity', 'calories'];
export const ALL_METRICS: MetricId[] = ['steps', 'sleep', 'bodyBattery', 'stress', 'hrv', 'hr', 'intensity', 'calories', 'readiness', 'floors'];
