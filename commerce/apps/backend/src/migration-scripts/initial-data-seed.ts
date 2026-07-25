import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Tabasamu Sips — MVP seed
 *
 * - Region: Kenya / KES
 * - Six 1L kombucha flavours (handles = storefront flavour slugs)
 * - One demo Nairobi shipping option (MVP only — commercial fees still D-21/22)
 * - System default payment provider (manual / pay-on-confirmation)
 * - Publishable API key logged for storefront .env
 *
 * Prices are demo amounts for checkout plumbing (D-14 still open commercially).
 */

const FLAVOURS = [
  { handle: "grape-ginger", title: "Grape Ginger", sku: "TS-GRAPEG-1L", stock: 24 },
  { handle: "pineapple", title: "Pineapple", sku: "TS-PINEAP-1L", stock: 31 },
  { handle: "pineapple-ginger", title: "Pineapple Ginger", sku: "TS-PINEGI-1L", stock: 18 },
  { handle: "passion", title: "Passion", sku: "TS-PASSION-1L", stock: 12 },
  { handle: "beetroot", title: "Beetroot", sku: "TS-BEETRO-1L", stock: 6 },
  { handle: "gooseberry", title: "Gooseberry", sku: "TS-GOOSEB-1L", stock: 0 },
] as const;

/** Demo list price in KES major units (MVP plumbing only). */
const DEMO_PRICE_KES = 550;
/** Demo Nairobi delivery fee in KES major units (MVP unlock only). */
const DEMO_SHIPPING_KES = 200;

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  logger.info("Seeding Tabasamu store + sales channel...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Tabasamu Storefront",
          description: "Next.js storefront (localhost:3000)",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Tabasamu Publishable Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Tabasamu Sips",
          supported_currencies: [
            {
              currency_code: "kes",
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding Kenya region (KES)...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Kenya",
          currency_code: "kes",
          countries: ["ke"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];

  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "ke",
        provider_id: "tp_system",
      },
    ],
  });

  logger.info("Seeding Nairobi stock location + fulfillment...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Nairobi Brewery (demo)",
          address: {
            city: "Nairobi",
            country_code: "KE",
            address_1: "Tabasamu Sips",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Nairobi delivery (MVP demo)",
    type: "shipping",
    service_zones: [
      {
        name: "Nairobi",
        geo_zones: [
          {
            country_code: "ke",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Nairobi demo delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Nairobi demo",
          description:
            "MVP seed only — commercial zones/fees still pending (D-21/D-22).",
          code: "nairobi_demo",
        },
        prices: [
          {
            currency_code: "kes",
            amount: DEMO_SHIPPING_KES,
          },
          {
            region_id: region.id,
            amount: DEMO_SHIPPING_KES,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  logger.info("Seeding product category + six flavours...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Kombucha 1L",
          is_active: true,
        },
      ],
    },
  });
  const categoryId = categoryResult[0].id;

  await createProductsWorkflow(container).run({
    input: {
      products: FLAVOURS.map((f) => ({
        title: f.title,
        handle: f.handle,
        description: `Tabasamu Sips ${f.title} — caffeine-free rooibos kombucha, 1 Litre.`,
        status: ProductStatus.PUBLISHED,
        category_ids: [categoryId],
        options: [
          {
            title: "Size",
            values: ["1L"],
          },
        ],
        variants: [
          {
            title: "1L",
            sku: f.sku,
            options: {
              Size: "1L",
            },
            prices: [
              {
                amount: DEMO_PRICE_KES,
                currency_code: "kes",
              },
            ],
          },
        ],
        sales_channels: [{ id: defaultSalesChannel.id }],
      })),
    },
  });

  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  const stockBySku = Object.fromEntries(FLAVOURS.map((f) => [f.sku, f.stock]));

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: stockBySku[item.sku as string] ?? 0,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Tabasamu seed complete.");
  logger.info(
    `Publishable API key id: ${publishableApiKey.id} — copy the token from Medusa Admin → Settings → Publishable API Keys into MEDUSA_PUBLISHABLE_KEY / storefront .env.local`
  );
  logger.info(`Token (if returned by workflow): ${publishableApiKey.token ?? "(open Admin to copy)"}`);
}
