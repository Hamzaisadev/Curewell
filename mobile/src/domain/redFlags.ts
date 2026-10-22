/**
 * Offline Emergency Red-Flag Triage Engine for Mobile.
 *
 * CRITICAL SAFETY REQUIREMENT:
 * - Runs 100% offline with zero network dependencies before any AI or cloud call.
 * - Detects English, Roman Urdu, and Nastaliq Urdu script symptoms.
 * - False positives are acceptable; false negatives are NEVER acceptable.
 * - Covers the 6 primary emergency conditions:
 *   1. Cardiac Emergency (Chest pain, radiation to left arm/jaw, diaphoresis)
 *   2. Severe Breathing Difficulty (Dyspnea, gasping, stridor)
 *   3. Stroke Symptoms (FAST: Facial drooping, arm weakness, speech difficulty)
 *   4. Severe Bleeding / Hemorrhage
 *   5. Loss of Consciousness / Seizure / Unresponsiveness
 *   6. Acute Poisoning / Overdose / Self-Harm
 */

import { RedFlagEvaluation } from '../types';

export interface EmergencyHelpline {
  name: string;
  number: string;
  tel: string;
  description: string;
}

export const EMERGENCY_HELPLINES: EmergencyHelpline[] = [
  { name: 'Rescue 1122', number: '1122', tel: 'tel:1122', description: 'Medical & emergency ambulance (Nationwide / Punjab / KPK)' },
  { name: 'Edhi Ambulance', number: '115', tel: 'tel:115', description: 'Emergency ambulance & relief (Sindh / Nationwide)' },
  { name: 'Chhipa Ambulance', number: '1020', tel: 'tel:1020', description: 'Emergency rescue service (Karachi / Sindh)' },
];

export interface RedFlagCategoryDefinition {
  id: string;
  label: string;
  emergencyGuidance: string;
  ambulanceRecommended: boolean;
  keywords: string[];
}

