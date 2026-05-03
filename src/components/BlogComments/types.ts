/** Shared viewer shape for SSR + comment form — no `'use client'`. */

export type LoggedBlogCommentViewer =
  | {
      email?: string | null
      id: number
      name: string | null
    }
  | null
