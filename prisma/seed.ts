import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.checklistItem.deleteMany();
  await prisma.auditDocument.deleteMany();
  await prisma.auditPlan.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "ผู้ดูแลระบบ",
      role: "ADMIN",
    },
  });

  const auditor = await prisma.user.create({
    data: {
      username: "user",
      passwordHash: await bcrypt.hash("user123", 10),
      name: "สมชาย ตรวจประเมิน",
      role: "USER",
    },
  });

  const departments = await Promise.all(
    [
      { code: "ADM", name: "ฝ่ายบริหาร", branch: "HO" as const, sortOrder: 1 },
      { code: "FIN", name: "ฝ่ายบัญชีและการเงิน", branch: "HO" as const, sortOrder: 2 },
      { code: "HR", name: "ฝ่ายทรัพยากรบุคคล", branch: "HO" as const, sortOrder: 3 },
      { code: "PUR", name: "ฝ่ายจัดซื้อ", branch: "HO" as const, sortOrder: 4 },
      { code: "SAL", name: "ฝ่ายขายและการตลาด", branch: "HO" as const, sortOrder: 5 },
      { code: "QA", name: "ฝ่ายประกันคุณภาพ (QA)", branch: "HO" as const, sortOrder: 6 },
      { code: "IT", name: "ฝ่ายเทคโนโลยีสารสนเทศ", branch: "HO" as const, sortOrder: 7 },
      { code: "BP-OPS", name: "หน่วยงาน BP ปฏิบัติการ", branch: "BP" as const, sortOrder: 1 },
      { code: "BP-WH", name: "คลังสินค้า BP", branch: "BP" as const, sortOrder: 2 },
      { code: "BP-QC", name: "ควบคุมคุณภาพ BP", branch: "BP" as const, sortOrder: 3 },
      { code: "BP-LOG", name: "จัดส่ง BP", branch: "BP" as const, sortOrder: 4 },
      { code: "LB-P1", name: "สายผลิต 1", branch: "LB" as const, sortOrder: 1 },
      { code: "LB-P2", name: "สายผลิต 2", branch: "LB" as const, sortOrder: 2 },
      { code: "LB-QC", name: "ควบคุมคุณภาพ QC", branch: "LB" as const, sortOrder: 3 },
      { code: "LB-RM", name: "คลังวัตถุดิบ", branch: "LB" as const, sortOrder: 4 },
      { code: "LB-FG", name: "คลังสินค้าสำเร็จรูป", branch: "LB" as const, sortOrder: 5 },
      { code: "LB-MNT", name: "ซ่อมบำรุง", branch: "LB" as const, sortOrder: 6 },
      { code: "LB-SHE", name: "ความปลอดภัยและสิ่งแวดล้อม", branch: "LB" as const, sortOrder: 7 },
      { code: "LB-LAB", name: "ห้องปฏิบัติการ", branch: "LB" as const, sortOrder: 8 },
    ].map((item) => prisma.department.create({ data: item })),
  );

  const byCode = Object.fromEntries(departments.map((d) => [d.code, d]));

  await prisma.auditDocument.create({
    data: {
      documentNo: "IA-2026-0001",
      auditorName: auditor.name,
      departmentId: byCode["LB-P1"].id,
      standards: JSON.stringify(["ISO9001", "GHP", "HACCP"]),
      nonconformitySource: "การตรวจประเมินภายใน",
      dueDate: "2026-09-15",
      status: "PENDING_ACK",
      auditorSignName: auditor.name,
      auditeeSignName: "วิชัย หัวหน้าสายผลิต",
      createdById: auditor.id,
      submittedAt: new Date("2026-08-20T09:00:00"),
      checklist: {
        create: [
          {
            question: "มีการควบคุมอุณหภูมิในกระบวนการผลิตตามขั้นตอนที่กำหนดหรือไม่",
            evidence: "บันทึกอุณหภูมิประจำวัน เดือนกรกฎาคม 2026",
            result: "CONFORM",
            sortOrder: 1,
          },
          {
            question: "พนักงานสวมอุปกรณ์ป้องกันส่วนบุคคลครบถ้วนตามระเบียบ",
            evidence: "พบพนักงาน 1 รายไม่สวมหมวกคลุมผมบริเวณสายบรรจุ",
            result: "CAR_MINOR",
            sortOrder: 2,
          },
          {
            question: "มีเอกสารขั้นตอนการปฏิบัติงาน (SOP) ที่เป็นปัจจุบัน",
            evidence: "SOP-LB-P1-03 ฉบับทบทวน 15 มิ.ย. 2569",
            result: "CONFORM",
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.auditDocument.create({
    data: {
      documentNo: "IA-2026-0002",
      auditorName: auditor.name,
      departmentId: byCode["QA"].id,
      standards: JSON.stringify(["ISO9001", "ISO14001"]),
      nonconformitySource: "การตรวจจากหน่วยงานรับรอง",
      dueDate: "2026-08-30",
      status: "DRAFT",
      auditorSignName: auditor.name,
      createdById: auditor.id,
      checklist: {
        create: [
          {
            question: "มีการทบทวนเอกสารคุณภาพตามรอบที่กำหนด",
            evidence: "",
            result: "CONFORM",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.auditDocument.create({
    data: {
      documentNo: "IA-2026-0003",
      auditorName: "สมชาย ตรวจประเมิน",
      departmentId: byCode["LB-SHE"].id,
      standards: JSON.stringify(["ISO14001"]),
      nonconformitySource: "ทบทวนฝ่ายบริหาร",
      dueDate: "2026-07-31",
      status: "CLOSED",
      auditorSignName: "สมชาย ตรวจประเมิน",
      auditeeSignName: "นภา เจ้าหน้าที่สิ่งแวดล้อม",
      createdById: admin.id,
      submittedAt: new Date("2026-07-10T10:00:00"),
      checklist: {
        create: [
          {
            question: "มีการคัดแยกของเสียอันตรายและของเสียทั่วไป",
            evidence: "จุดรวบรวมของเสียอาคาร C และบันทึกการส่งกำจัด",
            result: "CONFORM",
            sortOrder: 1,
          },
          {
            question: "มีการฝึกอบรมด้านสิ่งแวดล้อมให้พนักงานใหม่",
            evidence: "ทะเบียนฝึกอบรมปี 2569",
            result: "PAR",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  console.log("Seeded users: admin/admin123, user/user123");
  console.log(`Seeded ${departments.length} departments and 3 sample documents.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
