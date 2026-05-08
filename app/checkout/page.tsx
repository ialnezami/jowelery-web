'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Lock, User, MapPin, Save, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/components/CartProvider'
import { AdyenPayment } from '@/components/AdyenPayment'

interface Address {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  street: string
  city: string
  state: string | null
  zipCode: string | null
  country: string
  isDefault: boolean
}

interface Recipient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  relationship: string | null
  isDefault: boolean
}

interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshCart, mergeGuestCart } = useCart()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentSession, setPaymentSession] = useState<{
    sessionId: string
    sessionData: string
    clientKey: string
  } | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [savingRecipient, setSavingRecipient] = useState(false)

  // System Config
  const [paymentMethods, setPaymentMethods] = useState<{ provider: string, isEnabled: boolean, displayName?: string }[]>([])

  // Data from API
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [shop, setShop] = useState<{
    id: string
    name: string
    address: string | null
    city: string | null
    country: string | null
    phone: string | null
    shippingMethods: string[]
    admin?: {
      id: string
      name: string | null
      email: string
      phone: string | null
    }
  } | null>(null)

  // Form state
  const [shipTo, setShipTo] = useState<'myself' | 'recipient' | 'new-recipient'>('myself')
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved') // 'saved' or 'new'
  const [shippingMethod, setShippingMethod] = useState<'PICKUP' | 'DELIVERY' | ''>('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    paymentMethod: 'card',
  })

  useEffect(() => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent('/checkout')}`)
      return
    }

    // Merge guest cart if exists, then fetch all data
    mergeGuestCart().then(() => {
      Promise.all([fetchCart(), fetchProfile(), fetchAddresses(), fetchRecipients(), fetchConfig()])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${B}/config`)
      if (response.ok) {
        const config = await response.json()
        if (config.paymentMethods) {
          const enabledMethods = config.paymentMethods.filter((m: any) => m.isEnabled)
          setPaymentMethods(enabledMethods)
          // Set default payment method if current one is not available
          if (enabledMethods.length > 0 && !enabledMethods.find((m: any) => m.provider === formData.paymentMethod)) {
            // Map provider names to form values if needed, or use provider directly
            // Currently form uses 'card' and 'bank', but config uses 'STRIPE', 'ADYEN', 'COD'
            // We need a mapping strategy. For now, let's assume:
            // STRIPE/ADYEN -> 'card'
            // COD -> 'cod' (we need to add this option)
            // BANK -> 'bank' (if we add it to config)

            // Actually, let's update the form to use the provider codes directly
            // But we need to keep backward compatibility or update the select options
          }
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const fetchCart = async () => {
    try {
      const response = await fetch(`${B}/cart`)
      if (response.ok) {
        const data = await response.json()
        setCartItems(data)
        if (data.length === 0) {
          router.push('/cart')
        } else {
          // Fetch shop info from first cart item
          const firstItem = data[0]
          // Cart API returns product.shop.id, not product.shopId
          const shopId = firstItem?.product?.shop?.id || firstItem?.product?.shopId
          if (shopId) {
            fetchShop(shopId)
          } else {
            console.error('No shop ID found in cart item:', firstItem)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchShop = async (shopId: string) => {
    try {
      const response = await fetch(`${B}/shops/${shopId}`)
      if (response.ok) {
        const shopData = await response.json()
        console.log('Shop data fetched:', shopData) // Debug log
        setShop({
          id: shopData.id,
          name: shopData.name,
          address: shopData.address,
          city: shopData.city,
          country: shopData.country,
          phone: shopData.phone,
          shippingMethods: shopData.shippingMethods || ['PICKUP', 'DELIVERY'], // Default if not set
          admin: shopData.admin,
        })
        // Set default shipping method if only one available
        const methods = shopData.shippingMethods || ['PICKUP', 'DELIVERY']
        if (methods.length === 1) {
          setShippingMethod(methods[0] as 'PICKUP' | 'DELIVERY')
        } else if (methods.includes('DELIVERY')) {
          setShippingMethod('DELIVERY')
        } else if (methods.includes('PICKUP')) {
          setShippingMethod('PICKUP')
        }
      } else {
        console.error('Failed to fetch shop:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error fetching shop:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${B}/users/profile`)
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        // Pre-fill with profile data
        if (profile) {
          const nameParts = profile.name?.split(' ') || []
          setFormData(prev => ({
            ...prev,
            email: profile.email || '',
            phone: profile.phone || '',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${B}/addresses`)
      if (response.ok) {
        const data = await response.json()
        setAddresses(data)
        // If there's a default address, use it
        const defaultAddress = data.find((addr: Address) => addr.isDefault)
        if (defaultAddress && data.length > 0) {
          loadAddress(defaultAddress)
          setSelectedAddressId(defaultAddress.id)
          setAddressMode('saved')
        } else if (data.length > 0) {
          // Use first address if no default
          loadAddress(data[0])
          setSelectedAddressId(data[0].id)
          setAddressMode('saved')
        } else {
          // No saved addresses, show new address form
          setAddressMode('new')
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async () => {
    try {
      const response = await fetch(`${B}/recipients`)
      if (response.ok) {
        const data = await response.json()
        setRecipients(data)
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
    }
  }

  const handleWhatsAppOrder = async () => {
    // Use shop admin phone if available, otherwise use shop phone
    const phoneNumber = shop?.admin?.phone || shop?.phone
    
    if (!shop || !phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Shop contact information is not available',
      })
      return
    }

    // Get frontend base URL
    const frontendBaseUrl = window.location.origin
    
    // Generate product links
    const productLinks = cartItems.map((item) => {
      const productId = item.product?.id || (item as any).productId
      return `${frontendBaseUrl}/products/${productId}`
    }).join('\n')

    // Copy links to clipboard
    try {
      await navigator.clipboard.writeText(productLinks)
      toast({
        title: 'Success',
        description: 'Product links copied to clipboard',
      })
    } catch (error) {
      console.error('Failed to copy links:', error)
      // Continue even if clipboard fails
    }

    // Format cart items for WhatsApp message with links
    const itemsText = cartItems.map((item, index) => {
      const productName = item.product?.name || 'Product'
      const productId = item.product?.id || (item as any).productId
      const quantity = item.quantity
      const price = item.product?.finalPrice || 0
      const total = price * quantity
      const productLink = `${frontendBaseUrl}/products/${productId}`
      return `${index + 1}. ${productName}\n   Qty: ${quantity}\n   Price: $${price.toFixed(2)}\n   Subtotal: $${total.toFixed(2)}\n   Link: ${productLink}`
    }).join('\n\n')

    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product?.finalPrice || 0
      return sum + (price * item.quantity)
    }, 0)

    // Include shipping method in message
    const shippingInfo = shippingMethod === 'PICKUP' 
      ? `*Shipping Method:* Pickup from Shop\n*Pickup Address:* ${shop.address || ''}, ${shop.city || ''}, ${shop.country || ''}`
      : `*Shipping Method:* Delivery\n*Delivery Address:* ${formData.street}, ${formData.city}, ${formData.country}`

    const message = `Hello! I'm interested in placing an order:\n\n` +
      `*Shop:* ${shop.name}\n\n` +
      `*Order Items:*\n${itemsText}\n\n` +
      `${shippingInfo}\n\n` +
      `*Total Amount:* $${totalAmount.toFixed(2)}\n\n` +
      `Product links have been copied to clipboard.\n\n` +
      `Please let me know if these items are available and how to proceed with the order.`

    // Format phone number (remove spaces, +, and special characters for WhatsApp)
    const formattedPhone = phoneNumber.replace(/[\s\+\-\(\)]/g, '')
    
    // Redirect to WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    window.location.href = whatsappUrl
  }

  const loadAddress = (address: Address) => {
    setFormData({
      ...formData,
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email || userProfile?.email || '',
      phone: address.phone || userProfile?.phone || '',
      street: address.street,
      city: address.city,
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country,
    })
  }

  const loadRecipient = (recipient: Recipient) => {
    setFormData({
      ...formData,
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.email || '',
      phone: recipient.phone || '',
    })
  }

  const handleShipToChange = (value: 'myself' | 'recipient' | 'new-recipient') => {
    setShipTo(value)
    if (value === 'myself') {
      // Reset to profile data
      if (userProfile) {
        const nameParts = userProfile.name?.split(' ') || []
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
        }))
      }
      setSelectedRecipientId('')
    } else if (value === 'recipient' && selectedRecipientId) {
      const recipient = recipients.find(r => r.id === selectedRecipientId)
      if (recipient) {
        loadRecipient(recipient)
      }
    } else if (value === 'new-recipient') {
      // Clear recipient selection and reset form for new recipient
      setSelectedRecipientId('')
      // Keep current form data but allow user to enter new recipient details
    }
  }

  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipientId(recipientId)
    const recipient = recipients.find(r => r.id === recipientId)
    if (recipient) {
      loadRecipient(recipient)
    }
  }

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = addresses.find(a => a.id === addressId)
    if (address) {
      loadAddress(address)
      setAddressMode('saved')
    }
  }

  const handleAddressModeChange = (mode: 'saved' | 'new') => {
    setAddressMode(mode)
    if (mode === 'new') {
      // Clear selected address and reset form to profile data
      setSelectedAddressId('')
      if (userProfile) {
        const nameParts = userProfile.name?.split(' ') || []
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        }))
      }
    } else if (mode === 'saved' && addresses.length > 0) {
      // Select default or first address
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
      if (defaultAddr) {
        handleAddressSelect(defaultAddr.id)
      }
    }
  }

  const handleSaveAddress = async () => {
    // Validate required fields
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in first name and last name to save address',
      })
      return
    }

    if (!formData.street?.trim() || !formData.city?.trim() || !formData.country?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in street, city, and country to save address',
      })
      return
    }

    setSavingAddress(true)
    try {
      const response = await fetch(`${B}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email?.trim() || '',
          phone: formData.phone?.trim() || '',
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state?.trim() || '',
          zipCode: formData.zipCode?.trim() || '',
          country: formData.country.trim(),
          isDefault: addresses.length === 0, // Set as default if first address
        }),
      })

      if (response.ok) {
        const newAddress = await response.json()
        setAddresses([...addresses, newAddress])
        setSelectedAddressId(newAddress.id)
        setAddressMode('saved')
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Address saved successfully',
        })
      } else {
        const error = await response.json()
        const errorMessage = error.message || error.details
          ? `${error.error || 'Validation error'}: ${error.message || error.details.map((d: any) => d.message || d.path?.join('.')).join(', ')}`
          : error.error || 'Failed to save address'
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        })
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save address',
      })
    } finally {
      setSavingAddress(false)
    }
  }

  const handleSaveRecipient = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in first name and last name to save recipient',
      })
      return
    }

    setSavingRecipient(true)
    try {
      const response = await fetch(`${B}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          relationship: undefined,
          isDefault: recipients.length === 0, // Set as default if first recipient
        }),
      })

      if (response.ok) {
        const newRecipient = await response.json()
        setRecipients([...recipients, newRecipient])
        setSelectedRecipientId(newRecipient.id)
        setShipTo('recipient')
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Recipient saved successfully',
        })
      } else {
        const error = await response.json()
        const errorMessage = error.details
          ? `${error.error}: ${error.details.map((d: any) => d.message || d.path?.join('.')).join(', ')}`
          : error.error || 'Failed to save recipient'
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        })
      }
    } catch (error) {
      console.error('Error saving recipient:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save recipient',
      })
    } finally {
      setSavingRecipient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate shipping method
      if (!shippingMethod) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a shipping method',
        })
        setSubmitting(false)
        return
      }

      // Validate address if delivery is selected
      if (shippingMethod === 'DELIVERY') {
        if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.street?.trim() || !formData.city?.trim() || !formData.country?.trim()) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please fill in all required address fields for delivery',
          })
          setSubmitting(false)
          return
        }
      }

      let shippingAddress: any = null

      if (shippingMethod === 'DELIVERY') {
        shippingAddress = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        }
      } else if (shippingMethod === 'PICKUP' && shop) {
        // Use shop address for pickup
        shippingAddress = {
          firstName: userProfile?.name?.split(' ')[0] || formData.firstName,
          lastName: userProfile?.name?.split(' ').slice(1).join(' ') || formData.lastName,
          email: userProfile?.email || formData.email,
          phone: shop.phone || formData.phone,
          street: shop.address || '',
          city: shop.city || '',
          state: '',
          zipCode: '',
          country: shop.country || '',
          isPickup: true,
        }
      }

      // Create order first
      const orderResponse = await fetch(`${B}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.product?.id || item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
          shippingMethod,
          paymentMethod: formData.paymentMethod,
        }),
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to create order',
        })
        return
      }

      const order = await orderResponse.json()
      setOrderId(order.id)

      // If payment method is card, create Adyen payment session
      if (formData.paymentMethod === 'card') {
        const returnUrl = `${window.location.origin}/checkout?orderId=${order.id}`

        const paymentSessionResponse = await fetch(`${B}/payments/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            returnUrl,
          }),
        })

        if (!paymentSessionResponse.ok) {
          const error = await paymentSessionResponse.json()
          let errorMessage = error.error || 'Failed to create payment session'

          // Provide helpful message if Adyen is not configured
          if (errorMessage.includes('Adyen') || errorMessage.includes('not configured')) {
            errorMessage = 'Payment processing is not configured. Please contact support or use bank transfer.'
          }

          toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage,
          })
          return
        }

        const session = await paymentSessionResponse.json()
        setPaymentSession(session)
        setShowPayment(true)
      } else {
        // Bank transfer - order is already created with PENDING_PAYMENT status
        await refreshCart()
        toast({
          variant: 'success',
          title: 'Order Placed Successfully!',
          description: 'Your order has been placed. Please complete the bank transfer.',
        })
        router.push('/dashboard/orders?success=true')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create order. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentComplete = async (result: any) => {
    try {
      // Verify payment result with backend
      const response = await fetch(`${B}/payments/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      })

      const data = await response.json()

      if (data.success) {
        await refreshCart()
        toast({
          variant: 'success',
          title: 'Payment Successful!',
          description: 'Your order has been confirmed.',
        })
        router.push(`/dashboard/orders?success=true&orderId=${data.orderId}`)
      } else {
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: 'Please try again or contact support.',
        })
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to verify payment. Please contact support.',
      })
    }
  }

  const handlePaymentError = (error: Error) => {
    toast({
      variant: 'destructive',
      title: 'Payment Error',
      description: error.message || 'An error occurred during payment.',
    })
  }

  const total = cartItems.reduce((sum, item) => {
    return sum + (item.product.finalPrice * item.quantity)
  }, 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      <Link href="/cart" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Ship To Selector */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-amber-500" />
                Ship To
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Who is this order for?</label>
                <select
                  className="w-full h-11 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={shipTo}
                  onChange={(e) => handleShipToChange(e.target.value as 'myself' | 'recipient' | 'new-recipient')}
                >
                  <option value="myself">Myself</option>
                  {recipients.length > 0 && (
                    <option value="recipient">Saved Recipient</option>
                  )}
                  <option value="new-recipient">New Recipient</option>
                </select>
              </div>

              {shipTo === 'recipient' && recipients.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Recipient</label>
                  <select
                    className="w-full h-11 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    value={selectedRecipientId}
                    onChange={(e) => handleRecipientSelect(e.target.value)}
                  >
                    <option value="">Select a recipient...</option>
                    {recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.firstName} {recipient.lastName}
                        {recipient.relationship && ` (${recipient.relationship})`}
                        {recipient.isDefault && ' - Default'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {shipTo === 'new-recipient' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800 mb-2">Enter recipient details below. You can save this recipient for future orders.</p>
                  </div>

                  {/* Recipient Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient First Name *</label>
                      <Input
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Last Name *</label>
                      <Input
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="recipient@example.com (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Phone</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890 (optional)"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveRecipient}
                      disabled={savingRecipient || !formData.firstName || !formData.lastName}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingRecipient ? 'Saving...' : 'Save Recipient for Future Use'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Method Selection */}
          {shop ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  Shipping Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!shop.shippingMethods || shop.shippingMethods.length === 0 ? (
                  <p className="text-sm text-amber-600">No shipping methods configured. Please contact the shop.</p>
                ) : (
                  <div className="space-y-3">
                    {shop.shippingMethods.includes('PICKUP') && (
                    <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-amber-400">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="PICKUP"
                        checked={shippingMethod === 'PICKUP'}
                        onChange={(e) => setShippingMethod(e.target.value as 'PICKUP' | 'DELIVERY')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Pickup from Shop</div>
                        <p className="text-sm text-gray-600 mt-1">
                          {shop.address && (
                            <>
                              {shop.address}
                              {shop.city && `, ${shop.city}`}
                              {shop.country && `, ${shop.country}`}
                            </>
                          )}
                          {!shop.address && 'Pick up your order from the shop location'}
                        </p>
                        {shop.phone && (
                          <p className="text-xs text-gray-500 mt-1">Phone: {shop.phone}</p>
                        )}
                      </div>
                    </label>
                  )}
                  {shop.shippingMethods.includes('DELIVERY') && (
                    <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-amber-400">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="DELIVERY"
                        checked={shippingMethod === 'DELIVERY'}
                        onChange={(e) => setShippingMethod(e.target.value as 'PICKUP' | 'DELIVERY')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Delivery</div>
                        <p className="text-sm text-gray-600 mt-1">We'll deliver your order to your address</p>
                      </div>
                    </label>
                  )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : !loading && cartItems.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <p className="text-sm text-amber-600">Unable to load shop shipping methods. Please refresh the page.</p>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address - Only show for DELIVERY */}
          {shippingMethod === 'DELIVERY' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {/* Address Mode Selection */}
              {addresses.length > 0 && (
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="addressMode"
                      value="saved"
                      checked={addressMode === 'saved'}
                      onChange={() => handleAddressModeChange('saved')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Use Saved Address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="addressMode"
                      value="new"
                      checked={addressMode === 'new'}
                      onChange={() => handleAddressModeChange('new')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Create New Address</span>
                  </label>
                </div>
              )}

              {/* Saved Addresses Selection */}
              {addressMode === 'saved' && addresses.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Select Address</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => handleAddressSelect(address.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAddressId === address.id
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300 bg-white'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">
                                {address.firstName} {address.lastName}
                              </p>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{address.street}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}
                              {address.state && `, ${address.state}`}
                              {address.zipCode && ` ${address.zipCode}`}
                            </p>
                            <p className="text-sm text-gray-600">{address.country}</p>
                            {address.phone && (
                              <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                            )}
                          </div>
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddressId === address.id}
                            onChange={() => handleAddressSelect(address.id)}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/addresses"
                    className="inline-block text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Manage addresses →
                  </Link>
                </div>
              )}

              {/* New Address Form */}
              {addressMode === 'new' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">Enter a new shipping address</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                      <Input
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                      <Input
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address *</label>
                    <Input
                      required
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                      <Input
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                      <Input
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                      <Input
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Save Address Option */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAddress}
                      disabled={savingAddress}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingAddress ? 'Saving...' : 'Save Address for Future Use'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Show form fields when using saved address (for editing) - optional */}
              {addressMode === 'saved' && addresses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No saved addresses found.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddressModeChange('new')}
                  >
                    Create New Address
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Payment Method */}
          {!showPayment ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label key={method.provider} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.provider === 'ADYEN' || method.provider === 'STRIPE' ? 'card' : method.provider === 'COD' ? 'cod' : method.provider}
                          checked={
                            (method.provider === 'ADYEN' || method.provider === 'STRIPE')
                              ? formData.paymentMethod === 'card'
                              : formData.paymentMethod === (method.provider === 'COD' ? 'cod' : method.provider)
                          }
                          onChange={() => {
                            const value = method.provider === 'ADYEN' || method.provider === 'STRIPE' ? 'card' : method.provider === 'COD' ? 'cod' : method.provider;
                            setFormData({ ...formData, paymentMethod: value })
                          }}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-medium text-gray-900">
                          {method.displayName || method.provider}
                        </span>
                      </label>
                    ))}
                    {/* Fallback/Legacy option if no config or specific override needed */}
                    {/* <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={formData.paymentMethod === 'bank'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-medium text-gray-900">Bank Transfer</span>
                    </label> */}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No payment methods available. Please contact support.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : paymentSession ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Complete Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdyenPayment
                  sessionId={paymentSession.sessionId}
                  sessionData={paymentSession.sessionData}
                  clientKey={paymentSession.clientKey || ''}
                  onPaymentComplete={handlePaymentComplete}
                  onError={handlePaymentError}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      ${(item.product.finalPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-amber-600">${total.toFixed(2)}</span>
                </div>
              </div>
              
              {/* WhatsApp Order Button */}
              {shop && (shop.admin?.phone || shop.phone) && shippingMethod && (
                <Button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={handleWhatsAppOrder}
                  disabled={cartItems.length === 0 || submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Contact via WhatsApp
                    </span>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
