-- Fix infinite recursion on direct SELECTs from workspace_members.
-- Reuse the existing SECURITY DEFINER helper instead of recursively querying
-- workspace_members from inside its own SELECT policy.

DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;

CREATE POLICY "Members can view workspace members"
  ON public.workspace_members
  FOR SELECT
  USING (public.is_workspace_member(workspace_id));
