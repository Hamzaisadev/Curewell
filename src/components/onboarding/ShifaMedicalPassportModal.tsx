import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { profilesRepo } from '../../lib/db';
import {
  MIN_HEIGHT_CM,
  MAX_HEIGHT_CM,
  MIN_WEIGHT_KG,
  MAX_WEIGHT_KG,
  sanitizeHeightCm,
  sanitizeWeightKg,
} from '../../lib/db/profiles';
import {
  ShieldIcon, CheckCircleIcon, MessageSquareIcon,
  HeartPulseIcon,
  AlertTriangleIcon,
  CheckIcon,
  CapsuleIcon,
  XIcon,
  ChevronRightIcon,
  PhoneIcon,
  UserIcon,
} from '../ui/icons';

export interface ShifaMedicalPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const COMMON_CONDITIONS = [
  { id: 'Type 2 Diabetes', label: 'Type 2 Diabetes', icon: '🩸', tip: 'I will watch for sugar-spiking medications.' },
  { id: 'Hypertension', label: 'High Blood Pressure', icon: '💓', tip: 'I will watch for NSAIDs & decongestant BP spikes.' },
  { id: 'Asthma', label: 'Asthma', icon: '🫁', tip: 'I will shield you against non-selective beta-blockers.' },
  { id: 'Hypothyroidism', label: 'Hypothyroidism', icon: '🦋', tip: 'I will track thyroid hormone timing vs breakfast.' },
  { id: 'Dyslipidemia', label: 'High Cholesterol', icon: '🔬', tip: 'I will correlate your lipid panels and statin doses.' },
  { id: 'CAD', label: 'Heart Disease (CAD)', icon: '🫀', tip: 'I will keep strict alerts for cardiac interactions.' },
  { id: 'GERD', label: 'Acid Reflux / GERD', icon: '🔥', tip: 'I will flag stomach-irritating meds like NSAIDs.' },
  { id: 'CKD', label: 'Kidney Disease (CKD)', icon: '🌊', tip: 'I will monitor renal dosing and eGFR safety.' },
  { id: 'Migraines', label: 'Migraines', icon: '🧠', tip: 'I will help track migraine aura triggers.' },
  { id: 'PCOS', label: 'PCOS', icon: '🌸', tip: 'I will keep an eye on hormonal and metabolic balance.' },
];

const COMMON_ALLERGIES = [
  { id: 'Penicillin', label: 'Penicillin / Amoxicillin', tip: 'High alert! I will block all beta-lactam antibiotics.' },
  { id: 'Sulfa Drugs', label: 'Sulfa Antibiotics (Bactrim)', tip: 'Critical! Flagging sulfonamide antimicrobials.' },
  { id: 'Aspirin / NSAIDs', label: 'Aspirin & Ibuprofen (NSAIDs)', tip: 'Crucial! Flagging NSAID cross-reactivity & ulcers.' },
  { id: 'Codeine / Opioids', label: 'Codeine & Opioids', tip: 'Safety lock on opioid analgesics and cough syrups.' },
  { id: 'Latex', label: 'Latex', tip: 'Noted for clinical examinations & surgical settings.' },
  { id: 'Peanuts / Tree Nuts', label: 'Peanuts & Tree Nuts', tip: 'Severe anaphylaxis flag added to emergency dossier.' },
  { id: 'Shellfish', label: 'Shellfish / Iodine', tip: 'Noted for dietary & radiological contrast safety.' },
];

export function validateHeightCmInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    return `Enter a valid number between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm.`;
  }
  if (num < MIN_HEIGHT_CM || num > MAX_HEIGHT_CM) {
    return `Height must be between ${MIN_HEIGHT_CM} cm and ${MAX_HEIGHT_CM} cm.`;
  }
  return null;
}

export function validateWeightKgInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    return `Enter a valid number between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg.`;
  }
  if (num < MIN_WEIGHT_KG || num > MAX_WEIGHT_KG) {
    return `Weight must be between ${MIN_WEIGHT_KG} kg and ${MAX_WEIGHT_KG} kg.`;
  }
  return null;
}

