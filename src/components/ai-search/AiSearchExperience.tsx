'use client'

import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from '@/components/ai-search/searchHistory'
import type {
  AiSearchMessage,
  AiSearchMode,
  KnowledgeChunkResult,
  ProductSort,
} from '@/components/ai-search/types'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { ChatThinkingIndicator } from '@/components/chat/ChatThinkingIndicator'
import { CHAT_THEME_CLASS } from '@/components/chat/chatTheme'
import { useChat } from '@/components/chat/ChatContext'
import { Price } from '@/components/Price'
import { CheckoutLoyaltyPoints } from '@/components/checkout/CheckoutLoyaltyPoints'
import { CheckoutPromoCode } from '@/components/checkout/CheckoutPromoCode'
import { Button } from '@/components/ui/button'
import type { AiProductResult } from '@/lib/ai/types'
import type { ChatMessageDTO } from '@/lib/chat/types'
import { readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import {
  BookOpen,
  Bot,
  ChevronDown,
  History,
  LayoutGrid,
  Link2,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const QUICK_PROMPTS = [
  'Products under 500 BDT',
  'Show today’s offers',
  'Help me choose a gift',
  'What is your return policy?',
  'Free shipping options',
] as const

const MODE_OPTIONS: { id: AiSearchMode; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    hint: 'Full AI assistant with tools',
    icon: <Sparkles className="size-3.5" />,
    id: 'assistant',
    label: 'Smart AI',
  },
  {
    hint: 'Structured catalog filters',
    icon: <Search className="size-3.5" />,
    id: 'products',
    label: 'Products',
  },
  {
    hint: 'Meaning-based product match',
    icon: <Zap className="size-3.5" />,
    id: 'semantic',
    label: 'Semantic',
  },
  {
    hint: 'Policies, FAQs & guides',
    icon: <BookOpen className="size-3.5" />,
    id: 'knowledge',
    label: 'Help',
  },
]

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function toChatMessage(message: AiSearchMessage, index: number): ChatMessageDTO {
  return {
    body: message.body,
    createdAt: message.createdAt,
    id: index,
    knowledgeChunks: message.knowledgeChunks,
    products: message.products,
    senderType: message.role === 'user' ? 'customer' : 'system',
  }
}

function sortProducts(products: AiProductResult[], sort: ProductSort): AiProductResult[] {
  const copy = [...products]
  if (sort === 'price-asc') {
    return copy.sort((a, b) => (a.salePrice ?? a.price ?? Infinity) - (b.salePrice ?? b.price ?? Infinity))
  }
  if (sort === 'price-desc') {
    return copy.sort((a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0))
  }
  return copy
}

export function AiSearchExperience() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { open: openChat } = useChat()
  const { cart } = useCart()

  const [mode, setMode] = useState<AiSearchMode>('assistant')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<AiSearchMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [checkoutExpanded, setCheckoutExpanded] = useState(false)
  const [productSort, setProductSort] = useState<ProductSort>('relevance')

  const listRef = useRef<HTMLDivElement>(null)
  const initialQueryHandled = useRef(false)
  const voiceHintShownRef = useRef(false)

  useEffect(() => {
    setRecentSearches(readRecentSearches())
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ behavior: 'smooth', top: listRef.current.scrollHeight })
    }
  }, [messages, isSearching])

  const runSearch = useCallback(
    async (rawQuery: string, searchMode: AiSearchMode = mode) => {
      const query = rawQuery.trim()
      if (!query || isSearching) return

      setError(null)
      setIsSearching(true)

      const userMessage: AiSearchMessage = {
        body: query,
        createdAt: new Date().toISOString(),
        id: createMessageId(),
        mode: searchMode,
        role: 'user',
      }

      setMessages((prev) => [...prev, userMessage])
      setDraft('')
      setRecentSearches(pushRecentSearch(query))

      const params = new URLSearchParams(searchParams.toString())
      params.set('q', query)
      router.replace(`/ai-search?${params.toString()}`, { scroll: false })

      try {
        let assistantMessage: AiSearchMessage

        if (searchMode === 'assistant') {
          const history = messages.slice(-20).map((message) => ({
            content: message.body,
            role: message.role,
          }))

          const res = await fetch('/api/ai/assistant', {
            body: JSON.stringify({
              // The server verifies cart ownership; the secret lets a guest's own
              // cart be used for in-chat shipping/promo quotes.
              cartSecret: cart?.id ? readGuestCartSecret(cart) : undefined,
              context: cart?.id ? { cartId: cart.id } : undefined,
              history,
              message: query,
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })

          const json = (await res.json()) as {
            error?: string
            handoffToHuman?: boolean
            knowledgeChunks?: KnowledgeChunkResult[]
            products?: AiProductResult[]
            reply?: string
            usedTools?: string[]
          }

          if (!res.ok) throw new Error(json.error ?? 'AI search failed.')

          assistantMessage = {
            body: json.reply ?? 'No response from assistant.',
            createdAt: new Date().toISOString(),
            id: createMessageId(),
            knowledgeChunks: json.knowledgeChunks,
            mode: searchMode,
            products: json.products,
            role: 'assistant',
            usedTools: json.usedTools,
          }
        } else if (searchMode === 'products') {
          const res = await fetch('/api/ai/search-products', {
            body: JSON.stringify({ limit: 12, query }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })

          const json = (await res.json()) as {
            error?: string
            products?: AiProductResult[]
            total?: number
          }

          if (!res.ok) throw new Error(json.error ?? 'Product search failed.')

          const total = json.total ?? json.products?.length ?? 0
          assistantMessage = {
            body:
              total > 0
                ? `Found ${total} product${total === 1 ? '' : 's'} matching your search.`
                : 'No products matched your search. Try different keywords or switch to Semantic mode.',
            createdAt: new Date().toISOString(),
            id: createMessageId(),
            mode: searchMode,
            products: json.products,
            role: 'assistant',
          }
        } else if (searchMode === 'semantic') {
          const res = await fetch('/api/ai/semantic-search', {
            body: JSON.stringify({ limit: 12, query }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })

          const json = (await res.json()) as {
            error?: string
            method?: string
            products?: AiProductResult[]
            total?: number
          }

          if (!res.ok) throw new Error(json.error ?? 'Semantic search failed.')

          const total = json.total ?? json.products?.length ?? 0
          assistantMessage = {
            body:
              total > 0
                ? `Semantic search (${json.method ?? 'ai'}) found ${total} relevant product${total === 1 ? '' : 's'}.`
                : 'No semantically similar products found. Try describing the item differently.',
            createdAt: new Date().toISOString(),
            id: createMessageId(),
            mode: searchMode,
            products: json.products,
            role: 'assistant',
          }
        } else {
          const res = await fetch('/api/ai/knowledge-search', {
            body: JSON.stringify({ limit: 6, query }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })

          const json = (await res.json()) as {
            chunks?: KnowledgeChunkResult[]
            error?: string
          }

          if (!res.ok) throw new Error(json.error ?? 'Knowledge search failed.')

          const chunks = Array.isArray(json.chunks) ? json.chunks : []
          assistantMessage = {
            body:
              chunks.length > 0
                ? `Found ${chunks.length} helpful article${chunks.length === 1 ? '' : 's'} from our knowledge base.`
                : 'No matching help articles found. Try rephrasing or switch to Smart AI mode.',
            createdAt: new Date().toISOString(),
            id: createMessageId(),
            knowledgeChunks: chunks,
            mode: searchMode,
            role: 'assistant',
          }
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed.')
      } finally {
        setIsSearching(false)
      }
    },
    [cart?.id, isSearching, messages, mode, router, searchParams],
  )

  useEffect(() => {
    const q = searchParams.get('q')?.trim()
    if (!q || initialQueryHandled.current) return
    initialQueryHandled.current = true
    setDraft(q)
    void runSearch(q)
  }, [runSearch, searchParams])

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runSearch(draft)
  }

  const sortedMessages = useMemo(
    () =>
      messages.map((message) =>
        message.products?.length
          ? { ...message, products: sortProducts(message.products, productSort) }
          : message,
      ),
    [messages, productSort],
  )

  const hasProductResults = sortedMessages.some((message) => message.products?.length)

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Search link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const clearConversation = () => {
    setMessages([])
    setError(null)
    router.replace('/ai-search', { scroll: false })
  }

  return (
    <div className={cn(CHAT_THEME_CLASS, 'min-h-[calc(100vh-8rem)] pb-16')}>
      <section className="relative overflow-hidden border-b border-primary/15 bg-gradient-to-br from-primary/12 via-background to-primary/5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-primary/8 blur-3xl"
        />

        <div className={cn(cmsPageGutterClassName, 'relative py-8 sm:py-10 lg:py-12')}>
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  AI-powered discovery
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  AI Search
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Search products, compare options, explore policies, and get personalized
                  recommendations — with the same intelligence as our shopping assistant.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void copyShareLink()} size="sm" type="button" variant="outline">
                  <Link2 className="mr-1.5 size-3.5" />
                  Share
                </Button>
                <Button
                  onClick={() => {
                    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
                    openChat({ subject: lastUser?.body ?? 'AI Search follow-up' })
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <MessageCircle className="mr-1.5 size-3.5" />
                  Open chat
                </Button>
                {messages.length ? (
                  <Button onClick={clearConversation} size="sm" type="button" variant="ghost">
                    <Trash2 className="mr-1.5 size-3.5" />
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {MODE_OPTIONS.map((option) => (
                <button
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    mode === option.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'border-primary/20 bg-background/80 text-foreground hover:border-primary/40 hover:bg-primary/5',
                  )}
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  title={option.hint}
                  type="button"
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={cn(cmsPageGutterClassName, 'py-6 sm:py-8')}>
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-primary/15 bg-background/95 shadow-xl shadow-primary/5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Bot className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Search conversation</p>
                  <p className="text-[11px] text-muted-foreground">
                    {MODE_OPTIONS.find((option) => option.id === mode)?.hint}
                  </p>
                </div>
              </div>

              {hasProductResults ? (
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="size-3.5 text-muted-foreground" />
                  <select
                    aria-label="Sort products"
                    className="h-8 rounded-lg border bg-background px-2 text-[11px]"
                    onChange={(event) => setProductSort(event.target.value as ProductSort)}
                    value={productSort}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                  </select>
                </div>
              ) : null}
            </div>

            <ChatComposer
              disabled={isSearching}
              footerHint="Enter to search · Shift+Enter for new line · Click mic to speak"
              formClassName="border-b border-primary/10 bg-background/90 px-4 py-3"
              id="ai-search-input"
              inputLabel="AI search query"
              isBusy={isSearching}
              onChange={setDraft}
              onSubmit={onSubmit}
              onVoiceStart={() => {
                if (mode !== 'assistant' && !voiceHintShownRef.current) {
                  voiceHintShownRef.current = true
                  toast.message('Tip: Smart AI mode searches the full website', {
                    description: 'Switch to Smart AI for policies, blog posts, and checkout help.',
                  })
                }
              }}
              placeholder={
                isSearching ? 'Searching…' : 'Describe what you need — products, gifts, policies…'
              }
              value={draft}
            />

            {error ? (
              <p className="border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <div
              className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-muted/15 to-background px-4 py-4 sm:px-5"
              ref={listRef}
            >
              {!messages.length && !isSearching ? (
                <div className="space-y-5 py-4">
                  <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-5 py-8 text-center">
                    <Sparkles className="mx-auto mb-3 size-8 text-primary" />
                    <p className="text-base font-medium">What would you like to find?</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                      Ask in natural language — filter by price, explore help articles, or compare
                      products side by side.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        className="rounded-full border border-primary/20 bg-background px-3.5 py-2 text-xs font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                        disabled={isSearching}
                        key={prompt}
                        onClick={() => void runSearch(prompt)}
                        type="button"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {sortedMessages.map((message, index) => (
                <div key={message.id}>
                  <ChatMessageBubble
                    animate={index === sortedMessages.length - 1}
                    message={toChatMessage(message, index + 1)}
                  />
                  {message.usedTools?.length ? (
                    <p className="mt-1 ml-9 text-[10px] text-muted-foreground">
                      Tools used: {message.usedTools.join(', ')}
                    </p>
                  ) : null}
                </div>
              ))}

              {isSearching ? <ChatThinkingIndicator /> : null}
            </div>

            {cart?.items?.length ? (
              <div className="border-t border-primary/10 bg-muted/20 px-4 py-2">
                <button
                  aria-expanded={checkoutExpanded}
                  className="flex w-full items-center justify-between rounded-xl border border-primary/15 bg-background px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => setCheckoutExpanded((value) => !value)}
                  type="button"
                >
                  <div>
                    <p className="text-[11px] font-medium">
                      Cart ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
                    </p>
                    {typeof cart.subtotal === 'number' ? (
                      <Price
                        amount={cart.subtotal}
                        as="span"
                        className="text-xs font-semibold text-primary"
                      />
                    ) : null}
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-4 text-muted-foreground transition-transform',
                      checkoutExpanded && 'rotate-180',
                    )}
                  />
                </button>
                {checkoutExpanded ? (
                  <div className="mt-2 rounded-xl border bg-background p-2">
                    <div className="flex gap-2">
                      <Button asChild className="h-8 flex-1 text-xs">
                        <Link href="/checkout">Checkout</Link>
                      </Button>
                      <Button asChild className="h-8 px-3 text-xs" variant="outline">
                        <Link href="/cart">View cart</Link>
                      </Button>
                    </div>
                    {cart.id ? (
                      <div className="mt-2 rounded-lg border">
                        <CheckoutPromoCode cartId={cart.id} />
                        <CheckoutLoyaltyPoints cartId={cart.id} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            {recentSearches.length ? (
              <div className="rounded-2xl border border-border/80 bg-muted/15 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <History className="size-4 text-primary" />
                    Recent searches
                  </span>
                  <button
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      clearRecentSearches()
                      setRecentSearches([])
                    }}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:border-primary/30 hover:bg-primary/5"
                      key={term}
                      onClick={() => {
                        setDraft(term)
                        void runSearch(term)
                      }}
                      type="button"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Tips</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Use Smart AI for complex questions and checkout help.</li>
                <li>Semantic mode finds products by vibe, not exact keywords.</li>
                <li>Help mode searches policies, shipping, and FAQs.</li>
                <li>Share your search URL to bookmark results.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
