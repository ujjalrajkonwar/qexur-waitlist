import { Skeleton } from "@/components/ui/Skeleton";

export function LiveAttackSkeleton() {
  return (
    <section className="space-y-8 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 md:p-8">
      <header className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>

      <section className="space-y-4 rounded-xl border border-cyan-500/30 bg-black/35 p-5">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-11 w-full" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--qx-border)] bg-black/30 p-5">
        <Skeleton className="h-3 w-56" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </section>
    </section>
  );
}
