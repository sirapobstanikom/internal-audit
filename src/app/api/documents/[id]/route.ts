import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { STATUSES, type DocStatus } from "@/lib/constants";
import { deleteDocument, getDocument, parseChecklist, updateDocument } from "@/lib/db";

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

    const patch: Parameters<typeof updateDocument>[1] = {};

    if (typeof body.auditorName === "string") patch.auditorName = body.auditorName.trim();
    if (typeof body.departmentId === "string") patch.departmentId = body.departmentId;
    if (Array.isArray(body.standards)) patch.standards = JSON.stringify(body.standards);
    if (typeof body.nonconformitySource === "string") {
      patch.nonconformitySource = body.nonconformitySource;
    }
    if (typeof body.dueDate === "string") patch.dueDate = body.dueDate;
    if (typeof body.auditorSignName === "string") {
      patch.auditorSignName = body.auditorSignName.trim();
    }
    if (typeof body.auditeeSignName === "string") {
      patch.auditeeSignName = body.auditeeSignName.trim();
    }

    if (submit) {
      patch.status = "PENDING_ACK";
      patch.submittedAt = existing.submittedAt ?? new Date().toISOString();
    } else if (
      isAdmin &&
      typeof body.status === "string" &&
      STATUSES.includes(body.status as DocStatus)
    ) {
      patch.status = body.status as DocStatus;
      if (body.status === "DRAFT") patch.submittedAt = null;
    }

    const checklist = parseChecklist(body.checklist).filter((item) => item.question);
    if (submit && checklist.length === 0) {
      return NextResponse.json(
        { error: "กรุณาเพิ่มข้อตรวจอย่างน้อย 1 ข้อก่อนส่งเอกสาร" },
        { status: 400 },
      );
    }
    if (body.checklist) {
      patch.checklist = checklist;
    }

    const document = await updateDocument(id, patch);
    return NextResponse.json({ document });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
