"use client";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import JSZip from "jszip";
import { useEffect, useMemo, useRef, useState, type InputHTMLAttributes } from "react";

import { AICommandChat, type InterpreterResolution } from "@/components/dashboard/AICommandChat";
import { AuditConsoleSkeleton } from "@/components/dashboard/AuditConsoleSkeleton";
import { CustomAttackVectorSelector } from "@/components/dashboard/CustomAttackVectorSelector";
import { LiveAttackSkeleton } from "@/components/dashboard/LiveAttackSkeleton";
import { AuthWallModal } from "@/components/modals/AuthWallModal";
import { DnsVerificationModal } from "@/components/modals/DnsVerificationModal";
import { DestroyerWarningModal } from "@/components/modals/DestroyerWarningModal";
import { WaitlistModal } from "@/components/modals/WaitlistModal";
import {
  getEntryPointsByIds,
  resolveAttackLayerFromEntryPoints,
} from "@/lib/config/entry-points";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type AuditIntensity,
  type ArtifactPointer,
  type AuditorInputMode,
  type DestroyerAttackLayer,
  type FindingPointer,
  type FolderUploadEntry,
  type ReasoningMode,
} from "@/types/qexur";

type JobResponse = {
  jobId: string;
  status: JobStatus;
  nextStep: string;
  details: string;
  executedAttacks?: number;
  totalAttacks?: number;
  report?: {
    summary?: string;
    severity?: string;
    location?: string;
    checkCoverageCount?: number;
    checkCoverageProfile?: string;
    deadCodeDetected?: FindingPointer[];
    potentialCrashPoints?: FindingPointer[];
    vibeCoderPrompt?: string;
  };
};

type AccessGate = "allow" | "auth" | "waitlist";
type PillarKey = "audit" | "live-attack";
type AttackLayer = Exclude<DestroyerAttackLayer, "custom">;
type EliteAttackMode = "agent-squad" | "custom";
type JobStatus = "queued" | "running" | "completed" | "failed";

type SecurityManifest = {
  id: string;
  pillar: "Audit" | "Live Attack";
  generatedAt: string;
  vulnerabilityLog: string[];
  remediationGuide: string[];
  aiFixTrace: string[];
  deadCodeDetected: string[];
  potentialCrashPoints: string[];
};

type FileWithRelativePath = File & { webkitRelativePath?: string };

type AttackProgressSnapshot = {
  jobId: string;
  status: JobStatus;
  nextStep: string;
  details: string;
  executedAttacks: number;
  totalAttacks: number;
};

type PipelineStepState = "active" | "waiting" | "completed";

type AgentPipelineStep = {
  id: "recon" | "payload-sniper" | "reporter";
  label: string;
  state: PipelineStepState;
};

const FREE_SCAN_LIMIT = 1;
const MAX_FILTERED_ARCHIVE_BYTES = 10 * 1024 * 1024;
const EXCLUDED_FOLDER_NAMES = new Set(["node_modules", ".git", ".next", "dist"]);
const AUDIT_SQUAD_LOCKED = true;

const sourceIntakeOptions: Array<{ value: AuditorInputMode; label: string; helper: string }> = [
  {
    value: "zip-upload",
    label: "ZIP Upload",
    helper: "Single compressed package for fast security scans.",
  },
  {
    value: "folder-upload",
    label: "Folder Upload",
    helper: "Recursive source intake for full repository context.",
  },
  {
    value: "github-connect",
    label: "GitHub Connect",
    helper: "Scan directly from a repository URL.",
  },
];

const auditIntensityOptions: Array<{
  value: AuditIntensity;
  label: string;
  coverage: string;
  description: string;
}> = [
  {
    value: "surface-scan",
    label: "Surface Scan",
    coverage: "10-20 Common Vulnerabilities",
    description: "Fast sanity checks for SQLi, XSS, auth gaps, and deployment blockers.",
  },
  {
    value: "deep-audit",
    label: "Deep Scan",
    coverage: "50+ Security + Logic Classes",
    description: "Production-grade analysis with dead-code detection and crash-path diagnostics.",
  },
  {
    value: "custom",
    label: "CUSTOM",
    coverage: "Specific to Your Needs",
    description: "Explain in chat What you want to scan.",
  },
];

const eliteAttackModeCards: Array<{
  value: EliteAttackMode;
  headline: string;
  description: string;
}> = [
  {
    value: "agent-squad",
    headline: "AGENT-SQUAD",
    description:
      "Autonomous 3-Agent (Recon , Payload Sniper, Reporter) for targeted infiltration.",
  },
  {
    value: "custom",
    headline: "CUSTOM",
    description: "Manually Search and Select and apply Attack.",
  },
];

const AGENT_PIPELINE_STEPS: Array<Pick<AgentPipelineStep, "id" | "label">> = [
  { id: "recon", label: "RECON" },
  { id: "payload-sniper", label: "PAYLOAD SNIPER" },
  { id: "reporter", label: "REPORTER" },
];

function getDomainFromUrl(input: string): string {
  if (!input) {
    return "your-domain.com";
  }

  try {
    return new URL(input).hostname;
  } catch {
    return "your-domain.com";
  }
}

