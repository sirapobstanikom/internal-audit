"use client";

import { use } from "react";
import { AuditForm } from "@/components/AuditForm";

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuditForm documentId={id} />;
}
