"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UploadState = "idle" | "uploading" | "done" | "error";

export function BookImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("The Root Worker's Formulary");
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const configured = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    []
  );

  async function handleUpload() {
    if (!file || !configured) return;

    setState("uploading");
    setMessage("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Please sign in before importing.");

      const { data: batchData, error: batchError } = await supabase
        .schema("api")
        .rpc("import_create_batch", {
          p_title: title || file.name,
          p_import_type: "pdf",
          p_original_filename: file.name,
          p_linked_source_id: null,
          p_notes: "Book-led import. Treat published Haus of Sunflowers content as the primary product layer.",
        });

      if (batchError) throw batchError;

      const batchId =
        typeof batchData === "string"
          ? batchData
          : Array.isArray(batchData)
            ? batchData[0]?.id ?? batchData[0]
            : (batchData as { id?: string } | null)?.id ?? batchData;

      if (!batchId || typeof batchId !== "string") {
        throw new Error("The import batch was created, but its ID could not be resolved.");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${batchId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("research-files")
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type || "application/pdf",
        });

      if (uploadError) throw uploadError;

      const { error: fileError } = await supabase
        .schema("api")
        .rpc("import_update_batch_file", {
          p_batch_id: batchId,
          p_source_file_path: storagePath,
        });

      if (fileError) throw fileError;

      setState("done");
      setMessage("Uploaded and staged. The book is now ready for structured extraction and review.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  return (
    <section className="upload-card">
      <div className="upload-icon" aria-hidden="true">⇧</div>
      <div className="upload-copy">
        <div className="eyebrow">Book-led ingestion</div>
        <h2>Upload a book or research source</h2>
        <p>
          The Rootworker&apos;s Formulary is treated as the primary product layer. Historical
          sources remain attached as deeper evidence and bonus research.
        </p>

        <label className="compact-label" htmlFor="import-title">Source title</label>
        <input
          id="import-title"
          className="field"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label className="file-drop" htmlFor="book-file">
          <input
            id="book-file"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <strong>{file ? file.name : "Choose PDF"}</strong>
          <span>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ready to stage`
              : "PDF books and source documents"}
          </span>
        </label>

        <button
          className="primary-cta"
          type="button"
          disabled={!file || !configured || state === "uploading"}
          onClick={handleUpload}
        >
          {state === "uploading" ? "Uploading…" : "Upload & Stage Source"}
        </button>

        {!configured && (
          <p className="inline-note">Preview mode: uploads are available on the production deployment.</p>
        )}
        {message && (
          <p className={state === "error" ? "inline-note error" : "inline-note success"}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
