-- Enhance security
-- Enable pgcrypto for UUID generation if needed (though Supabase includes it by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 
-- 1. PROFILES
-- 
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Protect profiles with RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 
-- 2. WORKSPACES
-- 
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Protect workspaces with RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 
-- 3. WORKSPACE MEMBERS
-- 
-- Create an ENUM for roles
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Protect workspace members with RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 
-- 4. RLS POLICIES
-- 

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Helper function to check if a user is a member of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user has admin/owner rights in a workspace
CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, required_roles public.workspace_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid()
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspaces Policies
-- Read: Users can only see workspaces they are members of
CREATE POLICY "Users can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id));

-- Insert: Any authenticated user can create a workspace
CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Only admins or owners can update a workspace
CREATE POLICY "Admins can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (public.has_workspace_role(id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- Delete: Only owners can delete a workspace
CREATE POLICY "Owners can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (public.has_workspace_role(id, ARRAY['owner']::public.workspace_role[]));

-- Workspace Members Policies
-- Read: Members of a workspace can see all other members of that workspace
-- (Using a direct EXISTS query to avoid passing through the table's own RLS recursively)
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Insert/Update/Delete (Management): Only admins/owners can manage members
CREATE POLICY "Admins can manage members"
  ON public.workspace_members FOR ALL
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.workspace_role[]));

-- 
-- 5. TRIGGERS
-- 

-- Create profile automatically when auth.users signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto updated_at trigger helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at_profiles 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_workspaces
  BEFORE UPDATE ON public.workspaces 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_workspace_members
  BEFORE UPDATE ON public.workspace_members 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
