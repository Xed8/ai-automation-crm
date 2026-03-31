'use client'

import { useTransition, useRef } from 'react'
import { toast } from 'sonner'
import { inviteTeamMember } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function TeamInviteForm({ workspaceSlug }: { workspaceSlug: string }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await inviteTeamMember(workspaceSlug, fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Invite sent.')
        formRef.current?.reset()
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-4 sm:grid-cols-[1fr_auto_auto]"
    >
      <div className="space-y-1.5">
        <Label htmlFor="invite-email" className="text-xs">Email address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="colleague@agency.com"
          required
          maxLength={254}
          className="h-9 text-sm"
          disabled={isPending}
        />
      </div>
      <div className="flex items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <select
            name="role"
            defaultValue="member"
            disabled={isPending}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" className="h-9 w-full" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Sending…</> : 'Send invite'}
        </Button>
      </div>
    </form>
  )
}
