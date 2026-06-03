import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is an admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rolesForCaller } = await admin
      .from('user_roles').select('role').eq('user_id', user.id);
    const callerRoles = (rolesForCaller || []).map((r: any) => r.role);
    if (!callerRoles.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List users + profiles + roles
    const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      admin.from('profiles').select('user_id, full_name, phone'),
      admin.from('user_roles').select('user_id, role'),
    ]);

    const merged = (usersPage?.users || []).map((u) => {
      const profile = (profiles || []).find((p: any) => p.user_id === u.id);
      const userRoles = (roles || []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role);
      return {
        user_id: u.id,
        email: u.email,
        phone: profile?.phone || u.phone || '',
        full_name: profile?.full_name || '',
        created_at: u.created_at,
        roles: userRoles,
      };
    });

    return new Response(JSON.stringify({ users: merged }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
