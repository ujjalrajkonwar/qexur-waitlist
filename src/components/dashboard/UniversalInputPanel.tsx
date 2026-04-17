"use client";

import type { InputHTMLAttributes } from "react";

import type {
  AuditorInputMode,
  FeatureKey,
  FolderUploadEntry,
  ReasoningMode,
  WpAuditorInputMode,
} from "@/types/qexur";

type UniversalInputPanelProps = {
  selectedFeature: FeatureKey;
  actionsLocked: boolean;
  onBlockedAction: () => void;
  auditorSource: AuditorInputMode;
  onAuditorSourceChangeAction: (mode: AuditorInputMode) => void;
  auditorRepositoryUrl: string;
  onAuditorRepositoryUrlChangeAction: (value: string) => void;
  auditorEntries: FolderUploadEntry[];
  onAuditorEntriesChangeAction: (entries: FolderUploadEntry[]) => void;
  reasoningMode: ReasoningMode;
  onReasoningModeChangeAction: (mode: ReasoningMode) => void;
  wpSource: WpAuditorInputMode;
  onWpSourceChangeAction: (mode: WpAuditorInputMode) => void;
  wpTargetUrl: string;
  onWpTargetUrlChangeAction: (value: string) => void;
  wpPluginFile: File | null;
  onWpPluginFileChangeAction: (file: File | null) => void;
  destroyerTargetUrl: string;
  onDestroyerTargetUrlChangeAction: (value: string) => void;
  destroyerDnsRecordName: string;
  destroyerDnsRecordValue: string;
  dnsVerified: boolean;
  verifyingDns: boolean;
  onVerifyDnsAction: () => void;
};

const inputCardClass =
  "w-full border-2 border-[var(--qx-border)] bg-[var(--qx-panel)] px-4 py-3 text-sm text-[var(--qx-text)] outline-none transition focus:border-[var(--qx-primary)]";

type FileWithRelativePath = File & { webkitRelativePath?: string };

