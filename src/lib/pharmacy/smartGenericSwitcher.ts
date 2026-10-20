/**
 * Commercial Refill & Smart Generic Switcher Engine
 *
 * Provides real-world bioequivalent generic molecule mappings for common
 * Pakistani pharmaceutical commercial brands, with price delta benchmarks,
 * partner pharmacy directory, and WhatsApp order generator.
 */

export interface GenericAlternative {
  genericMolecule: string;
  brandName: string; // e.g. "Omega 20mg"
  brandGenericLabel: string; // "Omeprazole (Omega 20mg)"
  strength: string; // "20mg"
  prescribedBrand: string; // "Risek 20mg"
  brandPriceEst: number; // e.g. 450
  genericPriceEst: number; // e.g. 270
  savingsPercent: number; // e.g. 40
  savingsAmount: number; // e.g. 180
  calloutText: string; // "Generic Alternative Available: Switch to Omeprazole (Omega 20mg) and save ~40% (Est. Rs. 180 saving/pack)"
  manufacturerA: string;
  manufacturerB: string;
  packUnits: number; // e.g. 14 or 30 tablets per pack
}

export interface PartnerPharmacy {
  id: string;
  name: string;
  tagline: string;
  phone: string; // WhatsApp international format
  cityCoverage: string;
  badge: string;
  isPartner: boolean;
}

export const PARTNER_PHARMACIES: PartnerPharmacy[] = [
  {
    id: 'dvago',
    name: 'Dvago Pharmacy',
    tagline: '100% genuine medicines & cold-chain express delivery',
    phone: '923111138246',
    cityCoverage: 'Karachi, Lahore, Islamabad, Rawalpindi',
    badge: 'Official Partner',
    isPartner: true,
  },
  {
    id: 'servaid',
    name: 'Servaid Pharmacy',
    tagline: 'Fast 2-hour home delivery across Punjab',
    phone: '923117378243',
    cityCoverage: 'Lahore, Faisalabad, Multan, Gujranwala',
    badge: 'Popular Refills',
    isPartner: true,
  },
  {
    id: 'dawaai',
    name: 'Dawaai.pk',
    tagline: 'Licensed nationwide digital pharmacy network',
    phone: '923111329224',
    cityCoverage: 'Nationwide Delivery across Pakistan',
    badge: 'Nationwide',
    isPartner: true,
  },
  {
    id: 'fazal_dins',
    name: "Fazal Din's Pharma Plus",
    tagline: "Pakistan's most trusted chemist since 1948",
    phone: '923000329253',
    cityCoverage: 'Lahore, Islamabad',
    badge: 'Historic Chemist',
    isPartner: true,
  },
  {
    id: 'custom',
    name: 'Custom / Local Chemist',
    tagline: 'Direct WhatsApp order to your neighborhood chemist',
    phone: '',
    cityCoverage: 'Any local area',
    badge: 'Custom',
    isPartner: false,
  },
];

interface GenericMappingRule {
  brandKeywords: string[];
  genericMolecule: string;
  defaultStrength: string;
  manufacturerA: string;
  alternativeBrandName: string;
  manufacturerB: string;
  brandPriceEst: number;
  genericPriceEst: number;
  packUnits: number;
  strengthVariants?: Record<
    string,
    {
      brandPriceEst: number;
      genericPriceEst: number;
      alternativeBrandName: string;
      packUnits?: number;
    }
  >;
}

