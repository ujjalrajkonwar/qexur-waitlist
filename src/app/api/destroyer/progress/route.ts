import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { ComplianceError, requireAuthenticatedUser } from "@/lib/server/compliance";
import {
  getDestroyerProgress,
  subscribeDestroyerProgress,
  upsertDestroyerProgress,
  type DestroyerProgressSnapshot,
} from "@/lib/server/destroyer-progress-store";
import {
  destroyerProgressWebhookSchema,
  type DestroyerProgressWebhookPayload,
} from "@/lib/validation/schemas";
import type { JobEnvelope } from "@/types/qexur";

export const runtime = "nodejs";

type ProgressSnapshot = Pick<JobEnvelope, "jobId" | "status" | "nextStep" | "details"> & {
  executedAttacks: number;
  totalAttacks: number;
};

const STREAM_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const STREAM_HEARTBEAT_MS = 15 * 1000;

function isTerminalStatus(status: JobEnvelope["status"]): boolean {
  return status === "completed" || status === "failed";
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getProgressWebhookSecret(): string {
  const configuredSecret = process.env.N8N_PROGRESS_WEBHOOK_SECRET ?? process.env.N8N_API_KEY;

  if (!configuredSecret) {
    throw new ComplianceError(
      "Missing N8N_PROGRESS_WEBHOOK_SECRET (or N8N_API_KEY) required for progress webhook authentication.",
      503,
    );
  }

  return configuredSecret;
}

function getBearerSecret(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function assertWebhookAuthorized(request: Request) {
  const configuredSecret = getProgressWebhookSecret();
  const incomingSecret =
    request.headers.get("x-qexur-progress-key") ?? request.headers.get("x-qexur-n8n-key") ?? getBearerSecret(request);

  if (!incomingSecret || !safeEquals(incomingSecret, configuredSecret)) {
    throw new ComplianceError("Unauthorized progress webhook sender.", 401);
  }
}

function toPublicSnapshot(snapshot: DestroyerProgressSnapshot): ProgressSnapshot {
  return {
    jobId: snapshot.jobId,
    status: snapshot.status,
    nextStep: snapshot.nextStep,
    details: snapshot.details,
    executedAttacks: snapshot.executedAttacks,
    totalAttacks: snapshot.totalAttacks,
  };
}

function createQueuedSnapshot(jobId: string): ProgressSnapshot {
  return {
    jobId,
    status: "queued",
    nextStep: "Awaiting first progress update from orchestrator.",
    details: "SSE stream connected. Waiting for n8n progress webhook updates.",
    executedAttacks: 0,
    totalAttacks: 0,
  };
}

function normalizeProgressPayload(payload: DestroyerProgressWebhookPayload): DestroyerProgressSnapshot {
  const totalAttacks = Math.max(0, Math.trunc(payload.totalAttacks));
  let executedAttacks = Math.max(0, Math.trunc(payload.executedAttacks));

  if (totalAttacks > 0) {
    executedAttacks = Math.min(executedAttacks, totalAttacks);
  }

  if (payload.status === "completed" && totalAttacks > 0) {
    executedAttacks = totalAttacks;
  }

  const defaultNextStepByStatus: Record<JobEnvelope["status"], string> = {
    queued: "Attack queue accepted and waiting for workers.",
    running: "Executing async attack workers.",
    completed: "Attack queue completed.",
    failed: "Attack queue execution failed.",
  };

  const defaultDetailsByStatus: Record<JobEnvelope["status"], string> = {
    queued: "Progress update received from n8n.",
    running: "Progress update received from n8n.",
    completed: "All attack batches completed.",
    failed: "At least one attack batch failed.",
  };

  return {
    jobId: payload.jobId,
    status: payload.status,
    nextStep: payload.nextStep ?? defaultNextStepByStatus[payload.status],
    details: payload.details ?? defaultDetailsByStatus[payload.status],
    executedAttacks,
    totalAttacks,
    userId: payload.userId,
    updatedAt: payload.sentAt ?? new Date().toISOString(),
  };
}

function formatSseEvent(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId")?.trim();

    if (!jobId) {
      return NextResponse.json({ error: "jobId query parameter is required." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const viewerUserId = user.id;
    let cleanup: (() => void) | undefined;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let streamClosed = false;
        let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
        let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
        let unsubscribe: (() => void) | undefined;

        const closeStream = () => {
          if (streamClosed) {
            return;
          }

          streamClosed = true;

          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = undefined;
          }

          if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = undefined;
          }

          if (unsubscribe) {
            unsubscribe();
            unsubscribe = undefined;
          }

          try {
            controller.close();
          } catch {
            // Controller may already be closed when cancellation races with terminal events.
          }
        };

        cleanup = closeStream;

        const resetInactivityTimeout = () => {
          if (inactivityTimer) {
            clearTimeout(inactivityTimer);
          }

          inactivityTimer = setTimeout(() => {
            if (streamClosed) {
              return;
            }

            emit("error", {
              jobId,
              message: "Progress stream timed out waiting for webhook updates.",
            });
            closeStream();
          }, STREAM_INACTIVITY_TIMEOUT_MS);
        };

        const emit = (event: string, payload: unknown) => {
          if (streamClosed) {
            return;
          }

          try {
            controller.enqueue(encoder.encode(formatSseEvent(event, payload)));
          } catch {
            closeStream();
          }
        };

        const emitSnapshot = (snapshot: DestroyerProgressSnapshot) => {
          if (snapshot.userId && snapshot.userId !== viewerUserId) {
            emit("error", {
              jobId,
              message: "Unauthorized progress stream access for this job.",
            });
            closeStream();
            return;
          }

          const publicSnapshot = toPublicSnapshot(snapshot);
          emit("progress", publicSnapshot);
          resetInactivityTimeout();

          if (isTerminalStatus(publicSnapshot.status)) {
            emit("done", publicSnapshot);
            closeStream();
          }
        };

        emit("ready", {
          jobId,
          mode: "webhook-push",
          heartbeatMs: STREAM_HEARTBEAT_MS,
        });

        const existingSnapshot = getDestroyerProgress(jobId);

        if (existingSnapshot) {
          emitSnapshot(existingSnapshot);
        } else {
          emit("progress", createQueuedSnapshot(jobId));
        }

        if (streamClosed) {
          return;
        }

        unsubscribe = subscribeDestroyerProgress(jobId, (snapshot) => {
          emitSnapshot(snapshot);
        });

        heartbeatTimer = setInterval(() => {
          if (streamClosed) {
            return;
          }

          try {
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
          } catch {
            closeStream();
          }
        }, STREAM_HEARTBEAT_MS);

        resetInactivityTimeout();
      },
      cancel() {
        cleanup?.();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to open destroyer progress stream." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    assertWebhookAuthorized(request);

    const payload = destroyerProgressWebhookSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        {
          error: "Invalid destroyer progress payload.",
          issues: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const snapshot = upsertDestroyerProgress(normalizeProgressPayload(payload.data));
    const responsePayload = toPublicSnapshot(snapshot);

    return NextResponse.json({
      accepted: true,
      ...responsePayload,
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to process destroyer progress webhook." }, { status: 500 });
  }
}
