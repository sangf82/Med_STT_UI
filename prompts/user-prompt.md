# Build MedMate — Complete Next.js App from Pencil Design

Build a complete, production-quality **Next.js 14+ (App Router)** application for **MedMate** — a HIPAA-compliant medical speech-to-text mobile app. The app is designed in the attached `.pen` file and has an existing HTML prototype at `output/index.html` for behavioral reference.

**Key facts:**
- 20 unique screens across 4 flows (A–D)
- 80 total screen variants (20 screens × Light/Dark × EN/VN)
- Mobile viewport: 390 × 844 px
- Full light/dark theme via CSS custom properties
- Bilingual: English + Vietnamese

---

## Project Structure

```
app/
  layout.tsx                # Root layout: ThemeProvider (next-themes), font, global CSS
  globals.css               # CSS custom properties (46 tokens × 2 themes), Tailwind base, animations
  (auth)/                   # Route group — Flow A (no layout nesting needed)
    login/page.tsx          # A1/A2/A3 — LoginScreen with error state via searchParams or state
    signup/page.tsx         # A4/A5/A6 — SignUpScreen with error state
  (dashboard)/              # Route group — Flow B
    layout.tsx              # Dashboard layout (shared FAB, sidebar trigger)
    page.tsx                # B1/B2 — Dashboard (scroll-driven header collapse)
    sidebar/page.tsx        # B3 — Sidebar overlay (or modal route)
    settings/page.tsx       # B4 — Settings
    profile/page.tsx        # B5 — Profile
  (recording)/              # Route group — Flow C
    layout.tsx              # Recording layout (shared controls area)
    page.tsx                # C1/C2/C3 — RecordingScreen (state-driven)
    save/page.tsx           # C4 — Save dialog
    format/page.tsx         # C5 — Format selection
  (review)/                 # Route group — Flow D
    layout.tsx              # Review layout (shared audio player + tab bar)
    soap/page.tsx           # D1 — SOAP Note view
    ehr/page.tsx            # D2 — EHR Summary view
    freetext/page.tsx       # D3 — Free Text view
    edit/page.tsx           # Edit SOAP mode
    menu/page.tsx           # D4 — Menu popup (or as a client component overlay)
    rename/page.tsx         # D5 — Rename dialog
components/                 # Reusable UI components (all 'use client' where interactive)
  Badge.tsx
  BottomBar.tsx
  Button.tsx
  Card.tsx
  Checkbox.tsx
  ComplianceFooter.tsx
  Dialog.tsx
  FAB.tsx
  FormatCard.tsx
  Header.tsx
  Input.tsx
  AudioPlayer.tsx
  PasswordStrength.tsx
  RecordingControls.tsx
  Sidebar.tsx
  TabBar.tsx
  ThemeToggle.tsx           # Theme switch component using next-themes
  Toggle.tsx
  Waveform.tsx
context/
  AppContext.tsx            # App state (recordings, current recording, etc.) — 'use client'
lib/
  mockData.ts               # Recordings, patient data, SOAP content
messages/
  en.json                   # English translations
  vi.json                   # Vietnamese translations
i18n.ts                     # next-intl configuration
middleware.ts               # next-intl locale detection middleware
next.config.ts              # Next.js config (next-intl plugin, etc.)
tailwind.config.ts          # Tailwind config extending design system tokens
tsconfig.json
package.json
```

---

## Screen-by-Screen Specification

### Flow A — Authentication (6 screens)

#### A1: Login
- **Layout:** Vertically centered content, `padding: 0 32px`
- **Elements (top to bottom):**
  1. Language dropdown (top-right): pill button "English ▾" or "Tiếng Việt ▾"
  2. Logo: stethoscope icon (Material Symbols, 56px, blue) + "MedMate" (30px, bold, blue) + "Medical Speech-to-Text" (14px, muted)
  3. Form (`gap: 18px`):
     - **Phone Number / Email** — label (13px, semibold, secondary) + input (52px, placeholder "Enter your phone or email")
     - **Password** — label + password input (placeholder "Enter your password")
     - Row: checkbox (18×18, 4px radius, 1.5px border) + "Remember Me" (13px, muted) | "Forgot Password?" (13px, blue link)
     - **Sign In** button (blue, full-width, 52px)
     - HIPAA footer: lock icon (14px) + "HIPAA Compliant · 256-bit Encrypted" (11px, muted)
  4. "Don't have an account? **Sign Up**" (13px, muted + blue link)
