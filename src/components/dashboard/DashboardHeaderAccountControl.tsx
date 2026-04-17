"use client";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthWallModal } from "@/components/modals/AuthWallModal";
import { ProfileAccountModal } from "@/components/modals/ProfileAccountModal";
import { WaitlistModal } from "@/components/modals/WaitlistModal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

function getEmailDisplayName(email: string | null): string {
  const local = email?.split("@")[0] ?? "Operator";
  const normalized = local.replace(/[._-]+/g, " ").trim();

  if (!normalized) {
    return "Operator";
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getEmailInitials(email: string | null): string {
  const local = email?.split("@")[0] ?? "qx";
  const normalized = local.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const pieces = normalized.split(" ").filter(Boolean);

  if (pieces.length === 0) {
    return "QX";
  }

  if (pieces.length === 1) {
    return pieces[0].slice(0, 2).toUpperCase();
  }

  return `${pieces[0]?.charAt(0) ?? "Q"}${pieces[1]?.charAt(0) ?? "X"}`.toUpperCase();
}

export function DashboardHeaderAccountControl() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileStatusMessage, setProfileStatusMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      try {
        const { data } = await supabase.auth.getUser();

        if (active) {
          setUser(data.user ?? null);
        }
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    }

    void hydrateSession();

    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const email = user?.email ?? "Account";
  const displayName = useMemo(() => getEmailDisplayName(user?.email ?? null), [user?.email]);
  const initials = useMemo(() => getEmailInitials(user?.email ?? null), [user?.email]);

  async function handleSignOutAction() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setProfileStatusMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setProfileStatusMessage("Sign out failed. Please retry.");
        return;
      }

      setShowProfileModal(false);
      router.refresh();
    } catch {
      setProfileStatusMessage("Sign out failed. Please retry.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleManageAccountAction() {
    setProfileStatusMessage("");
    setShowProfileModal(false);
    router.push("/dashboard");
  }

  function handleAddAccountAction() {
    setProfileStatusMessage("");
    setShowProfileModal(false);
    setAuthModalMode("signup");
    setShowAuthModal(true);
  }

  return (
    <>
      <div className="flex items-center justify-end">
        {!authReady && (
          <div className="h-12 w-44 animate-pulse rounded-full border border-[var(--qx-border)] bg-[var(--qx-panel)]/70" />
        )}

        {authReady && !user && (
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setShowWaitlistModal(true);
              }}
              className="inline-flex items-center rounded-full border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/15"
            >
              Join Waitlist
            </button>
          </div>
        )}

        {authReady && user && (
          <button
            type="button"
            onClick={() => {
              setProfileStatusMessage("");
              setShowProfileModal(true);
            }}
            aria-label="Open profile menu"
            className="group rounded-md border border-transparent p-0.5 transition hover:border-[var(--qx-border)]"
          >
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#d2a7ff] via-[#8f5bcf] to-[#5a3b8f] text-sm font-bold uppercase text-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
              {initials}
              <span className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#11161e] bg-[var(--qx-success)]" />
            </span>
          </button>
        )}
      </div>

      <AuthWallModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      <WaitlistModal
        open={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onConfirm={() => {
          setShowWaitlistModal(false);
          setAuthModalMode("signup");
          setShowAuthModal(true);
        }}
      />

      <ProfileAccountModal
        open={showProfileModal}
        email={email}
        initials={initials}
        displayName={displayName}
        signOutPending={isSigningOut}
        statusMessage={profileStatusMessage}
        onCloseAction={() => {
          if (isSigningOut) {
            return;
          }

          setShowProfileModal(false);
          setProfileStatusMessage("");
        }}
        onManageAccountAction={handleManageAccountAction}
        onAddAccountAction={handleAddAccountAction}
        onSignOutAction={() => {
          void handleSignOutAction();
        }}
      />
    </>
  );
}
