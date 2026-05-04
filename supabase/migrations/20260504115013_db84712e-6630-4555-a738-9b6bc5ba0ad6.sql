-- Make user_id nullable for walk-in bookings
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Add walk-in guest fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;