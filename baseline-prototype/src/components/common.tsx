import { ChevronLeft, ChevronRight, Dumbbell, Footprints, Bike, PersonStanding, Activity as ActivityIcon, Trophy } from 'lucide-react';
import type { Person, SportType } from '../data/types';
import { useNav } from '../phone/nav';

export function Avatar({ person, size = 36 }: { person: Person; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: person.color, fontSize: size * 0.38 }}>
      {person.initials}
    </span>
  );
}

export function SportIcon({ type, size = 20, color = 'currentColor' }: { type: SportType; size?: number; color?: string }) {
  switch (type) {
    case 'run': return <PersonStanding size={size} color={color} />; // TODO verify against screenshot: Garmin uses a runner glyph
    case 'bike': return <Bike size={size} color={color} />;
    case 'strength': return <Dumbbell size={size} color={color} />;
    case 'walk': return <Footprints size={size} color={color} />;
    case 'basketball': return <Trophy size={size} color={color} />; // TODO verify against screenshot: basketball glyph
    default: return <ActivityIcon size={size} color={color} />;
  }
}

export function NavBar({ title, back = true, right, left, noBorder }: {
  title: string; back?: boolean; right?: React.ReactNode; left?: React.ReactNode; noBorder?: boolean;
}) {
  const nav = useNav();
  return (
    <div className={`navbar${noBorder ? ' no-border' : ''}`}>
      <div className="left">
        {back && nav.canPop ? (
          <button className="nav-back" onClick={nav.pop} aria-label="Back"><ChevronLeft size={26} /></button>
        ) : left}
      </div>
      <h1>{title}</h1>
      <div className="right">{right}</div>
    </div>
  );
}

export function Row({ title, sub, left, right, onClick, chevron = true }: {
  title: React.ReactNode; sub?: React.ReactNode; left?: React.ReactNode; right?: React.ReactNode; onClick?: () => void; chevron?: boolean;
}) {
  return (
    <button className="list-row" onClick={onClick} disabled={!onClick && !chevron}>
      {left}
      <div className="grow">
        <div className="title">{title}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right}
      {chevron && onClick && <ChevronRight size={18} className="chev" />}
    </button>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="grabber" />
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}{unit && <span className="unit">{unit}</span>}</div>
      <div className="tiny">{label}</div>
    </div>
  );
}
