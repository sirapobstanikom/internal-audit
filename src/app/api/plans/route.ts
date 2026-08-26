import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-ก-๙\s()]/g, "_").slice(0, 120);
}

export async function GET() {
  try {
    await requireSession();
    const plans = await prisma.auditPlan.findMany({
      include: { uploadedBy: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์ PDF" }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ต้องไม่เกิน 20 MB" }, { status: 400 });
    }

    await ensureUploadDir();
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

    const plan = await prisma.auditPlan.create({
      data: {
        title: title || sanitizeFileName(file.name.replace(/\.pdf$/i, "")),
        fileName: file.name,
        storedName,
        sizeBytes: file.size,
        uploadedById: session.userId,
      },
      include: { uploadedBy: { select: { name: true, username: true } } },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
