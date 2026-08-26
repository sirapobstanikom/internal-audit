import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const [documents, openDocuments, plans, departments] = await Promise.all([
      prisma.auditDocument.count(),
      prisma.auditDocument.count({
        where: { status: { notIn: ["CLOSED", "WITHDRAWN"] } },
      }),
      prisma.auditPlan.count(),
      prisma.department.count(),
    ]);

    return NextResponse.json({
      documents,
      openDocuments,
      plans,
      departments,
    });
  } catch (error) {
    return jsonError(error);
  }
}