export const RED_FLAG_CATEGORIES: RedFlagCategoryDefinition[] = [
  {
    id: 'cardiac',
    label: 'Cardiac Emergency',
    emergencyGuidance:
      'IMMEDIATE EMERGENCY: Call Rescue 1122 or Edhi 115 immediately. Have the patient sit upright in a comfortable position and remain calm. If non-allergic and not contraindicated, administer 300mg chewable Aspirin/Disprin immediately. Do NOT allow physical exertion. (فوری طور پر 1122 کال کریں۔ مریض کو سیدھا بٹھائیں اور ہلنے مت دیں۔)',
    ambulanceRecommended: true,
    keywords: [
      // English
      'chest pain',
      'chest pressure',
      'chest tightness',
      'chest discomfort',
      'chest heaviness',
      'crushing chest pain',
      'crushing pain',
      'pain radiating to left arm',
      'pain radiating to jaw',
      'left arm pain',
      'jaw pain and chest',
      'pain in left arm',
      'chest feels tight',
      'chest feels heavy',
      'chest is tight',
      'chest hurts',
      'heart attack',
      'myocardial infarction',
      'diaphoresis',
      'cold sweats with chest pain',
      'profuse sweating with chest',
      // Roman Urdu
      'seene mein dard',
      'seene me dard',
      'seena jakarna',
      'seene me jalan aur dard',
      'chaati me dard',
      'chaati mein dard',
      'dil ka daura',
      'dil ka dora',
      'dil ka attack',
      'bayen baazu mein dard',
      'bayein bazu me dard',
      'bazu me shadeed dard',
      'paseenay aana aur dard',
      'pasina aana aur ghabrahat',
      'chakkar aur seene me dard',
      // Nastaliq Urdu
      'سینے میں درد',
      'سینے میں شدید درد',
      'دل کا درد',
      'دل کا دورہ',
      'دل میں درد',
      'سینے کا درد',
      'سینے میں دباؤ',
      'سینے میں جکڑن',
      'بائیں بازو میں درد',
      'ہارٹ اٹیک',
    ],
  },
  {
    id: 'breathing',
    label: 'Severe Breathing Difficulty',
    emergencyGuidance:
      'IMMEDIATE EMERGENCY: Call Rescue 1122 immediately. Keep patient sitting upright with open airflow. Loosen tight neck clothing. If patient has a prescribed rescue bronchodilator inhaler (e.g. Ventolin), assist with puffs. Keep patient calm. (فوری طور پر 1122 کال کریں۔ مریض کو اونچا بٹھائیں اور کھلی ہوا دیں۔)',
    ambulanceRecommended: true,
    keywords: [
      // English
      "can't breathe",
      'cant breathe',
      'cannot breathe',
      'unable to breathe',
      'trouble breathing',
      'hard to breathe',
      'shortness of breath',
      'short of breath',
      'breathless',
      'difficulty breathing',
      'struggling to breathe',
      'gasping for air',
      'gasping',
      'choking',
      'stridor',
      'severe dyspnea',
      'blue lips',
      'cyanosis',
      'respiratory distress',
      // Roman Urdu
      'saans nahi aa rahi',
      'saans nhi aa rhi',
      'saans ruk rahi hai',
      'saans band ho rahi',
      'saans band',
      'saans phoolna',
      'saans phool rahi hai',
      'dam ghutna',
      'dam ghut raha',
      'saans lene me dushwari',
      'saans lene me shadeed takleef',
      'gala ghutna',
      // Nastaliq Urdu
      'سانس نہیں آرہی',
      'سانس نہیں آ رہی',
      'سانس میں دشواری',
      'سانس میں شدید دشواری',
      'دم گھٹنا',
      'دم گھٹ رہا',
      'سانس بند ہونا',
      'سانس بند',
      'سانس کا پھولنا',
      'سانس رکنا',
    ],
  },
  {
    id: 'stroke',
    label: 'Stroke Symptoms',
    emergencyGuidance:
      'CRITICAL: Suspected Stroke (FAST protocol). Call Rescue 1122 immediately. Note the exact time symptoms began. Lay patient on flat side if drowsy. Do NOT give food, water, or any oral tablets due to severe choking and aspiration risk. (فوری 1122 کال کریں۔ فالج کا خدشہ۔ مریض کو کچھ کھانے پینے کو نہ دیں۔)',
    ambulanceRecommended: true,
    keywords: [
      // English
      'stroke',
      'facial drooping',
      'face drooping',
      'face is drooping',
      'uneven smile',
      'arm weakness',
      'arm numbness',
      'arm drift',
      'speech difficulty',
      'slurred speech',
      "can't speak",
      'cant speak',
      'cannot speak',
      'unable to speak',
      'one side weakness',
      'weak on one side',
      'weakness on left side',
      'weakness on right side',
      'hemiplegia',
      'fast symptoms',
      'sudden vision loss',
      'sudden loss of balance',
      // Roman Urdu
      'falij',
      'faalij',
      'chehra terha',
      'munh terha',
      'adha jism sun',
      'adha badan sun',
      'zuban larkharana',
      'bol nahi pa raha',
      'zuban band',
      'bazu bejaan',
      'ek taraf kamzori',
      'jism ka ek hissa sun',
      // Nastaliq Urdu
      'فالج',
      'فالج کا دورہ',
      'فالج کا شبہ',
      'چہرہ ٹیڑھا',
      'چہرہ ٹیڑھا ہو گیا',
      'زبان لڑکھڑانا',
      'بولنے میں دشواری',
      'آدھا جسم سن',
      'ایک طرف فالج',
      'بازو میں کمزوری',
    ],
  },
  {
    id: 'bleeding',
    label: 'Severe Bleeding / Hemorrhage',
    emergencyGuidance:
      'IMMEDIATE EMERGENCY: Severe active bleeding. Call Rescue 1122. Apply continuous, direct, firm pressure to the bleeding wound using a clean cloth or sterile dressing. Keep patient lying down and elevate the bleeding extremity if possible. Do NOT remove soaked pads; add more on top. (فوری 1122 کال کریں۔ زخم پر صاف کپڑے سے مضبوط دباؤ ڈال کر رکھیں۔)',
    ambulanceRecommended: true,
    keywords: [
      // English
      'severe bleeding',
      'heavy bleeding',
      'profuse bleeding',
      'hemorrhage',
      'haemorrhage',
      "won't stop bleeding",
      'wont stop bleeding',
      'cannot stop bleeding',
      'bleeding profusely',
      'bleeding a lot',
      'vomiting blood',
      'blood in vomit',
      'hematemesis',
      'coughing blood',
      'coughing up blood',
      'hemoptysis',
      'blood in stool',
      'black tarry stool',
      'melena',
      'massive bleeding',
      // Roman Urdu
      'khoon ki ulti',
      'khoon aa raha',
      'khoon beh raha',
      'khoon nahi ruk raha',
      'khoon band nahi ho raha',
      'shadeed khoon',
      'shadeed bleeding',
      'pakhane me khoon',
      'balgham me khoon',
      // Nastaliq Urdu
      'شدید خون بہنا',
      'شدید خون',
      'خون کی الٹی',
      'خون نہیں رک رہا',
      'خون بہہ رہا ہے',
      'خون بہہ رہا',
      'پاخانے میں خون',
      'کھانسی میں خون',
    ],
  },
  {
    id: 'consciousness',
    label: 'Loss of Consciousness / Seizure / Unresponsiveness',
    emergencyGuidance:
      'IMMEDIATE EMERGENCY: Call Rescue 1122 or Edhi 115. If the patient is breathing, place in recovery position (on their side). If having a seizure, move hard/sharp objects away, protect the head, time the seizure, and do NOT put anything in their mouth or hold them down. (فوری 1122 کال کریں۔ مریض کو کروٹ کے بل لٹائیں اور منہ میں کچھ نہ ڈالیں۔)',
    ambulanceRecommended: true,
    keywords: [
      // English
      'unconscious',
      'loss of consciousness',
      'unresponsiveness',
      'unresponsive',
      'fainted',
      'fainting',
      'passed out',
      'passing out',
      'blacked out',
      'blackout',
      "won't wake up",
      'wont wake up',
      'not waking up',
      'coma',
      'collapsed',
      'seizure',
      'seizures',
      'convulsion',
      'convulsions',
      'epileptic fit',
      'grand mal',
      'status epilepticus',
      // Roman Urdu
      'behosh',
      'behoshi',
      'be hosh',
      'chakkar',
      'chakkar aa kar gir gaya',
      'chakkar kha ke behosh',
      'hosh kho baitha',
      'hosh me nahi hai',
      'hosh nahi',
      'fit parna',
      'fits',
      'dora parna',
      'daura parna',
      'jhatke lagna',
      'jhatkay lag rahe',
      // Nastaliq Urdu
      'بے ہوش',
      'بے ہوشی',
      'غش کھا کر گرنا',
      'غش',
      'دورہ پڑنا',
      'دورہ',
      'جھٹکے لگنا',
      'جھٹکے',
      'ہوش نہیں ہے',
      'ہوش میں نہیں',
      'مرگی کا دورہ',
    ],
  },
  {
    id: 'poisoning',
    label: 'Acute Poisoning / Overdose / Self-Harm',
    emergencyGuidance:
      'CRITICAL TOXICOLOGY ALERT: Call Rescue 1122 immediately. Identify what was ingested and save the container, bottle, or packaging for rescue doctors. Do NOT induce vomiting or give raw milk/salt water unless strictly directed by emergency toxicology staff. Keep patient airway open. (فوری 1122 کال کریں۔ زہر یا دوائی کا ڈبہ سنبھال کر رکھیں۔ الٹی مت کروائیں۔)',
    ambulanceRecommended: true,
    keywords: [
      // English
      'poisoning',
      'poison',
      'poisoned',
      'acute poisoning',
      'toxic ingestion',
      'chemical ingestion',
      'swallowed poison',
      'swallowed bleach',
      'swallowed kerosene',
      'swallowed acid',
      'acid ingestion',
      'rat poison',
      'pesticide',
      'insecticide',
      'overdose',
      'overdosed',
      'drug overdose',
      'took too many pills',
      'took too many tablets',
      'double dose accidental',
      'pill overdose',
      'self harm',
      'self-harm',
      'suicide attempt',
      // Roman Urdu
      'zeher',
      'zehar',
      'zehr khori',
      'phenyl pee lia',
      'phenyl pi liya',
      'kerosene pee lia',
      'matti ka tail pi liya',
      'tezaab pee lia',
      'chuhe maar dawa',
      'keere mar dawa',
      'dawai zyada kha li',
      'bohat sari goliyan kha li',
      'overdose',
      'khudkushi',
      // Nastaliq Urdu
      'زہر',
      'زہر خورانی',
      'فینائل پی لیا',
      'تیزاب پی لیا',
      'مٹی کا تیل پی لیا',
      'زیادہ گولیاں کھا لیں',
      'زیادہ دوائی کھا لی',
      'خودکشی',
      'کیڑے مار دوا',
    ],
  },
];

