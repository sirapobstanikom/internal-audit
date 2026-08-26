-- Sample data for Supabase
-- admin / admin123   user / user123

INSERT INTO users (id, username, "passwordHash", name, role, "createdAt")
VALUES
  (
    'user_admin',
    'admin',
    '$2b$10$cIOvPSELgAvivfSR4xKOgeEAYH8/xsvPbktf1dxddAiBIMCixdJYi',
    'ผู้ดูแลระบบ',
    'ADMIN',
    CURRENT_TIMESTAMP
  ),
  (
    'user_auditor',
    'user',
    '$2b$10$XsL6bBQg2cI9TRzuhHCcEuQjVnOeVimQaEi7fqw.CoW0dKbhUpSNu',
    'สมชาย ตรวจประเมิน',
    'USER',
    CURRENT_TIMESTAMP
  )
ON CONFLICT (username) DO NOTHING;

INSERT INTO departments (id, code, name, branch, "sortOrder", "createdAt")
VALUES
  ('dept_adm', 'ADM', 'ฝ่ายบริหาร', 'HO', 1, CURRENT_TIMESTAMP),
  ('dept_fin', 'FIN', 'ฝ่ายบัญชีและการเงิน', 'HO', 2, CURRENT_TIMESTAMP),
  ('dept_hr', 'HR', 'ฝ่ายทรัพยากรบุคคล', 'HO', 3, CURRENT_TIMESTAMP),
  ('dept_pur', 'PUR', 'ฝ่ายจัดซื้อ', 'HO', 4, CURRENT_TIMESTAMP),
  ('dept_sal', 'SAL', 'ฝ่ายขายและการตลาด', 'HO', 5, CURRENT_TIMESTAMP),
  ('dept_qa', 'QA', 'ฝ่ายประกันคุณภาพ (QA)', 'HO', 6, CURRENT_TIMESTAMP),
  ('dept_it', 'IT', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'HO', 7, CURRENT_TIMESTAMP),
  ('dept_bp_ops', 'BP-OPS', 'หน่วยงาน BP ปฏิบัติการ', 'BP', 1, CURRENT_TIMESTAMP),
  ('dept_bp_wh', 'BP-WH', 'คลังสินค้า BP', 'BP', 2, CURRENT_TIMESTAMP),
  ('dept_bp_qc', 'BP-QC', 'ควบคุมคุณภาพ BP', 'BP', 3, CURRENT_TIMESTAMP),
  ('dept_bp_log', 'BP-LOG', 'จัดส่ง BP', 'BP', 4, CURRENT_TIMESTAMP),
  ('dept_lb_p1', 'LB-P1', 'สายผลิต 1', 'LB', 1, CURRENT_TIMESTAMP),
  ('dept_lb_p2', 'LB-P2', 'สายผลิต 2', 'LB', 2, CURRENT_TIMESTAMP),
  ('dept_lb_qc', 'LB-QC', 'ควบคุมคุณภาพ QC', 'LB', 3, CURRENT_TIMESTAMP),
  ('dept_lb_rm', 'LB-RM', 'คลังวัตถุดิบ', 'LB', 4, CURRENT_TIMESTAMP),
  ('dept_lb_fg', 'LB-FG', 'คลังสินค้าสำเร็จรูป', 'LB', 5, CURRENT_TIMESTAMP),
  ('dept_lb_mnt', 'LB-MNT', 'ซ่อมบำรุง', 'LB', 6, CURRENT_TIMESTAMP),
  ('dept_lb_she', 'LB-SHE', 'ความปลอดภัยและสิ่งแวดล้อม', 'LB', 7, CURRENT_TIMESTAMP),
  ('dept_lb_lab', 'LB-LAB', 'ห้องปฏิบัติการ', 'LB', 8, CURRENT_TIMESTAMP)
ON CONFLICT (branch, code) DO NOTHING;

INSERT INTO audit_documents (
  id, "documentNo", "auditorName", "departmentId", standards, "nonconformitySource",
  "dueDate", status, "auditorSignName", "auditeeSignName", "createdById",
  "createdAt", "updatedAt", "submittedAt"
)
VALUES
  (
    'doc_0001', 'IA-2026-0001', 'สมชาย ตรวจประเมิน', 'dept_lb_p1',
    '["ISO9001","GHP","HACCP"]', 'การตรวจประเมินภายใน', '2026-09-15', 'PENDING_ACK',
    'สมชาย ตรวจประเมิน', 'วิชัย หัวหน้าสายผลิต', 'user_auditor',
    '2026-08-20 09:00:00', '2026-08-20 09:00:00', '2026-08-20 09:00:00'
  ),
  (
    'doc_0002', 'IA-2026-0002', 'สมชาย ตรวจประเมิน', 'dept_qa',
    '["ISO9001","ISO14001"]', 'การตรวจจากหน่วยงานรับรอง', '2026-08-30', 'DRAFT',
    'สมชาย ตรวจประเมิน', '', 'user_auditor',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
  ),
  (
    'doc_0003', 'IA-2026-0003', 'สมชาย ตรวจประเมิน', 'dept_lb_she',
    '["ISO14001"]', 'ทบทวนฝ่ายบริหาร', '2026-07-31', 'CLOSED',
    'สมชาย ตรวจประเมิน', 'นภา เจ้าหน้าที่สิ่งแวดล้อม', 'user_admin',
    '2026-07-10 10:00:00', '2026-07-10 10:00:00', '2026-07-10 10:00:00'
  )
ON CONFLICT ("documentNo") DO NOTHING;

INSERT INTO checklist_items (id, "documentId", question, evidence, result, "sortOrder")
VALUES
  ('chk_0001_1', 'doc_0001', 'มีการควบคุมอุณหภูมิในกระบวนการผลิตตามขั้นตอนที่กำหนดหรือไม่', 'บันทึกอุณหภูมิประจำวัน เดือนกรกฎาคม 2026', 'CONFORM', 1),
  ('chk_0001_2', 'doc_0001', 'พนักงานสวมอุปกรณ์ป้องกันส่วนบุคคลครบถ้วนตามระเบียบ', 'พบพนักงาน 1 รายไม่สวมหมวกคลุมผมบริเวณสายบรรจุ', 'CAR_MINOR', 2),
  ('chk_0001_3', 'doc_0001', 'มีเอกสารขั้นตอนการปฏิบัติงาน (SOP) ที่เป็นปัจจุบัน', 'SOP-LB-P1-03 ฉบับทบทวน 15 มิ.ย. 2569', 'CONFORM', 3),
  ('chk_0002_1', 'doc_0002', 'มีการทบทวนเอกสารคุณภาพตามรอบที่กำหนด', '', 'CONFORM', 1),
  ('chk_0003_1', 'doc_0003', 'มีการคัดแยกของเสียอันตรายและของเสียทั่วไป', 'จุดรวบรวมของเสียอาคาร C และบันทึกการส่งกำจัด', 'CONFORM', 1),
  ('chk_0003_2', 'doc_0003', 'มีการฝึกอบรมด้านสิ่งแวดล้อมให้พนักงานใหม่', 'ทะเบียนฝึกอบรมปี 2569', 'PAR', 2)
ON CONFLICT (id) DO NOTHING;
