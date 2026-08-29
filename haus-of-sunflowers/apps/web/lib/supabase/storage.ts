import { createClient } from "./client";

const BUCKET = "research-files";

/**
 * Uploads a file to the private research-files bucket, under a path
 * namespaced by import batch id. The bucket itself is private (see
 * migration 015) and access is enforced by a storage RLS policy tied
 * to internal.is_owner() — this helper doesn't add security by
 * itself, the database does.
 */
export async function uploadResearchFile(file: File, batchId: string) {
  const supabase = createClient();
  const path = `imports/${batchId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  return data.path;
}

/**
 * Files are private, so a plain public URL won't work — this
 * generates a short-lived signed URL instead, generated server-side
 * on demand rather than stored anywhere.
 */
export async function getResearchFileUrl(path: string, expiresInSeconds = 60 * 5) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}
