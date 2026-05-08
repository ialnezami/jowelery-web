'use client'

import { useEffect, useRef, useState } from 'react'

interface AdyenPaymentProps {
  sessionId: string
  sessionData: string
  clientKey: string
  onPaymentComplete: (result: any) => void
  onError: (error: Error) => void
}

export function AdyenPayment({
  sessionId,
  sessionData,
  clientKey,
  onPaymentComplete,
  onError,
}: AdyenPaymentProps) {
  const [isLoading, setIsLoading] = useState(true)
  const adyenRef = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    let link: HTMLLinkElement | null = null
    let script: HTMLScriptElement | null = null

    const initializeAdyen = async () => {
      try {
        // Load Adyen CSS dynamically
        link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = `https://checkoutshopper-${
          process.env.NEXT_PUBLIC_ADYEN_ENVIRONMENT === 'LIVE' ? 'live' : 'test'
        }.adyen.com/checkoutshopper/sdk/5.x.x/adyen.css`
        document.head.appendChild(link)

        // Dynamically load Adyen script
        script = document.createElement('script')
        script.src = `https://checkoutshopper-${
          process.env.NEXT_PUBLIC_ADYEN_ENVIRONMENT === 'LIVE' ? 'live' : 'test'
        }.adyen.com/checkoutshopper/sdk/5.x.x/adyen.js`
        script.async = true

        script.onload = () => {
          if (!mounted || !adyenRef.current || !(window as any).AdyenCheckout) return

          const checkout = (window as any).AdyenCheckout({
            clientKey,
            environment: process.env.NEXT_PUBLIC_ADYEN_ENVIRONMENT === 'LIVE' ? 'live' : 'test',
            session: {
              id: sessionId,
              sessionData,
            },
            onPaymentCompleted: (result: any, component: any) => {
              onPaymentComplete(result)
            },
            onError: (error: any, component: any) => {
              console.error('Adyen payment error:', error)
              onError(new Error(error.message || 'Payment failed'))
            },
            onActionRequired: () => {
              setIsLoading(false)
            },
          })

          checkoutRef.current = checkout.create('dropin').mount(adyenRef.current)
          setIsLoading(false)
        }

        script.onerror = () => {
          if (mounted) {
            onError(new Error('Failed to load Adyen SDK'))
          }
        }

        document.body.appendChild(script)
      } catch (error: any) {
        console.error('Error initializing Adyen:', error)
        if (mounted) {
          onError(error)
        }
      }
    }

    initializeAdyen()

    return () => {
      mounted = false
      if (checkoutRef.current) {
        try {
          checkoutRef.current.unmount()
        } catch (e) {
          // Ignore unmount errors
        }
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
      if (link && link.parentNode) {
        link.parentNode.removeChild(link)
      }
    }
  }, [sessionId, sessionData, clientKey, onPaymentComplete, onError])

  return (
    <div className="adyen-payment-container">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={adyenRef} className="adyen-dropin" />
    </div>
  )
}
