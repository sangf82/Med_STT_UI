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
  npi: "1234567890",
};

export type RecordingStatus = "transcribed" | "transcribing" | "error";

export interface Recording {
  id: string;
  title: string;
  patient?: string;
  format: string | null;
  duration: string;
  date: string;
  status: RecordingStatus;
  progress?: number;
}

export const initialRecordings: Recording[] = [];

export const soapNoteMockEN = `**One-liner**: <mark>58-year-old male</mark>, <mark>history of HTN and type 2 DM</mark>, admitted for <mark>severe left chest pain</mark>, current diagnosis <mark>Acute anterior STEMI</mark>, day 1 post <mark>PCI</mark>.

### S (Subjective)
Patient reports <mark>mild residual chest tightness in the epigastric region</mark>, non-radiating. <mark>No shortness of breath</mark>, <mark>no diaphoresis</mark>.

### O (Objective)
- <mark>HR 82 bpm, BP 130/80 mmHg</mark>.
- <mark>Radial artery puncture site is dry</mark>, no hematoma.
- Heart sounds regular, lungs clear. 
- ECG: <mark>ST elevation decreased > 50%</mark>.

### A (Assessment)
<mark>STEMI day 1 post PCI hour 6</mark> - <mark>Hemodynamically stable</mark> - Killip I.

### P (Plan)
1. Continue <mark>dual antiplatelet therapy (DAPT)</mark>.
2. <mark>high-dose Statin</mark>.
3. Glycemic control.
4. Closely monitor for arrhythmic complications.`;

export const soapNoteMockVI = `**One-liner**: Bệnh nhân <mark>Nam</mark> <mark>58 tuổi</mark>, <mark>tiền sử THA và ĐTĐ tuýp 2</mark>, vào viện vì <mark>đau ngực trái dữ dội</mark>, chẩn đoán hiện tại là <mark>Nhồi máu cơ tim cấp (STEMI) vùng trước rộng</mark>, điều trị <mark>ngày 1</mark> bằng <mark>can thiệp mạch vành (PCI)</mark>.

### S (Subjective)
Bệnh nhân còn <mark>đau tức ngực nhẹ tại vùng thượng vị</mark>, không lan. <mark>Không khó thở</mark>, <mark>không vã mồ hôi</mark>.

### O (Objective)
- <mark>Mạch 82 l/p</mark>, <mark>HA 130/80 mmHg</mark>.
- <mark>Vết chọc động mạch quay khô</mark>, không tụ máu.
- Tim đều, phổi trong. 
- ECG kiểm tra: <mark>ST đã giảm chênh xuống > 50%</mark>.

### A (Assessment)
<mark>Nhận định</mark>: <mark>STEMI ngày 1 sau PCI giờ thứ 6</mark> - <mark>Huyết động ổn định</mark> - Killip I.

### P (Plan)
1. Tiếp tục <mark>thuốc kháng kết tập tiểu cầu kép (DAPT)</mark>.
2. <mark>Statin liều cao</mark>.
3. Kiểm soát đường huyết.
4. Theo dõi sát biến chứng loạn nhịp.`;

export const ehrSummaryMockEN = `**One-liner**: <mark>58-year-old male</mark>, <mark>history of HTN and type 2 DM</mark>, admitted for <mark>typical angina</mark>, 2 hours of onset.

### Recorded Syndromes
- **ACS**: <mark>Crushing chest pain</mark> radiating to left arm, <mark>diaphoresis</mark>, ECG shows <mark>ST elevation in V1-V4</mark>, <mark>Troponin I positive</mark>.
- **Risk Factors**: <mark>Poorly controlled HTN</mark>, <mark>type 2 DM</mark>, <mark>long-term smoking history</mark>.`;

export const ehrSummaryMockVI = `**One-liner**: Bệnh nhân <mark>Nam</mark> <mark>58 tuổi</mark>, <mark>tiền sử THA và ĐTĐ tuýp 2</mark>, vào viện vì <mark>đau thắt ngực điển hình giờ thứ 2</mark>.

### Các hội chứng ghi nhận
- **Hội chứng vành cấp**: <mark>Đau ngực kiểu đè ép, lan tay trái, vã mồ hôi</mark>, ECG có <mark>ST chênh lên V1-V4</mark>, <mark>Troponin I dương tính</mark>.
- **Nhóm triệu chứng yếu tố nguy cơ**: <mark>Tiền sử THA kiểm soát kém, ĐTĐ tuýp 2, hút thuốc lá lâu năm</mark>.

**Dữ kiện có nghĩa**:
- <mark>Đau ngực kiểu mạch vành điểm 8/10</mark>
- <mark>ECG có ST chênh lên > 2 mm</mark>
- <mark>Troponin I (+) nhanh</mark>

**Chẩn đoán sơ bộ**:
1. <mark>Nhồi máu cơ tim cấp (STEMI) vùng trước rộng giờ thứ 2</mark>.
2. <mark>Tăng huyết áp</mark>.
3. <mark>Đái tháo đường tuýp 2</mark>.`;

