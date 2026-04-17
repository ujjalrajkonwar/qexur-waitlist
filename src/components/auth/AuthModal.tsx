"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  mode: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
  onSuccess?: () => void;
};

type AuthFeedback = {
  tone: "success" | "error";
  text: string;
};

const SUBMIT_COOLDOWN_MS = 1200;
const OTP_LENGTH = 8;

type OtpErrorKind = "invalid" | "expired" | "unknown";

function createEmptyOtpDigits(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

function sanitizeAuthError(errorMessage: string, mode: AuthMode): string {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Network issue detected. Check your connection and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please verify your email before continuing.";
  }

  if (mode === "login") {
    return "Authentication failed. Check your credentials and try again.";
  }

  return "Unable to complete sign up right now. Please try again.";
}

function classifyOtpError(errorMessage: string, errorCode?: string | null): OtpErrorKind {
  const normalizedMessage = errorMessage.toLowerCase();
  const normalizedCode = (errorCode ?? "").toLowerCase();

  if (
    normalizedCode.includes("invalid") ||
    normalizedMessage.includes("invalid") ||
    normalizedMessage.includes("wrong") ||
    normalizedMessage.includes("invalid hex")
  ) {
    return "invalid";
  }

  if (normalizedCode.includes("expired") || normalizedMessage.includes("expired")) {
    return "expired";
  }

  return "unknown";
}

function getOtpErrorMessage(errorKind: OtpErrorKind): string {
  if (errorKind === "invalid") {
    return "❌ Invalid code. Please check and try again.";
  }

  if (errorKind === "expired") {
    return "⏰ Verification code expired. Please request a new one.";
  }

  return "⚠️ Something went wrong. Please try again later.";
}

