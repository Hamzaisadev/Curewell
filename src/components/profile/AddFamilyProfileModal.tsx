import { useState, type FormEvent } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/Button';
import { XIcon, PlusIcon, ShieldIcon } from '../ui/icons';

interface AddFamilyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated?: (name: string, relationship: string) => void;
}

const COMMON_CONDITIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Heart Disease',
  'Asthma / Respiratory',
  'Kidney Disease',
  'Thyroid Disorder',
  'Arthritis',
];

export function AddFamilyProfileModal({
  isOpen,
  onClose,
  onProfileCreated,
}: AddFamilyProfileModalProps) {
  const { createFamilyProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<'parent' | 'child' | 'spouse' | 'other'>('parent');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('unknown');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCondition = (cond: string) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleAddCustomCondition = () => {
    if (!customCondition.trim()) return;
    if (!selectedConditions.includes(customCondition.trim())) {
      setSelectedConditions((prev) => [...prev, customCondition.trim()]);
    }
    setCustomCondition('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide a full name for this family member.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const conditionsStr = selectedConditions.join(', ');
      await createFamilyProfile({
        fullName: fullName.trim(),
        relationship,
        chronicConditions: conditionsStr || undefined,
        bloodGroup: bloodGroup !== 'unknown' ? (bloodGroup as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown') : undefined,
        dateOfBirth: dateOfBirth || undefined,
        allergies: allergies.trim() || undefined,
      });

      onProfileCreated?.(fullName.trim(), relationship);
      onClose();
    } catch (err) {
      console.error('Failed to create family profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create family profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-200"
    >
      <div className="w-full max-w-lg bg-surface-raised border border-line rounded-3xl p-6 sm:p-7 shadow-over max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-accent-subtle text-accent">
                <PlusIcon size={18} />
              </span>
              <h2 id="add-profile-title" className="text-base sm:text-lg font-bold text-content tracking-tight">
                Add Family Member
              </h2>
            </div>
            <p className="text-xs text-content-muted mt-1">
              Create an isolated health vault and medication schedule for your parent or dependent.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-content-subtle hover:text-content hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-risk-subtle border border-risk-line text-risk-text text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="family-full-name" className="block font-bold text-content">
              Full Name <span className="text-risk-text">*</span>
            </label>
            <input
              id="family-full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Muhammad Ali or Fatima Bibi"
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-line text-content text-sm placeholder:text-content-subtle focus:outline-2 focus:outline-accent"
            />
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <div className="block font-bold text-content">
              Relationship <span className="text-risk-text">*</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'parent' as const, label: 'Parent (Father/Mother)', icon: '👴/👵' },
                { value: 'spouse' as const, label: 'Spouse / Partner', icon: '💍' },
                { value: 'child' as const, label: 'Child (Son/Daughter)', icon: '🧒' },
                { value: 'other' as const, label: 'Other Relative', icon: '👥' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRelationship(r.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    relationship === r.value
                      ? 'border-accent bg-accent-subtle text-accent-onsubtle shadow-xs'
                      : 'border-line bg-surface text-content hover:bg-surface-hover'
                  }`}
                >
                  <span className="block text-sm mb-0.5">{r.icon}</span>
                  <span className="block font-bold text-[11px] leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chronic Conditions Quick Chips */}
          <div className="space-y-2">
            <div className="block font-bold text-content">
              Chronic Conditions / Key Health Concerns
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-content-onaccent shadow-xs'
                        : 'bg-surface-sunken border border-line text-content-muted hover:border-accent hover:text-content'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cond}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCondition();
                  }
                }}
                placeholder="Or type other condition and press Add..."
                className="flex-1 h-9 px-3 rounded-lg bg-surface border border-line text-content text-xs placeholder:text-content-subtle focus:outline-2 focus:outline-accent"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddCustomCondition}>
                Add
              </Button>
            </div>
          </div>

          {/* Optional Details Collapsible */}
          <details className="group pt-2 border-t border-line/60">
            <summary className="font-bold text-content-muted hover:text-content cursor-pointer text-xs select-none">
              ▸ Optional Details (Date of Birth, Blood Group, Allergies)
            </summary>
            <div className="pt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="family-dob" className="block text-content-muted text-[11px] font-semibold">
                    Date of Birth
                  </label>
                  <input
                    id="family-dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-line text-content text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="family-blood" className="block text-content-muted text-[11px] font-semibold">
                    Blood Group
                  </label>
                  <select
                    id="family-blood"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-line text-content text-xs"
                  >
                    <option value="unknown">Unknown / Not tested</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="family-allergies" className="block text-content-muted text-[11px] font-semibold">
                  Known Allergies
                </label>
                <input
                  id="family-allergies"
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-line text-content text-xs placeholder:text-content-subtle"
                />
              </div>
            </div>
          </details>

          {/* Privacy Note */}
          <div className="p-3 rounded-2xl bg-surface-sunken border border-line flex items-center gap-2.5 text-content-subtle text-[11px]">
            <ShieldIcon size={16} className="text-accent shrink-0" />
            <span>
              All medications, vitals, and lab reports added in this profile remain isolated under your caregiver login.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isSubmitting}>
              Create Family Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
