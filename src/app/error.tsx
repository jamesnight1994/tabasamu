'use client';

import { useEffect } from 'react';
import { Button } from '../components/primitives/Button';
import { logger } from '../lib/logger';
import { userMessage } from '../lib/errors';

/**
 * GLOBAL ERROR BOUNDARY
 *
 * ⚠ The raw exception message is NEVER shown to the customer. It leaks
 *   implementation detail and it is written in the voice of a stack trace.
 *   The customer sees in-voice copy; the logger gets the truth.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('unhandled error boundary', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60vh] max-w-[--container-prose] flex-col justify-center gap-6 px-4 py-24"
    >
      <h1>Something went wrong on our side.</h1>
      <p className="measure text-[--color-ink-muted]">{userMessage(error)}</p>

      {error.digest && (
        <p className="spec-mono text-[--color-ink-muted]">
          Reference: {error.digest}
        </p>
      )}

      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
