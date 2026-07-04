import type { Category, Media, Post, User } from '@/payload-types'

import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import { parseYoutubeVideoId } from '@/utilities/youtube'

type PostSeoContent = {
  aiSummary?: string | null
  faqs?: { question?: string | null; answer?: string | null }[] | null
}

type PostWithGeo = Post & {
  seoContent?: PostSeoContent
  totalTime?: string | null
  tags?: ({ tag?: string | null; id?: string | null } | string)[] | null
  categories?: (number | Category)[] | null
}

type RichTextRoot = {
  root?: {
    children?: RichTextNode[]
  }
}

type RichTextNode = {
  type?: string
  tag?: string | number
  text?: string
  children?: RichTextNode[]
  [k: string]: unknown
}

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

/**
 * Walks a Lexical/rich-text tree and joins all text nodes into a single string.
 * Forgiving: returns '' on any malformed input.
 */
function richTextToPlainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as RichTextRoot).root
  if (!root || !Array.isArray(root.children)) return ''

  const parts: string[] = []
  const walk = (node: RichTextNode | null | undefined) => {
    if (!node || typeof node !== 'object') return
    if (typeof node.text === 'string') parts.push(node.text)
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child)
    }
  }
  try {
    for (const child of root.children) walk(child)
  } catch {
    return ''
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Best-effort strip of rich-text to plain text capped at `maxLength` chars.
 */
function stripRichText(content: unknown, maxLength = 280): string {
  const plain = richTextToPlainText(content)
  if (!plain) return ''
  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength - 1).trimEnd() + '…'
}

/**
 * Counts words from a rich-text body. Returns 0 if input is malformed.
 */
function wordCountFromRichText(content: unknown): number {
  const plain = richTextToPlainText(content)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

function slugifyForAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

/**
 * Extracts H2/H3 nodes from a Lexical/rich-text tree as HowToStep entries.
 * Each step's `text` is the immediately following paragraph (if any).
 * Returns [] on any parse failure — never throws.
 */
function parseStepsFromRichText(
  content: unknown,
  postUrl: string,
): { '@type': 'HowToStep'; name: string; text?: string; url: string }[] {
  if (!content || typeof content !== 'object') return []
  const root = (content as RichTextRoot).root
  if (!root || !Array.isArray(root.children)) return []

  const steps: { '@type': 'HowToStep'; name: string; text?: string; url: string }[] = []
  const children = root.children

  const nodeToText = (node: RichTextNode | undefined | null): string => {
    if (!node) return ''
    const parts: string[] = []
    const walk = (n: RichTextNode | null | undefined) => {
      if (!n) return
      if (typeof n.text === 'string') parts.push(n.text)
      if (Array.isArray(n.children)) n.children.forEach(walk)
    }
    walk(node)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  }

  try {
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      if (!node || node.type !== 'heading') continue
      const tag = typeof node.tag === 'string' ? node.tag.toLowerCase() : `h${node.tag ?? ''}`
      if (tag !== 'h2' && tag !== 'h3') continue

      const name = nodeToText(node)
      if (!name) continue

      let stepText: string | undefined
      for (let j = i + 1; j < children.length; j++) {
        const next = children[j]
        if (!next) continue
        if (next.type === 'heading') break
        if (next.type === 'paragraph') {
          const t = nodeToText(next)
          if (t) {
            stepText = t
            break
          }
        }
      }

      steps.push({
        '@type': 'HowToStep',
        name,
        ...(stepText ? { text: stepText } : {}),
        url: `${postUrl}#${slugifyForAnchor(name)}`,
      })
    }
  } catch {
    return []
  }

  return steps
}

function isoDurationFromMinutes(minutes: number): string {
  const safe = Math.max(1, Math.ceil(minutes))
  return `PT${safe}M`
}

function resolveKeywords(post: Post): string | undefined {
  const tagsRaw = (post as PostWithGeo).tags
  const tagNames: string[] = []
  if (Array.isArray(tagsRaw)) {
    for (const t of tagsRaw) {
      if (typeof t === 'string') {
        if (t.trim()) tagNames.push(t.trim())
      } else if (t && typeof t === 'object' && typeof t.tag === 'string' && t.tag.trim()) {
        tagNames.push(t.tag.trim())
      }
    }
  }

  const categoriesRaw = (post as PostWithGeo).categories
  if (Array.isArray(categoriesRaw)) {
    for (const c of categoriesRaw) {
      if (typeof c === 'object' && c) {
        const title = (c as Category).title
        if (typeof title === 'string' && title.trim()) tagNames.push(title.trim())
      }
    }
  }

  if (tagNames.length === 0) return undefined
  return Array.from(new Set(tagNames)).join(', ')
}

/**
 * Builds an expanded schema.org Person object from a User with optional
 * authorProfile fields. Each property is gated by a truthy check.
 */
