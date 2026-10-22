import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { VitalLog } from '../../types';

export type TimeRangeOption = '7d' | '30d' | 'all';

export interface VitalsTrendChartProps {
  vitals: VitalLog[];
  mode: 'bp' | 'glucose';
  timeRange?: TimeRangeOption;
  onTimeRangeChange?: (range: TimeRangeOption) => void;
  hideHeaderControls?: boolean;
}

/**
 * Pure React Native Trend Chart & Rolling Analytics Engine
 * Requires no third-party native graphing dependencies.
 */
export const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({
  vitals,
  mode,
  timeRange: controlledTimeRange,
  onTimeRangeChange,
  hideHeaderControls = false,
}) => {
  const [internalTimeRange, setInternalTimeRange] = useState<TimeRangeOption>('7d');
  const activeRange = controlledTimeRange ?? internalTimeRange;

  const handleRangeSelect = (range: TimeRangeOption) => {
    setInternalTimeRange(range);
    onTimeRangeChange?.(range);
  };

  const [plotAreaWidth, setPlotAreaWidth] = useState<number>(260);

  const handlePlotLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 60) {
      setPlotAreaWidth(width);
    }
  };

  // Helper to parse timestamps or fallback to ID timestamp
  const parseTimestampMs = (v: VitalLog): number => {
    if (v.timestamp) {
      const parsed = Date.parse(v.timestamp);
      if (!isNaN(parsed)) return parsed;
    }
    const match = v.id?.match(/\d{10,}/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num)) return num;
    }
    return Date.now();
  };

  // Filter vitals by mode
  const modeVitals = useMemo(() => {
    return vitals.filter((v) => v.type === mode);
  }, [vitals, mode]);

  // Sort chronologically (oldest to newest)
  const chronologicalVitals = useMemo(() => {
    return [...modeVitals].sort((a, b) => parseTimestampMs(a) - parseTimestampMs(b));
  }, [modeVitals]);

  // Filter by time range
  const chartData = useMemo(() => {
    if (chronologicalVitals.length === 0) return [];
    if (activeRange === 'all') return chronologicalVitals;

    const now = Date.now();
    const limitDays = activeRange === '7d' ? 7 : 30;
    const limitMs = limitDays * 86400000;

    const filtered = chronologicalVitals.filter((v) => {
      const diff = now - parseTimestampMs(v);
      return diff <= limitMs && diff >= -86400000;
    });

    // If date math filtered out everything (e.g. testing with relative string timestamps),
    // fallback to latest N readings
    if (filtered.length < 2 && chronologicalVitals.length > 0) {
      return activeRange === '7d'
        ? chronologicalVitals.slice(-7)
        : chronologicalVitals.slice(-30);
    }

    return filtered;
  }, [chronologicalVitals, activeRange]);

  // ---------------------------------------------------------------------------
  // Rolling Averages & Analytics Computations
  // ---------------------------------------------------------------------------
  const rollingAnalytics = useMemo(() => {
    const now = Date.now();
    const ms7d = 7 * 86400000;
    const ms30d = 30 * 86400000;

    // 7d subset
    let vitals7d = chronologicalVitals.filter((v) => now - parseTimestampMs(v) <= ms7d);
    if (vitals7d.length === 0 && chronologicalVitals.length > 0) {
      vitals7d = chronologicalVitals.slice(-7);
    }

    // 30d subset
    let vitals30d = chronologicalVitals.filter((v) => now - parseTimestampMs(v) <= ms30d);
    if (vitals30d.length === 0 && chronologicalVitals.length > 0) {
      vitals30d = chronologicalVitals.slice(-30);
    }

    if (mode === 'bp') {
      // 7-day Systolic / Diastolic & Pulse
      const sys7 = vitals7d.map((v) => v.primaryVal).filter(Boolean);
      const dia7 = vitals7d.map((v) => v.secondaryVal || 0).filter(Boolean);
      const pulse7 = vitals7d.map((v) => v.pulse || 0).filter(Boolean);

      const avgSys7d = sys7.length ? Math.round(sys7.reduce((a, b) => a + b, 0) / sys7.length) : null;
      const avgDia7d = dia7.length ? Math.round(dia7.reduce((a, b) => a + b, 0) / dia7.length) : null;
      const avgPulse7d = pulse7.length ? Math.round(pulse7.reduce((a, b) => a + b, 0) / pulse7.length) : null;

      // 30-day Systolic / Diastolic
      const sys30 = vitals30d.map((v) => v.primaryVal).filter(Boolean);
      const dia30 = vitals30d.map((v) => v.secondaryVal || 0).filter(Boolean);
      const avgSys30d = sys30.length ? Math.round(sys30.reduce((a, b) => a + b, 0) / sys30.length) : null;
      const avgDia30d = dia30.length ? Math.round(dia30.reduce((a, b) => a + b, 0) / dia30.length) : null;

      // % Normal Range (< 120 Systolic and < 80 Diastolic or tone === 'ok')
      const targetCount = vitals7d.filter(
        (v) => (v.primaryVal < 120 && (v.secondaryVal == null || v.secondaryVal < 80)) || v.tone === 'ok'
      ).length;
      const pctNormal = vitals7d.length ? Math.round((targetCount / vitals7d.length) * 100) : null;

      return {
        avgSys7d,
        avgDia7d,
        avgPulse7d,
        avgSys30d,
        avgDia30d,
        pctNormal,
        count7d: vitals7d.length,
      };
    } else {
      // Glucose: 7d Avg Fasting, Avg Post-Meal, 30d Avg Glucose, % in Target Range (70-130)
      const fastingLogs = vitals7d.filter((v) =>
        (v.context || '').toLowerCase().includes('fasting')
      );
      const postMealLogs = vitals7d.filter(
        (v) =>
          (v.context || '').toLowerCase().includes('meal') ||
          (v.context || '').toLowerCase().includes('post')
      );

      const avgFasting7d = fastingLogs.length
        ? Math.round(fastingLogs.reduce((a, b) => a + b.primaryVal, 0) / fastingLogs.length)
        : null;

      const avgPostMeal7d = postMealLogs.length
        ? Math.round(postMealLogs.reduce((a, b) => a + b.primaryVal, 0) / postMealLogs.length)
        : null;

      // 30d overall glucose average
      const gluc30 = vitals30d.map((v) => v.primaryVal).filter(Boolean);
      const avgGlucose30d = gluc30.length
        ? Math.round(gluc30.reduce((a, b) => a + b, 0) / gluc30.length)
        : null;

      // % in Target Range (70 - 130 mg/dL or tone === 'ok')
      const inTargetCount = vitals7d.filter(
        (v) => (v.primaryVal >= 70 && v.primaryVal <= 130) || v.tone === 'ok'
      ).length;
      const pctTarget = vitals7d.length ? Math.round((inTargetCount / vitals7d.length) * 100) : null;

      return {
        avgFasting7d,
        avgPostMeal7d,
        avgGlucose30d,
        pctTarget,
        count7d: vitals7d.length,
      };
    }
  }, [chronologicalVitals, mode]);

  // ---------------------------------------------------------------------------
  // Chart Geometry & Bounds
  // ---------------------------------------------------------------------------
  const chartHeight = 160;
  const paddingTop = 22;
  const paddingBottom = 22;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  // Min / Max Bounds & Reference Bands
  const isBP = mode === 'bp';
  const yMin = isBP ? 50 : 50;
  const yMax = isBP ? 190 : 220;

  const getYCoord = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return paddingTop + (1 - ratio) * usableHeight;
  };

  // Normal Target Band Boundaries
  // BP target zone: Systolic < 120 and Diastolic < 80. Reference zone 60 - 120 mmHg.
  // Glucose target zone: 70 - 130 mg/dL.
  const targetBandTop = getYCoord(isBP ? 120 : 130);
  const targetBandBottom = getYCoord(isBP ? 60 : 70);
  const targetBandHeight = Math.max(12, targetBandBottom - targetBandTop);

  // Map Data Points to Screen Coordinates
  const N = chartData.length;
  const horizPadding = 24;
  const usableWidth = Math.max(40, plotAreaWidth - horizPadding * 2);

  const points = useMemo(() => {
    if (N === 0) return [];
    if (N === 1) {
      const v = chartData[0];
      return [
        {
          id: v.id,
          x: plotAreaWidth / 2,
          ySys: getYCoord(v.primaryVal),
          yDia: v.secondaryVal ? getYCoord(v.secondaryVal) : null,
          sysVal: v.primaryVal,
          diaVal: v.secondaryVal,
          pulse: v.pulse,
          tone: v.tone,
          label: formatShortDate(v.timestamp, v.id),
        },
      ];
    }

    return chartData.map((v, i) => {
      const x = horizPadding + (i * usableWidth) / (N - 1);
      return {
        id: v.id,
        x,
        ySys: getYCoord(v.primaryVal),
        yDia: v.secondaryVal ? getYCoord(v.secondaryVal) : null,
        sysVal: v.primaryVal,
        diaVal: v.secondaryVal,
        pulse: v.pulse,
        tone: v.tone,
        label: formatShortDate(v.timestamp, v.id),
      };
    });
  }, [chartData, N, plotAreaWidth, usableWidth]);

  return (
    <View style={[chartStyles.container, hideHeaderControls && chartStyles.containerFlat]}>
      {/* Header & Time Range Controls */}
      {!hideHeaderControls && (
        <View style={chartStyles.headerRow}>
          <View>
            <Text style={chartStyles.title}>Visual Trendlines & Analytics</Text>
            <Text style={chartStyles.subtitle}>
              {isBP ? 'Blood Pressure (mmHg)' : 'Blood Glucose (mg/dL)'}
            </Text>
          </View>

          <View style={chartStyles.rangePillContainer}>
            {(['7d', '30d', 'all'] as const).map((range) => {
              const isSelected = activeRange === range;
              const label = range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All';
              return (
                <TouchableOpacity
                  key={range}
                  style={[chartStyles.rangeBtn, isSelected && chartStyles.rangeBtnActive]}
                  onPress={() => handleRangeSelect(range)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      chartStyles.rangeBtnText,
                      isSelected && chartStyles.rangeBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Rolling Averages Summary Cards */}
      <View style={chartStyles.metricsGrid}>
        {isBP ? (
          <>
            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>7D AVG BP</Text>
              <Text style={chartStyles.metricValue}>
                {rollingAnalytics.avgSys7d && rollingAnalytics.avgDia7d
                  ? `${rollingAnalytics.avgSys7d}/${rollingAnalytics.avgDia7d}`
                  : '--/--'}
              </Text>
              <Text style={chartStyles.metricUnit}>mmHg</Text>
            </View>

            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>30D AVG BP</Text>
              <Text style={chartStyles.metricValue}>
                {rollingAnalytics.avgSys30d && rollingAnalytics.avgDia30d
                  ? `${rollingAnalytics.avgSys30d}/${rollingAnalytics.avgDia30d}`
                  : '--/--'}
              </Text>
              <Text style={chartStyles.metricUnit}>mmHg</Text>
            </View>

            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>7D AVG PULSE</Text>
              <Text style={chartStyles.metricValue}>
                {rollingAnalytics.avgPulse7d ? `${rollingAnalytics.avgPulse7d}` : '--'}
              </Text>
              <Text style={chartStyles.metricUnit}>bpm</Text>
            </View>

            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>NORMAL RANGE</Text>
              <Text
                style={[
                  chartStyles.metricValue,
                  (rollingAnalytics.pctNormal ?? 0) >= 70
                    ? chartStyles.metricGreen
                    : chartStyles.metricAmber,
                ]}
              >
                {rollingAnalytics.pctNormal !== null ? `${rollingAnalytics.pctNormal}%` : '--'}
              </Text>
              <Text style={chartStyles.metricUnit}>
                {rollingAnalytics.pctNormal !== null ? 'Target <120/80' : 'No data'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>7D FASTING</Text>
              <Text style={chartStyles.metricValue}>
                {rollingAnalytics.avgFasting7d ? `${rollingAnalytics.avgFasting7d}` : '--'}
              </Text>
              <Text style={chartStyles.metricUnit}>mg/dL (70-99)</Text>
            </View>

            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>7D POST-MEAL</Text>
              <Text style={chartStyles.metricValue}>
                {rollingAnalytics.avgPostMeal7d ? `${rollingAnalytics.avgPostMeal7d}` : '--'}
              </Text>
              <Text style={chartStyles.metricUnit}>mg/dL (&lt;140)</Text>
            </View>

            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>30D AVG GLUCOSE</Text>
              <Text style={chartStyles.metricValue}>
                {rollingAnalytics.avgGlucose30d ? `${rollingAnalytics.avgGlucose30d}` : '--'}
              </Text>
              <Text style={chartStyles.metricUnit}>mg/dL overall</Text>
            </View>

            <View style={chartStyles.metricCard}>
              <Text style={chartStyles.metricLabel}>IN TARGET RANGE</Text>
              <Text
                style={[
                  chartStyles.metricValue,
                  (rollingAnalytics.pctTarget ?? 0) >= 70
                    ? chartStyles.metricGreen
                    : chartStyles.metricAmber,
                ]}
              >
                {rollingAnalytics.pctTarget !== null ? `${rollingAnalytics.pctTarget}%` : '--'}
              </Text>
              <Text style={chartStyles.metricUnit}>
                {rollingAnalytics.pctTarget !== null ? '70-130 mg/dL' : 'No data'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Legend & Target Zone Badge */}
      <View style={chartStyles.legendRow}>
        {isBP ? (
          <>
            <View style={chartStyles.legendItem}>
              <View style={[chartStyles.legendDot, { backgroundColor: '#2DD4BF' }]} />
              <Text style={chartStyles.legendText}>Systolic</Text>
            </View>
            <View style={chartStyles.legendItem}>
              <View style={[chartStyles.legendDot, { backgroundColor: '#818CF8' }]} />
              <Text style={chartStyles.legendText}>Diastolic</Text>
            </View>
            <View style={chartStyles.legendItem}>
              <View style={[chartStyles.legendBandBox, { backgroundColor: '#10B98126' }]} />
              <Text style={chartStyles.legendText}>Target (&lt;120/80)</Text>
            </View>
          </>
        ) : (
          <>
            <View style={chartStyles.legendItem}>
              <View style={[chartStyles.legendDot, { backgroundColor: '#2DD4BF' }]} />
              <Text style={chartStyles.legendText}>Glucose</Text>
            </View>
            <View style={chartStyles.legendItem}>
              <View style={[chartStyles.legendBandBox, { backgroundColor: '#10B98126' }]} />
              <Text style={chartStyles.legendText}>Target (70-130 mg/dL)</Text>
            </View>
          </>
        )}
      </View>

      {/* Pure React Native Chart Area */}
      <View style={chartStyles.chartContainer}>
        {/* Y-Axis Labels */}
        <View style={chartStyles.yAxis}>
          <Text style={chartStyles.axisLabel}>{yMax}</Text>
          {isBP ? (
            <>
              <Text style={[chartStyles.axisLabel, chartStyles.targetAxisLabel]}>120</Text>
              <Text style={[chartStyles.axisLabel, chartStyles.targetAxisLabel]}>80</Text>
            </>
          ) : (
            <>
              <Text style={[chartStyles.axisLabel, chartStyles.targetAxisLabel]}>130</Text>
              <Text style={[chartStyles.axisLabel, chartStyles.targetAxisLabel]}>70</Text>
            </>
          )}
          <Text style={chartStyles.axisLabel}>{yMin}</Text>
        </View>

        {/* Main Plot Area */}
        <View
          style={[chartStyles.plotArea, { height: chartHeight }]}
          onLayout={handlePlotLayout}
        >
          {/* Target Zone Reference Band */}
          <View
            style={[
              chartStyles.targetBand,
              {
                top: targetBandTop,
                height: targetBandHeight,
              },
            ]}
          >
            <Text style={chartStyles.targetBandLabel}>
              {isBP ? 'NORMAL TARGET ZONE (<120/80)' : 'ADA TARGET BAND (70-130)'}
            </Text>
          </View>

          {/* Reference Guideline at Target Bound */}
          <View
            style={[
              chartStyles.guideLine,
              { top: getYCoord(isBP ? 120 : 130) },
            ]}
          />
          {isBP && (
            <View
              style={[
                chartStyles.guideLine,
                { top: getYCoord(80) },
              ]}
            />
          )}

          {/* Empty State Overlay */}
          {points.length === 0 ? (
            <View style={chartStyles.emptyChartBox}>
              <Text style={chartStyles.emptyChartTitle}>No Readings in This Time Range</Text>
              <Text style={chartStyles.emptyChartSub}>
                Log a vital above or switch to &quot;All&quot; to see trend analysis.
              </Text>
            </View>
          ) : (
            <>
              {/* Plot Connecting Lines for Systolic / Glucose */}
              {points.map((p, i) => {
                if (i === points.length - 1) return null;
                const nextP = points[i + 1];
                const dx = nextP.x - p.x;
                const dy = nextP.ySys - p.ySys;
                const length = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx);
                const midX = (p.x + nextP.x) / 2;
                const midY = (p.ySys + nextP.ySys) / 2;

                return (
                  <View
                    key={`line-sys-${p.id}`}
                    style={[
                      chartStyles.connectingLine,
                      {
                        left: midX - length / 2,
                        top: midY - 1,
                        width: length,
                        backgroundColor: '#2DD4BF',
                        transform: [{ rotate: `${angle}rad` }],
                      },
                    ]}
                  />
                );
              })}

              {/* Plot Connecting Lines for Diastolic (BP mode) */}
              {isBP &&
                points.map((p, i) => {
                  if (i === points.length - 1 || p.yDia === null || points[i + 1].yDia === null) {
                    return null;
                  }
                  const nextP = points[i + 1];
                  const dx = nextP.x - p.x;
                  const dy = (nextP.yDia as number) - (p.yDia as number);
                  const length = Math.hypot(dx, dy);
                  const angle = Math.atan2(dy, dx);
                  const midX = (p.x + nextP.x) / 2;
                  const midY = ((p.yDia as number) + (nextP.yDia as number)) / 2;

                  return (
                    <View
                      key={`line-dia-${p.id}`}
                      style={[
                        chartStyles.connectingLine,
                        {
                          left: midX - length / 2,
                          top: midY - 1,
                          width: length,
                          backgroundColor: '#818CF8',
                          transform: [{ rotate: `${angle}rad` }],
                        },
                      ]}
                    />
                  );
                })}

              {/* Plot Circular Marker Dots & Value Badges */}
              {points.map((p) => {
                const dotColor =
                  p.tone === 'risk'
                    ? '#EF4444'
                    : p.tone === 'warn'
                    ? '#F59E0B'
                    : '#10B981';

                return (
                  <React.Fragment key={`dot-group-${p.id}`}>
                    {/* Primary/Systolic Marker Dot */}
                    <View
                      style={[
                        chartStyles.markerDot,
                        {
                          left: p.x - 5,
                          top: p.ySys - 5,
                          backgroundColor: dotColor,
                        },
                      ]}
                    />

                    {/* Primary/Systolic Reading Bubble */}
                    <View
                      style={[
                        chartStyles.valBubble,
                        {
                          left: p.x - 16,
                          top: Math.max(2, p.ySys - 20),
                        },
                      ]}
                    >
                      <Text style={chartStyles.valBubbleText}>{p.sysVal}</Text>
                    </View>

                    {/* Diastolic Marker Dot & Bubble (BP only) */}
                    {isBP && p.yDia !== null && (
                      <>
                        <View
                          style={[
                            chartStyles.markerDotSmall,
                            {
                              left: p.x - 4,
                              top: p.yDia - 4,
                              backgroundColor: '#818CF8',
                            },
                          ]}
                        />
                        <View
                          style={[
                            chartStyles.valBubbleSmall,
                            {
                              left: p.x - 14,
                              top: Math.min(chartHeight - 18, p.yDia + 7),
                            },
                          ]}
                        >
                          <Text style={chartStyles.valBubbleTextSmall}>{p.diaVal}</Text>
                        </View>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </View>
      </View>

      {/* X-Axis Time Labels */}
      {points.length > 0 && (
        <View style={chartStyles.xAxisRow}>
          <View style={{ width: 34 }} />
          <View style={[chartStyles.xAxisLabelsArea, { width: plotAreaWidth }]}>
            {points.map((p, i) => {
              // Avoid crowding: on 7+ points, only show first, middle, last unless <= 5
              const showLabel =
                points.length <= 5 ||
                i === 0 ||
                i === points.length - 1 ||
                i === Math.floor(points.length / 2);

              if (!showLabel) return null;

              return (
                <View
                  key={`xlabel-${p.id}`}
                  style={[
                    chartStyles.xLabelContainer,
                    { left: Math.max(0, p.x - 24) },
                  ]}
                >
                  <Text style={chartStyles.xLabelText}>{p.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

function formatShortDate(timestamp: string, id: string): string {
  if (!timestamp || timestamp === 'Just now') return 'Today';
  if (timestamp.startsWith('Today')) return 'Today';
  if (timestamp.startsWith('Yesterday')) return 'Yest.';

  const d = new Date(timestamp);
  if (!isNaN(d.getTime())) {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  }

  const match = id?.match(/\d{10,}/);
  if (match) {
    const d2 = new Date(parseInt(match[0], 10));
    return `${d2.getMonth() + 1}/${d2.getDate()}`;
  }

  return timestamp.slice(0, 5);
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  containerFlat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
    borderRadius: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  rangePillContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeBtnActive: {
    backgroundColor: '#0D9488',
  },
  rangeBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  rangeBtnTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  metricUnit: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 1,
    fontWeight: '600',
  },
  metricGreen: {
    color: '#34D399',
  },
  metricAmber: {
    color: '#FBBF24',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBandBox: {
    width: 12,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#10B98166',
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  yAxis: {
    width: 34,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 10,
    paddingRight: 6,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    backgroundColor: '#090E1A',
  },
  axisLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  targetAxisLabel: {
    color: '#10B981',
    fontWeight: '800',
  },
  plotArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  targetBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#10B98114',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#10B98133',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  targetBandLabel: {
    color: '#10B98166',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  guideLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#10B9812A',
  },
  connectingLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  markerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#020617',
    zIndex: 5,
  },
  markerDotSmall: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#020617',
    zIndex: 4,
  },
  valBubble: {
    position: 'absolute',
    backgroundColor: '#0F172ACC',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#334155',
    zIndex: 6,
    width: 32,
    alignItems: 'center',
  },
  valBubbleText: {
    color: '#F8FAFC',
    fontSize: 8.5,
    fontWeight: '800',
  },
  valBubbleSmall: {
    position: 'absolute',
    backgroundColor: '#0F172ACC',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#334155',
    zIndex: 6,
    width: 28,
    alignItems: 'center',
  },
  valBubbleTextSmall: {
    color: '#CBD5E1',
    fontSize: 8,
    fontWeight: '700',
  },
  emptyChartBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyChartTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyChartSub: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  xAxisRow: {
    flexDirection: 'row',
    marginTop: 4,
    height: 18,
  },
  xAxisLabelsArea: {
    position: 'relative',
    height: 18,
  },
  xLabelContainer: {
    position: 'absolute',
    width: 48,
    alignItems: 'center',
  },
  xLabelText: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
  },
});

export default VitalsTrendChart;