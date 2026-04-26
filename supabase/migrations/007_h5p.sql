-- Add H5P content path to lektionen
ALTER TABLE public.lektionen
  ADD COLUMN IF NOT EXISTS h5p_content_path TEXT NULL;
