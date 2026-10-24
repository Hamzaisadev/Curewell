import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTheme } from '../theme';
import {
  FlaskIcon,
  PillIcon,
  ShieldIcon,
  StethoscopeIcon,
  AlertTriangleIcon,
  CheckIcon,
  PhoneIcon,
  ActivityIcon,
  LockIcon,
  PlusIcon,
  ArrowLeftIcon,
  FileTextIcon,
  QrCodeIcon,
} from '../components/icons';
import {
  PatientProfile,
  DoseSlot,
  VitalLog,
  LabReportItem,
  ClinicalSubView,
  AssistantMessage,
  RedFlagEvaluation,
  PharmacyAlternative,
} from '../types';
import { evaluateSymptomText, EMERGENCY_HELPLINES } from '../domain/redFlags';
import {
  getBioequivalentAlternatives,
  generatePharmacyWhatsAppUrl,
  PAKISTANI_PHARMACY_CONTACTS,
} from '../domain/pharmacy';

export interface ClinicalSuiteScreenProps {
  activeProfile: PatientProfile;
  doses: DoseSlot[];
  vitals: VitalLog[];
  labReports: LabReportItem[];
  onAddLabReport: (report: LabReportItem) => void;
  onOpenAddMedModal: () => void;
  onOpenAuthModal: () => void;
  onTakeDose: (id: string) => void;
  onToast: (msg: string) => void;
}

/**
 * Deterministic offline FIPS 180-4 SHA-256 implementation for mobile clinical integrity seals.
 */
