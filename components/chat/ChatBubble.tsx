'use client'

import { useState, useEffect, useRef } from 'react'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface Message {
  role: 'user' | 'ai' | 'agent'
  content: string
}

function getSessionToken(): string {
  const key = 'jowelery_chat_token'
  let token = localStorage.getItem(key)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(key, token)
  }
  return token
}

export function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isHuman, setIsHuman] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSessionToken(getSessionToken())
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: 'Hi! 👋 How can I help you today? Ask me about our gold jewelry, pricing, orders, or anything else!',
      }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionToken) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const token = typeof window !== 'undefined' ? (window as any).__JWT : undefined
      const res = await fetch(`${B}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionToken, message: userMsg }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages((prev) => [...prev, { role: data.isHuman ? 'agent' : 'ai', content: data.reply }])
        setIsHuman(data.isHuman)
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-600">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              J
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm leading-none">Jowelery Support</p>
              <p className="text-amber-100 text-xs mt-0.5">
                {isHuman ? '🟢 Connected to agent' : '🤖 AI Assistant'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50" style={{ maxHeight: 360 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">
                    {msg.role === 'agent' ? '👤' : '🤖'}
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                    msg.role === 'user'
                      ? 'bg-amber-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs mr-2 shrink-0">
                  🤖
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-200 bg-white flex gap-2">
            <input
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-amber-700 transition-colors shrink-0"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-600 shadow-lg hover:bg-amber-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center text-2xl"
        aria-label="Open chat"
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  )
}
