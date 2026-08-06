'use client';

/**
 * VARIANT RESOLVER
 *
 * ⚠ The cart stores VARIANT IDS and PRICES — nothing else. It deliberately does
 *   NOT store product names, because a name is display data that can change, and
 *   a cart that caches it will eventually show a customer a name the shop no
 *   longer uses.
 *
 *   So the cart resolves ids to copy at RENDER time, through the catalogue port.
 */

import { useEffect, useState } from 'react';
import type { Adapters } from '../../ports';
import { useAdapters } from './AdapterProvider';

export interface VariantMeta {
  name: string;
  variantLabel: string;
}

export const useVariantResolver = (): ((variantId: string) => VariantMeta | null) => {
  const adapters: Adapters = useAdapters();
  const [map, setMap] = useState<Record<string, VariantMeta>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const products = await adapters.products.list().catch(() => []);
      if (cancelled) return;

      const next: Record<string, VariantMeta> = {};
      for (const p of products) {
        for (const v of p.variants) {
          next[v.id as string] = {
            name: p.name,
            // ⚠ D-02 ANSWERED: 1 Litre. The variant is always stated — 1L and
            //   500ml would be different products, and an implied size is a
            //   guess the customer pays for.
            variantLabel: String(v.size),
          };
        }
      }
      setMap(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [adapters]);

  return (variantId: string) => map[variantId] ?? null;
};
