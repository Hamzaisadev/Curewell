import React from 'react';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

export const LogoCrossIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF', strokeWidth = 2.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4V20M4 12H20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PillIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 8.5l7 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HeartPulseIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.22 12H9.5l1.5-3 3 6 1.5-3h5.28"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StethoscopeIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 3v5a4.5 4.5 0 009 0V3M8 3v5a1 1 0 002 0V3M18 11v3a6 6 0 01-12 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="18" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 17v4a1 1 0 001 1h2a1 1 0 001-1v-4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BellOffIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M1 1l22 22"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SunriseIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2v4M4.93 10.93l2.83-2.83M2 18h2M20 18h2M19.07 10.93l-2.83-2.83M16 18a4 4 0 00-8 0M1 22h22M12 10v4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SunsetIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 10v4M4.93 10.93l2.83-2.83M2 18h2M20 18h2M19.07 10.93l-2.83-2.83M16 18a4 4 0 00-8 0M1 22h22M12 2v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 4v6h-6M1 20v-6h6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const QrCodeIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={strokeWidth} rx="1" />
    <Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={strokeWidth} rx="1" />
    <Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={strokeWidth} rx="1" />
    <Path
      d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3M20 14v3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M7 11V7a5 5 0 0110 0v4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const KeyIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 2l-2 2m-1.5 1.5L14 9M3 15a6 6 0 1012-3.88L21 2M9 18a3 3 0 110-6 3 3 0 010 6z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FileTextIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FlaskIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 2v7.31L4.1 19.34A2 2 0 005.8 22h12.4a2 2 0 001.7-2.66L14 9.31V2M8.5 2h7M14 9.3a6.5 6.5 0 00-4 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 12h-4l-3 9L9 3l-3 9H2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DropletIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SmartphoneIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const SlidersIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
