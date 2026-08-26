-- Internal Audit schema for Supabase (PostgreSQL)

DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "Branch" AS ENUM ('HO', 'BP', 'LB'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "DocStatus" AS ENUM (
    'DRAFT',
    'PENDING_ACK',
    'PENDING_CORRECTIVE_APPROVAL',
    'ATTACHED_PENDING',
    'WITHDRAWN',
    'PENDING_MR',
    'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "CheckResult" AS ENUM ('CONFORM', 'CAR_MAJOR', 'CAR_MINOR', 'PAR', 'NA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL,
  role "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  branch "Branch" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (branch, code)
);

CREATE TABLE IF NOT EXISTS audit_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "storedName" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedById" TEXT NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_documents (
  id TEXT PRIMARY KEY,
  "documentNo" TEXT NOT NULL UNIQUE,
  "auditorName" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL REFERENCES departments(id),
  standards TEXT NOT NULL DEFAULT '[]',
  "nonconformitySource" TEXT NOT NULL DEFAULT '',
  "dueDate" TEXT NOT NULL DEFAULT '',
  status "DocStatus" NOT NULL DEFAULT 'DRAFT',
  "auditorSignName" TEXT NOT NULL DEFAULT '',
  "auditeeSignName" TEXT NOT NULL DEFAULT '',
  "createdById" TEXT NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES audit_documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  result "CheckResult" NOT NULL DEFAULT 'CONFORM',
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS audit_plans_uploadedById_idx ON audit_plans ("uploadedById");
CREATE INDEX IF NOT EXISTS audit_documents_status_idx ON audit_documents (status);
CREATE INDEX IF NOT EXISTS audit_documents_departmentId_idx ON audit_documents ("departmentId");
CREATE INDEX IF NOT EXISTS audit_documents_createdById_idx ON audit_documents ("createdById");
CREATE INDEX IF NOT EXISTS checklist_items_documentId_idx ON checklist_items ("documentId");

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
