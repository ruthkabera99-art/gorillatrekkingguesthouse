import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ROLES = ['admin', 'waiter', 'kitchen', 'bar', 'receptionist', 'user'];
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing authorization' }, 401);
    const URL = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!URL || !anonKey || !serviceKey) return json({ error: 'Staff account service is not configured. Existing accounts have not changed.' }, 503);
    const userClient = createClient(URL, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const admin = createClient(URL, serviceKey);
    const { data: cr, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    if (roleError) throw roleError;
    if (!(cr || []).some((r: any) => r.role === 'admin')) return json({ error: 'Admin only' }, 403);

    const body = await req.json();
    const { action, user_id } = body;
    if (action !== 'create' && (typeof user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))) return json({ error: 'Choose a valid staff account' }, 400);
    if (user_id && user_id === user.id && action !== 'create') return json({ error: "You can't change your own account here" }, 400);

    const setRole = async (id: string, role: string) => {
      if (!ROLES.includes(role)) throw new Error('Invalid role');
      const { error } = await userClient.rpc('admin_set_user_role', { _user_id: id, _role: role });
      if (error) throw error;
    };

    switch (action) {
      case 'create': {
        const { full_name, email, phone, password, role } = body;
        if (typeof full_name !== 'string' || !full_name.trim() || typeof password !== 'string' || password.length < 8) return json({ error: 'Name and a password of at least 8 characters are required' }, 400);
        if (!ROLES.includes(role || 'waiter')) return json({ error: 'Choose a valid staff role' }, 400);
        if (email !== undefined && typeof email !== 'string') return json({ error: 'Enter a valid email' }, 400);
        if (phone !== undefined && typeof phone !== 'string') return json({ error: 'Enter a valid phone number' }, 400);
        const phoneDigits = (phone || '').replace(/[^0-9]/g, '');
        if (!email?.trim() && phoneDigits.length < 10) return json({ error: 'Enter a valid phone number or email' }, 400);
        const loginEmail = email?.trim() || `${phoneDigits}@whatsapp.guest`;
        if (!loginEmail) return json({ error: 'Email or phone is required' }, 400);
        const { data, error } = await admin.auth.admin.createUser({
          email: loginEmail, password, email_confirm: true, user_metadata: { full_name: full_name.trim(), phone: phone || '' },
        });
        if (error) return json({ error: error.message }, 400);
        try { await setRole(data.user.id, role || 'waiter'); }
        catch (roleFailure) {
          const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
          if (cleanupError) return json({ error: 'The account was created but its role was not assigned. Refresh the staff list and correct its role before use.' }, 500);
          throw roleFailure;
        }
        return json({ ok: true, user_id: data.user.id });
      }
      case 'set_role': await setRole(user_id, body.role); return json({ ok: true });
      case 'disable': {
        const { error } = await admin.auth.admin.updateUserById(user_id, { ban_duration: '876000h' } as any);
        if (error) throw error; return json({ ok: true });
      }
      case 'enable': {
        const { error } = await admin.auth.admin.updateUserById(user_id, { ban_duration: 'none' } as any);
        if (error) throw error; return json({ ok: true });
      }
      case 'reset_password': {
        if (!body.password || body.password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
        const { error } = await admin.auth.admin.updateUserById(user_id, { password: body.password });
        if (error) throw error; return json({ ok: true });
      }
      case 'delete': {
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) return json({ error: 'This account has bookings or history and cannot be deleted — turn it off instead.' }, 400);
        return json({ ok: true });
      }
      default: return json({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
