import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAdmin } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const used = await prisma.auditDocument.count({ where: { departmentId: id } });
    if (used > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบแผนกที่มีเอกสารตรวจประเมินอยู่แล้ว" },
        { status: 400 },
      );
    }
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
