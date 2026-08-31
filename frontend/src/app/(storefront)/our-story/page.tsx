import { permanentRedirect } from 'next/navigation';

/** @deprecated Canonical content lives at `/about#story`. */
export default function Page() {
  permanentRedirect('/about#story');
}
