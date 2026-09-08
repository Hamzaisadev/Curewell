import { PhoneCall } from 'lucide-react';
import { EmergencyAmbulanceIcon } from '../../../components/ui/icons';

const EMERGENCY_LINES = [
  { label: 'Rescue Ambulance', tel: '1122', area: 'National' },
  { label: 'Edhi Foundation', tel: '115', area: 'All Pakistan' },
  { label: 'National Poison Center', tel: '021-99205054', area: '24/7 Hotline' },
  { label: 'Red Crescent Ambulance', tel: '1030', area: 'Emergency' },
];

export function EmergencyHotlinesStripCard() {
  return (
    <div className="bg-surface rounded-3xl border border-risk-border/60 p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <EmergencyAmbulanceIcon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content tracking-tight flex items-center gap-2">
              <span>Emergency Medical Hotlines</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                24/7 Offline
              </span>
            </h3>
            <p className="text-2xs text-content-muted mt-0.5">
              Instant direct dial. Operates without an active internet connection.
            </p>
          </div>
        </div>

        {/* Right: Quick Dial Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMERGENCY_LINES.map((line) => (
            <a
              key={line.tel}
              href={`tel:${line.tel}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-surface-sunken/60 hover:bg-rose-500/10 border border-line hover:border-rose-500/30 transition-all text-left group"
            >
              <div className="min-w-0">
                <span className="block text-xs font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight group-hover:scale-105 transition-transform">
                  {line.tel}
                </span>
                <span className="block text-[10px] text-content-subtle truncate">
                  {line.label}
                </span>
              </div>
              <PhoneCall size={12} className="text-rose-500 shrink-0 opacity-60 group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
