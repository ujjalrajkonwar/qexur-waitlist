import { Skeleton } from "@/components/ui/Skeleton";

export function AuditConsoleSkeleton() {
  return (
    <section className="space-y-8 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 md:p-8">
      <header className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>

      <section className="space-y-4">
        <Skeleton className="h-3 w-40" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-3 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </section>
    </section>
  );
}
