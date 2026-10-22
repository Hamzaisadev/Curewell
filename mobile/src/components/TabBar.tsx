import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../constants';
import { TabKey } from '../types';

export interface TabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingDosesCount: number;
}

interface TabItem {
  key: TabKey;
  icon: string;
  label: string;
  badge?: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  pendingDosesCount,
}) => {
  const tabs: TabItem[] = [
    {
      key: 'schedule',
      icon: '💊',
      label: 'Schedule',
      badge: pendingDosesCount > 0 ? pendingDosesCount : undefined,
    },
    {
      key: 'vitals',
      icon: '🩸',
      label: 'Vitals',
    },
    {
      key: 'sos',
      icon: '🚨',
      label: 'SOS',
    },
    {
      key: 'alarms',
      icon: '⏰',
      label: 'Alarms',
    },
    {
      key: 'full_app',
      icon: '🏥',
      label: 'Clinical Suite',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <View style={styles.iconWrapper}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.tabLabel, isActive && styles.tabLabelActive]}
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
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
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
  },
  tabButtonActive: {
    backgroundColor: '#0D94881A',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: THEME.risk,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 11,
  },
  tabLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#2DD4BF',
    fontWeight: '800',
  },
});

export default TabBar;
