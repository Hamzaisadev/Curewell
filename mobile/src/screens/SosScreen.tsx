import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import {
  ShieldIcon,
  PhoneIcon,
  AlertTriangleIcon,
  PillIcon,
  UserIcon,
} from '../components/icons';
import { PatientProfile, DoseSlot } from '../types';

export interface SosScreenProps {
  activeProfile: PatientProfile;
  doses: DoseSlot[];
  onDial: (phone: string) => void;
}

interface AmbulanceService {
  name: string;
  phone: string;
  description: string;
  badge: string;
}

const AMBULANCE_SERVICES: AmbulanceService[] = [
  {
    name: 'Rescue 1122',
    phone: '1122',
    description: 'Government Emergency Ambulance & Trauma First Responders',
    badge: 'GOVT 24/7',
  },
  {
    name: 'Edhi Ambulance Service',
    phone: '115',
    description: "Emergency Relief & Nationwide Trauma Ambulance Fleet",
    badge: 'EDHI 115',
  },
  {
    name: 'Chhipa Ambulance',
    phone: '1020',
    description: 'Rapid Emergency Rescue & Immediate Transport Service',
    badge: 'CHHIPA 1020',
  },
];

export const SosScreen: React.FC<SosScreenProps> = ({ activeProfile, doses, onDial }) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* PARAMEDIC MEDICAL EMERGENCY ID HERO CARD */}
      <View
        style={[
          styles.sosCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.risk.border,
          },
        ]}
      >
        <View style={styles.sosHeaderRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.eyebrowRow}>
              <ShieldIcon size={14} color={theme.risk.text} />
              <Text style={[styles.sosBadge, { color: theme.risk.text }]}>
                PARAMEDIC EMERGENCY MEDICAL ID
              </Text>
            </View>
            <Text style={[styles.sosPatientName, { color: theme.textPrimary }]}>
              {activeProfile.fullName}
            </Text>
            <Text style={[styles.sosRelationText, { color: theme.textMuted }]}>
              Relationship: {activeProfile.relationship || 'Self'}
            </Text>
          </View>

          <View style={[styles.bloodBadge, { backgroundColor: theme.risk.bg, borderColor: theme.risk.border }]}>
            <Text style={[styles.bloodBadgeLabel, { color: theme.risk.text }]}>BLOOD</Text>
            <Text style={[styles.bloodBadgeValue, { color: theme.risk.text }]}>
              {activeProfile.bloodGroup || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* KNOWN DRUG ALLERGIES (CRITICAL FOR FIRST RESPONDERS) */}
        <View
          style={[
            styles.allergyBlock,
            {
              backgroundColor: theme.risk.bg,
              borderColor: theme.risk.border,
            },
          ]}
        >
          <View style={styles.blockTitleRow}>
            <AlertTriangleIcon size={16} color={theme.risk.text} />
            <Text style={[styles.allergyBlockLabel, { color: theme.risk.text }]}>
              KNOWN DRUG ALLERGIES (CRITICAL)
            </Text>
          </View>
          <Text style={[styles.allergyBlockValue, { color: theme.risk.text }]}>
            {activeProfile.allergies || 'None Recorded'}
          </Text>
        </View>

        {/* CHRONIC MEDICAL CONDITIONS */}
        <View style={[styles.sosBlock, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
          <Text style={[styles.sosBlockLabel, { color: theme.textMuted }]}>
            CHRONIC MEDICAL CONDITIONS
          </Text>
          <Text style={[styles.sosBlockValue, { color: theme.textPrimary }]}>
            {activeProfile.chronicConditions || 'None Recorded'}
          </Text>
        </View>

        {/* ACTIVE MEDICATION REGIMEN */}
        <View style={[styles.sosBlock, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
          <View style={styles.blockTitleRow}>
            <PillIcon size={14} color={theme.textMuted} />
            <Text style={[styles.sosBlockLabel, { color: theme.textMuted }]}>
              ACTIVE REGIMEN FOR FIRST RESPONDERS ({doses.length})
            </Text>
          </View>

          {doses.length === 0 ? (
            <Text style={[styles.emptyRegimenText, { color: theme.textMuted }]}>
              No active prescription doses registered.
            </Text>
          ) : (
            <View style={styles.medsList}>
              {doses.map((d) => (
                <Text key={d.id} style={[styles.sosMedItem, { color: theme.textPrimary }]}>
                  • <Text style={{ fontWeight: '800' }}>{d.medicineName} {d.strength}</Text> ({d.genericName}) — {d.bucket} ({d.mealRelation})
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* PRIMARY EMERGENCY CONTACT CALL BUTTON */}
        {activeProfile.emergencyContactPhone ? (
          <TouchableOpacity
            style={[styles.emergencyCallBtn, { backgroundColor: theme.risk.dot }]}
            onPress={() => onDial(activeProfile.emergencyContactPhone)}
            activeOpacity={0.85}
          >
            <PhoneIcon size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.emergencyCallBtnText}>
              Call {activeProfile.emergencyContactName || 'Emergency Contact'} ({activeProfile.emergencyContactPhone})
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.noContactNotice, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
            <Text style={[styles.noContactText, { color: theme.textMuted }]}>
              No emergency contact phone registered for this profile.
            </Text>
          </View>
        )}
      </View>

      {/* 24/7 EMERGENCY AMBULANCE DIRECTORY */}
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          24/7 EMERGENCY AMBULANCE DIRECTORY
        </Text>

        <View style={styles.ambulanceList}>
          {AMBULANCE_SERVICES.map((srv) => (
            <TouchableOpacity
              key={srv.name}
              style={[styles.ambulanceRow, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}
              onPress={() => onDial(srv.phone)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.srvNameRow}>
                  <Text style={[styles.ambulanceName, { color: theme.textPrimary }]}>{srv.name}</Text>
                  <View style={[styles.srvBadge, { backgroundColor: theme.surfaceAccent, borderColor: theme.line }]}>
                    <Text style={[styles.srvBadgeText, { color: theme.primary }]}>{srv.badge}</Text>
                  </View>
                </View>
                <Text style={[styles.ambulanceDesc, { color: theme.textMuted }]}>{srv.description}</Text>
              </View>

              <View style={[styles.callCircle, { backgroundColor: theme.risk.dot }]}>
                <PhoneIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sosCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sosPatientName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sosRelationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bloodBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 64,
  },
  bloodBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bloodBadgeValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  allergyBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allergyBlockLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  allergyBlockValue: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sosBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  sosBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosBlockValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyRegimenText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  medsList: {
    gap: 4,
    marginTop: 2,
  },
  sosMedItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyCallBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  noContactNotice: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  noContactText: {
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  ambulanceList: {
    gap: 10,
  },
  ambulanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  srvNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ambulanceName: {
    fontSize: 14,
    fontWeight: '800',
  },
  srvBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  srvBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ambulanceDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  callCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
