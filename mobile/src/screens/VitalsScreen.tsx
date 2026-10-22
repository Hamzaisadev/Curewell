import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Vibration, StyleSheet } from 'react-native';
import { VitalLog } from '../types';
import { evaluateBP, evaluateGlucose } from '../domain/vitals';
import { styles } from '../styles/commonStyles';
import { VitalsTrendChart, TimeRangeOption } from '../components';

export interface VitalsScreenProps {
  vitals: VitalLog[];
  onSaveVital: (vital: Omit<VitalLog, 'id' | 'timestamp'>) => void;
  onToast: (msg: string) => void;
}

type GlucoseContextOption = 'Fasting' | 'After Meal' | 'Random';

export const VitalsScreen: React.FC<VitalsScreenProps> = ({
  vitals,
  onSaveVital,
  onToast,
}) => {
  const [vitalMode, setVitalMode] = useState<'bp' | 'glucose'>('bp');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [glucose, setGlucose] = useState('95');
  const [glucoseContext, setGlucoseContext] = useState<GlucoseContextOption>('Fasting');
  const [trendTimeRange, setTrendTimeRange] = useState<TimeRangeOption>('7d');

  const bpEvaluation = useMemo(() => {
    const s = parseInt(systolic, 10);
    const d = parseInt(diastolic, 10);
    return evaluateBP(s, d);
  }, [systolic, diastolic]);

  const glucoseEvaluation = useMemo(() => {
    const g = parseInt(glucose, 10);
    return evaluateGlucose(g, glucoseContext);
  }, [glucose, glucoseContext]);

  const handleSave = () => {
    Vibration.vibrate(50);

    if (vitalMode === 'bp') {
      const s = parseInt(systolic, 10);
      const d = parseInt(diastolic, 10);
      const p = parseInt(pulse, 10) || 72;

      if (!s || !d) {
        onToast('Please enter both Systolic and Diastolic values');
        return;
      }

      onSaveVital({
        type: 'bp',
        primaryVal: s,
        secondaryVal: d,
        pulse: p,
        classification: bpEvaluation.label,
        tone: bpEvaluation.tone,
      });
      onToast(`BP ${s}/${d} mmHg recorded (${bpEvaluation.label})`);
    } else {
      const g = parseInt(glucose, 10);

      if (!g) {
        onToast('Please enter a valid glucose reading');
        return;
      }

      onSaveVital({
        type: 'glucose',
        primaryVal: g,
        context: glucoseContext,
        classification: glucoseEvaluation.label,
        tone: glucoseEvaluation.tone,
      });
      onToast(`Glucose ${g} mg/dL recorded (${glucoseContext})`);
    }
  };

  return (
    <View style={styles.sectionStack}>
      {/* Mode Switcher */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, vitalMode === 'bp' && styles.segmentBtnActive]}
          onPress={() => setVitalMode('bp')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              vitalMode === 'bp' && styles.segmentBtnTextActive,
            ]}
          >
            Blood Pressure (mmHg)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, vitalMode === 'glucose' && styles.segmentBtnActive]}
          onPress={() => setVitalMode('glucose')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              vitalMode === 'glucose' && styles.segmentBtnTextActive,
            ]}
          >
            Blood Glucose (mg/dL)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 10-Second Intake Card */}
      <View style={styles.card}>
        {vitalMode === 'bp' ? (
          <>
            <Text style={styles.cardTitle}>10-Second Blood Pressure Intake</Text>
            <View style={styles.vitalInputsRow}>
              <View style={styles.vitalInputBox}>
                <Text style={styles.inputLabel}>SYSTOLIC</Text>
                <TextInput
                  style={styles.bigNumericInput}
                  keyboardType="numeric"
                  value={systolic}
                  onChangeText={setSystolic}
                  maxLength={3}
                />
              </View>
              <View style={styles.vitalInputBox}>
                <Text style={styles.inputLabel}>DIASTOLIC</Text>
                <TextInput
                  style={styles.bigNumericInput}
                  keyboardType="numeric"
                  value={diastolic}
                  onChangeText={setDiastolic}
                  maxLength={3}
                />
              </View>
              <View style={styles.vitalInputBox}>
                <Text style={styles.inputLabel}>PULSE (BPM)</Text>
                <TextInput
                  style={styles.bigNumericInput}
                  keyboardType="numeric"
                  value={pulse}
                  onChangeText={setPulse}
                  maxLength={3}
                />
              </View>
            </View>

            <View
              style={[
                styles.stagingBanner,
                bpEvaluation.tone === 'risk'
                  ? styles.stagingRisk
                  : bpEvaluation.tone === 'warn'
                  ? styles.stagingWarn
                  : styles.stagingOk,
              ]}
            >
              <Text style={styles.stagingText}>AHA Stage: {bpEvaluation.label}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>10-Second Blood Glucose Intake</Text>
            <View style={styles.vitalInputBox}>
              <Text style={styles.inputLabel}>GLUCOSE READING (mg/dL)</Text>
              <TextInput
                style={styles.bigNumericInput}
                keyboardType="numeric"
                value={glucose}
                onChangeText={setGlucose}
                maxLength={3}
              />
            </View>

            <View style={styles.contextPillsRow}>
              {(['Fasting', 'After Meal', 'Random'] as const).map((ctx) => (
                <TouchableOpacity
                  key={ctx}
                  style={[
                    styles.contextPill,
                    glucoseContext === ctx && styles.contextPillActive,
                  ]}
                  onPress={() => setGlucoseContext(ctx)}
                >
                  <Text
                    style={[
                      styles.contextPillText,
                      glucoseContext === ctx && styles.contextPillTextActive,
                    ]}
                  >
                    {ctx}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[
                styles.stagingBanner,
                glucoseEvaluation.tone === 'risk'
                  ? styles.stagingRisk
                  : glucoseEvaluation.tone === 'warn'
                  ? styles.stagingWarn
                  : styles.stagingOk,
              ]}
            >
              <Text style={styles.stagingText}>ADA Target: {glucoseEvaluation.label}</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.saveVitalBtn} onPress={handleSave}>
          <Text style={styles.saveVitalBtnText}>Record Reading Offline</Text>
        </TouchableOpacity>
      </View>

      {/* Visual Trendlines & Rolling Averages */}
      <View style={styles.card}>
        <View style={screenStyles.chartHeaderRow}>
          <Text style={styles.cardTitle}>Visual Trendlines &amp; Rolling Averages</Text>
          <Text style={screenStyles.chartSubtitle}>
            {vitalMode === 'bp'
              ? 'Blood Pressure Staging & Rolling Pulse'
              : 'Blood Glucose Dynamics & Target Compliance'}
          </Text>
        </View>

        {/* Time Range Toggle */}
        <View style={screenStyles.rangeToggleBar}>
          {(
            [
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: 'all', label: 'All Readings' },
            ] as const
          ).map((item) => {
            const active = trendTimeRange === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  screenStyles.rangeToggleBtn,
                  active && screenStyles.rangeToggleBtnActive,
                ]}
                onPress={() => {
                  Vibration.vibrate(20);
                  setTrendTimeRange(item.key);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    screenStyles.rangeToggleBtnText,
                    active && screenStyles.rangeToggleBtnTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <VitalsTrendChart
          vitals={vitals}
          mode={vitalMode}
          timeRange={trendTimeRange}
          onTimeRangeChange={setTrendTimeRange}
          hideHeaderControls={true}
        />
      </View>

      {/* Vitals History List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Logged Vitals ({vitals.length})</Text>
        {vitals.length === 0 ? (
          <Text style={styles.emptyText}>
            No vitals recorded on this phone yet. Log a reading above.
          </Text>
        ) : (
          vitals.map((v) => (
            <View key={v.id} style={styles.vitalHistoryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vitalHistoryValue}>
                  {v.type === 'bp'
                    ? `BP: ${v.primaryVal}/${v.secondaryVal} mmHg (${v.pulse} bpm)`
                    : `Glucose: ${v.primaryVal} mg/dL (${v.context})`}
                </Text>
                <View style={screenStyles.badgeRow}>
                  <View
                    style={[
                      screenStyles.toneBadge,
                      v.tone === 'risk'
                        ? screenStyles.badgeRisk
                        : v.tone === 'warn'
                        ? screenStyles.badgeWarn
                        : screenStyles.badgeOk,
                    ]}
                  >
                    <Text
                      style={[
                        screenStyles.badgeText,
                        v.tone === 'risk'
                          ? screenStyles.textRisk
                          : v.tone === 'warn'
                          ? screenStyles.textWarn
                          : screenStyles.textOk,
                      ]}
                    >
                      {v.classification}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.vitalHistoryTime}>{v.timestamp}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const screenStyles = StyleSheet.create({
  chartHeaderRow: {
    marginBottom: 4,
  },
  chartSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  rangeToggleBar: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  rangeToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  rangeToggleBtnActive: {
    backgroundColor: '#0D9488',
  },
  rangeToggleBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  rangeToggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badgeRow: {
    marginTop: 3,
    flexDirection: 'row',
  },
  toneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOk: {
    backgroundColor: '#064E3B44',
  },
  badgeWarn: {
    backgroundColor: '#78350F44',
  },
  badgeRisk: {
    backgroundColor: '#7F1D1D44',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textOk: {
    color: '#34D399',
  },
  textWarn: {
    color: '#FBBF24',
  },
  textRisk: {
    color: '#F87171',
  },
});

export default VitalsScreen;
