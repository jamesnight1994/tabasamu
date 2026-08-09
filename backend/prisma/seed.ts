import { PrismaClient, ImageRole, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

/** Demo list price in KES minor units (550.00) — plumbing only until D-14. */
const DEMO_PRICE_MINOR = 55000;

type FlavourSeed = {
  slug: string;
  name: string;
  sku: string;
  stock: number;
  position: number;
  forwardNote: string | null;
  imageSrc: string | null;
};

const FLAVOURS: FlavourSeed[] = [
  {
    slug: 'grape-ginger',
    name: 'Grape Ginger',
    sku: 'TS-GRAPEG-1L',
    stock: 24,
    position: 1,
    forwardNote: 'Black grape, fresh ginger',
    imageSrc: '/products/grape-ginger.jpg',
  },
  {
    slug: 'pineapple',
    name: 'Pineapple',
    sku: 'TS-PINEAP-1L',
    stock: 31,
    position: 2,
    forwardNote: 'Sweet pineapple, citrus tail',
    imageSrc: '/products/pineapple.jpg',
  },
  {
    slug: 'pineapple-ginger',
    name: 'Pineapple Ginger',
    sku: 'TS-PINEGI-1L',
    stock: 18,
    position: 3,
    forwardNote: 'Pineapple, warm ginger',
    imageSrc: '/products/pineapple-ginger.jpg',
  },
  {
    slug: 'passion',
    name: 'Passion',
    sku: 'TS-PASSION-1L',
    stock: 12,
    position: 4,
    forwardNote: null,
    imageSrc: '/products/passion.jpg',
  },
  {
    slug: 'beetroot',
    name: 'Beetroot',
    sku: 'TS-BEETRO-1L',
    stock: 6,
    position: 5,
    forwardNote: null,
    imageSrc: null,
  },
  {
    slug: 'gooseberry',
    name: 'Gooseberry',
    sku: 'TS-GOOSEB-1L',
    stock: 0,
    position: 6,
    forwardNote: null,
    imageSrc: null,
  },
];

async function main() {
  for (const f of FLAVOURS) {
    await prisma.product.upsert({
      where: { slug: f.slug },
      create: {
        id: `prod_${f.slug}`,
        slug: f.slug,
        name: f.name,
        flavour: f.name,
        position: f.position,
        status: ProductStatus.active,
        subscriptionEligible: true,
        descriptor: 'Caffeine Free',
        base: 'Rooibos',
        forwardNote: f.forwardNote,
        variants: {
          create: {
            id: `var_${f.slug}_1l`,
            sku: f.sku,
            sizeCode: '1L',
            millilitres: 1000,
            priceAmount: DEMO_PRICE_MINOR,
            currency: 'KES',
            active: true,
            stockOnHand: f.stock,
          },
        },
        images: f.imageSrc
          ? {
              create: {
                src: f.imageSrc,
                alt: `${f.name} — Tabasamu Sips 1 Litre`,
                width: 800,
                height: 1000,
                role: ImageRole.packshot,
                sortOrder: 0,
              },
            }
          : undefined,
      },
      update: {
        name: f.name,
        flavour: f.name,
        position: f.position,
        status: ProductStatus.active,
        descriptor: 'Caffeine Free',
        base: 'Rooibos',
        forwardNote: f.forwardNote,
      },
    });

    // Keep variant stock/sku in sync on re-seed
    await prisma.variant.upsert({
      where: { sku: f.sku },
      create: {
        id: `var_${f.slug}_1l`,
        productId: `prod_${f.slug}`,
        sku: f.sku,
        sizeCode: '1L',
        millilitres: 1000,
        priceAmount: DEMO_PRICE_MINOR,
        currency: 'KES',
        active: true,
        stockOnHand: f.stock,
      },
      update: {
        stockOnHand: f.stock,
        priceAmount: DEMO_PRICE_MINOR,
        active: true,
      },
    });
  }

  console.log(`Seeded ${FLAVOURS.length} flavours into tabasamu DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
