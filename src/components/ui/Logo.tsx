interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Curewell official brand mark and wordmark.
 * Telemetry Vault Shield with clinical teal & health mint accents.
 */
export function Logo({ className = '', variant = 'full', size = 'md' }: LogoProps) {
  const sizeMap = {
    sm: { height: 28, markWidth: 28, fullWidth: 132 },
    md: { height: 36, markWidth: 36, fullWidth: 168 },
    lg: { height: 48, markWidth: 48, fullWidth: 220 },
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
          <linearGradient id="curewell-mark-shield" x1="12" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="45%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#042F2E" />
          </linearGradient>
          <linearGradient id="curewell-mark-beam" x1="18" y1="17" x2="30" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <filter id="curewell-mark-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0D9488" floodOpacity="0.3" />
          </filter>
        </defs>

        <g filter="url(#curewell-mark-glow)">
          {/* Outer Faceted Shield */}
          <path
            d="M24 4 L40 11.5 V27 C40 34.5 33 41 24 44 C15 41 8 34.5 8 27 V11.5 L24 4 Z"
            fill="url(#curewell-mark-shield)"
          />
          {/* Mint Bevel Stroke */}
          <path
            d="M24 5 L39 12 V27 C39 33.8 32.5 40 24 42.5 C15.5 40 9 33.8 9 27 V12 L24 5 Z"
            stroke="#2DD4BF"
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />
          {/* Concentric Telemetry Lines */}
          <path
            d="M24 9 L35 14.5 V26 C35 31.5 29.5 36.5 24 38.5 C18.5 36.5 13 31.5 13 26 V14.5 L24 9 Z"
            stroke="#5EEAD4"
            strokeOpacity="0.35"
            strokeWidth="0.75"
            strokeDasharray="2 1.5"
          />
          {/* Center Precision Medical Cross */}
          <path
            d="M24 16 V30 M17 23 H31"
            stroke="url(#curewell-mark-beam)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Central Health Core Node */}
          <circle cx="24" cy="23" r="2.8" fill="#FFFFFF" />
          <circle cx="24" cy="23" r="1.2" fill="#0D9488" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={fullWidth}
      height={height}
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Curewell"
    >
      <defs>
        <linearGradient id="curewell-full-shield" x1="12" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="45%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#042F2E" />
        </linearGradient>
        <linearGradient id="curewell-full-beam" x1="18" y1="17" x2="30" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <filter id="curewell-full-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0D9488" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Shield Mark */}
      <g filter="url(#curewell-full-glow)">
        <path
          d="M24 4 L40 11.5 V27 C40 34.5 33 41 24 44 C15 41 8 34.5 8 27 V11.5 L24 4 Z"
          fill="url(#curewell-full-shield)"
        />
        <path
          d="M24 5 L39 12 V27 C39 33.8 32.5 40 24 42.5 C15.5 40 9 33.8 9 27 V12 L24 5 Z"
          stroke="#2DD4BF"
          strokeOpacity="0.4"
          strokeWidth="0.8"
        />
        <path
          d="M24 9 L35 14.5 V26 C35 31.5 29.5 36.5 24 38.5 C18.5 36.5 13 31.5 13 26 V14.5 L24 9 Z"
          stroke="#5EEAD4"
          strokeOpacity="0.35"
          strokeWidth="0.75"
          strokeDasharray="2 1.5"
        />
        <path
          d="M24 16 V30 M17 23 H31"
          stroke="url(#curewell-full-beam)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="23" r="2.8" fill="#FFFFFF" />
        <circle cx="24" cy="23" r="1.2" fill="#0D9488" />
      </g>

      {/* Wordmark Text */}
      <text
        x="54"
        y="28"
        fontFamily="'Inter Variable', 'Inter', system-ui, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill="currentColor"
        letterSpacing="-0.035em"
      >
        Cure<tspan fill="#0D9488">well</tspan>
      </text>

      {/* Clinical Subtitle */}
      <text
        x="55"
        y="40"
        fontFamily="'Inter Variable', 'Inter', system-ui, sans-serif"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="0.22em"
        fill="#0F766E"
        opacity="0.9"
      >
        HEALTH VAULT
      </text>
    </svg>
  );
}
