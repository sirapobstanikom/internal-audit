import type { Branch, CheckResult, DocStatus } from "./constants";

export type Department = {
  id: string;
  code: string;
  name: string;
  branch: Branch;
  sortOrder: number;
};

export type AuditPlan = {
  id: string;
  title: string;
  fileName: string;
  storedName: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy: { name: string; username: string };
};

export type ChecklistItem = {
  id?: string;
  question: string;
  evidence: string;
  result: CheckResult;
  sortOrder: number;
};

export type AuditDocument = {
  id: string;
  documentNo: string;
  auditorName: string;
  departmentId: string;
  department: Department;
  standards: string;
  nonconformitySource: string;
  dueDate: string;
  status: DocStatus;
  auditorSignName: string;
  auditeeSignName: string;
  createdBy: { name: string; username: string };
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  checklist: ChecklistItem[];
};
