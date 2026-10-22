export type TabKey = 'schedule' | 'vitals' | 'sos' | 'full_app' | 'alarms';

export type TimeBucket = 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime';

export type MealRelation = 'Before Food' | 'After Food' | 'With Water';

export type DoseStatus = 'pending' | 'taken' | 'skipped';

export type VitalTone = 'ok' | 'warn' | 'risk';

export interface DoseSlot {
  id: string;
  medicineName: string;
  genericName: string;
  strength: string;
  bucket: TimeBucket;
  scheduledTime: string;
  scheduledMinutes: number;
  mealRelation: MealRelation;
  status: DoseStatus;
  skipReason?: string;
}

export interface VitalLog {
  id: string;
  type: 'bp' | 'glucose';
  primaryVal: number;
  secondaryVal?: number;
  pulse?: number;
  context?: string;
  classification: string;
  tone: VitalTone;
  timestamp: string;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  relationship: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface LabReportItem {
  id: string;
  testName: string;
  value: string;
  reference: string;
  status: string;
  tone: VitalTone;
  date: string;
}

export interface AssistantMessage {
  role: 'user' | 'clinical';
  text: string;
}

export type ClinicalSubView = 'hub' | 'labs' | 'cabinet' | 'assistant' | 'brief' | 'triage';

export interface VitalEvaluation {
  label: string;
  tone: VitalTone;
}

export interface RedFlagEvaluation {
  isRedFlag: boolean;
  category?: string;
  emergencyGuidance?: string;
  ambulanceRecommended?: boolean;
  matchedKeyword?: string;
}

export interface AlternativeBrand {
  name: string;
  manufacturer: string;
  pricePkr: number;
  isCheapest: boolean;
  savingsPct: number;
}

export interface PharmacyAlternative {
  brand: string;
  salt: string;
  strength: string;
  alternatives: AlternativeBrand[];
}

export interface PillInventory {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  criticalThreshold?: number;
  unit?: string;
  lastRefillDate?: string;
  daysRemaining?: number;
}

