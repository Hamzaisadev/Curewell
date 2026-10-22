import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

export function HackathonPresentationPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showTopBar, setShowTopBar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set document title
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Curewell v4.0 — Hackathon Presentation';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // Auto-hide top bar after 4 seconds of idle
  useEffect(() => {
    const resetTimer = () => {
      setShowTopBar(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setShowTopBar(false);
      }, 4000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('pointerdown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('pointerdown', resetTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Forward keyboard events directly to the iframe so arrow keys work immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        iframeRef.current?.contentWindow?.postMessage('NEXT_SLIDE', '*');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        iframeRef.current?.contentWindow?.postMessage('PREV_SLIDE', '*');
      } else if (e.key === 'h' || e.key === 'H') {
        iframeRef.current?.contentWindow?.postMessage('TOGGLE_HUD', '*');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore fullscreen permission rejections
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Discreet floating top action bar */}
      <div
        className={`absolute top-4 left-6 right-6 z-50 flex items-center justify-between pointer-events-none transition-opacity duration-500 ${
          showTopBar ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold backdrop-blur-md border border-slate-700/60 shadow-lg transition-all"
            title="Return to Curewell App Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
            <span>App Dashboard</span>
          </Link>
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>Curewell v4.0 · Hackathon Deck</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold backdrop-blur-md border border-slate-700/60 shadow-lg transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Presentation Frame */}
      <iframe
        ref={iframeRef}
        src="/presentation/index.html"
        title="Curewell Hackathon Presentation"
        className="w-full h-full border-0 block"
        allow="fullscreen"
      />
    </div>
  );
}
export default HackathonPresentationPage;
