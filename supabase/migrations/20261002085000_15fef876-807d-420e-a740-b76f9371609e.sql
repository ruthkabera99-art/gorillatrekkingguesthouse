CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  actor_id uuid,
  actor_role text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE INDEX audit_log_created_idx ON public.audit_log (created_at DESC);
CREATE INDEX audit_log_record_idx ON public.audit_log (record_id);

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old jsonb; v_new jsonb; v_fields text[]; v_role text;
BEGIN
  IF TG_OP <> 'INSERT' THEN v_old := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN v_new := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(k) INTO v_fields FROM jsonb_object_keys(v_new) k
     WHERE k <> 'updated_at' AND v_new->k IS DISTINCT FROM v_old->k;
    IF v_fields IS NULL THEN RETURN NEW; END IF;
  END IF;
  v_role := CASE WHEN auth.uid() IS NULL THEN coalesce(auth.role(), 'system')
                 WHEN private.has_role(auth.uid(), 'admin') THEN 'admin' ELSE 'guest' END;
  INSERT INTO public.audit_log (table_name, record_id, action, actor_id, actor_role, old_data, new_data, changed_fields)
  VALUES (TG_TABLE_NAME, COALESCE((v_new->>'id')::uuid, (v_old->>'id')::uuid), TG_OP, auth.uid(), v_role, v_old, v_new, v_fields);
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.write_audit_log() FROM PUBLIC, anon, authenticated;

-- AFTER triggers so the log captures the final values (after tamper guards ran)
CREATE TRIGGER zz_audit_bookings AFTER INSERT OR UPDATE OR DELETE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER zz_audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER zz_audit_order_items AFTER INSERT OR UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  template text,
  recipient text,
  status text NOT NULL,
  error text,
  provider_sid text,
  requested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view sms logs" ON public.sms_logs FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE INDEX sms_logs_created_idx ON public.sms_logs (created_at DESC);