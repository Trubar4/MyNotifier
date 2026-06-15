interface CraneIconProps {
  size?: number;
  className?: string;
}

export function NeedleBoomIcon({ size = 24, className }: CraneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Needle boom - thin lattice crane arm extending right */}
      <g fill="currentColor">
        {/* Tower base */}
        <rect x="4" y="48" width="6" height="14" />
        <rect x="14" y="48" width="6" height="14" />
        {/* Tower vertical */}
        <rect x="6" y="18" width="4" height="32" />
        <rect x="14" y="18" width="4" height="32" />
        {/* Tower cross braces */}
        <rect x="10" y="22" width="4" height="3" />
        <rect x="10" y="30" width="4" height="3" />
        <rect x="10" y="38" width="4" height="3" />
        <rect x="10" y="46" width="4" height="3" />
        {/* Boom arm - thin, extending right */}
        <rect x="18" y="16" width="38" height="3" />
        <rect x="18" y="22" width="38" height="3" />
        {/* Boom cross braces */}
        <rect x="22" y="19" width="3" height="3" />
        <rect x="30" y="19" width="3" height="3" />
        <rect x="38" y="19" width="3" height="3" />
        <rect x="46" y="19" width="3" height="3" />
        {/* Boom tip */}
        <rect x="56" y="14" width="3" height="13" />
        {/* Hook */}
        <rect x="56" y="27" width="3" height="8" />
        <rect x="54" y="33" width="7" height="3" />
        <rect x="54" y="33" width="3" height="7" />
        <rect x="54" y="38" width="7" height="3" />
        {/* Cab */}
        <rect x="8" y="14" width="10" height="6" rx="1" />
        {/* Anemometer on top */}
        <rect x="11" y="6" width="2" height="8" />
        <circle cx="8" cy="5" r="2.5" />
        <circle cx="16" cy="5" r="2.5" />
      </g>
    </svg>
  );
}

export function MainBoomIcon({ size = 24, className }: CraneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main boom - thicker lattice crane arm at angle */}
      <g fill="currentColor">
        {/* Base/feet */}
        <rect x="4" y="54" width="8" height="8" />
        <rect x="16" y="54" width="8" height="8" />
        {/* Tower lower */}
        <rect x="6" y="30" width="5" height="26" />
        <rect x="17" y="30" width="5" height="26" />
        {/* Tower cross braces */}
        <rect x="11" y="34" width="6" height="3" />
        <rect x="11" y="42" width="6" height="3" />
        <rect x="11" y="50" width="6" height="3" />
        {/* Main boom arm - angled upward */}
        <path d="M20 30 L48 6 L52 6 L52 10 L24 34 L20 34Z" />
        <path d="M22 28 L26 24" strokeWidth="3" stroke="currentColor" />
        {/* Cross braces on boom */}
        <rect x="28" y="14" width="3" height="3" transform="rotate(-40 29 15)" />
        <rect x="36" y="10" width="3" height="3" transform="rotate(-40 37 11)" />
        {/* Boom tip pulley */}
        <circle cx="51" cy="6" r="4" />
        {/* Hook cable */}
        <rect x="50" y="10" width="2" height="16" />
        {/* Hook */}
        <rect x="47" y="26" width="8" height="3" />
        <rect x="47" y="26" width="3" height="8" />
        <rect x="47" y="32" width="8" height="3" />
        {/* Cab */}
        <rect x="8" y="26" width="12" height="7" rx="1" />
        {/* Anemometer */}
        <rect x="13" y="16" width="2" height="10" />
        <circle cx="10" cy="15" r="2.5" />
        <circle cx="18" cy="15" r="2.5" />
      </g>
    </svg>
  );
}
