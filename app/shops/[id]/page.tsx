'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Store, MapPin, Phone, Mail, Sparkles, ArrowLeft, Star, Trash2, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

// ── helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? (window as any).__JWT : undefined
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ── types ────────────────────────────────────────────────────────────────────

interface Shop {
  id: string
  name: string
  logo: string | null
  banner: string | null
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  commissionRate: number
  status: string
  _count: {
    products: number
    orders: number
  }
}

interface Product {
  id: string
  name: string
  images: string[]
  finalPrice: number
  karat: string
  weight: number
  category: string
}

interface ShopReview {
  id: string
  userId: string
  shopId: string
  rating: number
  comment: string
  createdAt: string
  user?: { name: string | null; email: string }
}

interface ShopReviewsResponse {
  reviews: ShopReview[]
  averageRating: number
  total: number
  distribution: Record<number, number>
}

// ── sub-components ────────────────────────────────────────────────────────────

function StarRow({
  rating,
  interactive = false,
  size = 'md',
  onSelect,
}: {
  rating: number
  interactive?: boolean
  size?: 'sm' | 'md' | 'lg'
  onSelect?: (r: number) => void
}) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(s)}
          className={interactive ? 'cursor-pointer focus:outline-none' : 'cursor-default pointer-events-none'}
          aria-label={interactive ? `Rate ${s} star${s > 1 ? 's' : ''}` : undefined}
        >
          <Star
            className={`${sizeClass} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} ${interactive ? 'hover:fill-amber-300 hover:text-amber-300 transition-colors' : ''}`}
          />
        </button>
      ))}
    </div>
  )
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right text-gray-500">{star}</span>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-500">{count}</span>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ShopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('shops')
  const { data: session } = useSession()

  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // reviews state
  const [reviewsData, setReviewsData] = useState<ShopReviewsResponse | null>(null)
  const [myReview, setMyReview] = useState<ShopReview | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // confirm delete state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const shopId = params.id as string

  // ── derived ──────────────────────────────────────────────────────────────────
  const isClient = (session as any)?.user?.role === 'CLIENT'
  const isAuthenticated = !!session?.user

  // ── data fetching ─────────────────────────────────────────────────────────

  const fetchShop = async () => {
    try {
      const response = await fetch(`${B}/shops/${shopId}`)
      if (response.ok) {
        const data = await response.json()
        setShop(data)
      } else if (response.status === 404) {
        setShop(null)
      }
    } catch (error) {
      console.error('Error fetching shop:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${B}/products?shopId=${shopId}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const loadReviews = useCallback(async () => {
    if (!shopId) return
    setReviewsLoading(true)
    try {
      const [publicRes, myRes] = await Promise.allSettled([
        fetch(`${B}/shop-reviews/shop/${shopId}`),
        fetch(`${B}/shop-reviews/my-review/${shopId}`, { headers: authHeaders() }),
      ])

      if (publicRes.status === 'fulfilled' && publicRes.value.ok) {
        setReviewsData(await publicRes.value.json())
      }

      if (myRes.status === 'fulfilled' && myRes.value.ok) {
        const mine = await myRes.value.json()
        setMyReview(mine ?? null)
      } else {
        setMyReview(null)
      }
    } catch {
      // non-fatal — show empty state
    } finally {
      setReviewsLoading(false)
    }
  }, [shopId])

  useEffect(() => {
    if (shopId) {
      fetchShop()
      fetchProducts()
      loadReviews()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId])

  // ── dialog helpers ────────────────────────────────────────────────────────

  const openWriteDialog = () => {
    if (myReview) {
      setEditRating(myReview.rating)
      setEditComment(myReview.comment)
    } else {
      setEditRating(5)
      setEditComment('')
    }
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!editComment.trim()) {
      setFormError('Please write a comment before submitting.')
      return
    }
    if (editComment.trim().length > 500) {
      setFormError('Comment must be 500 characters or fewer.')
      return
    }
    setFormError(null)
    setSubmitting(true)
    try {
      if (myReview) {
        const res = await fetch(`${B}/shop-reviews/${myReview.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ rating: editRating, comment: editComment.trim() }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.message || 'Failed to update review')
        }
      } else {
        const res = await fetch(`${B}/shop-reviews`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ shopId, rating: editRating, comment: editComment.trim() }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.message || 'Failed to submit review')
        }
      }
      setDialogOpen(false)
      loadReviews()
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!myReview) return
    setDeleting(true)
    try {
      const res = await fetch(`${B}/shop-reviews/${myReview.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to delete review')
      setMyReview(null)
      setConfirmDeleteOpen(false)
      loadReviews()
    } catch {
      // keep dialog open — error visible via server-side
    } finally {
      setDeleting(false)
    }
  }

  // ── loading / not-found guards ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 mb-4">Shop not found</p>
        <Link href="/shops">
          <Button>Back to Shops</Button>
        </Link>
      </div>
    )
  }

  const dist = reviewsData?.distribution ?? {}

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20">
      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/shops" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Shops
        </Link>
      </div>

      {/* Shop Header */}
      <section className="bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 border-b border-amber-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {shop.logo && (
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                <Image
                  src={shop.logo}
                  alt={shop.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
                {shop.name}
              </h1>
              {shop.description && (
                <p className="text-lg text-gray-700 mb-4 max-w-2xl">{shop.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {shop.city && shop.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>{shop.city}, {shop.country}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500" />
                    <span>{shop.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">
          Products from {shop.name}
        </h2>

        {products.length === 0 ? (
          <Card className="text-center py-12 border-0 shadow-md">
            <CardContent>
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products available from this shop yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover-lift h-full">
                  <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Sparkles className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {product.karat} • {product.weight}g • {product.category}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                      ${product.finalPrice.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Reviews Section ──────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>

          {/* Write / auth CTA */}
          {isClient ? (
            <div className="flex gap-2">
              {myReview && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-600 text-amber-600 hover:bg-amber-50 gap-1.5"
                    onClick={openWriteDialog}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit My Review
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50 gap-1.5"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              {!myReview && (
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                  onClick={openWriteDialog}
                >
                  <Star className="h-4 w-4" />
                  Write a Review
                </Button>
              )}
            </div>
          ) : !isAuthenticated ? (
            <Link href="/auth/signin">
              <Button variant="outline" size="sm" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                Sign in to leave a review
              </Button>
            </Link>
          ) : null}
        </div>

        {reviewsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : (
          <>
            {/* Summary card */}
            {(reviewsData?.total ?? 0) > 0 && (
              <Card className="border-0 shadow-md mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    {/* Big rating number */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className="text-6xl font-bold text-amber-600">
                        {reviewsData!.averageRating.toFixed(1)}
                      </span>
                      <StarRow rating={Math.round(reviewsData!.averageRating)} size="md" />
                      <span className="text-sm text-gray-500 mt-1">
                        {reviewsData!.total} {reviewsData!.total === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>

                    {/* Distribution bars */}
                    <div className="flex-1 w-full max-w-xs space-y-1.5">
                      {[5, 4, 3, 2, 1].map((s) => (
                        <RatingBar
                          key={s}
                          star={s}
                          count={dist[s] ?? 0}
                          total={reviewsData!.total}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews list */}
            {(reviewsData?.reviews ?? []).length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <span className="text-4xl mb-4 block">✦</span>
                  <p className="text-lg font-medium text-gray-700 mb-1">No Reviews Yet</p>
                  <p className="text-sm text-gray-500">Be the first to share your experience with this shop.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviewsData!.reviews.map((review) => {
                  const isOwn = review.userId === (session as any)?.user?.id
                  const displayName = review.user?.name || review.user?.email || 'Customer'
                  const initial = displayName.charAt(0).toUpperCase()
                  return (
                    <Card
                      key={review.id}
                      className={`border-0 shadow-sm ${isOwn ? 'ring-1 ring-amber-300' : ''}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                            {initial}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-gray-900 text-sm">
                                {displayName}
                                {isOwn && (
                                  <span className="ml-2 text-xs text-amber-600 font-normal">(You)</span>
                                )}
                              </span>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(review.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <StarRow rating={review.rating} size="sm" />

                            <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Write / Edit Review Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{myReview ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Your Rating</label>
              <StarRow rating={editRating} interactive size="lg" onSelect={setEditRating} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Your Comment</label>
              <textarea
                value={editComment}
                onChange={(e) => {
                  setEditComment(e.target.value)
                  if (formError) setFormError(null)
                }}
                placeholder="Share your experience with this shop…"
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between mt-1">
                {formError ? (
                  <p className="text-xs text-red-500">{formError}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400 ml-auto">{editComment.length}/500</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : myReview ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to delete your review? This action cannot be undone.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