export function AuthModal({ mode, onModeChange, onSubmitStart, onSubmitEnd, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtpDigits);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isBusy = submitting || verifyingCode;
  const otpCode = otpDigits.join("");
  const canVerifyCode = otpCode.length === OTP_LENGTH && !isBusy && verificationPendingEmail.length > 0;

  useEffect(() => {
    if (mode !== "signup") {
      setVerificationPendingEmail("");
      setResendingCode(false);
      setVerifyingCode(false);
      setOtpStage(false);
      setOtpDigits(createEmptyOtpDigits());
    }
  }, [mode]);

  useEffect(() => {
    if (!otpStage) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      otpInputRefs.current[0]?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [otpStage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    if (!agreeToTerms) {
      setFeedback({
        tone: "error",
        text: "You must accept Terms and Privacy Policy before continuing.",
      });
      return;
    }

    if (Date.now() < cooldownUntil) {
      setFeedback({
        tone: "error",
        text: "Please wait a moment before submitting again.",
      });
      return;
    }

    setSubmitting(true);
    setCooldownUntil(Date.now() + SUBMIT_COOLDOWN_MS);
    setFeedback(null);
    onSubmitStart?.();

    try {
      const normalizedEmail = email.trim();
      const termsAcceptedAt = new Date().toISOString();
      const legalData = {
        termsAcceptedAt,
        termsVersion: "1.0",
        agreedToTerms: true,
      };

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: legalData,
          },
        });

        if (error) {
          setFeedback({
            tone: "error",
            text: sanitizeAuthError(error.message, mode),
          });
          return;
        }

        if (!data.session) {
          setVerificationPendingEmail(normalizedEmail);
          setOtpStage(true);
          setOtpDigits(createEmptyOtpDigits());
          setFeedback({
            tone: "success",
            text: "Account created. Enter the 8-digit verification code sent to your email.",
          });
          return;
        }

        setVerificationPendingEmail("");
        setOtpStage(false);
        setOtpDigits(createEmptyOtpDigits());
        setFeedback({
          tone: "success",
          text: "Account created successfully. Redirecting to dashboard...",
        });
        onSuccess?.();
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setFeedback({
          tone: "error",
          text: sanitizeAuthError(error.message, mode),
        });
        return;
      }

      const mergedMetadata = {
        ...(data.user?.user_metadata ?? {}),
        ...legalData,
      };

      const { error: metadataError } = await supabase.auth.updateUser({
        data: mergedMetadata,
      });

      if (metadataError) {
        setFeedback({
          tone: "error",
          text: "Signed in, but legal acceptance metadata could not be updated. Please retry.",
        });
        return;
      }

      setFeedback({
        tone: "success",
        text: "Signed in successfully. Redirecting to dashboard...",
      });
      onSuccess?.();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFeedback({
        tone: "error",
        text: "Unable to reach authentication service. Please try again.",
      });
    } finally {
      setSubmitting(false);
      onSubmitEnd?.();
    }
  }

  function handleOtpDigitChange(index: number, rawValue: string) {
    const cleaned = rawValue.replace(/\D/g, "");

    if (!cleaned) {
      setOtpDigits((previous) => {
        const next = [...previous];
        next[index] = "";
        return next;
      });
      return;
    }

    setOtpDigits((previous) => {
      const next = [...previous];

      for (let offset = 0; offset < cleaned.length && index + offset < OTP_LENGTH; offset += 1) {
        next[index + offset] = cleaned[offset] ?? "";
      }

      return next;
    });

    const nextIndex = Math.min(index + cleaned.length, OTP_LENGTH - 1);
    otpInputRefs.current[nextIndex]?.focus();
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();

      setOtpDigits((previous) => {
        const next = [...previous];

        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
        }

        return next;
      });

      if (index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      } else {
        otpInputRefs.current[0]?.focus();
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!pastedDigits) {
      return;
    }

    event.preventDefault();

    const nextDigits = createEmptyOtpDigits();
    for (let index = 0; index < pastedDigits.length; index += 1) {
      nextDigits[index] = pastedDigits[index] ?? "";
    }

    setOtpDigits(nextDigits);
    otpInputRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus();
  }

  async function handleVerifyCode() {
    if (!canVerifyCode) {
      return;
    }

    setVerifyingCode(true);
    setFeedback(null);
    onSubmitStart?.();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: verificationPendingEmail,
        token: otpCode,
        type: "signup",
      });

      if (error) {
        const errorKind = classifyOtpError(error.message, (error as { code?: string | null }).code);

        if (errorKind === "expired") {
          setOtpDigits(createEmptyOtpDigits());
          window.requestAnimationFrame(() => {
            otpInputRefs.current[0]?.focus();
          });
        }

        setFeedback({
          tone: "error",
          text: getOtpErrorMessage(errorKind),
        });
        return;
      }

      const legalData = {
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "1.0",
        agreedToTerms: true,
      };

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...(data.user?.user_metadata ?? {}),
          ...legalData,
        },
      });

      if (metadataError) {
        setFeedback({
          tone: "error",
          text: "Verified, but legal acceptance metadata could not be updated. Please retry.",
        });
        return;
      }

      setOtpStage(false);
      setOtpDigits(createEmptyOtpDigits());
      setVerificationPendingEmail("");
      setFeedback({
        tone: "success",
        text: "Verification successful. Redirecting to dashboard...",
      });
      onSuccess?.();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFeedback({
        tone: "error",
        text: getOtpErrorMessage("unknown"),
      });
    } finally {
      setVerifyingCode(false);
      onSubmitEnd?.();
    }
  }

  async function handleResendCode() {
    if (!verificationPendingEmail || resendingCode || verifyingCode) {
      return;
    }

    if (Date.now() < cooldownUntil) {
      setFeedback({
        tone: "error",
        text: "Please wait a moment before requesting a new code.",
      });
      return;
    }

    setResendingCode(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: verificationPendingEmail,
      });

      if (error) {
        setFeedback({
          tone: "error",
          text: "Could not resend verification code right now. Please retry in a moment.",
        });
        return;
      }

      setCooldownUntil(Date.now() + SUBMIT_COOLDOWN_MS);
      setFeedback({
        tone: "success",
        text: "A new 8-digit verification code has been sent.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: "Network issue while resending verification code. Please retry.",
      });
    } finally {
      setResendingCode(false);
    }
  }

  const buttonLabel = mode === "login" ? "Log In" : "Sign Up To Join Waitlist";

  return (
    <section className="w-full max-w-xl border-2 border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 shadow-[8px_8px_0_var(--qx-border)]">
      <h2 className="font-display text-4xl uppercase tracking-[0.08em]">
        {otpStage ? "Verify Code" : mode === "login" ? "Access Console" : "Create Account"}
      </h2>

      {!otpStage && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isBusy}
              className="w-full border-2 border-[var(--qx-border)] bg-[var(--qx-panel)] px-4 py-3 text-sm outline-none transition focus:border-[var(--qx-primary)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              disabled={isBusy}
              className="w-full border-2 border-[var(--qx-border)] bg-[var(--qx-panel)] px-4 py-3 text-sm outline-none transition focus:border-[var(--qx-primary)]"
            />
          </label>

          <label className="flex items-start gap-3 border border-[var(--qx-border)] bg-black/30 p-3 text-sm">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(event) => setAgreeToTerms(event.target.checked)}
              disabled={isBusy}
              className="mt-0.5 h-4 w-4 accent-[var(--qx-primary)]"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms-and-conditions" className="underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          <p className="text-sm text-[var(--qx-muted)]">
            {mode === "login" ? "Don't have acc? " : "Already have acc? "}
            <button
              type="button"
              onClick={() => onModeChange?.(mode === "login" ? "signup" : "login")}
              disabled={isBusy}
              className="underline transition hover:text-[var(--qx-primary)] disabled:cursor-not-allowed disabled:text-zinc-500"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>

          <button
            type="submit"
            disabled={!agreeToTerms || isBusy}
            className={[
              "w-full border-2 px-5 py-3 text-xs uppercase tracking-[0.2em] transition",
              !agreeToTerms || isBusy
                ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                : "border-[var(--qx-primary)] bg-[var(--qx-primary)] text-black hover:bg-[var(--qx-primary-strong)] hover:text-white",
            ].join(" ")}
          >
            {submitting ? "Submitting..." : buttonLabel}
          </button>
        </form>
      )}

      {otpStage && (
        <div className="mt-5 space-y-4 border border-[var(--qx-border)] bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">8-Digit Verification Code</p>
          <p className="text-sm text-[var(--qx-muted)]">
            Enter the code sent to <span className="font-semibold text-[var(--qx-text)]">{verificationPendingEmail}</span>.
          </p>

          <div className="mx-auto grid max-w-[28rem] grid-cols-4 gap-2 sm:grid-cols-8" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, index) => (
              <input
                key={`otp-${index + 1}`}
                ref={(node) => {
                  otpInputRefs.current[index] = node;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`OTP digit ${index + 1}`}
                value={digit}
                onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onFocus={(event) => event.currentTarget.select()}
                disabled={isBusy}
                className="h-12 w-full min-w-0 border-2 border-[var(--qx-border)] bg-[var(--qx-panel)] text-center text-lg font-semibold outline-none transition focus:border-[var(--qx-primary)]"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              void handleVerifyCode();
            }}
            disabled={!canVerifyCode}
            className={[
              "w-full border-2 px-5 py-3 text-xs uppercase tracking-[0.2em] transition",
              !canVerifyCode
                ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                : "border-[var(--qx-primary)] bg-[var(--qx-primary)] text-black hover:bg-[var(--qx-primary-strong)] hover:text-white",
            ].join(" ")}
          >
            {verifyingCode ? "Verifying..." : "Verify Code"}
          </button>

          <div className="flex items-center justify-between gap-3 border border-[var(--qx-border)] bg-black/20 px-3 py-2">
            <p className="text-xs text-[var(--qx-muted)]">Didn&apos;t receive code?</p>
            <button
              type="button"
              onClick={() => {
                void handleResendCode();
              }}
              disabled={resendingCode || isBusy}
              className="border border-[var(--qx-primary)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-cyan-200 transition hover:bg-[var(--qx-primary)]/15 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500"
            >
              {resendingCode ? "Resending..." : "Resend Code"}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className="mt-4 space-y-3">
          <p
            role={feedback.tone === "error" ? "alert" : "status"}
            aria-live="polite"
            className={[
              "border p-3 text-sm",
              feedback.tone === "error"
                ? "border-rose-400/60 bg-rose-500/10 text-rose-200"
                : "border-emerald-400/60 bg-emerald-500/10 text-emerald-200",
            ].join(" ")}
          >
            {feedback.text}
          </p>

        </div>
      )}
    </section>
  );
}