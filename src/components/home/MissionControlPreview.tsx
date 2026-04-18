"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AuthWallModal } from "@/components/modals/AuthWallModal";
import { WaitlistModal } from "@/components/modals/WaitlistModal";

type PreviewTrack = "penetration" | "audit" | "reporting";

const PREVIEW_TRACKS: Record<
  PreviewTrack,
  {
    title: string;
    summary: string;
    cadence: string;
    spotlight: string;
  }
> = {
  penetration: {
    title: "DNS-Verified Penetration",
    summary:
      "Arm your target with TXT verification and run controlled stress simulations through the 3-agent attack pipeline.",
    cadence: "Live telemetry | queue to completion",
    spotlight: "Recon -> Payload Sniper -> Reporter",
  },
  audit: {
    title: "Reasoning-First Audit",
    summary:
      "Upload code artifacts and receive exploit-path intelligence with remediation priorities in one operator stream.",
    cadence: "Surface and deep scan profiles",
    spotlight: "Source Intake -> Audit Intensity -> Action",
  },
  reporting: {
    title: "Security Manifest Output",
    summary:
      "Generate shareable security manifests with vulnerability log, remediation guidance, and crash-path references.",
    cadence: "Ready for delivery workflows",
    spotlight: "Copy | PDF | Share",
  },
};

export function MissionControlPreview() {
  const [activeTrack, setActiveTrack] = useState<PreviewTrack>("penetration");
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const activeTrackDetails = useMemo(() => PREVIEW_TRACKS[activeTrack], [activeTrack]);

  return (
    <>
      <section className="space-y-5 rounded-2xl border border-cyan-500/35 bg-[var(--qx-panel-strong)] p-5 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--qx-border)]/70 pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/45 bg-cyan-500/10 font-display text-lg text-cyan-300">
              Q
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Mission Control</p>
              <p className="text-sm text-[var(--qx-muted)]">Operator Preview</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/how-it-works"
              className="rounded-lg border border-cyan-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-500/10"
            >
              How it Works
            </Link>
            <button
              type="button"
              onClick={() => setShowWaitlistModal(true)}
              className="rounded-lg border-2 border-cyan-400 bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-cyan-400"
            >
              Join Waitlist
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="space-y-4 rounded-xl border border-[var(--qx-border)] bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Autonomous AI Security</p>
            <h1 className="font-display text-4xl uppercase tracking-[0.08em] sm:text-5xl">
              Pentesting AI Squad
            </h1>
            <p className="max-w-2xl text-sm text-[var(--qx-muted)]">
              Fast entry into Mission Control with DNS-verified stress simulation, audit tracks, and execution telemetry.
            </p>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(PREVIEW_TRACKS) as PreviewTrack[]).map((track) => {
                const active = track === activeTrack;

                return (
                  <button
                    key={track}
                    type="button"
                    onClick={() => setActiveTrack(track)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition",
                      active
                        ? "border-cyan-300/80 bg-cyan-400/20 text-cyan-100"
                        : "border-[var(--qx-border)] text-[var(--qx-muted)] hover:border-cyan-400/60 hover:text-cyan-200",
                    ].join(" ")}
                  >
                    {track}
                  </button>
                );
              })}
            </div>
          </article>

          <aside className="space-y-3 rounded-xl border border-cyan-500/35 bg-cyan-500/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">Track Focus</p>
            <h2 className="font-display text-3xl uppercase tracking-[0.08em] text-cyan-100">
              {activeTrackDetails.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--qx-muted)]">{activeTrackDetails.summary}</p>
            <div className="space-y-1 rounded-lg border border-[var(--qx-border)] bg-black/35 p-3 text-xs text-[var(--qx-muted)]">
              <p className="uppercase tracking-[0.16em] text-cyan-200">Cadence</p>
              <p>{activeTrackDetails.cadence}</p>
              <p className="pt-1 text-cyan-100">{activeTrackDetails.spotlight}</p>
            </div>
          </aside>
        </div>
      </section>

      <WaitlistModal
        open={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onConfirm={() => {
          setShowWaitlistModal(false);
          setShowAuthModal(true);
        }}
      />

      <AuthWallModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </>
  );
}
