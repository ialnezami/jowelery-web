'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Heart, ShoppingCart, Volume2, VolumeX, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

function authHeaders(): HeadersInit {
  const token = (window as any).__JWT
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface FeedSlide {
  id: string
  productId: string
  productName: string
  shopName: string
  finalPrice: number
  karat: string
  mediaType: 'video' | 'image'
  mediaUrl: string
}

function toSlides(products: any[]): FeedSlide[] {
  const slides: FeedSlide[] = []
  for (const p of products) {
    const images: string[] = p.images || []
    const videos: string[] = p.videos || []
    const mediaItems: Array<{ type: 'image' | 'video'; url: string }> = []
    if (images[0]) mediaItems.push({ type: 'image', url: images[0] })
    if (videos[0]) mediaItems.push({ type: 'video', url: videos[0] })
    for (let i = 1; i < images.length; i++) mediaItems.push({ type: 'image', url: images[i] })
    for (let i = 1; i < videos.length; i++) mediaItems.push({ type: 'video', url: videos[i] })
    if (mediaItems.length === 0) mediaItems.push({ type: 'image', url: '' })
    mediaItems.forEach((m, idx) => {
      slides.push({
        id: `${p.id}-${idx}`,
        productId: p.id,
        productName: p.name,
        shopName: p.shop?.name || '',
        finalPrice: p.finalPrice,
        karat: p.karat,
        mediaType: m.type,
        mediaUrl: m.url,
      })
    })
  }
  return slides
}

// Single slide component
function Slide({ slide, isMuted, onMuteToggle, onAddToCart, wishlisted, onWishlistToggle }: {
  slide: FeedSlide
  isMuted: boolean
  onMuteToggle: () => void
  onAddToCart: (id: string) => void
  wishlisted: boolean
  onWishlistToggle: (id: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || slide.mediaType !== 'video') return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return
        if (entry.isIntersecting) videoRef.current.play().catch(() => {})
        else { videoRef.current.pause(); videoRef.current.currentTime = 0 }
      },
      { threshold: 0.6 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [slide.mediaType])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  return (
    <div ref={wrapRef} style={{ scrollSnapAlign: 'start', height: '100dvh', position: 'relative', background: '#000', flexShrink: 0 }}>
      {/* Media */}
      {slide.mediaType === 'video' && slide.mediaUrl ? (
        <video
          ref={videoRef}
          src={slide.mediaUrl}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loop
          muted
          playsInline
          autoPlay={false}
        />
      ) : slide.mediaUrl ? (
        <img
          src={slide.mediaUrl}
          alt={slide.productName}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          <span style={{ fontSize: 64, opacity: 0.3 }}>✦</span>
        </div>
      )}

      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />

      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: 80, left: 16, right: 72 }}>
        <span style={{ display: 'inline-block', background: 'rgba(184,145,42,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: 1, marginBottom: 8 }}>
          {slide.karat}
        </span>
        <Link href={`/products/${slide.productId}`}>
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{slide.productName}</p>
        </Link>
        {slide.shopName && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 }}>{slide.shopName}</p>}
        <p style={{ color: '#fff', fontSize: 24, fontWeight: 300 }}>${slide.finalPrice.toLocaleString()}</p>
      </div>

      {/* Right actions */}
      <div style={{ position: 'absolute', right: 12, bottom: 80, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <button
          onClick={() => onWishlistToggle(slide.productId)}
          style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Heart size={24} color={wishlisted ? '#ef4444' : '#fff'} fill={wishlisted ? '#ef4444' : 'transparent'} />
        </button>
        <button
          onClick={() => onAddToCart(slide.productId)}
          style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ShoppingCart size={24} color="#fff" />
        </button>
        {slide.mediaType === 'video' && (
          <button
            onClick={onMuteToggle}
            style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isMuted ? <VolumeX size={22} color="#fff" /> : <Volume2 size={22} color="#fff" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [slides, setSlides] = useState<FeedSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const loadProducts = useCallback(async (pageNum = 1) => {
    try {
      const res = await fetch(`${B}/products?page=${pageNum}&limit=10`, { headers: authHeaders() })
      const data = await res.json()
      const newSlides = toSlides(data.products || [])
      setSlides(prev => pageNum === 1 ? newSlides : [...prev, ...newSlides])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts(1) }, [])

  useEffect(() => {
    if (!session) return
    fetch(`${B}/wishlist`, { headers: authHeaders() })
      .then(r => r.json())
      .then((data: any[]) => setWishlistedIds(new Set(data.map((w: any) => w.productId))))
      .catch(() => {})
  }, [session])

  // Infinite scroll
  useEffect(() => {
    const lastEl = document.querySelector('[data-last-slide]')
    if (!lastEl) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const next = page + 1; setPage(next); loadProducts(next) }
    }, { threshold: 0.5 })
    obs.observe(lastEl)
    return () => obs.disconnect()
  }, [slides.length, page])

  const handleAddToCart = async (productId: string) => {
    if (!session) { toast({ title: 'Sign in to add to cart', variant: 'destructive' }); return }
    try {
      await fetch(`${B}/cart`, { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: 1 }) })
      toast({ title: 'Added to cart' })
    } catch {
      toast({ title: 'Could not add to cart', variant: 'destructive' })
    }
  }

  const handleWishlistToggle = async (productId: string) => {
    if (!session) { toast({ title: 'Sign in to save items', variant: 'destructive' }); return }
    const wasWishlisted = wishlistedIds.has(productId)
    setWishlistedIds(prev => { const n = new Set(prev); wasWishlisted ? n.delete(productId) : n.add(productId); return n })
    try {
      if (wasWishlisted) await fetch(`${B}/wishlist/${productId}`, { method: 'DELETE', headers: authHeaders() })
      else await fetch(`${B}/wishlist`, { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
    } catch {
      setWishlistedIds(prev => { const n = new Set(prev); wasWishlisted ? n.add(productId) : n.delete(productId); return n })
    }
  }

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #B8912A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ height: '100dvh', overflow: 'hidden auto', scrollSnapType: 'y mandatory', background: '#000', position: 'relative' }}>
      {/* Back nav */}
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '8px 14px', borderRadius: 24, textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={18} /> Home
        </Link>
      </div>

      {slides.map((slide, idx) => (
        <div key={slide.id} {...(idx === slides.length - 1 ? { 'data-last-slide': true } : {})}>
          <Slide
            slide={slide}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(m => !m)}
            onAddToCart={handleAddToCart}
            wishlisted={wishlistedIds.has(slide.productId)}
            onWishlistToggle={handleWishlistToggle}
          />
        </div>
      ))}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
