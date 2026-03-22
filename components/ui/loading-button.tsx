'use client'

import * as React from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'

interface LoadingButtonProps extends ButtonProps {
  loadingText?: string
}

/**
 * Drop-in replacement for Button inside a <form>.
 * Reads useFormStatus() to auto-disable and show a spinner while the form
 * submission is in flight. Works with both Server Actions and client handlers.
 *
 * For onClick-driven (non-form) usage, pass `pending` and `loadingText` manually
 * via the `aria-busy` prop pattern — or use Button + useTransition directly.
 */
export function LoadingButton({
  children,
  loadingText,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const { pending } = useFormStatus()
  const isDisabled = disabled || pending

  return (
    <Button disabled={isDisabled} className={className} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
