export interface Profile {
    name: string;
    initials: string;
    specialty: string;
    hospital: string;
    email: string;
    phone: string;
    npi: string;
}

export const doctorProfile: Profile = {
    name: "Dr. Sarah Chen",
    initials: "SC",
    specialty: "Cardiology",
    hospital: "Memorial Hospital",
    email: "s.chen@memorial.org",
    phone: "+1 (555) 012-3456",
    npi: "1234567890"
};

export type RecordingStatus = "synced" | "transcribing" | "pending" | "saving" | "offline";

export interface Recording {
    id: string;
    title: string;
    patient: string;
    format: string | null;
    duration: string;
    date: string;
    status: RecordingStatus;
    progress?: number;
}

export const initialRecordings: Recording[] = [
    {
        id: "rec-001",
        title: "Encounter #102",
        patient: "M. Johnson",
        format: "SOAP Note",
        duration: "04:23",
        date: "Oct 12, 2025",
        status: "synced"
    },
    {
        id: "rec-002",
        title: "Post-Op Follow-up #45",
        patient: "K. Lee",
        format: "SOAP Note",
        duration: "02:15",
        date: "Just now",
        status: "transcribing",
        progress: 65
    },
    {
        id: "rec-003",
        title: "Clinical Note – Heart Exam",
        patient: "R. Williams",
        format: "EHR Summary",
        duration: "12:07",
        date: "Oct 11, 2025",
        status: "synced"
    },
    {
        id: "rec-004",
        title: "Patient Intake – J. Smith",
        patient: "J. Smith",
        format: null,
        duration: "08:45",
        date: "Oct 9, 2025",
        status: "synced"
    }
];

export const soapNoteMockEN = `Subjective:
Patient reports recurring episodes of chest tightness, primarily during physical exertion for the past 3 weeks. Describes the sensation as a squeezing pressure lasting 5-10 minutes. Denies radiation to arms or jaw. Reports mild dyspnea on exertion.

Objective:
BP: 145/92 mmHg. HR: 82 bpm, regular. Chest auscultation reveals normal S1, S2. No murmurs or gallops. Lungs clear bilateral. ECG: normal sinus rhythm, no ST changes.

Assessment:
Exertional chest tightness with elevated blood pressure. Differential includes stable angina, hypertension-related symptoms. Low risk for acute coronary syndrome.

Plan:
1. Start amlodipine 5mg daily
2. Order stress echocardiogram
3. Lipid panel, BMP labs
4. Follow-up in 2 weeks
5. Advise moderate exercise with monitoring`;

export const soapNoteMockVI = `Subjective (Chủ quan):
Bệnh nhân còn đau tức ngực nhẹ tại vùng thượng vị, không lan. Không khó thở, không vã mồ hôi.

Objective (Khách quan):
Mạch 82 l/p, HA 130/80 mmHg. Vết chọc động mạch quay khô, không tụ máu. Tim đều, phổi trong. ECG kiểm tra: ST đã giảm chênh xuống > 50%.

Assessment (Đánh giá):
STEMI ngày 1 sau PCI giờ thứ 6 - Huyết động ổn định - Killip I.

Plan (Kế hoạch):
Tiếp tục thuốc kháng kết tập tiểu cầu kép (DAPT), Statin liều cao, kiểm soát đường huyết và theo dõi sát biến chứng loạn nhịp.`;

export const ehrSummaryMockEN = {
    patientInfo: {
        name: "John Doe",
        mrn: "MRN-2024-0815",
        visitDate: "Dec 15, 2024"
    },
    chiefComplaint: "Recurring chest tightness with exertion for 3 weeks",
    vitals: {
        bp: "145/92 mmHg",
        hr: "82 bpm",
        ecg: "Normal sinus rhythm"
    },
    assessmentPlan: {
        dx: "Exertional chest tightness, hypertension",
        rx: "Amlodipine 5mg daily",
        orders: "Stress echo, lipid panel, BMP",
        followUp: "2 weeks"
    }
};

export const ehrSummaryMockVI = {
    oneLiner: "Bệnh nhân Nam 58 tuổi, tiền sử THA và ĐTĐ tuýp 2, vào viện vì đau thắt ngực điển hình giờ thứ 2.",
    pertinentPositives: "Đau ngực kiểu mạch vành điểm 8/10; ECG có ST chênh lên > 2 mm ở các chuyển đạo trước tim; Troponin I (+) nhanh.",
    pertinentNegatives: "Không đau lan sau lưng (loại trừ bóc tách ĐMC); Phổi không rale (loại trừ suy tim cấp); Bụng mềm (loại trừ bệnh lý ngoại khoa bụng).",
    problemList: "1. Nhồi máu cơ tim cấp (STEMI) vùng trước rộng giờ thứ 2.\\n2. Tăng huyết áp.\\n3. Đái tháo đường tuýp 2."
};

