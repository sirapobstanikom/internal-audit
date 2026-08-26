import { NextRequest, NextResponse } from "next/server";
import type { CheckResult, DocStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/auth";
import { CHECK_RESULTS, STATUSES } from "@/lib/constants";

const documentInclude = {
  department: true,
  createdBy: { select: { name: true, username: true } },
  checklist: { orderBy: { sortOrder: "asc" as const } },
};

async function nextDocumentNo() {
  const year = new Date().getFullYear();
  const prefix = `IA-${year}-`;
  const last = await prisma.auditDocument.findFirst({
    where: { documentNo: { startsWith: prefix } },
    orderBy: { documentNo: "desc" },
  });
  const next = last ? Number(last.documentNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function parseChecklist(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = item as {
      question?: string;
      evidence?: string;
      result?: CheckResult;
    };
    const result = CHECK_RESULTS.includes(row.result as CheckResult)
      ? (row.result as CheckResult)
      : "CONFORM";
    return {
      question: String(row.question ?? "").trim(),
      evidence: String(row.evidence ?? "").trim(),
      result,
      sortOrder: index + 1,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") as DocStatus | null;

    const documents = await prisma.auditDocument.findMany({
      where: {
        ...(status && STATUSES.includes(status) ? { status } : {}),
        ...(q
          ? {
              OR: [
                { documentNo: { contains: q, mode: "insensitive" } },
                { auditorName: { contains: q, mode: "insensitive" } },
                { department: { name: { contains: q, mode: "insensitive" } } },
                { department: { code: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: documentInclude,
      orderBy: { createdAt: "desc" },
    });

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

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
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

    const document = await prisma.auditDocument.create({
      data: {
        documentNo: await nextDocumentNo(),
        auditorName,
        departmentId,
        standards: JSON.stringify(
          Array.isArray(body.standards) ? body.standards : [],
        ),
        nonconformitySource: String(body.nonconformitySource ?? ""),
        dueDate: String(body.dueDate ?? ""),
        status: submit ? "PENDING_ACK" : "DRAFT",
        auditorSignName: String(body.auditorSignName ?? "").trim(),
        auditeeSignName: String(body.auditeeSignName ?? "").trim(),
        createdById: session.userId,
        submittedAt: submit ? new Date() : null,
        checklist: { create: checklist },
      },
      include: documentInclude,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
