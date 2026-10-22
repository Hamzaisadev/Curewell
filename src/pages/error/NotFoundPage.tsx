import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { MedicineIcon, StethoscopeIcon, SearchIcon } from '../../components/ui/icons';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-sunken text-content flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-accent-subtle selection:text-accent-onsubtle">
      {/* Minimal Top Brand Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-line">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent rounded-lg" aria-label="Curewell home">
          <Logo size="md" />
        </Link>
        <Link
          to="/"
          className="text-xs font-bold text-content hover:text-accent px-3 py-1.5 rounded-lg border border-line bg-surface-raised hover:bg-surface-hover transition-colors shadow-2xs"
        >
          Return Home
        </Link>
      </header>

      {/* Main 404 Centerpiece */}
      <main className="max-w-lg w-full mx-auto my-auto py-8 text-center">
        <div className="bg-surface-raised border border-line rounded-3xl p-6 sm:p-10 shadow-card relative overflow-hidden">
          {/* Animated Medical Compass / 404 Graphic */}
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-md">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-accent text-content-onaccent text-[10px] font-black shadow-xs">
              404
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
            Page Not Found
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-content-muted leading-relaxed">
            The page or record link you requested could not be found. Check the address, search your records, or return home.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="md" onClick={() => navigate('/')}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return Home
            </Button>

            <Link to="/search">
              <Button variant="secondary" size="md">
                <SearchIcon size={15} className="mr-1.5" />
                Search Records
              </Button>
            </Link>

            <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-8 pt-6 border-t border-line text-left">
            <p className="text-[10px] uppercase font-bold text-content-subtle tracking-wider mb-2.5 text-center">
              Quick Shortcuts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link
                to="/search"
                className="p-2.5 rounded-xl border border-line bg-surface hover:border-accent/40 hover:bg-surface-hover transition-colors group"
              >
                <p className="text-xs font-bold text-content group-hover:text-accent flex items-center gap-1.5">
                  <SearchIcon size={14} className="text-accent" /> Search
                </p>
                <p className="text-[10px] text-content-muted mt-0.5">Find any record</p>
              </Link>

              <Link
                to="/medicines"
                className="p-2.5 rounded-xl border border-line bg-surface hover:border-accent/40 hover:bg-surface-hover transition-colors group"
              >
                <p className="text-xs font-bold text-content group-hover:text-accent flex items-center gap-1.5">
                  <MedicineIcon size={14} className="text-accent" /> Pill Schedule
                </p>
                <p className="text-[10px] text-content-muted mt-0.5">Dose timetable</p>
              </Link>

              <Link
                to="/timeline"
                className="p-2.5 rounded-xl border border-line bg-surface hover:border-accent/40 hover:bg-surface-hover transition-colors group"
              >
                <p className="text-xs font-bold text-content group-hover:text-accent flex items-center gap-1.5">
                  <StethoscopeIcon size={14} className="text-accent" /> Timeline
                </p>
                <p className="text-[10px] text-content-muted mt-0.5">Visits & history</p>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-2 text-[11px] text-content-subtle border-t border-line">
        Curewell &bull; Personal Health Record &amp; Timetable
      </footer>
    </div>
  );
}
