import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { PrescriptionIcon, CheckIcon, XIcon, PlusIcon } from '../ui/icons';
import { recordPrescription } from '../../domain/medicationRegimen';
import { parseFrequency } from '../../domain/frequency';
import { todayInAppTz } from '../../lib/time';
import { newId } from '../../lib/db/localStore';

/** Used when a row has no duration set, and shown in the UI as the same number. */
const DEFAULT_DURATION_DAYS = 5;

const CHRONIC_DRUG_KEYWORDS = [
  'metformin', 'glucophage', 'glimepiride', 'gliclazide', 'sitagliptin', 'vildagliptin', 'empagliflozin', 'dapagliflozin', 'insulin',
  'amlodipine', 'norvasc', 'lisinopril', 'zestril', 'ramipril', 'losartan', 'cozaar', 'valsartan', 'telmisartan',
  'bisoprolol', 'concor', 'atenolol', 'tenormin', 'carvedilol', 'metoprolol', 'spironolactone', 'furosemide', 'lasix',
  'atorvastatin', 'lipiget', 'rosuvastatin', 'simvastatin', 'ezetimibe',
  'levothyroxine', 'thyroxine', 'eltroxin',
  'clopidogrel', 'plavix', 'warfarin', 'coumadin', 'aspirin', 'disprin cv', 'lowplat',
];

export function isLikelyChronicMedicine(medName?: string | null): boolean {
  if (!medName) return false;
  const lower = medName.toLowerCase();
  return CHRONIC_DRUG_KEYWORDS.some((kw) => lower.includes(kw));
}

export interface ExtractedMedItem {
  medicine_name: string;
  strength?: string;
  /**
   * Frequency exactly as written (e.g. "1-0-1", "BD", "PRN"). Named `_raw`
   * because it is free text the app parses — not the `frequency_code` enum.
   */
  frequency_raw?: string;
  duration_days?: number;
  /** null = the prescription did not state a meal relation. */
  with_food?: boolean | null;
  instructions?: string;
  is_ongoing?: boolean;
}

interface EditablePrescriptionWidgetProps {
  initialMedicines: ExtractedMedItem[];
  profileId: string;
  /** Owning auth user. Distinct from profileId so family profiles save correctly. */
  userId: string;
  onAddedSuccess?: (count: number) => void;
}

/** A draft row: the extracted item plus a stable key for React. */
type DraftRow = ExtractedMedItem & { rowId: string };

