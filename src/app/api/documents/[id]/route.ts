import { NextRequest, NextResponse } from "next/server";
import type { CheckResult, DocStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { CHECK_RESULTS, STATUSES } from "@/lib/constants";

const documentInclude = {
  department: true,
  createdBy: { select: { name: true, username: true } },
  checklist: { orderBy: { sortOrder: "asc" as const } },
};

type Ctx = { params: Promise<{ id: string }> };

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

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    await requireSession();
    const { id } = await params;
    const document = await prisma.auditDocument.findUnique({
      where: { id },
      include: documentInclude,
    });
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
    const existing = await prisma.auditDocument.findUnique({ where: { id } });
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

    const data: {
      auditorName?: string;
      departmentId?: string;
      standards?: string;
      nonconformitySource?: string;
      dueDate?: string;
      status?: DocStatus;
      auditorSignName?: string;
      auditeeSignName?: string;
      submittedAt?: Date | null;
    } = {};

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
      data.submittedAt = existing.submittedAt ?? new Date();
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

    const document = await prisma.$transaction(async (tx) => {
      if (body.checklist) {
        await tx.checklistItem.deleteMany({ where: { documentId: id } });
        if (checklist.length > 0) {
          await tx.checklistItem.createMany({
            data: checklist.map((item) => ({ ...item, documentId: id })),
          });
        }
      }
      return tx.auditDocument.update({
        where: { id },
        data,
        include: documentInclude,
      });
    });

    return NextResponse.json({ document });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.auditDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
