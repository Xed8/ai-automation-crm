-- Allow the first owner membership row to be created immediately after a workspace insert.
-- This keeps workspace creation compatible with RLS without requiring a service-role client.

CREATE POLICY "Creators can add first owner membership"
  ON public.workspace_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.workspace_members existing
      WHERE existing.workspace_id = workspace_members.workspace_id
    )
  );
