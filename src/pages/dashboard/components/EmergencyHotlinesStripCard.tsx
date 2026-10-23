import { PhoneCall } from 'lucide-react';
import { EmergencyAmbulanceIcon } from '../../../components/ui/icons';

const EMERGENCY_LINES = [
  { label: 'Rescue Ambulance', tel: '1122', service: 'Medical & Trauma' },
  { label: 'Edhi Foundation', tel: '115', service: 'Emergency Relief' },
  { label: 'Poison Control Center', tel: '021-99205054', service: '24/7 Toxicology' },
  { label: 'Red Crescent Ambulance', tel: '1030', service: 'Disaster & Medical' },
];

export function EmergencyHotlinesStripCard() {
  return (
    <div className="bg-surface rounded-2xl border border-risk-border p-4 sm:p-5 shadow-card hover:shadow-raise transition-colors duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-risk-bg border border-risk-border text-risk-text flex items-center justify-center shrink-0">
            <EmergencyAmbulanceIcon size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content tracking-tight flex items-center gap-2">
              <span>Emergency Medical Hotlines</span>
              <span className="px-2 py-0.5 rounded-md bg-risk-bg text-risk-text text-2xs font-bold uppercase tracking-wider">
                24/7 Direct Dial
              </span>
            </h3>
            <p className="text-xs text-content-muted mt-0.5">
              Direct offline connection to verified emergency responders throughout Pakistan.
            </p>
          </div>
        </div>

        {/* Right: Quick Dial Cards (Zero text truncation, bold numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {EMERGENCY_LINES.map((line) => (
            <a
              key={line.tel}
              href={`tel:${line.tel}`}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-sunken/70 hover:bg-risk-bg border border-line hover:border-risk-border transition-colors group"
            >
              <div className="min-w-0">
                <span className="block text-sm font-bold text-risk-text font-mono tracking-tight group-hover:scale-105 transition-transform">
                  {line.tel}
                </span>
                <span className="block text-xs font-semibold text-content leading-tight">
                  {line.label}
                </span>
                <span className="block text-2xs text-content-subtle mt-0.5 font-medium">
                  {line.service}
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-risk-bg text-risk-text flex items-center justify-center shrink-0 group-hover:bg-risk-text group-hover:text-white transition-colors">
                <PhoneCall size={13} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
