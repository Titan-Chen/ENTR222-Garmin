import type { Badge, Challenge, Device } from './types';
import { daysAgo } from './dates';

export const seedChallenges: Challenge[] = [
  {
    id: 'c1', title: 'Weekend Warrior', kind: 'steps', status: 'active',
    startDate: daysAgo(4).toISOString(), endDate: daysAgo(-3).toISOString(),
    description: 'Most steps Friday–Sunday wins.', createdBy: 'peter',
    participants: [{ personId: 'peter', value: 38410 }, { personId: 'me', value: 31207 }, { personId: 'ethan', value: 22950 }],
  },
  {
    id: 'c2', title: 'November Ride 300', kind: 'distance', status: 'available',
    startDate: daysAgo(11).toISOString(), endDate: daysAgo(-18).toISOString(),
    description: 'Ride 300 miles in November to earn the badge.',
    participants: [],
  },
  {
    id: 'c3', title: 'Weekly Step Challenge', kind: 'steps', status: 'available',
    startDate: daysAgo(-1).toISOString(), endDate: daysAgo(-8).toISOString(),
    description: 'Compete against Garmin users who average a similar step count. Starts Monday.',
    participants: [],
  },
];

export const badges: Badge[] = [
  { id: 'b1', name: 'Step Up 10K', earned: true, earnedDate: daysAgo(9).toISOString(), points: 2, icon: 'footprints', color: '#11a9ed' },
  { id: 'b2', name: 'Weekend Warrior', earned: true, earnedDate: daysAgo(30).toISOString(), points: 4, icon: 'flame', color: '#f5a623' },
  { id: 'b3', name: 'Early Bird', earned: true, earnedDate: daysAgo(3).toISOString(), points: 2, icon: 'sunrise', color: '#ff7a45' },
  { id: 'b4', name: 'Sleep Streak 7', earned: false, points: 4, icon: 'moon', color: '#7b61ff' },
  { id: 'b5', name: 'Strength 25', earned: false, points: 8, icon: 'dumbbell', color: '#30c77b' },
  { id: 'b6', name: 'Night Owl', earned: true, earnedDate: daysAgo(4).toISOString(), points: 1, icon: 'moon', color: '#3a7bd5' },
];

export const levelInfo = { level: 3, points: 41, nextLevelPoints: 60 };

export const seedDevice: Device = {
  id: 'fr265', name: 'Forerunner 265', battery: 62, lastSync: daysAgo(0, 7, 52).toISOString(), firmware: '22.18',
};

// More tab structure (current app). TODO verify against screenshot: order/labels change between app versions.
export const moreMenu: { section: string; items: string[] }[] = [
  { section: '', items: ['Garmin Devices', 'Connect IQ Store', 'Activities & Apps', 'Performance Stats', 'Health Stats', 'Training & Planning', 'Insights', 'Garmin Coach', 'Connections', 'Groups', 'Badges & Records', 'Gear', 'Safety & Tracking', 'Garmin Pay', 'Settings', 'Help & Support'] },
];
