/**
 * DRAP (Drug Regulatory Authority of Pakistan) Bioequivalent Generic Salt Registry
 * and Pharmacy Price Comparison Engine for Mobile.
 *
 * Provides offline brand-to-generic mappings, price benchmarking in PKR,
 * cost-savings calculations, and WhatsApp order generation for top Pakistani pharmacies.
 */

import { AlternativeBrand, PharmacyAlternative } from '../types';

export interface PharmacyContact {
  id: string;
  name: string;
  phone: string;
  cityCoverage: string;
  isPartner: boolean;
  notes?: string;
}

export const PAKISTANI_PHARMACY_CONTACTS: PharmacyContact[] = [
  {
    id: 'dvago',
    name: 'Dvago Pharmacy',
    phone: '+923111729729',
    cityCoverage: 'Karachi, Lahore, Islamabad, Rawalpindi',
    isPartner: true,
    notes: '24/7 cold-chain medicine delivery network',
  },
  {
    id: 'servaid',
    name: 'Servaid Pharmacy',
    phone: '+9242111737824',
    cityCoverage: 'Lahore, Faisalabad, Multan, Gujranwala, Sialkot',
    isPartner: true,
    notes: 'Leading Punjab pharmacy chain with express delivery',
  },
  {
    id: 'dawaai',
    name: 'Dawaai.pk',
    phone: '+9221111329224',
    cityCoverage: 'Nationwide Delivery across Pakistan',
    isPartner: true,
    notes: 'Licensed digital pharmacy network across 90+ cities',
  },
  {
    id: 'local_chemist',
    name: 'Local Chemist',
    phone: '',
    cityCoverage: 'Neighborhood Chemist',
    isPartner: false,
    notes: 'User configurable neighborhood pharmacy / medical store',
  },
];

interface BrandOffering {
  name: string;
  manufacturer: string;
  pricePkr: number;
}

interface SaltRegistryEntry {
  salt: string;
  keywords: string[];
  defaultStrength: string;
  strengthVariants: Record<string, BrandOffering[]>;
}