const GENERIC_RULES: GenericMappingRule[] = [
  {
    brandKeywords: ['risek', 'losec', 'omep'],
    genericMolecule: 'Omeprazole',
    defaultStrength: '20mg',
    manufacturerA: 'Searle',
    alternativeBrandName: 'Omega',
    manufacturerB: 'Ferozsons',
    brandPriceEst: 450,
    genericPriceEst: 270,
    packUnits: 14,
    strengthVariants: {
      '40mg': {
        brandPriceEst: 850,
        genericPriceEst: 510,
        alternativeBrandName: 'Omega 40mg',
        packUnits: 14,
      },
      '20mg': {
        brandPriceEst: 450,
        genericPriceEst: 270,
        alternativeBrandName: 'Omega 20mg',
        packUnits: 14,
      },
    },
  },
  {
    brandKeywords: ['lipiget', 'lipitor', 'atorva'],
    genericMolecule: 'Atorvastatin',
    defaultStrength: '20mg',
    manufacturerA: 'Getz Pharma',
    alternativeBrandName: 'Atorva',
    manufacturerB: 'PharmEvo',
    brandPriceEst: 620,
    genericPriceEst: 380,
    packUnits: 10,
    strengthVariants: {
      '10mg': {
        brandPriceEst: 370,
        genericPriceEst: 230,
        alternativeBrandName: 'Atorva 10mg',
        packUnits: 10,
      },
      '20mg': {
        brandPriceEst: 620,
        genericPriceEst: 380,
        alternativeBrandName: 'Atorva 20mg',
        packUnits: 10,
      },
      '40mg': {
        brandPriceEst: 950,
        genericPriceEst: 580,
        alternativeBrandName: 'Atorva 40mg',
        packUnits: 10,
      },
    },
  },
  {
    brandKeywords: ['glucophage', 'metformin', 'neodipar'],
    genericMolecule: 'Metformin',
    defaultStrength: '500mg',
    manufacturerA: 'Merck',
    alternativeBrandName: 'Neodipar',
    manufacturerB: 'Sanofi',
    brandPriceEst: 350,
    genericPriceEst: 210,
    packUnits: 50,
    strengthVariants: {
      '500mg': {
        brandPriceEst: 350,
        genericPriceEst: 210,
        alternativeBrandName: 'Neodipar 500mg',
        packUnits: 50,
      },
      '850mg': {
        brandPriceEst: 430,
        genericPriceEst: 260,
        alternativeBrandName: 'Neodipar 850mg',
        packUnits: 30,
      },
      '1000mg': {
        brandPriceEst: 490,
        genericPriceEst: 295,
        alternativeBrandName: 'Neodipar 1000mg',
        packUnits: 30,
      },
    },
  },
  {
    brandKeywords: ['panadol', 'calpol', 'febrol'],
    genericMolecule: 'Paracetamol',
    defaultStrength: '500mg',
    manufacturerA: 'Haleon / GSK',
    alternativeBrandName: 'Febrol',
    manufacturerB: 'Pacific Pharmaceuticals',
    brandPriceEst: 250,
    genericPriceEst: 150,
    packUnits: 20,
    strengthVariants: {
      '500mg': {
        brandPriceEst: 250,
        genericPriceEst: 150,
        alternativeBrandName: 'Febrol 500mg',
        packUnits: 20,
      },
      extra: {
        brandPriceEst: 290,
        genericPriceEst: 180,
        alternativeBrandName: 'Febrol Extra',
        packUnits: 20,
      },
    },
  },
  {
    brandKeywords: ['augmentin', 'curam', 'amoxiclav'],
    genericMolecule: 'Co-Amoxiclav',
    defaultStrength: '625mg',
    manufacturerA: 'GSK',
    alternativeBrandName: 'Curam',
    manufacturerB: 'Sandoz / Novartis',
    brandPriceEst: 550,
    genericPriceEst: 360,
    packUnits: 10,
    strengthVariants: {
      '625mg': {
        brandPriceEst: 550,
        genericPriceEst: 360,
        alternativeBrandName: 'Curam 625mg',
        packUnits: 10,
      },
      '1g': {
        brandPriceEst: 820,
        genericPriceEst: 540,
        alternativeBrandName: 'Curam 1g',
        packUnits: 10,
      },
      '1000mg': {
        brandPriceEst: 820,
        genericPriceEst: 540,
        alternativeBrandName: 'Curam 1g',
        packUnits: 10,
      },
    },
  },
  {
    brandKeywords: ['nexum', 'nexium', 'esomeprazole'],
    genericMolecule: 'Esomeprazole',
    defaultStrength: '20mg',
    manufacturerA: 'Getz Pharma',
    alternativeBrandName: 'Esita',
    manufacturerB: 'Highnoon Laboratories',
    brandPriceEst: 420,
    genericPriceEst: 260,
    packUnits: 14,
    strengthVariants: {
      '20mg': {
        brandPriceEst: 420,
        genericPriceEst: 260,
        alternativeBrandName: 'Esita 20mg',
        packUnits: 14,
      },
      '40mg': {
        brandPriceEst: 680,
        genericPriceEst: 420,
        alternativeBrandName: 'Esita 40mg',
        packUnits: 14,
      },
    },
  },
  {
    brandKeywords: ['norvasc', 'amdepin', 'lodopin'],
    genericMolecule: 'Amlodipine',
    defaultStrength: '5mg',
    manufacturerA: 'Pfizer',
    alternativeBrandName: 'Amdepin',
    manufacturerB: 'Highnoon Laboratories',
    brandPriceEst: 480,
    genericPriceEst: 260,
    packUnits: 30,
    strengthVariants: {
      '5mg': {
        brandPriceEst: 480,
        genericPriceEst: 260,
        alternativeBrandName: 'Amdepin 5mg',
        packUnits: 30,
      },
      '10mg': {
        brandPriceEst: 720,
        genericPriceEst: 390,
        alternativeBrandName: 'Amdepin 10mg',
        packUnits: 30,
      },
    },
  },
  {
    brandKeywords: ['concor', 'bislol', 'bisocor'],
    genericMolecule: 'Bisoprolol',
    defaultStrength: '5mg',
    manufacturerA: 'Merck',
    alternativeBrandName: 'Bislol',
    manufacturerB: 'PharmEvo',
    brandPriceEst: 460,
    genericPriceEst: 290,
    packUnits: 30,
    strengthVariants: {
      '2.5mg': {
        brandPriceEst: 380,
        genericPriceEst: 240,
        alternativeBrandName: 'Bislol 2.5mg',
        packUnits: 30,
      },
      '5mg': {
        brandPriceEst: 460,
        genericPriceEst: 290,
        alternativeBrandName: 'Bislol 5mg',
        packUnits: 30,
      },
      '10mg': {
        brandPriceEst: 680,
        genericPriceEst: 430,
        alternativeBrandName: 'Bislol 10mg',
        packUnits: 30,
      },
    },
  },
  {
    brandKeywords: ['crestor', 'rovista', 'x-plat'],
    genericMolecule: 'Rosuvastatin',
    defaultStrength: '10mg',
    manufacturerA: 'AstraZeneca',
    alternativeBrandName: 'Rovista',
    manufacturerB: 'Getz Pharma',
    brandPriceEst: 980,
    genericPriceEst: 590,
    packUnits: 14,
    strengthVariants: {
      '10mg': {
        brandPriceEst: 980,
        genericPriceEst: 590,
        alternativeBrandName: 'Rovista 10mg',
        packUnits: 14,
      },
      '20mg': {
        brandPriceEst: 1550,
        genericPriceEst: 920,
        alternativeBrandName: 'Rovista 20mg',
        packUnits: 14,
      },
    },
  },
  {
    brandKeywords: ['xb', 'xarelto', 'rivarox'],
    genericMolecule: 'Rivaroxaban',
    defaultStrength: '20mg',
    manufacturerA: 'Searle / Bayer',
    alternativeBrandName: 'Rivarox',
    manufacturerB: 'Getz Pharma',
    brandPriceEst: 1450,
    genericPriceEst: 950,
    packUnits: 10,
    strengthVariants: {
      '10mg': {
        brandPriceEst: 990,
        genericPriceEst: 650,
        alternativeBrandName: 'Rivarox 10mg',
        packUnits: 10,
      },
      '20mg': {
        brandPriceEst: 1450,
        genericPriceEst: 950,
        alternativeBrandName: 'Rivarox 20mg',
        packUnits: 10,
      },
    },
  },
];

