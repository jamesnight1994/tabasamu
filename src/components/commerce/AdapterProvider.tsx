'use client';

/**
 * ADAPTER PROVIDER — THE COMPOSITION ROOT, MADE AVAILABLE TO THE TREE
 *
 * ⚠ THIS IS THE ONLY PLACE A COMPONENT MAY OBTAIN AN ADAPTER, AND IT RECEIVES
 *   THEM AS A PROP FROM THE APP ROUTER.
 *
 *   No component below this ever calls `getAdapters()` itself. If they did, every
 *   one of them would be hard-wired to the concrete implementation, the Gate G2
 *   mock→HTTP swap would become a find-and-replace across the whole component
 *   tree, and the boundary lint would have nothing left to protect. [R-13, NN-06]
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { Adapters } from '../../ports';

const AdapterContext = createContext<Adapters | null>(null);

export const useAdapters = (): Adapters => {
  const a = useContext(AdapterContext);
  if (!a) throw new Error('useAdapters must be used inside <AdapterProvider>.');
  return a;
};

export function AdapterProvider({
  adapters,
  children,
}: {
  adapters: Adapters;
  children: ReactNode;
}) {
  return <AdapterContext.Provider value={adapters}>{children}</AdapterContext.Provider>;
}
