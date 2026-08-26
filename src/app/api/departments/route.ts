import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAdmin, requireSession } from "@/lib/auth";
import { BRANCHES, type Branch } from "@/lib/constants";

export async function GET() {
  try {
    await requireSession();
    const departments = await prisma.department.findMany({
      orderBy: [{ branch: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
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

    const last = await prisma.department.findFirst({
      where: { branch },
      orderBy: { sortOrder: "desc" },
    });

    const department = await prisma.department.create({
      data: {
        name,
        code,
        branch,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
