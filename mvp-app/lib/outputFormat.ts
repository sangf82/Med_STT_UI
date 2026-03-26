export type CanonicalOutputFormat = 'soap_note' | 'ehr' | 'to-do' | 'freetext' | 'unknown';
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
    ascii === 'tom_tat_lam_sang'
  ) return 'ehr';

  if (
    normalized === 'to-do' ||
    normalized === 'todo' ||
    normalized === 'todo_list' ||
    normalized === 'todo-list' ||
    ascii === 'viec_can_lam'
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
  if (normalized === 'to-do') return 'todo';
  if (normalized === 'freetext') return 'raw';
  return 'soap';
}

export function recordLabelToReviewRoute(label?: string): ReviewRoute {
  switch ((label ?? '').trim()) {
    case 'Tóm tắt lâm sàng':
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
  if (normalized === 'to-do') return 'Việc cần làm';
  if (normalized === 'freetext') return 'Văn bản tự do';
  return 'Chưa phân loại';
}
