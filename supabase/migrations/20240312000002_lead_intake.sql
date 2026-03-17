-- 
-- LEAD INTAKE TABLES (Phase 4)
-- 

-- Enable pgcrypto for generating webhook secrets securely
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 
-- 1. LEAD FORMS
-- 
CREATE TABLE public.lead_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_secret TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;

-- 
-- 2. SCHEMA MODIFICATIONS TO LEADS
-- 
ALTER TABLE public.leads
ADD COLUMN source TEXT,
ADD COLUMN source_id UUID REFERENCES public.lead_forms(id) ON DELETE SET NULL,
ADD COLUMN external_reference_id TEXT;

-- 
-- RLS POLICIES (Using the established safe workspace_members pattern)
-- 

-- Lead Forms
CREATE POLICY "Workspace members can read forms" ON public.lead_forms FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = lead_forms.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert forms" ON public.lead_forms FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = lead_forms.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can update forms" ON public.lead_forms FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = lead_forms.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace owners/admins can delete forms" ON public.lead_forms FOR DELETE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- 
-- TRIGGERS & FUNCTIONS
-- 

CREATE TRIGGER set_updated_at_lead_forms
  BEFORE UPDATE ON public.lead_forms FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
