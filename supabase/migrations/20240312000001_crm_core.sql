-- 
-- CRM CORE TABLES (Phase 3)
-- 

-- 
-- 1. BOARDS (Pipelines)
-- 
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- 
-- 2. STAGES (Columns in a board)
-- 
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

-- 
-- 3. LEADS (Records in the CRM)
-- 
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  firm_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  value NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 
-- 4. NOTES (Attachments to leads)
-- 
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 
-- 5. TASKS (Action items for a lead)
-- 
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 
-- 6. ACTIVITY LOGS (Timeline events)
-- 
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 
-- RLS POLICIES (All using the established safe workspace_members pattern)
-- 

-- Boards
CREATE POLICY "Workspace members can read boards" ON public.boards FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = boards.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert boards" ON public.boards FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = boards.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can update boards" ON public.boards FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = boards.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace owners/admins can delete boards" ON public.boards FOR DELETE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- Stages
CREATE POLICY "Workspace members can read stages" ON public.stages FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = stages.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert stages" ON public.stages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = stages.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can update stages" ON public.stages FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = stages.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can delete stages" ON public.stages FOR DELETE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = stages.workspace_id AND wm.user_id = auth.uid()));

-- Leads
CREATE POLICY "Workspace members can read leads" ON public.leads FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = leads.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert leads" ON public.leads FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = leads.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can update leads" ON public.leads FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = leads.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can delete leads" ON public.leads FOR DELETE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = leads.workspace_id AND wm.user_id = auth.uid()));

-- Notes
CREATE POLICY "Workspace members can read notes" ON public.notes FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = notes.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert notes" ON public.notes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = notes.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Authors can update their notes" ON public.notes FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Authors or Admins can delete notes" ON public.notes FOR DELETE USING (author_id = auth.uid() OR public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- Tasks
CREATE POLICY "Workspace members can read tasks" ON public.tasks FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert tasks" ON public.tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can update tasks" ON public.tasks FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can delete tasks" ON public.tasks FOR DELETE USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()));

-- Activity Logs
CREATE POLICY "Workspace members can read logs" ON public.activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = activity_logs.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Workspace members can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = activity_logs.workspace_id AND wm.user_id = auth.uid()));
-- Users cannot update or delete activity logs. RLS implicitly denies these since no policies exist.


-- 
-- TRIGGERS & FUNCTIONS
-- 

CREATE TRIGGER set_updated_at_boards
  BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_stages
  BEFORE UPDATE ON public.stages FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_notes
  BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
