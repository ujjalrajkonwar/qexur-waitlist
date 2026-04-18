"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useModalA11y } from "@/hooks/useModalA11y";

type DnsVerificationModalProps = {
  open: boolean;
  pending: boolean;
  recordName: string;
  recordValue: string;
  onClose: () => void;
  onVerify: () => void;
};

type CopiedField = "record-name" | "record-value" | null;

export function DnsVerificationModal({
  open,
  pending,
  recordName,
  recordValue,
  onClose,
  onVerify,
}: DnsVerificationModalProps) {
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const closeModal = useCallback(() => {
    if (!pending) {
      onClose();
    }
  }, [pending, onClose]);

  const dialogRef = useModalA11y<HTMLDivElement>({
    open,
    onClose: closeModal,
    closeOnEscape: !pending,
  });

  useEffect(() => {
    if (!copiedField) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedField(null), 1400);

    return () => window.clearTimeout(timeoutId);
  }, [copiedField]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  async function handleCopy(value: string, field: Exclude<CopiedField, null>) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
    } catch {
      setCopiedField(null);
    }
  }

  return createPortal(
    <div
      className="animate-qx-modal-fade fixed inset-0 z-[999] grid place-items-center bg-slate-950/80 px-4 py-8"
      onClick={closeModal}
      role="presentation"
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dns-verification-title"
        className="animate-qx-modal-wolf w-full max-w-2xl rounded-2xl border border-cyan-500/45 bg-[var(--qx-panel-strong)] p-6 shadow-[0_30px_60px_rgba(2,6,23,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">DNS Ownership Checkpoint</p>
          <h2 id="dns-verification-title" className="font-display text-4xl uppercase tracking-[0.08em] text-cyan-100">
            Verify Domain Ownership
          </h2>
          <p className="text-sm leading-relaxed text-[var(--qx-muted)]">
            Please add the following TXT record to your DNS configuration at your domain provider (e.g., Cloudflare,
            GoDaddy, Namecheap).
          </p>
        </header>

        <div className="mt-5 space-y-4">
          <section className="rounded-xl border border-[var(--qx-border)] bg-black/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--qx-muted)]">TXT Record Name</p>
              <button
                type="button"
                onClick={() => {
                  void handleCopy(recordName, "record-name");
                }}
                className="inline-flex items-center gap-2 rounded-md border border-cyan-400/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-400/10"
                aria-label="Copy TXT record name"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                  <rect x="3" y="8" width="13" height="13" rx="2" />
                </svg>
                {copiedField === "record-name" ? "Copied" : "Copy"}
              </button>
            </div>
            <code className="mt-3 block break-all rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-sm text-cyan-100">
              {recordName}
            </code>
          </section>

          <section className="rounded-xl border border-[var(--qx-border)] bg-black/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--qx-muted)]">TXT Record Value</p>
              <button
                type="button"
                onClick={() => {
                  void handleCopy(recordValue, "record-value");
                }}
                className="inline-flex items-center gap-2 rounded-md border border-cyan-400/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-400/10"
                aria-label="Copy TXT record value"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                  <rect x="3" y="8" width="13" height="13" rx="2" />
                </svg>
                {copiedField === "record-value" ? "Copied" : "Copy"}
              </button>
            </div>
            <code className="mt-3 block break-all rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-sm text-cyan-100">
              {recordValue}
            </code>
          </section>

          <p className="rounded-lg border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-100">
            ⚠️ DNS propagation usually takes about 2 minutes. Please wait before clicking verify.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={closeModal}
            disabled={pending}
            data-autofocus
            className="rounded-lg border border-[var(--qx-border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)] transition hover:border-[var(--qx-text)] hover:text-[var(--qx-text)]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={onVerify}
            className={[
              "inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
              pending
                ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                : "border-cyan-400 bg-cyan-500 text-black hover:bg-cyan-400",
            ].join(" ")}
          >
            {pending && (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/50 border-t-black"
                aria-hidden="true"
              />
            )}
            {pending ? "Surgical Scan..." : "Verify DNS"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
