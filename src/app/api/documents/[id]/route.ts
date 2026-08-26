import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { STATUSES, type DocStatus } from "@/lib/constants";
import { getDocument, newId, parseChecklist, supabase } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    await requireSession();
    const { id } = await params;
    const document = await getDocument(id);
    if (!document) {
      return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
    }
    return NextResponse.json({ document });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await getDocument(id);
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
    }

    const isAdmin = session.role === "ADMIN";
    if (!isAdmin && existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "ผู้ใช้ทั่วไปแก้ไขได้เฉพาะเอกสารที่เป็นร่าง" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const submit = Boolean(body.submit);

    if (!isAdmin && body.status && body.status !== existing.status) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบที่เปลี่ยนสถานะได้" },
        { status: 403 },
      );
    }

    const data: Record<string, string | null> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof body.auditorName === "string") data.auditorName = body.auditorName.trim();
    if (typeof body.departmentId === "string") data.departmentId = body.departmentId;
    if (Array.isArray(body.standards)) data.standards = JSON.stringify(body.standards);
    if (typeof body.nonconformitySource === "string") {
      data.nonconformitySource = body.nonconformitySource;
    }
    if (typeof body.dueDate === "string") data.dueDate = body.dueDate;
    if (typeof body.auditorSignName === "string") {
      data.auditorSignName = body.auditorSignName.trim();
    }
    if (typeof body.auditeeSignName === "string") {
      data.auditeeSignName = body.auditeeSignName.trim();
    }

    if (submit) {
      data.status = "PENDING_ACK";
      data.submittedAt = existing.submittedAt ?? new Date().toISOString();
    } else if (isAdmin && typeof body.status === "string" && STATUSES.includes(body.status as DocStatus)) {
      data.status = body.status as DocStatus;
      if (body.status === "DRAFT") data.submittedAt = null;
    }

    const checklist = parseChecklist(body.checklist).filter((item) => item.question);
    if (submit && checklist.length === 0) {
      return NextResponse.json(
        { error: "กรุณาเพิ่มข้อตรวจอย่างน้อย 1 ข้อก่อนส่งเอกสาร" },
        { status: 400 },
      );
    }

    if (body.checklist) {
      const { error: delError } = await supabase()
        .from("checklist_items")
        .delete()
        .eq("documentId", id);
      if (delError) throw new Error(delError.message);
      if (checklist.length > 0) {
        const { error: insError } = await supabase().from("checklist_items").insert(
          checklist.map((item) => ({
            id: newId(),
            documentId: id,
            ...item,
          })),
        );
        if (insError) throw new Error(insError.message);
      }
    }

    const { error } = await supabase().from("audit_documents").update(data).eq("id", id);
    if (error) throw new Error(error.message);

    const document = await getDocument(id);
    return NextResponse.json({ document });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { error: itemsError } = await supabase()
      .from("checklist_items")
      .delete()
      .eq("documentId", id);
    if (itemsError) throw new Error(itemsError.message);
    const { error } = await supabase().from("audit_documents").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
