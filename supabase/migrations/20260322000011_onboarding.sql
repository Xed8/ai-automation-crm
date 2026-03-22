-- Track which onboarding steps each user has completed per workspace
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS onboarding_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed_steps TEXT[] NOT NULL DEFAULT '{}';
