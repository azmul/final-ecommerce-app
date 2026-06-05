'use client'

import { useChat } from '@/components/chat/ChatContext'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import React from 'react'

type Props = {
  orderId: number
  orderAccessToken?: string
}

export function OrderChatButton({ orderAccessToken, orderId }: Props) {
  const { open } = useChat()

  return (
    <Button
      onClick={() =>
        open({
          orderAccessToken,
          orderId,
          subject: `Order #${orderId}`,
        })
      }
      type="button"
      variant="outline"
    >
      <MessageCircle className="mr-2 size-4" />
      Chat about this order
    </Button>
  )
}
