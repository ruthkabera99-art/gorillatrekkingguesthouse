-- Tighten SECURITY DEFINER functions: revoke broad EXECUTE from anon and only allow what's needed.
-- has_role is used by RLS policies (executed in policy context, not via API), so we can safely
-- revoke EXECUTE from PUBLIC, anon, and authenticated.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Trigger functions are only invoked by triggers, never by clients. Revoke EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrease_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_cancel() FROM PUBLIC, anon, authenticated;