/**
 * Searches for a bioequivalent cost-saving generic alternative for a prescribed brand.
 */
export function findGenericAlternative(
  medicineName: string,
  strengthParam?: string | null
): GenericAlternative | null {
  if (!medicineName) return null;

  const rawLower = medicineName.toLowerCase().trim();
  const strengthClean = (strengthParam || '').toLowerCase().trim();

  for (const rule of GENERIC_RULES) {
    const matched = rule.brandKeywords.some((keyword) => {
      // Avoid matching if current medicine IS already the cheaper generic
      // (unless it's an explicit search pair)
      return rawLower.includes(keyword);
    });

    if (matched) {
      // Determine strength
      let detectedStrength = rule.defaultStrength;
      const combined = `${rawLower} ${strengthClean}`;

      if (combined.includes('40mg')) detectedStrength = '40mg';
      else if (combined.includes('20mg')) detectedStrength = '20mg';
      else if (combined.includes('10mg')) detectedStrength = '10mg';
      else if (combined.includes('5mg')) detectedStrength = '5mg';
      else if (combined.includes('2.5mg')) detectedStrength = '2.5mg';
      else if (combined.includes('1000mg') || combined.includes('1g')) detectedStrength = '1000mg';
      else if (combined.includes('850mg')) detectedStrength = '850mg';
      else if (combined.includes('625mg')) detectedStrength = '625mg';
      else if (combined.includes('500mg')) detectedStrength = '500mg';
      else if (combined.includes('extra')) detectedStrength = 'extra';

      let brandPrice = rule.brandPriceEst;
      let genericPrice = rule.genericPriceEst;
      let altBrandName = rule.alternativeBrandName;
      let packUnits = rule.packUnits;

      const variant = rule.strengthVariants ? rule.strengthVariants[detectedStrength] : undefined;
      if (variant) {
        brandPrice = variant.brandPriceEst;
        genericPrice = variant.genericPriceEst;
        altBrandName = variant.alternativeBrandName;
        if (variant.packUnits) packUnits = variant.packUnits;
      } else {
        altBrandName = `${rule.alternativeBrandName} ${detectedStrength}`;
      }

      // If altBrandName already includes strength, clean it
      const displayAltBrand = altBrandName.toLowerCase().includes(detectedStrength.toLowerCase())
        ? altBrandName
        : `${altBrandName} ${detectedStrength}`;

      // If the current medicine is ALREADY the generic alternative (e.g. user has Omega 20mg), return null
      if (rawLower.includes(rule.alternativeBrandName.toLowerCase())) {
        return null;
      }

      const savingsAmount = brandPrice - genericPrice;
      const savingsPercent = Math.round((savingsAmount / brandPrice) * 100);

      const splitParts = (medicineName || '').split('(');
      const firstPart = splitParts[0];
      const brandCleanName = (firstPart ? firstPart.trim() : '') || medicineName;
      const calloutText = `Generic Alternative Available: Switch to ${rule.genericMolecule} (${displayAltBrand}) and save ~${savingsPercent}% (Est. Rs. ${savingsAmount} saving/pack)`;

      return {
        genericMolecule: rule.genericMolecule,
        brandName: displayAltBrand,
        brandGenericLabel: `${rule.genericMolecule} (${displayAltBrand})`,
        strength: detectedStrength,
        prescribedBrand: brandCleanName,
        brandPriceEst: brandPrice,
        genericPriceEst: genericPrice,
        savingsPercent,
        savingsAmount,
        calloutText,
        manufacturerA: rule.manufacturerA,
        manufacturerB: rule.manufacturerB,
        packUnits,
      };
    }
  }

  return null;
}

