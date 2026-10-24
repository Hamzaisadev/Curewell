import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme';
import {
  HeartPulseIcon,
  DropletIcon,
  ActivityIcon,
  ClockIcon,
  CheckIcon,
  PlusIcon,
  AlertTriangleIcon,
} from '../components/icons';
import { VitalLog } from '../types';
import { evaluateBP, evaluateGlucose } from '../domain/vitals';
import { VitalsTrendChart, TimeRangeOption } from '../components';

export interface VitalsScreenProps {
  vitals: VitalLog[];
  onSaveVital: (vital: Omit<VitalLog, 'id' | 'timestamp'>) => void;
  onToast: (msg: string) => void;
}

type GlucoseContextOption = 'Fasting' | 'After Meal' | 'Random';

export const VitalsScreen: React.FC<VitalsScreenProps> = ({ vitals, onSaveVital, onToast }) => {
  const { theme, isDark } = useTheme();

  const [vitalMode, setVitalMode] = useState<'bp' | 'glucose'>('bp');

  // EMPTY inputs by default — NO fake baseline values pre-populated (ADR 0004)
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [glucose, setGlucose] = useState('');
  const [glucoseContext, setGlucoseContext] = useState<GlucoseContextOption>('Fasting');
  const [trendTimeRange, setTrendTimeRange] = useState<TimeRangeOption>('7d');

  const bpEvaluation = useMemo(() => {
    const s = parseInt(systolic, 10);
    const d = parseInt(diastolic, 10);
    if (!s || !d) return null;
    return evaluateBP(s, d);
  }, [systolic, diastolic]);

  const glucoseEvaluation = useMemo(() => {
    const g = parseInt(glucose, 10);
    if (!g) return null;
    return evaluateGlucose(g, glucoseContext);
  }, [glucose, glucoseContext]);

  const handleSave = () => {
    Vibration.vibrate(40);

    if (vitalMode === 'bp') {
      const s = parseInt(systolic, 10);
      const d = parseInt(diastolic, 10);
      const p = parseInt(pulse, 10) || undefined;

      if (!s || !d) {
        onToast('Please enter both Systolic and Diastolic numbers.');
        return;
      }

      const evalResult = evaluateBP(s, d);
      onSaveVital({
        type: 'bp',
        primaryVal: s,
        secondaryVal: d,
        pulse: p,
        classification: evalResult.label,
        tone: evalResult.tone,
      });

      // Clear input fields after save
      setSystolic('');
      setDiastolic('');
      setPulse('');
      onToast(`BP ${s}/${d} mmHg recorded (${evalResult.label}).`);
    } else {
      const g = parseInt(glucose, 10);
      if (!g) {
        onToast('Please enter a valid blood glucose reading.');
        return;
      }

      const evalResult = evaluateGlucose(g, glucoseContext);
      onSaveVital({
        type: 'glucose',
        primaryVal: g,
        context: glucoseContext,
        classification: evalResult.label,
        tone: evalResult.tone,
      });

      setGlucose('');
      onToast(`Glucose ${g} mg/dL recorded (${glucoseContext}).`);
    }
  };

  const filteredVitals = useMemo(
    () => vitals.filter((v) => (vitalMode === 'bp' ? v.type === 'bp' : v.type === 'glucose')),
    [vitals, vitalMode]
  );

  return (
    <View style={styles.container}>
      {/* MODE SELECTOR */}
      <View style={[styles.segmentedBar, { backgroundColor: theme.surfaceSunken, borderColor: theme.line }]}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            vitalMode === 'bp' && [styles.segmentBtnActive, { backgroundColor: theme.surface }],
          ]}
          onPress={() => setVitalMode('bp')}
          activeOpacity={0.8}
        >
          <ActivityIcon size={16} color={vitalMode === 'bp' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.segmentBtnText,
              { color: vitalMode === 'bp' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Blood Pressure (mmHg)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            vitalMode === 'glucose' && [styles.segmentBtnActive, { backgroundColor: theme.surface }],
          ]}
          onPress={() => setVitalMode('glucose')}
          activeOpacity={0.8}
        >
          <DropletIcon size={16} color={vitalMode === 'glucose' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.segmentBtnText,
              { color: vitalMode === 'glucose' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Blood Glucose (mg/dL)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 10-SECOND RAPID INTAKE CARD */}
      <View style={[styles.intakeCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {vitalMode === 'bp' ? (
          <>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  10-Second Blood Pressure Intake
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                  Standard clinical arm cuff measurement
                </Text>
              </View>
            </View>

            <View style={styles.vitalInputsRow}>
              <View style={styles.vitalInputBox}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>SYSTOLIC</Text>
                <TextInput
                  style={[
                    styles.bigNumericInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="120"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="numeric"
                  value={systolic}
                  onChangeText={setSystolic}
                  maxLength={3}
                />
              </View>

              <View style={styles.vitalInputBox}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>DIASTOLIC</Text>
                <TextInput
                  style={[
                    styles.bigNumericInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="80"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="numeric"
                  value={diastolic}
                  onChangeText={setDiastolic}
                  maxLength={3}
                />
              </View>

              <View style={styles.vitalInputBox}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>PULSE (BPM)</Text>
                <TextInput
                  style={[
                    styles.bigNumericInput,
                    {
                      backgroundColor: theme.surfaceSunken,
                      borderColor: theme.lineStrong,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="72"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="numeric"
                  value={pulse}
                  onChangeText={setPulse}
                  maxLength={3}
                />
              </View>
            </View>

            {bpEvaluation && (
              <View
                style={[
                  styles.stagingBanner,
                  {
                    backgroundColor:
                      bpEvaluation.tone === 'risk'
                        ? theme.risk.bg
                        : bpEvaluation.tone === 'warn'
                        ? theme.warn.bg
                        : theme.ok.bg,
                    borderColor:
                      bpEvaluation.tone === 'risk'
                        ? theme.risk.border
                        : bpEvaluation.tone === 'warn'
                        ? theme.warn.border
                        : theme.ok.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stagingText,
                    {
                      color:
                        bpEvaluation.tone === 'risk'
                          ? theme.risk.text
                          : bpEvaluation.tone === 'warn'
                          ? theme.warn.text
                          : theme.ok.text,
                    },
                  ]}
                >
                  AHA Staging: {bpEvaluation.label}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  10-Second Blood Glucose Intake
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                  Fingerstick capillary or CGM reading
                </Text>
              </View>
            </View>

            <View style={styles.vitalInputBox}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                GLUCOSE READING (mg/dL)
              </Text>
              <TextInput
                style={[
                  styles.bigNumericInput,
                  {
                    backgroundColor: theme.surfaceSunken,
                    borderColor: theme.lineStrong,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="95"
                placeholderTextColor={theme.textSubtle}
                keyboardType="numeric"
                value={glucose}
                onChangeText={setGlucose}
                maxLength={3}
              />
            </View>

            {/* Context Pills */}
            <View style={styles.contextPillsRow}>
              {(['Fasting', 'After Meal', 'Random'] as const).map((ctx) => {
                const active = glucoseContext === ctx;
                return (
                  <TouchableOpacity
                    key={ctx}
                    style={[
                      styles.contextPill,
                      {
                        backgroundColor: active ? theme.primary : theme.surfaceSunken,
                        borderColor: active ? theme.primary : theme.line,
                      },
                    ]}
                    onPress={() => setGlucoseContext(ctx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.contextPillText,
                        { color: active ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {ctx}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {glucoseEvaluation && (
              <View
                style={[
                  styles.stagingBanner,
                  {
                    backgroundColor:
                      glucoseEvaluation.tone === 'risk'
                        ? theme.risk.bg
                        : glucoseEvaluation.tone === 'warn'
                        ? theme.warn.bg
                        : theme.ok.bg,
                    borderColor:
                      glucoseEvaluation.tone === 'risk'
                        ? theme.risk.border
                        : glucoseEvaluation.tone === 'warn'
                        ? theme.warn.border
                        : theme.ok.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stagingText,
                    {
                      color:
                        glucoseEvaluation.tone === 'risk'
                          ? theme.risk.text
                          : glucoseEvaluation.tone === 'warn'
                          ? theme.warn.text
                          : theme.ok.text,
                    },
                  ]}
                >
                  ADA Target: {glucoseEvaluation.label}
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.saveVitalBtn, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <CheckIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.saveVitalBtnText}>Record Reading to Health Vault</Text>
        </TouchableOpacity>
      </View>

      {/* TRENDLINES & HONEST EMPTY STATE */}
      <View style={[styles.intakeCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Visual Trendlines &amp; Rolling Averages
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
            {vitalMode === 'bp'
              ? 'Blood Pressure Staging & Pulse Continuity'
              : 'Blood Glucose Dynamics & Target Compliance'}
          </Text>
        </View>

        {filteredVitals.length === 0 ? (
          <View style={styles.chartEmptyBox}>
            <View style={[styles.chartEmptyIconCircle, { backgroundColor: theme.surfaceAccent }]}>
              {vitalMode === 'bp' ? (
                <ActivityIcon size={24} color={theme.primary} />
              ) : (
                <DropletIcon size={24} color={theme.primary} />
              )}
            </View>
            <Text style={[styles.chartEmptyTitle, { color: theme.textPrimary }]}>
              No {vitalMode === 'bp' ? 'Blood Pressure' : 'Glucose'} Logs Recorded
            </Text>
            <Text style={[styles.chartEmptyText, { color: theme.textMuted }]}>
              Medfolio adheres to ADR 0004: we never render fake oscillating curves when no data
              exists. Enter a reading above to plot your first clinical trendline.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.rangeToggleBar}>
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
                      styles.rangeToggleBtn,
                      {
                        backgroundColor: active ? theme.primary : theme.surfaceSunken,
                        borderColor: active ? theme.primary : theme.line,
                      },
                    ]}
                    onPress={() => setTrendTimeRange(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.rangeToggleBtnText,
                        { color: active ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <VitalsTrendChart
              vitals={filteredVitals}
              mode={vitalMode}
              timeRange={trendTimeRange}
            />
          </>
        )}
      </View>

      {/* RECENT HISTORICAL LOGS */}
      {filteredVitals.length > 0 && (
        <View style={[styles.intakeCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Recorded Readings History</Text>
          <View style={styles.historyList}>
            {filteredVitals.slice(0, 10).map((v) => (
              <View
                key={v.id}
                style={[styles.historyRow, { borderBottomColor: theme.line }]}
              >
                <View>
                  <Text style={[styles.historyVal, { color: theme.textPrimary }]}>
                    {v.type === 'bp'
                      ? `${v.primaryVal}/${v.secondaryVal} mmHg`
                      : `${v.primaryVal} mg/dL`}
                    {v.pulse ? ` • ${v.pulse} bpm` : ''}
                  </Text>
                  <Text style={[styles.historyTimestamp, { color: theme.textMuted }]}>
                    {v.context ? `${v.context} • ` : ''}
                    {v.timestamp}
                  </Text>
                </View>

                <View
                  style={[
                    styles.historyBadge,
                    {
                      backgroundColor:
                        v.tone === 'risk'
                          ? theme.risk.bg
                          : v.tone === 'warn'
                          ? theme.warn.bg
                          : theme.ok.bg,
                      borderColor:
                        v.tone === 'risk'
                          ? theme.risk.border
                          : v.tone === 'warn'
                          ? theme.warn.border
                          : theme.ok.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.historyBadgeText,
                      {
                        color:
                          v.tone === 'risk'
                            ? theme.risk.text
                            : v.tone === 'warn'
                            ? theme.warn.text
                            : theme.ok.text,
                      },
                    ]}
                  >
                    {v.classification}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  intakeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  vitalInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalInputBox: {
    flex: 1,
    gap: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bigNumericInput: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stagingBanner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  stagingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  contextPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contextPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  contextPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveVitalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveVitalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  chartHeaderRow: {
    gap: 2,
  },
  rangeToggleBar: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  rangeToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartEmptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  chartEmptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  chartEmptyText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  historyList: {
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyTimestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  historyBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
