import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { XIcon, CheckIcon, UserIcon, DropletIcon } from '../icons';
import { PatientProfile } from '../../types';

export interface ProfilePickerModalProps {
  visible: boolean;
  profiles: PatientProfile[];
  activeProfileId: string;
  onSelectProfile: (profile: PatientProfile) => void;
  onClose: () => void;
}

export const ProfilePickerModal: React.FC<ProfilePickerModalProps> = ({
  visible,
  profiles,
  activeProfileId,
  onSelectProfile,
  onClose,
}) => {
  const { theme, isDark } = useTheme();

  const getInitials = (name?: string): string => {
    if (!name) return 'MF';
    const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>CAREGIVER MULTI-PATIENT VAULT</Text>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Switch Active Patient Profile</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeIconBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
                accessibilityLabel="Close profile picker"
              >
                <XIcon size={16} color={theme.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Switching profiles adapts medication schedules, offline alarms, home widget
              telemetry, and SOS medical ID.
            </Text>

            {/* Profile List */}
            <View style={styles.profilesList}>
              {profiles.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No additional profiles configured.
                  </Text>
                </View>
              ) : (
                profiles.map((profile) => {
                  const isActive = profile.id === activeProfileId;
                  const initials = getInitials(profile.fullName);

                  return (
                    <TouchableOpacity
                      key={profile.id}
                      style={[
                        styles.profileCard,
                        {
                          backgroundColor: isActive ? theme.surfaceAccent : theme.surfaceSunken,
                          borderColor: isActive ? theme.primary : theme.line,
                        },
                      ]}
                      onPress={() => {
                        onSelectProfile(profile);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardTopRow}>
                        <View
                          style={[
                            styles.avatarCircle,
                            {
                              backgroundColor: isActive ? theme.primary : theme.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              { color: isActive ? '#FFFFFF' : theme.textPrimary },
                            ]}
                          >
                            {initials}
                          </Text>
                        </View>

                        <View style={styles.infoCol}>
                          <View style={styles.nameRow}>
                            <Text
                              style={[
                                styles.fullNameText,
                                { color: theme.textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {profile.fullName}
                            </Text>
                          </View>

                          <View style={styles.badgesRow}>
                            <View
                              style={[
                                styles.relationBadge,
                                { backgroundColor: theme.surface, borderColor: theme.line },
                              ]}
                            >
                              <Text style={[styles.relationBadgeText, { color: theme.textMuted }]}>
                                {profile.relationship}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.bloodBadge,
                                { backgroundColor: theme.risk.bg, borderColor: theme.risk.border },
                              ]}
                            >
                              <DropletIcon size={10} color={theme.risk.text} />
                              <Text style={[styles.bloodBadgeText, { color: theme.risk.text }]}>
                                {profile.bloodGroup || 'Unknown'}
                              </Text>
                            </View>

                            {isActive && (
                              <View style={[styles.activePill, { backgroundColor: theme.ok.bg }]}>
                                <CheckIcon size={10} color={theme.ok.text} strokeWidth={2.5} />
                                <Text style={[styles.activePillText, { color: theme.ok.text }]}>ACTIVE</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Medical Subtext */}
                      <View style={[styles.medicalDetails, { borderTopColor: theme.line }]}>
                        {profile.chronicConditions ? (
                          <Text style={[styles.detailText, { color: theme.textMuted }]} numberOfLines={1}>
                            <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Conditions: </Text>
                            {profile.chronicConditions}
                          </Text>
                        ) : null}

                        {profile.allergies ? (
                          <Text style={[styles.detailText, { color: theme.textMuted }]} numberOfLines={1}>
                            <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Allergies: </Text>
                            {profile.allergies}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.textPrimary }]}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  sheetContainer: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  profilesList: {
    gap: 10,
    marginTop: 4,
  },
  emptyBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  profileCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  relationBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  relationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  bloodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  medicalDetails: {
    borderTopWidth: 1,
    paddingTop: 6,
    gap: 2,
  },
  detailText: {
    fontSize: 11,
  },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProfilePickerModal;
