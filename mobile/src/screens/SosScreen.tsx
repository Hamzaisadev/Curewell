import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PatientProfile, DoseSlot } from '../types';
import { styles } from '../styles/commonStyles';

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
    description: 'Government Emergency Ambulance & First Responder Service',
    badge: 'GOVT 24/7',
  },
  {
    name: 'Edhi Ambulance Service',
    phone: '115',
    description: "Pakistan's Largest Emergency Relief Ambulance Fleet",
    badge: 'EDHI 115',
  },
  {
    name: 'Chhipa Ambulance',
    phone: '1020',
    description: 'Rapid Emergency Rescue & Trauma Transport Service',
    badge: 'CHHIPA 1020',
  },
];

export const SosScreen: React.FC<SosScreenProps> = ({
  activeProfile,
  doses,
  onDial,
}) => {
  return (
    <View style={styles.sectionStack}>
      {/* Paramedic Medical ID Hero Card */}
      <View style={styles.sosCard}>
        <View style={styles.sosHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosBadge}>EMERGENCY PARAMEDIC MEDICAL ID</Text>
            <Text style={styles.sosPatientName}>{activeProfile.fullName}</Text>
            <Text style={styles.sosRelationText}>
              Relationship: {activeProfile.relationship}
            </Text>
          </View>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodBadgeLabel}>BLOOD</Text>
            <Text style={styles.bloodBadgeValue}>{activeProfile.bloodGroup}</Text>
          </View>
        </View>

        {/* Known Allergies Warning Block */}
        <View style={styles.sosBlock}>
          <Text style={styles.sosBlockLabel}>⚠️ KNOWN DRUG ALLERGIES</Text>
          <Text style={styles.sosBlockValue}>{activeProfile.allergies}</Text>
        </View>

        {/* Chronic Conditions Block */}
        <View style={styles.sosBlock}>
          <Text style={styles.sosBlockLabel}>CHRONIC MEDICAL CONDITIONS</Text>
          <Text style={styles.sosBlockValue}>{activeProfile.chronicConditions}</Text>
        </View>

        {/* Active Regimen for First Responders */}
        <View style={styles.sosBlock}>
          <Text style={styles.sosBlockLabel}>
            ACTIVE REGIMEN FOR FIRST RESPONDERS ({doses.length})
          </Text>
          {doses.length === 0 ? (
            <Text style={styles.cardBodyText}>No active prescription doses registered.</Text>
          ) : (
            doses.map((d) => (
              <Text key={d.id} style={styles.sosMedItem}>
                • {d.medicineName} {d.strength} ({d.genericName}) — {d.bucket} ({d.mealRelation})
              </Text>
            ))
          )}
        </View>

        {/* Primary Emergency Contact Call Button */}
        <TouchableOpacity
          style={styles.emergencyCallBtn}
          onPress={() => onDial(activeProfile.emergencyContactPhone)}
          activeOpacity={0.85}
        >
          <Text style={styles.emergencyCallBtnText}>
            📞 Call {activeProfile.emergencyContactName} ({activeProfile.emergencyContactPhone})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1-Tap Ambulance Dialer Cards Section */}
      <View style={screenStyles.ambulanceSection}>
        <Text style={screenStyles.ambulanceSectionTitle}>
          🚑 1-TAP EMERGENCY AMBULANCE DIALERS
        </Text>
        <Text style={screenStyles.ambulanceSectionSubtitle}>
          Immediate cellular dialers configured for Pakistan emergency response networks.
        </Text>

        {AMBULANCE_SERVICES.map((service) => (
          <TouchableOpacity
            key={service.phone}
            style={screenStyles.ambulanceCard}
            onPress={() => onDial(service.phone)}
            activeOpacity={0.8}
          >
            <View style={screenStyles.ambulanceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={screenStyles.ambulanceName}>{service.name}</Text>
                <Text style={screenStyles.ambulanceDesc}>{service.description}</Text>
              </View>
              <View style={screenStyles.ambulanceBadge}>
                <Text style={screenStyles.ambulanceBadgeText}>{service.badge}</Text>
              </View>
            </View>

            <View style={screenStyles.ambulanceCallBar}>
              <Text style={screenStyles.ambulanceCallBarText}>
                🚨 Tap to Call {service.phone}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const screenStyles = StyleSheet.create({
  ambulanceSection: {
    gap: 10,
    marginTop: 6,
  },
  ambulanceSectionTitle: {
    color: '#FDA4AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  ambulanceSectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  ambulanceCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7F1D1D',
    gap: 10,
  },
  ambulanceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  ambulanceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  ambulanceDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  ambulanceBadge: {
    backgroundColor: '#881337',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ambulanceBadgeText: {
    color: '#FECDD3',
    fontSize: 10,
    fontWeight: '800',
  },
  ambulanceCallBar: {
    backgroundColor: '#991B1B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambulanceCallBarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SosScreen;
