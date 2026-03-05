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

export type RecordingStatus = "transcribed" | "transcribing" | "error";

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
        status: "transcribed"
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
        format: "Clinical Summary",
        duration: "12:07",
        date: "Oct 11, 2025",
        status: "transcribed"
    },
    {
        id: "rec-004",
        title: "Patient Intake – J. Smith",
        patient: "J. Smith",
        format: null,
        duration: "08:45",
        date: "Oct 9, 2025",
        status: "transcribed"
    },
    {
        id: "rec-005",
        title: "Diabetes Review – A. Patel",
        patient: "A. Patel",
        format: "SOAP Note",
        duration: "06:12",
        date: "Oct 8, 2025",
        status: "transcribed"
    },
    {
        id: "rec-006",
        title: "Pre-Op Assessment #78",
        patient: "L. Garcia",
        format: "Clinical Summary",
        duration: "03:50",
        date: "Oct 7, 2025",
        status: "transcribed"
    },
    {
        id: "rec-007",
        title: "Neuro Consult – T. Brown",
        patient: "T. Brown",
        format: "SOAP Note",
        duration: "15:22",
        date: "Oct 5, 2025",
        status: "transcribed"
    },
    {
        id: "rec-008",
        title: "Cardiology Follow-up #33",
        patient: "M. Davis",
        format: "SOAP Note",
        duration: "07:18",
        date: "Oct 4, 2025",
        status: "error"
    },
    {
        id: "rec-009",
        title: "Pediatrics Wellness Check",
        patient: "S. Wilson",
        format: null,
        duration: "04:05",
        date: "Oct 3, 2025",
        status: "transcribed"
    },
    {
        id: "rec-010",
        title: "Emergency Intake – R. Taylor",
        patient: "R. Taylor",
        format: "Clinical Summary",
        duration: "09:30",
        date: "Oct 2, 2025",
        status: "error"
    }
];

export const soapNoteMockEN = `One-liner: 58-year-old male with a history of HTN and type 2 DM presents with severe left chest pain, currently diagnosed with acute anterior ST-elevation myocardial infarction (STEMI), day 1 post percutaneous coronary intervention (PCI).

S (Subjective): Patient reports mild residual chest tightness in the epigastric region, non-radiating. No shortness of breath, no diaphoresis.

O (Objective): HR 82 bpm, BP 130/80 mmHg. Radial artery puncture site is dry, no hematoma. Heart sounds regular, lungs clear. ECG check: ST segment elevation decreased by > 50%.

A (Assessment): Day 1 STEMI post PCI hour 6 - Hemodynamically stable - Killip I.

P (Plan): Continue dual antiplatelet therapy (DAPT), high-dose Statin, glycemic control, and closely monitor for arrhythmic complications.`;

export const soapNoteMockVI = `One-liner: Bệnh nhân Nam 58 tuổi, tiền sử THA và ĐTĐ tuýp 2, vào viện vì đau ngực trái dữ dội, chẩn đoán hiện tại là Nhồi máu cơ tim cấp (STEMI) vùng trước rộng, điều trị ngày 1 bằng can thiệp mạch vành (PCI).

S (Subjective): Bệnh nhân còn đau tức ngực nhẹ tại vùng thượng vị, không lan. Không khó thở, không vã mồ hôi.

O (Objective): Mạch 82 l/p, HA 130/80 mmHg. Vết chọc động mạch quay khô, không tụ máu. Tim đều, phổi trong. ECG kiểm tra: ST đã giảm chênh xuống > 50%.

A (Assessment): STEMI ngày 1 sau PCI giờ thứ 6 - Huyết động ổn định - Killip I.

P (Plan): Tiếp tục thuốc kháng kết tập tiểu cầu kép (DAPT), Statin liều cao, kiểm soát đường huyết và theo dõi sát biến chứng loạn nhịp.`;

export const ehrSummaryMockEN = `One-liner: 58-year-old male with a history of HTN and type 2 DM presents with typical angina, 2 hours of onset.

Recorded Syndromes:
Acute Coronary Syndrome: Crushing chest pain radiating to the left arm, diaphoresis, ECG shows ST elevation in V1-V4, Troponin I positive.
Risk Factor Synthesis: Poorly controlled HTN, type 2 DM, long-term smoking history.`;

export const ehrSummaryMockVI = `One-liner: Bệnh nhân Nam 58 tuổi, tiền sử THA và ĐTĐ tuýp 2, vào viện vì đau thắt ngực điển hình giờ thứ 2.

Các hội chứng ghi nhận:
Hội chứng vành cấp: Đau ngực kiểu đè ép, lan tay trái, vã mồ hôi, ECG có ST chênh lên V1-V4, Troponin I dương tính.
Nhóm triệu chứng yếu tố nguy cơ: Tiền sử THA kiểm soát kém, ĐTĐ tuýp 2, hút thuốc lá lâu năm.`;

