import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import {
  LogoCrossIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronDownIcon,
  RefreshCwIcon,
} from './icons';
import { PatientProfile } from '../types';

export interface HeaderProps {
  activeProfile: PatientProfile;
  isLiveConnected: boolean;
  onOpenProfilePicker: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  isLiveConnected,
  onOpenProfilePicker,
  onOpenAuth,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const getInitials = (name?: string): string => {
    if (!name) return 'MF';
    const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = activeProfile?.fullName
    ? activeProfile.fullName.replace(/\s*\(.*?\)\s*/g, '')
    : 'Patient';

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
      {/* TOP ROW: EYEBROW & LIVE SYNC STATUS */}
      <View style={styles.topRow}>
        <View style={styles.eyebrowContainer}>
          <Text style={[styles.eyebrowText, { color: theme.primary }]}>MEDFOLIO CLINICAL OS</Text>
        </View>

        <View
          style={[
            styles.syncPill,
            {
              backgroundColor: isLiveConnected ? theme.ok.bg : theme.surfaceSunken,
              borderColor: isLiveConnected ? theme.ok.border : theme.line,
            },
          ]}
        >
          <View
            style={[
              styles.syncDot,
              { backgroundColor: isLiveConnected ? theme.ok.dot : theme.textSubtle },
            ]}
          />
          <Text
            style={[
              styles.syncText,
              { color: isLiveConnected ? theme.ok.text : theme.textMuted },
            ]}
          >
            {isLiveConnected ? 'Live Cloud Sync' : 'Offline / Standalone'}
          </Text>
        </View>
      </View>

      {/* MAIN HEADER ROW */}
      <View style={styles.mainRow}>
        {/* Brand Logo & Title */}
        <View style={styles.brandGroup}>
          <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
            <LogoCrossIcon size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.titleColumn}>
            <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Medfolio Vault</Text>
            <Text style={[styles.activeProfileSub, { color: theme.textMuted }]} numberOfLines={1}>
              {activeProfile?.relationship ? `${activeProfile.relationship} • ` : ''}
              {displayName}
            </Text>
          </View>
        </View>

        {/* Action Controls: Theme Quick-Toggle, Profile Pill, Auth */}
        <View style={styles.actionsGroup}>
          {/* Quick Light/Dark Toggle */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle light and dark theme"
          >
            {isDark ? (
              <SunIcon size={16} color={theme.primary} />
            ) : (
              <MoonIcon size={16} color={theme.textPrimary} />
            )}
          </TouchableOpacity>

          {/* Profile Switcher Pill */}
          <TouchableOpacity
            style={[styles.profilePill, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
            onPress={onOpenProfilePicker}
            activeOpacity={0.7}
            accessibilityLabel="Switch active patient profile"
          >
            <View style={[styles.profileAvatar, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.profileAvatarText, { color: theme.primaryDark }]}>
                {getInitials(activeProfile?.fullName)}
              </Text>
            </View>
            <Text style={[styles.profilePillName, { color: theme.textPrimary }]} numberOfLines={1}>
              {displayName.split(' ')[0]}
            </Text>
            <ChevronDownIcon size={12} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Account / Pairing Button */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
            onPress={onOpenAuth}
            activeOpacity={0.7}
            accessibilityLabel="Account and Pairing Settings"
          >
            <UserIcon size={16} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  titleColumn: {
    flex: 1,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  activeProfileSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 120,
  },
  profileAvatar: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 10,
    fontWeight: '900',
  },
  profilePillName: {
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 60,
  },
});
