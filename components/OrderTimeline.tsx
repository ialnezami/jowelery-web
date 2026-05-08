'use client'

import { CheckCircle2, Circle, Clock, Package, Truck, Home, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderTimelineProps {
  status: string
  createdAt: string
  updatedAt?: string
}

const statusSteps = [
  { key: 'PENDING_PAYMENT', label: 'Payment Pending', icon: Clock, color: 'text-gray-500' },
  { key: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', icon: CheckCircle2, color: 'text-blue-500' },
  { key: 'PROCESSING', label: 'Processing', icon: Package, color: 'text-amber-500' },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'text-purple-500' },
  { key: 'DELIVERED', label: 'Delivered', icon: Home, color: 'text-green-500' },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
  { key: 'REFUNDED', label: 'Refunded', icon: XCircle, color: 'text-red-600' },
]

export function OrderTimeline({ status, createdAt, updatedAt }: OrderTimelineProps) {
  const currentStatusIndex = statusSteps.findIndex((step) => step.key === status)
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED'

  // Filter out cancelled/refunded from normal flow
  const activeSteps = isCancelled
    ? statusSteps.filter((s) => s.key === status)
    : statusSteps.filter((s) => !['CANCELLED', 'REFUNDED'].includes(s.key))

  const getStepIndex = (stepKey: string) => {
    return activeSteps.findIndex((s) => s.key === stepKey)
  }

  return (
    <div className="relative">
      <div className="space-y-4">
        {activeSteps.map((step, index) => {
          const stepIndex = getStepIndex(step.key)
          const isActive = stepIndex <= currentStatusIndex
          const isCurrent = step.key === status
          const Icon = step.icon

          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isActive
                      ? isCurrent
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-400')} />
                </div>
                {index < activeSteps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-12 mt-2',
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
              <div className="flex-1 pt-2">
                <div
                  className={cn(
                    'font-semibold mb-1',
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </div>
                {isCurrent && (
                  <div className="text-sm text-gray-500">
                    {updatedAt
                      ? `Updated: ${new Date(updatedAt).toLocaleString()}`
                      : `Created: ${new Date(createdAt).toLocaleString()}`}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