export const DRAP_SALT_REGISTRY: SaltRegistryEntry[] = [
  {
    salt: 'Omeprazole',
    keywords: ['risek', 'omega', 'omez', 'omeprazole', 'losec'],
    defaultStrength: '20mg',
    strengthVariants: {
      '20mg': [
        { name: 'Risek 20mg', manufacturer: 'OBS Healthcare / Searle', pricePkr: 450 },
        { name: 'Omez 20mg', manufacturer: 'Getz Pharma', pricePkr: 340 },
        { name: 'Omega 20mg', manufacturer: 'Ferozsons Laboratories', pricePkr: 270 },
      ],
      '40mg': [
        { name: 'Risek 40mg', manufacturer: 'OBS Healthcare / Searle', pricePkr: 850 },
        { name: 'Omez 40mg', manufacturer: 'Getz Pharma', pricePkr: 620 },
        { name: 'Omega 40mg', manufacturer: 'Ferozsons Laboratories', pricePkr: 510 },
      ],
    },
  },
  {
    salt: 'Metformin HCl',
    keywords: ['glucophage', 'metphage', 'neodipar', 'metformin'],
    defaultStrength: '500mg',
    strengthVariants: {
      '500mg': [
        { name: 'Glucophage 500mg', manufacturer: 'Merck / Martin Dow', pricePkr: 350 },
        { name: 'Metphage 500mg', manufacturer: 'Getz Pharma', pricePkr: 240 },
        { name: 'Neodipar 500mg', manufacturer: 'Sanofi-Aventis', pricePkr: 210 },
      ],
      '850mg': [
        { name: 'Glucophage 850mg', manufacturer: 'Merck / Martin Dow', pricePkr: 430 },
        { name: 'Metphage 850mg', manufacturer: 'Getz Pharma', pricePkr: 300 },
        { name: 'Neodipar 850mg', manufacturer: 'Sanofi-Aventis', pricePkr: 260 },
      ],
      '1000mg': [
        { name: 'Glucophage 1000mg', manufacturer: 'Merck / Martin Dow', pricePkr: 490 },
        { name: 'Metphage 1000mg', manufacturer: 'Getz Pharma', pricePkr: 340 },
        { name: 'Neodipar 1000mg', manufacturer: 'Sanofi-Aventis', pricePkr: 295 },
      ],
    },
  },
  {
    salt: 'Bisoprolol Fumarate',
    keywords: ['concor', 'cardicor', 'bipress', 'bisoprolol', 'bislol'],
    defaultStrength: '5mg',
    strengthVariants: {
      '2.5mg': [
        { name: 'Concor 2.5mg', manufacturer: 'Merck / Martin Dow', pricePkr: 380 },
        { name: 'Cardicor 2.5mg', manufacturer: 'Getz Pharma', pricePkr: 280 },
        { name: 'Bipress 2.5mg', manufacturer: 'Highnoon Laboratories', pricePkr: 240 },
      ],
      '5mg': [
        { name: 'Concor 5mg', manufacturer: 'Merck / Martin Dow', pricePkr: 460 },
        { name: 'Cardicor 5mg', manufacturer: 'Getz Pharma', pricePkr: 350 },
        { name: 'Bipress 5mg', manufacturer: 'Highnoon Laboratories', pricePkr: 290 },
      ],
    },
  },
  {
    salt: 'Atorvastatin Calcium',
    keywords: ['lipiget', 'lipitor', 'lowlip', 'atorva', 'atorvastatin'],
    defaultStrength: '20mg',
    strengthVariants: {
      '10mg': [
        { name: 'Lipitor 10mg', manufacturer: 'Pfizer', pricePkr: 680 },
        { name: 'Lipiget 10mg', manufacturer: 'Getz Pharma', pricePkr: 370 },
        { name: 'Lowlip 10mg', manufacturer: 'Searle', pricePkr: 290 },
        { name: 'Atorva 10mg', manufacturer: 'PharmEvo', pricePkr: 230 },
      ],
      '20mg': [
        { name: 'Lipitor 20mg', manufacturer: 'Pfizer', pricePkr: 980 },
        { name: 'Lipiget 20mg', manufacturer: 'Getz Pharma', pricePkr: 620 },
        { name: 'Lowlip 20mg', manufacturer: 'Searle', pricePkr: 480 },
        { name: 'Atorva 20mg', manufacturer: 'PharmEvo', pricePkr: 380 },
      ],
    },
  },
  {
    salt: 'Co-Amoxiclav (Amoxicillin + Clavulanic Acid)',
    keywords: ['augmentin', 'amoxyclav', 'curam', 'co-amoxiclav', 'amoxiclav'],
    defaultStrength: '625mg',
    strengthVariants: {
      '625mg': [
        { name: 'Augmentin 625mg', manufacturer: 'GSK', pricePkr: 550 },
        { name: 'Amoxyclav 625mg', manufacturer: 'Bosch Pharmaceuticals', pricePkr: 420 },
        { name: 'Curam 625mg', manufacturer: 'Sandoz / Novartis', pricePkr: 360 },
      ],
      '1g': [
        { name: 'Augmentin 1g', manufacturer: 'GSK', pricePkr: 820 },
        { name: 'Amoxyclav 1g', manufacturer: 'Bosch Pharmaceuticals', pricePkr: 640 },
        { name: 'Curam 1g', manufacturer: 'Sandoz / Novartis', pricePkr: 540 },
      ],
      '1000mg': [
        { name: 'Augmentin 1g', manufacturer: 'GSK', pricePkr: 820 },
        { name: 'Amoxyclav 1g', manufacturer: 'Bosch Pharmaceuticals', pricePkr: 640 },
        { name: 'Curam 1g', manufacturer: 'Sandoz / Novartis', pricePkr: 540 },
      ],
    },
  },
  {
    salt: 'Paracetamol / Acetaminophen',
    keywords: ['panadol', 'calpol', 'disprol', 'febrol', 'paracetamol'],
    defaultStrength: '500mg',
    strengthVariants: {
      '500mg': [
        { name: 'Panadol 500mg', manufacturer: 'Haleon / GSK', pricePkr: 250 },
        { name: 'Calpol 500mg', manufacturer: 'GSK', pricePkr: 220 },
        { name: 'Disprol 500mg', manufacturer: 'Reckitt Benckiser', pricePkr: 180 },
        { name: 'Febrol 500mg', manufacturer: 'Pacific Pharmaceuticals', pricePkr: 150 },
      ],
    },
  },
  {
    salt: 'Loratadine',
    keywords: ['softin', 'clarityn', 'lorine', 'loratadine'],
    defaultStrength: '10mg',
    strengthVariants: {
      '10mg': [
        { name: 'Clarityn 10mg', manufacturer: 'Bayer', pricePkr: 380 },
        { name: 'Softin 10mg', manufacturer: 'Searle', pricePkr: 310 },
        { name: 'Lorine 10mg', manufacturer: 'Tabros Pharma', pricePkr: 220 },
      ],
    },
  },
];

/**
 * Searches the DRAP registry for bioequivalent alternatives, comparing prices and potential savings.
 */
