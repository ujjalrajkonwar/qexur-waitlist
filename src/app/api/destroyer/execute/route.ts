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

const SUPER_DESTROYER_AUTONOMOUS_SQUAD = {
  name: "super-destroyer-autonomous-squad",
  agents: [
    {
      codename: "Recon Ghost",
      role: "attack-surface-reconnaissance",
      objective: "Map external services, trust boundaries, and cloud exposure signals before exploitation.",
    },
    {
      codename: "Payload Sniper",
      role: "precision-exploitation",
      objective: "Execute adaptive payload chains against high-value vectors with strict blast-radius controls.",
    },
    {
      codename: "Shadow Reporter",
      role: "evidence-and-reporting",
      objective: "Capture reproducible proof, timeline artifacts, and prioritized remediation intelligence.",
    },
  ],
  orchestration: "sequential-handoff-with-feedback-loop",
} as const;

const DESTROYER_BATCH_CONCURRENCY = 20;
const NUCLEI_SKIP_TOKEN = "bekar";
const DESTROYER_PROGRESS_WEBHOOK_PATH = "/api/destroyer/progress";
const DESTROYER_PROGRESS_WEBHOOK_AUTH_HEADER = "x-qexur-progress-key";

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
    const usesManualCustomVectors = Boolean(payload.data.entryPointIds && payload.data.entryPointIds.length > 0);
    const usesAutonomousSuperDestroyerSquad =
      payload.data.attackLayer === "super-destroyer" && !usesManualCustomVectors;
    const requestOrigin = new URL(request.url).origin;
    const progressWebhookUrl =
      process.env.QEXUR_PROGRESS_WEBHOOK_URL ?? `${requestOrigin}${DESTROYER_PROGRESS_WEBHOOK_PATH}`;

    const job = await sendToN8n({
      workflow: "destroyer/execute",
      payload: {
        ...payload.data,
        userId: user.id,
        phases: selectedProfile.phases,
        vectorProfile: selectedProfile.vectorProfile,
        reportType: "Proof of Concept Report",
        autoFix: false,
        executionProfile: usesManualCustomVectors ? "manual-custom-vectors" : "preset-layer-profile",
        agentPipeline: {
          agent1: {
            name: "Nuclei",
            source: "n8n-workflow-payload",
            passThrough: "full-json",
            filtering: {
              mode: "exact-token-skip-only",
              skipValue: NUCLEI_SKIP_TOKEN,
            },
          },
          agent2: {
            name: "MiniMax-m2.7",
            provider: "openrouter",
            objective: "Generate custom exploit payload for each valid target from Agent 1 output.",
          },
        },
        nucleiPassThroughPolicy: {
          passEntireJsonToAgent2: true,
          skipOnlyExactToken: NUCLEI_SKIP_TOKEN,
        },
        batchExecution: {
          mode: "async-queue",
          concurrency: DESTROYER_BATCH_CONCURRENCY,
          dispatchStrategy: "parallel",
        },
        progress: {
          transport: "sse",
          counterLabel: "Attacks Executed",
          webhookReceiver: {
            url: progressWebhookUrl,
            method: "POST",
            authHeader: DESTROYER_PROGRESS_WEBHOOK_AUTH_HEADER,
          },
          responseContract: {
            requiredFields: ["jobId", "status", "executedAttacks", "totalAttacks"],
          },
        },
        ...(usesAutonomousSuperDestroyerSquad ? { autonomousSquad: SUPER_DESTROYER_AUTONOMOUS_SQUAD } : {}),
      },
    });

    await markTrialScanConsumed(user);

    return NextResponse.json({
      ...job,
      warningAcknowledged: true,
      message: `Destroyer execution dispatched with ${payload.data.attackLayer} profile (${usesManualCustomVectors ? "manual custom vectors" : "preset layer"}), exact '${NUCLEI_SKIP_TOKEN}' skip rule, and async queue concurrency ${DESTROYER_BATCH_CONCURRENCY}. No auto-fix is performed for this feature.`,
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Destroyer launch failed." }, { status: 500 });
  }
}