"use client";

import { Printer } from "lucide-react";
import { RESULT_LABELS, STATUS_LABELS, type CheckResult, type DocStatus } from "@/lib/constants";
import { btnPrimary } from "@/lib/styles";
import type { AuditDocument } from "@/lib/types";
import { formatDate, formatStandards } from "@/lib/utils";

export function PrintDocument({ document }: { document: AuditDocument }) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="no-print mx-auto flex max-w-4xl justify-end px-6 py-4">
        <button type="button" className={btnPrimary} onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          พิมพ์เอกสาร
        </button>
      </div>
      <article className="mx-auto max-w-4xl bg-white px-10 py-12 shadow print:max-w-none print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-4">
          <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
            Internal Audit Record
          </p>
          <h1 className="mt-1 text-2xl font-bold">เอกสารตรวจประเมินภายใน</h1>
          <p className="mt-1 text-sm">เลขที่ {document.documentNo}</p>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Row label="สถานะ" value={STATUS_LABELS[document.status as DocStatus]} />
          <Row label="ผู้ตรวจประเมิน" value={document.auditorName} />
          <Row
            label="แผนก"
            value={`${document.department.code} — ${document.department.name}`}
          />
          <Row label="มาตรฐาน" value={formatStandards(document.standards) || "—"} />
          <Row label="ที่มาความไม่สอดคล้อง" value={document.nonconformitySource || "—"} />
          <Row
            label="กำหนดปิดงาน"
            value={document.dueDate ? formatDate(document.dueDate) : "—"}
          />
        </section>

        <h2 className="mt-8 mb-3 text-base font-semibold">Checklist</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-2 py-2 text-left">#</th>
              <th className="border border-slate-300 px-2 py-2 text-left">คำถาม / ข้อกำหนด</th>
              <th className="border border-slate-300 px-2 py-2 text-left">หลักฐาน</th>
              <th className="border border-slate-300 px-2 py-2 text-left">ผล</th>
            </tr>
          </thead>
          <tbody>
            {document.checklist.map((item, index) => (
              <tr key={item.id ?? index}>
                <td className="border border-slate-300 px-2 py-2">{index + 1}</td>
                <td className="border border-slate-300 px-2 py-2">{item.question}</td>
                <td className="border border-slate-300 px-2 py-2">{item.evidence || "—"}</td>
                <td className="border border-slate-300 px-2 py-2">
                  {RESULT_LABELS[item.result as CheckResult]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-12 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <p className="mb-16">ลงชื่อผู้ตรวจประเมิน</p>
            <p className="border-t border-slate-400 pt-2">
              {document.auditorSignName || "................................"}
            </p>
          </div>
          <div>
            <p className="mb-16">ลงชื่อผู้รับการตรวจ</p>
            <p className="border-t border-slate-400 pt-2">
              {document.auditeeSignName || "................................"}
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-slate-500">{label}: </span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