export function getBioequivalentAlternatives(brandOrGeneric: string): PharmacyAlternative | null {
  if (!brandOrGeneric || typeof brandOrGeneric !== 'string') {
    return null;
  }

  const query = brandOrGeneric.toLowerCase().trim();

  for (const entry of DRAP_SALT_REGISTRY) {
    const isMatched = entry.keywords.some((kw) => query.includes(kw));

    if (isMatched) {
      // Detect requested strength if specified in query
      let matchedStrength = entry.defaultStrength;
      const strengths = Object.keys(entry.strengthVariants);

      for (const st of strengths) {
        if (query.includes(st.toLowerCase())) {
          matchedStrength = st;
          break;
        }
      }

      // Handle 1000mg vs 1g synonym
      if (!entry.strengthVariants[matchedStrength]) {
        if (matchedStrength === '1000mg' && entry.strengthVariants['1g']) {
          matchedStrength = '1g';
        } else if (matchedStrength === '1g' && entry.strengthVariants['1000mg']) {
          matchedStrength = '1000mg';
        } else {
          matchedStrength = entry.defaultStrength;
        }
      }

      const offerings = entry.strengthVariants[matchedStrength] || [];
      if (offerings.length === 0) {
        return null;
      }

      // Find if user specifically queried one of the known brands
      const foundBrand = offerings.find((offering) => {
        const firstWord = offering.name.split(' ')[0];
        return firstWord ? query.includes(firstWord.toLowerCase()) : false;
      });

      // Determine benchmark/reference price for calculating savings
      // If user queried a specific brand, compare relative to that brand.
      // Otherwise, compare relative to the highest-priced originator brand in the group.
      const maxPrice = Math.max(...offerings.map((o) => o.pricePkr));
      const referencePrice = foundBrand ? foundBrand.pricePkr : maxPrice;
      const lowestPrice = Math.min(...offerings.map((o) => o.pricePkr));

      const alternatives: AlternativeBrand[] = offerings.map((item) => {
        const isCheapest = item.pricePkr === lowestPrice;
        const savingsAmount = referencePrice - item.pricePkr;
        const savingsPct =
          referencePrice > 0 && savingsAmount > 0
            ? Math.round((savingsAmount / referencePrice) * 100)
            : 0;

        return {
          name: item.name,
          manufacturer: item.manufacturer,
          pricePkr: item.pricePkr,
          isCheapest,
          savingsPct,
        };
      });

      // Sort by price ascending (cheapest first)
      alternatives.sort((a, b) => a.pricePkr - b.pricePkr);

      const displayBrandName = foundBrand
        ? foundBrand.name
        : `${brandOrGeneric.trim()} (${matchedStrength})`;

      return {
        brand: displayBrandName,
        salt: entry.salt,
        strength: matchedStrength,
        alternatives,
      };
    }
  }

  return null;
}

/**
 * Formats a polite, professional bilingual (Urdu & English) order inquiry message
 * and generates a WhatsApp deep-link URL (https://wa.me/{phone}?text=...).
 */
export function generatePharmacyWhatsAppUrl(
  pharmacyName: string,
  pharmacyPhone: string,
  patientName: string,
  items: Array<{ name: string; strength: string; quantity: number }>
): string {
  // Normalize Pakistani telephone number to international format 92XXXXXXXXXX
  let cleanPhone = (pharmacyPhone || '').replace(/[^\d]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.slice(1);
  }
  if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
    cleanPhone = '92' + cleanPhone;
  }

  const itemsListText =
    items && items.length > 0
      ? items
          .map((item, index) => {
            const strengthTag = item.strength && !item.name.includes(item.strength)
              ? ` ${item.strength}`
              : '';
            return `${index + 1}. *${item.name}${strengthTag}* — Qty: ${item.quantity}`;
          })
          .join('\n')
      : '• (Prescription medicines as attached)';

  const lines = [
    `*السلام علیکم / Hello${pharmacyName ? ' ' + pharmacyName : ''}*`,
    `I would like to place a prescription refill / medicine inquiry via Curewell:`,
    ``,
    `👤 *Patient Name:* ${patientName || 'Curewell Patient'}`,
    `📋 *Required Medicines:*`,
    itemsListText,
    ``,
    `*برائے مہربانی درج ذیل تفصیلات سے آگاہ فرمائیں:*`,
    `1. Availability & Expiry / دستیابی`,
    `2. Total Price in PKR (with generic options if available) / کل قیمت`,
    `3. Home Delivery Estimated Time / ڈلیوری کا وقت`,
    ``,
    `*(Doctor's prescription available upon request)*`,
    `Thank you! شکریہ`,
  ];

  const fullText = lines.join('\n');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;
}
