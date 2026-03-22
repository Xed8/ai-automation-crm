export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: 'lead-intake' | 'follow-up' | 'pipeline' | 'team'
  trigger_type: string
  trigger_config: Record<string, string>
  action_type: string
  /** action_config may include placeholders — the import UI must resolve stage/member slots */
  action_config: Record<string, string>
  /** If true, requires the user to pick a stage for the trigger */
  needs_trigger_stage?: boolean
  /** If true, requires the user to pick a stage for the action */
  needs_action_stage?: boolean
  /** If true, requires the user to pick a team member for the action */
  needs_assignee?: boolean
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ── Lead intake ──────────────────────────────────────────────────────────
  {
    id: 'welcome-note',
    name: 'Welcome note on new lead',
    description: 'Automatically adds a note to every new lead reminding the team to send a welcome message within 24 hours.',
    category: 'lead-intake',
    trigger_type: 'lead_created',
    trigger_config: {},
    action_type: 'create_note',
    action_config: { content: 'New lead entered the pipeline. Send a welcome message within 24 hours.' },
  },
  {
    id: 'new-lead-task',
    name: 'Create intake task on new lead',
    description: 'Creates a "Review and qualify lead" task the moment a new lead comes in.',
    category: 'lead-intake',
    trigger_type: 'lead_created',
    trigger_config: {},
    action_type: 'create_task',
    action_config: { task_title: 'Review and qualify lead' },
  },
  {
    id: 'form-submit-task',
    name: 'Create follow-up task on form submit',
    description: 'Creates a "Follow up within 1 hour" task whenever a lead submits through an intake form.',
    category: 'lead-intake',
    trigger_type: 'form_submitted',
    trigger_config: {},
    action_type: 'create_task',
    action_config: { task_title: 'Follow up within 1 hour' },
  },

  // ── Follow-up ─────────────────────────────────────────────────────────────
  {
    id: 'proposal-followup-task',
    name: 'Follow-up task when proposal is sent',
    description: 'Creates a "Follow up on proposal" task when a lead moves to your proposal stage.',
    category: 'follow-up',
    trigger_type: 'stage_changed',
    trigger_config: {},
    action_type: 'create_task',
    action_config: { task_title: 'Follow up on proposal — check in 3 days if no response' },
    needs_trigger_stage: true,
  },
  {
    id: 'proposal-note',
    name: 'Add proposal reminder note',
    description: 'Logs a note with next-step guidance when a lead enters the proposal stage.',
    category: 'follow-up',
    trigger_type: 'stage_changed',
    trigger_config: {},
    action_type: 'create_note',
    action_config: { content: 'Proposal sent. Follow up in 3 business days if no response. Offer a call to answer questions.' },
    needs_trigger_stage: true,
  },
  {
    id: 'closing-task',
    name: 'Create closing checklist task',
    description: 'Creates a closing checklist task when a lead moves to your final stage before close.',
    category: 'follow-up',
    trigger_type: 'stage_changed',
    trigger_config: {},
    action_type: 'create_task',
    action_config: { task_title: 'Send contract and onboarding materials' },
    needs_trigger_stage: true,
  },

  // ── Pipeline ──────────────────────────────────────────────────────────────
  {
    id: 'auto-qualify',
    name: 'Auto-move to qualification stage',
    description: 'Moves a lead to your Qualification stage the moment it is created via a form.',
    category: 'pipeline',
    trigger_type: 'form_submitted',
    trigger_config: {},
    action_type: 'move_stage',
    action_config: {},
    needs_action_stage: true,
  },

  // ── Team ─────────────────────────────────────────────────────────────────
  {
    id: 'auto-assign-new',
    name: 'Auto-assign new leads',
    description: 'Automatically assigns every new lead to a specific team member.',
    category: 'team',
    trigger_type: 'lead_created',
    trigger_config: {},
    action_type: 'assign_owner',
    action_config: {},
    needs_assignee: true,
  },
  {
    id: 'assign-on-stage',
    name: 'Assign lead when it enters a stage',
    description: 'Assigns a lead to a team member when it moves to a specific stage.',
    category: 'team',
    trigger_type: 'stage_changed',
    trigger_config: {},
    action_type: 'assign_owner',
    action_config: {},
    needs_trigger_stage: true,
    needs_assignee: true,
  },
]

export const TEMPLATE_CATEGORY_LABELS: Record<AutomationTemplate['category'], string> = {
  'lead-intake': 'Lead intake',
  'follow-up': 'Follow-up',
  'pipeline': 'Pipeline',
  'team': 'Team',
}
