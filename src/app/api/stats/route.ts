import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { countRows, supabase } from "@/lib/db";

export async function GET() {
  try {
    await requireSession();
    const { count: openDocuments, error } = await supabase()
      .from("audit_documents")
      .select("*", { count: "exact", head: true })
      .not("status", "in", "(CLOSED,WITHDRAWN)");
    if (error) throw new Error(error.message);

    const [documents, plans, departments] = await Promise.all([
      countRows("audit_documents"),
      countRows("audit_plans"),
      countRows("departments"),
    ]);

    return NextResponse.json({
      documents,
      openDocuments: openDocuments ?? 0,
      plans,
      departments,
    });
  } catch (error) {
    return jsonError(error);
  }
}
