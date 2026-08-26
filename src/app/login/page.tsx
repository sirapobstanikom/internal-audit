"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { btnPrimary, inputClass, labelClass } from "@/lib/styles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>ชื่อผู้ใช้</label>
        <input
          className={inputClass}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>รหัสผ่าน</label>
        <input
          type="password"
          className={inputClass}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#10233a] lg:flex">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs tracking-widest text-teal-200 uppercase">Internal Audit</p>
              <p className="font-semibold">ระบบตรวจประเมินภายใน</p>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl leading-tight font-semibold">
              เก็บแผนตรวจ เลือกแผนก กรอกแบบฟอร์ม และปิดงานในที่เดียว
            </h1>
            <p className="mt-4 text-slate-300">
              รองรับ ISO 9001, ISO 14001, GHP และ HACCP พร้อมติดตามสถานะเอกสารจนปิดสมบูรณ์
            </p>
          </div>
          <p className="text-sm text-slate-400">สำหรับทีมตรวจประเมินภายในองค์กร</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#f3f5f8] px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(16,35,58,0.08)]">
          <div className="mb-6 lg:hidden">
            <p className="text-sm font-semibold text-teal-700">Internal Audit</p>
            <h1 className="text-xl font-semibold text-slate-900">เข้าสู่ระบบ</h1>
          </div>
          <h2 className="hidden text-2xl font-semibold text-slate-900 lg:block">เข้าสู่ระบบ</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            ต้องล็อกอินก่อนใช้งาน มี 2 สิทธิ์: Admin และ User
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-2 font-medium text-slate-800">บัญชีทดลอง</p>
            <p>
              Admin: <code className="text-teal-800">admin</code> /{" "}
              <code className="text-teal-800">admin123</code>
            </p>
            <p>
              User: <code className="text-teal-800">user</code> /{" "}
              <code className="text-teal-800">user123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
