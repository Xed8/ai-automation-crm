'use client'

import { useState, useTransition } from 'react'
import { createWorkspace } from '@/app/actions/workspaces'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'

interface CreateWorkspaceFormProps {
  message?: string
  hasServiceRoleKey: boolean
}

export function CreateWorkspaceForm({ message, hasServiceRoleKey }: CreateWorkspaceFormProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({})
  const [serverError, setServerError] = useState<string | null>(message || null)

  const validateName = (value: string) => {
    if (!value.trim()) return 'Workspace name is required'
    if (value.length > 100) return 'Name must be 100 characters or less'
    if (!/^[a-zA-Z0-9\s\-'.]+$/.test(value)) return 'Name contains invalid characters'
    return null
  }

  const validateSlug = (value: string) => {
    if (!value.trim()) return 'Slug is required'
    if (value.length > 50) return 'Slug must be 50 characters or less'
    if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and hyphens'
    if (value.startsWith('-') || value.endsWith('-')) return 'Slug cannot start or end with hyphen'
    if (value.includes('--')) return 'Slug cannot have consecutive hyphens'
    return null
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    const nameError = validateName(name)
    const slugError = validateSlug(slug)

    if (nameError || slugError) {
      setErrors({ name: nameError || undefined, slug: slugError || undefined })
      return
    }

    setErrors({})

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createWorkspace(formData)
      } catch (error) {
        setServerError(error instanceof Error ? error.message : 'Failed to create workspace')
      }
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="surface-card">
        <CardHeader className="space-y-4">
          <span className="eyebrow w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            New workspace
          </span>
          <div>
            <CardTitle className="text-3xl">Create a focused CRM environment</CardTitle>
            <CardDescription className="mt-2 text-base">
              Give your team a dedicated space for leads, boards, forms, settings, and future automation rules.
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-1">
          <CardContent className="space-y-5">
            {serverError && (
              <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}
            {!hasServiceRoleKey && (
              <div className="rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                Runtime check: <strong>`SUPABASE_SERVICE_ROLE_KEY` is not loaded</strong>. Workspace creation will rely on
                database bootstrap RLS. If that SQL policy is not applied in Supabase, owner creation in
                `workspace_members` will fail.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Acme Growth Team"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                }}
                maxLength={100}
                required
                disabled={isPending}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {errors.name && <span className="text-destructive">{errors.name}</span>}
                <span className="ml-auto">{name.length}/100</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium text-foreground">Unique URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="acme-growth"
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
                value={slug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setSlug(value)
                  if (errors.slug) setErrors(prev => ({ ...prev, slug: undefined }))
                }}
                maxLength={50}
                required
                disabled={isPending}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {errors.slug && <span className="text-destructive">{errors.slug}</span>}
                <span className="ml-auto">{slug.length}/50</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This becomes your workspace URL: <span className="font-medium text-foreground">/w/{slug || 'acme-growth'}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
            <Button asChild variant="ghost" disabled={isPending}>
              <Link href="/workspaces">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create workspace'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-2xl">Before you launch</CardTitle>
          <CardDescription>
            A few naming choices make the workspace easier for your team to recognize and share.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Use the client or team name</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear naming keeps workspace switching fast when you manage several environments.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Pick a stable slug</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Slugs work best when they are short, lowercase, and easy to type in a hurry.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            After creation, you can head straight into leads, boards, forms, and settings from the redesigned shell.
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Runtime status: service-role key {hasServiceRoleKey ? 'detected' : 'missing'}.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
