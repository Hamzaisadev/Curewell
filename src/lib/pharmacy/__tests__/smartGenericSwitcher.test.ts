import { describe, it, expect } from 'vitest';
import {
  findGenericAlternative,
  calculateOrderPricing,
  PARTNER_PHARMACIES,
} from '../smartGenericSwitcher';
import { generateWhatsAppOrderUrl } from '../whatsapp';

describe('Commercial Refill & Smart Generic Switcher Engine', () => {
  describe('findGenericAlternative', () => {
    it('detects generic alternative for Risek 20mg with correct savings callout', () => {
      const alt = findGenericAlternative('Risek 20mg', '20mg');
      expect(alt).not.toBeNull();
      expect(alt?.genericMolecule).toBe('Omeprazole');
      expect(alt?.brandName).toContain('Omega 20mg');
      expect(alt?.savingsPercent).toBe(40);
      expect(alt?.savingsAmount).toBe(180);
      expect(alt?.calloutText).toBe(
        'Generic Alternative Available: Switch to Omeprazole (Omega 20mg) and save ~40% (Est. Rs. 180 saving/pack)'
      );
    });

    it('detects generic alternative for Lipiget 20mg', () => {
      const alt = findGenericAlternative('Lipiget 20mg');
      expect(alt).not.toBeNull();
      expect(alt?.genericMolecule).toBe('Atorvastatin');
      expect(alt?.brandName).toContain('Atorva 20mg');
      expect(alt?.savingsPercent).toBe(39);
      expect(alt?.savingsAmount).toBe(240);
    });

    it('detects generic alternative for Glucophage 500mg', () => {
      const alt = findGenericAlternative('Glucophage 500mg');
      expect(alt).not.toBeNull();
      expect(alt?.genericMolecule).toBe('Metformin');
      expect(alt?.brandName).toContain('Neodipar 500mg');
      expect(alt?.savingsPercent).toBe(40);
      expect(alt?.savingsAmount).toBe(140);
    });

    it('detects generic alternative for Panadol 500mg', () => {
      const alt = findGenericAlternative('Panadol 500mg');
      expect(alt).not.toBeNull();
      expect(alt?.genericMolecule).toBe('Paracetamol');
      expect(alt?.brandName).toContain('Febrol 500mg');
      expect(alt?.savingsPercent).toBe(40);
      expect(alt?.savingsAmount).toBe(100);
    });

    it('returns null if medicine is already the cheaper generic (Omega 20mg)', () => {
      const alt = findGenericAlternative('Omega 20mg');
      expect(alt).toBeNull();
    });

    it('returns null for unknown medicines gracefully', () => {
      const alt = findGenericAlternative('CustomNonExistentHerb 100mg');
      expect(alt).toBeNull();
    });
  });

  describe('calculateOrderPricing', () => {
    it('calculates packs, brand cost, generic cost, and total savings accurately', () => {
      const pricing = calculateOrderPricing({
        packQuantity: 28,
        brandPricePerPack: 450,
        genericPricePerPack: 270,
        packUnits: 14,
      });

      expect(pricing.packsCount).toBe(2);
      expect(pricing.totalBrandCost).toBe(900);
      expect(pricing.totalGenericCost).toBe(540);
      expect(pricing.totalSavings).toBe(360);
      expect(pricing.savingsPct).toBe(40);
    });
  });

  describe('PARTNER_PHARMACIES', () => {
    it('contains certified partner pharmacies including Dvago, Servaid, Dawaai, and Fazal Dins', () => {
      const ids = PARTNER_PHARMACIES.map((p) => p.id);
      expect(ids).toContain('dvago');
      expect(ids).toContain('servaid');
      expect(ids).toContain('dawaai');
      expect(ids).toContain('fazal_dins');
      expect(ids).toContain('custom');
    });
  });

  describe('generateWhatsAppOrderUrl', () => {
    it('generates formatted WhatsApp message order with delivery area, medicine, quantity, and pricing', () => {
      const url = generateWhatsAppOrderUrl({
        medicineName: 'Omega 20mg',
        strength: '20mg',
        doseAmount: '1 capsule',
        quantityNeeded: '28 tablets (2 packs)',
        pharmacyPhone: '923111138246',
        pharmacyName: 'Dvago Pharmacy',
        patientArea: 'Gulberg III, Lahore',
        isGenericAlternative: true,
        prescribedBrand: 'Risek 20mg',
        genericMolecule: 'Omeprazole',
        estimatedPrice: 540,
        savingsEstimate: 'Save ~40% / Rs. 360',
      });

      expect(url).toContain('https://wa.me/923111138246?text=');
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Dvago Pharmacy');
      expect(decoded).toContain('Omega 20mg');
      expect(decoded).toContain('Gulberg III, Lahore');
      expect(decoded).toContain('PKR 540');
      expect(decoded).toContain('Save ~40% / Rs. 360');
      expect(decoded).toContain('Risek 20mg');
    });
  });
});
