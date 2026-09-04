"use client";

import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  FolderOpen,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/components/AppShell";
import { api } from "@/lib/api";
import { cardClass } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Stats = {
  documents: number;
  openDocuments: number;
  plans: number;
  departments: number;
};

const MODULES = [
  {
    href: "/plans",
    title: "แผนการตรวจประเมิน",
    desc: "คลังไฟล์ PDF แผนการตรวจ แนบไฟล์และดูตัวอย่างได้",
    icon: FileText,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    href: "/organization",
    title: "ผังองค์กร & โครงสร้างสาขา",
    desc: "ดูโครงสร้าง HO / BP / LB แล้วเปิดแบบฟอร์มตรวจแผนกทันที",
    icon: Building2,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    href: "/forms",
    title: "แบบฟอร์มตรวจประเมิน",
    desc: "สร้างเอกสารจริง พร้อม checklist หลักฐาน และลงนาม",
    icon: ClipboardList,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    href: "/documents",
    title: "รายการเอกสารทั้งหมด",
    desc: "ค้นหา กรองสถานะ ดูรายละเอียด และพิมพ์เอกสาร",
    icon: FolderOpen,
    tone: "bg-amber-50 text-amber-700",
  },
];

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/api/stats").then(setStats).catch(() => setStats(null));
  }, []);

  const cards = [
    { label: "เอกสารตรวจประเมิน", value: stats?.documents ?? "—", icon: ClipboardList },
    { label: "งานที่ยังไม่ปิด", value: stats?.openDocuments ?? "—", icon: FolderOpen },
    { label: "PDF แผนตรวจ", value: stats?.plans ?? "—", icon: FileText },
    { label: "จำนวนแผนก", value: stats?.departments ?? "—", icon: Layers },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-[#10233a] px-6 py-8 text-white md:px-8">
        <p className="text-sm text-teal-200">ยินดีต้อนรับกลับ</p>
        <h2 className="mt-1 text-2xl font-semibold md:text-3xl">{user.name}</h2>
        <p className="mt-2 max-w-2xl text-slate-300">
          {user.role === "ADMIN"
            ? "คุณมีสิทธิ์ผู้ดูแลระบบ สามารถจัดการโครงสร้างองค์กร แก้ไฟล์แผนตรวจ และเปลี่ยนสถานะเอกสารได้"
            : user.role === "LEADER_AUDIT"
              ? "คุณเป็นหัวหน้าผู้ตรวจ สามารถอนุมัติผ่าน / ไม่ผ่าน / ตีกลับเอกสารที่เมนู รับทราบ/เอกสาร"
              : "คุณสามารถแนบแผนตรวจ กรอกแบบฟอร์ม และแก้ไขเอกสารได้เฉพาะขณะยังเป็นร่าง"}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={cn(cardClass, "p-5")}>
              <div className="flex items-start justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">ทางลัด 4 โมดูลหลัก</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(cardClass, "group p-6 transition hover:-translate-y-0.5 hover:border-teal-200")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={cn("rounded-xl p-3", item.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-teal-700" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
