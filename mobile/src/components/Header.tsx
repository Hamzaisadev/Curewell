import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../constants';
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
  const getInitials = (name?: string): string => {
    if (!name) return 'CW';
    const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = activeProfile?.fullName
    ? activeProfile.fullName.replace(/\s*\(.*?\)\s*/g, '')
    : 'Patient';

  return (
    <View style={styles.container}>
      {/* Top Bar: Eyebrow + Live Sync status */}
      <View style={styles.topRow}>
        <View style={styles.eyebrowContainer}>
          <Text style={styles.eyebrowText}>CUREWELL 4.0 CLINICAL OS</Text>
        </View>

        <View
          style={[
            styles.syncPill,
            isLiveConnected ? styles.syncPillConnected : styles.syncPillReconnecting,
          ]}
        >
          <View
            style={[
              styles.syncDot,
              isLiveConnected ? styles.syncDotConnected : styles.syncDotReconnecting,
            ]}
          />
          <Text
            style={[
              styles.syncText,
              isLiveConnected ? styles.syncTextConnected : styles.syncTextReconnecting,
            ]}
          >
            {isLiveConnected ? 'Live Sync' : 'Reconnecting'}
          </Text>
        </View>
      </View>

      {/* Main Header Row: Logo + App Title, Profile Switcher & Auth */}
      <View style={styles.mainRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoMark}>
            <Text style={styles.logoCross}>+</Text>
          </View>
          <View style={styles.titleColumn}>
            <Text style={styles.appTitle}>Daily Health Vault</Text>
            <Text style={styles.activeProfileSub} numberOfLines={1}>
              {activeProfile?.relationship ? `${activeProfile.relationship} · ` : ''}
              {displayName}
            </Text>
          </View>
        </View>

        <View style={styles.actionsGroup}>
          {/* Caregiver Active Profile Pill */}
          <TouchableOpacity
            style={styles.profilePill}
            onPress={onOpenProfilePicker}
            activeOpacity={0.7}
            accessibilityLabel="Switch active profile"
            accessibilityRole="button"
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {getInitials(activeProfile?.fullName)}
              </Text>
            </View>
            <Text style={styles.profilePillName} numberOfLines={1}>
              {displayName.split(' ')[0]}
            </Text>
            <Text style={styles.switchIcon}>▾</Text>
          </TouchableOpacity>

          {/* Sign In / Account Button */}
          <TouchableOpacity
            style={styles.authBtn}
            onPress={onOpenAuth}
            activeOpacity={0.7}
            accessibilityLabel="Open Account and Sign In modal"
            accessibilityRole="button"
          >
            <Text style={styles.authBtnIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 10,
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
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
  syncPillConnected: {
    backgroundColor: '#064E3B33',
    borderColor: '#10B98155',
  },
  syncPillReconnecting: {
    backgroundColor: '#78350F33',
    borderColor: '#F59E0B55',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncDotConnected: {
    backgroundColor: '#10B981',
  },
  syncDotReconnecting: {
    backgroundColor: '#F59E0B',
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
  },
  syncTextConnected: {
    color: '#34D399',
  },
  syncTextReconnecting: {
    color: '#FBBF24',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoCross: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  appTitle: {
    color: THEME.textLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeProfileSub: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 8,
    gap: 6,
  },
  profileAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
  },
  profilePillName: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 68,
  },
  switchIcon: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  authBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBtnIcon: {
    fontSize: 15,
  },
});

export default Header;
