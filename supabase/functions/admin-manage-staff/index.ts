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
    const URL = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(URL, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const admin = createClient(URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: cr } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    if (!(cr || []).some((r: any) => r.role === 'admin')) return json({ error: 'Admin only' }, 403);

    const body = await req.json();
    const { action, user_id } = body;
    if (user_id && user_id === user.id && action !== 'create') return json({ error: "You can't change your own account here" }, 400);

    const setRole = async (id: string, role: string) => {
      if (!ROLES.includes(role)) throw new Error('Invalid role');
      await admin.from('user_roles').delete().eq('user_id', id);
      const { error } = await admin.from('user_roles').insert({ user_id: id, role });
      if (error) throw error;
    };

    switch (action) {
      case 'create': {
        const { full_name, email, phone, password, role } = body;
        if (!full_name || !password || password.length < 8) return json({ error: 'Name and a password of at least 8 characters are required' }, 400);
        const loginEmail = email?.trim() || (phone ? `${String(phone).replace(/[^0-9]/g, '')}@whatsapp.guest` : '');
        if (!loginEmail) return json({ error: 'Email or phone is required' }, 400);
        const { data, error } = await admin.auth.admin.createUser({
          email: loginEmail, password, email_confirm: true, user_metadata: { full_name, phone: phone || '' },
        });
        if (error) return json({ error: error.message }, 400);
        await setRole(data.user.id, role || 'waiter');
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
