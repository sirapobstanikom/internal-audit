import fs from "fs";
import path from "path";

export const PLAN_BUCKET = "audit-plans";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads", PLAN_BUCKET);

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadPlanPdf(storedName: string, bytes: Uint8Array) {
  ensureUploadDir();
  const safe = path.basename(storedName);
  fs.writeFileSync(path.join(UPLOAD_DIR, safe), bytes);
}

export async function downloadPlanPdf(storedName: string) {
  ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, path.basename(storedName));
  if (!fs.existsSync(filePath)) {
    throw new Error("ไม่พบไฟล์แผนตรวจ");
  }
  return new Uint8Array(fs.readFileSync(filePath));
}

export async function deletePlanPdf(storedName: string) {
  ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, path.basename(storedName));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
