import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { Branch, CheckResult, DocStatus, Role } from "@/lib/constants";
import { CHECK_RESULTS } from "@/lib/constants";
import type { AuditDocument, AuditPlan, ChecklistItem, Department } from "@/lib/types";

export type LocalUser = {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: Role;
  createdAt: string;
};

export type LocalPlan = {
  id: string;
  title: string;
  fileName: string;
  storedName: string;
  sizeBytes: number;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalDocument = {
  id: string;
  documentNo: string;
  auditorName: string;
  departmentId: string;
  standards: string;
  nonconformitySource: string;
  dueDate: string;
  status: DocStatus;
  auditorSignName: string;
  auditeeSignName: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  checklist: Array<ChecklistItem & { id: string }>;
};

export type LocalDb = {
  users: LocalUser[];
  departments: Department[];
  audit_plans: LocalPlan[];
  audit_documents: LocalDocument[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function nowIso() {
  return new Date().toISOString();
}

function seedDb(): LocalDb {
  const createdAt = nowIso();
  return {
    users: [
      {
        id: "user_admin",
        username: "admin",
        passwordHash: bcrypt.hashSync("admin123", 10),
        name: "ผู้ดูแลระบบ",
        role: "ADMIN",
        createdAt,
      },
      {
        id: "user_auditor",
        username: "user",
        passwordHash: bcrypt.hashSync("user123", 10),
        name: "สมชาย ตรวจประเมิน",
        role: "USER",
        createdAt,
      },
      {
        id: "user_leader",
        username: "leader",
        passwordHash: bcrypt.hashSync("leader123", 10),
        name: "หัวหน้าผู้ตรวจ",
        role: "LEADER_AUDIT",
        createdAt,
      },
    ],
    departments: [
      { id: "dept_adm", code: "ADM", name: "ฝ่ายบริหาร", branch: "HO", sortOrder: 1 },
      { id: "dept_fin", code: "FIN", name: "ฝ่ายบัญชีและการเงิน", branch: "HO", sortOrder: 2 },
      { id: "dept_hr", code: "HR", name: "ฝ่ายทรัพยากรบุคคล", branch: "HO", sortOrder: 3 },
      { id: "dept_pur", code: "PUR", name: "ฝ่ายจัดซื้อ", branch: "HO", sortOrder: 4 },
      { id: "dept_sal", code: "SAL", name: "ฝ่ายขายและการตลาด", branch: "HO", sortOrder: 5 },
      { id: "dept_qa", code: "QA", name: "ฝ่ายประกันคุณภาพ (QA)", branch: "HO", sortOrder: 6 },
      { id: "dept_it", code: "IT", name: "ฝ่ายเทคโนโลยีสารสนเทศ", branch: "HO", sortOrder: 7 },
      { id: "dept_bp_ops", code: "BP-OPS", name: "หน่วยงาน BP ปฏิบัติการ", branch: "BP", sortOrder: 1 },
      { id: "dept_bp_wh", code: "BP-WH", name: "คลังสินค้า BP", branch: "BP", sortOrder: 2 },
      { id: "dept_bp_qc", code: "BP-QC", name: "ควบคุมคุณภาพ BP", branch: "BP", sortOrder: 3 },
      { id: "dept_bp_log", code: "BP-LOG", name: "จัดส่ง BP", branch: "BP", sortOrder: 4 },
      { id: "dept_lb_p1", code: "LB-P1", name: "สายผลิต 1", branch: "LB", sortOrder: 1 },
      { id: "dept_lb_p2", code: "LB-P2", name: "สายผลิต 2", branch: "LB", sortOrder: 2 },
      { id: "dept_lb_qc", code: "LB-QC", name: "ควบคุมคุณภาพ QC", branch: "LB", sortOrder: 3 },
      { id: "dept_lb_rm", code: "LB-RM", name: "คลังวัตถุดิบ", branch: "LB", sortOrder: 4 },
      { id: "dept_lb_fg", code: "LB-FG", name: "คลังสินค้าสำเร็จรูป", branch: "LB", sortOrder: 5 },
      { id: "dept_lb_mnt", code: "LB-MNT", name: "ซ่อมบำรุง", branch: "LB", sortOrder: 6 },
      { id: "dept_lb_she", code: "LB-SHE", name: "ความปลอดภัยและสิ่งแวดล้อม", branch: "LB", sortOrder: 7 },
      { id: "dept_lb_lab", code: "LB-LAB", name: "ห้องปฏิบัติการ", branch: "LB", sortOrder: 8 },
    ],
    audit_plans: [],
    audit_documents: [],
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb(): LocalDb {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const seeded = seedDb();
    writeDb(seeded);
    return seeded;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<LocalDb>;
    return {
      users: Array.isArray(raw.users) ? raw.users : [],
      departments: Array.isArray(raw.departments) ? raw.departments : [],
      audit_plans: Array.isArray(raw.audit_plans) ? raw.audit_plans : [],
      audit_documents: Array.isArray(raw.audit_documents) ? raw.audit_documents : [],
    };
  } catch {
    const seeded = seedDb();
    writeDb(seeded);
    return seeded;
  }
}

export function writeDb(db: LocalDb) {
  ensureDataDir();
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

export function updateDb(mutator: (db: LocalDb) => void): LocalDb {
  const db = readDb();
  mutator(db);
  writeDb(db);
  return db;
}

export function newId() {
  return randomUUID();
}

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

function userRef(user: LocalUser | undefined) {
  return {
    name: user?.name ?? "ไม่ทราบชื่อ",
    username: user?.username ?? "-",
  };
}

function normalizeDocument(db: LocalDb, row: LocalDocument | undefined): AuditDocument | null {
  if (!row) return null;
  const department = db.departments.find((d) => d.id === row.departmentId) ?? {
    id: row.departmentId,
    code: "?",
    name: "ไม่พบแผนก",
    branch: "HO" as Branch,
    sortOrder: 0,
  };
  const createdBy = userRef(db.users.find((u) => u.id === row.createdById));
  const checklist = [...(row.checklist ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  return { ...row, checklist, department, createdBy };
}

function normalizePlan(db: LocalDb, row: LocalPlan | undefined): AuditPlan | null {
  if (!row) return null;
  return {
    ...row,
    uploadedBy: userRef(db.users.find((u) => u.id === row.uploadedById)),
  };
}

export async function countRows(table: keyof LocalDb) {
  const db = readDb();
  return db[table].length;
}

export async function getUserByUsername(username: string) {
  const db = readDb();
  return db.users.find((u) => u.username === username) ?? null;
}

export async function listDepartments() {
  const db = readDb();
  return [...db.departments].sort((a, b) => {
    const branch = a.branch.localeCompare(b.branch);
    if (branch !== 0) return branch;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "th");
  });
}

export async function getDepartment(id: string) {
  const db = readDb();
  return db.departments.find((d) => d.id === id) ?? null;
}

export async function createDepartment(input: {
  name: string;
  code: string;
  branch: Branch;
}) {
  let created: Department | null = null;
  updateDb((db) => {
    const last = db.departments
      .filter((d) => d.branch === input.branch)
      .sort((a, b) => b.sortOrder - a.sortOrder)[0];
    created = {
      id: newId(),
      name: input.name,
      code: input.code,
      branch: input.branch,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    };
    db.departments.push(created);
  });
  return created!;
}

export async function deleteDepartment(id: string) {
  const db = readDb();
  const used = db.audit_documents.some((doc) => doc.departmentId === id);
  if (used) {
    throw new Error("ไม่สามารถลบแผนกที่มีเอกสารตรวจประเมินอยู่แล้ว");
  }
  updateDb((store) => {
    store.departments = store.departments.filter((d) => d.id !== id);
  });
}

export async function listPlans() {
  const db = readDb();
  return [...db.audit_plans]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((plan) => normalizePlan(db, plan)!)
    .filter(Boolean);
}

export async function getPlan(id: string) {
  const db = readDb();
  return normalizePlan(
    db,
    db.audit_plans.find((p) => p.id === id),
  );
}

export async function createPlan(input: Omit<LocalPlan, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
}) {
  const now = nowIso();
  const plan: LocalPlan = {
    id: input.id ?? newId(),
    title: input.title,
    fileName: input.fileName,
    storedName: input.storedName,
    sizeBytes: input.sizeBytes,
    uploadedById: input.uploadedById,
    createdAt: now,
    updatedAt: now,
  };
  updateDb((db) => {
    db.audit_plans.unshift(plan);
  });
  return (await getPlan(plan.id))!;
}

export async function updatePlan(id: string, patch: Partial<LocalPlan>) {
  updateDb((db) => {
    const idx = db.audit_plans.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error("ไม่พบไฟล์แผนตรวจ");
    db.audit_plans[idx] = {
      ...db.audit_plans[idx],
      ...patch,
      updatedAt: nowIso(),
    };
  });
  return getPlan(id);
}

export async function deletePlan(id: string) {
  updateDb((db) => {
    db.audit_plans = db.audit_plans.filter((p) => p.id !== id);
  });
}

export async function getDocument(id: string) {
  const db = readDb();
  return normalizeDocument(
    db,
    db.audit_documents.find((d) => d.id === id),
  );
}

export async function listDocuments() {
  const db = readDb();
  return [...db.audit_documents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((doc) => normalizeDocument(db, doc)!)
    .filter(Boolean);
}

export async function nextDocumentNo() {
  const year = new Date().getFullYear();
  const prefix = `IA-${year}-`;
  const db = readDb();
  const last = db.audit_documents
    .map((d) => d.documentNo)
    .filter((no) => no.startsWith(prefix))
    .sort()
    .at(-1);
  const next = last ? Number(last.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createDocument(input: {
  auditorName: string;
  departmentId: string;
  standards: string[];
  nonconformitySource: string;
  dueDate: string;
  status: DocStatus;
  auditorSignName: string;
  auditeeSignName: string;
  createdById: string;
  submittedAt: string | null;
  checklist: Array<Pick<ChecklistItem, "question" | "evidence" | "result" | "sortOrder">>;
}) {
  const now = nowIso();
  const id = newId();
  const document: LocalDocument = {
    id,
    documentNo: await nextDocumentNo(),
    auditorName: input.auditorName,
    departmentId: input.departmentId,
    standards: JSON.stringify(input.standards),
    nonconformitySource: input.nonconformitySource,
    dueDate: input.dueDate,
    status: input.status,
    auditorSignName: input.auditorSignName,
    auditeeSignName: input.auditeeSignName,
    createdById: input.createdById,
    createdAt: now,
    updatedAt: now,
    submittedAt: input.submittedAt,
    checklist: input.checklist.map((item) => ({
      id: newId(),
      ...item,
    })),
  };
  updateDb((db) => {
    db.audit_documents.unshift(document);
  });
  return (await getDocument(id))!;
}

export async function updateDocument(
  id: string,
  patch: Partial<Omit<LocalDocument, "id" | "checklist">> & {
    checklist?: Array<Pick<ChecklistItem, "question" | "evidence" | "result" | "sortOrder">>;
  },
) {
  updateDb((db) => {
    const idx = db.audit_documents.findIndex((d) => d.id === id);
    if (idx < 0) throw new Error("ไม่พบเอกสาร");
    const current = db.audit_documents[idx];
    const { checklist, ...rest } = patch;
    db.audit_documents[idx] = {
      ...current,
      ...rest,
      updatedAt: nowIso(),
      checklist: checklist
        ? checklist.map((item) => ({
            id: newId(),
            ...item,
          }))
        : current.checklist,
    };
  });
  return getDocument(id);
}

export async function deleteDocument(id: string) {
  updateDb((db) => {
    db.audit_documents = db.audit_documents.filter((d) => d.id !== id);
  });
}

export async function countOpenDocuments() {
  const db = readDb();
  return db.audit_documents.filter(
    (d) => d.status !== "CLOSED" && d.status !== "WITHDRAWN",
  ).length;
}
