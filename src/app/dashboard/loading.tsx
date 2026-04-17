import { AuditConsoleSkeleton } from "@/components/dashboard/AuditConsoleSkeleton";
import { LiveAttackSkeleton } from "@/components/dashboard/LiveAttackSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0B1221] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-[#0c1f33] to-[#101a2c] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-4 w-[28rem] max-w-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-56 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)]/80 p-4 sm:p-6">
          <section className="rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel)]/70 p-2 backdrop-blur-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-[76px] rounded-xl" />
              <Skeleton className="h-[76px] rounded-xl" />
            </div>
          </section>

          <AuditConsoleSkeleton />
          <LiveAttackSkeleton />
        </section>
      </div>
    </div>
  );
}
