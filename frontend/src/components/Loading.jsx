import { Building2 } from 'lucide-react';

export default function Loading({ message = 'Loading workspace...' }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-kodi-navy transition-all duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--bg-gradient-1),transparent_35%),radial-gradient(circle_at_bottom_right,var(--bg-gradient-2),transparent_30%)]" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated logo container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-kodi-accent/20 opacity-75" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-kodi-accent to-kodi-emerald shadow-kodi-accent-25">
            <Building2 className="h-10 w-10 text-white animate-pulse" />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-xl font-black tracking-tight text-kodi-dark">
            Kodishaa<span className="text-kodi-accent">.</span>
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-kodi-accent" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-kodi-accent [animation-delay:-0.15s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-kodi-accent [animation-delay:-0.3s]" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-kodi-text-muted animate-fade-in">
            {message}
          </p>
        </div>
      </div>

      {/* Decorative lines */}
      <div className="absolute bottom-10 flex w-full max-w-xs items-center gap-3 opacity-20">
        <div className="h-[1px] flex-1 bg-kodi-text-muted" />
        <div className="h-1 w-1 rounded-full bg-kodi-text-muted" />
        <div className="h-[1px] flex-1 bg-kodi-text-muted" />
      </div>
    </div>
  );
}
