"use client";

import {
  Eye,
  FileUp,
  Pencil,
  Replace,
  Trash2,
  Upload,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { useUser } from "@/components/AppShell";
import { api } from "@/lib/api";
import { btnPrimary, btnSecondary, cardClass, inputClass, labelClass } from "@/lib/styles";
import type { AuditPlan } from "@/lib/types";
import { formatBytes, formatDateTime } from "@/lib/utils";

export default function PlansPage() {
  const user = useUser();
  const isAdmin = user.role === "ADMIN";
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [plans, setPlans] = useState<AuditPlan[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<AuditPlan | null>(null);
  const [rename, setRename] = useState<AuditPlan | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [replaceTarget, setReplaceTarget] = useState<AuditPlan | null>(null);

  async function load() {
    const res = await api<{ plans: AuditPlan[] }>("/api/plans");
    setPlans(res.plans);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์ PDF");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", title);
      await api("/api/plans", { method: "POST", body: form });
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function saveRename() {
    if (!rename) return;
    await api(`/api/plans/${rename.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameValue }),
    });
    setRename(null);
    await load();
  }

  async function replaceFile(next: File) {
    if (!replaceTarget) return;
    const form = new FormData();
    form.set("file", next);
    await api(`/api/plans/${replaceTarget.id}`, { method: "PATCH", body: form });
    setReplaceTarget(null);
    await load();
  }

  async function remove(plan: AuditPlan) {
    if (!confirm(`ลบไฟล์ "${plan.title}" ?`)) return;
    await api(`/api/plans/${plan.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        ทุกคนแนบไฟล์และดูตัวอย่างได้ {isAdmin ? "คุณเป็น Admin จึงแก้ชื่อ เปลี่ยนไฟล์ หรือลบได้" : "เฉพาะ Admin ที่แก้ชื่อ เปลี่ยนไฟล์ หรือลบได้"}
      </p>

      <form onSubmit={upload} className={cnUpload()}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">แนบไฟล์แผนการตรวจ (PDF)</h2>
            <p className="text-sm text-slate-500">ขนาดไม่เกิน 20 MB</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className={labelClass}>ชื่อแผนตรวจ</label>
            <input
              className={inputClass}
              placeholder="เช่น แผนตรวจภายในประจำปี 2569"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <label className={`${btnSecondary} cursor-pointer`}>
            <FileUp className="h-4 w-4" />
            {file ? file.name : "เลือกไฟล์ PDF"}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        <button type="submit" className={`${btnPrimary} mt-4`} disabled={busy}>
          {busy ? "กำลังอัปโหลด..." : "อัปโหลด"}
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.length === 0 ? (
          <div className={`${cardClass} p-8 text-sm text-slate-500 md:col-span-2 xl:col-span-3`}>
            ยังไม่มีไฟล์แผนตรวจ อัปโหลด PDF เพื่อเริ่มคลังแผน
          </div>
        ) : (
          plans.map((plan) => (
            <article key={plan.id} className={`${cardClass} flex flex-col p-5`}>
              <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <FileUp className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-900">{plan.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {plan.fileName} · {formatBytes(plan.sizeBytes)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                โดย {plan.uploadedBy.name} · {formatDateTime(plan.createdAt)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setPreview(plan)}
                >
                  <Eye className="h-4 w-4" />
                  ดูตัวอย่าง
                </button>
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        setRename(plan);
                        setRenameValue(plan.title);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      ชื่อ
                    </button>
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        setReplaceTarget(plan);
                        replaceRef.current?.click();
                      }}
                    >
                      <Replace className="h-4 w-4" />
                      ไฟล์
                    </button>
                    <button type="button" className={btnSecondary} onClick={() => remove(plan)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <input
        ref={replaceRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const next = e.target.files?.[0];
          if (next) replaceFile(next);
          e.target.value = "";
        }}
      />

      <Modal
        open={Boolean(preview)}
        title={preview?.title ?? "ดูตัวอย่าง"}
        wide
        onClose={() => setPreview(null)}
      >
        {preview ? (
          <iframe
            title={preview.title}
            src={`/api/plans/${preview.id}/file`}
            className="h-[70vh] w-full rounded-lg border border-slate-200"
          />
        ) : null}
      </Modal>

      <Modal open={Boolean(rename)} title="แก้ชื่อไฟล์แผนตรวจ" onClose={() => setRename(null)}>
        <div className="space-y-4">
          <input
            className={inputClass}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <button type="button" className={btnPrimary} onClick={saveRename}>
            บันทึกชื่อ
          </button>
        </div>
      </Modal>
    </div>
  );
}

function cnUpload() {
  return `${cardClass} p-6`;
}
