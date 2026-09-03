"use client";

import { Plus, Save, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import {
  getChecklistQuestions,
  getChecklistSectionTitle,
  isTemplateQuestion,
} from "@/lib/checklists";
import {
  CHECK_RESULTS,
  RESULT_LABELS,
  SOURCE_OPTIONS,
  STANDARD_OPTIONS,
  STATUSES,
  STATUS_LABELS,
  type CheckResult,
  type DocStatus,
} from "@/lib/constants";
import { btnPrimary, btnSecondary, cardClass, inputClass, labelClass } from "@/lib/styles";
import type { AuditDocument, ChecklistItem, Department } from "@/lib/types";
import { cn, parseStandards } from "@/lib/utils";

type FormState = {
  auditorName: string;
  departmentId: string;
  standards: string[];
  nonconformitySource: string;
  dueDate: string;
  status: DocStatus;
  auditorSignName: string;
  auditeeSignName: string;
  checklist: Array<Pick<ChecklistItem, "question" | "evidence" | "result">>;
};

function emptyItem(): FormState["checklist"][number] {
  return { question: "", evidence: "", result: "CONFORM" };
}

export function AuditForm({
  documentId,
  presetDepartmentId,
}: {
  documentId?: string;
  presetDepartmentId?: string;
}) {
  const user = useUser();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [existing, setExisting] = useState<AuditDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState<FormState>({
    auditorName: user.name,
    departmentId: presetDepartmentId ?? "",
    standards: [],
    nonconformitySource: "การตรวจประเมินภายใน",
    dueDate: "",
    status: "DRAFT",
    auditorSignName: user.name,
    auditeeSignName: "",
    checklist: [emptyItem()],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const deptRes = await api<{ departments: Department[] }>("/api/departments");
        if (cancelled) return;
        setDepartments(deptRes.departments);
        if (documentId) {
          const docRes = await api<{ document: AuditDocument }>(`/api/documents/${documentId}`);
          if (cancelled) return;
          const doc = docRes.document;
          setExisting(doc);
          setForm({
            auditorName: doc.auditorName,
            departmentId: doc.departmentId,
            standards: parseStandards(doc.standards),
            nonconformitySource: doc.nonconformitySource,
            dueDate: doc.dueDate,
            status: doc.status,
            auditorSignName: doc.auditorSignName,
            auditeeSignName: doc.auditeeSignName,
            checklist:
              doc.checklist.length > 0
                ? doc.checklist.map((item) => ({
                    question: item.question,
                    evidence: item.evidence,
                    result: item.result,
                  }))
                : [emptyItem()],
          });
        }
      } catch (error) {
        setMessage({
          type: "err",
          text: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const canEdit = user.role === "ADMIN" || !existing || existing.status === "DRAFT";
  const canChangeStatus = user.role === "ADMIN" && Boolean(existing);

  const groupedDepts = useMemo(() => {
    return {
      HO: departments.filter((d) => d.branch === "HO"),
      BP: departments.filter((d) => d.branch === "BP"),
      LB: departments.filter((d) => d.branch === "LB"),
    };
  }, [departments]);

  const groupedChecklist = useMemo(() => {
    const groups: Array<{
      title: string;
      items: Array<{ item: FormState["checklist"][number]; index: number }>;
    }> = [];

    form.checklist.forEach((item, index) => {
      const title = getChecklistSectionTitle(item.question) ?? "";
      const last = groups[groups.length - 1];
      if (last && last.title === title) {
        last.items.push({ item, index });
        return;
      }
      groups.push({ title, items: [{ item, index }] });
    });

    return groups;
  }, [form.checklist]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStandard(id: string) {
    setForm((prev) => {
      const adding = !prev.standards.includes(id);
      const nextStandards = adding
        ? [...prev.standards, id]
        : prev.standards.filter((item) => item !== id);
      const templateQuestions = getChecklistQuestions(id);
      if (templateQuestions.length === 0) {
        return { ...prev, standards: nextStandards };
      }

      const templateSet = new Set(templateQuestions);
      if (adding) {
        const existingQuestions = new Set(prev.checklist.map((item) => item.question));
        const kept = prev.checklist.filter(
          (item) => item.question.trim() !== "" || item.evidence.trim() !== "",
        );
        const toAdd = templateQuestions
          .filter((question) => !existingQuestions.has(question))
          .map((question) => ({
            question,
            evidence: "",
            result: "CONFORM" as const,
          }));
        return {
          ...prev,
          standards: nextStandards,
          checklist: [...kept, ...toAdd],
        };
      }

      const remaining = prev.checklist.filter((item) => !templateSet.has(item.question));
      return {
        ...prev,
        standards: nextStandards,
        checklist: remaining.length > 0 ? remaining : [emptyItem()],
      };
    });
  }

  function updateItem(index: number, patch: Partial<FormState["checklist"][number]>) {
    update(
      "checklist",
      form.checklist.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function save(submit: boolean) {
    setMessage(null);
    setSaving(submit ? "submit" : "draft");
    try {
      const payload = {
        ...form,
        submit,
        status: submit ? "PENDING_ACK" : form.status,
      };
      const res = documentId
        ? await api<{ document: AuditDocument }>(`/api/documents/${documentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await api<{ document: AuditDocument }>("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      setExisting(res.document);
      setForm((prev) => ({ ...prev, status: res.document.status }));
      setMessage({
        type: "ok",
        text: submit ? "ส่งเอกสารเรียบร้อย" : "บันทึกร่างเรียบร้อย",
      });
      if (!documentId) {
        router.replace(`/forms/${res.document.id}`);
      }
    } catch (error) {
      setMessage({
        type: "err",
        text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
      });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">กำลังโหลดแบบฟอร์ม...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {existing
              ? `เลขที่เอกสาร ${existing.documentNo}`
              : "เลขที่เอกสารจะสร้างอัตโนมัติเมื่อบันทึก"}
          </p>
          {!canEdit ? (
            <p className="mt-1 text-sm text-amber-700">
              เอกสารนี้ถูกส่งแล้ว ผู้ใช้ทั่วไปไม่สามารถแก้ไขได้ — เฉพาะ Admin ที่ปรับสถานะและแก้ไขต่อได้
            </p>
          ) : null}
        </div>
        {existing ? <StatusBadge status={form.status} /> : null}
      </div>

      {message ? (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800",
          )}
        >
          {message.text}
        </div>
      ) : null}

      <section className={cn(cardClass, "p-6")}>
        <h2 className="mb-4 text-base font-semibold text-slate-900">1. หัวเอกสาร</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>ผู้ตรวจประเมิน</label>
            <input
              className={inputClass}
              value={form.auditorName}
              disabled={!canEdit}
              onChange={(e) => update("auditorName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>แผนกที่รับการตรวจ</label>
            <select
              className={inputClass}
              value={form.departmentId}
              disabled={!canEdit}
              onChange={(e) => update("departmentId", e.target.value)}
            >
              <option value="">เลือกแผนก</option>
              {(["HO", "BP", "LB"] as const).map((branch) => (
                <optgroup
                  key={branch}
                  label={
                    branch === "HO"
                      ? "HO สำนักงานใหญ่"
                      : branch === "BP"
                        ? "BP หน่วยงาน BP"
                        : "LB โรงงาน / สายผลิต"
                  }
                >
                  {groupedDepts[branch].map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} — {dept.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <p className={labelClass}>มาตรฐานที่ใช้ตรวจ</p>
            <div className="flex flex-wrap gap-3">
              {STANDARD_OPTIONS.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    form.standards.includes(item.id)
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-700",
                    !canEdit && "opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-teal-700"
                    disabled={!canEdit}
                    checked={form.standards.includes(item.id)}
                    onChange={() => toggleStandard(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>ที่มาความไม่สอดคล้อง</label>
            <select
              className={inputClass}
              value={form.nonconformitySource}
              disabled={!canEdit}
              onChange={(e) => update("nonconformitySource", e.target.value)}
            >
              {SOURCE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>กำหนดปิดงาน</label>
            <input
              type="date"
              className={inputClass}
              value={form.dueDate}
              disabled={!canEdit}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </div>
          {canChangeStatus ? (
            <div>
              <label className={labelClass}>สถานะเอกสาร (Admin)</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => update("status", e.target.value as DocStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </section>

      <section className={cn(cardClass, "p-6")}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">2. Checklist</h2>
          {canEdit ? (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => update("checklist", [...form.checklist, emptyItem()])}
            >
              <Plus className="h-4 w-4" />
              เพิ่มคำถาม
            </button>
          ) : null}
        </div>
        <div className="space-y-5">
          {groupedChecklist.map((group, groupIndex) => (
            <div key={`${group.title}-${groupIndex}`} className="space-y-3">
              {group.title ? (
                <h3 className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
                  {group.title}
                </h3>
              ) : null}
              {group.items.map(({ item, index }) => {
                const fromTemplate = isTemplateQuestion(item.question);
                return (
                  <div
                    key={`${item.question}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">
                        ข้อที่ {index + 1}
                      </p>
                      {canEdit && form.checklist.length > 1 ? (
                        <button
                          type="button"
                          className="text-rose-600 hover:text-rose-800"
                          onClick={() =>
                            update(
                              "checklist",
                              form.checklist.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <label className={labelClass}>คำถาม / ข้อกำหนด</label>
                        {fromTemplate ? (
                          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                            {item.question}
                          </p>
                        ) : (
                          <textarea
                            rows={2}
                            className={inputClass}
                            disabled={!canEdit}
                            value={item.question}
                            onChange={(e) =>
                              updateItem(index, { question: e.target.value })
                            }
                          />
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>หลักฐาน</label>
                        <textarea
                          rows={2}
                          className={inputClass}
                          disabled={!canEdit}
                          value={item.evidence}
                          onChange={(e) =>
                            updateItem(index, { evidence: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>ผลการตรวจ</label>
                        <select
                          className={inputClass}
                          disabled={!canEdit}
                          value={item.result}
                          onChange={(e) =>
                            updateItem(index, {
                              result: e.target.value as CheckResult,
                            })
                          }
                        >
                          {CHECK_RESULTS.map((result) => (
                            <option key={result} value={result}>
                              {RESULT_LABELS[result]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className={cn(cardClass, "p-6")}>
        <h2 className="mb-4 text-base font-semibold text-slate-900">3. ลงนาม</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>ชื่อผู้ตรวจประเมิน</label>
            <input
              className={inputClass}
              disabled={!canEdit}
              value={form.auditorSignName}
              onChange={(e) => update("auditorSignName", e.target.value)}
            />
            <p className="mt-2 border-t border-dashed border-slate-300 pt-6 text-center text-xs text-slate-400">
              ลายมือชื่อผู้ตรวจ
            </p>
          </div>
          <div>
            <label className={labelClass}>ชื่อผู้รับการตรวจ</label>
            <input
              className={inputClass}
              disabled={!canEdit}
              value={form.auditeeSignName}
              onChange={(e) => update("auditeeSignName", e.target.value)}
            />
            <p className="mt-2 border-t border-dashed border-slate-300 pt-6 text-center text-xs text-slate-400">
              ลายมือชื่อผู้รับการตรวจ
            </p>
          </div>
        </div>
      </section>

      {canEdit ? (
        <div className="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <button
            type="button"
            className={btnSecondary}
            disabled={Boolean(saving)}
            onClick={() => save(false)}
          >
            <Save className="h-4 w-4" />
            {saving === "draft" ? "กำลังบันทึก..." : "บันทึกร่าง"}
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={Boolean(saving)}
            onClick={() => save(true)}
          >
            <Send className="h-4 w-4" />
            {saving === "submit" ? "กำลังส่ง..." : "ส่งเอกสาร"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
