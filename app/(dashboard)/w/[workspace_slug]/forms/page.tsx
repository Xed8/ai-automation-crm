export const revalidate = 60

import Link from 'next/link'
import { headers } from 'next/headers'
import { ArrowUpRight, FileInput, Globe, ServerCog, Shield, TriangleAlert } from 'lucide-react'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { CopyButton } from '@/components/shared/copy-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateForm } from '@/components/forms/create-form'

function getBaseUrlFromHeaders(host: string | null, forwardedProto: string | null) {
  if (!host) {
    return 'http://localhost:3000'
  }

  const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

function getPayloadSnippet(formId: string) {
  return JSON.stringify(
    {
      formId,
      firmName: 'Acme Growth',
      contactName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1 555 123 4567',
      message: 'Need help with CRM setup.',
    },
    null,
    2
  )
}

function getServerFetchSnippet(apiUrl: string, formId: string) {
  return `await fetch('${apiUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_WEBHOOK_SECRET',
  },
  body: JSON.stringify({
    formId: '${formId}',
    firmName: 'Acme Growth',
    contactName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 555 123 4567',
    message: 'Need help with CRM setup.',
  }),
})`
}

function getCurlSnippet(apiUrl: string, formId: string) {
  return `curl -X POST '${apiUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_WEBHOOK_SECRET' \\
  -d '{
    "formId": "${formId}",
    "firmName": "Acme Growth",
    "contactName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555 123 4567",
    "message": "Need help with CRM setup."
  }'`
}

function getEmbedSnippet(hostedFormUrl: string) {
  return `<iframe
  src="${hostedFormUrl}"
  title="Lead form"
  width="100%"
  height="680"
  style="border:0;border-radius:24px;"
  loading="lazy"
></iframe>`
}

export default async function FormsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>;
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const { workspace_slug } = await params
  const { message, status } = await searchParams
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()
  const headerStore = await headers()
  const baseUrl = getBaseUrlFromHeaders(
    headerStore.get('x-forwarded-host') ?? headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
  const apiUrl = `${baseUrl}/api/webhooks/intake`

  const { data: forms, error } = await supabase
    .from('lead_forms')
    .select(`
      *,
      boards(name),
      stages(name)
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const [{ data: boards }, { data: stages }] = await Promise.all([
    supabase
      .from('boards')
      .select('id, name')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('stages')
      .select('id, name, board_id, order')
      .eq('workspace_id', workspace.id)
      .order('order', { ascending: true }),
  ])

  if (error) {
    return <div className="p-6 text-destructive">Failed to load forms</div>
  }

  const activeCount = forms?.filter((form) => form.is_active).length ?? 0
  const boardOptions = boards ?? []
  const stageOptions = stages ?? []
  const canCreateForm = boardOptions.length > 0 && stageOptions.length > 0
  const defaultBoardId = boardOptions[0]?.id ?? ''
  const defaultStageId = stageOptions.find((stage) => stage.board_id === defaultBoardId)?.id ?? stageOptions[0]?.id ?? ''
  const messageClassName =
    status === 'success'
      ? 'rounded-[1.25rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200'
      : 'rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Public intake</span>
            <div>
              <h2 className="text-4xl font-semibold sm:text-5xl">Connect forms to any website.</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Use the hosted form for a quick browser-safe setup, or use the API from your website backend to send leads into {workspace.name}.
              </p>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
            {canCreateForm ? 'Create a form below to unlock hosted and Google Forms integrations.' : 'You need at least one board and stage before a form can be created.'}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Forms</span>
              <FileInput className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{forms?.length ?? 0}</div>
          </div>
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active</span>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{activeCount}</div>
          </div>
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">API endpoint</div>
            <div className="mt-3 truncate text-sm font-semibold text-foreground">{apiUrl}</div>
          </div>
        </div>
      </section>

      {message ? <div className={messageClassName}>{message}</div> : null}

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Create intake form</CardTitle>
          <CardDescription>
            This creates the form ID and secret used by hosted forms, API intake, and the Google Forms script.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canCreateForm ? (
            <CreateForm
              workspaceSlug={workspace_slug}
              defaultBoardId={defaultBoardId}
              defaultStageId={defaultStageId}
              boards={boardOptions}
              stages={stageOptions}
            />
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
              Create at least one board and one stage first. After that, you can create an intake form here and the Google Forms script will appear in settings.
            </div>
          )}
        </CardContent>
      </Card>

      {(!forms || forms.length === 0) ? (
        <Card className="surface-card p-8 text-center">
          <CardHeader>
            <CardTitle className="text-3xl">No forms found</CardTitle>
            <CardDescription className="text-base">
              {canCreateForm
                ? 'Create an intake form above to start accepting leads externally.'
                : 'Create a board and at least one stage first, then return here to create the intake form.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            {canCreateForm ? null : (
              <Button asChild variant="outline">
                <Link href={`/w/${workspace_slug}/boards`}>Open boards setup</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => {
            const hostedFormUrl = `${baseUrl}/f/${form.id}`
            const payloadSnippet = getPayloadSnippet(form.id)
            const fetchSnippet = getServerFetchSnippet(apiUrl, form.id)
            const curlSnippet = getCurlSnippet(apiUrl, form.id)
            const embedSnippet = getEmbedSnippet(hostedFormUrl)
            const boardRelation = form.boards as { name: string }[] | { name: string } | null
            const stageRelation = form.stages as { name: string }[] | { name: string } | null
            const boardName = Array.isArray(boardRelation) ? boardRelation[0]?.name : boardRelation?.name
            const stageName = Array.isArray(stageRelation) ? stageRelation[0]?.name : stageRelation?.name

            return (
              <Card key={form.id} className="surface-card">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        {form.name}
                        {!form.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Routes to: <strong>{boardName || 'No board'}</strong> {'->'}{' '}
                        <strong>{stageName || 'No stage'}</strong>
                      </CardDescription>
                    </div>

                    <div className="rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-200 xl:max-w-md">
                      <div className="flex items-center gap-2 font-semibold">
                        <TriangleAlert className="h-4 w-4" />
                        Important
                      </div>
                      <p className="mt-2">
                        Use the hosted form on browser-only websites. The webhook secret should only be used from your own backend or serverless function.
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Hosted Form URL</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="min-w-0 flex-1 rounded-[1rem] bg-secondary/70 p-3 text-xs truncate">
                          {hostedFormUrl}
                        </code>
                        <CopyButton value={hostedFormUrl} label="Form URL" />
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link href={hostedFormUrl} target="_blank">
                            <ArrowUpRight className="h-4 w-4" />
                            Open
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        Webhook secret
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Server only
                        </Badge>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="min-w-0 flex-1 rounded-[1rem] bg-secondary/70 p-3 text-xs truncate select-all">
                          {form.webhook_secret}
                        </code>
                        <CopyButton value={form.webhook_secret} label="Webhook secret" />
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="hosted" className="space-y-3">
                    <TabsList>
                      <TabsTrigger value="hosted">
                        <Globe className="mr-2 h-4 w-4" />
                        Hosted form
                      </TabsTrigger>
                      <TabsTrigger value="api">
                        <ServerCog className="mr-2 h-4 w-4" />
                        API
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="hosted" className="space-y-4">
                      <div className="rounded-[1.35rem] bg-secondary/70 px-4 py-4 text-sm text-muted-foreground">
                        Best if you want to connect quickly without exposing secrets. You can link to this form or embed it in an iframe.
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Embed snippet</div>
                        <pre className="overflow-x-auto rounded-[1rem] bg-background/80 p-4 text-xs text-foreground">
                          <code>{embedSnippet}</code>
                        </pre>
                        <div className="flex justify-end">
                          <CopyButton value={embedSnippet} label="Embed snippet" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="api" className="space-y-4">
                      <div className="rounded-[1.35rem] border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-muted-foreground">
                        Use this if your website already has its own backend, API route, or serverless function. A successful request returns <strong>201</strong> and creates a lead in the CRM.
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Endpoint</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="min-w-0 flex-1 rounded-[1rem] bg-secondary/70 p-3 text-xs truncate">
                            POST {apiUrl}
                          </code>
                          <CopyButton value={apiUrl} label="API URL" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Payload</div>
                        <pre className="overflow-x-auto rounded-[1rem] bg-background/80 p-4 text-xs text-foreground">
                          <code>{payloadSnippet}</code>
                        </pre>
                        <div className="flex justify-end">
                          <CopyButton value={payloadSnippet} label="Payload" />
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Server fetch example</div>
                          <pre className="overflow-x-auto rounded-[1rem] bg-background/80 p-4 text-xs text-foreground">
                            <code>{fetchSnippet}</code>
                          </pre>
                          <div className="flex justify-end">
                            <CopyButton value={fetchSnippet} label="Fetch example" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Test with curl</div>
                          <pre className="overflow-x-auto rounded-[1rem] bg-background/80 p-4 text-xs text-foreground">
                            <code>{curlSnippet}</code>
                          </pre>
                          <div className="flex justify-end">
                            <CopyButton value={curlSnippet} label="cURL example" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