/**
 * Normalizes text across English, Roman Urdu, and Nastaliq Urdu.
 * Strips mobile curly quotes, dashes, standard punctuation, and Urdu punctuation marks.
 * Normalizes cross-keyboard Arabic/Urdu Unicode variants (Yeh, Kaf, Heh, diacritics).
 */
export function normalizeForMatching(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[‘’ʼ′`´]/g, "'")
    .replace(/[–—]/g, '-')
    // Strip Arabic/Urdu diacritics (tashkeel / zer / zabar / pesh / tanween)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Arabic Yeh (ي) to Urdu Yeh (ی)
    .replace(/\u064A/g, '\u06CC')
    // Normalize Arabic Kaf (ك) to Urdu Kaf (ک)
    .replace(/\u0643/g, '\u06A9')
    // Normalize Arabic Heh (ه / ة) to Urdu Heh (ہ)
    .replace(/[\u0647\u0629]/g, '\u06C1')
    // Strip standard Western + Arabic/Urdu punctuation (e.g. ؟ ، ۔)
    .replace(/[.,!?;:()[\]{}"؟،۔\-_/\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Primary helper for evaluating symptom input strings.
 * Returns triage status, matched category, emergency action guidance,
 * and matched trigger keyword.
 */
export function evaluateSymptomText(text: string): RedFlagEvaluation {
  if (!text || typeof text !== 'string') {
    return { isRedFlag: false };
  }

  const normalized = normalizeForMatching(text);
  if (!normalized) {
    return { isRedFlag: false };
  }

  for (const category of RED_FLAG_CATEGORIES) {
    for (const kw of category.keywords) {
      const normalizedKw = normalizeForMatching(kw);
      if (normalizedKw && normalized.includes(normalizedKw)) {
        return {
          isRedFlag: true,
          category: category.label,
          emergencyGuidance: category.emergencyGuidance,
          ambulanceRecommended: category.ambulanceRecommended,
          matchedKeyword: kw,
        };
      }
    }
  }

  return { isRedFlag: false };
}

export interface RedFlagResult {
  isEmergency: boolean;
  matchedCategories: string[];
  matchedLabels: string[];
  emergencyNumbers: EmergencyHelpline[];
}

/**
 * Comprehensive multi-category scanner returning all matched categories.
 */
export function checkRedFlags(text: string | null | undefined): RedFlagResult {
  if (!text) {
    return {
      isEmergency: false,
      matchedCategories: [],
      matchedLabels: [],
      emergencyNumbers: EMERGENCY_HELPLINES,
    };
  }

  const normalized = normalizeForMatching(text);
  const matchedCategories: string[] = [];
  const matchedLabels: string[] = [];

  for (const category of RED_FLAG_CATEGORIES) {
    const hasMatch = category.keywords.some((kw) => {
      const normKw = normalizeForMatching(kw);
      return normKw && normalized.includes(normKw);
    });
    if (hasMatch) {
      matchedCategories.push(category.id);
      matchedLabels.push(category.label);
    }
  }

  return {
    isEmergency: matchedCategories.length > 0,
    matchedCategories,
    matchedLabels,
    emergencyNumbers: EMERGENCY_HELPLINES,
  };
}