export function validateDateOfBirthInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const dob = new Date(trimmed);
  if (Number.isNaN(dob.getTime())) {
    return 'Enter a valid date of birth.';
  }
  const todayIso = new Date().toISOString().split('T')[0]!;
  if (trimmed > todayIso) {
    return 'Date of birth cannot be in the future.';
  }
  if (trimmed < '1900-01-01') {
    return 'Date of birth must be in 1900 or later.';
  }
  return null;
}

export function validatePhoneInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^[+\d\s\-()]+$/.test(trimmed)) {
    return 'Phone number contains invalid characters.';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return 'Enter a valid phone number (7–15 digits).';
  }
  return null;
}

export function ShifaMedicalPassportModal({
  isOpen,
  onClose,
  onCompleted,
}: ShifaMedicalPassportModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initialHeight = sanitizeHeightCm(profile?.height_cm);
  const initialWeight = sanitizeWeightKg(profile?.weight_kg);

  // Form State
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'undisclosed'>(
    profile?.sex || (user?.user_metadata?.sex as 'male' | 'female' | 'other' | 'undisclosed') || 'undisclosed'
  );
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || user?.user_metadata?.date_of_birth || '');
  const [bloodGroup, setBloodGroup] = useState<string>(profile?.blood_group || 'unknown');
  const [heightCm, setHeightCm] = useState<string>(initialHeight !== null ? String(initialHeight) : '');
  const [weightKg, setWeightKg] = useState<string>(initialWeight !== null ? String(initialWeight) : '');

  // Conditions
  const [selectedConditions, setSelectedConditions] = useState<string[]>(() => {
    if (!profile?.chronic_conditions) return [];
    if (Array.isArray(profile.chronic_conditions)) {
      return (profile.chronic_conditions as string[]).map((s) => String(s).trim()).filter(Boolean);
    }
    return String(profile.chronic_conditions).split(',').map((s) => s.trim()).filter(Boolean);
  });
  const [customCondition, setCustomCondition] = useState('');
  const [isHealthyNoConditions, setIsHealthyNoConditions] = useState(false);

  // Allergies
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(() => {
    if (!profile?.allergies) return [];
    if (Array.isArray(profile.allergies)) {
      return (profile.allergies as string[]).map((s) => String(s).trim()).filter(Boolean);
    }
    return String(profile.allergies).split(',').map((s) => s.trim()).filter(Boolean);
  });
  const [customAllergy, setCustomAllergy] = useState('');
  const [isNKDA, setIsNKDA] = useState(false); // No Known Drug Allergies

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(profile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergency_contact_phone || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Family / Caregiver');

  useEffect(() => {
    if (!profile || !isOpen) return;
    setFullName(profile.full_name || user?.user_metadata?.full_name || '');
    setSex(profile.sex || (user?.user_metadata?.sex as 'male' | 'female' | 'other' | 'undisclosed') || 'undisclosed');
    setDateOfBirth(profile.date_of_birth || user?.user_metadata?.date_of_birth || '');
    setBloodGroup(profile.blood_group || 'unknown');
    const safeH = sanitizeHeightCm(profile.height_cm);
    const safeW = sanitizeWeightKg(profile.weight_kg);
    setHeightCm(safeH !== null ? String(safeH) : '');
    setWeightKg(safeW !== null ? String(safeW) : '');

    if (profile.chronic_conditions) {
      if (Array.isArray(profile.chronic_conditions)) {
        setSelectedConditions((profile.chronic_conditions as string[]).map((s) => String(s).trim()).filter(Boolean));
      } else {
        setSelectedConditions(String(profile.chronic_conditions).split(',').map((s) => s.trim()).filter(Boolean));
      }
    }

    if (profile.allergies) {
      if (Array.isArray(profile.allergies)) {
        setSelectedAllergies((profile.allergies as string[]).map((s) => String(s).trim()).filter(Boolean));
      } else {
        setSelectedAllergies(String(profile.allergies).split(',').map((s) => s.trim()).filter(Boolean));
      }
    }

    if (profile.emergency_contact_name) {
      const match = profile.emergency_contact_name.match(/^(.*?)\s*\((.*?)\)$/);
      if (match && match[1] && match[2]) {
        setEmergencyName(match[1].trim());
        setEmergencyRelationship(match[2].trim());
      } else {
        setEmergencyName(profile.emergency_contact_name);
      }
    }
    if (profile.emergency_contact_phone) setEmergencyPhone(profile.emergency_contact_phone);
  }, [
    profile,
    isOpen,
    user?.id,
    user?.user_metadata?.full_name,
    user?.user_metadata?.sex,
    user?.user_metadata?.date_of_birth,
  ]);

  // Interactive Live Shifa Bubble
  const [shifaSpeech, setShifaSpeech] = useState<string>(
    "Salam & Welcome! I'm Shifa, your clinical co-pilot. Let's set up your Health Profile so I can keep you safe!"
  );

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0]!, []);

  // Validation errors
  const heightError = useMemo(() => validateHeightCmInput(heightCm), [heightCm]);
  const weightError = useMemo(() => validateWeightKgInput(weightKg), [weightKg]);
  const dobError = useMemo(() => validateDateOfBirthInput(dateOfBirth), [dateOfBirth]);
  const phoneError = useMemo(() => validatePhoneInput(emergencyPhone), [emergencyPhone]);

  // Calculated BMI (only when both height and weight pass clinical validation)
  const bmiInfo = useMemo(() => {
    if (heightError || weightError) return null;
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h < MIN_HEIGHT_CM || h > MAX_HEIGHT_CM || w < MIN_WEIGHT_KG || w > MAX_WEIGHT_KG) {
      return null;
    }
    const heightInMeters = h / 100;
    const bmi = +(w / (heightInMeters * heightInMeters)).toFixed(1);
    let category = 'Healthy Weight';
    let color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      color = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    } else if (bmi >= 30) {
      category = 'Obese Range';
      color = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
    return { bmi, category, color };
  }, [heightCm, weightKg, heightError, weightError]);

  // Calculate Age (only when DOB is valid and not in the future)
  const calculatedAge = useMemo(() => {
    if (!dateOfBirth || dobError) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dateOfBirth, dobError]);

  if (!isOpen) return null;

  const blockInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleToggleCondition = (cond: string, tip?: string) => {
    setIsHealthyNoConditions(false);
    setSelectedConditions((prev) => {
      const exists = prev.includes(cond);
      if (exists) {
        setShifaSpeech(`Removed ${cond}. Looking clean!`);
        return prev.filter((c) => c !== cond);
      } else {
        setShifaSpeech(tip || `Logged ${cond}! I'll cross-check this against all your active prescriptions.`);
        return [...prev, cond];
      }
    });
  };

  const handleAddCustomCondition = () => {
    const trimmed = customCondition.trim();
    if (!trimmed) return;
    if (!selectedConditions.includes(trimmed)) {
      setSelectedConditions((prev) => [...prev, trimmed]);
      setShifaSpeech(`Got it! I added "${trimmed}" to your health profile.`);
    }
    setCustomCondition('');
    setIsHealthyNoConditions(false);
  };

  const handleToggleHealthy = () => {
    if (!isHealthyNoConditions) {
      setIsHealthyNoConditions(true);
      setSelectedConditions([]);
      setShifaSpeech('No chronic conditions specified. Baseline recorded. 🌟');
    } else {
      setIsHealthyNoConditions(false);
    }
  };

  const handleToggleAllergy = (allergy: string, tip?: string) => {
    setIsNKDA(false);
    setSelectedAllergies((prev) => {
      const exists = prev.includes(allergy);
      if (exists) {
        setShifaSpeech(`Removed ${allergy}.`);
        return prev.filter((a) => a !== allergy);
      } else {
        setShifaSpeech(tip || `Critical alert registered for ${allergy}! I'll guard every prescription against it.`);
        return [...prev, allergy];
      }
    });
  };

  const handleAddCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (!trimmed) return;
    if (!selectedAllergies.includes(trimmed)) {
      setSelectedAllergies((prev) => [...prev, trimmed]);
      setShifaSpeech(`Shield locked! "${trimmed}" is registered in your Drug Safety Sentinel.`);
    }
    setCustomAllergy('');
    setIsNKDA(false);
  };

  const handleToggleNKDA = () => {
    if (!isNKDA) {
      setIsNKDA(true);
      setSelectedAllergies([]);
      setShifaSpeech('Marked as No Known Drug Allergies (NKDA). Safety baseline established.');
    } else {
      setIsNKDA(false);
    }
  };

  const handleSaveProgress = async (completed: boolean) => {
    const targetProfileId = profile?.id || user?.id;
    const targetUserId = user?.id || profile?.user_id || targetProfileId;
    if (!targetProfileId) return;

    if (!completed) {
      sessionStorage.setItem('curewell_onboarding_dismissed_' + targetProfileId, 'true');
      localStorage.setItem('curewell_onboarding_completed_' + targetProfileId, 'dismissed');
      onClose();
      return;
    }
    if (dobError || heightError || weightError) {
      setStep(1);
      setShifaSpeech(dobError || heightError || weightError || 'Please check your biological measurements.');
      return;
    }
    if (phoneError) {
      setStep(4);
      setShifaSpeech(phoneError);
      return;
    }

    setSaveError(null);
    setIsSubmitting(true);

    try {
      const conditionsString = isHealthyNoConditions
        ? 'None (Healthy)'
        : selectedConditions.join(', ');

      const allergiesString = isNKDA
        ? 'No Known Drug Allergies (NKDA)'
        : selectedAllergies.join(', ');

      const parsedHeight = !heightError && heightCm.trim() ? sanitizeHeightCm(parseFloat(heightCm)) : null;
      const parsedWeight = !weightError && weightKg.trim() ? sanitizeWeightKg(parseFloat(weightKg)) : null;
      const validDob = !dobError && dateOfBirth ? dateOfBirth : null;
      const validPhone = !phoneError && emergencyPhone.trim() ? emergencyPhone.trim() : null;

      const trimmedContactName = emergencyName.trim();
      const formattedEmergencyName = trimmedContactName
        ? emergencyRelationship && emergencyRelationship !== 'Other' && !trimmedContactName.includes('(')
          ? `${trimmedContactName} (${emergencyRelationship})`
          : trimmedContactName
        : null;

      const updates = {
        user_id: targetUserId,
        full_name: fullName.trim() || profile?.full_name || 'Patient',
        sex: sex,
        date_of_birth: validDob,
        blood_group: (bloodGroup as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown') || 'unknown',
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        chronic_conditions: conditionsString || null,
        allergies: allergiesString || null,
        emergency_contact_name: formattedEmergencyName,
        emergency_contact_phone: validPhone,
        onboarding_completed: true,
      };

      await profilesRepo.updateProfile(targetProfileId, updates);
      localStorage.setItem(`curewell_onboarding_completed_${targetProfileId}`, 'true');
      await refreshProfile();

      setStep(5);
      setShifaSpeech("Your Health Profile is saved and active! Let's take good care of you.");
    } catch (err) {
      console.error('Failed to update health profile:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save health profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (dobError || heightError || weightError) {
        setShifaSpeech(
          dobError ||
            heightError ||
            weightError ||
            'Please fix the highlighted biological baseline fields before continuing.'
        );
        return;
      }
      setStep(2);
      setShifaSpeech("Great start! Now, are there any chronic health conditions we are managing together?");
    } else if (step === 2) {
      setStep(3);
      setShifaSpeech("Crucial checkpoint: Any allergies to medicines or foods? I'll build a hard shield around these.");
    } else if (step === 3) {
      setStep(4);
      setShifaSpeech("Almost there! In case of an emergency, who should first responders or your doctor call?");
    } else if (step === 4) {
      if (phoneError) {
        setShifaSpeech(phoneError);
        return;
      }
      handleSaveProgress(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-surface border-0 sm:border border-line rounded-none sm:rounded-3xl shadow-2xl overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shifa-onboarding-title"
      >
        {/* ── Top Radiant Header: Shifa's Interactive Persona ──────── */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-line bg-gradient-to-r from-teal-500/10 via-brand-500/5 to-emerald-500/10 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Shifa Avatar & Speech Anchor */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-teal-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <ShieldIcon size={24} />
                  </div>
                </div>
                {/* Active Presence Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface animate-ping" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 id="shifa-onboarding-title" className="text-base sm:text-lg font-bold text-content tracking-tight">
                    Complete Your Health Profile
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    <ShieldIcon size={10} /> Health Profile
                  </span>
                </div>
                <p className="text-xs text-content-muted">
                  Personalized safety &bull; Zero paperwork &bull; No fillers
                </p>
              </div>
            </div>

            {/* Close / Skip for later button */}
            {step < 5 && (
              <button
                type="button"
                onClick={() => handleSaveProgress(false)}
                className="text-xs font-semibold text-content-muted hover:text-content px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken border border-transparent hover:border-line transition-all cursor-pointer"
                title="I will finish this later"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Shifa's Dynamic Speech Bubble */}
          <div className="mt-3.5 p-3 rounded-2xl bg-surface/80 backdrop-blur-sm border border-teal-500/20 text-xs sm:text-sm text-content flex items-start gap-2.5 shadow-xs">
            <span className="text-base shrink-0 select-none">💬</span>
            <div className="flex-1 font-medium leading-relaxed text-teal-900 dark:text-teal-100">
              {shifaSpeech}
            </div>
          </div>

          {/* Progress Indicator */}
          {step < 5 && (
            <div className="mt-3.5 flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= step ? 'bg-teal-500' : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 tabular-nums shrink-0">
                Step {step} of 4
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable Form Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
              <span className="flex items-center gap-2">
                <AlertTriangleIcon size={14} className="shrink-0 text-rose-500" />
                <span>{saveError}</span>
              </span>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-rose-700 dark:text-rose-300 hover:opacity-75 font-bold cursor-pointer"
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Biological Baseline ───────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-bold text-content uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                    <UserIcon size={14} /> 1. Biological Blueprint
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Essential for age-adjusted biomarker ranges and accurate drug dosages.
                  </p>
                </div>

                {/* Name & Sex */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shifa-full-name" className="block text-xs font-semibold text-content mb-1">
                      Full / Preferred Name
                    </label>
                    <input
                      id="shifa-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Khan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-raised text-sm text-content focus:outline-2 focus:outline-teal-500 transition-all"
                    />
                  </div>

                  <div>
                    <div className="block text-xs font-semibold text-content mb-1">
                      Biological Sex (for lab reference ranges)
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['male', 'female', 'other', 'undisclosed'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSex(s);
                            setShifaSpeech(`Biological sex set to ${s}. This calibrates hemoglobin and eGFR reference ranges.`);
                          }}
                          className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                            sex === s
                              ? 'bg-teal-500 text-white border-teal-600 shadow-xs'
                              : 'bg-surface-raised border-line text-content-muted hover:text-content hover:bg-surface-sunken'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date of Birth & Blood Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="shifa-dob" className="text-xs font-semibold text-content">Date of Birth</label>
                      {calculatedAge !== null && (
                        <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          {calculatedAge} years old
                        </span>
                      )}
                    </div>
                    <input
                      id="shifa-dob"
                      type="date"
                      min="1900-01-01"
                      max={todayIso}
                      value={dateOfBirth}
                      aria-invalid={Boolean(dobError)}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface-raised text-sm text-content focus:outline-2 transition-all ${
                        dobError
                          ? 'border-rose-500 focus:outline-rose-500'
                          : 'border-line focus:outline-teal-500'
                      }`}
                    />
                    {dobError && (
                      <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        {dobError}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="block text-xs font-semibold text-content mb-1">
                      Blood Group
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => {
                            setBloodGroup(bg);
                            setShifaSpeech(
                              bg.includes('O-')
                                ? 'O Negative! The universal donor lifesaver.'
                                : bg.includes('AB+')
                                ? 'AB Positive! The universal plasma superhero.'
                                : `Blood group ${bg} locked into your emergency dossier!`
                            );
                          }}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            bloodGroup === bg
                              ? 'bg-rose-500 text-white border-rose-600 shadow-xs scale-102'
                              : 'bg-surface-raised border-line text-content-muted hover:text-content hover:bg-surface-sunken'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Height, Weight & Realtime BMI */}
                <div className="p-4 rounded-2xl bg-surface-sunken border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-content flex items-center gap-1.5">
                      <HeartPulseIcon size={14} className="text-teal-500" /> Height & Weight Telemetry
                    </span>
                    {bmiInfo && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${bmiInfo.color}`}>
                        <span>BMI: {bmiInfo.bmi}</span>
                        <span>&bull;</span>
                        <span>{bmiInfo.category}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="shifa-height" className="block text-[11px] font-semibold text-content-muted mb-1">
                        Height (cm) <span className="font-normal text-content-subtle">({MIN_HEIGHT_CM}–{MAX_HEIGHT_CM})</span>
                      </label>
                      <input
                        id="shifa-height"
                        type="number"
                        inputMode="decimal"
                        min={MIN_HEIGHT_CM}
                        max={MAX_HEIGHT_CM}
                        step="0.1"
                        placeholder="e.g. 175"
                        value={heightCm}
                        aria-invalid={Boolean(heightError)}
                        onKeyDown={blockInvalidNumberKeys}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border bg-surface text-sm text-content focus:outline-2 ${
                          heightError
                            ? 'border-rose-500 focus:outline-rose-500'
                            : 'border-line focus:outline-teal-500'
                        }`}
                      />
                      {heightError && (
                        <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          {heightError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="shifa-weight" className="block text-[11px] font-semibold text-content-muted mb-1">
                        Weight (kg) <span className="font-normal text-content-subtle">({MIN_WEIGHT_KG}–{MAX_WEIGHT_KG})</span>
                      </label>
                      <input
                        id="shifa-weight"
                        type="number"
                        inputMode="decimal"
                        min={MIN_WEIGHT_KG}
                        max={MAX_WEIGHT_KG}
                        step="0.1"
                        placeholder="e.g. 70"
                        value={weightKg}
                        aria-invalid={Boolean(weightError)}
                        onKeyDown={blockInvalidNumberKeys}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border bg-surface text-sm text-content focus:outline-2 ${
                          weightError
                            ? 'border-rose-500 focus:outline-rose-500'
                            : 'border-line focus:outline-teal-500'
                        }`}
                      />
                      {weightError && (
                        <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          {weightError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Chronic Health Conditions ─────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-bold text-content uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                    <CapsuleIcon size={14} /> 2. Chronic Health Management
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Shifa correlates your active conditions to prevent dangerous prescription contraindications.
                  </p>
                </div>

                {/* 1-Tap "I am completely healthy" option */}
                <button
                  type="button"
                  onClick={handleToggleHealthy}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isHealthyNoConditions
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                      : 'bg-surface-raised border-line text-content hover:bg-surface-sunken'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🌟</span>
                    <div>
                      <div className="text-xs font-bold">I have no chronic medical conditions</div>
                      <div className="text-[11px] text-content-muted">Focus on preventive wellness and vitals tracking</div>
                    </div>
                  </div>
                  {isHealthyNoConditions && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckIcon size={14} />
                    </div>
                  )}
                </button>

                {!isHealthyNoConditions && (
                  <>
                    <div className="space-y-2">
                      <div className="block text-xs font-semibold text-content">
                        Tap any that apply to you:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {COMMON_CONDITIONS.map((cond) => {
                          const isSelected = selectedConditions.includes(cond.id);
                          return (
                            <button
                              key={cond.id}
                              type="button"
                              onClick={() => handleToggleCondition(cond.id, cond.tip)}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-800 dark:text-teal-200 shadow-2xs'
                                  : 'bg-surface-raised border-line text-content hover:bg-surface-sunken'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className="text-sm select-none">{cond.icon}</span>
                                <span className="truncate">{cond.label}</span>
                              </span>
                              {isSelected ? (
                                <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 ml-1">
                                  <CheckIcon size={12} />
                                </span>
                              ) : (
                                <span className="text-content-subtle text-xs">+</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Condition Add */}
                    <div className="pt-2">
                      <label htmlFor="shifa-custom-condition" className="block text-xs font-semibold text-content mb-1">
                        Have another condition not listed above?
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="shifa-custom-condition"
                          type="text"
                          value={customCondition}
                          onChange={(e) => setCustomCondition(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCondition())}
                          placeholder="e.g. Celiac Disease, Glaucoma"
                          className="flex-1 px-3 py-2 rounded-xl border border-line bg-surface text-xs text-content focus:outline-2 focus:outline-teal-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCondition}
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Selected Tags Preview */}
                    {selectedConditions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedConditions.map((cond) => (
                          <span
                            key={cond}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
                          >
                            <span>{cond}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleCondition(cond)}
                              className="hover:text-rose-500 cursor-pointer"
                            >
                              <XIcon size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: Critical Drug Allergies ───────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-bold text-content uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangleIcon size={14} className="text-rose-500" /> 3. Drug & Food Allergies Sentinel
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Shifa will halt prescriptions and sound alarms if a contraindicated medication is detected.
                  </p>
                </div>

                {/* 1-Tap "No Known Drug Allergies" */}
                <button
                  type="button"
                  onClick={handleToggleNKDA}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isNKDA
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                      : 'bg-surface-raised border-line text-content hover:bg-surface-sunken'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <div className="text-xs font-bold">No Known Drug Allergies (NKDA)</div>
                      <div className="text-[11px] text-content-muted">I do not experience adverse reactions to medications</div>
                    </div>
                  </div>
                  {isNKDA && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckIcon size={14} />
                    </div>
                  )}
                </button>

                {!isNKDA && (
                  <>
                    <div className="space-y-2">
                      <div className="block text-xs font-semibold text-content">
                        Common high-risk allergies:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {COMMON_ALLERGIES.map((allergy) => {
                          const isSelected = selectedAllergies.includes(allergy.id);
                          return (
                            <button
                              key={allergy.id}
                              type="button"
                              onClick={() => handleToggleAllergy(allergy.id, allergy.tip)}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200 shadow-2xs'
                                  : 'bg-surface-raised border-line text-content hover:bg-surface-sunken'
                              }`}
                            >
                              <span className="truncate">{allergy.label}</span>
                              {isSelected ? (
                                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 ml-1">
                                  <CheckIcon size={12} />
                                </span>
                              ) : (
                                <span className="text-content-subtle text-xs">+</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Allergy Add */}
                    <div className="pt-2">
                      <label htmlFor="shifa-custom-allergy" className="block text-xs font-semibold text-content mb-1">
                        Any other allergy (e.g. Ciprofloxacin, Eggs)?
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="shifa-custom-allergy"
                          type="text"
                          value={customAllergy}
                          onChange={(e) => setCustomAllergy(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAllergy())}
                          placeholder="e.g. Metronidazole, Contrast Dye"
                          className="flex-1 px-3 py-2 rounded-xl border border-line bg-surface text-xs text-content focus:outline-2 focus:outline-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomAllergy}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Selected Tags Preview */}
                    {selectedAllergies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedAllergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                          >
                            <span>{allergy}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleAllergy(allergy)}
                              className="hover:text-rose-900 cursor-pointer"
                            >
                              <XIcon size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Emergency Lifeline (ICE) ──────────────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-bold text-content uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                    <PhoneIcon size={14} /> 4. Emergency Lifeline (In Case of Emergency)
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    This contact is displayed on your Emergency Share Portal & Doctor Lock-Screen Card.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="shifa-emergency-name" className="block text-xs font-semibold text-content mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      id="shifa-emergency-name"
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Dr. Bilal / Fatima Khan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-raised text-sm text-content focus:outline-2 focus:outline-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="shifa-emergency-rel" className="block text-xs font-semibold text-content mb-1">
                        Relationship
                      </label>
                      <select
                        id="shifa-emergency-rel"
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-raised text-sm text-content focus:outline-2 focus:outline-teal-500"
                      >
                        <option value="Spouse">Spouse / Partner</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Doctor">Primary Care Physician</option>
                        <option value="Friend">Trusted Friend</option>
                        <option value="Other">Other Caregiver</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="shifa-emergency-phone" className="block text-xs font-semibold text-content mb-1">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        id="shifa-emergency-phone"
                        type="tel"
                        value={emergencyPhone}
                        aria-invalid={Boolean(phoneError)}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="e.g. +92 300 1234567"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface-raised text-sm text-content focus:outline-2 ${
                          phoneError
                            ? 'border-rose-500 focus:outline-rose-500'
                            : 'border-line focus:outline-teal-500'
                        }`}
                      />
                      {phoneError && (
                        <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-200 flex items-center gap-2.5">
                  <ShieldIcon size={16} className="shrink-0 text-teal-500" />
                  <span>
                    Your ICE contact is stored encrypted and only exposed via authorized Doctor Share PINs or emergency QR codes.
                  </span>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Celebration & Activated Passport ─────────── */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-5"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-teal-500/20">
                  <CheckCircleIcon size={40} />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-content">
                    Your Health Profile is Complete!
                  </h3>
                  <p className="text-xs sm:text-sm text-content-muted max-w-md mx-auto">
                    Shifa now has the clinical intelligence needed to guard your prescriptions, analyze lab results, and assist your doctors.
                  </p>
                </div>

                {/* Summary Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto text-left">
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line">
                    <div className="text-[10px] font-bold text-content-muted uppercase">Blood Type</div>
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                      {bloodGroup === 'unknown' ? 'Not specified' : bloodGroup}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-raised border border-line">
                    <div className="text-[10px] font-bold text-content-muted uppercase">Conditions</div>
                    <div className="text-sm font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                      {isHealthyNoConditions ? 'None (Healthy)' : `${selectedConditions.length} Tracked`}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-raised border border-line">
                    <div className="text-[10px] font-bold text-content-muted uppercase">Allergies</div>
                    <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                      {isNKDA ? 'NKDA' : `${selectedAllergies.length} Guarded`}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-raised border border-line">
                    <div className="text-[10px] font-bold text-content-muted uppercase">Emergency ICE</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      {emergencyName || 'Configured'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCompleted?.();
                    }}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    Go to Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/assistant');
                    }}
                    className="px-6 py-3 rounded-2xl bg-surface-raised hover:bg-surface-sunken border border-line text-content font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageSquareIcon size={16} className="text-teal-500" />
                    <span>Talk with Shifa</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sticky Action Footer ─────────────────────────────────── */}
        {step < 5 && (
          <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-line bg-surface flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-content-muted hover:text-content hover:bg-surface-sunken transition-all cursor-pointer"
              >
                &larr; Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveProgress(false)}
                disabled={isSubmitting}
                className="text-xs font-semibold text-content-muted hover:text-content transition-all cursor-pointer"
              >
                I&apos;ll do this later
              </button>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{step === 4 ? 'Save Health Profile' : 'Continue'}</span>
              <ChevronRightIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