function createChallengeToken() {
  return `qexur-beta-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

function readTrialScansUsed(user: User | null): number {
  const value = user?.user_metadata?.trialScansUsed;

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAttackLayerLabel(layer: AttackLayer): string {
  if (layer === "super-destroyer") {
    return "Super Destroyer";
  }

  if (layer === "destroyer") {
    return "Destroyer";
  }

  return "Surface";
}

function resolveCustomAttackLayer(entryPointIds: string[]): AttackLayer {
  const resolved = resolveAttackLayerFromEntryPoints(getEntryPointsByIds(entryPointIds));

  if (resolved === "custom") {
    return "destroyer";
  }

  return resolved;
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

function parseJobStatus(value: unknown): JobStatus {
  if (value === "queued" || value === "running" || value === "completed" || value === "failed") {
    return value;
  }

  return "running";
}

function parseAttackProgressSnapshot(raw: string): AttackProgressSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (typeof parsed.jobId !== "string") {
      return null;
    }

    return {
      jobId: parsed.jobId,
      status: parseJobStatus(parsed.status),
      nextStep: String(parsed.nextStep ?? "Monitoring attack queue execution."),
      details: String(parsed.details ?? "Progress update received from orchestrator."),
      executedAttacks: toNonNegativeInt(parsed.executedAttacks ?? parsed.executed ?? parsed.completed),
      totalAttacks: toNonNegativeInt(parsed.totalAttacks ?? parsed.total ?? parsed.targetCount),
    };
  } catch {
    return null;
  }
}

function getPipelineActiveIndex(status: JobStatus, executedAttacks: number): number {
  if (status === "completed" || status === "failed") {
    return 2;
  }

  if (status === "running" && executedAttacks > 0) {
    return 1;
  }

  return 0;
}

function buildAgentPipeline(status: JobStatus, executedAttacks: number): AgentPipelineStep[] {
  const activeIndex = getPipelineActiveIndex(status, executedAttacks);

  return AGENT_PIPELINE_STEPS.map((step, index) => {
    if (index < activeIndex) {
      return {
        ...step,
        state: "completed",
      };
    }

    if (index === activeIndex) {
      return {
        ...step,
        state: "active",
      };
    }

    return {
      ...step,
      state: "waiting",
    };
  });
}

function mergeProgressSnapshot(
  current: AttackProgressSnapshot | null,
  incoming: AttackProgressSnapshot,
): AttackProgressSnapshot {
  if (!current || current.jobId !== incoming.jobId) {
    return incoming;
  }

  const totalAttacks = Math.max(current.totalAttacks, incoming.totalAttacks);
  const executedAttacks = totalAttacks > 0
    ? Math.min(totalAttacks, Math.max(current.executedAttacks, incoming.executedAttacks))
    : Math.max(current.executedAttacks, incoming.executedAttacks);

  return {
    ...incoming,
    totalAttacks,
    executedAttacks,
  };
}

function getProgressBarWidth(executedAttacks: number, totalAttacks: number): number {
  if (totalAttacks <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((executedAttacks / totalAttacks) * 100));
}

function shouldExcludeRelativePath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);

  return segments.some((segment) => EXCLUDED_FOLDER_NAMES.has(segment));
}

function toAuditorEntries(
  files: FileList | null,
  source: AuditorInputMode,
): { entries: FolderUploadEntry[]; excludedCount: number } {
  if (!files || files.length === 0) {
    return {
      entries: [],
      excludedCount: 0,
    };
  }

  const selectedFiles = Array.from(files);

  if (source === "folder-upload") {
    const mapped = selectedFiles.map((file) => {
      const relativePath =
        (file as FileWithRelativePath).webkitRelativePath?.replace(/\\/g, "/").replace(/^\/+/, "") || file.name;

      return {
        file,
        relativePath,
      };
    });

    const entries = mapped.filter((entry) => !shouldExcludeRelativePath(entry.relativePath));

    return {
      entries,
      excludedCount: mapped.length - entries.length,
    };
  }

  const first = selectedFiles[0];

  return {
    entries: first
      ? [
          {
            file: first,
            relativePath: first.name,
          },
        ]
      : [],
    excludedCount: 0,
  };
}

async function buildOptimizedSourceArchive(
  entries: FolderUploadEntry[],
): Promise<{ archive: File; relativePaths: string[] }> {
  const zip = new JSZip();
  const relativePaths: string[] = [];

  for (const entry of entries) {
    if (shouldExcludeRelativePath(entry.relativePath)) {
      continue;
    }

    const safeRelativePath = entry.relativePath.replace(/\\/g, "/").replace(/^\/+/, "");

    if (!safeRelativePath) {
      continue;
    }

    const fileBytes = await entry.file.arrayBuffer();
    zip.file(safeRelativePath, fileBytes);
    relativePaths.push(safeRelativePath);
  }

  if (relativePaths.length === 0) {
    throw new Error("No source files remain after filtering node_modules, .git, .next, and dist.");
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  if (blob.size > MAX_FILTERED_ARCHIVE_BYTES) {
    throw new Error(
      `Optimized source archive is ${(blob.size / (1024 * 1024)).toFixed(2)}MB. Keep uploads under 10MB.`,
    );
  }

  return {
    archive: new File([blob], `source-optimized-${Date.now()}.zip`, { type: "application/zip" }),
    relativePaths,
  };
}

function formatManifestText(manifest: SecurityManifest, job: JobResponse | null): string {
  return [
    "Security Manifest",
    `Pillar: ${manifest.pillar}`,
    `Generated At: ${manifest.generatedAt}`,
    `Job ID: ${job?.jobId ?? manifest.id}`,
    "",
    "Vulnerability Log",
    ...manifest.vulnerabilityLog.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Remediation Guide",
    ...manifest.remediationGuide.map((item, index) => `${index + 1}. ${item}`),
    "",
    "AI Fix Trace",
    ...manifest.aiFixTrace.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Dead Code Detected",
    ...manifest.deadCodeDetected.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Potential Crash Points",
    ...manifest.potentialCrashPoints.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
}

function formatFindingPointer(pointer: FindingPointer): string {
  return `${pointer.file}:${pointer.line} - ${pointer.summary}`;
}

function renderSourceIcon(source: AuditorInputMode) {
  if (source === "zip-upload") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M5 2h11l3 3v17H5V2zm2 2v16h10V6h-3V4H7zm3 4h4v2h-4V8zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z" />
      </svg>
    );
  }

  if (source === "folder-upload") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M3 5h7l2 2h9v12H3V5zm2 4v8h14V9H5z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.1.1 1.8 1.1 1.8 1.1 1 .1 2.5.7 3.1-.6.1-.7.4-1.2.7-1.5-2.7-.3-5.5-1.4-5.5-6a4.7 4.7 0 0 1 1.2-3.3 4.4 4.4 0 0 1 .1-3.2s1-.3 3.4 1.2a11.6 11.6 0 0 1 6.1 0c2.3-1.5 3.4-1.2 3.4-1.2a4.4 4.4 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.2 3.3c0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6A12 12 0 0 0 12 .5z" />
    </svg>
  );
}

export function DashboardClient() {
  const supabase = createSupabaseBrowserClient();

  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trialScansUsed, setTrialScansUsed] = useState(0);
  const [showAuthWallModal, setShowAuthWallModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const [activePillar, setActivePillar] = useState<PillarKey>("live-attack");

  const [auditorSource, setAuditorSource] = useState<AuditorInputMode>("zip-upload");
  const [auditorRepositoryUrl, setAuditorRepositoryUrl] = useState("");
  const [auditorEntries, setAuditorEntries] = useState<FolderUploadEntry[]>([]);
  const reasoningMode: ReasoningMode = "core";
  const [auditIntensity, setAuditIntensity] = useState<AuditIntensity>("surface-scan");

  const [dnsVerificationUrl, setDnsVerificationUrl] = useState("");
  const [attackMode, setAttackMode] = useState<EliteAttackMode>("agent-squad");
  const [interpreterEntryPointIds, setInterpreterEntryPointIds] = useState<string[]>([]);
  const [destroyerDnsChallenge, setDestroyerDnsChallenge] = useState(createChallengeToken);
  const [dnsVerified, setDnsVerified] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [lastJob, setLastJob] = useState<JobResponse | null>(null);
  const [securityManifest, setSecurityManifest] = useState<SecurityManifest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [showDnsVerificationModal, setShowDnsVerificationModal] = useState(false);
  const [showDestroyerModal, setShowDestroyerModal] = useState(false);
  const [liveAttackProgress, setLiveAttackProgress] = useState<AttackProgressSnapshot | null>(null);
  const liveAttackProgressRef = useRef<AttackProgressSnapshot | null>(null);
  const [isProgressStreamConnected, setIsProgressStreamConnected] = useState(false);
  const progressEventSourceRef = useRef<EventSource | null>(null);

  const auditSquadLocked = AUDIT_SQUAD_LOCKED;

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user ?? null;

        if (!active) {
          return;
        }

        setIsAuthenticated(Boolean(user));
        setTrialScansUsed(readTrialScansUsed(user));
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    }

    void hydrateSession();

    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const user = session?.user ?? null;

      setIsAuthenticated(Boolean(user));
      setTrialScansUsed(readTrialScansUsed(user));
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  function closeLiveAttackProgressStream() {
    if (progressEventSourceRef.current) {
      progressEventSourceRef.current.close();
      progressEventSourceRef.current = null;
    }

    setIsProgressStreamConnected(false);
  }

  function resetLiveAttackProgressState() {
    liveAttackProgressRef.current = null;
    setLiveAttackProgress(null);
  }

  function applyProgressSnapshot(snapshot: AttackProgressSnapshot) {
    const mergedSnapshot = mergeProgressSnapshot(liveAttackProgressRef.current, snapshot);
    liveAttackProgressRef.current = mergedSnapshot;
    setLiveAttackProgress(mergedSnapshot);

    setLastJob((current) => {
      if (!current || current.jobId !== mergedSnapshot.jobId) {
        return current;
      }

      return {
        ...current,
        status: mergedSnapshot.status,
        nextStep: mergedSnapshot.nextStep,
        details: mergedSnapshot.details,
        executedAttacks: mergedSnapshot.executedAttacks,
        totalAttacks: mergedSnapshot.totalAttacks,
      };
    });
  }

  useEffect(() => {
    return () => {
      if (progressEventSourceRef.current) {
        progressEventSourceRef.current.close();
        progressEventSourceRef.current = null;
      }
    };
  }, []);

  const destroyerDomain = getDomainFromUrl(dnsVerificationUrl);
  const destroyerDnsRecordName = `_qexur-beta.${destroyerDomain}`;

  const accessGate = useMemo<AccessGate>(() => {
    if (!authReady || !isAuthenticated) {
      return "auth";
    }

    if (trialScansUsed >= FREE_SCAN_LIMIT) {
      return "waitlist";
    }

    return "allow";
  }, [authReady, isAuthenticated, trialScansUsed]);

  const canRunAudit = useMemo(() => {
    if (auditorSource === "github-connect") {
      return auditorRepositoryUrl.trim().length > 0;
    }

    return auditorEntries.length > 0;
  }, [auditorSource, auditorRepositoryUrl, auditorEntries]);

  const canRunLiveAttack = useMemo(
    () => dnsVerified && dnsVerificationUrl.trim().length > 0,
    [dnsVerified, dnsVerificationUrl],
  );

  const canLaunchSelectedMode = useMemo(() => {
    if (!canRunLiveAttack) {
      return false;
    }

    if (attackMode === "custom") {
      return interpreterEntryPointIds.length > 0;
    }

    return true;
  }, [canRunLiveAttack, attackMode, interpreterEntryPointIds]);

  const executedAttacks = liveAttackProgress?.executedAttacks ?? lastJob?.executedAttacks ?? 0;
  const totalAttacks = liveAttackProgress?.totalAttacks ?? lastJob?.totalAttacks ?? 0;
  const attackProgressStatus = liveAttackProgress?.status ?? lastJob?.status ?? "queued";
  const agentPipeline = useMemo(
    () => buildAgentPipeline(attackProgressStatus, executedAttacks),
    [attackProgressStatus, executedAttacks],
  );
  const attackCounterProgressWidth = getProgressBarWidth(executedAttacks, totalAttacks);

  const filePickerAttributes =
    auditorSource === "folder-upload"
      ? ({ webkitdirectory: "true", directory: "true", multiple: true } as unknown as InputHTMLAttributes<HTMLInputElement>)
      : ({ multiple: false } as InputHTMLAttributes<HTMLInputElement>);

  function blockActionForAccessGate() {
    if (accessGate === "auth") {
      setShowAuthWallModal(true);
      setStatusMessage("Create an account or log in to start your free security project.");
      return;
    }

    setShowWaitlistModal(true);
    setStatusMessage("Your free project is already used. Join the waitlist to unlock additional scans.");
  }

  function ensureAccessBeforeAction(): boolean {
    if (accessGate === "allow") {
      return true;
    }

    blockActionForAccessGate();
    return false;
  }

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async function uploadAuditorArtifact(entries: FolderUploadEntry[]): Promise<ArtifactPointer> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("feature", "auditor");
    formData.append("source", auditorSource);

    if (auditorSource === "folder-upload") {
      const { archive, relativePaths } = await buildOptimizedSourceArchive(entries);
      formData.append("relativePaths", JSON.stringify(relativePaths));
      formData.append("file", archive, archive.name);
    } else {
      const primary = entries[0];

      if (!primary) {
        throw new Error("Upload a ZIP artifact before running Audit.");
      }

      formData.append("file", primary.file, primary.file.name);
    }

    const response = await fetch("/api/storage/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    const data = (await response.json()) as { artifact?: ArtifactPointer; error?: string };

    if (!response.ok || !data.artifact) {
      throw new Error(data.error ?? "Artifact upload failed.");
    }

    return data.artifact;
  }

  function buildAuditManifest(job: JobResponse): SecurityManifest {
    return {
      id: job.jobId,
      pillar: "Audit",
      generatedAt: new Date().toISOString(),
      vulnerabilityLog: [
        job.report?.summary ?? "Potential code-level risks detected in static reasoning-first analysis.",
        `Severity focus: ${job.report?.severity ?? "High"}`,
        `Evidence pointer: ${job.report?.location ?? "src/app/api/example.ts:42"}`,
        `Coverage profile: ${job.report?.checkCoverageProfile ?? "Surface Scan"}`,
      ],
      remediationGuide: [
        "Prioritize high-severity items and patch insecure input validation paths first.",
        "Introduce focused regression tests for each remediated vulnerability path.",
        "Re-run audit after each patch set to confirm no new attack surface was introduced.",
      ],
      aiFixTrace: [
        "Auto-Fix Code is disabled in Beta and currently marked Coming Soon.",
        "AI would generate minimal line-by-line patches, preserving all interfaces.",
        "AI would run a post-patch self-check to verify logic safety before output.",
      ],
      deadCodeDetected:
        job.report?.deadCodeDetected && job.report.deadCodeDetected.length > 0
          ? job.report.deadCodeDetected.map(formatFindingPointer)
          : ["No dead-code evidence emitted for this scan profile."],
      potentialCrashPoints:
        job.report?.potentialCrashPoints && job.report.potentialCrashPoints.length > 0
          ? job.report.potentialCrashPoints.map(formatFindingPointer)
          : ["No crash-path evidence emitted for this scan profile."],
    };
  }

  function buildLiveAttackManifest(
    job: JobResponse,
    options: {
      mode: EliteAttackMode;
      attackLayer: AttackLayer;
      targetUrl: string;
    },
  ): SecurityManifest {
    const entryPointSummary =
      interpreterEntryPointIds.length > 0
        ? `Interpreter entry points: ${interpreterEntryPointIds.join(", ")}`
        : "Interpreter entry points: Not required for AGENT-SQUAD mode.";

    const modeLabel = options.mode === "agent-squad" ? "AGENT-SQUAD" : "CUSTOM";

    return {
      id: job.jobId,
      pillar: "Live Attack",
      generatedAt: new Date().toISOString(),
      vulnerabilityLog: [
        `Mode executed: ${modeLabel}`,
        `Layer executed: ${getAttackLayerLabel(options.attackLayer)}`,
        entryPointSummary,
        `Target: ${options.targetUrl}`,
        `Execution detail: ${job.details}`,
      ],
      remediationGuide: [
        "Harden perimeter controls on exposed endpoints identified by recon vectors.",
        "Enforce strict authentication, rate limiting, and bot defense on high-risk routes.",
        "Repeat DNS-verified tests after fixes to validate reduced exploitability.",
      ],
      aiFixTrace: [
        "Auto-Fix is disabled for Live Attack mode.",
        "Use Reason-First Code Audit to prepare fix plans and remediation workflows.",
        "Live Attack remains execution-only and does not generate patch actions.",
      ],
      deadCodeDetected: ["Dead-code analysis is not part of Live Attack execution mode."],
      potentialCrashPoints: ["Crash-path analysis is not part of Live Attack execution mode."],
    };
  }

  async function executeAudit() {
    if (auditSquadLocked) {
      setStatusMessage("Audit Squad is locked for Phase 2 rollout. Use Penetration Squad for active operations.");
      return;
    }

    if (!ensureAccessBeforeAction()) {
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      let payload: Record<string, unknown> = {
        feature: "auditor",
        source: auditorSource,
        mode: reasoningMode,
        intensity: auditIntensity,
      };

      if (auditorSource === "github-connect") {
        if (!auditorRepositoryUrl.trim()) {
          throw new Error("Add a GitHub repository URL before running Audit.");
        }

        payload = {
          feature: "auditor",
          source: "github-connect",
          repositoryUrl: auditorRepositoryUrl.trim(),
          mode: reasoningMode,
          intensity: auditIntensity,
        };
      } else {
        if (auditorEntries.length === 0) {
          throw new Error("Upload a ZIP or folder artifact before running Audit.");
        }

        const artifact = await uploadAuditorArtifact(auditorEntries);

        payload = {
          feature: "auditor",
          source: auditorSource,
          artifact,
          mode: reasoningMode,
          intensity: auditIntensity,
          ...(auditorSource === "folder-upload"
            ? { folderStructure: auditorEntries.map((entry) => entry.relativePath) }
            : {}),
        };
      }

      const response = await fetch("/api/auditor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Partial<JobResponse> & { error?: string };

      if (!response.ok) {
        if (response.status === 401) {
          setShowAuthWallModal(true);
        }

        if (response.status === 402) {
          setTrialScansUsed(FREE_SCAN_LIMIT);
          setShowWaitlistModal(true);
        }

        setStatusMessage(data.error ?? "Audit request was rejected.");
        return;
      }

      const job: JobResponse = {
        jobId: data.jobId ?? `audit-${Date.now()}`,
        status: parseJobStatus(data.status),
        nextStep: data.nextStep ?? "Monitor workflow execution.",
        details: data.details ?? "Accepted by Audit API route.",
        report: data.report,
      };

      setLastJob(job);
      setSecurityManifest(buildAuditManifest(job));
      setStatusMessage("Audit dispatched. Security Manifest is ready for review.");

      if (trialScansUsed < FREE_SCAN_LIMIT) {
        setTrialScansUsed(FREE_SCAN_LIMIT);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audit execution failed before reaching backend.";
      setStatusMessage(`${message} Verify auth and storage settings.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyDns(): Promise<boolean> {
    if (!ensureAccessBeforeAction()) {
      return false;
    }

    if (!dnsVerificationUrl.trim()) {
      setStatusMessage("Add a domain URL before running DNS verification.");
      return false;
    }

    setIsVerifyingDns(true);
    setStatusMessage("");
    closeLiveAttackProgressStream();
    resetLiveAttackProgressState();
    setLastJob(null);

    try {
      const response = await fetch("/api/destroyer/verify-dns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          feature: "destroyer",
          targetUrl: dnsVerificationUrl.trim(),
          dnsTxtRecord: destroyerDnsChallenge,
        }),
      });

      const data = (await response.json()) as { verified?: boolean; message?: string };

      if (!response.ok || !data.verified) {
        if (response.status === 401) {
          setShowAuthWallModal(true);
        }

        if (response.status === 402) {
          setTrialScansUsed(FREE_SCAN_LIMIT);
          setShowWaitlistModal(true);
        }

        setDnsVerified(false);
        setStatusMessage(data.message ?? "DNS TXT verification failed.");
        return false;
      }

      setDnsVerified(true);
      setShowDnsVerificationModal(false);

      setStatusMessage("DNS TXT verification succeeded. Agent pipeline is now armed for execution.");
      return true;
    } catch {
      setDnsVerified(false);
      setStatusMessage("Unable to verify DNS right now. Retry once network access is stable.");
      return false;
    } finally {
      setIsVerifyingDns(false);
    }
  }

  async function executeLiveAttack(riskAccepted: boolean) {
    if (!ensureAccessBeforeAction()) {
      return;
    }

    if (!dnsVerified) {
      setStatusMessage("DNS verification is required before launching Live Attack.");
      return;
    }

    if (!dnsVerificationUrl.trim()) {
      setStatusMessage("Add a domain URL before launching Live Attack.");
      return;
    }

    if (attackMode === "custom" && interpreterEntryPointIds.length === 0) {
      setStatusMessage("Select at least one vector in Custom Attack Vector Selector before launching Live Attack.");
      return;
    }

    closeLiveAttackProgressStream();
    resetLiveAttackProgressState();
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const resolvedAttackLayer: AttackLayer =
        attackMode === "custom"
          ? resolveCustomAttackLayer(interpreterEntryPointIds)
          : "super-destroyer";
      const manualCustomEntryPointIds = attackMode === "custom" ? interpreterEntryPointIds : undefined;

      const response = await fetch("/api/destroyer/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          feature: "destroyer",
          targetUrl: dnsVerificationUrl.trim(),
          dnsVerified: true,
          riskAccepted,
          attackLayer: resolvedAttackLayer,
          ...(manualCustomEntryPointIds ? { entryPointIds: manualCustomEntryPointIds } : {}),
        }),
      });

      const data = (await response.json()) as Partial<JobResponse> & { error?: string };

      if (!response.ok) {
        if (response.status === 401) {
          setShowAuthWallModal(true);
        }

        if (response.status === 402) {
          setTrialScansUsed(FREE_SCAN_LIMIT);
          setShowWaitlistModal(true);
        }

        setStatusMessage(data.error ?? "Live Attack request was rejected.");
        return;
      }

      const job: JobResponse = {
        jobId: data.jobId ?? `attack-${Date.now()}`,
        status: parseJobStatus(data.status),
        nextStep: data.nextStep ?? "Monitor workflow execution.",
        details: data.details ?? "Accepted by Live Attack API route.",
        executedAttacks: toNonNegativeInt(data.executedAttacks),
        totalAttacks: toNonNegativeInt(data.totalAttacks),
        report: data.report,
      };

      setLastJob(job);
      setSecurityManifest(
        buildLiveAttackManifest(job, {
          mode: attackMode,
          attackLayer: resolvedAttackLayer,
          targetUrl: dnsVerificationUrl.trim(),
        }),
      );
      setStatusMessage(`Live Attack dispatched in ${attackMode === "agent-squad" ? "AGENT-SQUAD" : "CUSTOM"} mode. Streaming attack queue progress.`);

      const streamUrl = `/api/destroyer/progress?jobId=${encodeURIComponent(job.jobId)}`;
      const progressSource = new EventSource(streamUrl);
      progressEventSourceRef.current = progressSource;

      progressSource.addEventListener("ready", () => {
        if (progressEventSourceRef.current !== progressSource) {
          return;
        }

        setIsProgressStreamConnected(true);
      });

      progressSource.addEventListener("progress", (event) => {
        if (progressEventSourceRef.current !== progressSource) {
          return;
        }

        const snapshot = parseAttackProgressSnapshot((event as MessageEvent<string>).data);

        if (!snapshot) {
          return;
        }

        applyProgressSnapshot(snapshot);
      });

      progressSource.addEventListener("done", (event) => {
        if (progressEventSourceRef.current !== progressSource) {
          return;
        }

        const snapshot = parseAttackProgressSnapshot((event as MessageEvent<string>).data);

        if (snapshot) {
          applyProgressSnapshot(snapshot);
        }

        closeLiveAttackProgressStream();
      });

      progressSource.onerror = () => {
        if (progressEventSourceRef.current !== progressSource) {
          return;
        }

        setIsProgressStreamConnected(false);
      };

      if (trialScansUsed < FREE_SCAN_LIMIT) {
        setTrialScansUsed(FREE_SCAN_LIMIT);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live Attack execution failed before reaching backend.";
      setStatusMessage(`${message} Verify auth and network settings.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLiveAttackAction() {
    if (!dnsVerified) {
      setStatusMessage("DNS verification is required before launching Live Attack.");
      return;
    }

    if (attackMode === "custom" && interpreterEntryPointIds.length === 0) {
      setStatusMessage("Select at least one vector in Custom Attack Vector Selector before launching Live Attack.");
      return;
    }

    if (!canRunLiveAttack) {
      setStatusMessage("Complete DNS verification to continue.");
      return;
    }

    if (!ensureAccessBeforeAction()) {
      return;
    }

    setShowDestroyerModal(true);
  }

  function handleInterpreterResolutionAction(resolution: InterpreterResolution) {
    setInterpreterEntryPointIds(resolution.entryPointIds);
    // Don't auto-switch the layer away from 'custom' or whatever else it currently is.
    // The target attack layer is derived at execution time.
    setStatusMessage(
      `Interpreter mapped entry points for audit scope: ${resolution.entryPointIds.join(", ")}. Review and refine in Live Attack after DNS verification.`,
    );
  }

  function handleLiveAttackVectorSelection(entryPointIds: string[]) {
    setInterpreterEntryPointIds(entryPointIds);
  }

  async function handleCopyReport() {
    if (!securityManifest) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatManifestText(securityManifest, lastJob));
      setStatusMessage("Security Manifest copied to clipboard.");
    } catch {
      setStatusMessage("Copy failed. Please retry with clipboard permissions enabled.");
    }
  }

  function handleDownloadPdf() {
    if (!securityManifest) {
      return;
    }

    const content = escapeHtml(formatManifestText(securityManifest, lastJob)).replaceAll("\n", "<br />");
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");

    if (!printWindow) {
      setStatusMessage("Popup blocked. Allow popups to download as PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Security Manifest</title>
          <style>
            body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 28px; line-height: 1.5; }
            h1 { font-family: Arial, sans-serif; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h1>Security Manifest</h1>
          <div>${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setStatusMessage("Print dialog opened. Choose Save as PDF to export.");
  }

  async function handleShareLink() {
    if (!securityManifest) {
      return;
    }

    const shareToken = lastJob?.jobId ?? securityManifest.id;
    const shareUrl = `${window.location.origin}${window.location.pathname}?manifest=${encodeURIComponent(shareToken)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatusMessage("Share Link copied to clipboard.");
    } catch {
      setStatusMessage("Unable to copy share link. Copy it manually from browser URL.");
    }
  }

  return (
    <div className="space-y-8 pb-28">
      {/* --- START NEW WAITLIST BANNER --- */}
      <section className="rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-[#0c1f33] to-[#101a2c] px-5 py-5 shadow-[0_12px_28px_rgba(2,6,23,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Qexur AI Waitlist</p>
            <p className="text-sm text-slate-300">
              Qexur Is in beta Test, majority of the feauturs are locked and will be unlock with updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <p className="text-sm font-bold text-cyan-400">Congratulations, you have joined the waitlist.</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(true)}
                  className="rounded-full border border-cyan-300/70 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Join Waitlist
                </button>
                <span className="rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
                  74 people joined waitlist
                </span>
              </>
            )}
          </div>
        </div>
      </section>
      {/* --- END NEW WAITLIST BANNER --- */}

      <section
        role="tablist"
        aria-label="Mission control squads"
        className="rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel)]/70 p-2 backdrop-blur-sm"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            id="squad-tab-audit"
            role="tab"
            type="button"
            aria-selected={activePillar === "audit"}
            aria-controls="squad-panel-audit"
            aria-disabled="true"
            disabled
            className={[
              "rounded-xl border px-4 py-4 text-left transition cursor-not-allowed",
              activePillar === "audit"
                ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_28px_rgba(6,182,212,0.22)]"
                : "border-[var(--qx-border)] bg-black/25 opacity-80",
            ].join(" ")}
          >
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl uppercase tracking-[0.08em]">Audit Squad</p>
              <span className="rounded-full border border-amber-300/70 bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                Coming Soon
              </span>
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">Phase 2</p>
          </button>

          <button
            id="squad-tab-penetration"
            role="tab"
            type="button"
            onClick={() => setActivePillar("live-attack")}
            aria-selected={activePillar === "live-attack"}
            aria-controls="squad-panel-penetration"
            className={[
              "rounded-xl border px-4 py-4 text-left transition",
              activePillar === "live-attack"
                ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_28px_rgba(6,182,212,0.22)]"
                : "border-[var(--qx-border)] bg-black/25 hover:border-cyan-500/80",
            ].join(" ")}
          >
            <p className="mt-2 font-display text-3xl uppercase tracking-[0.08em]">Penetration Squad</p>
            {activePillar === "live-attack" && (
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Active</p>
            )}
          </button>
        </div>
      </section>

      {activePillar === "audit" ? (
        !authReady ? (
          <AuditConsoleSkeleton />
        ) : (
          <section
            id="squad-panel-audit"
            role="tabpanel"
            aria-labelledby="squad-tab-audit"
            className="space-y-8 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 md:p-8"
          >
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Audit Console</p>
              <h2 className="font-display text-5xl uppercase tracking-[0.08em]">Reasoning-First Code Audit</h2>
              <p className="max-w-3xl text-sm text-[var(--qx-muted)]">
                Reasoning-first static code analysis for pre-launch security.
              </p>
            </header>

            <div className="relative">
              <div
                aria-hidden={auditSquadLocked}
                className={[
                  "space-y-8",
                  auditSquadLocked ? "pointer-events-none select-none opacity-40 saturate-50 grayscale-[0.35]" : "",
                ].join(" ")}
              >
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Source Intake</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {sourceIntakeOptions.map((option) => {
                  const active = auditorSource === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={auditSquadLocked}
                      onClick={() => {
                        if (auditSquadLocked) {
                          return;
                        }

                        if (accessGate !== "allow") {
                          blockActionForAccessGate();
                          return;
                        }

                        setAuditorSource(option.value);
                        setAuditorEntries([]);
                      }}
                      className={[
                        "group relative rounded-xl border px-4 py-4 text-left transition overflow-hidden",
                        active
                          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_22px_rgba(6,182,212,0.2)]"
                          : "border-slate-700 bg-slate-950/70 hover:border-cyan-400 hover:bg-cyan-500/5",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                          active
                            ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-200"
                            : "border-slate-600 bg-slate-800/70 text-slate-300",
                        ].join(" ")}
                      >
                        {active ? "Armed" : "Ready"}
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/70 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                        {renderSourceIcon(option.value)}
                      </span>
                      <p className="mt-3 pr-16 font-semibold uppercase tracking-[0.12em]">{option.label}</p>
                      <p className="mt-2 text-xs text-[var(--qx-muted)]">{option.helper}</p>
                    </button>
                  );
                })}
              </div>

              {auditorSource === "github-connect" ? (
                <input
                  type="url"
                  value={auditorRepositoryUrl}
                  disabled={auditSquadLocked}
                  onChange={(event) => setAuditorRepositoryUrl(event.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full rounded-xl border border-[var(--qx-border)] bg-black/30 px-4 py-3 text-sm text-[var(--qx-text)] outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                />
              ) : (
                <label className="block rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
                  <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">
                    {auditorSource === "zip-upload" ? "Upload ZIP Artifact" : "Upload Source Folder"}
                  </span>
                  <input
                    type="file"
                    accept={auditorSource === "zip-upload" ? ".zip,.tar,.gz,.7z" : undefined}
                    {...filePickerAttributes}
                    disabled={auditSquadLocked}
                    onClick={(event) => {
                      if (auditSquadLocked) {
                        event.preventDefault();
                        return;
                      }

                      if (accessGate !== "allow") {
                        event.preventDefault();
                        blockActionForAccessGate();
                      }
                    }}
                    onChange={(event) => {
                      if (auditSquadLocked) {
                        return;
                      }

                      if (accessGate !== "allow") {
                        blockActionForAccessGate();
                        return;
                      }

                      const selection = toAuditorEntries(event.target.files, auditorSource);

                      setAuditorEntries(selection.entries);

                      if (auditorSource === "folder-upload" && selection.excludedCount > 0) {
                        setStatusMessage(
                          `Filtered ${selection.excludedCount} item(s) from node_modules, .git, .next, and dist before zip optimization.`,
                        );
                      }
                    }}
                    className="block w-full cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-black"
                  />
                  {auditorEntries.length > 0 && (
                    <div className="mt-3 space-y-1 text-xs text-[var(--qx-muted)]">
                      <p className="uppercase tracking-[0.16em]">Loaded: {auditorEntries.length} file(s)</p>
                      <div className="rounded-md border border-[var(--qx-border)] bg-black/30 p-2 font-mono text-[11px] text-slate-300">
                        {auditorEntries.slice(0, 3).map((entry) => (
                          <p key={`${entry.relativePath}:${entry.file.size}`}>{entry.relativePath}</p>
                        ))}
                        {auditorEntries.length > 3 && <p>+{auditorEntries.length - 3} more files</p>}
                      </div>
                    </div>
                  )}
                </label>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Audit Intensity</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {auditIntensityOptions.map((option) => {
                  const active = auditIntensity === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={auditSquadLocked}
                      onClick={() => {
                        if (auditSquadLocked) {
                          return;
                        }

                        setAuditIntensity(option.value);
                      }}
                      className={[
                        "relative rounded-xl border p-4 text-left transition overflow-hidden",
                        active
                          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_26px_rgba(6,182,212,0.2)]"
                          : "border-slate-700 bg-slate-950/70 hover:border-cyan-300/70",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                          active
                            ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-200"
                            : "border-slate-600 bg-slate-800/70 text-slate-300",
                        ].join(" ")}
                      >
                        {active ? "Armed" : "Ready"}
                      </span>
                      <p className="pr-14 font-display text-3xl uppercase tracking-[0.08em]">{option.label}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-cyan-200">{option.coverage}</p>
                      <p className="mt-2 text-xs text-[var(--qx-muted)]">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {auditIntensity === "custom" && (
              <AICommandChat
                onResolutionAction={handleInterpreterResolutionAction}
                disabled={auditSquadLocked || !canRunAudit || isSubmitting}
              />
            )}

            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Call to Action</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => {
                    void executeAudit();
                  }}
                  disabled={auditSquadLocked || !canRunAudit || isSubmitting}
                  className={[
                    "rounded-xl border-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition",
                    auditSquadLocked || !canRunAudit || isSubmitting
                      ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                      : "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_22px_rgba(6,182,212,0.25)] hover:bg-cyan-400",
                  ].join(" ")}
                >
                  {isSubmitting
                    ? "Dispatching..."
                    : auditIntensity === "deep-audit"
                      ? "Run Deep Audit"
                      : "Run Surface Scan"}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl border border-amber-300/50 bg-amber-400/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100"
                  >
                    Auto-Fix Code
                  </button>
                  <span className="absolute -right-2 -top-2 rounded-full border border-amber-300/70 bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                    Coming Soon
                  </span>
                </div>
              </div>
            </section>
              </div>

              {auditSquadLocked && (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-slate-950/80 backdrop-blur-[2px]">
                  <div className="mx-auto max-w-2xl space-y-3 rounded-xl border border-amber-300/60 bg-black/70 px-6 py-5 text-center shadow-[0_0_32px_rgba(251,191,36,0.22)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">Audit Squad</p>
                    <p className="font-display text-4xl uppercase tracking-[0.08em] text-amber-100">Coming Soon</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Phase 2</p>
                    <p className="text-sm text-slate-300">
                      Team 1 infrastructure is currently locked while we expand autonomous audit capacity. All fields remain visible for preview and will unlock in Phase 2.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      ) : !authReady ? (
        <LiveAttackSkeleton />
      ) : (
        <section
          id="squad-panel-penetration"
          role="tabpanel"
          aria-labelledby="squad-tab-penetration"
          className="space-y-8 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 md:p-8"
        >
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Live Attack Console</p>
            <h2 className="font-display text-5xl uppercase tracking-[0.08em]">DNS-Verified Stress Simulation</h2>
            <p className="max-w-3xl text-sm text-[var(--qx-muted)]">
              DNS-verified live penetration stress simulation for Web &amp; API.
            </p>
          </header>

          <section className="space-y-4 rounded-xl border border-cyan-500/40 bg-black/35 p-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-cyan-200">DNS TXT Verification</h3>

            {!dnsVerified ? (
              <>
                <input
                  type="url"
                  value={dnsVerificationUrl}
                  onChange={(event) => {
                    setDnsVerificationUrl(event.target.value);
                    setDnsVerified(false);
                    setShowDnsVerificationModal(false);
                  }}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-[var(--qx-border)] bg-black/35 px-4 py-3 text-sm text-[var(--qx-text)] outline-none transition focus:border-cyan-400"
                />

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDestroyerDnsChallenge(createChallengeToken());
                      setShowDnsVerificationModal(true);
                    }}
                    disabled={isVerifyingDns || !dnsVerificationUrl.trim()}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition",
                      isVerifyingDns || !dnsVerificationUrl.trim()
                        ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                        : "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.24)] hover:bg-cyan-400",
                    ].join(" ")}
                  >
                    Generate Record
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300/45 bg-emerald-400/10 px-4 py-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-300/70 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                        Armed
                      </span>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Verified Domain</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-emerald-100">{dnsVerificationUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDnsVerified(false);
                      setDestroyerDnsChallenge(createChallengeToken());
                      setShowDnsVerificationModal(false);
                      closeLiveAttackProgressStream();
                      resetLiveAttackProgressState();
                      setLastJob(null);
                    }}
                    className="rounded-lg border border-emerald-300/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-400/15"
                  >
                    Verify Another Domain
                  </button>
                </div>

                <section className="space-y-3 rounded-xl border border-cyan-500/35 bg-cyan-500/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Agent Pipeline</p>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {agentPipeline.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <div
                          className={[
                            "rounded-lg border px-3 py-2",
                            step.state === "active"
                              ? "border-cyan-300/70 bg-cyan-400/20 text-cyan-100"
                              : step.state === "completed"
                                ? "border-emerald-300/60 bg-emerald-400/20 text-emerald-100"
                                : "border-slate-600 bg-slate-900/70 text-slate-300",
                          ].join(" ")}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.14em]">{step.label}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.14em]">
                            {step.state === "active" ? "Active" : step.state === "completed" ? "Completed" : "Waiting"}
                          </p>
                        </div>
                        {index < agentPipeline.length - 1 && (
                          <span className="hidden text-cyan-200 md:inline" aria-hidden="true">
                            →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-cyan-500/35 bg-cyan-500/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Attack Counter</p>
                    <span
                      className={[
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        isProgressStreamConnected
                          ? "border-cyan-300/70 bg-cyan-400/20 text-cyan-100"
                          : "border-amber-300/60 bg-amber-400/20 text-amber-100",
                      ].join(" ")}
                    >
                      {isProgressStreamConnected ? "Live" : "Standby"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100">
                    Payloads Fired: {executedAttacks} / {totalAttacks}
                  </p>
                  <div className="h-2 overflow-hidden rounded-full border border-[var(--qx-border)] bg-black/35">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-300"
                      style={{ width: `${attackCounterProgressWidth}%` }}
                    />
                  </div>
                </section>
              </div>
            )}
          </section>

              <section className="space-y-4 rounded-xl border border-[var(--qx-border)] bg-black/30 p-5">
                <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Attack Intensity Layers</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {eliteAttackModeCards.map((mode) => {
                    const active = attackMode === mode.value;

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setAttackMode(mode.value)}
                        className={[
                          "relative rounded-xl border px-4 py-4 text-left transition overflow-hidden",
                          active
                            ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                            : "border-slate-700 bg-slate-950/70 hover:border-cyan-400/70",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                            active
                              ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-200"
                              : "border-slate-600 bg-slate-800/70 text-slate-300",
                          ].join(" ")}
                        >
                          {active ? "Armed" : "Ready"}
                        </span>
                        <p className="pr-14 font-display text-2xl uppercase tracking-[0.08em]">{mode.headline}</p>
                        <p className="mt-2 text-xs text-[var(--qx-muted)]">{mode.description}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {attackMode === "custom" && (
                <CustomAttackVectorSelector
                  selectedEntryPointIds={interpreterEntryPointIds}
                  onSelectionChange={handleLiveAttackVectorSelection}
                  onInitiateAttack={handleLiveAttackAction}
                  disabled={!dnsVerified || isSubmitting}
                  pending={isSubmitting}
                  canInitiate={canLaunchSelectedMode}
                  showInitiateButton={false}
                />
              )}

              <section className="space-y-3 rounded-xl border border-[var(--qx-border)] bg-black/30 p-5">
                <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Execute Attack</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLiveAttackAction}
                    disabled={!canLaunchSelectedMode || isSubmitting}
                    className={[
                      "rounded-xl border-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition",
                      !canLaunchSelectedMode || isSubmitting
                        ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                        : "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_22px_rgba(6,182,212,0.25)] hover:bg-cyan-400",
                    ].join(" ")}
                  >
                    {isSubmitting
                      ? "Dispatching..."
                      : attackMode === "agent-squad"
                        ? "Launch Agent-Squad"
                        : "Launch Custom Attack"}
                  </button>

                  {attackMode === "custom" && interpreterEntryPointIds.length === 0 && (
                    <p className="text-xs text-[var(--qx-muted)]">
                      Select one or more vectors in Custom mode before launching.
                    </p>
                  )}
                </div>
              </section>
        </section>
      )}

      <section className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4 text-xs uppercase tracking-[0.18em] text-[var(--qx-muted)]">
        {accessGate === "allow"
          ? `Free Trial Remaining: ${Math.max(0, FREE_SCAN_LIMIT - trialScansUsed)} project`
          : isAuthenticated
            ? "Free trial used. Join waitlist for additional scans."
            : "Guest mode active. Log in to unlock your free project."}
      </section>

      {statusMessage && (
        <section className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4 text-sm">
          <p className="font-semibold uppercase tracking-[0.16em]">Execution Status</p>
          <p className="mt-2 text-[var(--qx-muted)]">{statusMessage}</p>
          {lastJob && (
            <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.16em] text-[var(--qx-muted)] sm:grid-cols-2">
              <p>Job: {lastJob.jobId}</p>
              <p>Status: {lastJob.status}</p>
              <p>Next: {lastJob.nextStep}</p>
              <p>Details: {lastJob.details}</p>
            </div>
          )}
        </section>
      )}

      {securityManifest && (
        <section className="space-y-5 rounded-2xl border border-cyan-500/35 bg-[var(--qx-panel)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Universal Reporting UI Engine</p>
              <h3 className="mt-2 font-display text-4xl uppercase tracking-[0.08em]">Security Manifest</h3>
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--qx-muted)]">Generated: {securityManifest.generatedAt}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <article className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
              <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200">Vulnerability Log</h4>
              <ul className="mt-3 space-y-2 text-sm text-[var(--qx-muted)]">
                {securityManifest.vulnerabilityLog.map((item, index) => (
                  <li key={`vuln-${index}`} className="rounded-md border border-[var(--qx-border)] bg-black/20 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
              <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200">Remediation Guide</h4>
              <ul className="mt-3 space-y-2 text-sm text-[var(--qx-muted)]">
                {securityManifest.remediationGuide.map((item, index) => (
                  <li key={`remediation-${index}`} className="rounded-md border border-[var(--qx-border)] bg-black/20 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
              <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200">AI Fix Trace</h4>
              <ul className="mt-3 space-y-2 text-sm text-[var(--qx-muted)]">
                {securityManifest.aiFixTrace.map((item, index) => (
                  <li key={`fix-trace-${index}`} className="rounded-md border border-[var(--qx-border)] bg-black/20 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
              <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200">Dead Code Detected</h4>
              <ul className="mt-3 space-y-2 text-sm text-[var(--qx-muted)]">
                {securityManifest.deadCodeDetected.map((item, index) => (
                  <li key={`dead-code-${index}`} className="rounded-md border border-[var(--qx-border)] bg-black/20 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
              <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200">Potential Crash Points</h4>
              <ul className="mt-3 space-y-2 text-sm text-[var(--qx-muted)]">
                {securityManifest.potentialCrashPoints.map((item, index) => (
                  <li key={`crash-point-${index}`} className="rounded-md border border-[var(--qx-border)] bg-black/20 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void handleCopyReport();
              }}
              className="rounded-lg border border-cyan-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-500/10"
            >
              Copy
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-lg border border-cyan-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-500/10"
            >
              Download PDF
            </button>

            <button
              type="button"
              onClick={() => {
                void handleShareLink();
              }}
              className="rounded-lg border border-cyan-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-500/10"
            >
              Share
            </button>
          </div>
        </section>
      )}

      <DestroyerWarningModal
        open={showDestroyerModal}
        pending={isSubmitting}
        onCancel={() => setShowDestroyerModal(false)}
        onExecute={() => {
          setShowDestroyerModal(false);
          void executeLiveAttack(true);
        }}
      />

      <DnsVerificationModal
        open={showDnsVerificationModal}
        pending={isVerifyingDns}
        recordName={destroyerDnsRecordName}
        recordValue={destroyerDnsChallenge}
        onClose={() => setShowDnsVerificationModal(false)}
        onVerify={() => {
          void handleVerifyDns();
        }}
      />

      <AuthWallModal
        open={showAuthWallModal}
        onClose={() => setShowAuthWallModal(false)}
      />

      <WaitlistModal
        open={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onConfirm={() => {
          setShowWaitlistModal(false);
          setShowAuthWallModal(true);
        }}
      />
    </div>
  );
}