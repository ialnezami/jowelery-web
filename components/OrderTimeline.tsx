'use client'

import { CheckCircle2, Clock, Package, Truck, Home, XCircle, MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderTimelineProps {
  status: string
  createdAt: string
  updatedAt?: string
}

// Full ordered status progression — keep CANCELLED/REFUNDED separate (terminal)
const FLOW_STEPS = [
  { key: 'PENDING_PAYMENT',   label: 'Payment Pending',    icon: Clock },
  { key: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed',  icon: CheckCircle2 },
  { key: 'PROCESSING',        label: 'Processing',         icon: Package },
  { key: 'READY_FOR_PICKUP',  label: 'Ready for Pickup',   icon: MapPin },
  { key: 'SHIPPED',           label: 'Shipped',            icon: Truck },
  { key: 'OUT_FOR_DELIVERY',  label: 'Out for Delivery',   icon: Navigation },
  { key: 'DELIVERED',         label: 'Delivered',          icon: Home },
  { key: 'COMPLETED',         label: 'Completed',          icon: CheckCircle2 },
]

const TERMINAL_NEGATIVE = new Set(['CANCELLED', 'REFUNDED'])

export function OrderTimeline({ status, createdAt, updatedAt }: OrderTimelineProps) {
  const isCancelled = TERMINAL_NEGATIVE.has(status)

  // For cancelled/refunded, the caller should render the red banner instead.
  // If this component is still rendered for those statuses, return null gracefully.
  if (isCancelled) return null

  const currentIdx = FLOW_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="relative">
      <div className="space-y-2">
        {FLOW_STEPS.map((step, index) => {
          const done    = index < currentIdx
          const active  = index === currentIdx
          const Icon    = step.icon
          const isLast  = index === FLOW_STEPS.length - 1

          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Left column: dot + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
                    done
                      ? 'bg-green-500 border-green-500 text-white'
                      : active
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white border-gray-200 text-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 h-8 mt-1',
                      done ? 'bg-green-400' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>

              {/* Right column: label + timestamp for current */}
              <div className="flex-1 pb-1 pt-1.5">
                <p
                  className={cn(
                    'text-sm font-semibold leading-tight',
                    done || active ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {updatedAt
                      ? `Updated: ${new Date(updatedAt).toLocaleString()}`
                      : `Since: ${new Date(createdAt).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
