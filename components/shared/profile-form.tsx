'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileFormProps {
  workspaceSlug: string
  initialFullName: string
  initialEmail: string
  initialAvatarUrl: string | null
  userId: string
}

export function ProfileForm({
  workspaceSlug,
  initialFullName,
  initialEmail,
  initialAvatarUrl,
  userId,
}: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be under 2 MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.')
      return
    }

    setUploadError(null)
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) {
      setUploadError(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // Bust the browser cache by appending a timestamp
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Inject the uploaded avatar URL (not the file itself — that's already in Storage)
    if (avatarUrl) formData.set('avatar_url', avatarUrl.split('?')[0]) // strip cache-bust param
    startTransition(() => updateProfile(workspaceSlug, formData))
  }

  return (
    <Card className="surface-card max-w-xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your display name, email address, and avatar.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Upload avatar"
              disabled={uploading}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <UserCircle2 className="h-10 w-10 text-muted-foreground m-auto" />
              )}
            </button>
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Change avatar'}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 2 MB.</p>
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={initialFullName}
              required
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialEmail}
              required
              placeholder="you@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Changing your email will send a confirmation link to the new address.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending || uploading}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
