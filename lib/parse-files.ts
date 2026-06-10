"use client";

import { fileExtension } from "@/lib/format";

export const SUPPORTED_TEXT_EXTENSIONS = ["txt", "md"];
export const SUPPORTED_DOC_EXTENSIONS = ["docx", "pdf"];
export const AUDIO_VIDEO_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "mov", "webm"];

export const ACCEPTED_FILE_TYPES = ".txt,.md,.docx,.pdf";

export class FileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileParseError";
  }
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

/**
 * Parses an uploaded interview file into plain text.
 * Throws FileParseError with a user-facing message on unsupported or failed input.
 */
export async function parseUploadedFile(file: File): Promise<string> {
  const ext = fileExtension(file.name);

  if (AUDIO_VIDEO_EXTENSIONS.includes(ext)) {
    throw new FileParseError(
      "Audio and video transcription is not available yet. Upload a text transcript instead."
    );
  }

  try {
    if (SUPPORTED_TEXT_EXTENSIONS.includes(ext)) {
      return await file.text();
    }
    if (ext === "docx") {
      return await parseDocx(file);
    }
    if (ext === "pdf") {
      return await parsePdf(file);
    }
  } catch (err) {
    if (err instanceof FileParseError) throw err;
    throw new FileParseError(
      `Could not read ${file.name}. The file may be corrupted or password-protected.`
    );
  }

  throw new FileParseError(
    `Unsupported file type ".${ext}". Supported formats: .txt, .md, .docx, .pdf`
  );
}
