import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

export function CareScheduleTimelineCard() {
  const events = [
    { id: '1', title: 'Cardiology Follow-up', date: 'In 3 weeks', subtitle: 'Dr. Tariq · Review BP logs', type: 'visit' },
    { id: '2', title: 'Fasting Lipid Profile', date: 'Next month', subtitle: 'Diagnostic lab check', type: 'lab' },
    { id: '3', title: 'Amlodipine 5mg Refill', date: 'In 12 days', subtitle: 'Pharmacy cabinet refill', type: 'refill' },
  ];

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 dark:text-brand-400">
              <Calendar size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Care Timeline
            </h2>
          </div>

          <Link
            to="/timeline"
            className="text-2xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>Timeline</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* ── Events List ───────────────────────────────────────────── */}
        <div className="space-y-2.5">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-2.5 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                  <Clock size={13} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-content truncate leading-tight">
                    {ev.title}
                  </h4>
                  <p className="text-2xs text-content-subtle truncate mt-0.5">
                    {ev.subtitle}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-surface border border-line/60 text-[10px] font-bold text-content-subtle shrink-0">
                {ev.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Upcoming medical milestones</span>
        <Link to="/timeline" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Schedule</span>
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
