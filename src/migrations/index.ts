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
];