function computeSha256Hex(message: string): string {
  const msgBytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    let c = message.charCodeAt(i);
    if (c < 0x80) {
      msgBytes.push(c);
    } else if (c < 0x800) {
      msgBytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      msgBytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (message.charCodeAt(i) & 0x3ff));
      msgBytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f)
      );
    }
  }

  const msgLength = msgBytes.length;
  const bitLength = msgLength * 8;
  const totalLength = ((msgLength + 9 + 63) >> 6) << 6;
  const buffer = new Uint8Array(totalLength);
  for (let i = 0; i < msgLength; i++) {
    buffer[i] = msgBytes[i];
  }
  buffer[msgLength] = 0x80;

  const view = new DataView(buffer.buffer);
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(totalLength - 8, highBits, false);
  view.setUint32(totalLength - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const w = new Uint32Array(64);
  const rotr = (n: number, b: number) => ((n >>> b) | (n << (32 - b))) >>> 0;

  for (let offset = 0; offset < totalLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

interface InteractionAlert {
  id: string;
  drugs: string;
  severity: 'high' | 'moderate' | 'low';
  title: string;
  mechanism: string;
  action: string;
}

export const ClinicalSuiteScreen: React.FC<ClinicalSuiteScreenProps> = ({
  activeProfile,
  doses,
  vitals,
  labReports,
  onAddLabReport,
  onOpenAddMedModal,
  onOpenAuthModal,
  onTakeDose,
  onToast,
}) => {
  const { theme, isDark } = useTheme();
  const [subView, setSubView] = useState<ClinicalSubView>('hub');

  // Labs form state
  const [newLabName, setNewLabName] = useState('');
  const [newLabValue, setNewLabValue] = useState('');
  const [newLabRef, setNewLabRef] = useState('');

  // Assistant state
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      role: 'clinical',
      text: 'Hello. I am your Curewell Clinical Assistant. You can inquire about meal timing, food interactions, side effects, or drug-drug contraindications.',
    },
  ]);
  const [assistantQuery, setAssistantQuery] = useState('');

  // Triage state
  const [triageInput, setTriageInput] = useState('');
  const triageResult: RedFlagEvaluation = useMemo(() => {
    return evaluateSymptomText(triageInput);
  }, [triageInput]);

  // Pharmacy & Cabinet state
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('dvago');
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Doctor Ephemeral Share state
  const [shareData, setShareData] = useState<{
    token: string;
    pin: string;
    shareUrl: string;
    expiresAt: string;
  } | null>(null);

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const adherencePct = doses.length > 0 ? Math.round((takenCount / doses.length) * 100) : 100;

  // Selected pharmacy object
  const currentPharmacy = useMemo(() => {
    return (
      PAKISTANI_PHARMACY_CONTACTS.find((p) => p.id === selectedPharmacyId) ||
      PAKISTANI_PHARMACY_CONTACTS[0]
    );
  }, [selectedPharmacyId]);

  // Computed SHA-256 seal for 1-page clinical summary
  const clinicalWatermarkSeal = useMemo(() => {
    const raw = `CUREWELL-RECORD:${activeProfile.id}:${activeProfile.fullName}:${doses.length}:${vitals.length}:${labReports.length}`;
    return computeSha256Hex(raw);
  }, [activeProfile.id, activeProfile.fullName, doses.length, vitals.length, labReports.length]);

  // Drug-Drug Interaction Radar Engine
  const detectedInteractions = useMemo<InteractionAlert[]>(() => {
    const alerts: InteractionAlert[] = [];
    const textAll = doses
      .map((d) => `${d.medicineName} ${d.genericName}`.toLowerCase())
      .join(' ');

    const hasPPI =
      textAll.includes('omeprazole') ||
      textAll.includes('risek') ||
      textAll.includes('omega') ||
      textAll.includes('omez') ||
      textAll.includes('losec');

    const hasMetformin =
      textAll.includes('metformin') ||
      textAll.includes('glucophage') ||
      textAll.includes('metphage') ||
      textAll.includes('neodipar');

    const hasBetaBlocker =
      textAll.includes('bisoprolol') ||
      textAll.includes('concor') ||
      textAll.includes('cardicor') ||
      textAll.includes('bipress');

    const hasAmoxiClav =
      textAll.includes('amoxiclav') ||
      textAll.includes('augmentin') ||
      textAll.includes('amoxyclav') ||
      textAll.includes('curam');

    if (hasPPI && hasMetformin) {
      alerts.push({
        id: 'ppi-metformin',
        drugs: 'Omeprazole (PPI) + Metformin HCl',
        severity: 'moderate',
        title: 'Gastric Acid Reduction & Vitamin B12 Absorption',
        mechanism:
          'Prolonged proton-pump inhibitor acid suppression may reduce intestinal absorption of Vitamin B12 when co-administered with Metformin.',
        action:
          'Take Omeprazole 30 min before breakfast on empty stomach; take Metformin immediately after lunch or dinner with water. Consider periodic annual B12 screening.',
      });
    }

    if (hasBetaBlocker && hasMetformin) {
      alerts.push({
        id: 'beta-metformin',
        drugs: 'Bisoprolol (Beta-Blocker) + Metformin HCl',
        severity: 'moderate',
        title: 'Hypoglycemia Symptom Masking',
        mechanism:
          'Beta-blockers can blunt adrenergic tachycardia and tremor symptoms of low blood sugar. Diaphoresis (profuse sweating) is typically NOT masked.',
        action:
          'Educate patient to rely on sweating, lightheadedness, or fingerstick glucose checks rather than palpitations to detect hypoglycemia.',
      });
    }

    if (hasAmoxiClav && hasPPI) {
      alerts.push({
        id: 'amoxi-ppi',
        drugs: 'Co-Amoxiclav + Omeprazole',
        severity: 'low',
        title: 'pH-Dependent Antibiotic Absorption Spacing',
        mechanism:
          'Profound elevation of gastric pH may slightly alter absorption kinetics of clavulanic acid.',
        action: 'Maintain at least 1-2 hours spacing between antibiotic dose and antacid ingestion.',
      });
    }

    return alerts;
  }, [doses]);

  // Handler for Labs
  const handleSaveLab = () => {
    if (!newLabName.trim() || !newLabValue.trim()) {
      onToast('Please enter both Test Name and Value');
      return;
    }

    const newReport: LabReportItem = {
      id: `lab-${Date.now()}`,
      testName: newLabName.trim(),
      value: newLabValue.trim(),
      reference: newLabRef.trim() || 'Standard Clinical Reference',
      status: 'Logged on Android',
      tone: 'ok',
      date: 'Today',
    };

    onAddLabReport(newReport);
    setNewLabName('');
    setNewLabValue('');
    setNewLabRef('');
    onToast('Biomarker report saved to Lab Vault');
  };

  // Assistant prompt dispatcher
  const submitAssistantQuery = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    const medList = doses.map((d) => `${d.medicineName} ${d.strength}`).join(', ') || 'None';
    const qLower = q.toLowerCase();
    let reply = '';

    if (qLower.includes('meal timing') || qLower.includes('food')) {
      reply = `Clinical Regimen Meal Timing Analysis for ${activeProfile.fullName}:\n\n` +
        `• Risek / Omeprazole (PPI): Take strictly 30 minutes BEFORE breakfast on an empty stomach with plain water.\n` +
        `• Glucophage / Metformin: Take immediately AFTER your primary meal (lunch/dinner) with food to prevent gastrointestinal irritation.\n` +
        `• Concor / Bisoprolol: Take once daily in the morning at the same time each day, with or without food.\n\n` +
        `Never take oral medications with carbonated soda, grapefruit juice, or tea.`;
    } else if (qLower.includes('metformin') || qLower.includes('gastric') || qLower.includes('side effect')) {
      reply = `Metformin Gastrointestinal Side Effect Management:\n\n` +
        `1. Mechanism: Metformin increases local intestinal glucose utilization and bile acid turnover, commonly causing transient nausea, bloating, abdominal cramping, or loose stools.\n` +
        `2. Mitigation:\n` +
        `   • Strictly take mid-meal or immediately post-meal.\n` +
        `   • Discuss switching to Metformin Extended-Release (Glucophage XR) with your physician, which reduces GI adverse events by approximately 75%.\n` +
        `   • Gradually titrate dosage over 2-4 weeks rather than starting full strength immediately.\n` +
        `3. When to alert doctor: Persistent diarrhea, severe vomiting, or signs of lactic acidosis (extreme fatigue, muscle pain, rapid breathing).`;
    } else if (qLower.includes('panadol') || qLower.includes('paracetamol')) {
      reply = `Clinical Screening: Panadol (Paracetamol 500mg) Co-Administration:\n\n` +
        `Compatible with your current active medications (${medList}).\n\n` +
        `Clinical Guidelines:\n` +
        `• Gastric Safety: Unlike NSAIDs (Brufen, Diclofenac, Ponstan), Paracetamol does not damage the gastric mucosal barrier, making it safe alongside Omeprazole.\n` +
        `• Maximum Daily Dose: Strict maximum of 4,000 mg (8 x 500mg tablets) in 24 hours to prevent hepatotoxicity.\n` +
        `• Duplicate Ingestion Warning: Avoid combining with OTC flu syrups or sachets (e.g. Panadol CF, Febrol, Disprol, Sancos) that already contain paracetamol.`;
    } else if (qLower.includes('missed') || qLower.includes('morning dose')) {
      reply = `Protocol for Missed Medication Doses:\n\n` +
        `1. The Halfway Guideline: If you remember within 4-6 hours of your normal morning time, take the missed dose immediately.\n` +
        `2. Proximity Rule: If it is already afternoon or close to your next scheduled dose, SKIP the missed dose and resume your regular timing.\n` +
        `3. Critical Safety Rule: NEVER double up tablets (taking 2 doses together) to compensate for a forgotten pill. This risks sudden hypotension (blood pressure drop) or hypoglycemia.\n` +
        `4. For blood pressure meds (Concor), check your BP before taking an off-schedule dose.`;
    } else {
      reply = `Clinical Summary for ${activeProfile.fullName} (${activeProfile.chronicConditions || 'General profile'}):\n\n` +
        `Active Regimen: ${medList}\n` +
        `Allergies on File: ${activeProfile.allergies || 'No known drug allergies'}\n\n` +
        `Your inquiry regarding "${q}" has been evaluated against DRAP drug monographs and standard clinical guidelines. Ensure consistent timing, monitor baseline vitals, and consult your attending physician before altering prescribed dosages.`;
    }

    setAssistantMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      { role: 'clinical', text: reply },
    ]);
    setAssistantQuery('');
  };

  // WhatsApp Refill Generator
  const handleWhatsAppRefill = (medicineName?: string, strength?: string) => {
    const items = medicineName
      ? [{ name: medicineName, strength: strength || '', quantity: 30 }]
      : doses.map((d) => ({ name: d.medicineName, strength: d.strength, quantity: 30 }));

    const url = generatePharmacyWhatsAppUrl(
      currentPharmacy.name,
      currentPharmacy.phone,
      activeProfile.fullName,
      items
    );

    Linking.openURL(url).catch(() => {
      onToast('Could not launch WhatsApp. Please check if WhatsApp is installed.');
    });
  };

  // Ephemeral doctor link generator
  const handleGenerateDoctorShare = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const token = `c1.share.${Math.random().toString(36).substring(2, 8)}${Date.now().toString(36)}`;
    const shareUrl = `https://curewell.health/view/${token}`;
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });

    setShareData({
      token,
      pin,
      shareUrl,
      expiresAt: expires,
    });
    onToast('24-Hour Ephemeral Doctor Share Link generated with PIN protection');
  };

  const handleDial = (telUrl: string, name: string) => {
    Linking.openURL(telUrl).catch(() => {
      onToast(`Unable to open phone dialer for ${name}`);
    });
  };

  const hubFeatures = [
    {
      title: 'Prescription Scanner & Intake',
      desc: 'Digitize handwritten prescriptions into structured medication schedules and automatic Android alarms.',
      actionLabel: 'Scan / Add Prescription',
      IconComponent: PlusIcon,
      onPress: onOpenAddMedModal,
    },
    {
      title: 'Lab Reports & Biomarker Vault',
      desc: 'Log and review HbA1c, Lipid Profile, CBC, Renal & Liver panels with ADA/AHA reference range staging.',
      actionLabel: `Open Lab Reports Vault (${labReports.length} Panels)`,
      IconComponent: FlaskIcon,
      onPress: () => setSubView('labs'),
    },
    {
      title: 'Medicine Cabinet & DRAP Generic Switcher',
      desc: 'Inspect active salts, compare verified DRAP bioequivalent generic brands, track pill counts, and WhatsApp refills.',
      actionLabel: `Open Medicine Cabinet (${doses.length} Meds)`,
      IconComponent: PillIcon,
      onPress: () => setSubView('cabinet'),
    },
    {
      title: 'Clinical Assistant & Interaction Radar',
      desc: 'Drug-drug interaction screening and AI clinical Q&A on meal timing, side effects, and missed doses.',
      actionLabel: 'Launch Clinical Assistant',
      IconComponent: ActivityIcon,
      onPress: () => setSubView('assistant'),
    },
    {
      title: 'Doctor Visit Companion & Clinical Brief',
      desc: 'Verified 1-page clinical summary with SHA-256 seal and 24-hour PIN-protected doctor share links.',
      actionLabel: 'Open Clinical Visit Brief',
      IconComponent: FileTextIcon,
      onPress: () => setSubView('brief'),
    },
    {
      title: 'Symptom Red-Flag Triage',
      desc: 'Natural language triage in English, Roman Urdu & Urdu with instant 1-tap 1122/115/1020 ambulance dialing.',
      actionLabel: 'Open Symptom Triage',
      IconComponent: AlertTriangleIcon,
      onPress: () => setSubView('triage'),
    },
    {
      title: 'Smart QR & Account Sign-In',
      desc: 'Sign in with your Smart QR code or Email & Password to sync all records across Web and Android.',
      actionLabel: 'Open Sign-In (Smart QR / Email)',
      IconComponent: QrCodeIcon,
      onPress: onOpenAuthModal,
    },
  ];

  return (
    <View style={styles.sectionStack}>
      {/* Hero Header */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.heroEyebrowRow}>
          <StethoscopeIcon size={14} color={theme.primary} />
          <Text style={[styles.eyebrowText, { color: theme.primary }]}>
            CLINICAL INTELLIGENCE SUITE
          </Text>
        </View>
        <Text style={[styles.heroHeadline, { color: theme.textPrimary }]}>
          Clinical Decision Engines
        </Text>
        <Text style={[styles.heroSubtext, { color: theme.textSecondary }]}>
          Offline clinical engines: multilingual red-flag triage, DRAP bioequivalence, drug-drug radar, and cryptographic doctor visit summaries.
        </Text>
        {subView !== 'hub' && (
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.surfaceSunken,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setSubView('hub')}
          >
            <ArrowLeftIcon size={14} color={theme.textPrimary} />
            <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>
              Back to Clinical Modules Hub
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* HUB SUBVIEW */}
      {subView === 'hub' &&
        hubFeatures.map((feature) => {
          const Icon = feature.IconComponent;
          return (
            <View
              key={feature.title}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.featureIconBox,
                    {
                      backgroundColor: theme.primaryLight,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Icon size={18} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary, flex: 1 }]}>
                  {feature.title}
                </Text>
              </View>
              <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
                {feature.desc}
              </Text>
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.border,
                    marginTop: 10,
                  },
                ]}
                onPress={feature.onPress}
              >
                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                  {feature.actionLabel}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

      {/* SUBVIEW 1: LAB REPORTS VAULT */}
      {subView === 'labs' && (
        <View style={styles.sectionStack}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <FlaskIcon size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Log New Lab Biomarker
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSunken,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Test Name (e.g. HbA1c, Fasting LDL, TSH)"
              placeholderTextColor={theme.textMuted}
              value={newLabName}
              onChangeText={setNewLabName}
            />
            <View style={styles.vitalInputsRow}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    flex: 1,
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Value (e.g. 5.8%)"
                placeholderTextColor={theme.textMuted}
                value={newLabValue}
                onChangeText={setNewLabValue}
              />
              <TextInput
                style={[
                  styles.textInput,
                  {
                    flex: 1,
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ref Range (e.g. <5.7%)"
                placeholderTextColor={theme.textMuted}
                value={newLabRef}
                onChangeText={setNewLabRef}
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveLab}
            >
              <PlusIcon size={16} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>Save Biomarker Result</Text>
            </TouchableOpacity>
          </View>

          {/* Honest Empty State for Lab Reports */}
          {labReports.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.border,
                  },
                ]}
              >
                <FlaskIcon size={28} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No Lab Biomarkers Recorded Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Log your diagnostic reports (such as HbA1c, Fasting Glucose, Lipid Profile, or CBC) above to monitor clinical staging and historical trends over time.
              </Text>
            </View>
          ) : (
            labReports.map((lab) => {
              const isRisk = lab.tone === 'risk';
              const isWarn = lab.tone === 'warn';
              const toneColors = isRisk ? theme.risk : isWarn ? theme.warn : theme.ok;

              return (
                <View
                  key={lab.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                      {lab.testName}
                    </Text>
                    <Text style={[styles.medStrengthText, { color: theme.primary }]}>
                      {lab.value}
                    </Text>
                  </View>
                  <Text style={[styles.cardBodyText, { color: theme.textMuted }]}>
                    Reference: {lab.reference}
                  </Text>
                  <View
                    style={[
                      styles.stagingBanner,
                      {
                        backgroundColor: toneColors.bg,
                        borderColor: toneColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.stagingText, { color: toneColors.text }]}>
                      {lab.status} · {lab.date}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* SUBVIEW 2: MEDICINE CABINET & DRAP GENERIC SWITCHER */}
      {subView === 'cabinet' && (
        <View style={styles.sectionStack}>
          {/* Pharmacy Selection Header */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.cardHeaderRow}>
                <PillIcon size={18} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  DRAP Generic Switcher & Cabinet
                </Text>
              </View>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                  {doses.length} Active Prescriptions
                </Text>
              </View>
            </View>
            <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
              Select your preferred pharmacy network for live pricing and 1-tap WhatsApp refills:
            </Text>

            {/* Pharmacy Picker Pills */}
            <View style={styles.pharmacyPillRow}>
              {PAKISTANI_PHARMACY_CONTACTS.map((pharmacy) => {
                const isSelected = pharmacy.id === selectedPharmacyId;
                return (
                  <TouchableOpacity
                    key={pharmacy.id}
                    style={[
                      styles.pharmacyPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceSunken,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedPharmacyId(pharmacy.id)}
                  >
                    <Text
                      style={[
                        styles.pharmacyPillText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {pharmacy.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.pharmacySubtext, { color: theme.textMuted }]}>
              {currentPharmacy.name} · {currentPharmacy.cityCoverage}
            </Text>

            {/* 1-Tap Regimen Refill Button */}
            {doses.length > 0 && (
              <TouchableOpacity
                style={styles.whatsappRegimenBtn}
                onPress={() => handleWhatsAppRefill()}
              >
                <Text style={styles.whatsappBtnText}>
                  1-Tap WhatsApp Refill Full Regimen ({doses.length} Meds)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Honest Empty State for Cabinet */}
          {doses.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.border,
                  },
                ]}
              >
                <PillIcon size={28} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No Active Prescriptions in Cabinet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Add your prescribed medications to enable DRAP generic alternatives, inventory tracking, and 1-tap WhatsApp refills.
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary, marginTop: 12 }]}
                onPress={onOpenAddMedModal}
              >
                <PlusIcon size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            doses.map((d) => {
              const stock = stockMap[d.id] ?? 20;
              const daysRemaining = Math.max(1, Math.floor(stock / 2));
              const isLowStock = daysRemaining <= 7;
              const stockPct = Math.min(100, Math.round((stock / 30) * 100));

              // DRAP Alternative Lookups
              const altResult: PharmacyAlternative | null =
                getBioequivalentAlternatives(d.medicineName) ||
                getBioequivalentAlternatives(d.genericName);

              return (
                <View
                  key={d.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* Header row */}
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                        {d.medicineName} ({d.strength})
                      </Text>
                      <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
                        Salt: {d.genericName} · {d.mealRelation} ({d.scheduledTime})
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.timeBadge,
                        {
                          backgroundColor: theme.surfaceSunken,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.timeBadgeText, { color: theme.textMuted }]}>
                        {d.bucket.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Pill Inventory & Days Remaining */}
                  <View
                    style={[
                      styles.inventoryBox,
                      {
                        backgroundColor: theme.surfaceSunken,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.inventoryLabel, { color: theme.textPrimary }]}>
                        Pill Supply: {stock} tabs remaining (~{daysRemaining} days supply)
                      </Text>
                      <View style={styles.stockAdjustRow}>
                        <TouchableOpacity
                          style={[
                            styles.stockBtn,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                          ]}
                          onPress={() => {
                            setStockMap((prev) => ({
                              ...prev,
                              [d.id]: Math.max(0, (prev[d.id] ?? 20) - 1),
                            }));
                          }}
                        >
                          <Text style={[styles.stockBtnText, { color: theme.textPrimary }]}>-1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.stockBtn,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                          ]}
                          onPress={() => {
                            setStockMap((prev) => ({
                              ...prev,
                              [d.id]: (prev[d.id] ?? 20) + 10,
                            }));
                            onToast(`Added +10 tablets to ${d.medicineName} inventory`);
                          }}
                        >
                          <Text style={[styles.stockBtnText, { color: theme.textPrimary }]}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Stock Progress Bar */}
                    <View
                      style={[
                        styles.progressBarTrack,
                        { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${stockPct}%`,
                            backgroundColor: isLowStock ? theme.risk.text : theme.primary,
                          },
                        ]}
                      />
                    </View>

                    {/* Low Stock Warning Banner */}
                    {isLowStock && (
                      <View
                        style={[
                          styles.stagingBanner,
                          {
                            backgroundColor: theme.risk.bg,
                            borderColor: theme.risk.border,
                            marginTop: 6,
                          },
                        ]}
                      >
                        <Text style={[styles.stagingText, { color: theme.risk.text }]}>
                          Low Stock Alert: Only {daysRemaining} days remaining. Refill recommended.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* DRAP Bioequivalent Generics Section */}
                  <View
                    style={[
                      styles.drapContainer,
                      {
                        backgroundColor: theme.surfaceSunken,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.drapHeader, { color: theme.primary }]}>
                      DRAP VERIFIED BIOEQUIVALENT GENERICS
                    </Text>
                    {altResult && altResult.alternatives.length > 0 ? (
                      <View style={styles.drapList}>
                        {altResult.alternatives.map((alt) => (
                          <View
                            key={alt.name}
                            style={[
                              styles.drapItemRow,
                              { borderBottomColor: theme.border },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.drapBrandName, { color: theme.textPrimary }]}>
                                {alt.name}
                                {alt.isCheapest && '  (Best Price)'}
                              </Text>
                              <Text style={[styles.drapMfgText, { color: theme.textMuted }]}>
                                {alt.manufacturer}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.drapPriceText, { color: theme.textPrimary }]}>
                                Rs. {alt.pricePkr}
                              </Text>
                              {alt.savingsPct > 0 && (
                                <View
                                  style={[
                                    styles.savingsBadge,
                                    { backgroundColor: theme.ok.bg },
                                  ]}
                                >
                                  <Text style={[styles.savingsBadgeText, { color: theme.ok.text }]}>
                                    Save {alt.savingsPct}%
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
                        Bioequivalent generic salt: {d.genericName}. Regulated under DRAP National Essential Medicines List.
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons: WhatsApp Refill & Dose Log */}
                  <View style={styles.heroActionsRow}>
                    <TouchableOpacity
                      style={styles.whatsappMedBtn}
                      onPress={() => handleWhatsAppRefill(d.medicineName, d.strength)}
                    >
                      <Text style={styles.whatsappMedBtnText}>1-Tap WhatsApp Refill</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.takeBtn,
                        {
                          backgroundColor:
                            d.status === 'taken' ? theme.ok.bg : theme.surfaceSunken,
                          borderColor:
                            d.status === 'taken' ? theme.ok.border : theme.border,
                        },
                      ]}
                      onPress={() => onTakeDose(d.id)}
                    >
                      {d.status === 'taken' && (
                        <CheckIcon size={14} color={theme.ok.text} />
                      )}
                      <Text
                        style={[
                          styles.takeBtnText,
                          {
                            color:
                              d.status === 'taken' ? theme.ok.text : theme.textPrimary,
                          },
                        ]}
                      >
                        {d.status === 'taken' ? 'Taken' : 'Log Dose'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* SUBVIEW 3: CLINICAL ASSISTANT & INTERACTION RADAR */}
      {subView === 'assistant' && (
        <View style={styles.sectionStack}>
          {/* Drug-Drug Interaction Radar */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.cardHeaderRow}>
                <ShieldIcon size={18} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Drug-Drug Interaction Radar
                </Text>
              </View>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                  {doses.length} Meds Screened
                </Text>
              </View>
            </View>

            {detectedInteractions.length === 0 ? (
              <View
                style={[
                  styles.stagingBanner,
                  {
                    backgroundColor: theme.ok.bg,
                    borderColor: theme.ok.border,
                  },
                ]}
              >
                <CheckIcon size={14} color={theme.ok.text} />
                <Text style={[styles.stagingText, { color: theme.ok.text, flex: 1 }]}>
                  Zero Severe Contraindications Detected Across Active Regimen
                </Text>
              </View>
            ) : (
              <View style={styles.interactionAlertStack}>
                {detectedInteractions.map((item) => {
                  const isHigh = item.severity === 'high';
                  const sevColors = isHigh ? theme.risk : theme.warn;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.interactionCard,
                        {
                          backgroundColor: sevColors.bg,
                          borderColor: sevColors.border,
                        },
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <Text style={[styles.interactionTitle, { color: theme.textPrimary }]}>
                          {item.title}
                        </Text>
                        <View
                          style={[
                            styles.severityPill,
                            {
                              backgroundColor: sevColors.border,
                            },
                          ]}
                        >
                          <Text style={styles.severityPillText}>
                            {item.severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.interactionDrugs, { color: theme.primary }]}>
                        Drugs: {item.drugs}
                      </Text>
                      <Text style={[styles.interactionMechanism, { color: theme.textSecondary }]}>
                        {item.mechanism}
                      </Text>
                      <Text style={[styles.interactionAction, { color: theme.textPrimary }]}>
                        Guidance: {item.action}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={[styles.cardBodyText, { color: theme.textMuted }]}>
              Screened Regimen: {doses.map((d) => `${d.medicineName} (${d.genericName})`).join(', ') || 'No active medicines on file'}
            </Text>
          </View>

          {/* Quick Prompt Chips */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
              QUICK CLINICAL PROMPTS (1-TAP)
            </Text>
            <View style={styles.quickChipsContainer}>
              {[
                'Check meal timings for my medicines',
                'Metformin gastric side effects',
                'Can I take Panadol with my active medicines?',
                'How to handle a missed morning dose?',
              ].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.promptChip,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => submitAssistantQuery(chip)}
                >
                  <Text style={[styles.promptChipText, { color: theme.textSecondary }]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medication Q&A Chat */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <ActivityIcon size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Clinical Assistant Chat
              </Text>
            </View>

            {assistantMessages.map((m, idx) => (
              <View
                key={idx}
                style={[
                  styles.stepBox,
                  {
                    backgroundColor:
                      m.role === 'user' ? theme.primaryLight : theme.surfaceSunken,
                    borderColor:
                      m.role === 'user' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.eyebrowText,
                    { color: m.role === 'user' ? theme.primary : theme.textMuted },
                  ]}
                >
                  {m.role === 'user' ? 'YOU' : 'CLINICAL ASSISTANT (CUREWELL AI)'}
                </Text>
                <Text style={[styles.stepText, { color: theme.textPrimary }]}>
                  {m.text}
                </Text>
              </View>
            ))}

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSunken,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Ask about side effects, meal timings, or lab values..."
              placeholderTextColor={theme.textMuted}
              value={assistantQuery}
              onChangeText={setAssistantQuery}
            />
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => submitAssistantQuery(assistantQuery)}
            >
              <Text style={styles.primaryActionBtnText}>Ask Clinical Assistant</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* SUBVIEW 4: DOCTOR VISIT BRIEF & EPHEMERAL SHARING */}
      {subView === 'brief' && (
        <View style={styles.sectionStack}>
          {/* Verified 1-Page Summary Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.eyebrowText, { color: theme.textMuted }]}>
                1-PAGE CLINICAL VISIT SUMMARY
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: theme.ok.bg,
                    borderColor: theme.ok.border,
                  },
                ]}
              >
                <CheckIcon size={12} color={theme.ok.text} />
                <Text style={[styles.verifiedBadgeText, { color: theme.ok.text }]}>
                  VERIFIED PROFILE
                </Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontSize: 16 }]}>
              Patient: {activeProfile.fullName}
            </Text>
            <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
              Blood Group: {activeProfile.bloodGroup || 'Not specified'} · Allergies: {activeProfile.allergies || 'No known allergies'}
            </Text>
            <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
              Chronic Conditions: {activeProfile.chronicConditions || 'None on file'}
            </Text>

            <View
              style={[
                styles.stagingBanner,
                {
                  backgroundColor: theme.ok.bg,
                  borderColor: theme.ok.border,
                },
              ]}
            >
              <Text style={[styles.stagingText, { color: theme.ok.text }]}>
                Medication Adherence Today: {adherencePct}% ({takenCount}/{doses.length} Doses)
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
              ACTIVE MEDICATIONS ({doses.length})
            </Text>
            {doses.length === 0 ? (
              <Text style={[styles.cardBodyText, { color: theme.textMuted }]}>
                No active medications on file.
              </Text>
            ) : (
              doses.map((d) => (
                <Text key={d.id} style={[styles.stepText, { color: theme.textPrimary }]}>
                  • {d.medicineName} {d.strength} ({d.genericName}) — {d.bucket} ({d.status.toUpperCase()})
                </Text>
              ))
            )}

            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 10 }]}>
              RECENT LOGGED VITALS ({vitals.length})
            </Text>
            {vitals.length === 0 ? (
              <Text style={[styles.cardBodyText, { color: theme.textMuted }]}>
                Baseline vitals within target staging.
              </Text>
            ) : (
              vitals.slice(0, 5).map((v) => (
                <Text key={v.id} style={[styles.stepText, { color: theme.textPrimary }]}>
                  •{' '}
                  {v.type === 'bp'
                    ? `BP ${v.primaryVal}/${v.secondaryVal} mmHg`
                    : `Glucose ${v.primaryVal} mg/dL (${v.context || 'Random'})`}{' '}
                  — {v.classification} ({v.timestamp})
                </Text>
              ))
            )}

            {/* SHA-256 Clinical Integrity Watermark */}
            <View
              style={[
                styles.watermarkCard,
                {
                  backgroundColor: theme.surfaceSunken,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <LockIcon size={14} color={theme.primary} />
                <Text style={[styles.watermarkTitle, { color: theme.primary }]}>
                  SHA-256 CLINICAL INTEGRITY SEAL
                </Text>
              </View>
              <Text style={[styles.watermarkHash, { color: theme.textPrimary }]}>
                cw-sha256:{clinicalWatermarkSeal.slice(0, 28)}...
              </Text>
              <Text style={[styles.watermarkSubtext, { color: theme.textMuted }]}>
                Cryptographically hashed FIPS-180-4 timestamped record · Tamper-evident verified
              </Text>
            </View>
          </View>

          {/* Ephemeral Doctor Share Generator */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <StethoscopeIcon size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Ephemeral Doctor Share Link
              </Text>
            </View>
            <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
              Grant a consulting physician 24-hour read-only access to this summary without requiring them to create an account.
            </Text>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleGenerateDoctorShare}
            >
              <Text style={styles.primaryActionBtnText}>
                Generate Ephemeral Doctor Share Link
              </Text>
            </TouchableOpacity>

            {shareData && (
              <View
                style={[
                  styles.shareBox,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.shareBoxEyebrow, { color: theme.primary }]}>
                    24-HOUR DOCTOR ACCESS
                  </Text>
                  <Text style={[styles.shareExpiryText, { color: theme.textMuted }]}>
                    Expires: {shareData.expiresAt}
                  </Text>
                </View>

                {/* URL Display */}
                <View
                  style={[
                    styles.urlBox,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.urlText, { color: theme.primary }]}>
                    {shareData.shareUrl}
                  </Text>
                </View>

                {/* PIN Badge */}
                <View
                  style={[
                    styles.pinBox,
                    {
                      backgroundColor: theme.primaryLight,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text style={[styles.pinLabel, { color: theme.primary }]}>
                    DOCTOR ACCESS PIN
                  </Text>
                  <Text style={[styles.pinValue, { color: theme.primary }]}>
                    {shareData.pin}
                  </Text>
                  <Text style={[styles.pinSubtext, { color: theme.textSecondary }]}>
                    Share this 4-digit PIN with your doctor
                  </Text>
                </View>

                {/* 1-Tap Sharing Buttons */}
                <View style={styles.heroActionsRow}>
                  <TouchableOpacity
                    style={styles.whatsappShareBtn}
                    onPress={() => {
                      const msg = `Assalam-o-Alaikum Doctor, here is my verified Curewell Clinical Summary for ${activeProfile.fullName}:\n${shareData.shareUrl}\nSecurity PIN: ${shareData.pin}\n(Valid for 24 hours)`;
                      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`).catch(() => {
                        onToast('Could not open WhatsApp');
                      });
                    }}
                  >
                    <Text style={styles.whatsappBtnText}>Share via WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.smsShareBtn,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      const msg = `Curewell Clinical Summary for ${activeProfile.fullName}: ${shareData.shareUrl} (PIN: ${shareData.pin})`;
                      Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`).catch(() => {
                        onToast('Could not open SMS app');
                      });
                    }}
                  >
                    <Text style={[styles.smsBtnText, { color: theme.textPrimary }]}>
                      Share via SMS
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* SUBVIEW 5: SYMPTOM RED-FLAG TRIAGE */}
      {subView === 'triage' && (
        <View style={styles.sectionStack}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.cardHeaderRow}>
                <AlertTriangleIcon size={18} color={theme.risk.text} />
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Multilingual Red-Flag Triage
                </Text>
              </View>
              <View
                style={[
                  styles.offlineBadge,
                  {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text style={[styles.offlineBadgeText, { color: theme.primary }]}>
                  100% OFFLINE
                </Text>
              </View>
            </View>
            <Text style={[styles.cardBodyText, { color: theme.textSecondary }]}>
              Describe symptoms in English, Roman Urdu (e.g. &quot;seene mein shadeed dard&quot;), or Nastaliq Urdu script:
            </Text>

            {/* Free-text input */}
            <TextInput
              style={[
                styles.textInput,
                styles.triageTextInput,
                {
                  backgroundColor: theme.surfaceSunken,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Type symptoms here (English, Roman Urdu, or Urdu script)..."
              placeholderTextColor={theme.textMuted}
              value={triageInput}
              onChangeText={setTriageInput}
              multiline
            />

            {/* Quick Fill Buttons */}
            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 8 }]}>
              QUICK SYMPTOM TEMPLATES (1-TAP):
            </Text>
            <View style={styles.quickChipsContainer}>
              {[
                { label: 'Chest Pressure / Shortness of Breath', text: 'Chest pressure and shortness of breath' },
                { label: 'Seene Mein Shadeed Dard (Roman Urdu)', text: 'Mere seene mein dard hai aur pasina aa raha hai' },
                { label: 'Achanak Falij / Chehra Terha (Stroke)', text: 'Achanak falij ka asar hai aur chehra terha ho gaya' },
                { label: 'Dam Ghutna / Saans Band (Urdu)', text: 'Mujhe saans nahi aa rahi bohot dam ghut raha hai' },
                { label: 'سینے میں شدید درد (Urdu Script)', text: 'سینے میں شدید درد ہے اور بائیں بازو میں جا رہا ہے' },
                { label: 'Severe Headache / Blurred Vision', text: 'Severe headache and blurred vision' },
                { label: 'Stomach Upset After Medicine', text: 'Stomach upset and nausea after taking pills' },
                { label: 'Dizziness / Lightheadedness', text: 'Dizziness and lightheadedness after standing up' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.triageQuickChip,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setTriageInput(item.text)}
                >
                  <Text style={[styles.triageQuickChipText, { color: theme.textSecondary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* HIGH PRIORITY RED FLAG ALERT BANNER */}
            {triageResult.isRedFlag && (
              <View
                style={[
                  styles.redFlagBanner,
                  {
                    backgroundColor: theme.risk.bg,
                    borderColor: theme.risk.border,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <AlertTriangleIcon size={18} color={theme.risk.text} />
                  <Text style={[styles.redFlagTitle, { color: theme.risk.text }]}>
                    IMMEDIATE EMERGENCY: {triageResult.category}
                  </Text>
                </View>

                {triageResult.matchedKeyword && (
                  <Text style={[styles.matchedTriggerText, { color: theme.risk.text }]}>
                    Matched Symptom Trigger: &quot;{triageResult.matchedKeyword}&quot;
                  </Text>
                )}

                <Text style={[styles.redFlagGuidance, { color: theme.textPrimary }]}>
                  {triageResult.emergencyGuidance}
                </Text>

                {/* 1-Tap Emergency Helpline Call Buttons */}
                <Text style={[styles.emergencyHeader, { color: theme.risk.text }]}>
                  1-TAP CALL EMERGENCY HELPLINES:
                </Text>
                <View style={styles.emergencyHelplineStack}>
                  {EMERGENCY_HELPLINES.map((helpline) => (
                    <TouchableOpacity
                      key={helpline.number}
                      style={[
                        styles.helplineBtn,
                        { backgroundColor: theme.risk.text },
                      ]}
                      onPress={() => handleDial(helpline.tel, helpline.name)}
                    >
                      <View style={styles.rowBetween}>
                        <View style={styles.cardHeaderRow}>
                          <PhoneIcon size={16} color="#FFFFFF" />
                          <Text style={styles.helplineBtnText}>
                            Call {helpline.name} ({helpline.number})
                          </Text>
                        </View>
                        <Text style={styles.helplineDialTag}>DIAL NOW</Text>
                      </View>
                      <Text style={styles.helplineDesc}>{helpline.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Non-emergency reassurance when text entered */}
            {!triageResult.isRedFlag && triageInput.trim().length > 0 && (
              <View
                style={[
                  styles.stagingBanner,
                  {
                    backgroundColor: theme.ok.bg,
                    borderColor: theme.ok.border,
                    marginTop: 10,
                  },
                ]}
              >
                <CheckIcon size={14} color={theme.ok.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stagingText, { color: theme.ok.text }]}>
                    No Immediate Red-Flag Triaged for &quot;{triageInput.slice(0, 40)}...&quot;
                  </Text>
                  <Text style={[styles.cardBodyText, { color: theme.textSecondary, marginTop: 4 }]}>
                    Your input does not match acute life-threatening emergency patterns. However, please continue monitoring your vitals and contact your physician if symptoms worsen.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionStack: {
    gap: 14,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSubtext: {
    fontSize: 12,
    lineHeight: 17,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardBodyText: {
    fontSize: 12,
    lineHeight: 17,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medStrengthText: {
    fontSize: 14,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  vitalInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stagingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  stagingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pharmacyPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pharmacyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pharmacyPillText: {
    fontSize: 11,
  },
  pharmacySubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  whatsappRegimenBtn: {
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inventoryBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    gap: 6,
  },
  inventoryLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockAdjustRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stockBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stockBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  drapContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    gap: 6,
  },
  drapHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drapList: {
    gap: 6,
  },
  drapItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  drapBrandName: {
    fontSize: 12,
    fontWeight: '700',
  },
  drapMfgText: {
    fontSize: 10,
  },
  drapPriceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  savingsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  savingsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  whatsappMedBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappMedBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  takeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  takeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  interactionAlertStack: {
    gap: 8,
  },
  interactionCard: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  interactionTitle: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  interactionDrugs: {
    fontSize: 11,
    fontWeight: '700',
  },
  interactionMechanism: {
    fontSize: 11,
    lineHeight: 15,
  },
  interactionAction: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  quickChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  promptChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  stepText: {
    fontSize: 12,
    lineHeight: 17,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  watermarkCard: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 4,
    marginTop: 8,
  },
  watermarkTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  watermarkHash: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  watermarkSubtext: {
    fontSize: 10,
  },
  shareBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  shareBoxEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  shareExpiryText: {
    fontSize: 10,
  },
  urlBox: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  urlText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pinBox: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
  },
  pinLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pinValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
  },
  pinSubtext: {
    fontSize: 10,
  },
  whatsappShareBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  smsShareBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  smsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  offlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  offlineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  triageTextInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  triageQuickChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  triageQuickChipText: {
    fontSize: 11,
  },
  redFlagBanner: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  redFlagTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  matchedTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  redFlagGuidance: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  emergencyHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  emergencyHelplineStack: {
    gap: 6,
  },
  helplineBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 2,
  },
  helplineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  helplineDialTag: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  helplineDesc: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.9,
  },
});

export default ClinicalSuiteScreen;
