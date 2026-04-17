import { NextResponse } from "next/server";

import {
  assertTermsAccepted,
  assertTrialRemaining,
  ComplianceError,
  requireAuthenticatedUser,
} from "@/lib/server/compliance";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { artifactUploadFormSchema } from "@/lib/validation/schemas";

const DEFAULT_STORAGE_BUCKET = "qexur-artifacts";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function sanitizeRelativePath(relativePath: string): string {
  return relativePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => {
      if (segment === "." || segment === "..") {
        return "segment";
      }

      return sanitizeFileName(segment);
    })
    .join("/");
}

async function ensureBucketExists(bucket: string) {
  const admin = createSupabaseServiceRoleClient();

  if (!admin) {
    throw new ComplianceError("SUPABASE_SERVICE_ROLE_KEY is missing. Storage uploads are unavailable.", 503);
  }

  const { data, error } = await admin.storage.getBucket(bucket);

  if (!error && data) {
    return admin;
  }

  await admin.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 1024 * 1024 * 200,
  });

  return admin;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    assertTermsAccepted(user);
    assertTrialRemaining(user);

    const formData = await request.formData();
    const feature = formData.get("feature");
    const source = formData.get("source");
    const file = formData.get("file");
    const files = formData.getAll("files");
    const relativePathsRaw = formData.get("relativePaths");

    const parsed = artifactUploadFormSchema.safeParse({
      feature,
      source,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid upload metadata." }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_STORAGE_BUCKET;
    const admin = await ensureBucketExists(bucket);

    if (parsed.data.source === "folder-upload") {
      let relativePaths: string[] = [];

      if (typeof relativePathsRaw === "string" && relativePathsRaw.trim().length > 0) {
        try {
          const parsedPaths = JSON.parse(relativePathsRaw) as unknown;
          if (Array.isArray(parsedPaths)) {
            relativePaths = parsedPaths.map((path) => String(path));
          }
        } catch {
          relativePaths = [];
        }
      }

      if (file instanceof File) {
        const safeName = sanitizeFileName(file.name || "folder-upload.zip");
        const objectPath = `${user.id}/${parsed.data.feature}/${parsed.data.source}/${Date.now()}-${safeName}`;
        const buffer = new Uint8Array(await file.arrayBuffer());

        const { error } = await admin.storage.from(bucket).upload(objectPath, buffer, {
          upsert: false,
          contentType: file.type || "application/zip",
        });

        if (error) {
          return NextResponse.json({ error: `Failed to upload folder artifact: ${error.message}` }, { status: 502 });
        }

        return NextResponse.json({
          message: "Optimized folder archive uploaded successfully.",
          artifact: {
            bucket,
            path: objectPath,
            fileName: safeName,
            size: file.size,
            contentType: file.type || "application/zip",
            fileCount: relativePaths.length > 0 ? relativePaths.length : undefined,
          },
        });
      }

      const folderFiles = files.filter((entry): entry is File => entry instanceof File);

      if (folderFiles.length === 0) {
        return NextResponse.json({ error: "No folder files were provided." }, { status: 400 });
      }

      const rootPath = `${user.id}/${parsed.data.feature}/${parsed.data.source}/${Date.now()}`;
      let totalSize = 0;

      for (let index = 0; index < folderFiles.length; index += 1) {
        const folderFile = folderFiles[index];
        const relativePath = sanitizeRelativePath(relativePaths[index] ?? folderFile.name);
        const objectPath = `${rootPath}/${relativePath || sanitizeFileName(folderFile.name)}`;
        const fileBytes = new Uint8Array(await folderFile.arrayBuffer());

        const { error } = await admin.storage.from(bucket).upload(objectPath, fileBytes, {
          upsert: false,
          contentType: folderFile.type || "application/octet-stream",
        });

        if (error) {
          return NextResponse.json(
            { error: `Failed to upload folder file ${relativePath}: ${error.message}` },
            { status: 502 },
          );
        }

        totalSize += folderFile.size;
      }

      return NextResponse.json({
        message: "Folder uploaded successfully.",
        artifact: {
          bucket,
          path: rootPath,
          fileName: "folder-upload-root",
          size: totalSize,
          contentType: "application/x-directory",
          fileCount: folderFiles.length,
        },
      });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No artifact file was provided." }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || "artifact.bin");
    const objectPath = `${user.id}/${parsed.data.feature}/${parsed.data.source}/${Date.now()}-${safeName}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    const { error } = await admin.storage.from(bucket).upload(objectPath, buffer, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    if (error) {
      return NextResponse.json({ error: `Failed to upload artifact: ${error.message}` }, { status: 502 });
    }

    return NextResponse.json({
      message: "Artifact uploaded successfully.",
      artifact: {
        bucket,
        path: objectPath,
        fileName: safeName,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      },
    });
  } catch (error) {
    if (error instanceof ComplianceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Upload pipeline failed." }, { status: 500 });
  }
}