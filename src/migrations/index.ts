import * as migration_20260427_023900 from './20260427_023900';
import * as migration_20260428_102000 from './20260428_102000';
import * as migration_20260428_103700 from './20260428_103700';
import * as migration_20260430_103900 from './20260430_103900';
import * as migration_20260430_111000 from './20260430_111000';
import * as migration_20260502_051409_posts_collection from './20260502_051409_posts_collection';
import * as migration_20260502_062838_blog_comments_collection from './20260502_062838_blog_comments_collection';
import * as migration_20260502_063516_blog_comment_moderation from './20260502_063516_blog_comment_moderation';
import * as migration_20260502_140000_bdt_currency from './20260502_140000_bdt_currency';
import * as migration_20260502_140100_bdt_currency_apply from './20260502_140100_bdt_currency_apply';
import * as migration_20260502_180000_repair_bdt_price_column_names from './20260502_180000_repair_bdt_price_column_names';
import * as migration_20260502_200000_subcategories from './20260502_200000_subcategories';
import * as migration_20260503_posts_related_posts from './20260503_posts_related_posts';
import * as migration_20260504_posts_featured_youtube_url from './20260504_posts_featured_youtube_url';
import * as migration_20260504_210000_products_technical_specs from './20260504_210000_products_technical_specs';
import * as migration_20260504_230000_product_reviews from './20260504_230000_product_reviews';
import * as migration_20260505_notifications_module from './20260505_notifications_module';
import * as migration_20260506_user_notifications_price_snapshot from './20260506_user_notifications_price_snapshot';
import * as migration_20260507_120000_promo_codes from './20260507_120000_promo_codes';
import * as migration_20260507_130000_rename_promo_rel_columns from './20260507_130000_rename_promo_rel_columns';
import * as migration_20260508_120000_shipments_collection from './20260508_120000_shipments_collection';
import * as migration_20260508_130000_products_shipment_rel from './20260508_130000_products_shipment_rel';
import * as migration_20260508_140000_orders_checkout_shipping_summary from './20260508_140000_orders_checkout_shipping_summary';
import * as migration_20260516_150000_brands_collection from './20260516_150000_brands_collection';
import * as migration_20260516_160000_pages_blocks_brands_carousel from './20260516_160000_pages_blocks_brands_carousel';
import * as migration_20260516_170000_pages_blocks_showcase_promo_testimonials from './20260516_170000_pages_blocks_showcase_promo_testimonials';
import * as migration_20260516_180000_pages_blocks_exclusive_combo_deals from './20260516_180000_pages_blocks_exclusive_combo_deals';
import * as migration_20260516_190000_pages_blocks_single_image_banner from './20260516_190000_pages_blocks_single_image_banner';
import * as migration_20260517_100000_orders_fulfillment from './20260517_100000_orders_fulfillment';
import * as migration_20260517_110000_carts_abandoned_email from './20260517_110000_carts_abandoned_email';
import * as migration_20260517_120000_order_status_shipped_delivered from './20260517_120000_order_status_shipped_delivered';
import * as migration_20260517_130000_transactions_checkout_shipping_summary from './20260517_130000_transactions_checkout_shipping_summary';
import * as migration_20260517_140000_sales_dashboard_collection from './20260517_140000_sales_dashboard_collection';
import * as migration_20260517_150000_office_staff_permissions from './20260517_150000_office_staff_permissions';
import * as migration_20260517_160000_staff_grants_users_page from './20260517_160000_staff_grants_users_page';
import * as migration_20260517_170000_seo_aiso_fields from './20260517_170000_seo_aiso_fields';
import * as migration_20260517_180000_pages_blocks_marketing_campaign from './20260517_180000_pages_blocks_marketing_campaign';
import * as migration_20260517_190000_taxonomy_posts_geo from './20260517_190000_taxonomy_posts_geo';
import * as migration_20260517_200000_pages_blocks_focus_discount_product from './20260517_200000_pages_blocks_focus_discount_product';
import * as migration_20260517_210000_pages_blocks_category_product_showcase from './20260517_210000_pages_blocks_category_product_showcase';
import * as migration_20260520_100000_pages_blocks_faq from './20260520_100000_pages_blocks_faq';
import * as migration_20260605_100000_chat_collections from './20260605_100000_chat_collections';
import * as migration_20260605_120000_product_embeddings from './20260605_120000_product_embeddings';
import * as migration_20260606_100000_users_google_oauth from './20260606_100000_users_google_oauth';
import * as migration_20260606_110000_users_facebook_oauth from './20260606_110000_users_facebook_oauth';
import * as migration_20260606_200000_tier3_operations from './20260606_200000_tier3_operations';
import * as migration_20260606_300000_return_requests from './20260606_300000_return_requests';
import * as migration_20260607_100000_tier2_features from './20260607_100000_tier2_features';
import * as migration_20260607_200000_tier4_features from './20260607_200000_tier4_features';
import * as migration_20260608_100000_return_requests_financial from './20260608_100000_return_requests_financial';

