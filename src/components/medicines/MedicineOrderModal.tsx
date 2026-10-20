import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  Plus,
  Check,
  Building2,
  Pill,
  FileText,
  Sparkles,
  TrendingDown,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import {
  generateWhatsAppOrderUrl,
  getPreferredPharmacy,
  savePreferredPharmacy,
  type PharmacyContact,
} from '../../lib/pharmacy/whatsapp';
import {
  findGenericAlternative,
  calculateOrderPricing,
  PARTNER_PHARMACIES,
  getSavedDeliveryArea,
  saveDeliveryArea,
  getSavedPartnerPharmacyId,
  savePartnerPharmacyId,
} from '../../lib/pharmacy/smartGenericSwitcher';
import { writeInventory, readInventory } from '../../lib/inventory';
import { recordMedicinePurchaseExpense } from '../../lib/finance';
import type { Tables } from '../../lib/supabase/types';

type Medicine = Tables<'medicines'>;

export interface MedicineOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  profileId: string;
  onStockUpdated?: (newCount: number) => void;
}

export function MedicineOrderModal({
  isOpen,
  onClose,
  medicine,
  profileId,
  onStockUpdated,
}: MedicineOrderModalProps) {
  const navigate = useNavigate();

  // Detect Smart Generic Alternative
  const genericAlternative = useMemo(() => {
    if (!medicine) return null;
    return findGenericAlternative(medicine.medicine_name, medicine.strength);
  }, [medicine]);

  // Choice between Prescribed Brand and Cost-Saving Generic
  const [selectedTier, setSelectedTier] = useState<'prescribed' | 'generic'>('generic');

  // Partner Pharmacies & Delivery Area State
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(() =>
    getSavedPartnerPharmacyId()
  );
  const [customPharmacy, setCustomPharmacy] = useState<PharmacyContact>(() =>
    getPreferredPharmacy(profileId)
  );
  const [isEditingCustomPharmacy, setIsEditingCustomPharmacy] = useState(false);

  const [patientArea, setPatientArea] = useState<string>(() => getSavedDeliveryArea());
  const [isEditingArea, setIsEditingArea] = useState(false);

  // Quantity & Purchase State
  const [packQuantity, setPackQuantity] = useState<number>(30);
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'instore'>('whatsapp');
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync profile pharmacy
  useEffect(() => {
    if (profileId) {
      setCustomPharmacy(getPreferredPharmacy(profileId));
    }
  }, [profileId]);

  // When medicine changes, default to generic if available
  useEffect(() => {
    if (genericAlternative) {
      setSelectedTier('generic');
    } else {
      setSelectedTier('prescribed');
    }
  }, [genericAlternative]);

  if (!medicine) return null;

  const currentInventory = readInventory(profileId);
  const stockCount = currentInventory[medicine.id] ?? 0;
  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  // Selected Pharmacy details
  const activePharmacyInfo = useMemo(() => {
    if (selectedPharmacyId === 'custom') {
      return {
        name: customPharmacy.name || 'Custom Local Chemist',
        phone: customPharmacy.phone,
        tagline: 'Neighborhood trusted chemist',
        badge: 'Custom',
      };
    }
    const partner = PARTNER_PHARMACIES.find((p) => p.id === selectedPharmacyId);
    return (
      partner || {
        name: 'Dvago Pharmacy',
        phone: '923111138246',
        tagline: '100% genuine medicines & cold-chain delivery',
        badge: 'Official Partner',
      }
    );
  }, [selectedPharmacyId, customPharmacy]);

  // Pricing calculations
  const brandPackPrice = genericAlternative ? genericAlternative.brandPriceEst : 500;
  const genericPackPrice = genericAlternative ? genericAlternative.genericPriceEst : 350;
  const packUnits = genericAlternative?.packUnits || 14;

  const pricing = calculateOrderPricing({
    packQuantity,
    brandPricePerPack: brandPackPrice,
    genericPricePerPack: genericPackPrice,
    packUnits,
  });

  const isGenericActive = Boolean(selectedTier === 'generic' && genericAlternative);
  const activeEstimatedTotal = isGenericActive
    ? pricing.totalGenericCost
    : pricing.totalBrandCost;
  const activeMedicineName = isGenericActive
    ? genericAlternative!.brandName
    : medicine.medicine_name;
  const activeStrength = isGenericActive
    ? genericAlternative!.strength
    : medicine.strength;

  const handleSelectPharmacy = (id: string) => {
    setSelectedPharmacyId(id);
    savePartnerPharmacyId(id);
    if (id === 'custom' && !customPharmacy.phone) {
      setIsEditingCustomPharmacy(true);
    }
  };

  const handleSaveCustomPharmacy = () => {
    savePreferredPharmacy(profileId, customPharmacy);
    setIsEditingCustomPharmacy(false);
  };

  const handleSaveArea = (newArea: string) => {
    setPatientArea(newArea);
    saveDeliveryArea(newArea);
  };

  const handleConfirmWhatsAppOrder = () => {
    if (!activePharmacyInfo.phone.trim()) {
      setIsEditingCustomPharmacy(true);
      return;
    }

    const url = generateWhatsAppOrderUrl({
      medicineName: activeMedicineName,
      strength: activeStrength,
      doseAmount: medicine.dose_amount,
      quantityNeeded: `${packQuantity} tablets (${pricing.packsCount} ${pricing.packsCount === 1 ? 'pack' : 'packs'})`,
      pharmacyPhone: activePharmacyInfo.phone,
      pharmacyName: activePharmacyInfo.name,
      patientArea: patientArea,
      instructions: medicine.instructions,
      isGenericAlternative: isGenericActive,
      prescribedBrand: isGenericActive ? medicine.medicine_name : undefined,
      genericMolecule: genericAlternative?.genericMolecule,
      estimatedPrice: activeEstimatedTotal,
      savingsEstimate: isGenericActive
        ? `Save ~${pricing.savingsPct}% / Rs. ${pricing.totalSavings}`
        : undefined,
    });

    // 1. Record purchase into finance tracker
    recordMedicinePurchaseExpense({
      profileId,
      medicineName: isGenericActive
        ? `${genericAlternative!.brandName} (${genericAlternative!.genericMolecule})`
        : medicine.medicine_name,
      amount: activeEstimatedTotal,
      currency: medicine.currency || 'PKR',
      quantity: packQuantity,
      note: isGenericActive
        ? `Refill ordered via WhatsApp (${activePharmacyInfo.name}) - Switched to generic equivalent (Saved ~${pricing.savingsPct}%)`
        : `Refill ordered via WhatsApp (${activePharmacyInfo.name}) - Prescribed brand`,
    });

    // 2. Automatically update cabinet inventory
    const newStock = stockCount + packQuantity;
    currentInventory[medicine.id] = newStock;
    writeInventory(profileId, currentInventory);
    onStockUpdated?.(newStock);

    // 3. Launch WhatsApp deep link
    window.open(url, '_blank', 'noopener,noreferrer');

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const handleRecordInStorePurchase = () => {
    if (packQuantity <= 0) return;

    const newStock = stockCount + packQuantity;
    currentInventory[medicine.id] = newStock;
    writeInventory(profileId, currentInventory);

    const priceNum = parseFloat(purchasePrice) || activeEstimatedTotal;
    if (priceNum > 0) {
      recordMedicinePurchaseExpense({
        profileId,
        medicineName: isGenericActive
          ? `${genericAlternative!.brandName} (${genericAlternative!.genericMolecule})`
          : medicine.medicine_name,
        amount: priceNum,
        currency: medicine.currency || 'PKR',
        quantity: packQuantity,
        note: isGenericActive
          ? `In-store purchase: switched to generic ${genericAlternative!.brandName}`
          : `In-store purchase for ${medicine.medicine_name}`,
      });
    }

    onStockUpdated?.(newStock);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  const handleGoToDetails = () => {
    onClose();
    navigate(`/medicines/${medicine.id}`);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Refill & Commercial Pharmacy Order"
      description="Procure certified medications or cost-saving generic bioequivalents via partner pharmacies."
    >
      <div className="space-y-4 pt-1 text-content">
        {/* Prescription Summary Box */}
        <div className="rounded-2xl border border-line bg-surface-sunken p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-xs border border-accent/20">
                <Pill size={16} />
              </span>
              <div>
                <h4 className="font-bold text-sm text-content leading-tight">
                  {medicine.medicine_name} {medicine.strength}
                </h4>
                <p className="text-xs text-content-muted">
                  {medicine.frequency_raw || medicine.frequency_code || 'As prescribed by doctor'}
                </p>
              </div>
            </div>

            {/* Live Cabinet Stock Badge */}
            {isOutOfStock ? (
              <Badge tone="risk" size="sm" withIcon>
                Out of Stock (0 pills)
              </Badge>
            ) : isLowStock ? (
              <Badge tone="warn" size="sm" withIcon>
                Low Stock: {stockCount} left
              </Badge>
            ) : (
              <Badge tone="ok" size="sm" withIcon>
                {stockCount} in cabinet
              </Badge>
            )}
          </div>

          {medicine.instructions && (
            <div className="text-xs text-content-subtle flex items-start gap-1.5 pt-1 border-t border-line/60">
              <FileText size={13} className="text-accent shrink-0 mt-0.5" />
              <span>{medicine.instructions}</span>
            </div>
          )}
        </div>

        {/* SMART GENERIC SWITCHER CALLOUT & TOGGLE */}
        {genericAlternative && (
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                <Sparkles size={16} />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Smart Generic Switcher
                  </span>
                  <Badge tone="ok" size="sm">
                    ~{genericAlternative.savingsPercent}% Savings
                  </Badge>
                </div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                  {genericAlternative.calloutText}
                </p>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Identical DRAP-approved chemical molecule ({genericAlternative.genericMolecule}) with equal clinical bioequivalence.
                </p>
              </div>
            </div>

            {/* Brand vs Generic Interactive Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTier('prescribed')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTier === 'prescribed'
                    ? 'border-line bg-surface shadow-xs ring-2 ring-content/20'
                    : 'border-line/60 bg-surface-sunken/60 hover:bg-surface text-content-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-content-muted">
                    Prescribed Brand
                  </span>
                  <span className="text-xs font-mono font-bold text-content">
                    Rs. {genericAlternative.brandPriceEst}/pack
                  </span>
                </div>
                <p className="font-bold text-xs text-content mt-1">
                  {genericAlternative.prescribedBrand}
                </p>
                <span className="text-[10px] text-content-subtle">
                  Maker: {genericAlternative.manufacturerA}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTier('generic')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  selectedTier === 'generic'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-600'
                    : 'border-line/60 bg-surface-sunken/60 hover:bg-surface text-content-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingDown size={12} /> Cost-Saving Generic
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    Rs. {genericAlternative.genericPriceEst}/pack
                  </span>
                </div>
                <p className="font-bold text-xs text-content mt-1">
                  {genericAlternative.brandName}
                </p>
                <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Maker: {genericAlternative.manufacturerB}</span>
                  <span>Save Rs. {genericAlternative.savingsAmount}/pk</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Action Choice Tabs: WhatsApp Partner Pharmacy vs In-Store Log */}
        <div className="flex rounded-xl bg-surface-sunken p-1 border border-line">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-content-muted hover:text-content'
            }`}
          >
            <MessageCircle size={15} />
            Partner Pharmacy WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instore')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'instore'
                ? 'bg-accent text-white shadow-xs'
                : 'text-content-muted hover:text-content'
            }`}
          >
            <ShoppingBag size={15} />
            Log Store Purchase
          </button>
        </div>

        {/* Tab 1: WhatsApp Partner Pharmacy Direct Order */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
            {/* Partner Pharmacy Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-emerald-600" />
                  Select Partner Pharmacy
                </span>
                <span className="text-2xs text-content-subtle flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-600" /> Genuine DRAP Certified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PARTNER_PHARMACIES.map((pharm) => {
                  const isSelected = selectedPharmacyId === pharm.id;
                  return (
                    <button
                      key={pharm.id}
                      type="button"
                      onClick={() => handleSelectPharmacy(pharm.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-bold ring-1 ring-emerald-600'
                          : 'border-line bg-surface-sunken hover:bg-surface text-content'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{pharm.name.replace(' Pharmacy', '')}</span>
                        {pharm.isPartner && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-1" />
                        )}
                      </div>
                      <span className="text-[10px] text-content-muted block truncate mt-0.5">
                        {pharm.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Pharmacy Form if custom selected */}
              {selectedPharmacyId === 'custom' && (
                <div className="p-3 rounded-xl border border-line bg-surface-sunken space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-content-muted uppercase">
                      Local Chemist Details
                    </span>
                    {!isEditingCustomPharmacy ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingCustomPharmacy(true)}
                        className="text-xs text-accent hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveCustomPharmacy}
                        className="text-xs text-emerald-600 hover:underline font-bold"
                      >
                        Save
                      </button>
                    )}
                  </div>

                  {!isEditingCustomPharmacy ? (
                    <p className="text-xs text-content font-medium">
                      {customPharmacy.name || 'Local Chemist'} —{' '}
                      <span className="font-mono text-content-muted">
                        {customPharmacy.phone || '(No phone number set)'}
                      </span>
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder="Pharmacy Name (e.g. D.Watson, Time Medicos)"
                        value={customPharmacy.name}
                        onChange={(e) =>
                          setCustomPharmacy({ ...customPharmacy, name: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-line bg-surface text-content"
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp Number (e.g. 923001234567)"
                        value={customPharmacy.phone}
                        onChange={(e) =>
                          setCustomPharmacy({ ...customPharmacy, phone: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-line bg-surface text-content font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Area Configuration */}
            <div className="space-y-1.5 pt-2 border-t border-line">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content flex items-center gap-1.5">
                  <MapPin size={13} className="text-accent" /> Delivery Area
                </span>
                {!isEditingArea ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingArea(true)}
                    className="text-xs text-accent hover:underline font-semibold"
                  >
                    Change Area
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingArea(false)}
                    className="text-xs text-emerald-600 hover:underline font-bold"
                  >
                    Done
                  </button>
                )}
              </div>

              {!isEditingArea ? (
                <div className="p-2.5 rounded-xl bg-surface-sunken border border-line text-xs font-medium text-content">
                  📍 {patientArea || 'Gulberg, Lahore'}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. DHA Phase 5, Lahore or Clifton, Karachi"
                  value={patientArea}
                  onChange={(e) => handleSaveArea(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-line bg-surface text-content"
                />
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="text-xs font-bold text-content flex items-center justify-between">
                <span>Quantity to order:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {packQuantity} tablets ({pricing.packsCount} {pricing.packsCount === 1 ? 'pack' : 'packs'})
                </span>
              </div>
              <div className="flex gap-2">
                {[10, 20, 30, 60].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPackQuantity(count)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      packQuantity === count
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-surface-sunken text-content-muted border-line hover:border-emerald-500/40'
                    }`}
                  >
                    {count} tabs
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Breakdown Card */}
            <div className="p-3 rounded-xl bg-surface-sunken border border-line space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-content-muted">
                <span>Selected Item:</span>
                <span className="font-bold text-content">
                  {activeMedicineName} {activeStrength}
                </span>
              </div>

              <div className="flex items-center justify-between text-content-muted">
                <span>Estimated Pharmacy Price:</span>
                <span className="font-bold text-sm text-content font-mono" data-numeric>
                  PKR {activeEstimatedTotal.toLocaleString()}
                </span>
              </div>

              {isGenericActive && pricing.totalSavings > 0 && (
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-line/60">
                  <span className="flex items-center gap-1">
                    <TrendingDown size={13} /> You Save vs Brand:
                  </span>
                  <span>
                    ~PKR {pricing.totalSavings.toLocaleString()} ({pricing.savingsPct}%)
                  </span>
                </div>
              )}
            </div>

            {/* WhatsApp Order Action */}
            <Button
              variant="primary"
              onClick={handleConfirmWhatsAppOrder}
              disabled={isSuccess}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-bold rounded-xl shadow-xs text-sm flex items-center justify-center gap-2 tap-spring"
            >
              {isSuccess ? (
                <>
                  <Check size={18} />
                  Order Dispatched & Logged to Expenses!
                </>
              ) : (
                <>
                  <MessageCircle size={18} />
                  Order via WhatsApp · PKR {activeEstimatedTotal.toLocaleString()}
                </>
              )}
            </Button>
            <p className="text-[11px] text-content-subtle text-center">
              Opens WhatsApp with pre-filled order & automatically records PKR {activeEstimatedTotal.toLocaleString()} into your Health Expenses tracker.
            </p>
          </div>
        )}

        {/* Tab 2: Log In-Store Purchase */}
        {activeTab === 'instore' && (
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-content uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={13} className="text-accent" />
                Record In-Store Purchase
              </h5>
              {isGenericActive && (
                <Badge tone="ok" size="sm">
                  Logging Generic: {genericAlternative?.brandName}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="pack-qty-input" className="text-xs font-semibold text-content">
                  Tablets / Pack Size Bought
                </label>
                <input
                  id="pack-qty-input"
                  type="number"
                  min="1"
                  value={packQuantity}
                  onChange={(e) => setPackQuantity(parseInt(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-line bg-surface text-content font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="purchase-price-input" className="text-xs font-semibold text-content">
                  Total Cost Paid ({medicine.currency || 'PKR'})
                </label>
                <input
                  id="purchase-price-input"
                  type="number"
                  placeholder={`Est. ${activeEstimatedTotal}`}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-line bg-surface text-content font-bold"
                />
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleRecordInStorePurchase}
              disabled={packQuantity <= 0 || isSuccess}
              className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl shadow-xs text-sm flex items-center justify-center gap-2 tap-spring"
            >
              {isSuccess ? (
                <>
                  <Check size={18} />
                  Stock & Expense Recorded!
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add {packQuantity} Pills to Cabinet
                </>
              )}
            </Button>
            <p className="text-[11px] text-content-subtle text-center">
              Automatically updates your cabinet inventory and logs the expense in your Health Expense tracker.
            </p>
          </div>
        )}

        {/* Footer Navigation: Open Full Clinical Detail */}
        <div className="pt-2 border-t border-line flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoToDetails}
            className="text-xs text-accent hover:text-accent-hover font-semibold flex items-center gap-1.5"
          >
            <span>View Complete Clinical Details & Explainer</span>
            <ExternalLink size={13} />
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