- **Navigation:** "Sign Up" → A4, "Sign In" → B1

#### A2: Login Error — Wrong Password
- **Same as A1** except:
  - Email input pre-filled: `dr.chen@memorial.org`
  - Password input has `.error` class (red border `#E63946`) + `.shake` animation
  - Error message below password: alert-circle icon + "Incorrect password. Please try again." (12px, on error-bg with error-border)

#### A3: Login Error — Wrong Username
- **Same as A1** except:
  - Email input has `.error.shake`, value: `unknown@email.com`
  - Error message below email: "Account not found. Check your phone or email."
  - Password input is empty (normal state)

#### A4: Sign Up
- **Layout:** Scrollable, `padding: 40px 32px 30px`
- **Elements:**
  1. Logo: stethoscope (44px) + "Create Account" (24px, blue) + "Join MedMate today" (13px, muted)
  2. Form (`gap: 16px`):
     - **Phone Number** — input (placeholder "Enter your phone number")
     - **Full Name** — input (placeholder "Dr. First Last")
     - **Email** — input (placeholder "you@hospital.org")
     - **Password** — input + strength bar (4px, 100% green = "Strong password")
     - **Confirm Password** — input (placeholder "Repeat your password")
     - **Create Account** button (blue)
     - HIPAA footer
  3. "Already have an account? **Sign In**"
- **Navigation:** "Sign In" → A1

#### A5: Sign Up Error — Weak Password
- **Same as A4** except:
  - Phone: `+1 (555) 123-4567`, Name: `Dr. Sarah Chen`, Email: `s.chen@memorial.org`
  - Password has `.error.shake`, value: "abc"
  - Strength bar: `33%` width, red = "Weak"
  - Error message: "Password must be 8+ chars with uppercase, number & special character."
  - Create Account button: `opacity: 0.6` (disabled)

#### A6: Sign Up Error — Password Mismatch
- **Same as A4** except:
  - All fields filled, password shows "Strong"
  - Confirm Password has `.error.shake`, value: "••••••"
  - Error message: "Passwords do not match"
  - Create Account button: `opacity: 0.6` (disabled)

---

### Flow B — Dashboard & Navigation (5 screens)

#### B1: Dashboard Expanded
- **Background:** `var(--bg-page)` (not surface)
- **Top bar:** hamburger menu icon (left) | search icon + avatar circle "SC" (32px, blue bg, white text) (right)
- **Hero section:** stethoscope (48px) + "MedMate" (28px) + subtitle (14px, muted)
- **Recording list** (`gap: 10px`, `padding: 0 16px 100px`):
  - Section label: "Recent Recordings" (13px, semibold, muted)
  - Recording cards (see mock data below)
- **FAB:** Red mic button, positioned `bottom: 16px`, center
- **Navigation:** Hamburger → B3, FAB → C1, Card tap → D1

#### B2: Dashboard Collapsed (Scrolled)
- **Compact header:** stethoscope (22px) + "MedMate" (18px) | search + avatar (28px), with bottom border and shadow
- **No hero section** — list starts immediately
- Same recording cards + extra card ("Follow-up – Diabetes Mgmt")
- Same FAB
- **Implementation note:** B1→B2 can be a single component with scroll-driven header collapse

