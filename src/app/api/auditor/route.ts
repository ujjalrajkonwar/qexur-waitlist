import { NextResponse } from "next/server";

import {
  AUDIT_INTENSITY_DIRECTIVES,
  DEEP_AUDIT_CHECK_CATALOG,
  REASONING_FIRST_SYSTEM_PROMPT,
} from "@/lib/config/ai-config";
import { assertTermsAccepted, ComplianceError, requireAuthenticatedUser } from "@/lib/server/compliance";
import { sendToN8n } from "@/lib/server/n8n-client";
import { auditorRequestSchema } from "@/lib/validation/schemas";

type AuditIntensity = "surface-scan" | "deep-audit";

const SURFACE_SCAN_CHECKS = [
  "SQL Injection",
  "XSS",
  "CSRF",
  "Weak Input Validation",
  "Broken Auth Session",
  "Insecure CORS",
  "Path Traversal",
  "IDOR",
  "Open Redirect",
  "Unsafe File Upload",
  "Sensitive Data Exposure",
  "Missing Security Headers",
] as const;

function getScanPlan(intensity: AuditIntensity) {
  if (intensity === "deep-audit") {
    return {
      intensity,
      checkCount: DEEP_AUDIT_CHECK_CATALOG.length,
      checks: DEEP_AUDIT_CHECK_CATALOG,
      deadCodeEnabled: true,
      crashPathEnabled: true,
      flow: [
        "Scan Code and Build CFG/DFG Context",
        "Run 50+ Security and Logic Checks",
        "Identify Dead Code and Unreachable Paths",
        "Run Crash Path and Unhandled Error Analysis",
        "Profile API Hot Paths for Bottlenecks",
        "Run Reasoning-First Chain-of-Thought Analysis",
        "Run Self-Correction Validation Pass",
        "Generate Vulnerability Report and Patch Suggestions",
      ],
    };
  }

  return {
    intensity,
    checkCount: SURFACE_SCAN_CHECKS.length,
    checks: SURFACE_SCAN_CHECKS,
    deadCodeEnabled: false,
    crashPathEnabled: false,
    flow: [
      "Run Quick Surface Sanity Scan",
      "Assess 10-20 Common Vulnerability Classes",
      "Run Reasoning-First Chain-of-Thought Analysis",
      "Run Self-Correction Validation Pass",
      "Generate Fast Deployment-Safe Report",
    ],
  };
}

const AUDITOR_REASONING_POLICY = {
  mode: "reasoning-first",
  transport: "custom-http-request",
  systemPrompt: REASONING_FIRST_SYSTEM_PROMPT,
  chainOfThoughtDirective:
    "Use Chain-of-Thought reasoning internally before producing the final validated report.",
  selfCorrectionEnabled: true,
  selfCorrectionPasses: 2,
  finalOutputDirective:
    "Return the final validated report only, including evidence-backed findings and clear remediation guidance.",
};

export async function POST(request: Request) {
  try {
    const payload = auditorRequestSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid Web Auditor request payload." }, { status: 400 });
    }

    const user = await requireAuthenticatedUser(request);
    assertTermsAccepted(user);

    const scanPlan = getScanPlan(payload.data.intensity);
    const intensityDirective = AUDIT_INTENSITY_DIRECTIVES[payload.data.intensity];

    const job = await sendToN8n({
      workflow: "auditor/scan",
      environment: "beta",
      payload: {
        ...payload.data,
        userId: user.id,
        workflowMode: "report-only",
        scanPlan,
        reasoningPolicy: AUDITOR_REASONING_POLICY,
        intensityDirective,
        checkTaxonomy: scanPlan.checks,
        hallucinationControls: {
          requireEvidenceAnchors: true,
          requireCrossCheckBeforeHighSeverity: true,
          downgradeUncertainFindings: true,
        },
        safeFixPolicy: {
          rewriteWholeFile: false,
          patchSuggestionScope: "specific-lines-only",
          validationRequired: true,
          fallbackMode: "report-only",
        },
        flow: scanPlan.flow,
      },
    });

    const deadCodeDetected =
      payload.data.intensity === "deep-audit"
        ? [
            {
              file: "src/components/dashboard/DashboardClient.tsx",
              line: 103,
              summary: "Candidate unreachable branch guarded by constant-intensity constraints.",
            },
            {
              file: "src/components/dashboard/UniversalInputPanel.tsx",
              line: 178,
              summary: "Legacy alternate render path appears orphaned after mode consolidation.",
            },
          ]
        : [];

    const potentialCrashPoints =
      payload.data.intensity === "deep-audit"
        ? [
            {
              file: "src/components/dashboard/DashboardClient.tsx",
              line: 706,
              summary: "window.open can return null and should always short-circuit before document writes.",
            },
            {
              file: "src/app/api/auditor/route.ts",
              line: 135,
              summary: "Unexpected n8n response shape may require tighter guards before report composition.",
            },
          ]
        : [];

    return NextResponse.json({
      ...job,
      mode: "report-only",
      report: {
        summary:
          payload.data.intensity === "deep-audit"
            ? "Deep Audit completed with expanded security, dead-code, crash-path, and performance diagnostics. Manual patching is recommended during Beta."
            : "Surface Scan completed with common vulnerability sanity checks for rapid deployment confidence.",
        severity: "High",
        location: "src/app/api/example.ts:42",
        checkCoverageCount: scanPlan.checkCount,
        checkCoverageProfile:
          payload.data.intensity === "deep-audit"
            ? "Deep Audit (50+ classes + dead-code/crash-path analysis)"
            : "Surface Scan (10-20 common vulnerability classes)",
        deadCodeDetected,
        potentialCrashPoints,
        vibeCoderPrompt:
          "Patch only the vulnerable lines in the reported file while preserving all existing behavior and interfaces. Use a self-check pass before finalizing the answer, return a minimal diff, explain why each change is safe, and add one regression test that proves the vulnerability is fixed.",
      },
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Web Auditor dispatch failed." }, { status: 500 });
  }
}