import { z } from "zod";

export const authRequestSchema = z.object({
  mode: z.enum(["login", "signup"]),
  email: z.string().email(),
  password: z.string().min(8),
  agreedToTerms: z.literal(true),
});

export const artifactPointerSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
  fileName: z.string().min(1),
  size: z.number().int().nonnegative(),
  contentType: z.string().min(1),
  fileCount: z.number().int().positive().optional(),
});

const scanModeSchema = z.enum(["core", "elite"]).default("core");
const scanIntensitySchema = z.enum(["surface-scan", "deep-audit"]).default("surface-scan");

const auditorGithubRequestSchema = z.object({
  feature: z.literal("auditor"),
  source: z.literal("github-connect"),
  repositoryUrl: z.string().url(),
  mode: scanModeSchema,
  intensity: scanIntensitySchema,
});

const auditorUploadRequestSchema = z.object({
  feature: z.literal("auditor"),
  source: z.enum(["zip-upload", "folder-upload"]),
  artifact: artifactPointerSchema,
  folderStructure: z.array(z.string().min(1)).optional(),
  mode: scanModeSchema,
  intensity: scanIntensitySchema,
});

export const auditorRequestSchema = z.union([auditorGithubRequestSchema, auditorUploadRequestSchema]);

const wpAuditorUrlRequestSchema = z.object({
  feature: z.literal("wp-auditor"),
  source: z.literal("url"),
  targetUrl: z.string().url(),
  mode: scanModeSchema,
  intensity: scanIntensitySchema,
});

const wpAuditorPluginRequestSchema = z.object({
  feature: z.literal("wp-auditor"),
  source: z.literal("plugin-zip"),
  artifact: artifactPointerSchema,
  mode: scanModeSchema,
  intensity: scanIntensitySchema,
});

export const wpAuditorRequestSchema = z.union([wpAuditorUrlRequestSchema, wpAuditorPluginRequestSchema]);

export const artifactUploadFormSchema = z.object({
  feature: z.enum(["auditor", "wp-auditor"]),
  source: z.enum(["zip-upload", "folder-upload", "plugin-zip"]),
});

export const destroyerDnsVerifySchema = z.object({
  feature: z.literal("destroyer"),
  targetUrl: z.string().url(),
  dnsTxtRecord: z.string().min(6),
});

export const destroyerExecuteSchema = z.object({
  feature: z.literal("destroyer"),
  targetUrl: z.string().url(),
  dnsVerified: z.literal(true),
  riskAccepted: z.literal(true),
  attackLayer: z.enum(["surface", "destroyer", "super-destroyer"]).default("surface"),
  entryPointIds: z.array(z.string().min(1)).max(64).optional(),
});

const destroyerProgressStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const destroyerProgressWebhookSchema = z
  .object({
    jobId: z.string().min(1).max(200),
    status: destroyerProgressStatusSchema,
    executedAttacks: z.coerce.number().int().nonnegative(),
    totalAttacks: z.coerce.number().int().nonnegative(),
    nextStep: z.string().min(1).max(500).optional(),
    details: z.string().min(1).max(3000).optional(),
    userId: z.string().min(1).max(200).optional(),
    sentAt: z.string().datetime().optional(),
  })
  .superRefine((value, context) => {
    if (value.totalAttacks > 0 && value.executedAttacks > value.totalAttacks) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["executedAttacks"],
        message: "executedAttacks cannot be greater than totalAttacks.",
      });
    }
  });

export type AuditorRequest = z.infer<typeof auditorRequestSchema>;
export type WpAuditorRequest = z.infer<typeof wpAuditorRequestSchema>;
export type DestroyerDnsVerifyRequest = z.infer<typeof destroyerDnsVerifySchema>;
export type DestroyerExecuteRequest = z.infer<typeof destroyerExecuteSchema>;
export type DestroyerProgressWebhookPayload = z.infer<typeof destroyerProgressWebhookSchema>;