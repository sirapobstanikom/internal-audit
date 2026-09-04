"use client";

import { CheckCircle2, Eye, Printer, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useUser } from "@/components/AppShell";
import { api } from "@/lib/api";
import { LEADER_REVIEW_STATUSES, type DocStatus } from "@/lib/constants";
import { btnDanger, btnPrimary, btnSecondary, cardClass } from "@/lib/styles";
import type { AuditDocument } from "@/lib/types";
import { formatDate, formatStandards } from "@/lib/utils";

type ReviewAction = "approve" | "reject" | "return";

export default function AcknowledgePage() {
  const user = useUser();
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<{ id: string; action: ReviewAction } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canAccess = user.role === "LEADER_AUDIT";

  async function load() {
    const res = await api<{ documents: AuditDocument[] }>("/api/documents");
    setDocuments(
      res.documents.filter((doc) =>
        LEADER_REVIEW_STATUSES.includes(doc.status as DocStatus),
      ),
    );
  }

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [canAccess]);

  async function review(doc: AuditDocument, action: ReviewAction) {
    setActing({ id: doc.id, action });
    setError("");
    setMessage("");
    try {
      await api(`/api/documents/${doc.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const texts = {
        approve: `อนุมัติผ่านเอกสาร ${doc.documentNo} แล้ว`,
        reject: `บันทึกไม่ผ่านเอกสาร ${doc.documentNo} แล้ว`,
        return: `ตีกลับเอกสาร ${doc.documentNo} เป็นร่างแล้ว`,
      } as const;
      setMessage(texts[action]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setActing(null);
    }
  }

  if (!canAccess) {
    return (
      <p className="text-sm text-rose-700">
        หน้านี้สำหรับหัวหน้าผู้ตรวจ (Leader Audit) เท่านั้น
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">กำลังโหลดเอกสารรอพิจารณา...</p>;
  }

  return (
    <div className="space-y-5">
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-slate-900">เอกสารรอพิจารณา</h2>
        <p className="mt-1 text-sm text-slate-500">
          เอกสารที่ผู้ตรวจส่งแล้ว จะแสดงที่นี่ให้ Leader Audit กด อนุมัติผ่าน / ไม่ผ่าน /
          หรือตีกลับ
        </p>
      </section>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">เลขที่</th>
              <th className="px-4 py-3 font-medium">แผนก</th>
              <th className="px-4 py-3 font-medium">ผู้ตรวจ</th>
              <th className="px-4 py-3 font-medium">มาตรฐาน</th>
              <th className="px-4 py-3 font-medium">กำหนดปิดงาน</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  ไม่มีเอกสารรอพิจารณา
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const busy = acting?.id === doc.id;
                return (
                  <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{doc.documentNo}</td>
                    <td className="px-4 py-3">
                      {doc.department.name}
                      <span className="block text-xs text-slate-400">{doc.department.code}</span>
                    </td>
                    <td className="px-4 py-3">{doc.auditorName}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatStandards(doc.standards) || "—"}
                    </td>
                    <td className="px-4 py-3">{doc.dueDate ? formatDate(doc.dueDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/documents/${doc.id}`} className={`${btnSecondary} px-2 py-1.5`}>
                          <Eye className="h-3.5 w-3.5" />
                          ดู
                        </Link>
                        <Link
                          href={`/print/${doc.id}`}
                          target="_blank"
                          className={`${btnSecondary} px-2 py-1.5`}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          พิมพ์
                        </Link>
                        <button
                          type="button"
                          className={`${btnPrimary} px-2 py-1.5`}
                          disabled={busy}
                          onClick={() => review(doc, "approve")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {busy && acting?.action === "approve" ? "..." : "ผ่าน"}
                        </button>
                        <button
                          type="button"
                          className={`${btnDanger} px-2 py-1.5`}
                          disabled={busy}
                          onClick={() => review(doc, "reject")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {busy && acting?.action === "reject" ? "..." : "ไม่ผ่าน"}
                        </button>
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1.5`}
                          disabled={busy}
                          onClick={() => review(doc, "return")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {busy && acting?.action === "return" ? "..." : "ตีกลับ"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
