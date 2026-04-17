# MiniMax m2.7 Custom HTTP Workflow Migration

This runbook prepares n8n flows to migrate from Anthropic nodes to HTTP Request nodes for MiniMax m2.7.

## Scope

- Replace Anthropic model nodes in Auditor workflows.
- Use HTTP Request nodes targeting MiniMax m2.7.
- Enforce reasoning-first behavior with self-correction before final report output.

## Required Environment

- MiniMax API key in n8n credentials or environment.
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
- URL: MiniMax chat completion endpoint for m2.7
- Headers:
  - Authorization: Bearer <MINIMAX_API_KEY>
  - Content-Type: application/json
- Timeout: 60 seconds
- Retries: 2 with exponential backoff

## Reasoning-First System Prompt

Use this prompt in both passes, with pass-specific user instructions:

You are Qexur Auditor running in reasoning-first mode. Use Chain-of-Thought reasoning internally before finalizing the vulnerability report. Run a self-correction pass that challenges weak assumptions and reduces hallucinations. Return only a concise final report with evidence-backed findings and remediation guidance.

## Pass Design

### Pass 1: Reasoning Pass

Input:
- Source context and scan metadata from webhook payload.
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

Instruction:
- Re-evaluate each finding.
- Drop unsupported claims.
- Downgrade uncertain findings.
- Keep only evidence-backed issues.

Expected output JSON:
- validatedFindings
- droppedFindingsWithReason
- finalSeverityAssessment
- finalRemediationPlan

## Validation Gate Rules

- Reject findings with no evidence anchors.
- Reject reports that skip confidence labels.
- Auto-downgrade to report-only uncertainty message if confidence is low across all findings.

## Compatibility Contract with Backend

Backend payload now includes:
- aiProvider
- aiRoute
- reasoningPolicy
- hallucinationControls

n8n should prioritize payload.reasoningPolicy when present and use the default prompt only when missing.

## Rollback

If MiniMax endpoint fails repeatedly:
- Route to fallback provider workflow path.
- Preserve report-only mode.
- Surface fallback status in job details.
