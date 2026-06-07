import { getServerSideURL } from '@/utilities/getURL'

export function resolveSourceUrl(args: {
  collection: string
  slug?: string | null
}): string | undefined {
  const base = getServerSideURL()
  const slug = args.slug?.trim()

  switch (args.collection) {
    case 'pages':
      if (!slug) return `${base}/`
      return slug === 'home' ? base : `${base}/${slug}`
    case 'posts':
      return slug ? `${base}/blog/${slug}` : undefined
    case 'products':
      return slug ? `${base}/products/${slug}` : undefined
    case 'categories':
      return slug ? `${base}/shop/${slug}` : `${base}/shop`
    case 'subcategories':
      return slug ? `${base}/shop?subcategory=${encodeURIComponent(slug)}` : `${base}/shop`
    case 'brands':
      return slug ? `${base}/brand/${slug}` : `${base}/all-brands`
    case 'global:header':
    case 'global:footer':
      return base
    default:
      return slug ? `${base}/${slug}` : base
  }
}
