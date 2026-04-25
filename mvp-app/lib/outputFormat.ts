export type CanonicalOutputFormat = 'soap_note' | 'ehr' | 'operative_note' | 'to-do' | 'freetext' | 'unknown';
export type ReviewRoute = 'soap' | 'ehr' | 'todo' | 'raw';

export function normalizeOutputFormatToken(value?: string): CanonicalOutputFormat {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s/g, '_');
  const ascii = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (
    normalized === 'soap_note' ||
    normalized === 'soap' ||
    ascii === 'ghi_chu_soap'
  ) return 'soap_note';

  if (
    normalized === 'ehr' ||
    normalized === 'clinical' ||
    normalized === 'ehr_summary' ||
    normalized === 'clinical_summary' ||
    ascii === 'tom_tat_lam_sang' ||
    ascii === 'tom_tat_ehr'
  ) return 'ehr';

  if (
    normalized === 'operative_note' ||
    normalized === 'operative' ||
    normalized === 'operation_note' ||
    normalized === 'surgery_note' ||
    ascii === 'bien_ban_phau_thuat'
  ) return 'operative_note';

  if (
    normalized === 'to-do' ||
    normalized === 'to_do' ||
    normalized === 'todo' ||
    normalized === 'todo_list' ||
    normalized === 'todo-list' ||
    normalized === 'to_do_list' ||
    normalized === 'task_list' ||
    ascii === 'viec_can_lam' ||
    ascii === 'danh_sach_cong_viec'
  ) return 'to-do';

  if (
    normalized === 'freetext' ||
    normalized === 'free' ||
    normalized === 'free_text' ||
    normalized === 'raw' ||
    ascii === 'van_ban_tu_do'
  ) return 'freetext';

  return 'unknown';
}

export function outputFormatToReviewRoute(value?: string): ReviewRoute {
  const normalized = normalizeOutputFormatToken(value);
  if (normalized === 'soap_note') return 'soap';
  if (normalized === 'ehr') return 'ehr';
  if (normalized === 'operative_note') return 'ehr';
  if (normalized === 'to-do') return 'todo';
  if (normalized === 'freetext') return 'raw';
  return 'soap';
}

export function recordLabelToReviewRoute(label?: string): ReviewRoute {
  switch ((label ?? '').trim()) {
    case 'Tóm tắt lâm sàng':
      return 'ehr';
    case 'Biên bản phẫu thuật':
      return 'ehr';
    case 'Việc cần làm':
      return 'todo';
    case 'Văn bản tự do':
      return 'raw';
    case 'Ghi chú SOAP':
    default:
      return 'soap';
  }
}

export function outputFormatToViLabel(value?: string): string {
  const normalized = normalizeOutputFormatToken(value);
  if (normalized === 'soap_note') return 'Ghi chú SOAP';
  if (normalized === 'ehr') return 'Tóm tắt lâm sàng';
  if (normalized === 'operative_note') return 'Biên bản phẫu thuật';
  if (normalized === 'to-do') return 'Việc cần làm';
  if (normalized === 'freetext') return 'Văn bản tự do';
  return 'Chưa phân loại';
}
