import { notFound, redirect } from "next/navigation";
import { PrintDocument } from "@/components/PrintDocument";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const document = await prisma.auditDocument.findUnique({
    where: { id },
    include: {
      department: true,
      createdBy: { select: { name: true, username: true } },
      checklist: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!document) notFound();
  return <PrintDocument document={JSON.parse(JSON.stringify(document))} />;
}
