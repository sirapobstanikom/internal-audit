"use client";

import { Pencil, Printer } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useUser } from "@/components/AppShell";
import { api } from "@/lib/api";
import { RESULT_LABELS, type CheckResult } from "@/lib/constants";
import { btnPrimary, btnSecondary, cardClass } from "@/lib/styles";
import type { AuditDocument } from "@/lib/types";
import { formatDate, formatDateTime, formatStandards } from "@/lib/utils";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useUser();
  const [doc, setDoc] = useState<AuditDocument | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ document: AuditDocument }>(`/api/documents/${id}`)
      .then((res) => setDoc(res.document))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!doc) return <p className="text-sm text-slate-500">กำลังโหลดเอกสาร...</p>;

  const canEdit = user.role === "ADMIN" || doc.status === "DRAFT";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">เลขที่เอกสาร</p>
          <h2 className="text-2xl font-semibold text-slate-900">{doc.documentNo}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={doc.status} />
          <Link href={`/print/${doc.id}`} target="_blank" className={btnSecondary}>
            <Printer className="h-4 w-4" />
            พิมพ์
          </Link>
          {canEdit ? (
            <Link href={`/forms/${doc.id}`} className={btnPrimary}>
              <Pencil className="h-4 w-4" />
              แก้ไข
            </Link>
          ) : null}
        </div>
      </div>

      <section className={`${cardClass} grid gap-4 p-6 md:grid-cols-2`}>
        <Field label="ผู้ตรวจประเมิน" value={doc.auditorName} />
        <Field label="แผนก" value={`${doc.department.code} — ${doc.department.name}`} />
        <Field label="มาตรฐาน" value={formatStandards(doc.standards) || "—"} />
        <Field label="ที่มาความไม่สอดคล้อง" value={doc.nonconformitySource || "—"} />
        <Field label="กำหนดปิดงาน" value={doc.dueDate ? formatDate(doc.dueDate) : "—"} />
        <Field label="สร้างโดย" value={`${doc.createdBy.name} · ${formatDateTime(doc.createdAt)}`} />
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <h3 className="border-b border-slate-100 px-6 py-4 font-semibold">Checklist</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">คำถาม</th>
              <th className="px-4 py-2">หลักฐาน</th>
              <th className="px-4 py-2">ผล</th>
            </tr>
          </thead>
          <tbody>
            {doc.checklist.map((item, index) => (
              <tr key={item.id ?? index} className="border-t border-slate-100">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{item.question}</td>
                <td className="px-4 py-3 text-slate-600">{item.evidence || "—"}</td>
                <td className="px-4 py-3">
                  {RESULT_LABELS[item.result as CheckResult]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={`${cardClass} grid gap-4 p-6 md:grid-cols-2`}>
        <Field label="ผู้ตรวจประเมิน (ลงนาม)" value={doc.auditorSignName || "—"} />
        <Field label="ผู้รับการตรวจ (ลงนาม)" value={doc.auditeeSignName || "—"} />
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
