import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { count, error: countError } = await supabase()
      .from("audit_documents")
      .select("*", { count: "exact", head: true })
      .eq("departmentId", id);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบแผนกที่มีเอกสารตรวจประเมินอยู่แล้ว" },
        { status: 400 },
      );
    }
    const { error } = await supabase().from("departments").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
