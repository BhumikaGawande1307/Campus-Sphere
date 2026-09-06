-- 028_system_branding_settings.sql
-- Add dedicated branding_config JSONB column to system_settings
-- Clean any internal branding artifacts from public faqs array

DO $$ BEGIN
  ALTER TABLE public.system_settings 
    ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Clean out any __BRANDING__ objects that were accidentally serialized into faqs
UPDATE public.system_settings
SET faqs = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(faqs) AS elem
  WHERE elem->>'question' <> '__BRANDING__'
)
WHERE faqs @> '[{"question": "__BRANDING__"}]';