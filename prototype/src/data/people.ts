import type { Person } from './types';

// Alex is the primary persona from the PRD (busy multi-sport Rice student).
export const me: Person = {
  id: 'me',
  name: 'Alex Rivera',
  initials: 'AR',
  color: '#3a7bd5',
  location: 'Houston, TX',
  bio: 'Rice ’28 · lifting, pickup hoops, the occasional run',
};

// Friends are based on the ethnographic interviewees + the Joe persona.
export const friends: Person[] = [
  { id: 'ethan', name: 'Ethan Larimore', initials: 'EL', color: '#c0392b', location: 'Houston, TX', bio: 'Lifting 3x/week, basketball' },
  { id: 'galen', name: 'Galen Liu', initials: 'GL', color: '#16a085', location: 'Houston, TX', bio: 'Training for Beer Bike 🚴' },
  { id: 'peter', name: 'Peter Golovakov', initials: 'PG', color: '#8e44ad', location: 'Houston, TX', bio: 'Pickup sports, ex-XC' },
  { id: 'joe', name: 'Joe Martin', initials: 'JM', color: '#d35400', location: 'Dallas, TX', bio: 'Desk job, trying to walk more' },
];

// People you could add as connections (search results in Connections).
export const suggestedPeople: Person[] = [
  { id: 'olivia', name: 'Olivia Qiu', initials: 'OQ', color: '#2980b9', location: 'Houston, TX' },
  { id: 'michael', name: 'Michael Zito', initials: 'MZ', color: '#27ae60', location: 'Houston, TX' },
  { id: 'sara', name: 'Sara Kalra', initials: 'SK', color: '#e84393', location: 'Houston, TX' },
  { id: 'titan', name: 'Titan Chen', initials: 'TC', color: '#f39c12', location: 'Houston, TX' },
];

export const allPeople: Person[] = [me, ...friends, ...suggestedPeople];

export function personById(id: string): Person {
  return allPeople.find(p => p.id === id) ?? me;
}
