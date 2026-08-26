import { unlink, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";
import { mkdir } from "fs/promises";

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    await requireSession();
    const { id } = await params;
    const plan = await prisma.auditPlan.findUnique({
      where: { id },
      include: { uploadedBy: { select: { name: true, username: true } } },
    });
    if (!plan) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }
    return NextResponse.json({ plan });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.auditPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();
      const file = form.get("file");
      const data: { title?: string; fileName?: string; storedName?: string; sizeBytes?: number } =
        {};
      if (title) data.title = title;

      if (file instanceof File && file.size > 0) {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF" }, { status: 400 });
        }
        await ensureUploadDir();
        const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
        await writeFile(
          path.join(UPLOAD_DIR, storedName),
          Buffer.from(await file.arrayBuffer()),
        );
        data.fileName = file.name;
        data.storedName = storedName;
        data.sizeBytes = file.size;
        await unlink(path.join(UPLOAD_DIR, existing.storedName)).catch(() => undefined);
      }

      const plan = await prisma.auditPlan.update({
        where: { id },
        data,
        include: { uploadedBy: { select: { name: true, username: true } } },
      });
      return NextResponse.json({ plan });
    }

    const body = (await request.json()) as { title?: string };
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อไฟล์" }, { status: 400 });
    }
    const plan = await prisma.auditPlan.update({
      where: { id },
      data: { title: body.title.trim() },
      include: { uploadedBy: { select: { name: true, username: true } } },
    });
    return NextResponse.json({ plan });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.auditPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }
    await prisma.auditPlan.delete({ where: { id } });
    await unlink(path.join(UPLOAD_DIR, existing.storedName)).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
