import type { User } from "@supabase/supabase-js";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class ComplianceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(request?: Request): string | null {
  if (!request) {
    return null;
  }

  const header = request.headers.get("authorization");

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireAuthenticatedUser(request?: Request): Promise<User> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new ComplianceError(
      "Supabase environment variables are missing. Configure auth before executing this route.",
      503,
    );
  }

  const bearerToken = getBearerToken(request);
  const { data, error } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (error || !data.user) {
    throw new ComplianceError("Unauthorized request.", 401);
  }

  return data.user;
}

export function hasAcceptedTerms(user: User): boolean {
  const acceptedAt = user.user_metadata?.termsAcceptedAt;
  return Boolean(acceptedAt);
}

export function assertTermsAccepted(user: User) {
  if (!hasAcceptedTerms(user)) {
    throw new ComplianceError(
      "Terms and Conditions acceptance required before running security workflows.",
      403,
    );
  }
}

function parseTrialScansUsed(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

export function getTrialScansUsed(user: User): number {
  return parseTrialScansUsed(user.user_metadata?.trialScansUsed);
}

export function assertTrialRemaining(user: User) {
  if (getTrialScansUsed(user) >= 1) {
    throw new ComplianceError("Free Beta trial already used. Join waitlist for extended access.", 402);
  }
}

export async function markTrialScanConsumed(user: User) {
  if (getTrialScansUsed(user) >= 1) {
    return;
  }

  const admin = createSupabaseServiceRoleClient();

  if (!admin) {
    throw new ComplianceError("Trial enforcement is unavailable right now. Try again shortly.", 503);
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      trialScansUsed: 1,
      trialConsumedAt: new Date().toISOString(),
    },
  });

  if (error) {
    throw new ComplianceError(`Unable to persist trial usage: ${error.message}`, 503);
  }
}

export function assertDestroyerGuards(input: { dnsVerified: boolean; riskAccepted: boolean }) {
  if (!input.dnsVerified) {
    throw new ComplianceError("Destroyer requires DNS TXT verification first.", 403);
  }

  if (!input.riskAccepted) {
    throw new ComplianceError("Destroyer requires explicit risk acceptance.", 403);
  }
}