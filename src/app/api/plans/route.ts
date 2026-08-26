import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { listPlans, newId, supabase } from "@/lib/db";
import { uploadPlanPdf } from "@/lib/uploads";

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-ก-๙\s()]/g, "_").slice(0, 120);
}

export async function GET() {
  try {
    await requireSession();
    const plans = await listPlans();
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

    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    await uploadPlanPdf(storedName, new Uint8Array(await file.arrayBuffer()));

    const now = new Date().toISOString();
    const { data: plan, error } = await supabase()
      .from("audit_plans")
      .insert({
        id: newId(),
        title: title || sanitizeFileName(file.name.replace(/\.pdf$/i, "")),
        fileName: file.name,
        storedName,
        sizeBytes: file.size,
        uploadedById: session.userId,
        createdAt: now,
        updatedAt: now,
      })
      .select("*, uploadedBy:users!uploadedById(name, username)")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
