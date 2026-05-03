import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
  Payload,
} from 'payload'

import { revalidatePath } from 'next/cache'

type PostRelation = number | { id?: number; slug?: string } | null | undefined

const resolvePostSlug = async (
  payload: Payload,
  postRef: PostRelation,
  req: PayloadRequest,
): Promise<string | undefined> => {
  if (!postRef) return undefined

  if (typeof postRef === 'object' && postRef !== null && typeof postRef.slug === 'string') {
    return postRef.slug
  }

  const id = typeof postRef === 'object' && postRef !== null ? postRef.id : postRef

  if (id === undefined || id === null) return undefined

  const postDoc = await payload.findByID({
    collection: 'posts',
    depth: 0,
    id,
    overrideAccess: true,
    req,
    select: {
      slug: true,
    },
  })

  return postDoc?.slug ?? undefined
}

const refreshBlogPathsForPost = async (
  payload: Payload,
  postRef: PostRelation,
  req: PayloadRequest,
) => {
  const slug = await resolvePostSlug(payload, postRef, req)

  if (slug) {
    revalidatePath(`/blog/${slug}`)
  }

  revalidatePath('/blog')
}

export const revalidateBlogCommentPaths: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!req.context.disableRevalidate && doc && typeof doc === 'object' && 'post' in doc) {
    await refreshBlogPathsForPost(req.payload, (doc as { post: PostRelation }).post, req)
  }

  return doc
}

export const revalidateBlogCommentPathsDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (!req.context.disableRevalidate && doc && typeof doc === 'object' && 'post' in doc) {
    await refreshBlogPathsForPost(req.payload, (doc as { post: PostRelation }).post, req)
  }

  return doc
}
