import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { countOpenDocuments, countRows } from "@/lib/db";

export async function GET() {
  try {
    await requireSession();
    const [documents, openDocuments, plans, departments] = await Promise.all([
      countRows("audit_documents"),
      countOpenDocuments(),
      countRows("audit_plans"),
      countRows("departments"),
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
