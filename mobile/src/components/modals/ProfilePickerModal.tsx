import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { THEME } from '../../constants';
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
  const getInitials = (name?: string): string => {
    if (!name) return 'CW';
    const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.eyebrow}>CAREGIVER MULTI-PATIENT VAULT</Text>
                <Text style={styles.title}>Switch Active Patient Profile</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeIconBtn}
                accessibilityLabel="Close profile picker"
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Switching profiles adapts medication schedules, offline alarms, home widget
              telemetry, and SOS medical ID.
            </Text>

            {/* Profile List */}
            <View style={styles.profilesList}>
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                const initials = getInitials(profile.fullName);

                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[styles.profileCard, isActive && styles.profileCardActive]}
                    onPress={() => {
                      onSelectProfile(profile);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.avatarCircle, isActive && styles.avatarCircleActive]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>

                      <View style={styles.infoCol}>
                        <View style={styles.nameRow}>
                          <Text style={styles.fullNameText} numberOfLines={1}>
                            {profile.fullName}
                          </Text>
                        </View>

                        <View style={styles.badgesRow}>
                          {/* Relationship Badge */}
                          <View style={styles.relationBadge}>
                            <Text style={styles.relationBadgeText}>{profile.relationship}</Text>
                          </View>

                          {/* Blood Group Badge */}
                          <View style={styles.bloodBadge}>
                            <Text style={styles.bloodBadgeText}>🩸 {profile.bloodGroup}</Text>
                          </View>

                          {isActive && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Medical Subtext */}
                    <View style={styles.medicalDetails}>
                      {profile.chronicConditions ? (
                        <Text style={styles.detailText} numberOfLines={1}>
                          <Text style={styles.detailLabel}>Conditions: </Text>
                          {profile.chronicConditions}
                        </Text>
                      ) : null}

                      {profile.allergies ? (
                        <Text style={styles.detailText} numberOfLines={1}>
                          <Text style={styles.detailLabel}>Allergies: </Text>
                          {profile.allergies}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>Done</Text>
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  profilesList: {
    gap: 10,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#020617',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  profileCardActive: {
    borderColor: THEME.primary,
    backgroundColor: '#0D948811',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleActive: {
    backgroundColor: THEME.primary,
    borderColor: '#14B8A6',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    color: '#FFFFFF',
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  relationBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  bloodBadge: {
    backgroundColor: '#E11D4822',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E11D4866',
  },
  bloodBadgeText: {
    color: '#FDA4AF',
    fontSize: 10,
    fontWeight: '800',
  },
  activePill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  medicalDetails: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 6,
    gap: 2,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  detailLabel: {
    color: '#64748B',
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  closeBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProfilePickerModal;
