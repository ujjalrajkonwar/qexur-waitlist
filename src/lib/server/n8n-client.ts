import {
  getAiWebhookPath,
  getOpenRouterTransportConfig,
  REASONING_FIRST_SYSTEM_PROMPT,
  resolveReasoningProvider,
  type QexurEnvironment,
} from "@/lib/config/ai-config";
import type { JobEnvelope } from "@/types/qexur";

type N8nWorkflow =
  | "auditor/scan"
  | "wp-auditor/swap"
  | "destroyer/verify-dns"
  | "destroyer/execute";

type SendToN8nOptions = {
  workflow: N8nWorkflow;
  payload: Record<string, unknown>;
  environment?: QexurEnvironment;
};

type ReasoningPolicy = {
  mode: "reasoning-first";
  transport: "custom-http-request";
  chainOfThoughtDirective: string;
  selfCorrectionEnabled: boolean;
  selfCorrectionPasses: number;
  systemPrompt: string;
  finalOutputDirective: string;
};

const DEFAULT_REASONING_POLICY: ReasoningPolicy = {
  mode: "reasoning-first",
  transport: "custom-http-request",
  chainOfThoughtDirective:
    "Use Chain-of-Thought reasoning internally before producing the final report output.",
  selfCorrectionEnabled: true,
  selfCorrectionPasses: 2,
  systemPrompt: REASONING_FIRST_SYSTEM_PROMPT,
  finalOutputDirective: "Return only the final validated report without internal scratchpad content.",
};

const N8N_WORKFLOW_PATHS: Record<N8nWorkflow, string> = {
  "auditor/scan": process.env.N8N_WEBHOOK_AUDITOR_SCAN ?? "/webhook/qexur/auditor/scan",
  "wp-auditor/swap": process.env.N8N_WEBHOOK_WP_AUDITOR_SWAP ?? "/webhook/qexur/wp-auditor/swap",
  "destroyer/verify-dns":
    process.env.N8N_WEBHOOK_DESTROYER_VERIFY_DNS ?? "/webhook/qexur/destroyer/verify-dns",
  "destroyer/execute": process.env.N8N_WEBHOOK_DESTROYER_EXECUTE ?? "/webhook/qexur/destroyer/execute",
};

const DEFAULT_DESTROYER_BATCH_CONFIG = {
  mode: "async-queue",
  concurrency: 20,
  dispatchStrategy: "parallel",
} as const;

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return undefined;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function sendToN8n(options: SendToN8nOptions): Promise<JobEnvelope> {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  const environment = options.environment ?? "internal";

  const aiProvider = resolveReasoningProvider(environment);
  const n8nRoute = N8N_WORKFLOW_PATHS[options.workflow];
  const aiRoute = getAiWebhookPath(environment);
  const openRouter = getOpenRouterTransportConfig(environment);
  const reasoningPolicy = options.payload.reasoningPolicy ?? DEFAULT_REASONING_POLICY;
  const destroyerDefaults =
    options.workflow === "destroyer/execute"
      ? {
          batchExecution:
            options.payload.batchExecution ?? {
              ...DEFAULT_DESTROYER_BATCH_CONFIG,
            },
          agentPipeline:
            options.payload.agentPipeline ?? {
              agent1: {
                name: "Nuclei",
                source: "n8n-workflow-payload",
                passThrough: "full-json",
                skipRule: {
                  value: "bekar",
                  matchMode: "exact",
                },
              },
              agent2: {
                name: "MiniMax-m2.7",
                provider: "openrouter",
                model: openRouter.model,
              },
            },
        }
      : {};

  const routeIsAbsolute = /^https?:\/\//i.test(n8nRoute);

  if (!routeIsAbsolute && !baseUrl) {
    return {
      jobId: crypto.randomUUID(),
      status: "queued",
      nextStep: "Configure N8N_BASE_URL to activate webhook forwarding.",
      n8nRoute,
      details: `Dry-run payload accepted. Planned AI route: ${aiRoute} (${aiProvider}) via ${openRouter.baseUrl}.`,
      executedAttacks: 0,
      totalAttacks: 0,
    };
  }

  const url = routeIsAbsolute ? n8nRoute : `${normalizeBaseUrl(baseUrl as string)}${n8nRoute}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-qexur-n8n-key": apiKey } : {}),
    },
    body: JSON.stringify({
      ...options.payload,
      ...destroyerDefaults,
      aiRoute,
      aiProvider,
      reasoningPolicy,
      openRouter,
      environment,
      sentAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return {
      jobId: crypto.randomUUID(),
      status: "failed",
      nextStep: "Inspect n8n workflow health and webhook auth settings.",
      n8nRoute,
      details: `n8n returned ${response.status} ${response.statusText}`,
      executedAttacks: 0,
      totalAttacks: 0,
    };
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  return {
    jobId: String(data.jobId ?? crypto.randomUUID()),
    status: (data.status as JobEnvelope["status"]) ?? "queued",
    nextStep: String(data.nextStep ?? "Monitor workflow in n8n execution history."),
    n8nRoute,
    details: String(data.details ?? "Webhook accepted by n8n."),
    executedAttacks: coerceNumber(data.executedAttacks ?? data.executed ?? data.completed),
    totalAttacks: coerceNumber(data.totalAttacks ?? data.total ?? data.targetCount),
  };
}