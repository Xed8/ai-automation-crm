'use client'

import { useTransition, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createStage } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_NAME_LENGTH = 50

export function AddStageForm({ workspaceSlug, boardId }: { workspaceSlug: string; boardId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Stage name is required')
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Stage name must be ${MAX_NAME_LENGTH} characters or less`)
      return
    }
    if (isPending) return
    setError('')

    const fd = new FormData()
    fd.append('name', trimmed)
    startTransition(async () => {
      const result = await createStage(workspaceSlug, boardId, fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Stage created.')
        setName('')
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="name">Stage name <span className="text-destructive">*</span></Label>
        <Input 
          id="name" 
          name="name" 
          placeholder="New inquiry" 
          required 
          disabled={isPending}
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          className={error ? 'border-destructive' : ''}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full justify-between xl:w-auto" disabled={isPending || !name.trim()}>
          {isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
            : <>Add stage <Plus className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  )
}
