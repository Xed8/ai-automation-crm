-- 
-- AUTOMATIONS (Phase 5)
-- 

-- 
-- 1. AUTOMATION RULES
-- 
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- 
-- 2. AUTOMATION LOGS (Execution History & Anti-Loop)
-- 
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- 
-- RLS POLICIES
-- 

-- Automation Rules (Users can manage rules)
CREATE POLICY "Workspace members can read automation rules" ON public.automation_rules FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_rules.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert automation rules" ON public.automation_rules FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_rules.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can update automation rules" ON public.automation_rules FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_rules.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace admins can delete automation rules" ON public.automation_rules FOR DELETE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- Automation Logs (Read-only for users, System creates logs via Service Role)
CREATE POLICY "Workspace members can read automation logs" ON public.automation_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_logs.workspace_id AND wm.user_id = auth.uid()));

-- 
-- TRIGGERS & FUNCTIONS
-- 

CREATE TRIGGER set_updated_at_automation_rules
  BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