/**
 * Calculates estimated order cost and savings for a given tablet count.
 */
export function calculateOrderPricing({
  packQuantity,
  brandPricePerPack,
  genericPricePerPack,
  packUnits = 14,
}: {
  packQuantity: number;
  brandPricePerPack: number;
  genericPricePerPack: number;
  packUnits?: number;
}) {
  const units = Math.max(1, packUnits);
  const packsCount = Math.max(1, Math.ceil(packQuantity / units));

  const totalBrandCost = packsCount * brandPricePerPack;
  const totalGenericCost = packsCount * genericPricePerPack;
  const totalSavings = totalBrandCost - totalGenericCost;
  const savingsPct = totalBrandCost > 0 ? Math.round((totalSavings / totalBrandCost) * 100) : 0;

  return {
    packsCount,
    totalBrandCost,
    totalGenericCost,
    totalSavings,
    savingsPct,
  };
}

const DELIVERY_AREA_STORAGE_KEY = 'curewell_patient_delivery_area_v1';
const PARTNER_PHARMACY_STORAGE_KEY = 'curewell_selected_partner_pharmacy_v1';

export function getSavedDeliveryArea(): string {
  try {
    return localStorage.getItem(DELIVERY_AREA_STORAGE_KEY) || 'Gulberg, Lahore';
  } catch {
    return 'Gulberg, Lahore';
  }
}

export function saveDeliveryArea(area: string): void {
  try {
    if (area.trim()) {
      localStorage.setItem(DELIVERY_AREA_STORAGE_KEY, area.trim());
    }
  } catch {
    // ignore quota
  }
}

export function getSavedPartnerPharmacyId(): string {
  try {
    return localStorage.getItem(PARTNER_PHARMACY_STORAGE_KEY) || 'dvago';
  } catch {
    return 'dvago';
  }
}

export function savePartnerPharmacyId(id: string): void {
  try {
    localStorage.setItem(PARTNER_PHARMACY_STORAGE_KEY, id);
  } catch {
    // ignore quota
  }
}
