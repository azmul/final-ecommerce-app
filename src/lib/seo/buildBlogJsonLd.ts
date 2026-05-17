import type { Post, User } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'
import { parseYoutubeVideoId } from '@/utilities/youtube'

type PostSeoContent = {
  aiSummary?: string | null
  faqs?: { question?: string | null; answer?: string | null }[] | null
}

type PostWithGeo = Post & { seoContent?: PostSeoContent }

function resolveFaqs(post: Post) {
  const faqs = (post as PostWithGeo).seoContent?.faqs
  if (!Array.isArray(faqs)) return []
  return faqs
    .filter(
      (row): row is { question: string; answer: string } =>
        typeof row?.question === 'string' &&
        row.question.trim().length > 0 &&
        typeof row?.answer === 'string' &&
        row.answer.trim().length > 0,
    )
    .map((row) => ({ question: row.question.trim(), answer: row.answer.trim() }))
}

export function buildBlogJsonLd(post: Post, slug: string) {
  const base = getServerSideURL()
  const url = `${base}/blog/${slug}`
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

  const author = post.author && typeof post.author === 'object' ? (post.author as User) : null
  const description =
    (post as PostWithGeo).seoContent?.aiSummary?.trim() ||
    post.meta?.description?.trim() ||
    post.excerpt?.trim() ||
    undefined

  const featuredYoutubeId = parseYoutubeVideoId(post.featuredYoutubeUrl)
  const featuredImage =
    post.meta?.image && typeof post.meta.image === 'object' && post.meta.image.url ?
      post.meta.image.url
    : post.featuredImage && typeof post.featuredImage === 'object' && post.featuredImage.url ?
      post.featuredImage.url
    : undefined

  const contentType = post.contentType || 'article'

  const articleType =
    contentType === 'how-to' ? 'HowTo'
    : contentType === 'faq' ? 'FAQPage'
    : 'BlogPosting'

  const graphs: Record<string, unknown>[] = []

  const articleBase: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': articleType === 'FAQPage' ? 'BlogPosting' : articleType,
    '@id': `${url}#article`,
    headline: post.title,
    name: post.title,
    url,
    ...(description ? { description } : {}),
    ...(featuredImage ? { image: featuredImage.startsWith('http') ? featuredImage : `${base}${featuredImage}` } : {}),
    datePublished: post.publishedOn ?? undefined,
    dateModified: post.updatedAt ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: base,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(author?.name ?
      {
        author: {
          '@type': 'Person',
          name: author.name,
          ...(author.email ? { email: author.email } : {}),
        },
      }
    : {}),
    articleSection: contentType,
    inLanguage: 'en-BD',
  }

  graphs.push(articleBase)

  if (featuredYoutubeId) {
    graphs.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: post.title,
      description: description || post.title,
      embedUrl: `https://www.youtube.com/embed/${featuredYoutubeId}`,
      uploadDate: post.publishedOn ?? post.createdAt,
      thumbnailUrl: `https://img.youtube.com/vi/${featuredYoutubeId}/hqdefault.jpg`,
    })
  }

  const faqs = resolveFaqs(post)
  if (faqs.length > 0 || contentType === 'faq') {
    const faqEntities =
      faqs.length > 0 ? faqs : (
        contentType === 'faq' && description ?
          [{ question: post.title, answer: description }]
        : [])
    if (faqEntities.length > 0) {
      graphs.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqEntities.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      })
    }
  }

  return graphs
}
