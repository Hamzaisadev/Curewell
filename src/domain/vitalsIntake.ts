/**
 * Vitals Intake Module.
 *
 * Deep domain module consolidating glucose and blood pressure ingestion,
 * unit conversion (mmol/L to standard mg/dL), ADA clinical target evaluation,
 * and persistence.
 * Callers (QuickVitalsModal, VitalsTrackerPage, VitalsQuickCard) pass user inputs
 * through this single seam and receive evaluated clinical records.
 */

import {
  evaluateGlucose,
  evaluateBloodPressure,
  mmolToMgDl,
  type GlucoseType,
  type GlucoseReading,
  type BloodPressureReading,
  type GlucoseStatus,
  type BpStage,
  type VitalTone,
} from './vitals';
import { createGlucoseReading, createBloodPressureReading } from '../lib/db/vitals';

export interface RecordGlucoseInput {
  userId: string;
  profileId: string;
  value: number;
  unit: 'mg/dL' | 'mmol/L';
  type: GlucoseType;
  notes?: string;
  measuredAt?: string;
}

export interface GlucoseEvaluation {
  status: GlucoseStatus;
  label: string;
  tone: VitalTone;
  advice: string;
}

export interface RecordGlucoseResult {
  reading: GlucoseReading;
  evaluation: GlucoseEvaluation;
}

export interface RecordBpInput {
  userId: string;
  profileId: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  arm?: 'left' | 'right';
  posture?: 'sitting' | 'standing' | 'lying';
  notes?: string;
  measuredAt?: string;
}

export interface BpEvaluation {
  stage: BpStage;
  label: string;
  tone: VitalTone;
  advice: string;
}

export interface RecordBpResult {
  reading: BloodPressureReading;
  evaluation: BpEvaluation;
}

/**
 * Records a blood glucose observation, handling mmol/L conversion,
 * ADA threshold evaluation, and storage dispatch.
 */
export async function recordGlucose(input: RecordGlucoseInput): Promise<RecordGlucoseResult> {
  const { userId, profileId, value, unit, type, notes, measuredAt } = input;

  let mgDl = value;
  if (unit === 'mmol/L') {
    mgDl = mmolToMgDl(mgDl);
  }
  const standardValue = Math.round(mgDl);

  const evaluation = evaluateGlucose(standardValue, type);

  const readingToSave: GlucoseReading = {
    user_id: userId,
    profile_id: profileId,
    measured_at: measuredAt || new Date().toISOString(),
    type,
    value_mg_dl: standardValue,
    notes: notes?.trim() || undefined,
  };

  const saved = await createGlucoseReading(readingToSave);

  return {
    reading: saved,
    evaluation,
  };
}

/**
 * Records a blood pressure observation, handling rounding,
 * clinical staging evaluation, and storage dispatch.
 */
export async function recordBloodPressure(input: RecordBpInput): Promise<RecordBpResult> {
  const { userId, profileId, systolic, diastolic, pulse, arm, posture, notes, measuredAt } = input;

  const cleanSys = Math.round(systolic);
  const cleanDia = Math.round(diastolic);
  const cleanPulse = pulse ? Math.round(pulse) : undefined;

  const evaluation = evaluateBloodPressure(cleanSys, cleanDia);

  const readingToSave: BloodPressureReading = {
    user_id: userId,
    profile_id: profileId,
    measured_at: measuredAt || new Date().toISOString(),
    systolic: cleanSys,
    diastolic: cleanDia,
    pulse_bpm: cleanPulse,
    arm: arm || 'left',
    posture: posture || 'sitting',
    notes: notes?.trim() || undefined,
  };

  const saved = await createBloodPressureReading(readingToSave);

  return {
    reading: saved,
    evaluation,
  };
}
