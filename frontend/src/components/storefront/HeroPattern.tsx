/**
 * Decorative topographic contour lines for the hero left ground.
 * aria-hidden — panel-tinted strokes on the light left ground.
 */

export function HeroPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill="none"
        stroke="var(--color-hero-pattern)"
        strokeWidth="1"
        opacity="0.22"
      >
        <path d="M0 520 C180 480, 260 560, 400 520 S620 440, 800 500" />
        <path d="M0 420 C200 380, 320 460, 480 420 S680 360, 800 400" />
        <path d="M0 320 C160 280, 300 360, 440 320 S660 260, 800 300" />
        <path d="M0 220 C220 180, 340 260, 500 220 S700 160, 800 200" />
        <path d="M0 620 C140 580, 280 660, 420 620 S640 560, 800 600" />
        <path d="M0 720 C190 680, 310 760, 450 720 S670 660, 800 700" />
        <ellipse cx="620" cy="380" rx="140" ry="90" />
        <ellipse cx="180" cy="580" rx="120" ry="75" />
        <ellipse cx="480" cy="640" rx="160" ry="95" />
      </g>
    </svg>
  );
}
