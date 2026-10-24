import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorSlot {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

export interface DaySlot {
  bg: string;
  border: string;
  text: string;
  label: string;
}

export interface Theme {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSunken: string;
  surfaceRaised: string;
  surfaceHover: string;
  surfaceAccent: string;
  line: string;
  lineStrong: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  textOnBrand: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  ok: ColorSlot;
  warn: ColorSlot;
  risk: ColorSlot;
  info: ColorSlot;
  slot: {
    morning: DaySlot;
    afternoon: DaySlot;
    evening: DaySlot;
    bedtime: DaySlot;
  };
}

export const lightTheme: Theme = {
  isDark: false,
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSunken: '#F1F5F9',
  surfaceRaised: '#FFFFFF',
  surfaceHover: '#F8FAFC',
  surfaceAccent: '#F0FDFA',
  line: '#E2E8F0',
  lineStrong: '#CBD5E1',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#475569',
  textSubtle: '#94A3B8',
  textOnBrand: '#FFFFFF',
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',
  accent: '#14B8A6',
  ok: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#047857',
    dot: '#10B981',
  },
  warn: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#B45309',
    dot: '#F59E0B',
  },
  risk: {
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#B91C1C',
    dot: '#EF4444',
  },
  info: {
    bg: '#F0F9FF',
    border: '#BAE6FD',
    text: '#0369A1',
    dot: '#0EA5E9',
  },
  slot: {
    morning: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      label: 'Morning Slot (06:00 - 11:59)',
    },
    afternoon: {
      bg: '#F0F9FF',
      border: '#BAE6FD',
      text: '#0369A1',
      label: 'Afternoon Slot (12:00 - 16:59)',
    },
    evening: {
      bg: '#FAF5FF',
      border: '#E9D5FF',
      text: '#6B21A8',
      label: 'Evening Slot (17:00 - 20:59)',
    },
    bedtime: {
      bg: '#EEF2FF',
      border: '#C7D2FE',
      text: '#3730A3',
      label: 'Bedtime Slot (21:00 - 05:59)',
    },
  },
};

export const darkTheme: Theme = {
  isDark: true,
  background: '#090D12',
  surface: '#121824',
  surfaceSunken: '#0B0F17',
  surfaceRaised: '#171F2F',
  surfaceHover: '#1B2436',
  surfaceAccent: '#0D2825',
  line: '#1E293B',
  lineStrong: '#334155',
  border: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#94A3B8',
  textSubtle: '#64748B',
  textOnBrand: '#042F2E',
  primary: '#14B8A6',
  primaryDark: '#0D9488',
  primaryLight: '#134E48',
  accent: '#2DD4BF',
  ok: {
    bg: 'rgba(6, 78, 59, 0.35)',
    border: 'rgba(5, 150, 105, 0.45)',
    text: '#34D399',
    dot: '#10B981',
  },
  warn: {
    bg: 'rgba(120, 53, 15, 0.35)',
    border: 'rgba(217, 119, 6, 0.45)',
    text: '#FBBF24',
    dot: '#F59E0B',
  },
  risk: {
    bg: 'rgba(127, 29, 29, 0.35)',
    border: 'rgba(220, 38, 38, 0.45)',
    text: '#F87171',
    dot: '#EF4444',
  },
  info: {
    bg: 'rgba(12, 74, 110, 0.35)',
    border: 'rgba(2, 132, 199, 0.45)',
    text: '#38BDF8',
    dot: '#0EA5E9',
  },
  slot: {
    morning: {
      bg: 'rgba(120, 53, 15, 0.22)',
      border: 'rgba(180, 83, 9, 0.4)',
      text: '#FCD34D',
      label: 'Morning Slot (06:00 - 11:59)',
    },
    afternoon: {
      bg: 'rgba(12, 74, 110, 0.22)',
      border: 'rgba(2, 132, 199, 0.4)',
      text: '#7DD3FC',
      label: 'Afternoon Slot (12:00 - 16:59)',
    },
    evening: {
      bg: 'rgba(88, 28, 135, 0.22)',
      border: 'rgba(147, 51, 234, 0.4)',
      text: '#D8B4FE',
      label: 'Evening Slot (17:00 - 20:59)',
    },
    bedtime: {
      bg: 'rgba(49, 46, 129, 0.22)',
      border: 'rgba(79, 70, 229, 0.4)',
      text: '#A5B4FC',
      label: 'Bedtime Slot (21:00 - 05:59)',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeMode: 'light',
  isDark: false,
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light'); // Light is default to match Medfolio Web App!

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (e) {
        console.warn('Error loading theme mode:', e);
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (e) {
      console.warn('Error saving theme mode:', e);
    }
  };

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = async () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
