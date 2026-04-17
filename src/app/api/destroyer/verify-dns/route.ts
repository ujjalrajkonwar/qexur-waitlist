import { resolveTxt } from "node:dns/promises";

import { NextResponse } from "next/server";

import {
  assertTermsAccepted,
  assertTrialRemaining,
  ComplianceError,
  requireAuthenticatedUser,
} from "@/lib/server/compliance";
import { sendToN8n } from "@/lib/server/n8n-client";
import { destroyerDnsVerifySchema } from "@/lib/validation/schemas";

function getDomainFromTargetUrl(targetUrl: string): string | null {
  try {
    return new URL(targetUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function hasMatchingTxtRecord(domain: string, expectedToken: string): Promise<boolean> {
  const normalizedToken = expectedToken.trim();

  if (!domain || !normalizedToken) {
    return false;
  }

  const hostsToCheck = [`_qexur-beta.${domain}`, domain];

  for (const host of hostsToCheck) {
    try {
      const records = await resolveTxt(host);
      const flattenedValues = records.map((chunks) => chunks.join("").trim());

      if (flattenedValues.some((value) => value === normalizedToken)) {
        return true;
      }
    } catch {
      // Continue to fallback host if TXT records are missing or not propagated yet.
    }
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const payload = destroyerDnsVerifySchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json({ verified: false, message: "Invalid DNS verification request." }, { status: 400 });
    }

    const user = await requireAuthenticatedUser(request);
    assertTermsAccepted(user);
    assertTrialRemaining(user);

    const targetDomain = getDomainFromTargetUrl(payload.data.targetUrl);
    const looksVerified = targetDomain
      ? await hasMatchingTxtRecord(targetDomain, payload.data.dnsTxtRecord)
      : false;

    const job = await sendToN8n({
      workflow: "destroyer/verify-dns",
      payload: {
        ...payload.data,
        userId: user.id,
        verified: looksVerified,
      },
    });

    if (!looksVerified) {
      return NextResponse.json(
        {
          verified: false,
          message:
            "DNS TXT verification failed. Publish an exact TXT value match on _qexur-beta.<domain> (or root domain) and wait for propagation.",
          ...job,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      verified: true,
      message: "DNS TXT verification accepted.",
      ...job,
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ verified: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ verified: false, message: "Destroyer DNS verification failed." }, { status: 500 });
  }
}