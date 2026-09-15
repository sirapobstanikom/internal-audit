import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { deletePlan, getPlan, updatePlan } from "@/lib/db";
import { deletePlanPdf, uploadPlanPdf } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    await requireSession();
    const { id } = await params;
    const plan = await getPlan(id);
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
    const existing = await getPlan(id);
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const data: Record<string, string | number> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();
      const file = form.get("file");
      if (title) data.title = title;

      if (file instanceof File && file.size > 0) {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF" }, { status: 400 });
        }
        const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
        await uploadPlanPdf(storedName, new Uint8Array(await file.arrayBuffer()));
        data.fileName = file.name;
        data.storedName = storedName;
        data.sizeBytes = file.size;
        await deletePlanPdf(existing.storedName);
      }
    } else {
      const body = (await request.json()) as { title?: string };
      if (!body.title?.trim()) {
        return NextResponse.json({ error: "กรุณาระบุชื่อไฟล์" }, { status: 400 });
      }
      data.title = body.title.trim();
    }

    const plan = await updatePlan(id, data);
    return NextResponse.json({ plan });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await getPlan(id);
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }
    await deletePlan(id);
    await deletePlanPdf(existing.storedName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
