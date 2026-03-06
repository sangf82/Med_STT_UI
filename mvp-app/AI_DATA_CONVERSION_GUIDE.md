# AI Data Conversion Guide for Medical Notes

This guide explains how to format AI-generated medical data into **Markdown** that is compatible with the MedMate UI and Rich Text Editor.

## 1. General Principles
- Use **Standard Markdown** for structure (headers, lists, bold).
- Use the `<mark>` tag for highlighting AI-captured medical facts.
- Ensure the output is clean and readable for clinicians.

## 2. Formatting by Document Type

### A. SOAP Note (Ghi chú SOAP)
**Markdown structure:**
```markdown
**One-liner**: Bệnh nhân [Giới] [Tuổi], [Tiền sử]... 

### S (Subjective)
[Text with <mark>highlights</mark> for symptoms]

### O (Objective)
- [Vital signs with <mark>highlights</mark>]
- [Physical exam findings]

### A (Assessment)
[Diagnosis or status with <mark>highlights</mark>]

### P (Plan)
1. [Medical plan step 1]
2. [Medical plan step 2]
```

### B. Clinical Summary (Tóm tắt lâm sàng)
**Markdown structure:**
```markdown
**One-liner**: [Summary...]

### Recorded Syndromes
- **[Syndrome Name]**: [Details...]

**Dữ kiện có nghĩa**:
- [Pertinent positive/negative findings...]

**Chẩn đoán sơ bộ**:
1. <mark>[Diagnosis 1]</mark>
```

### C. To-do List (Kế hoạch hành động)
**Markdown structure (Checkbox List):**
Use the standard Markdown task list syntax (`- [ ]`).
```markdown
- [ ] **STAT**: [Task name] (*Purpose: [Purpose text]*)
- [ ] **Routine**: [Task name] (*Purpose: [Purpose text]*)
- [ ] **Follow-up**: [Task name] (*Purpose: [Purpose text]*)
```

## 3. Highlightingcaptured facts
The UI relies on the `<mark>` tag to apply the specific yellow theme.
- **DO highlight**: Blood pressure, Heart rate, Medication names, Specific symptoms, Diagnoses, Procedural details (e.g., PCI, hour 6).
- **DON'T highlight**: Common transitional words or entire paragraphs.

## 4. Example Transformation

**❌ Raw AI Output:**
Patient is a 58yo male with HTN. He has chest pain. BP is 130/80.

**✅ UI-Ready Markdown:**
**One-liner**: <mark>58-year-old male</mark> with <mark>HTN</mark>.

### S (Subjective)
Patient reports <mark>chest pain</mark>.

### O (Objective)
- **BP**: <mark>130/80 mmHg</mark>
```

## 5. Implementation Note
The `RichTextEditor` component is configured to sync using **Markdown**. Any content provided to the `content` prop should follow the formats above.
