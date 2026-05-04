'use client'

import { Button } from '@/components/ui/button'
import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm'
import { WebPushSettings } from '@/components/notifications/WebPushSettings'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CheckCheck, Inbox, Loader2 } from 'lucide-react'

type NotificationDoc = {
  id: number
  title: string
  body: string
  linkUrl?: string | null
  readAt?: string | null
  createdAt: string
  channels?: ('inbox' | 'push')[] | null
}

export function NotificationsPageClient() {
  const [docs, setDocs] = useState<NotificationDoc[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=50', { credentials: 'include' })
      if (!res.ok) return
      const data = (await res.json()) as {
        docs?: NotificationDoc[]
        unreadCount?: number
      }
      setDocs(data.docs ?? [])
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const es = new EventSource('/api/notifications/stream')
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { unreadCount?: number }
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount)
        }
      } catch {
        //
      }
    }
    es.onerror = () => {
      es.close()
    }
    return () => es.close()
  }, [])

  const markRead = async (id: number) => {
    await fetch('/api/notifications', {
      body: JSON.stringify({ ids: [id] }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    void load()
  }

  const markAll = async () => {
    await fetch('/api/notifications', {
      body: JSON.stringify({ markAllRead: true }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    void load()
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex flex-col gap-4 border-b border-border bg-muted/20 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border/60">
              <Inbox className="h-4.5 w-4.5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-medium tracking-tight text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ?
                  `${unreadCount} unread · updates appear here and via push when enabled.`
                : 'You are all caught up. Live updates refresh every ~20 seconds.'}
              </p>
            </div>
          </div>
          {unreadCount > 0 ?
            <Button
              className="gap-2"
              onClick={() => void markAll()}
              size="sm"
              type="button"
              variant="outline"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </Button>
          : null}
        </header>
        <div className="p-6 sm:p-8">
          {loading ?
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </div>
          : docs.length === 0 ?
            <p className="text-sm text-muted-foreground">
              No messages yet. Create alerts from a product page or wait for store updates.
            </p>
          : <ul className="flex flex-col gap-3">
              {docs.map((n) => {
                const unread = !n.readAt
                const href = n.linkUrl?.trim() ? n.linkUrl : null
                const inner = (
                  <div
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left transition-colors',
                      unread ? 'border-primary/25 bg-primary/5' : 'border-border/80 bg-muted/10',
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                      {n.channels?.length ?
                        <span className="ml-2">
                          · {n.channels.join(', ')}
                        </span>
                      : null}
                    </p>
                  </div>
                )
                return (
                  <li key={n.id}>
                    {href ?
                      <Link
                        className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={href.startsWith('http') ? href : href}
                        onClick={() => {
                          if (unread) void markRead(n.id)
                        }}
                      >
                        {inner}
                      </Link>
                    : <button
                        className="block w-full cursor-default text-left outline-none"
                        type="button"
                        onClick={() => {
                          if (unread) void markRead(n.id)
                        }}
                      >
                        {inner}
                      </button>
                    }
                  </li>
                )
              })}
            </ul>
          }
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="border-b border-border bg-muted/20 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-medium tracking-tight text-foreground">Preferences &amp; devices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what we send. Web Push requires enabling it on each browser or phone you use.
          </p>
        </header>
        <div className="space-y-8 p-6 sm:p-8">
          <NotificationPreferencesForm />
          <div className="border-t border-border/80 pt-8">
            <h3 className="mb-3 text-sm font-medium text-foreground">This device</h3>
            <WebPushSettings />
          </div>
        </div>
      </section>
    </div>
  )
}
