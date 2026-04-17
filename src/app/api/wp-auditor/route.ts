import { NextResponse } from "next/server";

import {
  assertTermsAccepted,
  assertTrialRemaining,
  ComplianceError,
  markTrialScanConsumed,
  requireAuthenticatedUser,
} from "@/lib/server/compliance";
import { sendToN8n } from "@/lib/server/n8n-client";
import { wpAuditorRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const payload = wpAuditorRequestSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid App Auditor request payload." }, { status: 400 });
    }

    const user = await requireAuthenticatedUser(request);
    assertTermsAccepted(user);
    assertTrialRemaining(user);

    const flow =
      payload.data.intensity === "deep-audit"
        ? [
            "Deep SaaS Surface Scan",
            "Distributed Logic Threat Modeling",
            "Dead Code and Unreachable Path Detection",
            "Crash Path and Unhandled Error Analysis",
            "Generate Security Report",
          ]
        : [
            "Surface SaaS Sanity Scan",
            "Common Vulnerability Sweep (10-20)",
            "Generate Security Report",
          ];

    const job = await sendToN8n({
      workflow: "wp-auditor/swap",
      payload: {
        ...payload.data,
        userId: user.id,
        flow,
        reportProfile:
          payload.data.intensity === "deep-audit"
            ? "Deep Audit (50+ classes + dead-code/crash-path analysis)"
            : "Surface Scan (10-20 common classes)",
      },
    });

    await markTrialScanConsumed(user);

    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "App Auditor dispatch failed." }, { status: 500 });
  }
}