import Image from 'next/image';

/** Half the desktop arch height — keeps social-proof bottom in sync with arch bottom. */
export const HERO_ARCH_HALF = 'min(29vh, 16rem)';

/** Thin darker-brown stroke — matches reference, subtler than white. */
const CARD_BORDER = '#4a382c';

const AVATARS = [
  { src: '/avatars/avatar_1.jpg', alt: 'Customer' },
  { src: '/avatars/avatar_2.jpg', alt: 'Customer' },
  { src: '/avatars/avatar_3.jpg', alt: 'Customer' },
] as const;

/**
 * Social proof card — bottom-centre of the right panel, aligned with arch base.
 * ⛔ Metric is placeholder until real customer data is supplied [NN-05].
 */
export function HeroSocialProof() {
  return (
    <aside
      aria-label="Customer satisfaction"
      className="w-[12.5rem] overflow-hidden rounded-xl backdrop-blur-md xl:w-[13.5rem]"
      style={{
        border: `0.5px solid ${CARD_BORDER}`,
        background:
          'linear-gradient(145deg, rgba(127, 102, 82, 0.9) 0%, rgba(95, 74, 58, 0.86) 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 32px rgba(0,0,0,0.16)',
      }}
    >
      <div className="px-5 py-3.5 xl:px-5 xl:py-4">
        <p className="font-body text-[2.275rem] font-semibold leading-none tracking-tight text-white/95 xl:text-[2.125rem]">
          100<span className="text-[1.7rem] ml-1 -mt-1">+</span>
        </p>
        <p className="mt-1.5 font-body text-[0.75rem] leading-snug text-white/65">
          Happy Customer
        </p>
      </div>

      <div className="px-5 py-3 xl:py-3.5" style={{ borderTop: `0.5px solid ${CARD_BORDER}` }}>
        <div className="flex items-center -space-x-2.5" aria-hidden>
          {AVATARS.map(({ src, alt }) => (
            <span
              key={src}
              className="relative size-10 shrink-0 overflow-hidden rounded-full xl:size-11"
              style={{ border: `0.5px solid ${CARD_BORDER}` }}
            >
              <Image src={src} alt={alt} width={44} height={44} className="size-full object-cover" />
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
