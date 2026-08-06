import type { Metadata, Viewport } from 'next';
import { rootMetadata, organizationJsonLd } from '../lib/seo';
import { websiteJsonLd, jsonLdString } from '../lib/seo/structured-data';
import './globals.css';

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // ⚠ NEVER `maximumScale: 1` or `userScalable: false`. Blocking pinch-zoom
  //   fails WCAG 1.4.4 and is hostile to anyone with low vision.
  themeColor: '#FDF6F0', // the cream canvas
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <head>
        {/*
          ⚠ Preload ONLY the two faces that appear above the fold.
            JetBrains Mono is confined to the spec register (order numbers,
            SKUs, batch codes) and is NEVER above the fold — so it is not
            preloaded. Three preloaded variable fonts would be a real payload
            cost on Nairobi 3G. [R-27, P-10]
        */}
        <link
          rel="preload"
          href="/fonts/fraunces-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/dm-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* ⚠ Serialised via `jsonLdString`, which applies the `</script>`
            breakout-safe escape centrally — never a bare `JSON.stringify`
            here. [S-3] */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd()) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
