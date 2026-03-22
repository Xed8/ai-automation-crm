'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      await supabase.auth.signOut()
      router.push('/login?message=' + encodeURIComponent('Password updated — please sign in.'))
    })
  }

  return (
    <Card className="surface-card mx-auto w-full max-w-lg border-white/70 bg-background/90">
      <CardHeader className="space-y-4">
        <span className="eyebrow w-fit">Password reset</span>
        <div className="space-y-2">
          <CardTitle className="text-3xl">Set a new password</CardTitle>
          <CardDescription className="text-base">
            Choose a strong password for your account.
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-1">
        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium text-foreground">Confirm new password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Updating…' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
