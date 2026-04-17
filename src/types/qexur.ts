export type FeatureKey = "auditor" | "wp-auditor" | "destroyer";

export type AuditorInputMode = "zip-upload" | "folder-upload" | "github-connect";
export type AppAuditorInputMode = "url" | "plugin-zip";
export type WpAuditorInputMode = AppAuditorInputMode;
export type ReasoningMode = "core" | "elite";
export type AuditIntensity = "surface-scan" | "deep-audit" | "custom";
export type DestroyerAttackLayer = "surface" | "destroyer" | "super-destroyer" | "custom";

export type FindingPointer = {
  file: string;
  line: number;
  summary: string;
};

export type FlowStep = {
  id: string;
  label: string;
};

export type ArtifactPointer = {
  bucket: string;
  path: string;
  fileName: string;
  size: number;
  contentType: string;
  fileCount?: number;
};

export type FolderUploadEntry = {
  file: File;
  relativePath: string;
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  auditor: "Web Auditor",
  "wp-auditor": "App Auditor",
  destroyer: "Destroyer",
};

export const FEATURE_FLOW_STEPS: Record<FeatureKey, FlowStep[]> = {
  auditor: [
    { id: "ingest", label: "Ingest Target" },
    { id: "scan", label: "Scan Code" },
    { id: "validate", label: "Validate Findings" },
    { id: "report", label: "Generate Comprehensive Report" },
  ],
  "wp-auditor": [
    { id: "ingest", label: "Ingest SaaS Target" },
    { id: "scan", label: "Scan App Surface" },
    { id: "logic", label: "Analyze Distributed Logic" },
    { id: "report", label: "Generate Security Report" },
  ],
  destroyer: [
    { id: "dns", label: "DNS TXT Verification" },
    { id: "phase-1", label: "Surface Recon" },
    { id: "phase-2", label: "Vulnerability Probe" },
    { id: "phase-3", label: "Logic Infiltration" },
    { id: "poc", label: "Proof of Concept Report" },
  ],
};

export type JobEnvelope = {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  nextStep: string;
  n8nRoute: string;
  details: string;
};