"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuditForm } from "@/components/AuditForm";

function FormsInner() {
  const searchParams = useSearchParams();
  return <AuditForm presetDepartmentId={searchParams.get("departmentId") ?? undefined} />;
}

export default function FormsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">กำลังเปิดแบบฟอร์ม...</p>}>
      <FormsInner />
    </Suspense>
  );
}
