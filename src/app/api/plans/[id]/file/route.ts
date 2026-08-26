import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requireSession();
    const { id } = await params;
    const plan = await prisma.auditPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }
    const filePath = path.join(UPLOAD_DIR, plan.storedName);
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(plan.fileName)}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
