import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { LEADER_REVIEW_STATUSES, type DocStatus } from "@/lib/constants";
import { getDocument, updateDocument } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

type ReviewAction = "approve" | "reject" | "return";

const ACTION_STATUS: Record<ReviewAction, DocStatus> = {
  approve: "CLOSED",
  reject: "WITHDRAWN",
  return: "DRAFT",
};

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await getDocument(id);
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
    }

    if (session.role !== "LEADER_AUDIT") {
      return NextResponse.json(
        { error: "เฉพาะหัวหน้าผู้ตรวจ (Leader Audit) ที่อนุมัติ / ไม่ผ่าน / ตีกลับได้" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { action?: ReviewAction };
    const action = body.action;
    if (!action || !(action in ACTION_STATUS)) {
      return NextResponse.json({ error: "การดำเนินการไม่ถูกต้อง" }, { status: 400 });
    }

    if (!LEADER_REVIEW_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: "อนุมัติได้เฉพาะเอกสารที่ประเมินเสร็จและรอพิจารณาแล้ว" },
        { status: 400 },
      );
    }

    const patch: Parameters<typeof updateDocument>[1] = {
      status: ACTION_STATUS[action],
    };
    if (action === "return") {
      patch.submittedAt = null;
    }

    const document = await updateDocument(id, patch);
    return NextResponse.json({ document });
  } catch (error) {
    return jsonError(error);
  }
}
