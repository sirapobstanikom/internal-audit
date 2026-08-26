"use client";

import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/components/AppShell";
import { api } from "@/lib/api";
import { BRANCH_META, BRANCHES, type Branch } from "@/lib/constants";
import { btnPrimary, cardClass, inputClass } from "@/lib/styles";
import type { Department } from "@/lib/types";

export default function OrganizationPage() {
  const user = useUser();
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState<Record<Branch, { name: string; code: string }>>({
    HO: { name: "", code: "" },
    BP: { name: "", code: "" },
    LB: { name: "", code: "" },
  });
  const [error, setError] = useState("");

  async function load() {
    const res = await api<{ departments: Department[] }>("/api/departments");
    setDepartments(res.departments);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function addDept(branch: Branch) {
    setError("");
    try {
      await api("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, ...draft[branch] }),
      });
      setDraft((prev) => ({ ...prev, [branch]: { name: "", code: "" } }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มแผนกไม่สำเร็จ");
    }
  }

  async function remove(dept: Department) {
    if (!confirm(`ลบแผนก "${dept.name}" ?`)) return;
    setError("");
    try {
      await api(`/api/departments/${dept.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        ช่องทำเครื่องหมายใช้แสดงโครงสร้างหน่วยงานเท่านั้น ไม่ได้ใช้ติ๊กยืนยันการตรวจ
        กด <span className="font-semibold">ตรวจแผนก</span> เพื่อเปิดแบบฟอร์มของแผนกนั้นทันที
      </div>
      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-3">
        {BRANCHES.map((branch) => {
          const meta = BRANCH_META[branch];
          const items = departments.filter((d) => d.branch === branch);
          return (
            <section key={branch} className={`${cardClass} overflow-hidden`}>
              <header className="border-b border-slate-100 bg-[#10233a] px-5 py-4 text-white">
                <p className="text-xs tracking-widest text-teal-200 uppercase">{meta.short}</p>
                <h2 className="text-lg font-semibold">{meta.label}</h2>
                <p className="text-xs text-slate-300">{meta.description}</p>
              </header>
              <ul className="divide-y divide-slate-100">
                {items.map((dept) => (
                  <li key={dept.id} className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      disabled
                      className="h-4 w-4 accent-teal-700"
                      title="แสดงโครงสร้างเท่านั้น"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{dept.name}</p>
                      <p className="text-xs text-slate-400">{dept.code}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                      onClick={() => router.push(`/forms?departmentId=${dept.id}`)}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      ตรวจแผนก
                    </button>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => remove(dept)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {isAdmin ? (
                <div className="space-y-2 border-t border-slate-100 bg-slate-50 p-4">
                  <input
                    className={inputClass}
                    placeholder="รหัสแผนก เช่น QA"
                    value={draft[branch].code}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [branch]: { ...prev[branch], code: e.target.value },
                      }))
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="ชื่อแผนก"
                    value={draft[branch].name}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [branch]: { ...prev[branch], name: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    className={`${btnPrimary} w-full`}
                    onClick={() => addDept(branch)}
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มแผนก
                  </button>
                </div>
              ) : (
                <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
                  เฉพาะ Admin ที่เพิ่มหรือลบแผนกได้
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
