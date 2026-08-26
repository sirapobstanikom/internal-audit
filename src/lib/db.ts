import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { CheckResult } from "@/lib/constants";
import { CHECK_RESULTS } from "@/lib/constants";
import type { AuditDocument, AuditPlan, Department } from "@/lib/types";

let cached: SupabaseClient | null = null;

export function supabase() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("ยังไม่ได้ตั้งค่า SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function newId() {
  return randomUUID();
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const DOCUMENT_SELECT = `
  *,
  department:departments(*),
  createdBy:users!createdById(name, username),
  checklist:checklist_items(*)
`;

const PLAN_SELECT = `
  *,
  uploadedBy:users!uploadedById(name, username)
`;

export function parseChecklist(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = item as {
      question?: string;
      evidence?: string;
      result?: CheckResult;
    };
    const result = CHECK_RESULTS.includes(row.result as CheckResult)
      ? (row.result as CheckResult)
      : "CONFORM";
    return {
      question: String(row.question ?? "").trim(),
      evidence: String(row.evidence ?? "").trim(),
      result,
      sortOrder: index + 1,
    };
  });
}

export function normalizeDocument(row: Record<string, unknown> | null): AuditDocument | null {
  if (!row) return null;
  const checklist = Array.isArray(row.checklist)
    ? [...row.checklist].sort(
        (a, b) => Number((a as { sortOrder?: number }).sortOrder ?? 0) - Number((b as { sortOrder?: number }).sortOrder ?? 0),
      )
    : [];
  const department = Array.isArray(row.department) ? row.department[0] : row.department;
  const createdBy = Array.isArray(row.createdBy) ? row.createdBy[0] : row.createdBy;
  return { ...row, checklist, department, createdBy } as AuditDocument;
}

export async function countRows(table: string) {
  const { count, error } = await supabase().from(table).select("*", { count: "exact", head: true });
  throwIfError(error);
  return count ?? 0;
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase()
    .from("users")
    .select("id, username, passwordHash, name, role")
    .eq("username", username)
    .maybeSingle();
  throwIfError(error);
  return data as {
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: "ADMIN" | "USER";
  } | null;
}

export async function listDepartments() {
  const { data, error } = await supabase()
    .from("departments")
    .select("*")
    .order("branch")
    .order("sortOrder")
    .order("name");
  throwIfError(error);
  return (data ?? []) as Department[];
}

export async function getDepartment(id: string) {
  const { data, error } = await supabase()
    .from("departments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data as Department | null;
}

export async function listPlans() {
  const { data, error } = await supabase()
    .from("audit_plans")
    .select(PLAN_SELECT)
    .order("createdAt", { ascending: false });
  throwIfError(error);
  return (data ?? []) as AuditPlan[];
}

export async function getPlan(id: string) {
  const { data, error } = await supabase()
    .from("audit_plans")
    .select(PLAN_SELECT)
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data as AuditPlan | null;
}

export async function getDocument(id: string) {
  const { data, error } = await supabase()
    .from("audit_documents")
    .select(DOCUMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return normalizeDocument(data as Record<string, unknown> | null);
}

export async function listDocuments() {
  const { data, error } = await supabase()
    .from("audit_documents")
    .select(DOCUMENT_SELECT)
    .order("createdAt", { ascending: false });
  throwIfError(error);
  return ((data ?? []) as Record<string, unknown>[])
    .map((row) => normalizeDocument(row))
    .filter((row): row is AuditDocument => Boolean(row));
}

export async function nextDocumentNo() {
  const year = new Date().getFullYear();
  const prefix = `IA-${year}-`;
  const { data, error } = await supabase()
    .from("audit_documents")
    .select("documentNo")
    .like("documentNo", `${prefix}%`)
    .order("documentNo", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(error);
  const last = data?.documentNo as string | undefined;
  const next = last ? Number(last.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
