import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { BRANCHES, type Branch } from "@/lib/constants";
import { createDepartment, listDepartments } from "@/lib/db";

export async function GET() {
  try {
    await requireSession();
    const departments = await listDepartments();
    return NextResponse.json({ departments });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      name?: string;
      code?: string;
      branch?: Branch;
    };
    const name = body.name?.trim() ?? "";
    const code = body.code?.trim() ?? "";
    const branch = body.branch;

    if (!name || !code || !branch || !BRANCHES.includes(branch)) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อ รหัส และสาขาให้ครบ" },
        { status: 400 },
      );
    }

    const department = await createDepartment({ name, code, branch });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
