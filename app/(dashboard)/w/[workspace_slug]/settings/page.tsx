export const revalidate = 60

import Link from 'next/link'
import { headers } from 'next/headers'
import {
  ArrowUpRight,
  BadgeCheck,
  ExternalLink,
  RadioTower,
  Shield,
  TriangleAlert,
  Webhook,
} from 'lucide-react'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CopyButton } from '@/components/shared/copy-button'
import { DeleteWorkspaceButton } from '@/components/shared/delete-workspace-button'
import { PLAN_LIMITS } from '@/lib/billing/quotas'
import { UpgradeButton, DowngradeButton } from '@/components/settings/billing-buttons'
import { CreateWebhookForm, DeleteWebhookButton, SendTestLeadButton } from '@/components/settings/webhook-forms'

function getBaseUrlFromHeaders(host: string | null, forwardedProto: string | null) {
  if (!host) {
    return 'http://localhost:3000'
  }

  const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

function getGoogleFormsScript(apiUrl: string, formId: string, webhookSecret: string) {
  return `function onFormSubmit(e) {
  if (!e) return; // Skips manual runs from the editor

  var answers = {};

  // Spreadsheet-linked trigger provides e.namedValues
  if (e.namedValues) {
    answers = e.namedValues;
  } else if (e.response) {
    // Direct form trigger provides e.response
    var itemResponses = e.response.getItemResponses();
    for (var i = 0; i < itemResponses.length; i++) {
      var item = itemResponses[i];
      answers[item.getItem().getTitle()] = [item.getResponse()];
    }
  }

  var payload = {
    formId: '${formId}',
    firmName:
      answer(answers, 'Company / Firm Name') ||
      answer(answers, 'Company Name') ||
      'Google Form Submission',
    contactName:
      answer(answers, 'Your Name') ||
      answer(answers, 'Name'),
    email:
      answer(answers, 'Email Address') ||
      answer(answers, 'Email'),
    phone:
      answer(answers, 'Phone Number') ||
      answer(answers, 'Phone'),
    message:
      answer(answers, 'Message / Scope of Work') ||
      answer(answers, 'Message') ||
      answer(answers, 'Notes'),
  };

  var response = UrlFetchApp.fetch('${apiUrl}', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ${webhookSecret}',
      'bypass-tunnel-reminder': 'true',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  Logger.log(response.getResponseCode());
  Logger.log(response.getContentText());
}

function answer(answers, key) {
  var value = answers[key];
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
}

// Lead capture powered by LeadFlow — https://leadflow.app`
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>;
  searchParams: Promise<{ tab?: string; message?: string; status?: string }>;
}) {
  const { workspace_slug } = await params
  const { tab, message, status } = await searchParams
  const { workspace, role } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()
  const headerStore = await headers()
  const baseUrl = getBaseUrlFromHeaders(
    headerStore.get('x-forwarded-host') ?? headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )

  if (role === 'member') {
    return <div className="p-6 text-destructive">Unauthorized: Must be an admin to view settings.</div>
  }

  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  const [{ data: sub }, { data: usageData }, { data: forms }, { data: outboundWebhooks }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', workspace.id)
      .single(),
    supabase
      .from('usage_metrics')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('billing_cycle_start', currentMonthStart.toISOString())
      .single(),
    supabase
      .from('lead_forms')
      .select(`
        id,
        name,
        webhook_secret,
        is_active,
        boards(name),
        stages(name)
      `)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('outbound_webhooks')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false }),
  ])

  const tier = (sub?.tier as keyof typeof PLAN_LIMITS) || 'free'
  const limits = PLAN_LIMITS[tier]

  const leadsUsed = usageData?.leads_created || 0
  const aiUsed = usageData?.ai_tokens_used || 0

  const leadsPct = Math.min(100, Math.round((leadsUsed / limits.max_leads_per_month) * 100))
  const aiPct = Math.min(100, Math.round((aiUsed / limits.max_ai_tokens_per_month) * 100))
  const activeTab = tab === 'integrations' ? 'integrations' : 'billing'
  const activeForms = forms?.filter((form) => form.is_active).length ?? 0
  const apiUrl = `${baseUrl}/api/webhooks/intake`
  const messageClassName =
    status === 'success'
      ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200'
      : 'rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'

  return (
    <div className="space-y-6">
      <section className="surface-panel px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1.5">
            <span className="eyebrow">Settings</span>
            <h1 className="text-2xl font-semibold">Workspace settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your plan, monitor quotas, and connect {workspace.name} to external systems.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{tier} plan</Badge>
            <Badge variant="outline" className="capitalize">{role}</Badge>
          </div>
        </div>
      </section>

      {message ? <div className={messageClassName}>{message}</div> : null}

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="billing">Billing & Quotas</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="general" disabled>General</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="surface-card">
              <CardHeader>
                <CardTitle>Current plan</CardTitle>
                <CardDescription>
                  You are currently on the {tier} plan. Upgrade to unlock more headroom for agency growth.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="divide-y divide-border rounded-lg border border-border">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Workspaces</span>
                    <span className="font-semibold">
                      {limits.max_workspaces === 999999 ? 'Unlimited' : `Up to ${limits.max_workspaces}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Lead capacity</span>
                    <span className="font-semibold">
                      {limits.max_leads_per_month === 999999 ? 'Unlimited' : limits.max_leads_per_month + ' / mo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">AI token allowance</span>
                    <span className="font-semibold">
                      {limits.max_ai_tokens_per_month === 9999999
                        ? 'Unlimited'
                        : limits.max_ai_tokens_per_month.toLocaleString() + ' / mo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader>
                <CardTitle>Usage snapshot</CardTitle>
                <CardDescription>
                  See how close this workspace is to its current monthly thresholds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Leads created</span>
                    <span>
                      {leadsUsed} / {limits.max_leads_per_month === 999999 ? 'Unlimited' : limits.max_leads_per_month}
                    </span>
                  </div>
                  {limits.max_leads_per_month !== 999999 && (
                    <Progress value={leadsPct} className={leadsPct > 90 ? 'bg-destructive/20' : ''} />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>AI tokens used</span>
                    <span>
                      {aiUsed} / {limits.max_ai_tokens_per_month === 9999999
                        ? 'Unlimited'
                        : limits.max_ai_tokens_per_month.toLocaleString()}
                    </span>
                  </div>
                  {limits.max_ai_tokens_per_month !== 9999999 && (
                    <Progress value={aiPct} className={aiPct > 90 ? 'bg-destructive/20' : ''} />
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-3">
                {tier === 'free' ? (
                  <UpgradeButton workspaceSlug={workspace_slug} />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <p className="w-full text-sm text-muted-foreground">
                      You are on the <span className="font-medium capitalize text-foreground">{tier}</span> plan.
                    </p>
                    <DowngradeButton workspaceSlug={workspace_slug} />
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="surface-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RadioTower className="h-5 w-5 text-primary" />
                  <CardTitle>Website intake connection</CardTitle>
                </div>
                <CardDescription>
                  Copy the endpoint and secret you need to connect external websites and forms to this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
                    <div className="eyebrow">Forms</div>
                    <div className="mt-2 text-2xl font-semibold">{forms?.length ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
                    <div className="eyebrow">Active</div>
                    <div className="mt-2 text-2xl font-semibold">{activeForms}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
                    <div className="eyebrow">Endpoint</div>
                    <div className="mt-2 truncate text-sm font-semibold">{apiUrl}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-xs truncate font-mono">
                    {apiUrl}
                  </code>
                  <CopyButton value={apiUrl} label="API URL" />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/w/${workspace_slug}/forms`}>
                      Open forms page
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card border-amber-500/30 bg-amber-500/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-5 w-5 text-amber-500" />
                  <CardTitle>Important</CardTitle>
                </div>
                <CardDescription className="text-foreground/80">
                  Keep secrets on the server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-foreground/80">
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm">
                  Use hosted forms on browser-only sites.
                </div>
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm">
                  Use the webhook secret only from your own backend or serverless function.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>Google Forms quick setup</CardTitle>
              <CardDescription>
                Use Google Apps Script to forward Google Form submissions into this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
                <div className="eyebrow">Step 1</div>
                <div className="mt-2 font-semibold">Open the Google Form</div>
                <p className="mt-1.5 text-muted-foreground">Go to Extensions → Apps Script.</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
                <div className="eyebrow">Step 2</div>
                <div className="mt-2 font-semibold">Copy a script below</div>
                <p className="mt-1.5 text-muted-foreground">Each form card includes a ready-to-paste script with the right form ID and secret.</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
                <div className="eyebrow">Step 3</div>
                <div className="mt-2 font-semibold">Add the trigger</div>
                <p className="mt-1.5 text-muted-foreground">Create an installable trigger for onFormSubmit.</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
                <div className="eyebrow">Step 4</div>
                <div className="mt-2 font-semibold">Submit one test entry</div>
                <p className="mt-1.5 text-muted-foreground">Do not click Run in Apps Script. Submit the Google Form itself to test.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>Inbound form secrets</CardTitle>
              <CardDescription>
                Each form has its own hosted URL and webhook secret. Copy what you need for the website you are connecting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!forms || forms.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  <div>No intake forms found yet.</div>
                  <div className="mt-2">Create one on the Forms page first, then the Google Forms script will appear here automatically.</div>
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/w/${workspace_slug}/forms`}>
                        Open forms page
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {forms.map((form) => {
                    const hostedFormUrl = `${baseUrl}/f/${form.id}`
                    const googleFormsScript = getGoogleFormsScript(apiUrl, form.id, form.webhook_secret)
                    const boardRelation = form.boards as { name: string }[] | { name: string } | null
                    const stageRelation = form.stages as { name: string }[] | { name: string } | null
                    const boardName = Array.isArray(boardRelation) ? boardRelation[0]?.name : boardRelation?.name
                    const stageName = Array.isArray(stageRelation) ? stageRelation[0]?.name : stageRelation?.name

                    return (
                      <div key={form.id} className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-semibold text-foreground">{form.name}</div>
                              {form.is_active ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Routes to {boardName || 'No board'} {'->'} {stageName || 'No stage'}
                            </div>
                          </div>

                          <Button asChild variant="outline" size="sm">
                            <Link href={hostedFormUrl} target="_blank">
                              Open hosted form
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-3">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Hosted form URL</div>
                            <div className="flex items-center gap-2">
                              <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-xs truncate font-mono">
                                {hostedFormUrl}
                              </code>
                              <CopyButton value={hostedFormUrl} label="Form URL" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">Webhook endpoint</div>
                            <div className="flex items-center gap-2">
                              <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-xs truncate font-mono">
                                {apiUrl}
                              </code>
                              <CopyButton value={apiUrl} label="API URL" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Shield className="h-4 w-4 text-primary" />
                              Webhook secret
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-xs truncate font-mono">
                                {form.webhook_secret}
                              </code>
                              <CopyButton value={form.webhook_secret} label="Webhook secret" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <SendTestLeadButton
                            workspaceSlug={workspace_slug}
                            formId={form.id}
                            baseUrl={baseUrl}
                          />
                        </div>

                        <div className="mt-4 rounded-lg border border-border bg-muted/30">
                          <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground">Google Forms Apps Script</div>
                              <div className="text-sm text-muted-foreground">
                                Paste this into Google Apps Script and attach an `onFormSubmit` trigger.
                              </div>
                            </div>
                            <CopyButton value={googleFormsScript} label="Google Forms script" />
                          </div>

                          <div className="space-y-3 px-4 py-4">
                            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-200">
                              Edit the question titles in the script if your Google Form uses different labels.
                            </div>
                            <pre className="max-h-[360px] overflow-auto rounded-md bg-muted p-4 text-xs text-foreground">
                              <code>{googleFormsScript}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
            <Card className="surface-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  <CardTitle>Add outbound webhook</CardTitle>
                </div>
                <CardDescription>
                  Save an external endpoint for future webhook delivery from this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateWebhookForm workspaceSlug={workspace_slug} />
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader>
                <CardTitle>Saved outbound webhooks</CardTitle>
                <CardDescription>
                  Store the endpoints here now. Delivery wiring is not active yet, so this is configuration-only for the moment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!outboundWebhooks || outboundWebhooks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    No outbound webhooks configured.
                  </div>
                ) : (
                  outboundWebhooks.map((webhook) => (
                    <div key={webhook.id} className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold text-foreground">{webhook.event_type}</div>
                            {webhook.is_active ? (
                              <Badge variant="outline" className="bg-primary/10 text-primary">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">Endpoint destination</div>
                        </div>

                        <DeleteWebhookButton workspaceSlug={workspace_slug} webhookId={webhook.id} />
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Endpoint URL</div>
                          <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-xs truncate font-mono">
                              {webhook.endpoint_url}
                            </code>
                            <CopyButton value={webhook.endpoint_url} label="Endpoint URL" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <BadgeCheck className="h-4 w-4 text-primary" />
                            Signing secret
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-xs truncate font-mono">
                              {webhook.secret || 'No secret'}
                            </code>
                            {webhook.secret ? <CopyButton value={webhook.secret} label="Signing secret" /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {role === 'owner' && (
        <Card className="surface-card border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger zone</CardTitle>
            </div>
            <CardDescription>
              Permanently delete this workspace and all of its data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              Deleting <strong>{workspace.name}</strong> will remove all boards, stages, leads,
              notes, tasks, intake forms, automations, and team members permanently.
            </div>
          </CardContent>
          <CardFooter>
            <DeleteWorkspaceButton
              workspaceSlug={workspace_slug}
              workspaceName={workspace.name}
              variant="full"
            />
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