export const freeTextMockEN = `So the patient comes in today reporting that they've been experiencing chest tightness, um, primarily when they're doing physical activity over the past three weeks. They describe it as a squeezing pressure that lasts about five to ten minutes. They deny any radiation to arms or jaw. They do report some mild shortness of breath on exertion.

On examination, blood pressure is one forty-five over ninety-two. Heart rate is eighty-two, regular. Chest auscultation reveals normal S1 and S2. No murmurs, no gallops detected. Lungs are clear bilaterally. ECG shows normal sinus rhythm with no ST elevation or depression.

My assessment is exertional chest tightness with elevated blood pressure. The differential would include stable angina and hypertension-related symptoms. I think the risk for acute coronary syndrome is low at this point.

For the plan, I'm going to start them on amlodipine five milligrams daily for the blood pressure. I want to order a stress echocardiogram, get a lipid panel and basic metabolic panel. We'll follow up in two weeks and I'm advising moderate exercise with symptom monitoring in the meantime.`;
export const freeTextMockVI = `B\u1ec7nh nh\u00e2n h\u00f4m nay \u0111\u1ebfn b\u00e1o c\u00e1o r\u1eb1ng h\u1ecd \u0111\u00e3 b\u1ecb \u0111au th\u1eaft ng\u1ef1c, ch\u1ee7 y\u1ebfu l\u00e0 khi h\u1ecd l\u00e0m c\u00e1c ho\u1ea1t \u0111\u1ed9ng th\u1ec3 ch\u1ea5t trong ba tu\u1ea7n qua. H\u1ecd m\u00f4 t\u1ea3 c\u1ea3m gi\u00e1c nh\u01b0 b\u1ecb b\u00f3p ngh\u1eb9t k\u00e9o d\u00e0i kho\u1ea3ng n\u0103m \u0111\u1ebfn m\u01b0\u1eddi ph\u00fat. H\u1ecd ph\u1ee7 nh\u1eadn b\u1ea5t k\u1ef3 s\u1ef1 lan sang c\u00e1nh tay hay h\u00e0m. H\u1ecd c\u00f3 b\u00e1o c\u00e1o kh\u00f3 th\u1edf nh\u1eb9 khi g\u1eafng s\u1ee9c.

Kh\u00e1m l\u00e2m s\u00e0ng, huy\u1ebft \u00e1p 145/92 mmHg. Nh\u1ecbp tim 82, \u0111\u1ec1u. Nghe tim ph\u1ed5i b\u00ecnh th\u01b0\u1eddng S1 v\u00e0 S2. Kh\u00f4ng ti\u1ebfng th\u1ed5i, kh\u00f4ng gallop. Ph\u1ed5i trong hai b\u00ean. \u0110i\u1ec7n t\u00e2m \u0111\u1ed3 cho th\u1ea5y nh\u1ecbp xoang b\u00ecnh th\u01b0\u1eddng, kh\u00f4ng c\u00f3 ST ch\u00eanh l\u00ean hay xu\u1ed1ng.

\u0110\u00e1nh gi\u00e1 c\u1ee7a t\u00f4i l\u00e0 \u0111au th\u1eaft ng\u1ef1c khi g\u1eafng s\u1ee9c v\u1edbi huy\u1ebft \u00e1p t\u0103ng cao. Ch\u1ea9n \u0111o\u00e1n ph\u00e2n bi\u1ec7t bao g\u1ed3m \u0111au th\u1eaft ng\u1ef1c \u1ed5n \u0111\u1ecbnh v\u00e0 c\u00e1c tri\u1ec7u ch\u1ee9ng li\u00ean quan \u0111\u1ebfn t\u0103ng huy\u1ebft \u00e1p. T\u00f4i ngh\u0129 nguy c\u01a1 h\u1ed9i ch\u1ee9ng m\u1ea1ch v\u00e0nh c\u1ea5p th\u1ea5p \u1edf th\u1eddi \u0111i\u1ec3m n\u00e0y.

V\u1ec1 k\u1ebf ho\u1ea1ch, t\u00f4i s\u1ebd b\u1eaft \u0111\u1ea7u cho b\u1ec7nh nh\u00e2n d\u00f9ng amlodipine 5mg h\u00e0ng ng\u00e0y cho huy\u1ebft \u00e1p. T\u00f4i mu\u1ed1n y\u00eau c\u1ea7u si\u00eau \u00e2m tim g\u1eafng s\u1ee9c, x\u00e9t nghi\u1ec7m lipid v\u00e0 \u0111i\u1ec7n gi\u1ea3i c\u01a1 b\u1ea3n. Ch\u00fang t\u00f4i s\u1ebd t\u00e1i kh\u00e1m sau hai tu\u1ea7n v\u00e0 khuy\u00ean t\u1eadp th\u1ec3 d\u1ee5c v\u1eeba ph\u1ea3i, theo d\u00f5i tri\u1ec7u ch\u1ee9ng.`;