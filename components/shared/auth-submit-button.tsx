'use client'

import { LoadingButton } from '@/components/ui/loading-button'

export function AuthSubmitButton({ label, loadingText }: { label: string; loadingText: string }) {
  return (
    <LoadingButton type="submit" className="w-full" loadingText={loadingText}>
      {label}
    </LoadingButton>
  )
}