export const freeTextMockEN = `Patient reports <mark>chest tightness</mark> during <mark>physical activity</mark> over the past <mark>three weeks</mark>. Described as <mark>squeezing pressure</mark> lasting <mark>5-10 minutes</mark>. No radiation. Some <mark>mild shortness of breath</mark> on exertion.

On examination, <mark>BP 145/92 mmHg</mark>, <mark>HR 82</mark>. Chest auscultation reveals normal S1 and S2. Lungs clear. ECG shows normal sinus rhythm.

Assessment: <mark>Exertional chest tightness</mark> with <mark>elevated blood pressure</mark>. Plan: Start <mark>amlodipine 5mg daily</mark>, order <mark>stress echocardiogram</mark>, lipid panel.`;

export const freeTextMockVI = `Bệnh nhân hôm nay đến báo cáo rằng họ đã bị <mark>đau thắt ngực</mark>, chủ yếu là khi họ làm các hoạt động thể chất trong <mark>ba tuần qua</mark>. Họ mô tả cảm giác như <mark>bị bóp nghẹt kéo dài khoảng năm đến mười phút</mark>. Họ phủ nhận bất kỳ sự lan sang cánh tay hay hàm. Họ có báo cáo <mark>khó thở nhẹ khi gắng sức</mark>.

Khám lâm sàng, <mark>huyết áp 145/92 mmHg</mark>. Nhịp tim <mark>82</mark>, đều. Nghe tim phổi bình thường S1 và S2. Không tiếng thổi, không gallop. Phổi trong hai bên. Điện tâm đồ cho thấy nhịp xoang bình thường, không có ST chênh lên hay xuống.

Đánh giá của tôi là <mark>đau thắt ngực khi gắng sức với huyết áp tăng cao</mark>. Chẩn đoán phân biệt bao gồm đau thắt ngực ổn định và các triệu chứng liên quan đến tăng huyết áp. Tôi nghĩ nguy cơ hội chứng mạch và hội cấp thấp ở thời điểm này.

Về kế hoạch, tôi sẽ bắt đầu cho bệnh nhân dùng <mark>amlodipine 5mg hàng ngày</mark> cho huyết áp. Tôi muốn yêu cầu <mark>siêu âm tim gắng sức</mark>, xét nghiệm lipid và điện giải cơ bản. Chúng tôi sẽ tái khám sau hai tuần và khuyên tập thể dục vừa phải, theo dõi triệu chứng.`;

export const todoListMDMockVI = `
- [ ] **STAT**: Lấy máu xét nghiệm <mark>Troponin I</mark> giờ thứ 3 (*Mục đích: Theo dõi động học men tim*)
- [ ] **STAT**: Liên hệ đơn vị <mark>Cathlab</mark> (*Mục đích: Chuẩn bị can thiệp PCI*)
- [ ] **Routine**: Giải thích tình trạng cho gia đình (*Mục đích: Cam kết thực hiện thủ thuật*)
- [ ] **Follow-up**: Theo dõi <mark>HA & nhịp tim</mark> mỗi 15 phút (*Mục đích: Phát hiện sớm loạn nhịp/sốc*)
`;

export const todoListMDMockEN = `
- [ ] **STAT**: Draw blood for <mark>Troponin I</mark> at hour 3 (*Purpose: Monitor cardiac enzyme kinetics*)
- [ ] **STAT**: Contact <mark>Cathlab</mark> unit (*Purpose: Prepare for PCI intervention*)
- [ ] **Routine**: Explain condition to family (*Purpose: Obtain procedure consent*)
- [ ] **Follow-up**: Monitor <mark>BP & HR</mark> every 15 minutes (*Purpose: Early detection of arrhythmia/shock*)
`;

// New variations for more variety
export const pediatricSOAPMockVI = `**One-liner**: Bệnh nhân <mark>Nữ</mark> <mark>4 tuổi</mark>, <mark>không tiền sử bệnh lý</mark>, vào viện vì <mark>sốt cao và ho có đờm</mark> ngày thứ 2.

### S (Subjective)
Mẹ báo bé <mark>sốt cao 39°C</mark> đáp ứng kém với hạ sốt. <mark>Quấy khóc, lười ăn</mark>, chưa ghi nhận co giật.

### O (Objective)
- <mark>Nhiệt độ 38.5°C</mark>, <mark>mạch 110 l/p</mark>.
- Họng đỏ, amidan không mủ.
- Phổi có <mark>rales ẩm rải rác</mark> bên phải.
- SpO2: <mark>96%</mark>.

### A (Assessment)
<mark>Viêm phế quản phổi cấp</mark> ngày 2 - Theo dõi viêm phổi thùy.

### P (Plan)
1. Kháng sinh <mark>Augmentin 250mg</mark> x 2 lần/ngày.
2. Hạ sốt <mark>Hapacol 250mg</mark> khi sốt > 38.5°C.
3. Vỗ rung lồng ngực.
`;

export const geriatricDischargeMockVI = `**One-liner**: Bệnh nhân <mark>Nữ</mark> <mark>82 tuổi</mark>, tiền sử <mark>THA, suy tim EF 40%</mark>, ra viện sau 5 ngày điều trị <mark>ợ huyết khối tĩnh mạch sâu</mark>.

### Recorded Syndromes
- **Hội chứng suy tim**: <mark>Khó thở NYHA II</mark>, <mark>phù nhẹ mu bàn chân</mark> đã giảm.

### Dữ kiện có nghĩa
- <mark>INR: 2.5</mark> (trong ngưỡng mục tiêu).
- Siêu âm mạch: cục máu đông đang thoái triển.

### Chẩn đoán sơ bộ
1. <mark>Suy tim mạn tính</mark>.
2. <mark>Hậu phẫu DVT</mark>.
`;
