import '../../styles/shop.css';
import '../../styles/contact.css';

import { ContactValueProps } from '../contact/ContactValueProps';
import { ShopHero } from './ShopHero';
import { ShopGrid, type ShopGridProps } from './ShopGrid';

export function ShopPage(props: ShopGridProps) {
  return (
    <>
      <ShopHero />
      <ShopGrid {...props} />
      <div className="pt-0 border-t border-t-[--color-border-light]">
        <ContactValueProps />
      </div>
    </>
  );
}
