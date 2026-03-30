export interface Profile {
  name: string;
  initials: string;
  specialty: string;
  hospital: string;
  email: string;
  phone: string;
  npi: string;
}

export type RecordingStatus =
  | "transcribed"
  | "transcribing"
  | "error"
  | "uploading";

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
