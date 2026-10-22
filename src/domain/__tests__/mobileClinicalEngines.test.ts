import { describe, it, expect } from 'vitest';
import {
  evaluateSymptomText,
  checkRedFlags,
} from '../../../mobile/src/domain/redFlags';
import {
  getBioequivalentAlternatives,
  generatePharmacyWhatsAppUrl,
  PAKISTANI_PHARMACY_CONTACTS,
} from '../../../mobile/src/domain/pharmacy';

describe('Offline Red-Flag Emergency Screening Engine (Mobile)', () => {
  it('correctly detects English cardiac emergency symptoms', () => {
    const result = evaluateSymptomText('I am feeling intense chest pressure and pain in left arm');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Cardiac Emergency');
    expect(result.ambulanceRecommended).toBe(true);
    expect(result.emergencyGuidance).toContain('1122');
  });

  it('correctly detects Roman Urdu cardiac emergency phrases', () => {
    const result = evaluateSymptomText('Mere seene mein dard hai aur pasina aa raha hai');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Cardiac Emergency');
  });

  it('correctly detects Roman Urdu breathing difficulty phrases', () => {
    const result = evaluateSymptomText('Mujhe saans nahi aa rahi bohot dam ghut raha hai');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Severe Breathing Difficulty');
  });

  it('correctly detects Roman Urdu stroke symptoms', () => {
    const result = evaluateSymptomText('Achanak falij ka asar hai aur chehra terha ho gaya');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Stroke Symptoms');
  });

  it('correctly detects Roman Urdu hemorrhage symptoms', () => {
    const result = evaluateSymptomText('Khoon ki ulti shuru ho gayi hai');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Severe Bleeding / Hemorrhage');
  });

  it('correctly detects Roman Urdu loss of consciousness & seizures', () => {
    const result = evaluateSymptomText('Mareez achanak behosh ho gaya aur jhatke lag rahe hain');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Loss of Consciousness / Seizure / Unresponsiveness');
  });

  it('correctly detects Roman Urdu acute poisoning', () => {
    const result = evaluateSymptomText('Ghalti se zeher ya phenyl pee lia hai');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe('Acute Poisoning / Overdose / Self-Harm');
  });

  it('correctly detects Nastaliq Urdu script emergencies', () => {
    const cardiac = evaluateSymptomText('سینے میں شدید درد ہے');
    expect(cardiac.isRedFlag).toBe(true);
    expect(cardiac.category).toBe('Cardiac Emergency');

    const breathing = evaluateSymptomText('مریض کو سانس میں دشواری ہے اور دم گھٹ رہا ہے');
    expect(breathing.isRedFlag).toBe(true);
    expect(breathing.category).toBe('Severe Breathing Difficulty');

    const stroke = evaluateSymptomText('چہرہ ٹیڑھا ہو گیا اور فالج کا شبہ ہے');
    expect(stroke.isRedFlag).toBe(true);
    expect(stroke.category).toBe('Stroke Symptoms');
  });

  it('returns isRedFlag: false for non-urgent normal queries', () => {
    const result = evaluateSymptomText('I have mild headache since yesterday morning');
    expect(result.isRedFlag).toBe(false);
    expect(result.category).toBeUndefined();
  });

  it('handles empty or null gracefully', () => {
    expect(evaluateSymptomText('')).toEqual({ isRedFlag: false });
    expect(checkRedFlags(null).isEmergency).toBe(false);
  });

  it('includes standard Pakistani emergency helplines in checkRedFlags', () => {
    const helplines = checkRedFlags('chest pain').emergencyNumbers;
    expect(helplines.some((h) => h.number === '1122')).toBe(true);
    expect(helplines.some((h) => h.number === '115')).toBe(true);
    expect(helplines.some((h) => h.number === '1020')).toBe(true);
  });
});