function buildAuthorPerson(author: User): Record<string, unknown> | null {
  if (!author?.name) return null

  const profile = author.authorProfile ?? null
  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: author.name,
  }

  if (author.email) person.email = author.email

  if (profile?.authorSlug) {
    const absolute = toAbsoluteUrl(`/author/${profile.authorSlug}`)
    if (absolute) person.url = absolute
  }

  const photo = profile?.photo
  if (photo && typeof photo === 'object') {
    const photoUrl = (photo as Media).url
    if (photoUrl) {
      const abs = toAbsoluteUrl(photoUrl)
      if (abs) person.image = abs
    }
  }

  if (profile?.jobTitle) person.jobTitle = profile.jobTitle

  if (profile?.bio) {
    const description = stripRichText(profile.bio, 280)
    if (description) person.description = description
  }

  if (Array.isArray(profile?.sameAs)) {
    const sameAs = profile.sameAs
      .map((entry) => (entry && typeof entry.url === 'string' ? entry.url.trim() : ''))
      .filter(Boolean)
    if (sameAs.length > 0) person.sameAs = sameAs
  }

  if (Array.isArray(profile?.expertise)) {
    const knowsAbout = profile.expertise
      .map((entry) => (entry && typeof entry.topic === 'string' ? entry.topic.trim() : ''))
      .filter(Boolean)
    if (knowsAbout.length > 0) person.knowsAbout = knowsAbout
  }

  if (profile?.credentials) {
    person.hasCredential = [
      {
        '@type': 'EducationalOccupationalCredential',
        name: profile.credentials,
      },
    ]
  }

  return person
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

  const contentType: string = post.contentType || 'article'

  // Map contentType -> schema.org @type for the primary article entity.
  // contentType is widened to string so future values (e.g. 'news') can be
  // dispatched through this same builder without TS narrowing the union away.
  const articleType =
    contentType === 'how-to' ? 'HowTo'
    : contentType === 'news' ? 'NewsArticle'
    : contentType === 'faq' ? 'FAQPage'
    : 'BlogPosting'

  const graphs: Record<string, unknown>[] = []

  // Compute body-derived fields once — they apply to every Article/HowTo emitted.
  const wordCount = wordCountFromRichText(post.content)
  const timeRequired = wordCount > 0 ? isoDurationFromMinutes(wordCount / 200) : undefined
  const keywords = resolveKeywords(post)
  const authorPerson = author ? buildAuthorPerson(author) : null
  const imageAbsolute =
    featuredImage ?
      featuredImage.startsWith('http') ? featuredImage
      : `${base}${featuredImage}`
    : undefined

  // FAQPage gets a dedicated graph node further down — the primary entity
  // for contentType='faq' stays a BlogPosting so we keep article metadata.
  const primaryType =
    articleType === 'FAQPage' ? 'BlogPosting'
    : articleType === 'HowTo' ? 'HowTo'
    : articleType === 'NewsArticle' ? 'NewsArticle'
    : 'BlogPosting'

  const articleBase: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': primaryType,
    '@id': `${url}#article`,
    headline: post.title,
    name: post.title,
    url,
    ...(description ? { description } : {}),
    ...(imageAbsolute ? { image: imageAbsolute } : {}),
    datePublished: post.publishedOn ?? undefined,
    dateModified: post.updatedAt ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: base,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(authorPerson ? { author: authorPerson } : {}),
    articleSection: contentType,
    inLanguage: 'en-BD',
    ...(wordCount > 0 ? { wordCount } : {}),
    ...(timeRequired ? { timeRequired } : {}),
    ...(keywords ? { keywords } : {}),
  }

  // HowTo branch — replace the BlogPosting with a HowTo graph that adds steps.
  if (primaryType === 'HowTo') {
    const totalTime = (post as PostWithGeo).totalTime
    const steps = parseStepsFromRichText(post.content, url)
    Object.assign(articleBase, {
      ...(totalTime ? { totalTime } : {}),
      supply: [],
      tool: [],
      step: steps,
    })
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

/**
 * Convenience builder that forces the HowTo schema branch regardless of the
 * post's stored contentType. Useful when conditional dispatch happens upstream.
 */
export function buildHowToJsonLd(post: Post, slug: string) {
  return buildBlogJsonLd({ ...post, contentType: 'how-to' }, slug)
}

/**
 * Convenience builder that forces the NewsArticle schema branch.
 * `contentType: 'news'` is not yet a valid value on the Post union — cast
 * keeps the helper usable today and ready when the field accepts 'news'.
 */
export function buildNewsArticleJsonLd(post: Post, slug: string) {
  return buildBlogJsonLd(
    { ...post, contentType: 'news' as unknown as Post['contentType'] },
    slug,
  )
}