function toAuditorEntries(files: FileList | null, source: AuditorInputMode): FolderUploadEntry[] {
  if (!files || files.length === 0) {
    return [];
  }

  const selectedFiles = Array.from(files);

  if (source === "folder-upload") {
    return selectedFiles.map((file) => {
      const relativePath =
        (file as FileWithRelativePath).webkitRelativePath?.replace(/\\/g, "/").replace(/^\/+/, "") || file.name;

      return {
        file,
        relativePath,
      };
    });
  }

  const first = selectedFiles[0];

  return first
    ? [
        {
          file: first,
          relativePath: first.name,
        },
      ]
    : [];
}

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "border px-3 py-2 text-xs uppercase tracking-[0.2em] transition",
            value === option.value
              ? "border-[var(--qx-primary)] bg-[var(--qx-primary)]/20 text-[var(--qx-text)]"
              : "border-[var(--qx-border)] text-[var(--qx-muted)] hover:border-[var(--qx-text)] hover:text-[var(--qx-text)]",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function UniversalInputPanel(props: UniversalInputPanelProps) {
  const {
    selectedFeature,
    actionsLocked,
    onBlockedAction,
    auditorSource,
    onAuditorSourceChangeAction,
    auditorRepositoryUrl,
    onAuditorRepositoryUrlChangeAction,
    auditorEntries,
    onAuditorEntriesChangeAction,
    reasoningMode,
    onReasoningModeChangeAction,
    wpSource,
    onWpSourceChangeAction,
    wpTargetUrl,
    onWpTargetUrlChangeAction,
    wpPluginFile,
    onWpPluginFileChangeAction,
    destroyerTargetUrl,
    onDestroyerTargetUrlChangeAction,
    destroyerDnsRecordName,
    destroyerDnsRecordValue,
    dnsVerified,
    verifyingDns,
    onVerifyDnsAction,
  } = props;

  const panelTitle: Record<FeatureKey, string> = {
    auditor: "Web Auditor Intake",
    "wp-auditor": "App Auditor Intake",
    destroyer: "Destroyer Control Surface",
  };

  const panelSubtitle: Record<FeatureKey, string> = {
    auditor: "Choose your source and prepare one project for report generation.",
    "wp-auditor": "Deep-security scan for modern SaaS applications and distributed architectures.",
    destroyer: "Validate DNS ownership before launching any live simulation.",
  };

  const folderSelectionAttributes =
    auditorSource === "folder-upload"
      ? ({ webkitdirectory: "true", directory: "true", multiple: true } as unknown as InputHTMLAttributes<HTMLInputElement>)
      : ({ multiple: false } as InputHTMLAttributes<HTMLInputElement>);

  return (
    <section className="mx-auto w-full max-w-4xl border-2 border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6">
      <h2 className="font-display text-4xl uppercase tracking-[0.08em]">{panelTitle[selectedFeature]}</h2>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">{panelSubtitle[selectedFeature]}</p>

      {(selectedFeature === "auditor" || selectedFeature === "wp-auditor") && (
        <div className="mt-5 space-y-3 border border-[var(--qx-border)] bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Reasoning Mode</p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onReasoningModeChangeAction("core")}
              className={[
                "space-y-2 border p-3 text-left transition",
                reasoningMode === "core"
                  ? "border-[var(--qx-primary)] bg-[var(--qx-primary)]/15"
                  : "border-[var(--qx-border)] bg-black/30 hover:border-[var(--qx-primary)]/60",
              ].join(" ")}
            >
              <p className="font-display text-2xl uppercase tracking-[0.08em]">Core Engine</p>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">
                92% Accuracy | High-Speed Optimized | Powered by self-learning neural models.
              </p>
              <p className="text-xs text-[var(--qx-muted)]">Use this for rapid audits and daily health checks.</p>
            </button>

            <button
              type="button"
              onClick={() => onReasoningModeChangeAction("elite")}
              className={[
                "space-y-2 border p-3 text-left transition",
                reasoningMode === "elite"
                  ? "border-[var(--qx-primary)] bg-[var(--qx-primary)]/15"
                  : "border-[var(--qx-border)] bg-black/30 hover:border-[var(--qx-primary)]/60",
              ].join(" ")}
            >
              <p className="font-display text-2xl uppercase tracking-[0.08em]">Elite Reasoning</p>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">
                95%+ Accuracy | Mission-Critical Depth | Deep logic analysis for production-ready code.
              </p>
              <p className="text-xs text-[var(--qx-muted)]">
                Use this for final pre-launch audits or complex logic debugging.
              </p>
            </button>
          </div>
        </div>
      )}

      {selectedFeature === "auditor" && (
        <div className="mt-5 space-y-4">
          <ToggleGroup
            value={auditorSource}
            onChange={onAuditorSourceChangeAction}
            options={[
              { label: "ZIP Upload", value: "zip-upload" },
              { label: "Folder Upload", value: "folder-upload" },
              { label: "GitHub Connect", value: "github-connect" },
            ]}
          />

          {auditorSource === "github-connect" ? (
            <input
              type="url"
              value={auditorRepositoryUrl}
              onChange={(event) => onAuditorRepositoryUrlChangeAction(event.target.value)}
              placeholder="https://github.com/org/repo"
              className={inputCardClass}
            />
          ) : (
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--qx-muted)]">
                {auditorSource === "zip-upload" ? "Upload ZIP" : "Upload Folder Archive"}
              </span>
              <input
                type="file"
                accept={auditorSource === "zip-upload" ? ".zip,.tar,.gz,.7z" : undefined}
                {...folderSelectionAttributes}
                onClick={(event) => {
                  if (actionsLocked) {
                    event.preventDefault();
                    onBlockedAction();
                  }
                }}
                onChange={(event) => {
                  if (actionsLocked) {
                    onBlockedAction();
                    return;
                  }

                  onAuditorEntriesChangeAction(toAuditorEntries(event.target.files, auditorSource));
                }}
                className="block w-full cursor-pointer text-sm file:mr-4 file:border-0 file:bg-[var(--qx-primary)] file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-black"
              />

              {auditorEntries.length > 0 && auditorSource === "folder-upload" && (
                <div className="mt-2 space-y-2 text-xs uppercase tracking-[0.15em] text-[var(--qx-muted)]">
                  <p>Loaded: {auditorEntries.length} files</p>
                  <div className="space-y-1 border border-[var(--qx-border)] bg-black/20 p-2 font-mono normal-case tracking-normal text-slate-300">
                    {auditorEntries.slice(0, 3).map((entry) => (
                      <p key={`${entry.relativePath}:${entry.file.size}`}>{entry.relativePath}</p>
                    ))}
                    {auditorEntries.length > 3 && <p>+{auditorEntries.length - 3} more files</p>}
                  </div>
                </div>
              )}

              {auditorEntries.length > 0 && auditorSource !== "folder-upload" && (
                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[var(--qx-muted)]">
                  Loaded: {auditorEntries[0]?.file.name}
                </p>
              )}
            </label>
          )}
        </div>
      )}

      {selectedFeature === "wp-auditor" && (
        <div className="mt-5 space-y-4">
          <ToggleGroup
            value={wpSource}
            onChange={onWpSourceChangeAction}
            options={[
              { label: "SaaS Endpoint", value: "url" },
              { label: "Artifact ZIP", value: "plugin-zip" },
            ]}
          />

          {wpSource === "url" ? (
            <input
              type="url"
              value={wpTargetUrl}
              onChange={(event) => onWpTargetUrlChangeAction(event.target.value)}
              placeholder="https://app.example.com or https://api.example.com"
              className={inputCardClass}
            />
          ) : (
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--qx-muted)]">Upload Artifact ZIP</span>
              <input
                type="file"
                accept=".zip"
                onClick={(event) => {
                  if (actionsLocked) {
                    event.preventDefault();
                    onBlockedAction();
                  }
                }}
                onChange={(event) => {
                  if (actionsLocked) {
                    onBlockedAction();
                    return;
                  }

                  onWpPluginFileChangeAction(event.target.files?.[0] ?? null);
                }}
                className="block w-full cursor-pointer text-sm file:mr-4 file:border-0 file:bg-[var(--qx-primary)] file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-black"
              />
              {wpPluginFile && (
                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[var(--qx-muted)]">Loaded: {wpPluginFile.name}</p>
              )}
            </label>
          )}
        </div>
      )}

      {selectedFeature === "destroyer" && (
        <div className="mt-5 space-y-4">
          <input
            type="url"
            value={destroyerTargetUrl}
            onChange={(event) => onDestroyerTargetUrlChangeAction(event.target.value)}
            placeholder="https://live-target.com"
            className={inputCardClass}
          />

          <div className="space-y-2 border border-[var(--qx-border)] bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--qx-muted)]">
              Step 1: Add this DNS TXT record to verify ownership
            </p>
            <p className="text-sm uppercase tracking-[0.12em] text-[var(--qx-text)]">
              Host: <span className="font-mono text-cyan-200">{destroyerDnsRecordName}</span>
            </p>
            <p className="text-sm uppercase tracking-[0.12em] text-[var(--qx-text)]">
              Value: <span className="font-mono text-cyan-200">{destroyerDnsRecordValue}</span>
            </p>
          </div>

          <div className="space-y-3 border border-[var(--qx-border)] bg-black/25 p-4">
            {!verifyingDns && (
              <button
                type="button"
                onClick={() => {
                  if (actionsLocked) {
                    onBlockedAction();
                    return;
                  }

                  onVerifyDnsAction();
                }}
                className="border-2 border-[var(--qx-primary)] bg-[var(--qx-primary)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-black transition hover:bg-[var(--qx-primary-strong)] hover:text-white"
              >
                {dnsVerified ? "Verify DNS TXT Again" : "Verify DNS TXT"}
              </button>
            )}

            {verifyingDns && (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 border border-[var(--qx-primary)] bg-[var(--qx-primary)]/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
                  Verifying DNS TXT...
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--qx-muted)]">
                  DNS propagation can take a few minutes. Keep this tab open and retry if needed.
                </p>
              </div>
            )}

            {dnsVerified && !verifyingDns && (
              <p className="inline-flex border border-[var(--qx-success)] bg-[var(--qx-success)]/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                DNS Verified
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}