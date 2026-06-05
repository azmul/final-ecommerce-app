import type { Payload } from 'payload'

import { mergeGuestConversationsToUser } from '@/lib/chat/access'
import { getGuestSessionIdFromRequest } from '@/lib/chat/session'
import { isValidGuestSessionId } from '@/lib/chat/validators'
import type { User } from '@/payload-types'

export type ChatParticipant = {
  user: User | null
  guestSessionId: string | null
}

export async function resolveChatParticipant(args: {
  payload: Payload
  headers: Headers
  url?: URL
}): Promise<ChatParticipant> {
  const { user } = await args.payload.auth({ headers: args.headers })
  const authUser = (user as User | null) ?? null
  const guestSessionId = getGuestSessionIdFromRequest(args.headers, args.url)

  if (authUser && guestSessionId && isValidGuestSessionId(guestSessionId)) {
    await mergeGuestConversationsToUser({
      guestSessionId,
      payload: args.payload,
      userId: authUser.id,
    })
  }

  return {
    guestSessionId:
      guestSessionId && isValidGuestSessionId(guestSessionId) ? guestSessionId : null,
    user: authUser,
  }
}

export function participantCanChat(participant: ChatParticipant): boolean {
  return Boolean(participant.user) || Boolean(participant.guestSessionId)
}
