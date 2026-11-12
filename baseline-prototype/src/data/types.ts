// Shared types for all mock data. Components never hard-code numbers: they read these.

export type SportType = 'run' | 'bike' | 'strength' | 'basketball' | 'walk' | 'football';

export interface Person {
  id: string;
  name: string;
  initials: string;
  color: string; // avatar background
  location?: string;
  bio?: string;
}

export interface Split {
  label: string;      // "1", "2"... (km/mi) or "Set 1"
  time: string;       // "8:41"
  pace?: string;      // "8:41 /mi"
  avgHr?: number;
}

export interface Activity {
  id: string;
  ownerId: string;          // 'me' or a friend id
  type: SportType;
  title: string;            // e.g. "Houston Running"
  date: string;             // ISO date-time
  durationSec: number;
  distanceMi?: number;
  avgPace?: string;         // "8:42 /mi"
  avgSpeedMph?: number;
  elevGainFt?: number;
  avgHr: number;
  maxHr: number;
  calories: number;
  trainingEffect?: { aerobic: number; anaerobic: number; label: string };
  hrZonesMin: number[];     // minutes in zones 1..5
  splits?: Split[];
  sets?: number;            // strength only (often unlogged in the real app)
  reps?: number;
  route?: [number, number][]; // normalized 0..1 points for the map placeholder
  likes: string[];          // person ids
  comments: { personId: string; text: string }[];
  device: string;
}

export interface DayHealth {
  date: string;             // ISO date (yyyy-mm-dd)
  steps: number;
  stepGoal: number;
  sleepScore: number;
  sleepQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  sleepSec: number;
  sleepStagesMin: { deep: number; light: number; rem: number; awake: number };
  bedtime: string;          // "12:41 AM"
  wake: string;             // "7:52 AM"
  bodyBatteryHigh: number;
  bodyBatteryLow: number;
  bodyBatteryCharged: number;
  bodyBatteryDrained: number;
  stressAvg: number;
  restingHr: number;
  hrvOvernight: number;     // ms
  hrvStatus: 'Balanced' | 'Unbalanced' | 'Low';
  intensityMin: number;
  activeCalories: number;
  restingCalories: number;
  trainingReadiness: number;
  floorsClimbed: number;
}

export interface Challenge {
  id: string;
  title: string;
  kind: 'steps' | 'distance' | 'badge';
  status: 'active' | 'available' | 'completed';
  startDate: string;
  endDate: string;
  participants: { personId: string; value: number }[];
  description: string;
  createdBy?: string;
}

export interface Badge {
  id: string;
  name: string;
  earned: boolean;
  earnedDate?: string;
  points: number;
  icon: string; // lucide icon name hint
  color: string;
}

export interface Device {
  id: string;
  name: string;
  battery: number;   // %
  lastSync: string;  // ISO date-time
  firmware: string;
}
