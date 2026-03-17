-- 
-- NOTIFICATIONS (Phase 6)
-- 

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'assigned', 'task_due', 'automation_run', 'system_alert'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 
-- RLS POLICIES
-- 

-- Users can ONLY see and update (mark read) their OWN notifications within their workspace
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = notifications.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = notifications.workspace_id AND wm.user_id = auth.uid()));

-- System/Service Role inserts notifications automatically, but if we need manual insertions from users (e.g., User A assigning User B), 
-- we allow inserts to the workspace as long as the requesting user is a workspace member.
CREATE POLICY "Workspace members can insert notifications" ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = notifications.workspace_id AND wm.user_id = auth.uid()));

-- 
-- TRIGGERS
-- 

CREATE TRIGGER set_updated_at_notifications
  BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
