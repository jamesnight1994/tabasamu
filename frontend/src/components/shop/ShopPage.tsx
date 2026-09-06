import '../../styles/shop.css';

import { ShopHero } from './ShopHero';
import { ShopGrid, type ShopGridProps } from './ShopGrid';

export function ShopPage(props: ShopGridProps) {
  return (
    <>
      <ShopHero />
      <ShopGrid {...props} />
    </>
  );
}
