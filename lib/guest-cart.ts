'use client'

// Guest cart utilities for localStorage
const GUEST_CART_KEY = 'guest_cart'

export interface GuestCartItem {
  productId: string
  quantity: number
}

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const cart = localStorage.getItem(GUEST_CART_KEY)
    return cart ? JSON.parse(cart) : []
  } catch (error) {
    console.error('Error reading guest cart:', error)
    return []
  }
}

export function setGuestCart(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Error saving guest cart:', error)
  }
}

export function addToGuestCart(productId: string, quantity: number = 1): GuestCartItem[] {
  const cart = getGuestCart()
  const existingItemIndex = cart.findIndex(item => item.productId === productId)

  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity
  } else {
    cart.push({ productId, quantity })
  }

  setGuestCart(cart)
  return cart
}

export function updateGuestCartItem(productId: string, quantity: number): GuestCartItem[] {
  const cart = getGuestCart()
  const existingItemIndex = cart.findIndex(item => item.productId === productId)

  if (existingItemIndex >= 0) {
    if (quantity <= 0) {
      cart.splice(existingItemIndex, 1)
    } else {
      cart[existingItemIndex].quantity = quantity
    }
  }

  setGuestCart(cart)
  return cart
}

export function removeFromGuestCart(productId: string): GuestCartItem[] {
  const cart = getGuestCart()
  const filteredCart = cart.filter(item => item.productId !== productId)
  setGuestCart(filteredCart)
  return filteredCart
}

export function clearGuestCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_CART_KEY)
}

export function getGuestCartCount(): number {
  const cart = getGuestCart()
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
