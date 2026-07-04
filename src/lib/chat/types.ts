import type { AiProductResult, KnowledgeChunkResult } from '@/lib/ai/types'
import type { ChatConversation, ChatMessage, Order, User } from '@/payload-types'

export type ChatConversationStatus = ChatConversation['status']

export type ChatSenderType = ChatMessage['senderType']

export type ChatConversationContextInput = {
  pageUrl?: string | null
  productSlug?: string | null
  cartId?: number | null
  /** Guest cart secret, used to prove ownership of `cartId` before attaching it. */
  cartSecret?: string | null
  orderId?: number | null
  orderAccessToken?: string | null
}

export type ChatMessageDTO = {
  id: number
  body: string
  senderType: ChatSenderType
  senderName?: string | null
  createdAt: string
  products?: AiProductResult[]
  knowledgeChunks?: KnowledgeChunkResult[]
}

export type ChatConversationDTO = {
  id: number
  status: ChatConversationStatus
  subject?: string | null
  lastMessageAt?: string | null
  lastMessagePreview?: string | null
  unreadByCustomer: number
  unreadByAgent: number
  assignedAgent?: number | null
  customer?: number | null
  guestSessionId?: string | null
  context?: ChatConversation['context']
}

export type ChatContextSidebar = {
  customer: Pick<User, 'id' | 'name' | 'email' | 'phone'> | null
  cart: {
    id: number
    itemCount: number
    subtotal?: number | null
    items: { title: string; quantity: number }[]
  } | null
  order: Pick<Order, 'id' | 'status' | 'amount' | 'currency' | 'createdAt'> | null
  recentOrders: Pick<Order, 'id' | 'status' | 'amount' | 'currency' | 'createdAt'>[]
  pageUrl?: string | null
  productSlug?: string | null
}
