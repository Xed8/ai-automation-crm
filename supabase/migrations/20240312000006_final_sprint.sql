-- 
-- FINAL SPRINT (Phases 7, 8, 9)
-- Billing, Quotas, and Integrations
-- 

-- 
-- 1. SUBSCRIPTIONS
-- 
CREATE TABLE public.subscriptions (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 
-- 2. USAGE METRICS (Billing cycle quotas)
-- 
CREATE TABLE public.usage_metrics (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  billing_cycle_start TIMESTAMPTZ NOT NULL,
  leads_created INTEGER NOT NULL DEFAULT 0,
  ai_tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, billing_cycle_start)
);

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- 
-- 3. API KEYS (Integrations)
-- 
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 
-- 4. OUTBOUND WEBHOOKS
-- 
CREATE TABLE public.outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g. 'lead.created', 'lead.stage_changed'
  endpoint_url TEXT NOT NULL,
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;

-- 
-- RLS POLICIES
-- 

-- Subscriptions (Workspace owners/admins can read their subscription)
CREATE POLICY "Workspace members can read subscriptions" ON public.subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = subscriptions.workspace_id AND wm.user_id = auth.uid()));

-- Usage Metrics (Internal metrics, readable by workspace members)
CREATE POLICY "Workspace members can read usage_metrics" ON public.usage_metrics FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = usage_metrics.workspace_id AND wm.user_id = auth.uid()));

-- API Keys (Only Workspace Admins can manage API keys)
CREATE POLICY "Workspace admins can read api_keys" ON public.api_keys FOR SELECT USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Workspace admins can insert api_keys" ON public.api_keys FOR INSERT WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Workspace admins can delete api_keys" ON public.api_keys FOR DELETE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- Outbound Webhooks (Admins)
CREATE POLICY "Workspace admins can read outbound_webhooks" ON public.outbound_webhooks FOR SELECT USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Workspace admins can insert outbound_webhooks" ON public.outbound_webhooks FOR INSERT WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Workspace admins can update outbound_webhooks" ON public.outbound_webhooks FOR UPDATE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Workspace admins can delete outbound_webhooks" ON public.outbound_webhooks FOR DELETE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- 
-- TRIGGERS & FUNCTIONS
-- 
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_usage_metrics BEFORE UPDATE ON public.usage_metrics FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_outbound_webhooks BEFORE UPDATE ON public.outbound_webhooks FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Auto-create a free subscription when a workspace is created
CREATE OR REPLACE FUNCTION public.handle_new_workspace_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (workspace_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- Also initialize usage for current month
  INSERT INTO public.usage_metrics (workspace_id, billing_cycle_start)
  VALUES (NEW.id, date_trunc('month', now()));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workspace_created_subscription
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_workspace_subscription();

-- Backfill missing subscriptions for existing workspaces
INSERT INTO public.subscriptions (workspace_id, tier, status)
SELECT id, 'free', 'active' FROM public.workspaces
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO public.usage_metrics (workspace_id, billing_cycle_start)
SELECT id, date_trunc('month', now()) FROM public.workspaces
ON CONFLICT (workspace_id, billing_cycle_start) DO NOTHING;
