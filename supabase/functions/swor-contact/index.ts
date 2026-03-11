import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// PATCH v1.3: Added Access-Control-Allow-Methods to fix CORS preflight blocking
const VERSION = '1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // Get auth header for authenticated actions
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userRole: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('user_id', user.id)
          .single();
        userRole = profile?.role || null;
        if (!userEmail && profile?.email) userEmail = profile.email;
      }
    }

    const isSteward = () => userRole === 'steward' || userRole === 'admin';

    async function writeAuditLog(entry: {
      action_type: string;
      actor_user_id?: string | null;
      actor_email: string;
      scope_type: string;
      target_id?: string | null;
      target_label?: string | null;
      details_json?: any;
    }) {
      try {
        const { error } = await supabase.from('steward_audit_log').insert({
          action_type: entry.action_type,
          actor_user_id: entry.actor_user_id || null,
          actor_email: entry.actor_email,
          scope_type: entry.scope_type,
          target_id: entry.target_id || null,
          target_label: entry.target_label || null,
          details_json: entry.details_json || null,
        });
        if (error) console.error('[AuditLog] Write failed:', error);
      } catch (err) {
        console.error('[AuditLog] Exception:', err);
      }
    }

    switch (action) {
      case 'submit_message': {
        const { name, email, subject, message, source_page } = body;

        if (!name || !name.trim()) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Name is required' }, { headers: corsHeaders, status: 400 });
        }
        if (!email || !email.trim()) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Email is required' }, { headers: corsHeaders, status: 400 });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Please enter a valid email address' }, { headers: corsHeaders, status: 400 });
        }
        if (!subject || !subject.trim()) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Subject is required' }, { headers: corsHeaders, status: 400 });
        }
        if (!message || !message.trim()) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Message is required' }, { headers: corsHeaders, status: 400 });
        }

        const timestamp = new Date().toISOString();

        const { data, error } = await supabase
          .from('contact_messages')
          .insert({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            source_page: source_page || null,
            user_id: userId,
            status: 'new',
            created_at: timestamp
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting contact message:', error);
          return Response.json({ success: false, error: 'database_error', detail: 'Failed to submit message' }, { headers: corsHeaders, status: 500 });
        }

        await supabase.from('audit_log').insert({
          action: 'contact_message_submitted',
          actor_id: userId,
          target_type: 'contact_message',
          target_id: data.id,
          metadata: { email: email.trim().toLowerCase(), subject: subject.trim() }
        });

        // Notify stewards via email
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'contact_message_received',
              payload: {
                message_id: data.id,
                sender_name: name.trim(),
                sender_email: email.trim().toLowerCase(),
                subject: subject.trim(),
                message: message.trim(),
                timestamp: timestamp
              }
            }
          });
        } catch (e) {
          console.log('Notification dispatch failed (non-critical):', e);
        }

        return Response.json({ success: true, message_id: data.id }, { headers: corsHeaders });
      }

      case 'list_messages': {
        if (!isSteward()) {
          return Response.json({ success: false, error: 'unauthorized', detail: 'Steward access required' }, { headers: corsHeaders, status: 403 });
        }

        const { status_filter, limit = 50, offset = 0 } = body;

        let query = supabase
          .from('contact_messages')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status_filter && status_filter !== 'all') {
          query = query.eq('status', status_filter);
        }

        const { data, error, count } = await query;

        if (error) {
          return Response.json({ success: false, error: 'database_error', detail: error.message }, { headers: corsHeaders, status: 500 });
        }

        return Response.json({ success: true, messages: data, total: count }, { headers: corsHeaders });
      }

      case 'update_message': {
        if (!isSteward()) {
          return Response.json({ success: false, error: 'unauthorized', detail: 'Steward access required' }, { headers: corsHeaders, status: 403 });
        }

        const { message_id, status, steward_note, assigned_to } = body;

        if (!message_id) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Message ID is required' }, { headers: corsHeaders, status: 400 });
        }

        const { data: beforeMessage } = await supabase
          .from('contact_messages')
          .select('status, subject, name, email')
          .eq('id', message_id)
          .single();

        const updates: Record<string, any> = {};
        if (status) updates.status = status;
        if (steward_note !== undefined) updates.steward_note = steward_note;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;

        const { data, error } = await supabase
          .from('contact_messages')
          .update(updates)
          .eq('id', message_id)
          .select()
          .single();

        if (error) {
          return Response.json({ success: false, error: 'database_error', detail: error.message }, { headers: corsHeaders, status: 500 });
        }

        await supabase.from('audit_log').insert({
          action: 'contact_message_updated',
          actor_id: userId,
          target_type: 'contact_message',
          target_id: message_id,
          metadata: { updates }
        });

        const statusBefore = beforeMessage?.status || 'unknown';
        let auditActionType = 'contact.updated';
        if (status === 'triaged') auditActionType = 'contact.triaged';
        else if (status === 'closed') auditActionType = 'contact.closed';
        else if (status === 'new') auditActionType = 'contact.reopened';

        await writeAuditLog({
          action_type: auditActionType,
          actor_user_id: userId,
          actor_email: userEmail || 'unknown@system',
          scope_type: 'contact',
          target_id: message_id,
          target_label: beforeMessage?.subject || 'Contact message',
          details_json: {
            status_before: statusBefore,
            status_after: status || statusBefore,
            steward_note: steward_note || null,
            sender_name: beforeMessage?.name,
            sender_email: beforeMessage?.email
          }
        });

        return Response.json({ success: true, message: data }, { headers: corsHeaders });
      }

      case 'get_message': {
        if (!isSteward()) {
          return Response.json({ success: false, error: 'unauthorized', detail: 'Steward access required' }, { headers: corsHeaders, status: 403 });
        }

        const { message_id } = body;

        if (!message_id) {
          return Response.json({ success: false, error: 'validation_error', detail: 'Message ID is required' }, { headers: corsHeaders, status: 400 });
        }

        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .eq('id', message_id)
          .single();

        if (error) {
          return Response.json({ success: false, error: 'database_error', detail: error.message }, { headers: corsHeaders, status: 500 });
        }

        return Response.json({ success: true, message: data }, { headers: corsHeaders });
      }

      default:
        return Response.json({
          success: false,
          error: 'invalid_action',
          detail: 'Unknown action',
          version: VERSION,
          available_actions: ['submit_message', 'list_messages', 'update_message', 'get_message']
        }, { headers: corsHeaders, status: 400 });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return Response.json({ success: false, error: 'server_error', detail: 'An unexpected error occurred' }, { headers: corsHeaders, status: 500 });
  }
});
