import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import crypto from "crypto";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB
const ALLOWED_EXTS = ["stl", "obj", "3mf"];

const CONTENT_TYPES: Record<string, string> = {
  stl: "model/stl",
  obj: "text/plain",
  "3mf": "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 200MB limit" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Generate a unique key: orders/{random-id}/{original-filename}
    const id = crypto.randomUUID().slice(0, 8);
    const key = `orders/${id}/${file.name}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const fileKey = await storage.upload(key, buf, CONTENT_TYPES[ext] || "application/octet-stream");

    return NextResponse.json({ key: fileKey });
  } catch (err: unknown) {
    console.error("[upload] Error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