export function EditablePrescriptionWidget({
  initialMedicines,
  profileId,
  userId,
  onAddedSuccess,
}: EditablePrescriptionWidgetProps) {
  // Rows carry a stable id so React keys survive reordering and removal; with
  // `key={idx}` an edit could be applied to the wrong row after a delete.
  const [items, setItems] = useState<DraftRow[]>(() =>
    initialMedicines.map((m) => {
      const isChronic = m.is_ongoing ?? isLikelyChronicMedicine(m.medicine_name);
      return {
        ...m,
        rowId: newId(),
        is_ongoing: isChronic,
        duration_days: m.duration_days ?? (isChronic ? 30 : DEFAULT_DURATION_DAYS),
      };
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFieldChange = (rowId: string, field: keyof ExtractedMedItem, val: unknown) => {
    setItems((prev) =>
      prev.map((row) => (row.rowId === rowId ? ({ ...row, [field]: val } as DraftRow) : row))
    );
  };

  const handleRemoveRow = (rowId: string) => {
    setItems((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        rowId: newId(),
        medicine_name: '',
        strength: '',
        frequency_raw: '',
        duration_days: DEFAULT_DURATION_DAYS,
        with_food: true,
        is_ongoing: false,
      },
    ]);
  };

  const handleSaveToTimetable = async () => {
    if (items.length === 0 || isSaving || isSaved) return;

    setSaveError(null);
    const today = todayInAppTz();

    // Frequency is never guessed: an unreadable value would otherwise be saved
    // as once-daily, under-dosing a BD or TDS course.
    const unreadable = items.filter((item) => !parseFrequency(item.frequency_raw));
    if (unreadable.length > 0) {
      setSaveError(
        `Set a readable frequency (e.g. 1-0-1, BD, TDS, PRN) for: ${unreadable
          .map((i) => i.medicine_name || 'unnamed medicine')
          .join(', ')}.`
      );
      return;
    }

    const unnamed = items.some((item) => !item.medicine_name.trim());
    if (unnamed) {
      setSaveError('Every row needs a medicine name.');
      return;
    }

    setIsSaving(true);

    try {
      await recordPrescription({
        userId,
        profileId,
        scheduleStartDate: today,
        medicines: items.map((item) => ({
          medicine_name: item.medicine_name.trim(),
          strength: item.strength || null,
          frequency_raw: item.frequency_raw || null,
          duration_days: item.is_ongoing ? null : (Number(item.duration_days) || DEFAULT_DURATION_DAYS),
          with_food: item.with_food ?? null,
          instructions: item.instructions || null,
          is_ongoing: Boolean(item.is_ongoing),
        })),
      });

      setIsSaved(true);
      if (onAddedSuccess) {
        onAddedSuccess(items.length);
      }
    } catch (err) {
      console.error('Failed to add medicines to cabinet & timetable:', err);
      setSaveError(
        err instanceof Error
          ? `Could not save: ${err.message}`
          : 'Could not save these medicines. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="my-3 p-3.5 sm:p-4 bg-surface-raised border border-line-strong rounded-2xl shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-content font-bold text-xs flex items-center gap-1.5">
            <PrescriptionIcon size={16} className="text-accent shrink-0" /> Detected Prescribed Medicines
          </span>
          <Badge tone="ok" size="sm">{items.length} detected</Badge>
        </div>

        {isSaved ? (
          <span className="text-xs font-bold text-ok-text flex items-center gap-1">
            <CheckIcon size={14} className="text-ok-text" /> Added to Cabinet & Timetable
          </span>
        ) : (
          <span className="text-[11px] text-content-muted">Edit fields before adding to timetable</span>
        )}
      </div>

      {saveError && (
        <div className="rounded-lg border border-risk-border bg-risk-bg px-3 py-2 text-[11px] text-risk-text leading-relaxed">
          {saveError}
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[540px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line text-content-muted text-[11px]">
              <th className="py-1.5 font-semibold">Medicine</th>
              <th className="py-1.5 font-semibold">Strength</th>
              <th className="py-1.5 font-semibold">Dosage / Freq</th>
              <th className="py-1.5 font-semibold">Course / Days</th>
              <th className="py-1.5 font-semibold">Meal Relation</th>
              <th className="py-1.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((med) => (
              <tr key={med.rowId} className="hover:bg-surface-hover/50">
                <td className="py-1.5 pr-2">
                  <input
                    type="text"
                    disabled={isSaved}
                    value={med.medicine_name}
                    onChange={(e) => handleFieldChange(med.rowId, 'medicine_name', e.target.value)}
                    className="w-full h-8 px-2 bg-surface-sunken border border-line rounded-lg text-xs font-bold text-content focus:border-accent focus:outline-none disabled:bg-transparent disabled:border-transparent"
                  />
                </td>
                <td className="py-1.5 pr-2 w-20">
                  <input
                    type="text"
                    disabled={isSaved}
                    placeholder="e.g. 500mg"
                    value={med.strength || ''}
                    onChange={(e) => handleFieldChange(med.rowId, 'strength', e.target.value)}
                    className="w-full h-8 px-2 bg-surface-sunken border border-line rounded-lg text-xs text-content focus:border-accent focus:outline-none disabled:bg-transparent disabled:border-transparent"
                  />
                </td>
                <td className="py-1.5 pr-2 w-28">
                  <input
                    type="text"
                    disabled={isSaved}
                    placeholder="1-0-1 / BD"
                    value={med.frequency_raw}
                    onChange={(e) => handleFieldChange(med.rowId, 'frequency_raw', e.target.value)}
                    className="w-full h-8 px-2 bg-surface-sunken border border-line rounded-lg text-xs font-mono text-content focus:border-accent focus:outline-none disabled:bg-transparent disabled:border-transparent"
                  />
                </td>
                <td className="py-1.5 pr-2 w-32">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isSaved}
                      onClick={() => handleFieldChange(med.rowId, 'is_ongoing', !med.is_ongoing)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                        med.is_ongoing
                          ? 'bg-ok-fill text-content-onaccent shadow-2xs'
                          : 'bg-surface-sunken border border-line text-content-muted hover:text-content'
                      }`}
                      title={med.is_ongoing ? 'Ongoing chronic medication' : 'Click to mark as ongoing'}
                    >
                      {med.is_ongoing ? 'Ongoing' : 'Course'}
                    </button>
                    {!med.is_ongoing ? (
                      <input
                        type="number"
                        disabled={isSaved}
                        min="1"
                        max="365"
                        value={med.duration_days ?? DEFAULT_DURATION_DAYS}
                        onChange={(e) =>
                          handleFieldChange(
                            med.rowId,
                            'duration_days',
                            e.target.value === '' ? DEFAULT_DURATION_DAYS : parseInt(e.target.value, 10) || DEFAULT_DURATION_DAYS,
                          )
                        }
                        className="w-14 h-8 px-1 bg-surface-sunken border border-line rounded-lg text-xs text-center font-bold text-content focus:border-accent focus:outline-none disabled:bg-transparent disabled:border-transparent"
                        title="Days duration"
                      />
                    ) : (
                      <span className="text-[10px] text-content-subtle font-medium">Chronic</span>
                    )}
                  </div>
                </td>
                <td className="py-1.5 pr-2 w-36">
                  <Select
                    disabled={isSaved}
                    value={med.with_food === true ? 'after' : med.with_food === false ? 'before' : 'unknown'}
                    onValueChange={(val) =>
                      handleFieldChange(
                        med.rowId,
                        'with_food',
                        val === 'after' ? true : val === 'before' ? false : null,
                      )
                    }
                    className="h-8 text-xs font-semibold px-2"
                    options={[
                      { value: 'after', label: 'With Food' },
                      { value: 'before', label: 'Empty Stomach' },
                      { value: 'unknown', label: 'Not Specified' },
                    ]}
                  />
                </td>
                <td className="py-1.5 text-right">
                  {!isSaved && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(med.rowId)}
                      className="text-content-subtle hover:text-risk-text p-1 cursor-pointer"
                      title="Remove medicine"
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2">
        {!isSaved ? (
          <>
            <button
              type="button"
              onClick={handleAddRow}
              className="text-xs text-accent hover:underline font-bold cursor-pointer"
            >
              + Add another medicine
            </button>
            <Button
              variant="primary"
              size="sm"
              loading={isSaving}
              onClick={handleSaveToTimetable}
              className="font-bold text-xs shadow-xs w-full sm:w-auto"
              leftIcon={<PlusIcon size={14} />}
            >
              Add all to Medication Cabinet & Timetable
            </Button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-ok-text font-semibold">
              Added to your daily schedule & timetable.
            </span>
            <Link
              to="/medicines"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>View Today's Schedule</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
