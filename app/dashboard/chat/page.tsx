'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, RefreshCw, Send, X, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

interface ChatMessage {
  id: string
  role: 'USER' | 'AI' | 'AGENT'
  content: string
  createdAt: string
}

interface ChatSession {
  id: string
  sessionToken: string
  status: 'AI' | 'HUMAN' | 'CLOSED'
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string } | null
  messages: ChatMessage[]
}

const STATUS_COLORS: Record<string, string> = {
  AI: 'bg-blue-100 text-blue-800',
  HUMAN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
}

export default function ChatDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'AI' | 'HUMAN' | 'CLOSED'>('AI')
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    const role = (session.user as any).role
    if (!['SHOP_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      router.push('/dashboard')
    }
  }, [session, router])

  const fetchSessions = async () => {
    try {
      const q = filter === 'ALL' ? '' : `?status=${filter}`
      const res = await fetch(`${B}/chat/sessions${q}`, { headers: authHeaders() })
      const data = await res.json()
      if (Array.isArray(data)) setSessions(data)
    } finally {
      setLoading(false)
    }
  }

  const fetchSelected = async (id: string) => {
    const res = await fetch(`${B}/chat/sessions/${id}`, { headers: authHeaders() })
    const data = await res.json()
    if (data.id) {
      setSelectedSession(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [filter])

  // Poll selected session every 5s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!selectedId) return
    pollRef.current = setInterval(() => fetchSelected(selectedId), 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selectedId])

  const handleSelect = async (id: string) => {
    setSelectedId(id)
    await fetchSelected(id)
  }

  const handleClaim = async () => {
    if (!selectedId) return
    await fetch(`${B}/chat/sessions/${selectedId}/claim`, { method: 'PUT', headers: authHeaders() })
    await fetchSelected(selectedId)
    await fetchSessions()
  }

  const handleSend = async () => {
    if (!reply.trim() || !selectedId) return
    setSending(true)
    try {
      await fetch(`${B}/chat/sessions/${selectedId}/reply`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: reply.trim() }),
      })
      setReply('')
      await fetchSelected(selectedId)
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    if (!selectedId) return
    await fetch(`${B}/chat/sessions/${selectedId}/reply`, { method: 'DELETE' })
    setSelectedId(null)
    setSelectedSession(null)
    await fetchSessions()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  const FILTERS = ['ALL', 'AI', 'HUMAN', 'CLOSED'] as const

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-amber-600" />
          <h1 className="text-2xl font-bold text-gray-900">Live Chat</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Session list */}
        <div className="lg:col-span-1 overflow-y-auto space-y-2 pr-1">
          {sessions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-12">No sessions found.</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedId === s.id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 truncate">
                  {s.user?.email ?? s.sessionToken.slice(0, 8) + '…'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>
                  {s.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 truncate">
                {s.messages[0]?.content ?? 'No messages'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(s.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>

        {/* Conversation panel */}
        <div className="lg:col-span-2 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white">
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a session to view the conversation
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-amber-600">
                <div>
                  <p className="text-white font-semibold text-sm">
                    {selectedSession.user?.name ?? selectedSession.user?.email ?? 'Guest'}
                  </p>
                  <p className="text-amber-100 text-xs">
                    {selectedSession.user?.email ?? selectedSession.sessionToken.slice(0, 12)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSession.status === 'AI' && (
                    <Button
                      size="sm"
                      onClick={handleClaim}
                      className="bg-white text-amber-700 hover:bg-amber-50 text-xs h-7 px-2 gap-1"
                    >
                      <UserCheck className="h-3 w-3" />
                      Claim
                    </Button>
                  )}
                  {selectedSession.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClose}
                      className="bg-transparent border-white/40 text-white hover:bg-white/10 text-xs h-7 px-2 gap-1"
                    >
                      <X className="h-3 w-3" />
                      Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                {selectedSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role !== 'USER' && (
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">
                        {msg.role === 'AGENT' ? '👤' : '🤖'}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                        msg.role === 'USER'
                          ? 'bg-amber-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'USER' ? 'text-amber-100' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {selectedSession.status !== 'CLOSED' ? (
                <div className="px-3 py-2 border-t border-gray-200 bg-white flex gap-2">
                  {selectedSession.status === 'AI' && (
                    <p className="text-xs text-gray-400 py-2 px-1 flex-1 italic">
                      Claim this session to reply
                    </p>
                  )}
                  {selectedSession.status === 'HUMAN' && (
                    <>
                      <input
                        className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                        placeholder="Type a reply…"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={handleKey}
                        disabled={sending}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !reply.trim()}
                        className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-amber-700 transition-colors shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-400">
                  Session closed
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
