"use client";

import { ArrowDownAZ, Eye, Pencil, Printer, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useUser } from "@/components/AppShell";
import { api } from "@/lib/api";
import { STATUS_LABELS, STATUSES, type DocStatus } from "@/lib/constants";
import { btnSecondary, cardClass, inputClass } from "@/lib/styles";
import type { AuditDocument } from "@/lib/types";
import { formatDate, formatStandards } from "@/lib/utils";

type SortKey = "documentNo" | "department" | "auditorName" | "status" | "dueDate" | "createdAt";

export default function DocumentsPage() {
  const user = useUser();
  const isAdmin = user.role === "ADMIN";
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | DocStatus>("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState("");

  async function load() {
    const res = await api<{ documents: AuditDocument[] }>("/api/documents");
    setDocuments(res.documents);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const rows = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const hay = `${doc.documentNo} ${doc.auditorName} ${doc.department.name} ${doc.department.code}`.toLowerCase();
      const matchQ = !q || hay.includes(q.toLowerCase());
      const matchStatus = !status || doc.status === status;
      return matchQ && matchStatus;
    });
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av =
        sortKey === "department"
          ? a.department.name
          : sortKey === "status"
            ? a.status
            : String(a[sortKey] ?? "");
      const bv =
        sortKey === "department"
          ? b.department.name
          : sortKey === "status"
            ? b.status
            : String(b[sortKey] ?? "");
      return av.localeCompare(bv, "th") * dir;
    });
    return sorted;
  }, [documents, q, status, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function remove(doc: AuditDocument) {
    if (!confirm(`ลบเอกสาร ${doc.documentNo} ?`)) return;
    await api(`/api/documents/${doc.id}`, { method: "DELETE" });
    await load();
  }

  const headers: Array<{ key: SortKey; label: string }> = [
    { key: "documentNo", label: "เลขที่" },
    { key: "department", label: "แผนก" },
    { key: "auditorName", label: "ผู้ตรวจ" },
    { key: "status", label: "สถานะ" },
    { key: "dueDate", label: "กำหนดปิดงาน" },
    { key: "createdAt", label: "วันที่สร้าง" },
  ];

  return (
    <div className="space-y-5">
      <div className={`${cardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="ค้นหาเลขที่, ผู้ตรวจ, แผนก..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={`${inputClass} md:w-64`}
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | DocStatus)}
        >
          <option value="">ทุกสถานะ</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className={`${cardClass} overflow-x-auto`}>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              {headers.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">มาตรฐาน</th>
              <th className="px-4 py-3 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  ไม่พบเอกสาร
                </td>
              </tr>
            ) : (
              rows.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{doc.documentNo}</td>
                  <td className="px-4 py-3">
                    {doc.department.name}
                    <span className="block text-xs text-slate-400">{doc.department.code}</span>
                  </td>
                  <td className="px-4 py-3">{doc.auditorName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3">{doc.dueDate ? formatDate(doc.dueDate) : "—"}</td>
                  <td className="px-4 py-3">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatStandards(doc.standards) || "—"}</td>
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
                      {isAdmin || doc.status === "DRAFT" ? (
                        <Link href={`/forms/${doc.id}`} className={`${btnSecondary} px-2 py-1.5`}>
                          <Pencil className="h-3.5 w-3.5" />
                          แก้
                        </Link>
                      ) : null}
                      {isAdmin ? (
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1.5`}
                          onClick={() => remove(doc)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
