import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import {
  XIcon,
  CheckIcon,
  MessageSquareIcon,
  MicIcon,
  FileTextIcon,
  UsersIcon,
  ShieldIcon,
  ZapIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '../ui/icons';
import { setFamilyPassActive, getFamilyPassInfo } from '../../lib/caregiver/alerts';

export interface FamilyPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
  defaultTab?: 'overview' | 'checkout';
}

type BillingPeriod = 'monthly' | 'annual';
type Currency = 'PKR' | 'USD';
type PaymentMethod = 'easypaisa' | 'jazzcash' | 'card' | 'raast';

interface PricingTier {
  pkr: { monthly: number; annual: number; annualPerMonth: number };
  usd: { monthly: number; annual: number; annualPerMonth: number };
}

const PRICING: PricingTier = {
  pkr: { monthly: 499, annual: 4790, annualPerMonth: 399 },
  usd: { monthly: 4.99, annual: 47.99, annualPerMonth: 3.99 },
};

export function FamilyPassModal({
  isOpen,
  onClose,
  onSubscribed,
  defaultTab = 'overview',
}: FamilyPassModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [step, setStep] = useState<'showcase' | 'checkout' | 'processing' | 'success'>('showcase');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('easypaisa');
  const [phoneNumber, setPhoneNumber] = useState('03001234567');
  const [cardNumber, setCardNumber] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const info = getFamilyPassInfo();
      setIsSubscribed(info.isActive);
      setCurrentPlan(info.plan);
      setStep(defaultTab === 'checkout' ? 'checkout' : 'showcase');
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step !== 'processing') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const currentPrice =
    currency === 'PKR'
      ? billingPeriod === 'monthly'
        ? `PKR ${PRICING.pkr.monthly}`
        : `PKR ${PRICING.pkr.annual}`
      : billingPeriod === 'monthly'
        ? `$${PRICING.usd.monthly}`
        : `$${PRICING.usd.annual}`;

  const currentPerMonth =
    currency === 'PKR'
      ? billingPeriod === 'annual'
        ? `PKR ${PRICING.pkr.annualPerMonth}/mo`
        : `PKR ${PRICING.pkr.monthly}/mo`
      : billingPeriod === 'annual'
        ? `$${PRICING.usd.annualPerMonth}/mo`
        : `$${PRICING.usd.monthly}/mo`;

  const handleStartActivation = () => {
    setStep('checkout');
  };

  const handleConfirmPayment = () => {
    setStep('processing');
    setTimeout(() => {
      const planCode = `${billingPeriod}_${currency.toLowerCase()}`;
      setFamilyPassActive(true, planCode);
      setIsSubscribed(true);
      setCurrentPlan(planCode);
      setStep('success');
      onSubscribed?.();
    }, 1400);
  };

  const handleCancelSubscription = () => {
    setFamilyPassActive(false);
    setIsSubscribed(false);
    setCurrentPlan(null);
    setStep('showcase');
    onSubscribed?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-pass-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="relative px-5 py-5 sm:px-6 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm shrink-0 shadow-inner">
                <ShieldIcon size={22} className="text-teal-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
                    Premium Health Tier
                  </span>
                  {isSubscribed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-teal-950 flex items-center gap-1">
                      <CheckIcon size={12} /> Active Pass {currentPlan ? `(${currentPlan.replace('_', ' ').toUpperCase()})` : ''}
                    </span>
                  )}
                </div>
                <h2 id="family-pass-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  Curewell Family / Caregiver Pass
                </h2>
                <p className="text-xs sm:text-sm text-teal-100/90 mt-0.5 max-w-md">
                  Complete peace-of-mind for multi-generational Pakistani families & caregivers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={step === 'processing'}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-content">
          {/* STEP 1: SHOWCASE & COMPARISON */}
          {step === 'showcase' && (
            <>
              {/* Billing Cycle & Currency Switchers */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface-hover/70 border border-line">
                <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-line w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      billingPeriod === 'monthly'
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-content-muted hover:text-content'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('annual')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      billingPeriod === 'annual'
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-content-muted hover:text-content'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950">
                      Save 20%
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-content-muted font-medium">Currency:</span>
                  <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCurrency('PKR')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        currency === 'PKR' ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold' : 'text-content-muted'
                      }`}
                    >
                      PKR (₨)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        currency === 'USD' ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold' : 'text-content-muted'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                  <div className="text-right pl-2 border-l border-line">
                    <div className="text-base sm:text-lg font-black text-ink-900 leading-none">
                      {currentPrice}
                    </div>
                    <span className="text-[11px] text-content-muted">
                      {billingPeriod === 'annual' ? `${currentPerMonth} billed annually` : '/ month'}
                    </span>
                  </div>
                </div>
              </div>

              {/* THE 4 KILLER PREMIUM FEATURES */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
                    <StarIcon size={16} className="text-amber-500" />
                    4 Killer Caregiver & Family Superpowers
                  </h3>
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Included in Pass</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Feature 1 */}
                  <div className="p-3.5 rounded-xl border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 transition-colors flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                      <MessageSquareIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-ink-900">
                          Instant WhatsApp Missed-Dose Alerts
                        </h4>
                      </div>
                      <p className="text-xs text-content-muted mt-1 leading-relaxed">
                        Automatic WhatsApp messages sent directly to adult children or caregivers when elderly parents miss a scheduled dose by 60 minutes.
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-3.5 rounded-xl border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 transition-colors flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0">
                      <MicIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-ink-900">
                        Unlimited Bilingual Urdu/English Shifa AI
                      </h4>
                      <p className="text-xs text-content-muted mt-1 leading-relaxed">
                        Hands-free voice co-pilot in fluent Urdu (اردو) and English. Explains side effects, food interactions, and lab results conversationally.
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-3.5 rounded-xl border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 transition-colors flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center justify-center shrink-0">
                      <FileTextIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-ink-900">
                        1-Click Doctor Consultation Brief PDF
                      </h4>
                      <p className="text-xs text-content-muted mt-1 leading-relaxed">
                        Export an executive clinical summary with adherence percentages, abnormal vitals, and medication history ready for clinic visits.
                      </p>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="p-3.5 rounded-xl border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 transition-colors flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
                      <UsersIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-ink-900">
                        Unlimited Family Profiles & Cloud Sync
                      </h4>
                      <p className="text-xs text-content-muted mt-1 leading-relaxed">
                        Manage parents, in-laws, spouse, and children with isolated medical records and automatic cross-device cloud synchronization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER COMPARISON: FREE VS FAMILY PASS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-2.5">
                  Plan Comparison
                </h3>
                <div className="border border-line rounded-xl overflow-hidden bg-surface">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-hover/80 text-content border-b border-line">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Capability</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-28 text-content-muted">Free Core</th>
                        <th className="py-2.5 px-3 font-bold text-center w-36 bg-teal-500/10 text-teal-800 dark:text-teal-200">
                          Family Pass
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-ink-900">Family Profiles</td>
                        <td className="py-2.5 px-3 text-center text-content-muted">Up to 2</td>
                        <td className="py-2.5 px-3 text-center font-bold bg-teal-500/5 text-teal-700 dark:text-teal-300">
                          Unlimited
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-ink-900">Caregiver Missed-Dose Alerts</td>
                        <td className="py-2.5 px-3 text-center text-content-muted">Browser Push Only</td>
                        <td className="py-2.5 px-3 text-center font-bold bg-teal-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircleIcon size={14} /> Instant WhatsApp
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-ink-900">Bilingual Shifa AI Voice Co-Pilot</td>
                        <td className="py-2.5 px-3 text-center text-content-muted">3 daily text queries</td>
                        <td className="py-2.5 px-3 text-center font-bold bg-teal-500/5 text-teal-700 dark:text-teal-300">
                          Unlimited Urdu & English Voice
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-ink-900">Doctor Consultation Brief PDF</td>
                        <td className="py-2.5 px-3 text-center text-content-muted">Raw JSON / CSV export</td>
                        <td className="py-2.5 px-3 text-center font-bold bg-teal-500/5 text-teal-700 dark:text-teal-300">
                          1-Click Clinical PDF
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-ink-900">Cross-Device Realtime Cloud Sync</td>
                        <td className="py-2.5 px-3 text-center text-content-muted">Single Device Offline</td>
                        <td className="py-2.5 px-3 text-center font-bold bg-teal-500/5 text-teal-700 dark:text-teal-300">
                          Included
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line">
                <div className="flex items-center gap-2 text-xs text-content-muted">
                  <ShieldIcon size={15} className="text-teal-600 dark:text-teal-400" />
                  <span>30-day money-back guarantee • Cancel anytime</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {isSubscribed ? (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleCancelSubscription}
                      className="w-full sm:w-auto text-red-600 hover:text-red-700"
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleStartActivation}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                    >
                      <CheckIcon size={16} />
                      <span>Upgrade for {currentPrice}</span>
                      <ArrowRightIcon size={15} />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: CHECKOUT / PAYMENT FORM */}
          {step === 'checkout' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink-900">Selected Plan: Curewell Family Pass</h4>
                  <p className="text-xs text-content-muted mt-0.5">
                    {billingPeriod === 'annual' ? 'Annual Billing (Save 20%)' : 'Monthly Flexible Subscription'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-teal-800 dark:text-teal-200">{currentPrice}</span>
                  <span className="block text-[10px] text-content-muted">
                    {billingPeriod === 'annual' ? 'billed once / year' : '/ month'}
                  </span>
                </div>
              </div>

              <div>
                <p className="block text-xs font-bold uppercase tracking-wider text-content-muted mb-2.5">
                  Select Payment Method
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('easypaisa')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'easypaisa'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold ring-1 ring-emerald-500'
                        : 'border-line bg-surface hover:bg-surface-hover text-content'
                    }`}
                  >
                    <span className="text-xs font-black">Easypaisa</span>
                    <span className="text-[10px] text-content-muted">Mobile Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'jazzcash'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold ring-1 ring-amber-500'
                        : 'border-line bg-surface hover:bg-surface-hover text-content'
                    }`}
                  >
                    <span className="text-xs font-black">JazzCash</span>
                    <span className="text-[10px] text-content-muted">Mobile Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'border-teal-500 bg-teal-500/15 text-teal-800 dark:text-teal-200 font-bold ring-1 ring-teal-500'
                        : 'border-line bg-surface hover:bg-surface-hover text-content'
                    }`}
                  >
                    <span className="text-xs font-black">Card / Visa</span>
                    <span className="text-[10px] text-content-muted">Debit or Credit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('raast')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'raast'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-800 dark:text-blue-200 font-bold ring-1 ring-blue-500'
                        : 'border-line bg-surface hover:bg-surface-hover text-content'
                    }`}
                  >
                    <span className="text-xs font-black">Raast Instant</span>
                    <span className="text-[10px] text-content-muted">SBP Instant Pay</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Detail Fields */}
              {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash' || paymentMethod === 'raast') && (
                <div className="space-y-1.5">
                  <label htmlFor="checkout-mobile-number" className="block text-xs font-bold text-ink-900">
                    {paymentMethod === 'raast' ? 'Raast ID / Registered Mobile' : `${paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} Mobile Number`}
                  </label>
                  <input
                    id="checkout-mobile-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="03001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-content-muted">
                    You will receive an instant approval push on your mobile app.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="checkout-card-number" className="block text-xs font-bold text-ink-900 mb-1">
                      Card Number
                    </label>
                    <input
                      id="checkout-card-number"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="checkout-expiry" className="block text-xs font-bold text-ink-900 mb-1">
                        Expiry Date
                      </label>
                      <input
                        id="checkout-expiry"
                        type="text"
                        placeholder="MM / YY"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-cvv" className="block text-xs font-bold text-ink-900 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        id="checkout-cvv"
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-surface-hover text-xs text-content-muted flex items-center gap-2">
                <ShieldIcon size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Simulated Secure 256-bit Sandbox Gateway (Testing Activation Mode).</span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-line">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setStep('showcase')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmPayment}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 flex items-center gap-2"
                >
                  <ZapIcon size={16} />
                  <span>Activate Family Pass Now</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-600 animate-spin" />
              <div>
                <h4 className="text-base font-bold text-ink-900">Activating Curewell Family Pass</h4>
                <p className="text-xs text-content-muted mt-1 max-w-sm">
                  Connecting to encrypted Caregiver Network and enabling WhatsApp instant alerts...
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <CheckCircleIcon size={36} />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  Pass Activated Successfully
                </span>
                <h4 className="text-xl font-black text-ink-900 mt-2">
                  Welcome to Curewell Family Pass!
                </h4>
                <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-md mx-auto">
                  Your account is upgraded. Instant WhatsApp missed-dose alerts, Shifa AI bilingual voice, and doctor PDF briefs are now unlocked for all family members.
                </p>
              </div>

              <div className="w-full max-w-md p-3.5 rounded-xl bg-surface-hover/80 border border-line text-left space-y-2">
                <div className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                  <StarIcon size={14} className="text-amber-500" /> Next Recommended Steps:
                </div>
                <ul className="text-xs text-content-muted space-y-1 list-disc list-inside">
                  <li>Configure your Caregiver WhatsApp number in Settings.</li>
                  <li>Try voice questions in Urdu with Shifa AI.</li>
                  <li>Export a doctor consultation brief before your next clinic appointment.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Done & Return to App
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
