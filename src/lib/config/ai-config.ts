export const USE_MINIMAX_M2_7 = true;
export const USE_GROQ = true;
export const USE_GEMMA_4 = false;
// Deprecated provider route retained for emergency rollback only.
export const USE_CLAUDE_SONNET_4_6 = false;

export type QexurEnvironment = "internal" | "beta" | "enterprise";
export type AiProviderId = "minimax-m2-7" | "groq" | "gemma-4" | "claude-sonnet-4-6";

export const REASONING_FIRST_SYSTEM_PROMPT = [
  "You are Qexur Web Auditor running in reasoning-first mode.",
  "Use Chain-of-Thought reasoning internally before finalizing the vulnerability report.",
  "Run a self-correction pass that challenges weak assumptions and reduces hallucinations.",
  "Return only a concise final report with evidence-backed findings and remediation guidance.",
].join(" ");

export const AUDIT_INTENSITY_DIRECTIVES = {
  "surface-scan": [
    "Run a fast sanity scan focused on 10-20 common vulnerabilities.",
    "Prioritize SQL injection, XSS, auth misconfigurations, and insecure input handling.",
    "Return high-confidence findings that unblock rapid deployment checks.",
  ].join(" "),
  "deep-audit": [
    "Run a production-grade deep audit over 50+ bug and security classes.",
    "Include dead code identification with file and line evidence.",
    "Include crash path analysis for unhandled errors and halt scenarios.",
    "Call out likely performance bottlenecks in API and async flows.",
  ].join(" "),
} as const;

export const DEEP_AUDIT_CHECK_CATALOG = [
  "OWASP A01: Broken Access Control",
  "OWASP A02: Cryptographic Failures",
  "OWASP A03: Injection",
  "OWASP A04: Insecure Design",
  "OWASP A05: Security Misconfiguration",
  "OWASP A06: Vulnerable and Outdated Components",
  "OWASP A07: Identification and Authentication Failures",
  "OWASP A08: Software and Data Integrity Failures",
  "OWASP A09: Security Logging and Monitoring Failures",
  "OWASP A10: Server-Side Request Forgery",
  "SQL Injection",
  "NoSQL Injection",
  "Command Injection",
  "Template Injection",
  "Cross-Site Scripting (Stored)",
  "Cross-Site Scripting (Reflected)",
  "Cross-Site Scripting (DOM)",
  "CSRF gaps",
  "Insecure CORS",
  "Broken session invalidation",
  "Weak password policy",
  "JWT validation flaws",
  "Token leakage in logs",
  "IDOR",
  "Privilege escalation",
  "Mass assignment",
  "Open redirect",
  "Path traversal",
  "Insecure file upload",
  "Unsafe deserialization",
  "Prototype pollution patterns",
  "Rate limit bypass",
  "Brute force exposure",
  "Business logic race conditions",
  "Missing idempotency controls",
  "Unbounded retries",
  "Unhandled promise rejections",
  "Unhandled exceptions",
  "Null dereference risk",
  "Infinite recursion risk",
  "Deadlock risk in lock orchestration",
  "Memory leak risk in long-lived handlers",
  "Event listener leak risk",
  "Timer leak risk",
  "Resource leak (file/socket handles)",
  "Blocking I/O on hot paths",
  "N+1 query patterns",
  "Inefficient pagination",
  "Excessive payload serialization",
  "Synchronous crypto in request path",
  "Cache stampede risk",
  "Missing circuit breakers",
  "Missing timeout guards",
  "Unreachable code branches",
  "Dead feature flags",
  "Unused exports",
  "Orphaned routes",
  "Crash path via unchecked parsing",
  "Crash path via unsafe type narrowing",
  "Crash path via optional chaining misuse",
] as const;

type ProviderBridge = {
  id: AiProviderId;
  enabled: boolean;
  webhookPath: string;
  purpose: string;
};

export const AI_PROVIDER_BRIDGE: Record<AiProviderId, ProviderBridge> = {
  "minimax-m2-7": {
    id: "minimax-m2-7",
    enabled: USE_MINIMAX_M2_7,
    webhookPath: process.env.N8N_WEBHOOK_AI_MINIMAX_M2_7 ?? "/webhook/qexur/ai/minimax-m2-7/reason",
    purpose: "Primary next-gen reasoning profile with self-correction.",
  },
  "groq": {
    id: "groq",
    enabled: USE_GROQ,
    webhookPath: process.env.N8N_WEBHOOK_AI_GROQ ?? "/webhook/qexur/ai/groq/reason",
    purpose: "Fallback reasoning profile for resiliency.",
  },
  "gemma-4": {
    id: "gemma-4",
    enabled: USE_GEMMA_4,
    webhookPath: process.env.N8N_WEBHOOK_AI_GEMMA_4 ?? "/webhook/qexur/ai/gemma-4/reason",
    purpose: "Reserved alternate beta reasoning profile.",
  },
  "claude-sonnet-4-6": {
    id: "claude-sonnet-4-6",
    enabled: USE_CLAUDE_SONNET_4_6,
    webhookPath:
      process.env.N8N_WEBHOOK_AI_CLAUDE_SONNET_4_6 ?? "/webhook/qexur/ai/claude-sonnet-4-6/reason",
    purpose: "Deprecated provider bridge retained only for rollback.",
  },
};

export function resolveReasoningProvider(environment: QexurEnvironment): AiProviderId {
  if (environment === "beta" && USE_MINIMAX_M2_7) {
    return "minimax-m2-7";
  }

  if (environment === "internal" && USE_MINIMAX_M2_7) {
    return "minimax-m2-7";
  }

  if (environment === "enterprise" && USE_MINIMAX_M2_7) {
    return "minimax-m2-7";
  }

  if (environment === "internal" && USE_GROQ) {
    return "groq";
  }

  if (environment === "beta" && USE_GEMMA_4) {
    return "gemma-4";
  }

  if (environment === "enterprise" && USE_CLAUDE_SONNET_4_6) {
    return "claude-sonnet-4-6";
  }

  if (USE_MINIMAX_M2_7) {
    return "minimax-m2-7";
  }

  if (USE_GROQ) {
    return "groq";
  }

  if (USE_GEMMA_4) {
    return "gemma-4";
  }

  if (USE_CLAUDE_SONNET_4_6) {
    return "claude-sonnet-4-6";
  }

  return "minimax-m2-7";
}

export function getAiWebhookPath(environment: QexurEnvironment): string {
  const provider = resolveReasoningProvider(environment);
  return AI_PROVIDER_BRIDGE[provider].webhookPath;
}