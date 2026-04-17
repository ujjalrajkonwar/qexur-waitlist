import type { DestroyerAttackLayer } from "@/types/qexur";

export type HarnessEntryPoint = {
  id: string;
  label: string;
  attackLayer: DestroyerAttackLayer;
  triggers: string[];
};

export type EntryPointInterpretation = {
  attackLayer: DestroyerAttackLayer;
  entryPointIds: string[];
  rationale: string;
  matchedEntryPoints: HarnessEntryPoint[];
};

export const HARNESS_ENTRY_POINTS: HarnessEntryPoint[] = [
  {
    id: "EP-COM-041",
    label: "Checkout Flow Object Ownership",
    attackLayer: "destroyer",
    triggers: ["checkout", "cart", "order"],
  },
  {
    id: "EP-IDOR-017",
    label: "Insecure Direct Object Reference",
    attackLayer: "destroyer",
    triggers: ["idor", "object reference", "horizontal privilege"],
  },
  {
    id: "EP-AUTH-022",
    label: "Session Fixation and Token Replay",
    attackLayer: "destroyer",
    triggers: ["session", "token", "jwt", "auth bypass", "session fixation"],
  },
  {
    id: "EP-WEB-009",
    label: "Cross-Site Scripting Vector Sweep",
    attackLayer: "surface",
    triggers: ["xss", "script injection", "cross site"],
  },
  {
    id: "EP-CLOUD-118",
    label: "Cloud Metadata and SSRF Abuse",
    attackLayer: "super-destroyer",
    triggers: ["ssrf", "metadata", "aws", "gcp", "azure instance metadata"],
  },
  {
    id: "EP-SUPPLY-207",
    label: "Supply Chain Dependency Exposure",
    attackLayer: "super-destroyer",
    triggers: ["dependency", "supply chain", "package", "typosquat", "lockfile"],
  },
  {
    id: "EP-BIZ-133",
    label: "Business Logic Abuse",
    attackLayer: "super-destroyer",
    triggers: ["logic flaw", "business logic", "workflow bypass"],
  },
  {
    id: "EP-PERIM-003",
    label: "External Surface Probe",
    attackLayer: "surface",
    triggers: ["headers", "ports", "surface", "recon"],
  },
];

function normalizeQuery(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function findEntryPointById(id: string): HarnessEntryPoint | undefined {
  const normalizedId = id.trim().toUpperCase();
  return HARNESS_ENTRY_POINTS.find((entryPoint) => entryPoint.id.toUpperCase() === normalizedId);
}

export function getEntryPointsByIds(ids: string[]): HarnessEntryPoint[] {
  return ids
    .map((id) => findEntryPointById(id))
    .filter((entryPoint): entryPoint is HarnessEntryPoint => Boolean(entryPoint));
}

export function resolveAttackLayerFromEntryPoints(
  entryPoints: Array<Pick<HarnessEntryPoint, "attackLayer">>,
): DestroyerAttackLayer {
  if (entryPoints.some((entryPoint) => entryPoint.attackLayer === "super-destroyer")) {
    return "super-destroyer";
  }

  if (entryPoints.some((entryPoint) => entryPoint.attackLayer === "destroyer")) {
    return "destroyer";
  }

  return "surface";
}

export function searchEntryPoints(rawQuery: string): HarnessEntryPoint[] {
  const query = normalizeQuery(rawQuery);

  if (!query) {
    return HARNESS_ENTRY_POINTS;
  }

  return HARNESS_ENTRY_POINTS.filter((entryPoint) => {
    if (entryPoint.id.toLowerCase().includes(query)) {
      return true;
    }

    if (entryPoint.label.toLowerCase().includes(query)) {
      return true;
    }

    return entryPoint.triggers.some((trigger) => trigger.toLowerCase().includes(query));
  });
}

export function interpretOwnerCommand(command: string): EntryPointInterpretation {
  const normalized = normalizeQuery(command);
  const matched = new Map<string, HarnessEntryPoint>();

  for (const entryPoint of HARNESS_ENTRY_POINTS) {
    if (entryPoint.triggers.some((trigger) => normalized.includes(trigger))) {
      matched.set(entryPoint.id, entryPoint);
    }
  }

  if (normalized.includes("checkout") && normalized.includes("idor")) {
    const checkout = findEntryPointById("EP-COM-041");
    const idor = findEntryPointById("EP-IDOR-017");

    if (checkout) {
      matched.set(checkout.id, checkout);
    }

    if (idor) {
      matched.set(idor.id, idor);
    }
  }

  if (matched.size === 0) {
    const fallback = findEntryPointById("EP-PERIM-003");

    if (fallback) {
      matched.set(fallback.id, fallback);
    }
  }

  const selected = Array.from(matched.values());
  const attackLayer = resolveAttackLayerFromEntryPoints(selected);

  return {
    attackLayer,
    entryPointIds: selected.map((entryPoint) => entryPoint.id),
    rationale:
      selected.length > 0
        ? `Mapped to ${selected.length} entry point(s) based on attack intent keywords.`
        : "Mapped to baseline reconnaissance profile.",
    matchedEntryPoints: selected,
  };
}
