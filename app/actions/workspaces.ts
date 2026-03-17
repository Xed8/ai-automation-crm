'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { checkWorkspaceLimit } from '@/lib/billing/quotas'

export async function deleteWorkspace(workspaceSlug: string) {
  const { requireWorkspaceScope } = await import('@/lib/workspace-context')
  // requireWorkspaceScope uses the admin client for membership lookup — avoids RLS issues
  const { workspace, role } = await requireWorkspaceScope(workspaceSlug)

  if (role !== 'owner') {
    return { error: 'Only the workspace owner can delete it.' }
  }

  // Delete via admin client — cascades to boards, stages, leads, notes, tasks, members, etc.
  const admin = createAdminClient()
  const { error } = await admin
    .from('workspaces')
    .delete()
    .eq('id', workspace.id)

  if (error) {
    console.error('Failed to delete workspace:', error)
    return { error: 'Failed to delete workspace.' }
  }

  revalidatePath('/workspaces')
  return { success: true }
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Check workspace limit before proceeding
  const quota = await checkWorkspaceLimit(user.id)
  if (!quota.allowed) {
    redirect(`/workspaces/create?message=${encodeURIComponent(quota.reason ?? 'Workspace limit reached.')}`)
  }

  const rawName = String(formData.get('name') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim().toLowerCase()

  if (!rawName || !rawSlug) {
    redirect('/workspaces/create?message=Workspace name and slug are required')
  }

  const workspaceId = crypto.randomUUID()
  const hasAdminClient =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (hasAdminClient) {
    const admin = createAdminClient()

    const { error: wsError } = await admin
      .from('workspaces')
      .insert({
        id: workspaceId,
        name: rawName,
        slug: rawSlug,
      })

    if (wsError) {
      redirect(`/workspaces/create?message=${wsError.message || 'Failed to create workspace'}`)
    }

    const { error: memberError } = await admin
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Failed to attach owner role with admin client:', memberError)
      await admin.from('workspaces').delete().eq('id', workspaceId)
      redirect(`/workspaces/create?message=${memberError.message || 'Failed to attach workspace owner'}`)
    }
  } else {
    // Avoid `.select()` here. The new workspace row is not readable under the SELECT
    // policy until the owner membership exists, so returning the inserted row triggers RLS.
    const { error: wsError } = await supabase
      .from('workspaces')
      .insert({
        id: workspaceId,
        name: rawName,
        slug: rawSlug,
      })

    if (wsError) {
      redirect(`/workspaces/create?message=${wsError.message || 'Failed to create workspace'}`)
    }

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Failed to attach owner role without admin client:', memberError)
      const isRlsError =
        memberError.code === '42501' ||
        memberError.message.toLowerCase().includes('row-level security')

      redirect(
        `/workspaces/create?message=${
          isRlsError
            ? 'Workspace owner creation is blocked by database RLS. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the dev server, or apply the workspace_members bootstrap SQL policy in Supabase.'
            : memberError.message ||
              'Failed to attach workspace owner. Add SUPABASE_SERVICE_ROLE_KEY or apply the workspace_members bootstrap policy.'
        }`
      )
    }
  }

  // Auto-seed a sample pipeline so the workspace isn't empty on first load
  const admin2 = createAdminClient()
  const sampleStages = [
    'New Inquiry', 'Contacted', 'Qualification',
    'Meeting Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost',
  ]
  const { data: seedBoard } = await admin2
    .from('boards')
    .insert({
      workspace_id: workspaceId,
      name: 'Sales Pipeline',
      description: 'Default sales pipeline — rename stages or add new ones to fit your process.',
    })
    .select('id')
    .single()

  if (seedBoard) {
    const { data: insertedStages } = await admin2.from('stages').insert(
      sampleStages.map((name, order) => ({
        workspace_id: workspaceId,
        board_id: seedBoard.id,
        name,
        order,
      }))
    ).select('id, name')

    // Seed 5 sample leads across stages so the pipeline looks alive from day one
    if (insertedStages && insertedStages.length >= 5) {
      const stageByName = Object.fromEntries(insertedStages.map((s) => [s.name, s.id]))
      const sampleLeads = [
        { firm_name: 'Blaze Media Group',     contact_name: 'Sarah Chen',  email: 'sarah@blazemedia.com',    phone: '(555) 201-4433', value: 4500,  stage: 'New Inquiry',       note: 'Submitted inquiry via website contact form. Looking for social media management and SEO services. Mentioned they have outgrown their current agency.' },
        { firm_name: 'Vantage Roofing',       contact_name: 'Mike Torres', email: 'mike@vantageroofing.com', phone: '(555) 384-9921', value: 12000, stage: 'Contacted',         note: 'Had a 15-minute intro call. Interested in a full website redesign and Google Ads management. Decision maker is the owner. Follow up with a capabilities deck.' },
        { firm_name: 'Northside Dental Group',contact_name: 'Dr. A. Patel',email: 'apatel@northsidedental.com',phone: '(555) 477-0012',value: 18000, stage: 'Qualification',   note: 'Discovery call completed. Budget confirmed at $1,500/mo for 12 months. Looking to launch before Q2. Has existing site on Wix — will need full rebuild. Schedule proposal call.' },
        { firm_name: 'Elevated Home Staging', contact_name: 'Jenna Walsh', email: 'jenna@elevatedhome.co',  phone: '(555) 592-6677', value: 8000,  stage: 'Meeting Scheduled', note: 'Meeting booked for Tuesday at 2pm. Wants a full brand refresh and new landing pages. Jenna is comparing us with two other agencies — prepare a strong intro deck.' },
        { firm_name: 'Peak Performance Gym',  contact_name: 'Derek Holt',  email: 'derek@peakperfgym.com',  phone: '(555) 631-8854', value: 6000,  stage: 'Proposal Sent',     note: 'Sent a 3-service proposal: local SEO, content marketing, and email automation. Derek asked to review with his business partner. Expected decision by end of week.' },
      ]

      for (const lead of sampleLeads) {
        const stageId = stageByName[lead.stage]
        if (!stageId) continue
        const { data: newLead } = await admin2.from('leads').insert({
          workspace_id: workspaceId,
          board_id: seedBoard.id,
          stage_id: stageId,
          firm_name: lead.firm_name,
          contact_name: lead.contact_name,
          email: lead.email,
          phone: lead.phone,
          value: lead.value,
          status: 'active',
        }).select('id').single()

        if (newLead) {
          await admin2.from('notes').insert({
            workspace_id: workspaceId,
            lead_id: newLead.id,
            author_id: user.id,
            content: lead.note,
          })
        }
      }
    }
  }

  revalidatePath('/workspaces')
  redirect(`/w/${rawSlug}`)
}
