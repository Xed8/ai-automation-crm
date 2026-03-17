'use server'

import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { revalidatePath } from 'next/cache'
import { checkQuota, recordUsage } from '@/lib/billing/quotas'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'

// llama-3.3-70b via Groq: free tier, very fast, handles all CRM AI tasks
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
const lightModel = groq('llama-3.3-70b-versatile')
const reasoningModel = groq('llama-3.3-70b-versatile')

// AI Action: Summarize Lead
export async function summarizeLead(workspaceSlug: string, leadId: string) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const quota = await checkQuota(workspace.id, 'ai_tokens', 1)
  if (!quota.allowed) {
    return { error: quota.reason || 'AI limit reached.' }
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('*, boards(name), stages(name)')
    .eq('id', leadId)
    .single()
  const { data: notes } = await supabase.from('notes').select('content, created_at').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(10)
  const { data: acts } = await supabase.from('activity_logs').select('action_type, created_at').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(10)

  if (!lead) return { error: 'Lead not found.' }

  const boardName = (lead.boards as { name?: string } | null)?.name ?? 'Unknown pipeline'
  const stageName = (lead.stages as { name?: string } | null)?.name ?? 'Unknown stage'
  const notesText = notes?.map(n => `- ${n.content}`).join('\n') || 'No notes yet.'
  const activityText = acts?.map(a => `- ${a.action_type.replace(/_/g, ' ')} on ${new Date(a.created_at).toLocaleDateString()}`).join('\n') || 'No activity yet.'

  const context = `
FIRM NAME: ${lead.firm_name}
CONTACT: ${lead.contact_name || 'N/A'}
EMAIL: ${lead.email || 'N/A'}
PHONE: ${lead.phone || 'N/A'}
DEAL VALUE: ${lead.value ? '$' + lead.value.toLocaleString() : 'N/A'}
PIPELINE: ${boardName}
CURRENT STAGE: ${stageName}
STATUS: ${lead.status}

NOTES:
${notesText}

RECENT ACTIVITY:
${activityText}
  `

  try {
    const { text, usage } = await generateText({
      model: lightModel,
      system: 'You are a helpful CRM assistant. Summarize the following lead context into a concise 2-3 sentence paragraph focusing on the most important status or next step.',
      prompt: context,
    })

    await supabase.from('notes').insert({
      workspace_id: workspace.id,
      lead_id: leadId,
      author_id: user.id,
      content: `AI SUMMARY:\n\n${text}`,
    })

    await recordUsage(workspace.id, 'ai_tokens', usage?.totalTokens ?? 1)

    revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('AI Summary failed:', error)
    return { error: 'AI generation failed.' }
  }
}

// AI Action: Suggest Next Step
export async function suggestNextStep(workspaceSlug: string, leadId: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const quota = await checkQuota(workspace.id, 'ai_tokens', 2)
  if (!quota.allowed) {
    return { error: quota.reason || 'AI limit reached.' }
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('*, boards(name), stages(name)')
    .eq('id', leadId)
    .single()
  const { data: notes } = await supabase.from('notes').select('content').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(5)

  const stageName = (lead?.stages as { name?: string } | null)?.name ?? 'Unknown stage'
  const notesText = notes?.map(n => `- ${n.content}`).join('\n') || 'No notes yet.'

  const context = `
FIRM: ${lead?.firm_name}
CURRENT STAGE: ${stageName}
NOTES:
${notesText}
  `

  try {
    const { text, usage } = await generateText({
      model: reasoningModel,
      system: 'You are an expert sales manager. Based on the notes, suggest exactly one short, actionable next step task for the salesperson. Do not explain, just return the task title (e.g. "Call them back on Tuesday to clear budget questions").',
      prompt: context,
    })

    await supabase.from('tasks').insert({
      workspace_id: workspace.id,
      lead_id: leadId,
      title: `AI Suggestion: ${text}`,
    })

    await recordUsage(workspace.id, 'ai_tokens', usage?.totalTokens ?? 2)

    revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('AI Suggestion failed:', error)
    return { error: 'AI generation failed.' }
  }
}
