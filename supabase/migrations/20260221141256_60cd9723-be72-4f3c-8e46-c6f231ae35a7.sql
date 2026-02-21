-- Add guest info columns to orders table for temporary guest ordering
ALTER TABLE public.orders ADD COLUMN guest_name text;
ALTER TABLE public.orders ADD COLUMN guest_phone text;