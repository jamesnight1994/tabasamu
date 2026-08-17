import Link from 'next/link';
import { Button } from '../components/primitives/Button';

/**
 * 404
 *
 * ⚠ Written IN-VOICE. No jokes. No exclamation marks. No "Oops!".
 *   Brand Book §07: the voice of someone already at ease.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60vh] max-w-[--container-prose] flex-col justify-center gap-6 px-4 py-24"
    >
      <p className="label-caps text-[--color-ink-muted]">404</p>
      <h1>This page is not here.</h1>
      <p className="measure text-[--color-ink-muted]">
        It may have moved, or the link may have been mistyped. Either way, the shop is where
        you left it.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/shop">See the flavours</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
