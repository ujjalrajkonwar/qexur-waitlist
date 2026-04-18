# MiniMax m2.7 OpenRouter Workflow Migration

This runbook prepares n8n flows to run Agent 2 through OpenRouter using MiniMax m2.7 while preserving the reasoning-first two-pass pattern.

## Scope

- Keep Agent 1 (Nuclei) output intact and pass the full JSON payload into Agent 2.
- Use HTTP Request nodes targeting OpenRouter with MiniMax m2.7 as primary model.
- Enforce reasoning-first behavior with self-correction before final report output.
- Execute payload generation in async batches for high-volume target sets (500+ lines).

## Required Environment

- OpenRouter API key in n8n credentials or environment.
- OpenRouter base URL available to workflow nodes:
  - https://openrouter.ai/api/v1
- Webhook route configured in application environment:
  - N8N_WEBHOOK_AI_MINIMAX_M2_7=/webhook/qexur/ai/minimax-m2-7/reason

## Node Migration Pattern

1. Keep existing inbound webhook trigger node.
2. Replace Anthropic node with HTTP Request node named Reasoning Pass.
3. Add a second HTTP Request node named Self-Correction Pass.
4. Add a validation node that rejects malformed output or unsupported severity claims.
5. Forward validated payload to existing report assembly/output nodes.

## HTTP Request Node Template

- Method: POST
- URL: https://openrouter.ai/api/v1/chat/completions
- Headers:
  - Authorization: Bearer <OPENROUTER_API_KEY>
  - Content-Type: application/json
  - X-Title: Qexur AI
- Timeout: 60 seconds
- Retries: 2 with exponential backoff

Recommended model payload field:
- model: minimax/minimax-m2.7-chat

## Reasoning-First System Prompt

Use this prompt in both passes, with pass-specific user instructions:

You are Qexur Auditor running in reasoning-first mode. Use Chain-of-Thought reasoning internally before finalizing the vulnerability report. Run a self-correction pass that challenges weak assumptions and reduces hallucinations. Return only a concise final report with evidence-backed findings and remediation guidance.

## Pass Design

### Pass 1: Reasoning Pass

Input:
- Source context and scan metadata from webhook payload.
- Full Agent 1 Nuclei JSON payload from backend contract.
- Reasoning policy metadata from backend payload.

Expected output JSON:
- findings: array of candidate vulnerabilities
- evidence: file and line references where available
- confidence: high, medium, low per finding
- remediationIdeas: concise patch guidance

### Pass 2: Self-Correction Pass

Input:
- Full output of pass 1
- Original scan context
- Full Agent 1 Nuclei JSON payload

Instruction:
- Re-evaluate each finding.
- Keep severity context from Agent 1 payload.
- Do not prune Agent 1 payload globally.
- Skip only entries where risk token is exactly `bekar`.

Expected output JSON:
- validatedFindings
- droppedFindingsWithReason
- finalSeverityAssessment
- finalRemediationPlan

## Validation Gate Rules

- Preserve complete Agent 1 JSON structure in downstream nodes.
- Do not apply global informational/low/no-risk filtering.
- Skip only exact `bekar` entries before Agent 2 payload generation.

## Async Batch Processing

- Use Split In Batches (or equivalent queue node) to distribute targets.
- Concurrency target: 20 workers.
- Each worker should run MiniMax m2.7 payload generation independently.
- Aggregate results after worker completion to build final attack report.

Suggested execution contract from backend payload:
- batchExecution.mode = async-queue
- batchExecution.concurrency = 20
- batchExecution.dispatchStrategy = parallel

## SSE Progress Event Contract

Emit progress updates so the dashboard can render live counter text:
- Attacks Executed: x/x

Recommended event payload shape:
{
  "jobId": "string",
  "status": "queued|running|completed|failed",
  "nextStep": "string",
  "details": "string",
  "executedAttacks": 0,
  "totalAttacks": 0
}

Emit on each batch completion and emit terminal event at completed/failed.

## Next.js Receiver Wiring

Next.js now expects push updates from n8n to this webhook receiver:
- POST /api/destroyer/progress

Authentication header expected by Next.js receiver:
- x-qexur-progress-key: <N8N_PROGRESS_WEBHOOK_SECRET>

Accepted payload (required fields):
- jobId
- status
- executedAttacks
- totalAttacks

Optional payload fields:
- nextStep
- details
- userId
- sentAt (ISO datetime)

### n8n "Respond to Webhook" Node (Initial Execute Acknowledgement)

Use this JSON body in your `Respond to Webhook` node so `/api/destroyer/execute` receives a compatible initial envelope:

{
  "jobId": "={{$json.jobId ?? $execution.id}}",
  "status": "queued",
  "nextStep": "Attack queue accepted and waiting for workers.",
  "details": "Destroyer execution accepted by n8n. Progress updates will stream via webhook push.",
  "executedAttacks": 0,
  "totalAttacks": "={{Number($json.totalAttacks ?? $json.targetCount ?? 0)}}"
}

### n8n HTTP Request Node (Progress Relay -> Next.js)

For each batch completion/progress tick, send a POST request to `{{$json.progress.webhookReceiver.url}}` with:

Headers:
- Content-Type: application/json
- x-qexur-progress-key: {{$env.N8N_PROGRESS_WEBHOOK_SECRET}}

Body:

{
  "jobId": "={{$json.jobId}}",
  "status": "={{$json.status}}",
  "nextStep": "={{$json.nextStep}}",
  "details": "={{$json.details}}",
  "executedAttacks": "={{Number($json.executedAttacks ?? $json.completed ?? 0)}}",
  "totalAttacks": "={{Number($json.totalAttacks ?? $json.targetCount ?? 0)}}",
  "userId": "={{$json.userId}}",
  "sentAt": "={{$now.toISO()}}"
}

Status value must be exactly one of:
- queued
- running
- completed
- failed

## Compatibility Contract with Backend

Backend payload now includes:
- aiProvider
- aiRoute
- openRouter
- reasoningPolicy
- hallucinationControls
- agentPipeline
- nucleiPassThroughPolicy
- batchExecution
- progress

n8n should prioritize payload.reasoningPolicy when present and use the default prompt only when missing.

## Rollback

If MiniMax endpoint fails repeatedly:
- Route to fallback provider workflow path.
- Preserve report-only mode.
- Surface fallback status in job details.
