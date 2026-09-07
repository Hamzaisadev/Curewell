interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Curewell brand mark and wordmark.
 * The mark maintains clinical teal & health mint accents across both themes.
 */
export function Logo({ className = '', variant = 'full', size = 'md' }: LogoProps) {
  const sizeMap = {
    sm: { height: 28, markWidth: 28, fullWidth: 124 },
    md: { height: 36, markWidth: 36, fullWidth: 154 },
    lg: { height: 48, markWidth: 48, fullWidth: 198 },
  };

  const { height, markWidth, fullWidth } = sizeMap[size];

  if (variant === 'mark') {
    return (
      <svg
        className={className}
        width={markWidth}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Curewell"
      >
        <defs>
          <linearGradient id="curewell-mark-bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
          <linearGradient id="curewell-pulse-grad" x1="14" y1="24" x2="34" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
          <filter id="curewell-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F766E" floodOpacity="0.25" />
          </filter>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#curewell-mark-bg)" filter="url(#curewell-glow)" />
        <rect x="5.5" y="5.5" width="37" height="37" rx="10.5" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />
        
        {/* Harmonious Medical Cross & Vitality Center */}
        <path
          d="M24 13V35M13 24H35"
          stroke="#FFFFFF"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="3.2" fill="url(#curewell-pulse-grad)" />
        <circle cx="24" cy="24" r="1.4" fill="#0F766E" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={fullWidth}
      height={height}
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Curewell"
    >
      <defs>
        <linearGradient id="curewell-full-bg" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="curewell-full-pulse" x1="12" y1="22" x2="32" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <filter id="curewell-full-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F766E" floodOpacity="0.22" />
        </filter>
      </defs>
      <g transform="translate(2, 2)">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="url(#curewell-full-bg)" filter="url(#curewell-full-glow)" />
        <rect x="3.5" y="3.5" width="37" height="37" rx="10.5" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />
        <path
          d="M22 12V32M12 22H32"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="22" r="3" fill="url(#curewell-full-pulse)" />
        <circle cx="22" cy="22" r="1.3" fill="#0F766E" />
      </g>
      <text
        x="54"
        y="31"
        fontFamily="'Inter Variable', 'Inter', system-ui, sans-serif"
        fontSize="23"
        fontWeight="800"
        fill="currentColor"
        letterSpacing="-0.035em"
      >
        Cure<tspan fill="var(--color-brand-600, #0D9488)">well</tspan>
      </text>
    </svg>
  );
}
