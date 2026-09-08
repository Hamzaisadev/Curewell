import { Link } from 'react-router-dom';
import { Trophy, Award, Flame, ChevronRight } from 'lucide-react';

export function HealthMilestonesCard() {
  const milestones = [
    { id: '1', title: '7-Day Adherence Streak', progress: 100, unlocked: true, badge: 'Gold' },
    { id: '2', title: 'Vitals Consistency Log', progress: 85, unlocked: true, badge: 'Silver' },
    { id: '3', title: 'Full Health Record Vault', progress: 60, unlocked: false, badge: 'Bronze' },
  ];

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">
              <Trophy size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Milestones &amp; Badges
            </h2>
          </div>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
            <Flame size={11} className="fill-amber-500" />
            2 Unlocked
          </span>
        </div>

        {/* ── Milestones List ───────────────────────────────────────── */}
        <div className="space-y-2.5">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    m.unlocked
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-surface text-content-subtle opacity-50'
                  }`}
                >
                  <Award size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-content truncate leading-tight">
                    {m.title}
                  </h4>
                  <div className="w-24 sm:w-32 h-1.5 rounded-full bg-line/60 overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold shrink-0 ${
                  m.unlocked
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-surface text-content-subtle'
                }`}
              >
                {m.progress}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Patient compliance awards</span>
        <Link to="/settings" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Awards</span>
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
