import { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../ui/Field';
import { Badge } from '../ui/Badge';
import { CheckIcon, AlertTriangleIcon, SparklesIcon } from '../ui/icons';
import { MessageCircle } from 'lucide-react';
import { compareMedicines } from '../../lib/ai/client';
import {
  findGenericAlternative,
  getSavedDeliveryArea,
} from '../../lib/pharmacy/smartGenericSwitcher';
import {
  generateWhatsAppOrderUrl,
  getPreferredPharmacy,
} from '../../lib/pharmacy/whatsapp';
import { recordMedicinePurchaseExpense } from '../../lib/finance';
import type { CompareMedicinesResponse } from '../../../api/_lib/schemas';

export interface BrandMatcherModalProps {
  open: boolean;
  onClose: () => void;
  initialBrandA?: string;
  initialBrandB?: string;
  profileId?: string;
  onOrderAlternative?: (alternative: {
    brandName: string;
    genericName?: string;
    strength?: string;
  }) => void;
}

const COMMON_COMPARISON_PAIRS = [
  { a: 'Risek 20mg', b: 'Omega 20mg', note: 'Omeprazole' },
  { a: 'Panadol 500mg', b: 'Febrol 500mg', note: 'Paracetamol' },
  { a: 'Lipiget 20mg', b: 'Atorva 20mg', note: 'Atorvastatin' },
  { a: 'Glucophage 500mg', b: 'Neodipar 500mg', note: 'Metformin' },
];

export function BrandMatcherModal({
  open,
  onClose,
  initialBrandA = '',
  initialBrandB = '',
  profileId = 'default',
  onOrderAlternative,
}: BrandMatcherModalProps) {
  const [brandA, setBrandA] = useState(initialBrandA);
  const [brandB, setBrandB] = useState(initialBrandB);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [result, setResult] = useState<CompareMedicinesResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial inputs when opening modal or receiving new brand info
  useEffect(() => {
    if (open) {
      if (initialBrandA) {
        setBrandA(initialBrandA);
        const alt = findGenericAlternative(initialBrandA);
        if (alt && !initialBrandB) {
          setBrandB(alt.brandName);
        } else if (initialBrandB) {
          setBrandB(initialBrandB);
        }
      } else if (initialBrandB) {
        setBrandB(initialBrandB);
      }
    }
  }, [open, initialBrandA, initialBrandB]);

  const handleCompare = async () => {
    if (!brandA.trim() || !brandB.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await compareMedicines({
        brand_a: brandA.trim(),
        brand_b: brandB.trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not compare brands right now. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setBrandA('');
    setBrandB('');
    setResult(null);
    setErrorMessage(null);
  };

  const handleOneTapOrderAlternative = () => {
    if (!result?.brand_b) return;

    const targetBrand = result.brand_b.brand_name;
    const targetGeneric = result.brand_b.generic_name;
    const targetStrength = result.brand_b.strength;

    const prefPharmacy = getPreferredPharmacy(profileId);
    const deliveryArea = getSavedDeliveryArea();
    const genericAlt = findGenericAlternative(result.brand_a.brand_name, result.brand_a.strength);
    const estPrice = genericAlt?.genericPriceEst || 350;

    // Generate WhatsApp order
    const url = generateWhatsAppOrderUrl({
      medicineName: targetBrand,
      strength: targetStrength || undefined,
      quantityNeeded: '1 standard pack (30 tablets)',
      pharmacyPhone: prefPharmacy.phone || '923111138246',
      pharmacyName: prefPharmacy.name || 'Dvago Pharmacy',
      patientArea: deliveryArea,
      isGenericAlternative: true,
      prescribedBrand: result.brand_a.brand_name,
      genericMolecule: targetGeneric || undefined,
      estimatedPrice: estPrice,
      savingsEstimate: genericAlt
        ? `Save ~${genericAlt.savingsPercent}% / Rs. ${genericAlt.savingsAmount}`
        : 'Est. ~40% savings',
    });

    // Automatically record purchase expense in finance.ts
    recordMedicinePurchaseExpense({
      profileId,
      medicineName: `${targetBrand}${targetGeneric ? ` (${targetGeneric})` : ''}`,
      amount: estPrice,
      currency: 'PKR',
      quantity: 30,
      note: `1-Tap alternative order via WhatsApp: substituted for ${result.brand_a.brand_name}`,
    });

    // Notify optional parent handler
    onOrderAlternative?.({
      brandName: targetBrand,
      genericName: targetGeneric || undefined,
      strength: targetStrength || undefined,
    });

    // Launch WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOrdering(true);
    setTimeout(() => {
      setIsOrdering(false);
    }, 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Pharmacy Brand & Generic Comparator"
      description="Compare active chemical ingredients between two commercial brands at the pharmacy."
    >
      <div className="space-y-4 pt-1">
        {/* Quick example pairs */}
        {!result && (
          <div className="space-y-1.5">
            <span className="text-2xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1">
              <SparklesIcon size={12} className="text-accent" /> Popular Local Comparisons
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_COMPARISON_PAIRS.map((pair, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBrandA(pair.a);
                    setBrandB(pair.b);
                  }}
                  className="text-2xs px-2.5 py-1 rounded-lg bg-surface-sunken hover:bg-surface-raised border border-line text-content transition-colors font-medium"
                >
                  {pair.a} vs {pair.b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="brand-a-input" label="Prescribed Brand (Product A)" required>
            <Input
              value={brandA}
              onChange={(e) => setBrandA(e.target.value)}
              placeholder="e.g. Risek 20mg"
              disabled={isLoading}
            />
          </Field>

          <Field id="brand-b-input" label="Offered Brand (Product B)" required>
            <Input
              value={brandB}
              onChange={(e) => setBrandB(e.target.value)}
              placeholder="e.g. Omega 20mg"
              disabled={isLoading}
            />
          </Field>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-risk-bg border border-risk-border text-risk-text text-xs font-medium flex items-start gap-2">
            <AlertTriangleIcon size={15} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action button */}
        {!result && (
          <Button
            variant="primary"
            size="md"
            onClick={handleCompare}
            loading={isLoading}
            disabled={!brandA.trim() || !brandB.trim()}
            className="w-full font-bold h-11 text-xs sm:text-sm rounded-xl"
          >
            Compare Active Ingredients
          </Button>
        )}

        {/* Comparison Result Card */}
        {result && (
          <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface-raised space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-line">
              <span className="text-xs font-bold text-content uppercase tracking-wider">
                Chemical Ingredient Comparison
              </span>
              <Badge
                tone={result.is_same_active_ingredient ? 'ok' : 'warn'}
                size="sm"
                className="font-bold flex items-center gap-1"
              >
                {result.is_same_active_ingredient ? (
                  <>
                    <CheckIcon size={12} /> Identical Active Ingredient
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon size={12} /> Different Active Ingredients
                  </>
                )}
              </Badge>
            </div>

            {/* Side-by-side comparison boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-sunken border border-line space-y-1">
                <span className="text-2xs font-bold text-content-muted block uppercase">
                  Product A (Prescribed)
                </span>
                <p className="font-bold text-content text-sm">{result.brand_a.brand_name}</p>
                <p className="text-accent font-semibold">
                  Molecule: {result.brand_a.generic_name || 'Unspecified'}
                </p>
                {result.brand_a.strength && (
                  <p className="text-content-muted text-2xs">Strength: {result.brand_a.strength}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-surface-sunken border border-line space-y-1">
                <span className="text-2xs font-bold text-content-muted block uppercase">
                  Product B (Alternative)
                </span>
                <p className="font-bold text-content text-sm">{result.brand_b.brand_name}</p>
                <p className="text-accent font-semibold">
                  Molecule: {result.brand_b.generic_name || 'Unspecified'}
                </p>
                {result.brand_b.strength && (
                  <p className="text-content-muted text-2xs">Strength: {result.brand_b.strength}</p>
                )}
              </div>
            </div>

            {/* Summary description */}
            <p className="text-xs text-content leading-relaxed bg-surface-sunken/60 p-3 rounded-xl border border-line">
              {result.comparison_summary}
            </p>

            {/* Pharmacist disclaimer */}
            <div className="p-3 rounded-xl bg-warn-bg/40 border border-warn-border/50 text-warn-text text-2xs space-y-1">
              <span className="font-bold block">Pharmacist Verification Notice:</span>
              <p>{result.pharmacist_notice}</p>
            </div>

            {/* 1-Tap Order Alternative action button */}
            {result.brand_b && (
              <div className="p-3.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-emerald-600" />
                    1-Tap Pharmacy Dispatch
                  </span>
                  <Badge tone="ok" size="sm">
                    {result.is_same_active_ingredient ? 'Bioequivalent Match' : 'Alternative'}
                  </Badge>
                </div>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                  Switch to <strong>{result.brand_b.brand_name}</strong> to save on your prescription. Automatically formats WhatsApp refill & records expense in your finance tracker.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOneTapOrderAlternative}
                  disabled={isOrdering}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-bold text-xs h-10 rounded-xl shadow-xs flex items-center justify-center gap-2 tap-spring"
                >
                  {isOrdering ? (
                    <>
                      <CheckIcon size={14} />
                      Alternative Order Dispatched & Logged!
                    </>
                  ) : (
                    <>
                      <MessageCircle size={15} />
                      1-Tap Order {result.brand_b.brand_name} via WhatsApp
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="w-full text-xs font-semibold"
              >
                Compare Another Pair
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                className="w-full text-xs font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
