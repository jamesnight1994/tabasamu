import { permanentRedirect } from 'next/navigation';

/** @deprecated Canonical content lives at `/about#ingredients`. */
export default function Page() {
  permanentRedirect('/about#ingredients');
}
