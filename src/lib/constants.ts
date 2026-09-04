export type Role = "ADMIN" | "USER" | "LEADER_AUDIT";
export type Branch = "HO" | "BP" | "LB";
export type DocStatus =
  | "DRAFT"
  | "PENDING_ACK"
  | "PENDING_CORRECTIVE_APPROVAL"
  | "ATTACHED_PENDING"
  | "WITHDRAWN"
  | "PENDING_MR"
  | "CLOSED";
export type CheckResult = "CONFORM" | "CAR_MAJOR" | "CAR_MINOR" | "PAR" | "NA";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "ผู้ดูแลระบบ (Admin)",
  USER: "ผู้ใช้งาน (User)",
  LEADER_AUDIT: "หัวหน้าผู้ตรวจ (Leader Audit)",
};

export const STATUS_LABELS: Record<DocStatus, string> = {
  DRAFT: "ร่าง",
  PENDING_ACK: "รอรับทราบ",
  PENDING_CORRECTIVE_APPROVAL: "รออนุมัติการแก้ไข",
  ATTACHED_PENDING: "แนบเรื่องรอดำเนินการ",
  WITHDRAWN: "ไม่ผ่าน",
  PENDING_MR: "รอ Leader อนุมัติ",
  CLOSED: "ปิดเอกสารสมบูรณ์",
};

export const STATUS_COLORS: Record<DocStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  PENDING_ACK: "bg-sky-50 text-sky-800 ring-sky-200",
  PENDING_CORRECTIVE_APPROVAL: "bg-amber-50 text-amber-800 ring-amber-200",
  ATTACHED_PENDING: "bg-orange-50 text-orange-800 ring-orange-200",
  WITHDRAWN: "bg-rose-50 text-rose-800 ring-rose-200",
  PENDING_MR: "bg-violet-50 text-violet-800 ring-violet-200",
  CLOSED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

/** สถานะที่ Leader Audit อนุมัติ/ไม่ผ่าน/ตีกลับได้หลังประเมินเสร็จ */
export const LEADER_REVIEW_STATUSES: DocStatus[] = ["PENDING_ACK", "PENDING_MR"];

export const RESULT_LABELS: Record<CheckResult, string> = {
  CONFORM: "สอดคล้อง",
  CAR_MAJOR: "CAR Major",
  CAR_MINOR: "CAR Minor",
  PAR: "PAR",
  NA: "N/A",
};

export const RESULT_COLORS: Record<CheckResult, string> = {
  CONFORM: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CAR_MAJOR: "bg-rose-50 text-rose-800 ring-rose-200",
  CAR_MINOR: "bg-orange-50 text-orange-800 ring-orange-200",
  PAR: "bg-amber-50 text-amber-800 ring-amber-200",
  NA: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const BRANCH_META: Record<
  Branch,
  { label: string; short: string; description: string }
> = {
  HO: {
    label: "HO สำนักงานใหญ่",
    short: "HO",
    description: "หน่วยงานส่วนกลางและฝ่ายสนับสนุน",
  },
  BP: {
    label: "BP หน่วยงาน BP",
    short: "BP",
    description: "หน่วยงานปฏิบัติการ BP",
  },
  LB: {
    label: "LB โรงงาน / สายผลิต",
    short: "LB",
    description: "สายผลิต คลัง และห้องปฏิบัติการ",
  },
};

export const BRANCHES: Branch[] = ["HO", "BP", "LB"];

export const STANDARD_OPTIONS = [
  { id: "ISO9001", label: "ISO 9001" },
  { id: "ISO14001", label: "ISO 14001" },
  { id: "GHP", label: "GHP" },
  { id: "HACCP", label: "HACCP" },
] as const;

export const SOURCE_OPTIONS = [
  "การตรวจประเมินภายใน",
  "การตรวจติดตามจากลูกค้า",
  "การตรวจจากหน่วยงานรับรอง",
  "ข้อร้องเรียน",
  "ทบทวนฝ่ายบริหาร",
  "อื่นๆ",
];

export const STATUSES = Object.keys(STATUS_LABELS) as DocStatus[];
export const CHECK_RESULTS = Object.keys(RESULT_LABELS) as CheckResult[];
