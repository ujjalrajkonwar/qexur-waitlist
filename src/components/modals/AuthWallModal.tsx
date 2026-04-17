"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { AuthModal } from "@/components/auth/AuthModal";
import { useModalA11y } from "@/hooks/useModalA11y";

type AuthMode = "login" | "signup";

type AuthWallModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
};

export function AuthWallModal({ open, onClose, initialMode = "signup" }: AuthWallModalProps) {
  const [modeOverride, setModeOverride] = useState<AuthMode | null>(null);
  const [formPending, setFormPending] = useState(false);
  const mode = modeOverride ?? initialMode;

  const closeModal = useCallback(() => {
    if (!formPending) {
      setModeOverride(null);
      setFormPending(false);
      onClose();
    }
  }, [formPending, onClose]);

  const dialogRef = useModalA11y<HTMLDivElement>({
    open,
    onClose: closeModal,
  });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] grid place-items-center bg-black/80 p-4 sm:p-6"
      onClick={closeModal}
      role="presentation"
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-wall-title"
        className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto space-y-4 border-2 border-[var(--qx-primary)] bg-[var(--qx-panel-strong)] p-5 shadow-[8px_8px_0_var(--qx-primary-strong)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Authentication Required</p>
            <h3 id="auth-wall-title" className="mt-2 font-display text-3xl uppercase tracking-[0.08em]">
              Start Your Free Project
            </h3>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={formPending}
            data-autofocus
            className="border border-[var(--qx-border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)] transition hover:border-[var(--qx-text)] hover:text-[var(--qx-text)]"
          >
            Close
          </button>
        </div>

        <AuthModal
          mode={mode}
          onModeChange={setModeOverride}
          onSubmitStart={() => setFormPending(true)}
          onSubmitEnd={() => setFormPending(false)}
          onSuccess={() => {
            setModeOverride(null);
            setFormPending(false);
            onClose();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
