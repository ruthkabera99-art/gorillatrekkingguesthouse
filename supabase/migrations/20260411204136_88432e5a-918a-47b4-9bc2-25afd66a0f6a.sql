-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'mobile_money');

-- Add payment tracking columns to bookings
ALTER TABLE public.bookings
ADD COLUMN payment_method public.payment_method,
ADD COLUMN payment_reference text,
ADD COLUMN paid_at timestamp with time zone;