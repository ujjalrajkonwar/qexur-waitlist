import { EventEmitter } from "node:events";

import type { JobEnvelope } from "@/types/qexur";

type DestroyerProgressStatus = JobEnvelope["status"];

export type DestroyerProgressSnapshot = {
  jobId: string;
  status: DestroyerProgressStatus;
  nextStep: string;
  details: string;
  executedAttacks: number;
  totalAttacks: number;
  userId?: string;
  updatedAt: string;
};

type DestroyerProgressStore = {
  snapshots: Map<string, DestroyerProgressSnapshot>;
  emitter: EventEmitter;
};

const MAX_SNAPSHOT_COUNT = 2000;
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

function getStore(): DestroyerProgressStore {
  const key = "__qexurDestroyerProgressStore" as const;
  const scopedGlobal = globalThis as typeof globalThis & {
    __qexurDestroyerProgressStore?: DestroyerProgressStore;
  };

  if (!scopedGlobal[key]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(0);

    scopedGlobal[key] = {
      snapshots: new Map<string, DestroyerProgressSnapshot>(),
      emitter,
    };
  }

  return scopedGlobal[key] as DestroyerProgressStore;
}

function isTerminalStatus(status: DestroyerProgressStatus): boolean {
  return status === "completed" || status === "failed";
}

function normalizeSnapshot(snapshot: DestroyerProgressSnapshot): DestroyerProgressSnapshot {
  const totalAttacks = Math.max(0, Math.trunc(snapshot.totalAttacks));
  let executedAttacks = Math.max(0, Math.trunc(snapshot.executedAttacks));

  if (totalAttacks > 0) {
    executedAttacks = Math.min(executedAttacks, totalAttacks);
  }

  if (snapshot.status === "completed" && totalAttacks > 0) {
    executedAttacks = totalAttacks;
  }

  return {
    ...snapshot,
    executedAttacks,
    totalAttacks,
  };
}

function pruneSnapshots() {
  const store = getStore();

  if (store.snapshots.size <= MAX_SNAPSHOT_COUNT) {
    return;
  }

  const cutoff = Date.now() - SNAPSHOT_TTL_MS;

  for (const [jobId, snapshot] of store.snapshots.entries()) {
    const timestamp = Date.parse(snapshot.updatedAt);
    const isExpired = Number.isFinite(timestamp) && timestamp < cutoff;

    if (isExpired && isTerminalStatus(snapshot.status)) {
      store.snapshots.delete(jobId);
    }
  }

  if (store.snapshots.size <= MAX_SNAPSHOT_COUNT) {
    return;
  }

  const allSnapshots = Array.from(store.snapshots.values()).sort((a, b) => {
    return Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  });

  const overflowCount = Math.max(0, store.snapshots.size - MAX_SNAPSHOT_COUNT);

  for (let index = 0; index < overflowCount; index += 1) {
    const oldest = allSnapshots[index];

    if (!oldest) {
      break;
    }

    store.snapshots.delete(oldest.jobId);
  }
}

export function upsertDestroyerProgress(snapshot: DestroyerProgressSnapshot): DestroyerProgressSnapshot {
  const store = getStore();
  const existing = store.snapshots.get(snapshot.jobId);

  const merged = normalizeSnapshot({
    ...existing,
    ...snapshot,
    userId: snapshot.userId ?? existing?.userId,
    updatedAt: snapshot.updatedAt,
  });

  store.snapshots.set(merged.jobId, merged);
  store.emitter.emit(merged.jobId, merged);

  pruneSnapshots();

  return merged;
}

export function getDestroyerProgress(jobId: string): DestroyerProgressSnapshot | undefined {
  return getStore().snapshots.get(jobId);
}

export function subscribeDestroyerProgress(
  jobId: string,
  listener: (snapshot: DestroyerProgressSnapshot) => void,
): () => void {
  const store = getStore();
  store.emitter.on(jobId, listener);

  return () => {
    store.emitter.off(jobId, listener);
  };
}
