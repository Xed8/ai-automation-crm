export const revalidate = 60

import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { submitPublicForm } from '@/app/actions/forms'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ form_id: string }>;
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const { form_id } = await params
  const { message, status } = await searchParams

  // Fetch form + workspace name for branding
  const supabase = await createPrivilegedServerClient()
  const { data: form } = await supabase
    .from('lead_forms')
    .select('name, is_active, workspaces(name)')
    .eq('id', form_id)
    .single()

  if (!form || !form.is_active) {
    notFound()
  }

  const formTitle = form.name ?? 'Contact Us'
  const workspaceName = (form.workspaces as { name?: string } | null)?.name ?? null

  const messageClassName =
    status === 'success'
      ? 'rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700'
      : 'rounded-md bg-destructive/10 p-3 text-sm text-destructive'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{formTitle}</CardTitle>
          <CardDescription>
            {workspaceName
              ? `Fill out the form below and ${workspaceName} will be in touch shortly.`
              : 'Please fill out the form below and we will get back to you shortly.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && <div className={messageClassName}>{message}</div>}
          <form className="space-y-4" action={async (formData) => {
            'use server'
            const result = await submitPublicForm(form_id, formData)
            const nextStatus = result.error ? 'error' : 'success'
            const nextMessage = encodeURIComponent(
              result.error || 'Thanks, your request has been submitted.',
            )
            redirect(`/f/${form_id}?status=${nextStatus}&message=${nextMessage}`)
          }}>
            <div className="space-y-2">
              <Label htmlFor="firmName">Company / Firm Name *</Label>
              <Input id="firmName" name="firmName" required placeholder="Acme Corp" maxLength={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Your Name</Label>
              <Input id="contactName" name="contactName" placeholder="John Doe" maxLength={100} />
            </div>

            <div className="gap-4 grid grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" maxLength={254} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" maxLength={20} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message / Scope of Work</Label>
              <Textarea id="message" name="message" placeholder="How can we help?" rows={4} maxLength={5000} />
            </div>

            <Button type="submit" className="w-full">Submit Request</Button>
          </form>
        </CardContent>
      </Card>

      {/* Powered by attribution — acquisition loop */}
      <p className="mt-4 text-xs text-muted-foreground">
        Powered by{' '}
        <Link
          href={`/register?ref=form-footer&utm_source=hosted-form&utm_medium=footer&utm_campaign=powered-by`}
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          LeadFlow CRM
        </Link>
      </p>
    </div>
  )
}
