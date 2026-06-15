interface IconProps {
  size?: number;
  className?: string;
}

export function BoomConfigIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor" className={className}>
      {/* Lattice boom arm - angled */}
      <rect x="8" y="38" width="5" height="10" rx="0.5" />
      <rect x="17" y="38" width="5" height="10" rx="0.5" />
      {/* Tower */}
      <rect x="9" y="14" width="3.5" height="26" />
      <rect x="17.5" y="14" width="3.5" height="26" />
      <rect x="12.5" y="18" width="5" height="2.5" />
      <rect x="12.5" y="24" width="5" height="2.5" />
      <rect x="12.5" y="30" width="5" height="2.5" />
      <rect x="12.5" y="36" width="5" height="2.5" />
      {/* Boom top / head */}
      <rect x="10" y="10" width="10" height="5" rx="1" />
      <circle cx="15" cy="8" r="3" />
      {/* Angle indicator arrow */}
      <path d="M26 38 L26 28 L32 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Degree symbol */}
      <circle cx="36" cy="24" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SensorJibIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 48" fill="currentColor" className={className}>
      {/* Horizontal jib lattice */}
      <rect x="2" y="12" width="44" height="3" />
      <rect x="2" y="20" width="44" height="3" />
      {/* Cross braces */}
      <rect x="8" y="15" width="2.5" height="5" />
      <rect x="16" y="15" width="2.5" height="5" />
      <rect x="24" y="15" width="2.5" height="5" />
      <rect x="32" y="15" width="2.5" height="5" />
      <rect x="40" y="15" width="2.5" height="5" />
      {/* Jib tip */}
      <rect x="46" y="10" width="3" height="15" />
      {/* Hook */}
      <rect x="46.5" y="25" width="2" height="6" />
      <path d="M45 31 Q45 35 48 35 Q51 35 51 31" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Sensor at top - antenna with circles */}
      <rect x="47" y="2" width="2" height="8" />
      <circle cx="44" cy="3" r="2.5" />
      <circle cx="52" cy="3" r="2.5" />
    </svg>
  );
}

export function SensorBoomIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 56" fill="currentColor" className={className}>
      {/* Angled boom lattice */}
      <path d="M4 44 L28 8 L32 8 L32 12 L8 48 L4 48Z" />
      {/* Cross braces on boom */}
      <rect x="10" y="32" width="7" height="2.5" transform="rotate(-55 13 33)" />
      <rect x="16" y="24" width="7" height="2.5" transform="rotate(-55 19 25)" />
      <rect x="22" y="16" width="7" height="2.5" transform="rotate(-55 25 17)" />
      {/* Boom head */}
      <circle cx="31" cy="6" r="4" />
      {/* Hook cable + hook */}
      <rect x="35" y="6" width="2" height="4" />
      <rect x="30" y="10" width="2" height="14" />
      <path d="M28 24 Q28 29 31 29 Q34 29 34 24" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Sensor unit - bottle shape with anemometer */}
      <rect x="42" y="14" width="6" height="14" rx="3" />
      <rect x="44" y="10" width="2" height="4" />
      {/* Anemometer cups */}
      <circle cx="40" cy="8" r="3" />
      <circle cx="50" cy="8" r="3" />
      <rect x="40" y="7" width="10" height="2" />
    </svg>
  );
}
