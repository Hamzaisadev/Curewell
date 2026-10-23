# frontend-change.md

Professional-retokenize (de-slop + tokens) session ledger. One entry per file, newest first, above `## Pending`.

> **Note (2026-10-23):** An earlier ledger covering "browser de-slop" landed-sweep batches 1–5, LandingPage batches, TimelinePage, VisitDetailPage, DoctorVisitCompanionPage, DoctorDirectoryPage, DashboardPage.tsx, and NotFoundPage.tsx was lost together with its uncommitted source edits when the workspace tree was externally reset to HEAD (`0a7c2b1`) this session. Those batches are considered **undone** and must be redone; the ledger below starts fresh from ground truth.

---

## 2026-10-23 — Workspace rollback incident + re-baseline

**Before:** HEAD at `0a7c2b1 "eiudiu"` (user commit, 58 files, +3,379/-1,160, includes mobile/, auth pages, UI primitives, presentation pages, InteractiveStoryScroller — user's own work, not the sweep). `frontend-change.md` and `.scratch/` missing. Prior sweep edits absent from disk (verified: `DashboardPage.tsx` extended hits 8, `NotFoundPage.tsx` extended hits 7 — historical "certified 0" states no longer exist). `theme.css` untouched by the commit — accent/brand/status token triplets (`ok/warn/risk/info` bg-border-text at L117–128, raw values L184–195) still available.

**Change:**
- Recreated this ledger documenting the loss; no historical entries are reinstated.
- Fresh extended-pattern baseline taken over `src/pages` and `src/components` to rebuild the sweep queue from actual disk state.
- `src/pages/landing/components/Navbar.tsx` **excluded for now** — it carries current user WIP (badge/telemetry-pill removals dated this morning). Do not touch until user confirms.

**Result:** Baseline counts recorded in Pending below. Nothing else edited.

---

## 2026-10-23 — dashboard/components/EmergencyHotlinesStripCard retokenize (emergency-status card, risk-triplet mapping)

**Before:** Extended-pattern grep = **7** hits on this file (L13 card shell, L17 icon tile, L23 badge, L39 dial chip, L42 phone number, L48 service caption, L52 dial mini-tile — rose palette ×7, `dark:` halves, `rounded-3xl`, `font-black` ×2, `text-[10px]` ×2, `transition-all` ×2). Supplementary grep = 0. Whole card is rose-themed emergency semantics.

**Change (presentation only — copy, tel: interaction, `.map()` layout, no functional class at L39/L42 `group-hover` transforms untouched):**
- Card shell: `border-rose-200 dark:border-rose-900/60` → `border-risk-border`; `rounded-3xl` → `rounded-2xl`; `transition-all` → `transition-colors` (no `active:scale` on shell; `hover:shadow-raise` retained).
- Icon tile + badge + dial mini-tile: raw rose fills/edges/text → `bg-risk-bg border-risk-border text-risk-text` triplet; `dark:` halves dropped.
- Dial mini-tile hover inversion: `group-hover:bg-rose-600` → `group-hover:bg-risk-text` (deep red solid, white text readable; `risk-text` = `oklch(0.400 0.180 26)`).
- L23/L48 `text-[10px]` → `text-2xs`; `font-black` ×2 → `font-bold`.
- Dial chip L39: `hover:bg-rose-500/10` → `hover:bg-risk-bg`; `hover:border-rose-500/40` → `hover:border-risk-border`; `transition-all` → `transition-colors`.
- Phone number L42: `text-rose-600 dark:text-rose-400` → `text-risk-text`.

**Result:** 7 edits / 7 replacements. Certification (all run fresh post-edit): extended = **0**; supplementary (shadow-xs/2xs/sm, font-extrabold, purple/violet/fuchsia/pink/gray-, zinc-, neutral-, stone-) = **0**; overlay kill-list (`shadow-xl|shadow-md|shadow-2xl`) = **0**.

---

## Pending

Queue (fresh extended-pattern counts, post-rollback):

1. `dashboard/components/` — continue per-file, smallest first (EmergencyHotlinesStripCard done). Folder re-counted fresh post-rollback (ext/sup): MedicalRecordsVaultCard 10/0, RecentConsultationsCard 10/0, ActivePrescriptionsCard 14/0, CareScheduleTimelineCard 15/0, UpNextCard 25/0, HealthMilestonesCard 27/6 (sup = 6 false-positives from `milestone-*` IDs matching the `stone-` substring), CabinetSummaryCard 31/0, LabsCard 34/2, PatientInfoCard 36/2, VitalsCard 44/0, ClinicalDossierCard 47/0, BloodGlucoseTrendCard 57/1, BloodPressureTrendCard 57/1, AdherenceHabitsCard 60/1, MedicationScheduleCard 72/4, SymptomTriageCard 77/1, DrugInteractionRadarCard 79/0.
2. Previously-"done" files that must be redone (rollback victims): landing sweep batches 1–5, LandingPage, TimelinePage, VisitDetailPage, DoctorVisitCompanionPage, DoctorDirectoryPage, DashboardPage.tsx, NotFoundPage.tsx.
3. Global baseline (fresh greps, post-rollback): `src/pages` = 2097 extended / 324 supplementary; `src/components` = 395 extended / 92 supplementary. Old hit lists stale everywhere — recount per file on open.
4. `Navbar.tsx` — EXCLUDED (user WIP this morning); revisit after user go-ahead.
5. `DownloadApkPage.tsx` (L67–197): decide treatment (intentionally dark standalone page; consider `.ink` scope vs leaving scheme; do not force light tokens blindly).
6. Emoji→SVG via `src/components/ui/icons` (31 uses: ShifaMedicalPassportModal ×17, ProfileSwitcher ×5, AddFamilyProfileModal ×4, DoctorVisitCompanionPage ×3); patient-voice pass on ~22 system-speak error strings.
7. Final: `npm run verify` via `cmd /c npm run verify > log 2>&1`; taste-lint re-run (baseline file itself is gone — regenerate before final comparison counts); `.gradient-text-*`/`.glass-*` end-gate audit; never commit/push.

Working rules (unchanged): one file at a time — read, batch edits, certify (extended expect 0 or documented keeps; supplementary expect 0; overlay kill-list 0), then insert one entry above `## Pending`. Token-only presentation classes; medical/legal copy, interaction engines (motion props, sort/group/expand/delete-confirm logic), and placeholders untouched. Count-check regex: `bg-\[#|text-\[#|border-\[#|shadow-\[|font-black|rounded-3xl|transition-all|text-\[10px\]|text-\[11px\]|text-\[9px\]|teal-|amber-|rose-|blue-|emerald-|indigo-|\bslate-|\bdark:|\bink-\d`.