#### B3: Sidebar
- **Overlay:** `var(--bg-overlay)`, click to close
- **Panel** (300px, left-aligned):
  - Profile header: blue bg (#219EBC), avatar "SC" (52px, white bg, blue text), "Dr. Sarah Chen" (17px, bold, white), "Cardiology · Memorial Hospital" (12px, white 80%)
  - Nav items: Dashboard (active, blue), Recordings, Patients, Bookmarks
  - Divider
  - Recording Quality, Auto-transcribe (with toggle ON)
  - Divider
  - Settings, Help & Support
  - Bottom: HIPAA badge
- **Navigation:** Overlay click → B1, Settings → B4

#### B4: Settings
- **Header:** back arrow + "Settings" (centered)
- **Sections** (grouped rows, bg-card):
  - **Account:** Profile (chevron), Change Password (chevron)
  - **Appearance:** Theme → toggle row with sun/moon icon. Displays current mode ("Light" / "Dark"). Tapping the toggle switches the theme instantly via `next-themes`. Uses the same Toggle component as other toggles (44×24px). Icon: `sun` (lucide) for light, `moon` (lucide) for dark.
  - **Recording:** Default Format → WAV, Audio Quality → High (44.1kHz), Auto-transcribe (toggle ON)
  - **Output:** Default Template → SOAP Note, Auto-save (toggle ON)
  - **About:** Version → 1.2.0, Privacy Policy (chevron), Terms of Service (chevron)
- Section titles: 12px, bold, orange, uppercase, 0.5px letter-spacing
- **Navigation:** Back → B3

#### B5: Profile
- **Header:** back arrow
- **Profile section:** large avatar circle "SC" (80px), editable fields: Full Name, Specialty, Hospital, NPI Number, Email
- **Buttons:** "Save Changes" (blue), "Delete Account" (danger red)
- **Navigation:** Back → B4

---

### Flow C — Recording (4 screens + format select)

#### C1: Active Recording
- **Header:** back arrow + red dot (pulsing) + "New Recording" + more-vertical icon
- **Timer:** "00:01.2" (52px, weight 300)
- **Waveform:** 60 animated bars (white on #2E2E2E bg), bouncing animation with staggered delays
- **Controls:** pause (small circle) | stop (large red circle with inner square) | stop (small circle)
- **Navigation:** Back → B1

#### C2: Paused / Replay
- **Header:** back arrow + "New Recording" (no red dot)
- **Timer:** "00:09.4"
- **Badge:** "PAUSED" (orange pill with white dot)
- **Waveform:** 55 static/dimmed bars
- **Scrubber:** time labels + progress bar (45% filled)
- **Controls:** play (blue small circle) | resume record (large red circle) | stop
- **Navigation:** Back → B1, Resume → C3

#### C3: Continue Recording
- **Header:** back arrow + red dot + "New Recording"
- **Timer:** "00:12.7"
- **Waveform:** 30 white bars (past) + red playhead (2px) + 25 red animated bars (new)
- **Controls:** play (small) | record (large) | stop
- **Navigation:** Back → B1, Stop → C4

#### C4: Save Recording
- **Background:** Dimmed recording state (opacity 0.3 header/timer)
- **Modal card** (centered):
  - Title: "Save Recording" (20px, bold)
  - Name field: highlighted text "Consult 260304_010408" on highlight-bg
  - Category: "Uncategorized" with chevron-down
  - Divider
  - Button row: Cancel (muted) | Save (blue)
- **Controls:** Disabled (opacity 0.2)
- **Navigation:** Save → C5 or D1

#### C5: Choose Output Format (from prototype)
- **Header:** back arrow + "Transcribe Recording"
- **Title:** "Choose Output Format" (18px, bold) + description (13px, muted)
- **Format cards** (radio-select):
  1. SOAP Note — clipboard-list icon (blue on section-head-bg)
  2. EHR Summary — file-heart icon (orange on progress-bg)
  3. Free Text — align-left icon (secondary on input-bg)
- **Buttons:** "Start Transcribe" (blue, sparkles icon) + "Skip for Now" (text link)
- Selected card: orange border + highlight-bg + filled radio dot
- **Navigation:** Back → C4, Start Transcribe → D1

---

### Flow D — Audio Detail & Review (5 screens)

#### D1: SOAP Note View
- **Header:** back arrow + title column ("Patient Consultation" 16px bold + "Dec 15, 2024 · 02:34" 11px muted) + "Saved" badge (green)
- **Audio player:** Play button (36px blue circle) + progress bar (60% filled) + "01:33 / 02:34"
- **Tab bar:** SOAP Note (active) | EHR Summary | Free Text
- **Content:** "SOAP Note" title (18px bold) + "Edit" link (blue, pencil icon)
- **SOAP sections** (`gap: 20px`):
  - **Subjective:** blue label + text content
  - **Objective:** blue label + text (with "ST changes" highlighted)
  - **Assessment:** blue label + text
  - **Plan:** blue label + numbered list
- **Bottom bar:** Share | Export | Copy
- **Navigation:** Back → B1, Edit → D4, Tabs → D2/D3

#### D2: EHR Summary View
- **Same header/player/tabs** (EHR active)
- **Content:** "EHR Summary" title
- **Cards** (each with orange section title, uppercase):
  - Patient Info: Name, MRN, Visit Date (key-value pairs)
  - Chief Complaint: text
  - Vitals: BP, HR, ECG (key-value pairs)
  - Assessment & Plan: Dx, Rx, Orders, F/U
- **Bottom bar:** Share | Export | Copy

#### D3: Free Text View
- **Same header/player/tabs** (Free Text active)
- **Content:** "Raw Transcript" title
- **Textarea:** Full transcript, readonly, monospace-ish, min-height 400px
- **Word count:** "187 words" (11px, muted, right-aligned)
- **Bottom bar:** Share | Export | Copy

#### D4: Menu Popup (from .pen design)
- **Same as D1** but with a **popup menu** overlay from three-dot button
- **Menu items:** Rename, Delete (red text)
- **Navigation:** Rename → D5, Delete → confirm dialog

#### D5: Rename Dialog (from .pen design)
- **Same as D1** background (dimmed)
- **Modal dialog:**
  - Title: "Rename Recording" (bold)
  - Input: pre-filled with current name "Patient Consultation"
  - Buttons: Cancel | Rename (blue)

**Edit SOAP Mode** (D4 in prototype, separate route in app):
- **Header:** back arrow + "Edit SOAP Note" + "Save" button (blue pill)
- **Edit notice:** "Edit mode — tap sections to modify" (orange, pencil icon)
- **Editable textareas** for each SOAP section
- **Bottom bar:** Cancel | Save | Reset
- **Navigation:** Back/Cancel → D1, Save → D1 with updated content

---

## Navigation Flow Map

```
┌─────── FLOW A: AUTH ───────┐
│  A1 (Login) ←→ A4 (Sign Up)│  via "Sign Up" / "Sign In" links
│  A2, A3 = error states of A1│
│  A5, A6 = error states of A4│
│  A1 "Sign In" → B1          │
└──────────────────────────────┘
            │
            ▼
┌─────── FLOW B: DASHBOARD ──┐
│  B1 (Expanded) ──menu──→ B3 │
│  B1/B2 ──FAB──→ C1          │
│  B1/B2 ──card tap──→ D1     │
│  B3 (Sidebar) ──close──→ B1 │
│  B3 ──Settings──→ B4        │
│  B4 ──back──→ B3            │
│  B4 ──Profile──→ B5         │
│  B5 ──back──→ B4            │
└──────────────────────────────┘
            │ FAB
            ▼
┌─────── FLOW C: RECORDING ──┐
│  C1 (Active) ──pause──→ C2  │
│  C2 (Paused) ──resume──→ C3 │
│  C2/C3 ──stop──→ C4         │
│  C4 (Save) ──save──→ C5     │
│  C5 (Format) ──start──→ D1  │
│  C1/C2/C3 ──back──→ B1      │
└──────────────────────────────┘
            │ "Start Transcribe"
            ▼
┌─────── FLOW D: REVIEW ─────┐
│  D1 ↔ D2 ↔ D3  (tab switch) │
│  D1 ──Edit──→ Edit SOAP     │
│  D1 ──menu──→ D4 (popup)    │
│  D4 ──Rename──→ D5 (dialog) │
│  Edit ──Cancel/Save──→ D1   │
│  D1/D2/D3 ──back──→ B1      │
└──────────────────────────────┘
```

---

## Mock Data

### Doctor Profile
```json
{
  "name": "Dr. Sarah Chen",
  "initials": "SC",
  "specialty": "Cardiology",
  "hospital": "Memorial Hospital",
  "email": "dr.chen@memorial.org",
  "npi": "1234567890"
}
```

### Dashboard Recordings
```json
[
  {
    "id": "rec-001",
    "title": "Encounter #102",
    "patient": "M. Johnson",
    "format": "SOAP Note",
    "duration": "04:23",
    "date": "Oct 12, 2025",
    "status": "synced"
  },
  {
    "id": "rec-002",
    "title": "Clinical Note – Heart Exam",
    "patient": "R. Williams",
    "format": "EHR Summary",
    "duration": "12:07",
    "date": "Oct 11, 2025",
    "status": "synced"
  },
  {
    "id": "rec-003",
    "title": "Morning Rounds Summary",
    "patient": "A. Patel",
    "format": "SOAP Note",
    "duration": "08:15",
    "date": "Oct 10, 2025",
    "status": "transcribing",
    "progress": 65
  },
  {
    "id": "rec-004",
    "title": "Patient Intake – J. Smith",
    "patient": "J. Smith",
    "format": null,
    "duration": "08:45",
    "date": "Oct 9, 2025",
    "status": "synced"
  },
  {
    "id": "rec-005",
    "title": "Follow-up – Diabetes Mgmt",
    "patient": "L. Garcia",
    "format": "SOAP Note",
    "duration": "15:32",
    "date": "Oct 8, 2025",
    "status": "pending"
  }
]
```

### SOAP Note Content (D1 — English)
```
Subjective:
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
5. Advise moderate exercise with monitoring
```

### SOAP Note Content (D1 — Vietnamese, from .pen design)
```
Subjective (Chủ quan):
Bệnh nhân còn đau tức ngực nhẹ tại vùng thượng vị, không lan. Không khó thở, không vã mồ hôi.

Objective (Khách quan):
Mạch 82 l/p, HA 130/80 mmHg. Vết chọc động mạch quay khô, không tụ máu. Tim đều, phổi trong. ECG kiểm tra: ST đã giảm chênh xuống > 50%.

Assessment (Đánh giá):
STEMI ngày 1 sau PCI giờ thứ 6 - Huyết động ổn định - Killip I.

Plan (Kế hoạch):
Tiếp tục thuốc kháng kết tập tiểu cầu kép (DAPT), Statin liều cao, kiểm soát đường huyết và theo dõi sát biến chứng loạn nhịp.
```

### EHR Summary Content (D2 — English)
```json
{
  "patientInfo": {
    "name": "John Doe",
    "mrn": "MRN-2024-0815",
    "visitDate": "Dec 15, 2024"
  },
  "chiefComplaint": "Recurring chest tightness with exertion for 3 weeks",
  "vitals": {
    "bp": "145/92 mmHg",
    "hr": "82 bpm",
    "ecg": "Normal sinus rhythm"
  },
  "assessmentPlan": {
    "dx": "Exertional chest tightness, hypertension",
    "rx": "Amlodipine 5mg daily",
    "orders": "Stress echo, lipid panel, BMP",
    "followUp": "2 weeks"
  }
}
```

### EHR Summary Content (D2 — Vietnamese, from .pen design)
```json
{
  "oneLiner": "Bệnh nhân Nam 58 tuổi, tiền sử THA và ĐTĐ tuýp 2, vào viện vì đau thắt ngực điển hình giờ thứ 2.",
  "pertinentPositives": "Đau ngực kiểu mạch vành điểm 8/10; ECG có ST chênh lên > 2 mm ở các chuyển đạo trước tim; Troponin I (+) nhanh.",
  "pertinentNegatives": "Không đau lan sau lưng (loại trừ bóc tách ĐMC); Phổi không rale (loại trừ suy tim cấp); Bụng mềm (loại trừ bệnh lý ngoại khoa bụng).",
  "problemList": "1. Nhồi máu cơ tim cấp (STEMI) vùng trước rộng giờ thứ 2.\n2. Tăng huyết áp.\n3. Đái tháo đường tuýp 2."
}
```

### Free Text Transcript (D3 — 187 words)
```
So the patient comes in today reporting that they've been experiencing chest tightness, um, primarily when they're doing physical activity over the past three weeks. They describe it as a squeezing pressure that lasts about five to ten minutes. They deny any radiation to arms or jaw. They do report some mild shortness of breath on exertion.

On examination, blood pressure is one forty-five over ninety-two. Heart rate is eighty-two, regular. Chest auscultation reveals normal S1 and S2. No murmurs, no gallops detected. Lungs are clear bilaterally. ECG shows normal sinus rhythm with no ST elevation or depression.

My assessment is exertional chest tightness with elevated blood pressure. The differential would include stable angina and hypertension-related symptoms. I think the risk for acute coronary syndrome is low at this point.

For the plan, I'm going to start them on amlodipine five milligrams daily for the blood pressure. I want to order a stress echocardiogram, get a lipid panel and basic metabolic panel. We'll follow up in two weeks and I'm advising moderate exercise with symptom monitoring in the meantime.
```

---

## Vietnamese Translation Reference

### Auth Screens
| English | Vietnamese |
|---|---|
| Medical Speech-to-Text | Chuyển giọng nói Y khoa |
| Phone Number / Email | Số điện thoại / Email |
| Enter your phone or email | Nhập số điện thoại hoặc email |
| Password | Mật khẩu |
| Enter your password | Nhập mật khẩu |
| Remember Me | Ghi nhớ đăng nhập |
| Forgot Password? | Quên mật khẩu? |
| Sign In | Đăng nhập |
| Don't have an account? | Chưa có tài khoản? |
| Sign Up | Đăng ký |
| Create Account | Tạo tài khoản |
| Join MedMate today | Tham gia MedMate hôm nay |
| Phone Number | Số điện thoại |
| Enter your phone number | Nhập số điện thoại |
| Full Name | Họ và tên |
| Email | Email |
| Create a strong password | Tạo mật khẩu mạnh |
| Confirm Password | Xác nhận mật khẩu |
| Repeat your password | Nhập lại mật khẩu |
| Already have an account? | Đã có tài khoản? |
| Strong password | Mật khẩu mạnh |
| HIPAA Compliant · 256-bit Encrypted | Tuân thủ HIPAA · Mã hóa 256-bit |
| Account not found. Check your phone or email. | Không tìm thấy tài khoản. Kiểm tra số điện thoại hoặc email. |
| Incorrect password. Please try again. | Mật khẩu không đúng. Vui lòng thử lại. |
| Password must be 8+ chars with uppercase, number & special character. | Mật khẩu phải có 8+ ký tự với chữ hoa, số & ký tự đặc biệt. |
| Passwords do not match | Mật khẩu không khớp |

### Dashboard & Navigation
| English | Vietnamese |
|---|---|
| Good morning | Chào buổi sáng |
| Recent Recordings | Bản ghi gần đây |
| My Recordings | Bản ghi của tôi |
| Dashboard | Bảng điều khiển |
| Recordings | Bản ghi âm |
| Patients | Bệnh nhân |
| Bookmarks | Đánh dấu |
| Recording Quality | Chất lượng ghi âm |
| Auto-transcribe | Tự động chuyển văn bản |
| Settings | Cài đặt |
| Help & Support | Trợ giúp & Hỗ trợ |
| Log Out | Đăng xuất |
| Profile | Hồ sơ |
| Change Password | Đổi mật khẩu |
| Default Format | Định dạng mặc định |
| Audio Quality | Chất lượng âm thanh |
| Default Template | Mẫu mặc định |
| Auto-save | Tự động lưu |
| Version | Phiên bản |
| Privacy Policy | Chính sách bảo mật |
| Terms of Service | Điều khoản dịch vụ |
| Appearance | Giao diện |
| Theme | Chủ đề |
| Light | Sáng |
| Dark | Tối |
| Dark Mode | Chế độ tối |
| Save Changes | Lưu thay đổi |
| Delete Account | Xóa tài khoản |

### Recording
| English | Vietnamese |
|---|---|
| New Recording | Ghi âm mới |
| Save Recording | Lưu bản ghi |
| Category | Danh mục |
| Uncategorized | Chưa phân loại |
| Cancel | Hủy |
| Save | Lưu |
| Transcribe Recording | Chuyển văn bản bản ghi |
| Choose Output Format | Chọn định dạng đầu ra |
| Select how you'd like the transcription formatted | Chọn cách bạn muốn định dạng bản chuyển |
| Start Transcribe | Bắt đầu chuyển văn bản |
| Skip for Now | Bỏ qua |
| PAUSED | TẠM DỪNG |

### Review
| English | Vietnamese |
|---|---|
| Patient Consultation | Tư vấn bệnh nhân |
| SOAP Note | Ghi chú SOAP |
| EHR Summary | Tóm tắt EHR |
| Free Text | Văn bản tự do |
| Raw | Thô |
| Raw Transcript | Bản ghi thô |
| Edit | Chỉnh sửa |
| Edit SOAP Note | Chỉnh sửa ghi chú SOAP |
| Editing | Đang chỉnh sửa |
| Edit mode — tap sections to modify | Chế độ chỉnh sửa — nhấn vào phần để thay đổi |
| Share | Chia sẻ |
| Export | Xuất |
| Copy | Sao chép |
| Reset | Đặt lại |
| Subjective | Chủ quan |
| Objective | Khách quan |
| Assessment | Đánh giá |
| Plan | Kế hoạch |
| Rename | Đổi tên |
| Delete | Xóa |
| Rename Recording | Đổi tên bản ghi |
| Word count | Số từ |
| words | từ |

### Status Badges
| English | Vietnamese |
|---|---|
| Synced | Đã đồng bộ |
| Saved | Đã lưu |
| Saving... | Đang lưu... |
| Offline | Ngoại tuyến |
| Transcribing... | Đang chuyển... |
| Pending | Chờ xử lý |

---

## Audio Player Configuration
- Mock state: playing = false, currentTime = 93 (01:33), duration = 154 (02:34)
- Progress: `currentTime / duration = ~60%`
- Player persists across D1/D2/D3 tab switches

---

## Verification Checklist

After building, verify each item:

### Theme
- [ ] Light mode renders correctly on all 20 screens
- [ ] Dark mode renders correctly on all 20 screens
- [ ] Toggle smoothly switches themes (CSS transitions on bg, color, border)
- [ ] Waveform bg (#2E2E2E) stays the same in both themes
- [ ] Brand colors (#219EBC, #FB8A0A, #E63946) stay the same in both themes
- [ ] Dark inputs have visible borders (#333333), light inputs have transparent borders

### i18n
- [ ] All visible text comes from translation files (no hardcoded strings)
- [ ] Language toggle switches all text to Vietnamese
- [ ] Vietnamese medical content displays correctly (STEMI case)
- [ ] Language selector dropdown on auth screens works

### Navigation
- [ ] Login → Dashboard (A1 → B1)
- [ ] Login ↔ Sign Up (A1 ↔ A4)
- [ ] Dashboard → Sidebar (B1 → B3, hamburger)
- [ ] Sidebar → Settings (B3 → B4)
- [ ] Settings → Profile (B4 → B5)
- [ ] Dashboard → Recording (B1/B2 → C1, FAB)
- [ ] Recording flow: C1 → C2 → C3 → C4 → C5 → D1
- [ ] Recording back → Dashboard (C1/C2/C3 → B1)
- [ ] Tab switching: D1 ↔ D2 ↔ D3
- [ ] Edit mode: D1 → Edit → D1
- [ ] Menu popup: D1 → D4 (popup)
- [ ] Rename: D4 → D5 (dialog)
- [ ] Review back → Dashboard (D1/D2/D3 → B1)

### Components
- [ ] Input fields: 52px height, 12px radius, proper placeholder colors
- [ ] Buttons: 52px height, 12px radius, press animation
- [ ] Cards: 16px radius, shadow, proper padding
- [ ] Badges: correct colors per status
- [ ] FAB: red, centered bottom, proper shadow
- [ ] Toggle switches: functional, proper animation
- [ ] Tab bar: active underline, proper colors
- [ ] Audio player: progress bar, time display
- [ ] Sidebar: slide animation, overlay

### Animations
- [ ] Recording dot pulses on C1/C3
- [ ] Waveform bars bounce with staggered delays on C1/C3
- [ ] Error inputs shake on A2/A3/A5/A6
- [ ] Sidebar slides in from left
- [ ] Buttons scale on press

### Error States
- [ ] A2: password error (red border + error msg + shake)
- [ ] A3: email error (red border + error msg + shake)
- [ ] A5: weak password (red border + error msg + shake + weak strength bar + disabled button)
- [ ] A6: mismatch (red border + error msg + shake + disabled button)

### Data
- [ ] All 5 recordings display on dashboard
- [ ] SOAP Note content renders (4 sections)
- [ ] EHR Summary cards render (Patient Info, Chief Complaint, Vitals, Assessment & Plan)
- [ ] Free text transcript displays with word count
- [ ] Doctor profile info correct throughout
