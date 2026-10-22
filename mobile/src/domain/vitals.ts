import { VitalEvaluation } from '../types';

/**
 * AHA Standard Blood Pressure Classification
 */
export function evaluateBP(systolic: number, diastolic: number): VitalEvaluation {
  if (isNaN(systolic) || isNaN(diastolic)) {
    return { label: 'Enter reading', tone: 'ok' };
  }
  if (systolic >= 180 || diastolic >= 120) {
    return { label: 'Hypertensive Crisis (Seek Care)', tone: 'risk' };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { label: 'Stage 2 Hypertension', tone: 'risk' };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { label: 'Stage 1 Elevated', tone: 'warn' };
  }
  return { label: 'Optimal / Normal BP', tone: 'ok' };
}

/**
 * ADA Standard Blood Glucose Classification
 */
export function evaluateGlucose(
  glucose: number,
  context: 'fasting' | 'post_meal' | 'random' | 'Fasting' | 'After Meal' | 'Random' = 'fasting'
): VitalEvaluation {
  if (isNaN(glucose)) {
    return { label: 'Enter reading', tone: 'ok' };
  }
  if (glucose < 70) {
    return { label: 'Hypoglycemia Low Alert (<70)', tone: 'risk' };
  }

  const normalized = (context || '').toLowerCase().replace(/[^a-z]/g, '');
  const isFasting = normalized === 'fasting';

  if (isFasting) {
    if (glucose >= 126) return { label: 'High Fasting Range', tone: 'risk' };
    if (glucose >= 100) return { label: 'Elevated Fasting', tone: 'warn' };
    return { label: 'Normal Fasting (70-99)', tone: 'ok' };
  }

  if (glucose >= 200) return { label: 'High Post-Meal Range', tone: 'risk' };
  if (glucose >= 140) return { label: 'Elevated Post-Meal', tone: 'warn' };
  return { label: 'Normal Post-Meal (<140)', tone: 'ok' };
}
