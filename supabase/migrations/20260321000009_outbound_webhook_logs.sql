--
-- Outbound Webhook Delivery Logs
--
CREATE TABLE public.outbound_webhook_logs (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id     UUID        NOT NULL REFERENCES public.outbound_webhooks(id) ON DELETE CASCADE,
  workspace_id   UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type     TEXT        NOT NULL,
  payload        JSONB       NOT NULL,
  http_status    INTEGER,
  success        BOOLEAN     NOT NULL DEFAULT false,
  error_message  TEXT,
  delivered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.outbound_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace admins can read outbound_webhook_logs"
  ON public.outbound_webhook_logs FOR SELECT
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- Index for fast per-webhook log lookups
CREATE INDEX outbound_webhook_logs_webhook_id_idx ON public.outbound_webhook_logs (webhook_id, delivered_at DESC);
