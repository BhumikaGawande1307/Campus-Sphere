-- Migration 019: Security and RPC enhancements
-- 1. Create a secure RPC for assigning user roles and toggling user status, restricted to ADMIN usage.
-- 2. Enforce MIME types on the documents storage bucket.

-- RPC to update user roles securely
CREATE OR REPLACE FUNCTION assign_user_role(target_user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only administrators can assign roles.';
  END IF;

  UPDATE users
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

-- RPC to toggle user active status securely
CREATE OR REPLACE FUNCTION toggle_user_status(target_user_id UUID, new_status BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only administrators can change user status.';
  END IF;

  UPDATE users
  SET is_active = new_status
  WHERE id = target_user_id;
END;
$$;

-- Enforce MIME type validation for storage buckets if not already present
-- First, ensure the documents bucket exists and update its allowed_mime_types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'documents';
