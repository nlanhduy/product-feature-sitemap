// src/services/ChatService.ts
const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`

export const ChatService = {
  sendMessage: async ({ message, sessionId }) => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    })
    if (!res.ok) throw new Error('Failed to send message')
    return res.json()
  },
}
