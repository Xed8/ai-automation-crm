'use client'

import { Check, Copy } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  value: string
  label: string
  size?: 'sm' | 'default'
}

export function CopyButton({ value, label, size = 'sm' }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [, startTransition] = useTransition()

  const handleCopy = () => {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(value)
        setIsCopied(true)
        toast.success(`${label} copied.`)
        window.setTimeout(() => setIsCopied(false), 1800)
      } catch {
        toast.error(`Could not copy ${label.toLowerCase()}.`)
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className="shrink-0"
      onClick={handleCopy}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {isCopied ? 'Copied' : 'Copy'}
    </Button>
  )
}
