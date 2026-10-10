import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth/AuthContext';
import { medicinesRepo, visitsRepo, reportsRepo, profilesRepo } from '../../lib/db';
import { listGlucoseReadings, listBloodPressureReadings } from '../../lib/db/vitals';
import type { GlucoseReading, BloodPressureReading } from '../../domain/vitals';
import { generateDoctorQuestions, DoctorQuestion } from '../../domain/doctorQuestions';
import { generateWatermarkMetadata, WatermarkMetadata } from '../../lib/security/watermark';
import { exportElementToPdf } from '../../lib/export/pdfExport';
import { activeMedicines } from '../../domain/activeMedicines';
import { todayInAppTz } from '../../lib/time';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/Toast';
import {
  StethoscopeIcon,
  MedicineIcon,
  LabFlaskIcon,
  PrinterIcon,
  DownloadIcon,
  ShareIcon,
  CheckIcon,
  SparklesIcon,
  CopyIcon,
  ShieldIcon,
  PlusIcon,
  HeartPulseIcon,
} from '../../components/ui/icons';
import type { Tables } from '../../lib/supabase/types';

type CompanionTab = 'questions' | 'brief' | 'share';

export function DoctorVisitCompanionPage() {
  const { user, profile: authProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as CompanionTab) || 'questions';
  const [activeTab, setActiveTab] = useState<CompanionTab>(initialTab);

  const effectiveUserId = user?.id || authProfile?.user_id || '';
  const effectiveProfileId = authProfile?.id || effectiveUserId;
  const today = todayInAppTz();

  // Clinical data state
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [medicines, setMedicines] = useState<Tables<'medicines'>[]>([]);
  const [recentVisits, setRecentVisits] = useState<Tables<'visits'>[]>([]);
  const [recentReports, setRecentReports] = useState<Tables<'reports'>[]>([]);
  const [allFlatLabResults, setAllFlatLabResults] = useState<Tables<'report_results'>[]>([]);
  const [bpReadings, setBpReadings] = useState<BloodPressureReading[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [watermark, setWatermark] = useState<WatermarkMetadata | null>(null);

  // Interaction states
  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [anonymize, setAnonymize] = useState(false);
  const [specialistNotes, setSpecialistNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'ok' | 'risk'>('ok');
  const [copied, setCopied] = useState(false);

  const dossierRef = useRef<HTMLDivElement>(null);

  // Sync tab with URL
  const handleTabChange = (tab: CompanionTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    async function loadData() {
      if (!effectiveUserId) return;
      setIsLoading(true);
      try {
        const [p, meds, visits, reports, bps, glucoses] = await Promise.all([
          authProfile ? Promise.resolve(authProfile) : profilesRepo.getDefaultProfile(effectiveUserId),
          medicinesRepo.listMedicines(effectiveProfileId),
          visitsRepo.listVisits(effectiveProfileId),
          reportsRepo.listReports(effectiveProfileId),
          listBloodPressureReadings(effectiveProfileId),
          listGlucoseReadings(effectiveProfileId),
        ]);

        setProfile(p);
        setMedicines(meds);
        setRecentVisits(visits.slice(0, 5));
        setRecentReports(reports.slice(0, 5));
        setBpReadings(bps);
        setGlucoseReadings(glucoses);

        const flatResults: Tables<'report_results'>[] = [];
        await Promise.all(
          reports.slice(0, 5).map(async (r) => {
            const res = await reportsRepo.listResultsForReport(r.id);
            flatResults.push(...res);
          })
        );
        setAllFlatLabResults(flatResults);

        // Generate intelligent consultation questions
        const generated = generateDoctorQuestions({
          medicines: meds as unknown as Parameters<typeof generateDoctorQuestions>[0]['medicines'],
          labResults: flatResults as unknown as Parameters<typeof generateDoctorQuestions>[0]['labResults'],
          glucoseReadings: glucoses,
          bpReadings: bps,
          chronicConditions: p?.chronic_conditions || undefined,
        });
        setQuestions(generated);

        // Generate tamper-evident watermark hash for clinical exports
        const summaryPayload = JSON.stringify({
          patientId: effectiveProfileId,
          medsCount: meds.length,
          visitsCount: visits.length,
          reportsCount: reports.length,
          generatedAt: new Date().toISOString(),
        });
        const wm = await generateWatermarkMetadata(effectiveProfileId, summaryPayload);
        setWatermark(wm);
      } catch (err) {
        console.error('Failed to load doctor visit companion data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [authProfile, effectiveUserId, effectiveProfileId]);

  const currentlyTaking = useMemo(() => {
    return activeMedicines(medicines, today);
  }, [medicines, today]);

  const displayName = useMemo(() => {
    const rawName = profile?.full_name || 'Patient';
    if (!anonymize) return rawName;
    const parts = rawName.split(' ');
    if (parts.length > 1) {
      const lastInitial = parts[parts.length - 1]?.[0] ?? '';
      return `${parts[0]} ${lastInitial}. (Anonymized)`;
    }
    return `${rawName.slice(0, 3)}*** (Anonymized)`;
  }, [anonymize, profile?.full_name]);

  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.getTime();
  }, []);

  const avgBp = useMemo(() => {
    const recent = bpReadings.filter((b) => new Date(b.measured_at).getTime() >= sevenDaysAgo);
    if (recent.length === 0) return null;
    const sys = Math.round(recent.reduce((acc, curr) => acc + curr.systolic, 0) / recent.length);
    const dia = Math.round(recent.reduce((acc, curr) => acc + curr.diastolic, 0) / recent.length);
    return { sys, dia, count: recent.length };
  }, [bpReadings, sevenDaysAgo]);

  const avgGlucose = useMemo(() => {
    const recent = glucoseReadings.filter((g) => new Date(g.measured_at).getTime() >= sevenDaysAgo);
    if (recent.length === 0) return null;
    const avg = Math.round(recent.reduce((acc, curr) => acc + curr.value_mg_dl, 0) / recent.length);
    return { avg, count: recent.length };
  }, [glucoseReadings, sevenDaysAgo]);

  const toggleQuestionCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionText.trim()) return;

    const newQ: DoctorQuestion = {
      id: `custom-${Date.now()}`,
      category: 'general',
      categoryLabel: 'Patient Talking Point',
      priority: 'medium',
      question: customQuestionText.trim(),
      context: 'Added by patient for upcoming visit',
    };

    setQuestions((prev) => [newQ, ...prev]);
    setCustomQuestionText('');
  };

  const handleCopyQuestions = async () => {
    const text = [
      `🩺 Doctor Visit Consultation Checklist — ${displayName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      ...questions.map((q, idx) => {
        const isChecked = checkedIds.has(q.id);
        return `${idx + 1}. [${isChecked ? 'X' : ' '}] (${q.priority.toUpperCase()}) ${q.question}\n   Context: ${q.context}`;
      }),
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setToastTone('ok');
      setToastMessage('Checklist copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setToastTone('risk');
      setToastMessage('Could not copy to clipboard.');
    }
  };

  const handleExportPdf = async () => {
    if (!dossierRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const patientSlug = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = anonymize
        ? `Second_Opinion_Dossier_${patientSlug}_${today}.pdf`
        : `Doctor_Clinical_Brief_${patientSlug}_${today}.pdf`;

      await exportElementToPdf(dossierRef.current, { filename });
      setToastTone('ok');
      setToastMessage('PDF downloaded successfully.');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setToastTone('risk');
      setToastMessage('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 max-w-4xl mx-auto py-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const allergies: string[] = profile?.allergies
    ? Array.isArray(profile.allergies)
      ? (profile.allergies as string[])
      : String(profile.allergies).split(',').map((s) => s.trim())
    : ['None recorded'];

  const conditions: string[] = profile?.chronic_conditions
    ? Array.isArray(profile.chronic_conditions)
      ? (profile.chronic_conditions as string[])
      : String(profile.chronic_conditions).split(',').map((s) => s.trim())
    : ['None recorded'];

  const handleCopyWhatsAppBrief = async () => {
    const lines = [
      `📋 *Curewell Health Brief* — ${displayName}`,
      `📅 Date: ${new Date().toLocaleDateString()}`,
      '',
      `*Allergies:* ${allergies.join(', ')}`,
      `*Chronic Conditions:* ${conditions.join(', ')}`,
      '',
      `*Current Medications (${currentlyTaking.length}):*`,
      ...(currentlyTaking.length > 0
        ? currentlyTaking.map((m) => `• ${m.medicine_name} ${m.strength ? `(${m.strength})` : ''} - ${m.frequency_code} (${m.with_food ? 'with food' : 'empty stomach'})`)
        : ['• None recorded']),
      '',
      `*Vitals Summary:*`,
      avgBp ? `• Blood Pressure (7-day avg): ${avgBp.sys}/${avgBp.dia} mmHg (n=${avgBp.count})` : (bpReadings[0] ? `• Blood Pressure: ${bpReadings[0].systolic}/${bpReadings[0].diastolic} mmHg` : '• Blood Pressure: None recorded'),
      avgGlucose ? `• Blood Glucose (7-day avg): ${avgGlucose.avg} mg/dL (n=${avgGlucose.count})` : (glucoseReadings[0] ? `• Blood Glucose: ${glucoseReadings[0].value_mg_dl} mg/dL` : '• Blood Glucose: None recorded'),
    ];

    if (allFlatLabResults.length > 0) {
      const abnormal = allFlatLabResults.filter((r) => r.range_status === 'above' || r.range_status === 'below');
      if (abnormal.length > 0) {
        lines.push('', '*Flagged Lab Biomarkers:*');
        abnormal.slice(0, 5).forEach((r) => {
          lines.push(`• ${r.test_name}: ${r.value_text} ${r.unit} (${r.range_status.toUpperCase()})`);
        });
      }
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setToastTone('ok');
      setToastMessage('WhatsApp health brief copied to clipboard!');
    } catch {
      setToastTone('risk');
      setToastMessage('Failed to copy to clipboard.');
    }
  };

  return (
    <AppShell>
      {toastMessage && (
        <Toast
          open
          onClose={() => setToastMessage(null)}
          message={toastMessage}
          tone={toastTone}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400">
                <StethoscopeIcon size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-ink-900 dark:text-ink-50 tracking-tight">
                Doctor Visit Companion
              </h1>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-400 mt-1">
              Prepare talking points, review vitals and labs, and generate doctor-ready summaries or second opinion dossiers.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyWhatsAppBrief}
              leftIcon={<CopyIcon size={14} />}
            >
              Copy for WhatsApp
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<PrinterIcon size={14} />}
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPdf}
              loading={isExporting}
              leftIcon={<DownloadIcon size={14} />}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Tab Navigation (Segmented Switcher) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-ink-100/70 dark:bg-ink-800/50 border border-ink-200/80 dark:border-ink-700/60 print:hidden">
          <button
            type="button"
            onClick={() => handleTabChange('questions')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-white dark:bg-ink-900 text-teal-900 dark:text-teal-300 shadow-xs'
                : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200'
            }`}
          >
            <SparklesIcon size={14} />
            <span>Discussion Checklist</span>
            {questions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px]">
                {questions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('brief')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'brief'
                ? 'bg-white dark:bg-ink-900 text-teal-900 dark:text-teal-300 shadow-xs'
                : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200'
            }`}
          >
            <StethoscopeIcon size={14} />
            <span>Clinical Summary (A4)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('share')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'share'
                ? 'bg-white dark:bg-ink-900 text-teal-900 dark:text-teal-300 shadow-xs'
                : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200'
            }`}
          >
            <ShareIcon size={14} />
            <span>Second Opinion & Share</span>
          </button>
        </div>

        {/* ── TAB 1: DISCUSSION CHECKLIST ───────────────────────────── */}
        {activeTab === 'questions' && (
          <div className="space-y-5 print:hidden">
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-teal-950 dark:text-teal-200">
                  Smart Consultation Talking Points
                </h2>
                <p className="text-[11px] text-teal-800/80 dark:text-teal-400 mt-0.5">
                  Synthesized automatically from your recent lab values, abnormal blood pressure spikes, and long-term medications.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyQuestions}
                leftIcon={copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              >
                {copied ? 'Copied' : 'Copy All'}
              </Button>
            </div>

            {/* Custom Question Adder */}
            <form onSubmit={handleAddCustomQuestion} className="flex gap-2">
              <input
                type="text"
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="Ask about a new symptom, dosage change, or side effect..."
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 focus:outline-teal-600 shadow-xs"
              />
              <Button type="submit" variant="primary" size="sm" leftIcon={<PlusIcon size={14} />}>
                Add Note
              </Button>
            </form>

            {/* Checklist */}
            <div className="space-y-3">
              {questions.map((q) => {
                const isChecked = checkedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 select-none ${
                      isChecked
                        ? 'bg-ink-50/60 dark:bg-ink-900/40 border-ink-200 dark:border-ink-800 opacity-60'
                        : 'bg-white dark:bg-ink-900 border-ink-200/90 dark:border-ink-700/80 shadow-xs hover:border-teal-500'
                    }`}
                  >
                    <input
                      id={`q-check-${q.id}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleQuestionCheck(q.id)}
                      className="mt-1 h-4 w-4 rounded text-teal-800 focus:ring-teal-600 cursor-pointer"
                    />
                    <label htmlFor={`q-check-${q.id}`} className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            q.priority === 'high'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : q.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300'
                          }`}
                        >
                          {q.priority} priority
                        </span>
                        <span className="text-[10px] text-ink-500">{q.categoryLabel}</span>
                      </div>
                      <span className={`block text-xs font-bold ${isChecked ? 'line-through text-ink-500' : 'text-ink-900 dark:text-ink-100'}`}>
                        {q.question}
                      </span>
                      <span className="block text-[11px] text-ink-500 dark:text-ink-400 mt-1">
                        {q.context}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: SECOND OPINION & SHARE CONFIGURATION ────────────── */}
        {activeTab === 'share' && (
          <div className="space-y-5 print:hidden">
            {/* Quick Share Link Box */}
            <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-ink-900 dark:text-ink-50">
                    Live Doctor Sharing Link (PIN Protected)
                  </h2>
                  <p className="text-[11px] text-ink-500 mt-0.5">
                    Allow a consulting doctor to view your records on their phone without signing up.
                  </p>
                </div>
                <Link to="/share">
                  <Button variant="secondary" size="sm" leftIcon={<ShareIcon size={13} />}>
                    Manage Sharing Links
                  </Button>
                </Link>
              </div>
            </div>

            {/* Anonymization Switcher */}
            <div className="p-4 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <input
                  id="anonymize-toggle"
                  type="checkbox"
                  checked={anonymize}
                  onChange={(e) => setAnonymize(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-800 focus:ring-teal-600 cursor-pointer"
                />
                <label htmlFor="anonymize-toggle" className="cursor-pointer">
                  <span className="text-xs font-bold text-ink-900 dark:text-ink-100 block">
                    Anonymize Patient Identity (Second Opinion Mode)
                  </span>
                  <span className="text-[11px] text-ink-500 block">
                    Masks name and personal identifiers on printed and exported PDF dossiers.
                  </span>
                </label>
              </div>

              <div className="text-right text-xs font-mono text-ink-500 flex items-center gap-1">
                Security Stamp: <span className="text-emerald-700 font-bold flex items-center gap-1"><ShieldIcon size={13} /> SHA-256 Watermarked</span>
              </div>
            </div>

            {/* Specialist Notes Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
              <label htmlFor="specialist-notes" className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5">
                Specific Question / Focus for Consulting Specialist:
              </label>
              <textarea
                id="specialist-notes"
                value={specialistNotes}
                onChange={(e) => setSpecialistNotes(e.target.value)}
                placeholder="e.g. Seeking second opinion on diagnosis; are alternative therapies or surgical interventions indicated?"
                rows={3}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 focus:outline-indigo-600"
              />
            </div>
          </div>
        )}

        {/* ── PRINTABLE & EXPORTABLE DOSSIER (Visible on tab 2 & 3, and always during print) ── */}
        <div
          ref={dossierRef}
          className={`${activeTab === 'questions' ? 'hidden print:block' : 'block'} bg-white text-ink-950 rounded-3xl border border-ink-200/90 p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-teal-900">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-teal-950 tracking-tight">CUREWELL</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-950">
                  {anonymize ? 'CLINICAL SECOND-OPINION DOSSIER' : 'DOCTOR VISIT CLINICAL BRIEF'}
                </span>
              </div>
              <p className="text-[11px] text-ink-600 mt-0.5">
                Structured Longitudinal Patient Health Records Summary
              </p>
            </div>

            {watermark && (
              <div className="text-right">
                <p className="text-[10px] font-mono font-bold text-teal-950">{watermark.securityStamp}</p>
                <p className="text-[9px] font-mono text-ink-500">
                  Issued: {new Date(watermark.issuedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-ink-50/70 border border-ink-200/80 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-ink-500">Patient Identifier</p>
              <p className="font-bold text-ink-900 mt-0.5">{displayName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-ink-500">Sex / Blood Group</p>
              <p className="font-semibold text-ink-900 mt-0.5">
                {profile?.sex || 'Unspecified'} • {profile?.blood_group || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-ink-500">Chronic Conditions</p>
              <p className="font-semibold text-ink-900 mt-0.5">{conditions.join(', ')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-ink-500">Allergies</p>
              <p className="font-semibold text-rose-800 mt-0.5">{allergies.join(', ')}</p>
            </div>
          </div>

          {/* Specialist notes if entered */}
          {specialistNotes.trim() && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
              <p className="text-[10px] uppercase font-bold text-indigo-900 mb-0.5">Consultation Focus</p>
              <p className="text-indigo-950">{specialistNotes}</p>
            </div>
          )}

          {/* Section 1: Active Medicines */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-ink-200 pb-1 flex items-center gap-1.5">
              <MedicineIcon size={13} />
              <span>Current Medications ({currentlyTaking.length} Active)</span>
            </h2>
            {currentlyTaking.length === 0 ? (
              <p className="text-xs text-ink-500 italic">No active medications recorded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentlyTaking.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl border border-ink-200 bg-white">
                    <p className="font-bold text-ink-900">{m.medicine_name} {m.strength && `(${m.strength})`}</p>
                    <p className="text-[11px] text-ink-600">
                      {m.frequency_code} • {m.with_food ? 'with food' : 'empty stomach'}
                    </p>
                    {m.instructions && (
                      <p className="text-[10px] text-ink-500 italic mt-0.5">{m.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Recent Vitals */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-ink-200 pb-1 flex items-center gap-1.5">
              <HeartPulseIcon size={13} />
              <span>Recent Vitals Summary</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-ink-200 bg-ink-50/50">
                <p className="text-[10px] text-ink-500 font-bold uppercase">Blood Pressure</p>
                <p className="text-sm font-black text-ink-900 mt-1">
                  {bpReadings[0] ? `${bpReadings[0].systolic}/${bpReadings[0].diastolic} mmHg` : 'No logs'}
                </p>
                {avgBp ? (
                  <p className="text-[10px] text-teal-800 font-semibold mt-0.5">7-day avg: {avgBp.sys}/{avgBp.dia} mmHg</p>
                ) : bpReadings[0] ? (
                  <p className="text-[10px] text-ink-500 mt-0.5">{new Date(bpReadings[0].measured_at).toLocaleDateString()}</p>
                ) : null}
              </div>
              <div className="p-3 rounded-xl border border-ink-200 bg-ink-50/50">
                <p className="text-[10px] text-ink-500 font-bold uppercase">Blood Glucose</p>
                <p className="text-sm font-black text-ink-900 mt-1">
                  {glucoseReadings[0] ? `${glucoseReadings[0].value_mg_dl} mg/dL` : 'No logs'}
                </p>
                {avgGlucose ? (
                  <p className="text-[10px] text-teal-800 font-semibold mt-0.5">7-day avg: {avgGlucose.avg} mg/dL</p>
                ) : glucoseReadings[0] ? (
                  <p className="text-[10px] text-ink-500 mt-0.5">{new Date(glucoseReadings[0].measured_at).toLocaleDateString()}</p>
                ) : null}
              </div>
              <div className="p-3 rounded-xl border border-ink-200 bg-ink-50/50">
                <p className="text-[10px] text-ink-500 font-bold uppercase">Total Consultations</p>
                <p className="text-sm font-black text-ink-900 mt-1">{recentVisits.length}</p>
              </div>
              <div className="p-3 rounded-xl border border-ink-200 bg-ink-50/50">
                <p className="text-[10px] text-ink-500 font-bold uppercase">Lab Reports Stored</p>
                <p className="text-sm font-black text-ink-900 mt-1">{recentReports.length}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Recent Lab Biomarkers */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-ink-200 pb-1 flex items-center gap-1.5">
              <LabFlaskIcon size={13} />
              <span>Key Diagnostic Biomarkers</span>
            </h2>
            {allFlatLabResults.length === 0 ? (
              <p className="text-xs text-ink-500 italic">No laboratory results recorded.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {allFlatLabResults.slice(0, 9).map((lr, idx) => {
                  const isAbnormal = lr.range_status === 'above' || lr.range_status === 'below';
                  return (
                    <div
                      key={lr.id || idx}
                      className={`p-2.5 rounded-xl border ${
                        isAbnormal ? 'border-amber-300 bg-amber-50/50' : 'border-ink-200 bg-white'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-ink-600 truncate">{lr.test_name}</p>
                      <p className={`font-bold mt-0.5 ${isAbnormal ? 'text-amber-900' : 'text-ink-900'}`}>
                        {lr.value_text} {lr.unit}
                      </p>
                      {lr.reference_range && (
                        <p className="text-[9px] text-ink-500">Ref: {lr.reference_range}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Recent Consultations */}
          {recentVisits.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-ink-200 pb-1 flex items-center gap-1.5">
                <StethoscopeIcon size={13} />
                <span>Recent Consultations</span>
              </h2>
              <div className="space-y-2 text-xs">
                {recentVisits.map((v) => (
                  <div key={v.id} className="p-3 rounded-xl border border-ink-200 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-ink-900">{v.doctor_name} {v.clinic_name && `• ${v.clinic_name}`}</p>
                      <p className="text-[10px] text-ink-500">{new Date(v.visit_date).toLocaleDateString()}</p>
                    </div>
                    {v.diagnosis && <p className="text-[11px] text-ink-700 mt-1"><span className="font-semibold">Diagnosis:</span> {v.diagnosis}</p>}
                    {v.doctor_advice && <p className="text-[11px] text-ink-600 mt-0.5"><span className="font-semibold">Advice:</span> {v.doctor_advice}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Notice */}
          <div className="pt-3 border-t border-ink-200 flex items-center justify-between text-[10px] text-ink-500">
            <p>Generated by Curewell Personal Health Companion • Confirmed by Patient</p>
            <p>Not a standalone clinical diagnosis</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
