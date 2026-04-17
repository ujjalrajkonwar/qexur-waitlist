import { NextResponse } from "next/server";

import {
  assertDestroyerGuards,
  assertTermsAccepted,
  assertTrialRemaining,
  ComplianceError,
  markTrialScanConsumed,
  requireAuthenticatedUser,
} from "@/lib/server/compliance";
import { sendToN8n } from "@/lib/server/n8n-client";
import { destroyerExecuteSchema } from "@/lib/validation/schemas";

const ATTACK_LAYER_PROFILE = {
  surface: {
    phases: ["Surface Recon", "External Exposure Probe"],
    vectorProfile: "15+ Common External Probes",
  },
  destroyer: {
    phases: ["API Attack Graph", "Web Logic Infiltration", "Auth Boundary Evasion"],
    vectorProfile: "100+ API + Web Logic Attacks",
  },
  "super-destroyer": {
    phases: ["Full Vector Mapping", "Cloud Configuration Exploitation", "Supply Chain Pressure Test"],
    vectorProfile: "350+ Full Vector Mapping",
  },
} as const;

export async function POST(request: Request) {
  try {
    const payload = destroyerExecuteSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid Destroyer execution payload." }, { status: 400 });
    }

    const user = await requireAuthenticatedUser(request);
    assertTermsAccepted(user);
    assertTrialRemaining(user);
    assertDestroyerGuards({
      dnsVerified: payload.data.dnsVerified,
      riskAccepted: payload.data.riskAccepted,
    });

    const selectedProfile = ATTACK_LAYER_PROFILE[payload.data.attackLayer];

    const job = await sendToN8n({
      workflow: "destroyer/execute",
      payload: {
        ...payload.data,
        userId: user.id,
        phases: selectedProfile.phases,
        vectorProfile: selectedProfile.vectorProfile,
        reportType: "Proof of Concept Report",
        autoFix: false,
      },
    });

    await markTrialScanConsumed(user);

    return NextResponse.json({
      ...job,
      warningAcknowledged: true,
      message: `Destroyer execution dispatched with ${payload.data.attackLayer} profile. No auto-fix is performed for this feature.`,
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Destroyer launch failed." }, { status: 500 });
  }
}