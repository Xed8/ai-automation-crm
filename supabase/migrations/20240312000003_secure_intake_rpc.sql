-- 
-- SECURE PUBLIC LEAD INGESTION (Phase 4)
-- 

-- This function runs with elevated privileges (SECURITY DEFINER)
-- It safely checks the form's webhook secret, handles duplicates, and inserts the lead, bypassing the RLS that normally blocks unauthenticated users.

CREATE OR REPLACE FUNCTION public.ingest_lead_from_form(
  p_form_id UUID,
  p_webhook_secret TEXT,
  p_firm_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_message TEXT
) RETURNS JSONB AS $$
DECLARE
  v_form public.lead_forms%ROWTYPE;
  v_existing_lead_id UUID;
  v_new_lead_id UUID;
BEGIN
  -- 1. Validate the Form and Secret
  SELECT * INTO v_form 
  FROM public.lead_forms 
  WHERE id = p_form_id 
    AND webhook_secret = p_webhook_secret
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid form ID or webhook secret, or form is inactive.');
  END IF;

  -- 2. Simple Duplicate Detection (By Email on the exact same board)
  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    SELECT id INTO v_existing_lead_id 
    FROM public.leads 
    WHERE board_id = v_form.board_id 
      AND lower(email) = lower(p_email)
    LIMIT 1;

    IF FOUND THEN
      -- Update the existing lead's timestamp
      UPDATE public.leads 
      SET updated_at = NOW() 
      WHERE id = v_existing_lead_id;

      -- Add an activity log noting the duplicate submission
      INSERT INTO public.activity_logs (workspace_id, lead_id, action_type, metadata)
      VALUES (
        v_form.workspace_id, 
        v_existing_lead_id, 
        'form_resubmitted', 
        jsonb_build_object('form_name', v_form.name, 'message', p_message)
      );

      RETURN jsonb_build_object('success', true, 'status', 'duplicate_merged', 'lead_id', v_existing_lead_id);
    END IF;
  END IF;

  -- 3. Insert the New Lead
  INSERT INTO public.leads (
    workspace_id, 
    board_id, 
    stage_id, 
    source, 
    source_id, 
    firm_name, 
    contact_name, 
    email, 
    phone
  ) VALUES (
    v_form.workspace_id,
    v_form.board_id,
    v_form.stage_id,
    'Form: ' || v_form.name,
    v_form.id,
    p_firm_name,
    p_contact_name,
    p_email,
    p_phone
  ) RETURNING id INTO v_new_lead_id;

  -- 4. Initial Activity Log
  INSERT INTO public.activity_logs (workspace_id, lead_id, action_type, metadata)
  VALUES (
    v_form.workspace_id, 
    v_new_lead_id, 
    'created_via_form', 
    jsonb_build_object('form_name', v_form.name, 'message', p_message)
  );
  
  -- Create a Note if a message was provided
  IF p_message IS NOT NULL AND trim(p_message) != '' THEN
    -- Bypassing RLS here means authors are null (System). Make sure Notes table handles null author_id if we want System notes, or we just use Activity Log metadata (which we already did above).
    -- Wait, the `notes` table requires `author_id UUID NOT NULL`.  For now, the message is stored in the activity_log metadata safely.
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 'created', 'lead_id', v_new_lead_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