export const migrations = [
  {
    up: migration_20260427_023900.up,
    down: migration_20260427_023900.down,
    name: '20260427_023900',
  },
  {
    up: migration_20260428_102000.up,
    down: migration_20260428_102000.down,
    name: '20260428_102000',
  },
  {
    up: migration_20260428_103700.up,
    down: migration_20260428_103700.down,
    name: '20260428_103700',
  },
  {
    up: migration_20260430_103900.up,
    down: migration_20260430_103900.down,
    name: '20260430_103900',
  },
  {
    up: migration_20260430_111000.up,
    down: migration_20260430_111000.down,
    name: '20260430_111000',
  },
  {
    up: migration_20260502_051409_posts_collection.up,
    down: migration_20260502_051409_posts_collection.down,
    name: '20260502_051409_posts_collection',
  },
  {
    up: migration_20260502_062838_blog_comments_collection.up,
    down: migration_20260502_062838_blog_comments_collection.down,
    name: '20260502_062838_blog_comments_collection',
  },
  {
    up: migration_20260502_063516_blog_comment_moderation.up,
    down: migration_20260502_063516_blog_comment_moderation.down,
    name: '20260502_063516_blog_comment_moderation',
  },
  {
    up: migration_20260502_140000_bdt_currency.up,
    down: migration_20260502_140000_bdt_currency.down,
    name: '20260502_140000_bdt_currency',
  },
  {
    up: migration_20260502_140100_bdt_currency_apply.up,
    down: migration_20260502_140100_bdt_currency_apply.down,
    name: '20260502_140100_bdt_currency_apply',
  },
  {
    up: migration_20260502_180000_repair_bdt_price_column_names.up,
    down: migration_20260502_180000_repair_bdt_price_column_names.down,
    name: '20260502_180000_repair_bdt_price_column_names',
  },
  {
    up: migration_20260502_200000_subcategories.up,
    down: migration_20260502_200000_subcategories.down,
    name: '20260502_200000_subcategories',
  },
  {
    up: migration_20260503_posts_related_posts.up,
    down: migration_20260503_posts_related_posts.down,
    name: '20260503_posts_related_posts',
  },
  {
    up: migration_20260504_posts_featured_youtube_url.up,
    down: migration_20260504_posts_featured_youtube_url.down,
    name: '20260504_posts_featured_youtube_url',
  },
  {
    up: migration_20260504_210000_products_technical_specs.up,
    down: migration_20260504_210000_products_technical_specs.down,
    name: '20260504_210000_products_technical_specs',
  },
  {
    up: migration_20260504_230000_product_reviews.up,
    down: migration_20260504_230000_product_reviews.down,
    name: '20260504_230000_product_reviews',
  },
  {
    up: migration_20260505_notifications_module.up,
    down: migration_20260505_notifications_module.down,
    name: '20260505_notifications_module',
  },
  {
    up: migration_20260506_user_notifications_price_snapshot.up,
    down: migration_20260506_user_notifications_price_snapshot.down,
    name: '20260506_user_notifications_price_snapshot',
  },
  {
    up: migration_20260507_120000_promo_codes.up,
    down: migration_20260507_120000_promo_codes.down,
    name: '20260507_120000_promo_codes',
  },
  {
    up: migration_20260507_130000_rename_promo_rel_columns.up,
    down: migration_20260507_130000_rename_promo_rel_columns.down,
    name: '20260507_130000_rename_promo_rel_columns',
  },
  {
    up: migration_20260508_120000_shipments_collection.up,
    down: migration_20260508_120000_shipments_collection.down,
    name: '20260508_120000_shipments_collection',
  },
  {
    up: migration_20260508_130000_products_shipment_rel.up,
    down: migration_20260508_130000_products_shipment_rel.down,
    name: '20260508_130000_products_shipment_rel',
  },
  {
    up: migration_20260508_140000_orders_checkout_shipping_summary.up,
    down: migration_20260508_140000_orders_checkout_shipping_summary.down,
    name: '20260508_140000_orders_checkout_shipping_summary',
  },
  {
    up: migration_20260516_150000_brands_collection.up,
    down: migration_20260516_150000_brands_collection.down,
    name: '20260516_150000_brands_collection',
  },
  {
    up: migration_20260516_160000_pages_blocks_brands_carousel.up,
    down: migration_20260516_160000_pages_blocks_brands_carousel.down,
    name: '20260516_160000_pages_blocks_brands_carousel',
  },
  {
    up: migration_20260516_170000_pages_blocks_showcase_promo_testimonials.up,
    down: migration_20260516_170000_pages_blocks_showcase_promo_testimonials.down,
    name: '20260516_170000_pages_blocks_showcase_promo_testimonials',
  },
  {
    up: migration_20260516_180000_pages_blocks_exclusive_combo_deals.up,
    down: migration_20260516_180000_pages_blocks_exclusive_combo_deals.down,
    name: '20260516_180000_pages_blocks_exclusive_combo_deals',
  },
  {
    up: migration_20260516_190000_pages_blocks_single_image_banner.up,
    down: migration_20260516_190000_pages_blocks_single_image_banner.down,
    name: '20260516_190000_pages_blocks_single_image_banner',
  },
  {
    up: migration_20260517_100000_orders_fulfillment.up,
    down: migration_20260517_100000_orders_fulfillment.down,
    name: '20260517_100000_orders_fulfillment',
  },
  {
    up: migration_20260517_110000_carts_abandoned_email.up,
    down: migration_20260517_110000_carts_abandoned_email.down,
    name: '20260517_110000_carts_abandoned_email',
  },
  {
    up: migration_20260517_120000_order_status_shipped_delivered.up,
    down: migration_20260517_120000_order_status_shipped_delivered.down,
    name: '20260517_120000_order_status_shipped_delivered',
  },
  {
    up: migration_20260517_130000_transactions_checkout_shipping_summary.up,
    down: migration_20260517_130000_transactions_checkout_shipping_summary.down,
    name: '20260517_130000_transactions_checkout_shipping_summary',
  },
  {
    up: migration_20260517_140000_sales_dashboard_collection.up,
    down: migration_20260517_140000_sales_dashboard_collection.down,
    name: '20260517_140000_sales_dashboard_collection',
  },
  {
    up: migration_20260517_150000_office_staff_permissions.up,
    down: migration_20260517_150000_office_staff_permissions.down,
    name: '20260517_150000_office_staff_permissions',
  },
  {
    up: migration_20260517_160000_staff_grants_users_page.up,
    down: migration_20260517_160000_staff_grants_users_page.down,
    name: '20260517_160000_staff_grants_users_page',
  },
  {
    up: migration_20260517_170000_seo_aiso_fields.up,
    down: migration_20260517_170000_seo_aiso_fields.down,
    name: '20260517_170000_seo_aiso_fields',
  },
  {
    up: migration_20260517_180000_pages_blocks_marketing_campaign.up,
    down: migration_20260517_180000_pages_blocks_marketing_campaign.down,
    name: '20260517_180000_pages_blocks_marketing_campaign',
  },
  {
    up: migration_20260517_190000_taxonomy_posts_geo.up,
    down: migration_20260517_190000_taxonomy_posts_geo.down,
    name: '20260517_190000_taxonomy_posts_geo',
  },
  {
    up: migration_20260517_200000_pages_blocks_focus_discount_product.up,
    down: migration_20260517_200000_pages_blocks_focus_discount_product.down,
    name: '20260517_200000_pages_blocks_focus_discount_product',
  },
  {
    up: migration_20260517_210000_pages_blocks_category_product_showcase.up,
    down: migration_20260517_210000_pages_blocks_category_product_showcase.down,
    name: '20260517_210000_pages_blocks_category_product_showcase',
  },
  {
    up: migration_20260520_100000_pages_blocks_faq.up,
    down: migration_20260520_100000_pages_blocks_faq.down,
    name: '20260520_100000_pages_blocks_faq',
  },
  {
    up: migration_20260605_100000_chat_collections.up,
    down: migration_20260605_100000_chat_collections.down,
    name: '20260605_100000_chat_collections',
  },
  {
    up: migration_20260605_120000_product_embeddings.up,
    down: migration_20260605_120000_product_embeddings.down,
    name: '20260605_120000_product_embeddings',
  },
  {
    up: migration_20260606_100000_users_google_oauth.up,
    down: migration_20260606_100000_users_google_oauth.down,
    name: '20260606_100000_users_google_oauth',
  },
  {
    up: migration_20260606_110000_users_facebook_oauth.up,
    down: migration_20260606_110000_users_facebook_oauth.down,
    name: '20260606_110000_users_facebook_oauth',
  },
  {
    up: migration_20260606_200000_tier3_operations.up,
    down: migration_20260606_200000_tier3_operations.down,
    name: '20260606_200000_tier3_operations',
  },
  {
    up: migration_20260606_300000_return_requests.up,
    down: migration_20260606_300000_return_requests.down,
    name: '20260606_300000_return_requests',
  },
  {
    up: migration_20260607_100000_tier2_features.up,
    down: migration_20260607_100000_tier2_features.down,
    name: '20260607_100000_tier2_features',
  },
  {
    up: migration_20260607_200000_tier4_features.up,
    down: migration_20260607_200000_tier4_features.down,
    name: '20260607_200000_tier4_features',
  },
  {
    up: migration_20260608_100000_return_requests_financial.up,
    down: migration_20260608_100000_return_requests_financial.down,
    name: '20260608_100000_return_requests_financial',
  },
];
