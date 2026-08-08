'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Link as LinkIcon, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/useCurrency'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface Product {
  id: string
  name: string
  category: string
  karat: string
  weight: number
  finalPrice: number
  images: string[]
  shop: {
    id: string
    name: string
    logo: string | null
  }
}

function ProductsViewContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { format } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [linkInput, setLinkInput] = useState('')
  const [processingLinks, setProcessingLinks] = useState(false)

  useEffect(() => {
    const idsParam = searchParams.get('ids')
    if (idsParam) {
      fetchProductsByIds(idsParam.split(',').filter(Boolean))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const extractProductIds = (links: string): string[] => {
    const ids: string[] = []
    // Extract IDs from various URL formats:
    // - /products/123
    // - http://example.com/products/123
    // - https://example.com/products/123
    // - products/123
    const urlPattern = /\/products\/([a-zA-Z0-9_-]+)/g
    const matches = links.matchAll(urlPattern)
    
    for (const match of matches) {
      if (match[1] && !ids.includes(match[1])) {
        ids.push(match[1])
      }
    }
    
    // Also check for comma-separated IDs
    const commaSeparated = links.split(',').map(id => id.trim()).filter(Boolean)
    commaSeparated.forEach(id => {
      // If it looks like a product ID (not a URL), add it
      if (!id.includes('/') && !id.includes('http') && !ids.includes(id)) {
        ids.push(id)
      }
    })
    
    return ids
  }

  const fetchProductsByIds = async (ids: string[]) => {
    if (ids.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${B}/products?ids=${ids.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch products',
        })
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch products',
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleProcessLinks = async () => {
    if (!linkInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter product links or IDs',
      })
      return
    }

    setProcessingLinks(true)
    try {
      const ids = extractProductIds(linkInput)
      if (ids.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No valid product IDs found in the links',
        })
        setProcessingLinks(false)
        return
      }

      await fetchProductsByIds(ids)
      setLinkInput('')
      toast({
        title: 'Success',
        description: `Found ${ids.length} product(s)`,
      })
    } catch (error) {
      console.error('Error processing links:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process links',
      })
    } finally {
      setProcessingLinks(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
            <p className="text-gray-500">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            View Products by Links
          </h1>
          <p className="text-gray-600">
            Paste product links or IDs to view multiple products at once
          </p>
        </div>

        {/* Link Input Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="links" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Links or IDs
                </label>
                <div className="flex gap-2">
                  <Input
                    id="links"
                    placeholder="Paste product links (e.g., /products/123) or comma-separated IDs"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleProcessLinks()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleProcessLinks}
                    disabled={processingLinks || !linkInput.trim()}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {processingLinks ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        View Products
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can paste multiple links separated by newlines, or comma-separated product IDs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {products.length} Product{products.length !== 1 ? 's' : ''} Found
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover-lift h-full cursor-pointer">
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
                      <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                          {format(product.finalPrice)}
                        </p>
                        <p className="text-sm text-gray-500">{product.shop.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <LinkIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Products to Display
              </h3>
              <p className="text-gray-600 mb-6">
                Enter product links or IDs above to view products, or use the URL parameter{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  ?ids=id1,id2,id3
                </code>
              </p>
              <Link href="/products">
                <Button variant="outline">Browse All Products</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function ProductsViewPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ProductsViewContent />
    </Suspense>
  )
}
