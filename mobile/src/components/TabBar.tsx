import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import {
  PillIcon,
  HeartPulseIcon,
  ShieldIcon,
  StethoscopeIcon,
  SettingsIcon,
} from './icons';
import { TabKey } from '../types';

export interface TabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingDosesCount: number;
}

interface TabItemConfig {
  key: TabKey;
  icon: React.FC<any>;
  label: string;
  badge?: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  pendingDosesCount,
}) => {
  const { theme, isDark } = useTheme();

  const tabs: TabItemConfig[] = [
    {
      key: 'schedule',
      icon: PillIcon,
      label: 'Schedule',
      badge: pendingDosesCount > 0 ? pendingDosesCount : undefined,
    },
    {
      key: 'vitals',
      icon: HeartPulseIcon,
      label: 'Vitals',
    },
    {
      key: 'sos',
      icon: ShieldIcon,
      label: 'SOS',
    },
    {
      key: 'full_app',
      icon: StethoscopeIcon,
      label: 'Clinical',
    },
    {
      key: 'settings',
      icon: SettingsIcon,
      label: 'Settings',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const IconComponent = tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              isActive && { backgroundColor: theme.surfaceAccent },
            ]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <View style={styles.iconWrapper}>
              <IconComponent
                size={20}
                color={isActive ? theme.primary : theme.textMuted}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.risk.dot,
                      borderColor: theme.surface,
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.primary : theme.textMuted,
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 12,
    minHeight: 48,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default TabBar;
