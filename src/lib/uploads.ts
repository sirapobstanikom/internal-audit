import { supabase } from "@/lib/db";

export const PLAN_BUCKET = "audit-plans";

export async function ensurePlanBucket() {
  const { data, error } = await supabase().storage.listBuckets();
  if (error) throw new Error(error.message);
  if (data?.some((bucket) => bucket.name === PLAN_BUCKET)) return;

  const { error: createError } = await supabase().storage.createBucket(PLAN_BUCKET, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message);
  }
}

export async function uploadPlanPdf(storedName: string, bytes: Uint8Array, upsert = false) {
  await ensurePlanBucket();
  const { error } = await supabase().storage.from(PLAN_BUCKET).upload(storedName, bytes, {
    contentType: "application/pdf",
    upsert,
  });
  if (error) throw new Error(error.message);
}

export async function downloadPlanPdf(storedName: string) {
  const { data, error } = await supabase().storage.from(PLAN_BUCKET).download(storedName);
  if (error || !data) throw new Error(error?.message || "ไม่พบไฟล์แผนตรวจ");
  return new Uint8Array(await data.arrayBuffer());
}

export async function deletePlanPdf(storedName: string) {
  await supabase().storage.from(PLAN_BUCKET).remove([storedName]);
}
