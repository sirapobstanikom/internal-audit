import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { STATUSES, type DocStatus } from "@/lib/constants";
import {
  createDocument,
  getDepartment,
  listDocuments,
  parseChecklist,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const status = searchParams.get("status") as DocStatus | null;

    let documents = await listDocuments();
    if (status && STATUSES.includes(status)) {
      documents = documents.filter((doc) => doc.status === status);
    }
    if (q) {
      documents = documents.filter((doc) => {
        const hay = `${doc.documentNo} ${doc.auditorName} ${doc.department.name} ${doc.department.code}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const auditorName = String(body.auditorName ?? "").trim();
    const departmentId = String(body.departmentId ?? "").trim();
    const submit = Boolean(body.submit);

    if (!auditorName || !departmentId) {
      return NextResponse.json(
        { error: "กรุณาระบุผู้ตรวจและแผนก" },
        { status: 400 },
      );
    }

    const department = await getDepartment(departmentId);
    if (!department) {
      return NextResponse.json({ error: "ไม่พบแผนกที่เลือก" }, { status: 400 });
    }

    const checklist = parseChecklist(body.checklist).filter((item) => item.question);
    if (submit && checklist.length === 0) {
      return NextResponse.json(
        { error: "กรุณาเพิ่มข้อตรวจอย่างน้อย 1 ข้อก่อนส่งเอกสาร" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const document = await createDocument({
      auditorName,
      departmentId,
      standards: Array.isArray(body.standards) ? (body.standards as string[]) : [],
      nonconformitySource: String(body.nonconformitySource ?? ""),
      dueDate: String(body.dueDate ?? ""),
      status: submit ? "PENDING_ACK" : "DRAFT",
      auditorSignName: String(body.auditorSignName ?? "").trim(),
      auditeeSignName: String(body.auditeeSignName ?? "").trim(),
      createdById: session.userId,
      submittedAt: submit ? now : null,
      checklist,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