export const freeTextMockEN = `So the patient comes in today reporting that they've been experiencing chest tightness, um, primarily when they're doing physical activity over the past three weeks. They describe it as a squeezing pressure that lasts about five to ten minutes. They deny any radiation to arms or jaw. They do report some mild shortness of breath on exertion.

On examination, blood pressure is one forty-five over ninety-two. Heart rate is eighty-two, regular. Chest auscultation reveals normal S1 and S2. No murmurs, no gallops detected. Lungs are clear bilaterally. ECG shows normal sinus rhythm with no ST elevation or depression.

My assessment is exertional chest tightness with elevated blood pressure. The differential would include stable angina and hypertension-related symptoms. I think the risk for acute coronary syndrome is low at this point.

For the plan, I'm going to start them on amlodipine five milligrams daily for the blood pressure. I want to order a stress echocardiogram, get a lipid panel and basic metabolic panel. We'll follow up in two weeks and I'm advising moderate exercise with symptom monitoring in the meantime.`;
export const freeTextMockVI = `B\u1ec7nh nh\u00e2n h\u00f4m nay \u0111\u1ebfn b\u00e1o c\u00e1o r\u1eb1ng h\u1ecd \u0111\u00e3 b\u1ecb \u0111au th\u1eaft ng\u1ef1c, ch\u1ee7 y\u1ebfu l\u00e0 khi h\u1ecd l\u00e0m c\u00e1c ho\u1ea1t \u0111\u1ed9ng th\u1ec3 ch\u1ea5t trong ba tu\u1ea7n qua. H\u1ecd m\u00f4 t\u1ea3 c\u1ea3m gi\u00e1c nh\u01b0 b\u1ecb b\u00f3p ngh\u1eb9t k\u00e9o d\u00e0i kho\u1ea3ng n\u0103m \u0111\u1ebfn m\u01b0\u1eddi ph\u00fat. H\u1ecd ph\u1ee7 nh\u1eadn b\u1ea5t k\u1ef3 s\u1ef1 lan sang c\u00e1nh tay hay h\u00e0m. H\u1ecd c\u00f3 b\u00e1o c\u00e1o kh\u00f3 th\u1edf nh\u1eb9 khi g\u1eafng s\u1ee9c.

Kh\u00e1m l\u00e2m s\u00e0ng, huy\u1ebft \u00e1p 145/92 mmHg. Nh\u1ecbp tim 82, \u0111\u1ec1u. Nghe tim ph\u1ed5i b\u00ecnh th\u01b0\u1eddng S1 v\u00e0 S2. Kh\u00f4ng ti\u1ebfng th\u1ed5i, kh\u00f4ng gallop. Ph\u1ed5i trong hai b\u00ean. \u0110i\u1ec7n t\u00e2m \u0111\u1ed3 cho th\u1ea5y nh\u1ecbp xoang b\u00ecnh th\u01b0\u1eddng, kh\u00f4ng c\u00f3 ST ch\u00eanh l\u00ean hay xu\u1ed1ng.

\u0110\u00e1nh gi\u00e1 c\u1ee7a t\u00f4i l\u00e0 \u0111au th\u1eaft ng\u1ef1c khi g\u1eafng s\u1ee9c v\u1edbi huy\u1ebft \u00e1p t\u0103ng cao. Ch\u1ea9n \u0111o\u00e1n ph\u00e2n bi\u1ec7t bao g\u1ed3m \u0111au th\u1eaft ng\u1ef1c \u1ed5n \u0111\u1ecbnh v\u00e0 c\u00e1c tri\u1ec7u ch\u1ee9ng li\u00ean quan \u0111\u1ebfn t\u0103ng huy\u1ebft \u00e1p. T\u00f4i ngh\u0129 nguy c\u01a1 h\u1ed9i ch\u1ee9ng m\u1ea1ch v\u00e0nh c\u1ea5p th\u1ea5p \u1edf th\u1eddi \u0111i\u1ec3m n\u00e0y.

V\u1ec1 k\u1ebf ho\u1ea1ch, t\u00f4i s\u1ebd b\u1eaft \u0111\u1ea7u cho b\u1ec7nh nh\u00e2n d\u00f9ng amlodipine 5mg h\u00e0ng ng\u00e0y cho huy\u1ebft \u00e1p. T\u00f4i mu\u1ed1n y\u00eau c\u1ea7u si\u00eau \u00e2m tim g\u1eafng s\u1ee9c, x\u00e9t nghi\u1ec7m lipid v\u00e0 \u0111i\u1ec7n gi\u1ea3i c\u01a1 b\u1ea3n. Ch\u00fang t\u00f4i s\u1ebd t\u00e1i kh\u00e1m sau hai tu\u1ea7n v\u00e0 khuy\u00ean t\u1eadp th\u1ec3 d\u1ee5c v\u1eeba ph\u1ea3i, theo d\u00f5i tri\u1ec7u ch\u1ee9ng.`;