describe('DRAP Bioequivalent Pharmacy Engine (Mobile)', () => {
  it('maps Risek 20mg to alternatives and calculates savings', () => {
    const result = getBioequivalentAlternatives('Risek 20mg');
    expect(result).not.toBeNull();
    expect(result?.salt).toBe('Omeprazole');
    expect(result?.strength).toBe('20mg');
    expect(result?.alternatives.length).toBeGreaterThanOrEqual(3);

    const cheapest = result?.alternatives.find((a) => a.isCheapest);
    expect(cheapest).toBeDefined();
    expect(cheapest?.name).toBe('Omega 20mg');
    expect(cheapest?.pricePkr).toBe(270);
    expect(cheapest?.savingsPct).toBeGreaterThan(30);
  });

  it('maps Glucophage to Metformin alternatives across strengths', () => {
    const result500 = getBioequivalentAlternatives('Glucophage 500mg');
    expect(result500).not.toBeNull();
    expect(result500?.salt).toBe('Metformin HCl');
    expect(result500?.strength).toBe('500mg');

    const result850 = getBioequivalentAlternatives('Glucophage 850mg');
    expect(result850?.strength).toBe('850mg');
  });

  it('maps Concor to Bisoprolol alternatives', () => {
    const result = getBioequivalentAlternatives('Concor 5mg');
    expect(result).not.toBeNull();
    expect(result?.salt).toBe('Bisoprolol Fumarate');
    expect(result?.alternatives.some((a) => a.name.includes('Bipress'))).toBe(true);
  });

  it('maps Lipiget to Atorvastatin alternatives', () => {
    const result = getBioequivalentAlternatives('Lipiget 20mg');
    expect(result).not.toBeNull();
    expect(result?.salt).toBe('Atorvastatin Calcium');
    expect(result?.alternatives.some((a) => a.name.includes('Atorva'))).toBe(true);
  });

  it('maps Augmentin to Co-Amoxiclav alternatives', () => {
    const result = getBioequivalentAlternatives('Augmentin 625mg');
    expect(result).not.toBeNull();
    expect(result?.salt).toContain('Co-Amoxiclav');
    expect(result?.alternatives.some((a) => a.name.includes('Curam'))).toBe(true);
  });

  it('maps Panadol to Paracetamol alternatives', () => {
    const result = getBioequivalentAlternatives('Panadol 500mg');
    expect(result).not.toBeNull();
    expect(result?.salt).toContain('Paracetamol');
    expect(result?.alternatives.some((a) => a.name.includes('Febrol'))).toBe(true);
  });

  it('maps Softin to Loratadine alternatives', () => {
    const result = getBioequivalentAlternatives('Softin');
    expect(result).not.toBeNull();
    expect(result?.salt).toBe('Loratadine');
    expect(result?.alternatives.some((a) => a.name.includes('Lorine'))).toBe(true);
  });

  it('returns null for unregistered medications', () => {
    const result = getBioequivalentAlternatives('UnknownExperimentalDrugXYZ');
    expect(result).toBeNull();
  });

  it('contains Pakistani pharmacy contacts with accurate phone numbers', () => {
    const dvago = PAKISTANI_PHARMACY_CONTACTS.find((p) => p.id === 'dvago');
    expect(dvago?.phone).toBe('+923111729729');

    const servaid = PAKISTANI_PHARMACY_CONTACTS.find((p) => p.id === 'servaid');
    expect(servaid?.phone).toBe('+9242111737824');

    const dawaai = PAKISTANI_PHARMACY_CONTACTS.find((p) => p.id === 'dawaai');
    expect(dawaai?.phone).toBe('+9221111329224');
  });

  it('generates valid, formatted WhatsApp order deep links', () => {
    const url = generatePharmacyWhatsAppUrl(
      'Dvago Pharmacy',
      '+923111729729',
      'Fatima Khan',
      [
        { name: 'Risek', strength: '20mg', quantity: 2 },
        { name: 'Panadol', strength: '500mg', quantity: 1 },
      ]
    );

    expect(url).toContain('https://wa.me/923111729729?text=');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Fatima Khan');
    expect(decoded).toContain('Risek 20mg');
    expect(decoded).toContain('Qty: 2');
    expect(decoded).toContain('Panadol 500mg');
    expect(decoded).toContain('Qty: 1');
    expect(decoded).toContain('السلام علیکم');
  });
});
