import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

function WorkspaceSkeleton({ message }) {
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col bg-kodi-navy px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-kodi-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kodi-slate/15 text-kodi-text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-kodi-dark">Kodishaa</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-kodi-text-muted">{message}</p>
          </div>
        </div>
        <div className="hidden h-9 w-28 rounded-2xl bg-kodi-card shadow-sm sm:block" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden rounded-3xl border border-kodi-border bg-kodi-card/80 p-4 shadow-sm lg:block">
          <div className="mb-6 h-10 rounded-2xl bg-kodi-navy" />
          <div className="space-y-3">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-10 rounded-2xl bg-kodi-navy" />
            ))}
          </div>
        </aside>

        <main className="space-y-5">
          <div className="rounded-3xl border border-kodi-border bg-kodi-card/90 p-5 shadow-sm">
            <div className="h-5 w-36 rounded-full bg-kodi-navy" />
            <div className="mt-4 h-9 max-w-xl rounded-2xl bg-kodi-navy" />
            <div className="mt-3 h-4 max-w-2xl rounded-full bg-kodi-navy" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="rounded-3xl border border-kodi-border bg-kodi-card/90 p-5 shadow-sm">
                <div className="h-4 w-24 rounded-full bg-kodi-navy" />
                <div className="mt-5 h-8 w-28 rounded-2xl bg-kodi-navy" />
                <div className="mt-3 h-3 w-20 rounded-full bg-kodi-navy" />
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-kodi-border bg-kodi-card/90 p-5 shadow-sm">
              <div className="mb-5 h-5 w-40 rounded-full bg-kodi-navy" />
              <div className="h-64 rounded-3xl bg-kodi-navy" />
            </div>
            <div className="rounded-3xl border border-kodi-border bg-kodi-card/90 p-5 shadow-sm">
              <div className="mb-5 h-5 w-32 rounded-full bg-kodi-navy" />
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-14 rounded-2xl bg-kodi-navy" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Loading({ message = 'Loading workspace...', skeletonAfter = 4500 }) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeleton(true), skeletonAfter);
    return () => window.clearTimeout(timer);
  }, [skeletonAfter]);

  if (showSkeleton) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-kodi-navy">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--bg-gradient-1),transparent_35%),radial-gradient(circle_at_bottom_right,var(--bg-gradient-2),transparent_30%)]" />
        <div className="loading-skeleton">
          <WorkspaceSkeleton message="Still loading your workspace" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-kodi-navy transition-all duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--bg-gradient-1),transparent_35%),radial-gradient(circle_at_bottom_right,var(--bg-gradient-2),transparent_30%)]" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated logo container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-kodi-accent/20 opacity-75" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-kodi-accent to-kodi-emerald shadow-2xl shadow-kodi-accent/25">
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
