import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { getPlan } from "@/lib/db";
import { downloadPlanPdf } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requireSession();
    const { id } = await params;
    const plan = await getPlan(id);
    if (!plan) {
      return NextResponse.json({ error: "ไม่พบไฟล์แผนตรวจ" }, { status: 404 });
    }
    const data = await downloadPlanPdf(plan.storedName);
    return new NextResponse(data, {
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
