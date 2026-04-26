import { redirect } from 'next/navigation';

/** Hub removed — capture flow starts at STT. */
export default function Pilot108IndexRedirect() {
  redirect('/pilot108/stt-upload');
}
