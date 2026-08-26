import { notFound, redirect } from "next/navigation";
import { PrintDocument } from "@/components/PrintDocument";
import { getSession } from "@/lib/auth";
import { getDocument } from "@/lib/db";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) notFound();
  return <PrintDocument document={document} />;
}
