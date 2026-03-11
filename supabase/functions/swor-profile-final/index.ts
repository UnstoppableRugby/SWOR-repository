// SWOR Individual Profile Persistence v3.2
// Robust template matching swor-auth v2.4:
// 1. OPTIONS handled immediately
// 2. Global try/catch so function NEVER hangs
// 3. PROJECT_URL ?? SUPABASE_URL env var fallback
// 4. Plain fetch (matching working swor-auth pattern)
const VERSION = '3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_PHOTO_MB = 5; const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;
const MAX_ARCHIVE_MB = 8; const MAX_ARCHIVE_BYTES = MAX_ARCHIVE_MB * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_ARCHIVE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const PRODUCTION_BASE_URL = 'https://smallworldofrugby.com';
const GLOBAL_STEWARD_EMAILS = ['alun@adesignbranding.co.za', 'steward@swor.com', 'admin@swor.com', 'test@example.com'];
const REQUIRED_CONFIRM_PHRASE = 'RESET THIS PROFILE';

function json(status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
function successResponse(data: object) { return json(200, { success: true, version: VERSION, ...data }); }
function errorResponse(error: string, detail: string | null = null, status = 500) { return json(status, { success: false, version: VERSION, error, detail }); }
function isValidUUID(s: string | null | undefined): boolean { return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s); }
function b64ToBytes(b64: string): Uint8Array { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function photoStoragePath(uid: string, fn: string): string { return `profiles/${uid}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fn.replace(/[^a-zA-Z0-9.-]/g, '_')}`; }
function archiveStoragePath(pid: string, fn: string): string { return `archive/${pid}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fn.replace(/[^a-zA-Z0-9.-]/g, '_')}`; }

async function dbQuery(baseUrl: string, key: string, table: string, method: string, body?: object, query?: string): Promise<{ data: any; error: string | null }> {
  const url = `${baseUrl}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers: Record<string, string> = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
  if (method === 'POST' || method === 'PATCH') headers['Prefer'] = 'return=representation';
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    if (!res.ok) return { data: null, error: `HTTP ${res.status}: ${text}` };
    let data = null;
    if (text && text.trim()) { try { data = JSON.parse(text); } catch { if ((method === 'PATCH' || method === 'DELETE') && (res.status === 200 || res.status === 204)) return { data: [], error: null }; return { data: null, error: 'JSON parse error' }; } }
    else if ((method === 'PATCH' || method === 'DELETE') && (res.status === 200 || res.status === 204)) return { data: [], error: null };
    return { data, error: null };
  } catch (e) { return { data: null, error: `Fetch error: ${String(e)}` }; }
}

async function storageUpload(baseUrl: string, key: string, bucket: string, path: string, bytes: Uint8Array, contentType: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': contentType }, body: bytes });
    if (!res.ok) { const t = await res.text(); return { error: `HTTP ${res.status}: ${t}` }; }
    return { error: null };
  } catch (e) { return { error: `Upload error: ${String(e)}` }; }
}

async function createSignedUrl(baseUrl: string, key: string, bucket: string, path: string, expiresIn = 3600): Promise<{ signedUrl: string | null; error: string | null }> {
  try {
    const res = await fetch(`${baseUrl}/storage/v1/object/sign/${bucket}/${path}`, { method: 'POST', headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn }) });
    if (!res.ok) { const t = await res.text(); return { signedUrl: null, error: `HTTP ${res.status}: ${t}` }; }
    const d = await res.json(); const sp = d.signedURL || d.signedUrl;
    return sp ? { signedUrl: `${baseUrl}/storage/v1${sp}`, error: null } : { signedUrl: null, error: 'No signed URL' };
  } catch (e) { return { signedUrl: null, error: `SignedUrl error: ${String(e)}` }; }
}

async function logAudit(bu: string, k: string, et: string, eid: string, a: string, aid?: string, an?: string, d?: object) { try { await dbQuery(bu, k, 'swor_audit_log', 'POST', { entity_type: et, entity_id: eid, action: a, actor_user_id: aid || null, actor_name: an || null, details: d || null }); } catch (_) {} }
async function writeStewardAudit(bu: string, k: string, e: { action_type: string; actor_user_id?: string | null; actor_email: string; scope_type: string; target_id?: string | null; target_label?: string | null; details_json?: any }) { try { await dbQuery(bu, k, 'steward_audit_log', 'POST', { action_type: e.action_type, actor_user_id: e.actor_user_id || null, actor_email: e.actor_email || 'unknown@system', scope_type: e.scope_type, target_id: e.target_id || null, target_label: e.target_label || null, details_json: e.details_json || null }); } catch (_) {} }

async function resolveStewardEmail(bu: string, k: string, sid?: string, sn?: string): Promise<string> {
  if (sid && isValidUUID(sid)) { const r = await dbQuery(bu, k, 'profiles', 'GET', undefined, `user_id=eq.${sid}&select=email&limit=1`); if (r.data?.[0]?.email) return r.data[0].email; }
  return sn || 'unknown@system';
}

async function checkIsGlobalSteward(bu: string, k: string, uid?: string, ue?: string): Promise<{ isGlobal: boolean; email: string }> {
  let email = ue || '';
  if (uid && isValidUUID(uid) && !email) { const r = await dbQuery(bu, k, 'profiles', 'GET', undefined, `user_id=eq.${uid}&select=email,role&limit=1`); if (r.data?.[0]?.email) email = r.data[0].email; if (r.data?.[0]?.role === 'admin' || r.data?.[0]?.role === 'steward') return { isGlobal: true, email: email || 'unknown@system' }; }
  if (email && GLOBAL_STEWARD_EMAILS.includes(email.toLowerCase())) return { isGlobal: true, email };
  return { isGlobal: false, email: email || 'unknown@system' };
}

async function checkIsStewardForProfile(bu: string, k: string, pid: string, uid?: string, ue?: string): Promise<{ isSteward: boolean; isGlobal: boolean; email: string }> {
  const gc = await checkIsGlobalSteward(bu, k, uid, ue);
  if (gc.isGlobal) return { isSteward: true, isGlobal: true, email: gc.email };
  if (uid && isValidUUID(uid)) { const r = await dbQuery(bu, k, 'steward_assignments', 'GET', undefined, `profile_id=eq.${pid}&steward_user_id=eq.${uid}&is_active=eq.true&select=id`); if ((r.data?.length || 0) > 0) return { isSteward: true, isGlobal: false, email: gc.email }; }
  return { isSteward: false, isGlobal: false, email: gc.email };
}

async function checkProfileAccess(bu: string, k: string, pid: string, uid?: string): Promise<{ isOwner: boolean; isSteward: boolean; profile: any }> {
  const pr = await dbQuery(bu, k, 'individual_profiles', 'GET', undefined, `id=eq.${pid}&select=*`);
  const p = pr.data?.[0]; if (!p) return { isOwner: false, isSteward: false, profile: null };
  const isOwner = uid ? p.user_id === uid : false; let isSteward = false;
  if (uid) { const sr = await dbQuery(bu, k, 'steward_assignments', 'GET', undefined, `profile_id=eq.${pid}&steward_user_id=eq.${uid}&is_active=eq.true&select=id`); isSteward = (sr.data?.length || 0) > 0; }
  return { isOwner, isSteward, profile: p };
}

async function triggerNotification(bu: string, k: string, na: string, np: any): Promise<void> {
  try { await fetch(`${bu}/functions/v1/swor-notifications`, { method: 'POST', headers: { 'apikey': k, 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: na, payload: np }) }); } catch (_) {}
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Only POST accepted', 405);
    const baseUrl = Deno.env.get('PROJECT_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!baseUrl || !serviceKey) return errorResponse('config_error', `Missing env. url=${!!baseUrl}, key=${!!serviceKey}`, 500);

    const body = await req.json();
    const { action, payload } = body;
    if (!action) return errorResponse('missing_action', 'Action required', 400);

    if (action === 'search_profiles_for_assignment') {
      const { query: sq, limit: sl, user_id, user_email } = payload || {};
      const { isGlobal } = await checkIsGlobalSteward(baseUrl, serviceKey, user_id, user_email);
      if (!isGlobal) return errorResponse('forbidden', 'Only global stewards', 403);
      if (!sq?.trim()) return successResponse({ action, profiles: [], count: 0 });
      const eq = encodeURIComponent(`%${sq.trim()}%`); const mx = Math.min(sl || 20, 50);
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `or=(full_name.ilike.${eq},known_as.ilike.${eq},title.ilike.${eq})&select=id,full_name,known_as,title,country,era,roles,status&order=full_name.asc.nullslast&limit=${mx}`);
      if (r.error) return errorResponse('search_error', r.error, 500);
      return successResponse({ action, profiles: (r.data || []).map((p: any) => ({ profile_id: p.id, profile_name: p.known_as || p.full_name || p.title || 'Unnamed', full_name: p.full_name, known_as: p.known_as, title: p.title, country: p.country, era: p.era, roles: p.roles, status: p.status })), count: (r.data || []).length });
    }

    if (action === 'get_profile_review_history') {
      const { profile_id } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const ar = await dbQuery(baseUrl, serviceKey, 'steward_audit_log', 'GET', undefined, `target_id=eq.${profile_id}&select=*&order=created_at.desc&limit=50`);
      const lr = await dbQuery(baseUrl, serviceKey, 'swor_audit_log', 'GET', undefined, `entity_id=eq.${profile_id}&entity_type=eq.profile&select=*&order=created_at.desc&limit=50`);
      const se = (ar.data || []).map((e: any) => ({ id: e.id, created_at: e.created_at, action_type: e.action_type, actor_email: e.actor_email, source: 'steward_audit' }));
      const le = (lr.data || []).map((e: any) => ({ id: e.id, created_at: e.created_at, action_type: e.action, actor_email: e.actor_name || 'system', source: 'legacy_audit' }));
      const all = [...se, ...le].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return successResponse({ action, profile_id, entries: all, count: all.length });
    }

    if (action === 'reset_profile') {
      const { profile_id, user_id, user_email, reset_mode = 'soft', reason, reason_code, reason_note, confirm_phrase } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      if (confirm_phrase !== REQUIRED_CONFIRM_PHRASE) return errorResponse('confirmation_failed', `Type "${REQUIRED_CONFIRM_PHRASE}"`, 400);
      if (reset_mode !== 'soft' && reset_mode !== 'hard') return errorResponse('validation_error', 'soft or hard', 422);
      const { isSteward, email: ae } = await checkIsStewardForProfile(baseUrl, serviceKey, profile_id, user_id, user_email);
      if (!isSteward) return errorResponse('forbidden', 'Only stewards', 403);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=*`);
      if (!pr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const p = pr.data[0]; const pn = p.known_as || p.full_name || p.title || 'Unknown'; const now = new Date().toISOString();
      const counts: Record<string, number> = { archive_items_affected: 0, commendations_affected: 0, milestones_affected: 0, cleanup_queue_count: 0 };
      if (reset_mode === 'soft') {
        await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { status: 'draft', introduction: null, summary: null, core_journey: null, reflections_influences: null, archive_media: null, connections_acknowledgements: null, optional_additions: null, submitted_at: null, approved_at: null, steward_note: null, steward_note_by: null, steward_note_at: null, featured_image_id: null, updated_at: now }, `id=eq.${profile_id}`);
        const air = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `profile_id=eq.${profile_id}&status=neq.archived&select=id`);
        if ((air.data || []).length > 0) { await dbQuery(baseUrl, serviceKey, 'archive_items', 'PATCH', { status: 'archived', visibility: 'private_draft', updated_at: now }, `profile_id=eq.${profile_id}&status=neq.archived`); counts.archive_items_affected = air.data.length; }
        const cr = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, `profile_id=eq.${profile_id}&status=neq.archived&select=id`);
        if ((cr.data || []).length > 0) { await dbQuery(baseUrl, serviceKey, 'commendations', 'PATCH', { status: 'archived', updated_at: now }, `profile_id=eq.${profile_id}&status=neq.archived`); counts.commendations_affected = cr.data.length; }
        const mr = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `profile_id=eq.${profile_id}&select=id`); counts.milestones_affected = (mr.data || []).length;
      } else {
        const air = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `profile_id=eq.${profile_id}&select=id,storage_path,thumb_path`);
        const ai = air.data || []; counts.archive_items_affected = ai.length;
        for (const i of ai) { if (i.storage_path) { await dbQuery(baseUrl, serviceKey, 'storage_cleanup_queue', 'POST', { profile_id, storage_path: i.storage_path, bucket: 'swor-uploads', status: 'queued' }); counts.cleanup_queue_count++; } if (i.thumb_path) { await dbQuery(baseUrl, serviceKey, 'storage_cleanup_queue', 'POST', { profile_id, storage_path: i.thumb_path, bucket: 'swor-uploads', status: 'queued' }); counts.cleanup_queue_count++; } }
        if (ai.length > 0) await dbQuery(baseUrl, serviceKey, 'archive_items', 'DELETE', undefined, `profile_id=eq.${profile_id}`);
        const cr = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, `profile_id=eq.${profile_id}&select=id`); counts.commendations_affected = (cr.data || []).length;
        if (counts.commendations_affected > 0) await dbQuery(baseUrl, serviceKey, 'commendations', 'DELETE', undefined, `profile_id=eq.${profile_id}`);
        const mr = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `profile_id=eq.${profile_id}&select=id`); counts.milestones_affected = (mr.data || []).length;
        if (counts.milestones_affected > 0) await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'DELETE', undefined, `profile_id=eq.${profile_id}`);
        if (p.photo_url) { await dbQuery(baseUrl, serviceKey, 'storage_cleanup_queue', 'POST', { profile_id, storage_path: p.photo_url, bucket: 'swor-uploads', status: 'queued' }); counts.cleanup_queue_count++; }
        await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { status: 'draft', introduction: null, summary: null, core_journey: null, reflections_influences: null, archive_media: null, connections_acknowledgements: null, optional_additions: null, photo_url: null, photo_alt_text: null, photo_status: null, featured_image_id: null, submitted_at: null, approved_at: null, steward_note: null, steward_note_by: null, steward_note_at: null, updated_at: now }, `id=eq.${profile_id}`);
      }
      await dbQuery(baseUrl, serviceKey, 'profile_reset_log', 'POST', { profile_id, reset_mode, requested_by: user_id || null, requested_by_email: ae, reason: reason_code?.trim() ? JSON.stringify({ reason_code: reason_code.trim(), reason: reason?.trim() }) : (reason?.trim() || null), counts_json: counts });
      await writeStewardAudit(baseUrl, serviceKey, { action_type: `profile.reset.${reset_mode}`, actor_user_id: user_id || null, actor_email: ae, scope_type: 'profile', target_id: profile_id, target_label: pn, details_json: { reset_mode, counts, profile_status_before: p.status } });
      return successResponse({ action, reset_mode, profile_id, profile_name: pn, profile_status: 'draft', counts, reset_at: now });
    }

    if (action === 'get_profile_reset_history') {
      const { profile_id, user_id, user_email } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const { isSteward } = await checkIsStewardForProfile(baseUrl, serviceKey, profile_id, user_id, user_email);
      if (!isSteward) return errorResponse('forbidden', 'Only stewards', 403);
      const r = await dbQuery(baseUrl, serviceKey, 'profile_reset_log', 'GET', undefined, `profile_id=eq.${profile_id}&select=*&order=created_at.desc&limit=20`);
      return successResponse({ action, profile_id, resets: r.data || [], count: (r.data || []).length });
    }

    if (action === 'get_milestones') {
      const { profile_id, user_id, include_drafts } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const { isOwner, isSteward, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      const csd = isOwner || isSteward || include_drafts;
      if (p.status !== 'approved' && !csd) return successResponse({ action, profile_id, milestones: [], count: 0 });
      const r = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `profile_id=eq.${profile_id}&select=*&order=display_order.asc.nullsfirst,created_at.asc`);
      if (r.error) return errorResponse('fetch_error', r.error, 500);
      const ms = await Promise.all((r.data || []).map(async (m: any) => {
        let pu = null; if (m.optional_photo_archive_item_id) { const pr2 = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${m.optional_photo_archive_item_id}&select=storage_path,status`); const ph = pr2.data?.[0]; if (ph?.storage_path && (ph.status === 'approved' || csd)) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', ph.storage_path, 600); pu = ur.signedUrl; } }
        return { id: m.id, title: m.title, approx_date: m.approx_date, description: m.description, optional_photo_archive_item_id: m.optional_photo_archive_item_id, optional_linked_entity_ids: m.optional_linked_entity_ids || [], display_order: m.display_order, photo_url: pu, created_at: m.created_at, updated_at: m.updated_at };
      }));
      return successResponse({ action, profile_id, milestones: ms, count: ms.length, can_edit: isOwner || isSteward });
    }

    if (action === 'create_milestone') {
      const { profile_id, user_id, title, approx_date, description, optional_photo_archive_item_id, optional_linked_entity_ids } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      if (!title?.trim()) return errorResponse('validation_error', 'Title required', 422);
      const { isOwner, isSteward, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      if (!isOwner && !isSteward) return errorResponse('forbidden', 'Forbidden', 403);
      if (p.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted for review', 422);
      const or = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `profile_id=eq.${profile_id}&select=display_order&order=display_order.desc&limit=1`);
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'POST', { profile_id, title: title.trim(), approx_date: approx_date || null, description: description || null, optional_photo_archive_item_id: optional_photo_archive_item_id || null, optional_linked_entity_ids: optional_linked_entity_ids || [], display_order: (or.data?.[0]?.display_order || 0) + 1, created_at: now, updated_at: now });
      if (r.error) return errorResponse('save_error', r.error, 500);
      return successResponse({ action, milestone: r.data?.[0], created_at: now });
    }

    if (action === 'update_milestone') {
      const { profile_id, user_id, milestone_id, title, approx_date, description, optional_photo_archive_item_id, optional_linked_entity_ids } = payload || {};
      if (!milestone_id || !isValidUUID(milestone_id)) return errorResponse('validation_error', 'Valid milestone_id required', 422);
      const mr = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `id=eq.${milestone_id}&select=*`);
      if (!mr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const { isOwner, isSteward, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id || mr.data[0].profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      if (!isOwner && !isSteward) return errorResponse('forbidden', 'Forbidden', 403);
      if (p.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted', 422);
      const now = new Date().toISOString(); const ud: Record<string, any> = { updated_at: now };
      if (title !== undefined) ud.title = title?.trim() || mr.data[0].title; if (approx_date !== undefined) ud.approx_date = approx_date;
      if (description !== undefined) ud.description = description; if (optional_photo_archive_item_id !== undefined) ud.optional_photo_archive_item_id = optional_photo_archive_item_id;
      if (optional_linked_entity_ids !== undefined) ud.optional_linked_entity_ids = optional_linked_entity_ids;
      const r = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'PATCH', ud, `id=eq.${milestone_id}`);
      if (r.error) return errorResponse('update_error', r.error, 500);
      return successResponse({ action, milestone_id, updated_at: now });
    }

    if (action === 'delete_milestone') {
      const { profile_id, user_id, milestone_id } = payload || {};
      if (!milestone_id || !isValidUUID(milestone_id)) return errorResponse('validation_error', 'Valid milestone_id required', 422);
      const mr = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `id=eq.${milestone_id}&select=*`);
      if (!mr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const { isOwner, isSteward, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id || mr.data[0].profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      if (!isOwner && !isSteward) return errorResponse('forbidden', 'Forbidden', 403);
      if (p.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted', 422);
      const r = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'DELETE', undefined, `id=eq.${milestone_id}`);
      if (r.error) return errorResponse('delete_error', r.error, 500);
      return successResponse({ action, milestone_id, deleted: true });
    }

    if (action === 'reorder_milestones') {
      const { profile_id, user_id, ordered_milestone_ids } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      if (!Array.isArray(ordered_milestone_ids) || !ordered_milestone_ids.length) return errorResponse('validation_error', 'ordered_milestone_ids required', 422);
      const { isOwner, isSteward, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      if (!isOwner && !isSteward) return errorResponse('forbidden', 'Forbidden', 403);
      const now = new Date().toISOString();
      for (let i = 0; i < ordered_milestone_ids.length; i++) await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'PATCH', { display_order: i + 1, updated_at: now }, `id=eq.${ordered_milestone_ids[i]}&profile_id=eq.${profile_id}`);
      return successResponse({ action, profile_id, reordered_count: ordered_milestone_ids.length, updated_at: now });
    }

    if (action === 'set_featured_image') {
      const { profile_id, user_id, image_id, is_steward } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const { isOwner, isSteward: as2, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      if (!isOwner && !as2 && !is_steward) return errorResponse('forbidden', 'Forbidden', 403);
      if (image_id) { if (!isValidUUID(image_id)) return errorResponse('validation_error', 'Invalid image_id', 422); const ir = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${image_id}&profile_id=eq.${profile_id}&item_type=eq.image&select=id`); if (!ir.data?.[0]) return errorResponse('not_found', 'Image not found', 404); }
      const now = new Date().toISOString(); const prev = p.featured_image_id;
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { featured_image_id: image_id || null, updated_at: now }, `id=eq.${profile_id}`);
      if (r.error) return errorResponse('update_error', r.error, 500);
      return successResponse({ action, profile_id, featured_image_id: image_id || null, previous_image_id: prev, updated_at: now });
    }

    if (action === 'get_featured_image') {
      const { profile_id } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=featured_image_id`);
      if (!pr.data?.[0]?.featured_image_id) return successResponse({ action, profile_id, featured_image_id: null, featured_image_url: null });
      const ir = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${pr.data[0].featured_image_id}&select=*`);
      if (!ir.data?.[0]?.storage_path) return successResponse({ action, profile_id, featured_image_id: pr.data[0].featured_image_id, featured_image_url: null });
      const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', ir.data[0].storage_path, 3600);
      return successResponse({ action, profile_id, featured_image_id: pr.data[0].featured_image_id, featured_image_url: ur.signedUrl, featured_image: { id: ir.data[0].id, title: ir.data[0].title, caption: ir.data[0].caption } });
    }

    if (action === 'get_archive_items') {
      const { profile_id, user_id, is_steward } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const { isOwner, isSteward: as2, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      const ca = isOwner || as2 || is_steward;
      const sf = ca ? 'status=in.(draft,submitted_for_review,approved)' : 'status=eq.approved';
      const r = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `profile_id=eq.${profile_id}&${sf}&select=*&order=display_order.asc.nullsfirst,created_at.asc`);
      if (r.error) return errorResponse('fetch_error', r.error, 500);
      const items = await Promise.all((r.data || []).map(async (i: any) => {
        let su = null; let tu = null;
        if (i.storage_path) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', i.storage_path, 600); su = ur.signedUrl; }
        if (i.thumb_path) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', i.thumb_path, 600); tu = ur.signedUrl; }
        return { ...i, tags: i.tags || [], is_featured: p.featured_image_id === i.id, signed_url: su, thumb_signed_url: tu };
      }));
      return successResponse({ action, profile_id, items, count: items.length, featured_image_id: p.featured_image_id, can_edit: ca, permissions: { is_owner: isOwner, is_steward: as2 || is_steward } });
    }

    if (action === 'reorder_archive_items') {
      const { profile_id, ordered_item_ids, user_id, is_steward } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      if (!Array.isArray(ordered_item_ids) || !ordered_item_ids.length) return errorResponse('validation_error', 'ordered_item_ids required', 422);
      const { isOwner, isSteward: as2, profile: p } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id);
      if (!p) return errorResponse('not_found', 'Not found', 404);
      if (!isOwner && !as2 && !is_steward) return errorResponse('forbidden', 'Forbidden', 403);
      const now = new Date().toISOString();
      for (let i = 0; i < ordered_item_ids.length; i++) await dbQuery(baseUrl, serviceKey, 'archive_items', 'PATCH', { display_order: i + 1, updated_at: now }, `id=eq.${ordered_item_ids[i]}&profile_id=eq.${profile_id}`);
      return successResponse({ action, profile_id, reordered_count: ordered_item_ids.length, updated_at: now });
    }

    if (action === 'get_profile') {
      const { user_id, profile_id } = payload || {};
      if (profile_id && isValidUUID(profile_id)) {
        const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=*`);
        if (r.error) return errorResponse('fetch_error', r.error, 500);
        if (!r.data?.[0]) return errorResponse('not_found', 'Not found', 404);
        const p = r.data[0]; let psu = null; let fiu = null;
        if (p.photo_url) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', p.photo_url, 3600); psu = ur.signedUrl; }
        if (p.featured_image_id) { const fr = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${p.featured_image_id}&select=storage_path`); if (fr.data?.[0]?.storage_path) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', fr.data[0].storage_path, 3600); fiu = ur.signedUrl; } }
        const sr = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'GET', undefined, `profile_id=eq.${profile_id}&is_active=eq.true&select=*`);
        const cr = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, `profile_id=eq.${profile_id}&status=eq.approved&select=*&order=approved_at.desc.nullsfirst,created_at.desc`);
        const mr = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, `profile_id=eq.${profile_id}&select=id`);
        return successResponse({ action, profile: { ...p, photo_signed_url: psu, featured_image_url: fiu, milestone_count: mr.data?.length || 0 }, stewards: sr.data || [], commendations: cr.data || [] });
      }
      if (user_id && isValidUUID(user_id)) {
        const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `user_id=eq.${user_id}&order=updated_at.desc&select=*`);
        if (r.error) return errorResponse('fetch_error', r.error, 500);
        const ps = await Promise.all((r.data || []).slice(0, 5).map(async (p: any) => {
          let psu = null; let fiu = null;
          if (p.photo_url) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', p.photo_url, 3600); psu = ur.signedUrl; }
          if (p.featured_image_id) { const fr = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${p.featured_image_id}&select=storage_path`); if (fr.data?.[0]?.storage_path) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', fr.data[0].storage_path, 3600); fiu = ur.signedUrl; } }
          return { ...p, photo_signed_url: psu, featured_image_url: fiu };
        }));
        return successResponse({ action, profiles: ps, count: ps.length });
      }
      return errorResponse('validation_error', 'user_id or profile_id required', 422);
    }

    if (action === 'save_profile') {
      const { profile_id, user_id, full_name, known_as, title, introduction, summary, country, region, era, birth_year, roles, visibility_default, core_journey, reflections_influences, archive_media, connections_acknowledgements, optional_additions, is_autosave = false } = payload || {};
      if (!user_id || !isValidUUID(user_id)) return errorResponse('validation_error', 'Valid user_id required', 422);
      const now = new Date().toISOString(); const pd: Record<string, any> = { user_id, updated_at: now };
      if (full_name !== undefined) pd.full_name = full_name; if (known_as !== undefined) pd.known_as = known_as; if (title !== undefined) pd.title = title;
      if (introduction !== undefined) pd.introduction = introduction; if (summary !== undefined) pd.summary = summary; if (country !== undefined) pd.country = country;
      if (region !== undefined) pd.region = region; if (era !== undefined) pd.era = era; if (birth_year !== undefined) pd.birth_year = birth_year;
      if (roles !== undefined) pd.roles = roles; if (visibility_default !== undefined) pd.visibility_default = visibility_default;
      if (core_journey !== undefined) pd.core_journey = core_journey; if (reflections_influences !== undefined) pd.reflections_influences = reflections_influences;
      if (archive_media !== undefined) pd.archive_media = archive_media; if (connections_acknowledgements !== undefined) pd.connections_acknowledgements = connections_acknowledgements;
      if (optional_additions !== undefined) pd.optional_additions = optional_additions; if (is_autosave) pd.last_autosave_at = now;
      let result; let isNew = false;
      if (profile_id && isValidUUID(profile_id)) {
        const er = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=status`);
        if (er.data?.[0]?.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted for review', 422);
        result = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', pd, `id=eq.${profile_id}`);
      } else { pd.created_at = now; pd.status = 'draft'; isNew = true; result = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'POST', pd); }
      if (result.error) return errorResponse('save_error', result.error, 500);
      const sp = Array.isArray(result.data) ? result.data[0] : result.data;
      return successResponse({ action, profile_id: sp?.id || profile_id, is_new: isNew, is_autosave, saved_at: now });
    }

    if (action === 'submit_profile_for_review') {
      const { profile_id, user_id } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=*`);
      if (!pr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const p = pr.data[0];
      if (!(p.title?.trim()) && !(p.full_name?.trim())) return errorResponse('validation_error', 'Need title or name', 422);
      if (!(p.introduction?.trim())) return errorResponse('validation_error', 'Need introduction', 422);
      if (p.status === 'submitted_for_review') return errorResponse('invalid_state', 'Already submitted', 422);
      if (p.status === 'approved') return errorResponse('invalid_state', 'Already approved', 422);
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { status: 'submitted_for_review', submitted_at: now, updated_at: now, steward_note: null, steward_note_by: null, steward_note_at: null }, `id=eq.${profile_id}`);
      if (r.error) return errorResponse('submit_error', r.error, 500);
      const sr = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'GET', undefined, `profile_id=eq.${profile_id}&is_active=eq.true&select=steward_email,steward_name`);
      return successResponse({ action, profile_id, status: 'submitted_for_review', submitted_at: now, stewards_to_notify: (sr.data || []).filter((s: any) => s.steward_email).map((s: any) => ({ email: s.steward_email, name: s.steward_name })), profile_name: p.full_name || p.title });
    }

    if (action === 'withdraw_submission') {
      const { profile_id, user_id } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=status,user_id,full_name,title`);
      if (!pr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const p = pr.data[0];
      if (user_id && p.user_id !== user_id) return errorResponse('forbidden', 'Only owner', 403);
      if (p.status !== 'submitted_for_review') return errorResponse('invalid_state', 'Not submitted', 422);
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { status: 'draft', submitted_at: null, updated_at: now }, `id=eq.${profile_id}`);
      if (r.error) return errorResponse('withdraw_error', r.error, 500);
      return successResponse({ action, profile_id, status: 'draft', withdrawn_at: now });
    }

    if (action === 'get_submitted_profiles') {
      const { status_filter } = payload || {};
      let sc = 'status=eq.submitted_for_review';
      if (status_filter === 'approved') sc = 'status=eq.approved'; else if (status_filter === 'needs_changes') sc = 'status=eq.needs_changes'; else if (status_filter === 'all') sc = 'status=in.(submitted_for_review,approved,needs_changes)';
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `${sc}&select=*&order=submitted_at.desc.nullsfirst,created_at.desc&limit=100`);
      const enriched = await Promise.all((r.data || []).map(async (p: any) => { let psu = null; if (p.photo_url) { const ur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', p.photo_url, 3600); psu = ur.signedUrl; } return { ...p, photo_signed_url: psu }; }));
      const pr2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, 'status=eq.submitted_for_review&select=id');
      const ar2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, 'status=eq.approved&select=id');
      const nr2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, 'status=eq.needs_changes&select=id');
      return successResponse({ action, profiles: enriched, counts: { pending: pr2.data?.length || 0, approved: ar2.data?.length || 0, needs_changes: nr2.data?.length || 0 } });
    }

    if (action === 'request_changes') {
      const { profile_id, steward_note, steward_id, steward_name } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=*`);
      if (!pr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const p = pr.data[0]; if (p.status !== 'submitted_for_review') return errorResponse('invalid_state', 'Must be submitted', 422);
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { status: 'needs_changes', steward_note: steward_note || null, steward_note_by: steward_name || steward_id || 'Steward', steward_note_at: now, updated_at: now }, `id=eq.${profile_id}`);
      if (r.error) return errorResponse('update_error', r.error, 500);
      const ae = await resolveStewardEmail(baseUrl, serviceKey, steward_id, steward_name);
      await writeStewardAudit(baseUrl, serviceKey, { action_type: 'profile.needs_changes', actor_user_id: steward_id, actor_email: ae, scope_type: 'profile', target_id: profile_id, target_label: p.full_name || p.title || 'Unknown', details_json: { steward_note } });
      return successResponse({ action, profile_id, status: 'needs_changes', steward_note, updated_at: now });
    }

    if (action === 'approve_profile') {
      const { profile_id, steward_id, steward_name } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=*`);
      if (!pr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const p = pr.data[0]; if (p.status !== 'submitted_for_review' && p.status !== 'needs_changes') return errorResponse('invalid_state', 'Must be submitted or needs changes', 422);
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { status: 'approved', approved_at: now, updated_at: now, photo_status: 'approved', steward_note: null, steward_note_by: null, steward_note_at: null }, `id=eq.${profile_id}`);
      if (r.error) return errorResponse('approve_error', r.error, 500);
      const ae = await resolveStewardEmail(baseUrl, serviceKey, steward_id, steward_name);
      await writeStewardAudit(baseUrl, serviceKey, { action_type: 'profile.approved', actor_user_id: steward_id, actor_email: ae, scope_type: 'profile', target_id: profile_id, target_label: p.full_name || p.title || 'Unknown', details_json: { status_before: p.status } });
      return successResponse({ action, profile_id, status: 'approved', approved_at: now });
    }

    if (action === 'get_pending_commendations') {
      const { status_filter } = payload || {};
      let sc = 'status=eq.submitted_for_review';
      if (status_filter === 'approved') sc = 'status=eq.approved'; else if (status_filter === 'rejected') sc = 'status=eq.rejected'; else if (status_filter === 'all') sc = 'status=in.(submitted_for_review,approved,rejected)';
      const r = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, `${sc}&select=*&order=created_at.desc&limit=100`);
      if (r.error) return errorResponse('fetch_error', r.error, 500);
      const enriched = await Promise.all((r.data || []).map(async (c: any) => {
        let rn = 'Unknown'; let ruid = null;
        if (c.profile_id && isValidUUID(c.profile_id)) { const pr2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${c.profile_id}&select=full_name,known_as,title,user_id`); const p = pr2.data?.[0]; if (p) { rn = p.known_as || p.full_name || p.title || 'Unknown'; ruid = p.user_id; } }
        return { ...c, recipient_name: rn, recipient_user_id: ruid };
      }));
      const pr2 = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, 'status=eq.submitted_for_review&select=id');
      const ar2 = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, 'status=eq.approved&select=id');
      const rr2 = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, 'status=eq.rejected&select=id');
      return successResponse({ action, commendations: enriched, counts: { pending: pr2.data?.length || 0, approved: ar2.data?.length || 0, rejected: rr2.data?.length || 0 } });
    }

    if (action === 'review_commendation') {
      const { commendation_id, decision, rejection_reason, steward_id, steward_name } = payload || {};
      if (!commendation_id || !isValidUUID(commendation_id)) return errorResponse('validation_error', 'Valid commendation_id required', 422);
      if (!decision || !['approved', 'rejected'].includes(decision)) return errorResponse('validation_error', 'approved or rejected', 422);
      const cr = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, `id=eq.${commendation_id}&select=*`);
      if (!cr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const c = cr.data[0]; if (c.status !== 'submitted_for_review') return errorResponse('invalid_state', 'Must be submitted', 422);
      const now = new Date().toISOString();
      const ud: Record<string, any> = { status: decision, reviewed_by: steward_name || steward_id || 'Steward', reviewed_at: now, updated_at: now };
      if (decision === 'approved') ud.approved_at = now; if (decision === 'rejected' && rejection_reason) ud.rejection_reason = rejection_reason;
      const r = await dbQuery(baseUrl, serviceKey, 'commendations', 'PATCH', ud, `id=eq.${commendation_id}`);
      if (r.error) return errorResponse('update_error', r.error, 500);
      return successResponse({ action, commendation_id, decision, status: decision, updated_at: now });
    }

    if (action === 'get_commendations') {
      const { profile_id, status, include_all } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      let q = `profile_id=eq.${profile_id}&select=*&order=approved_at.desc.nullsfirst,created_at.desc`;
      if (status) q += `&status=eq.${status}`; else if (!include_all) q += '&status=eq.approved';
      const r = await dbQuery(baseUrl, serviceKey, 'commendations', 'GET', undefined, q);
      return successResponse({ action, profile_id, commendations: r.data || [] });
    }

    if (action === 'upload_archive_item') {
      const { profile_id, user_id, file_name, file_type, file_size, file_data, title, description, caption, date_approximate, visibility, source_attribution, tags } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      if (!file_name || !file_data) return errorResponse('validation_error', 'file_name and file_data required', 422);
      if (!title) return errorResponse('validation_error', 'title required', 422);
      if (!ALLOWED_ARCHIVE_TYPES.includes(file_type?.toLowerCase())) return errorResponse('validation_error', `Invalid type: ${file_type}`, 422);
      if (file_size && file_size > MAX_ARCHIVE_BYTES) return errorResponse('file_too_large', `Max ${MAX_ARCHIVE_MB}MB`, 413);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=status`);
      if (pr.data?.[0]?.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted', 422);
      const bytes = b64ToBytes(file_data); const sp = archiveStoragePath(profile_id, file_name);
      const ur = await storageUpload(baseUrl, serviceKey, 'swor-uploads', sp, bytes, file_type);
      if (ur.error) return errorResponse('upload_error', ur.error, 500);
      const now = new Date().toISOString(); const it = file_type?.startsWith('image/') ? 'image' : 'document';
      const or2 = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `profile_id=eq.${profile_id}&select=display_order&order=display_order.desc&limit=1`);
      const ir = await dbQuery(baseUrl, serviceKey, 'archive_items', 'POST', { profile_id, item_type: it, title, description: description || null, caption: caption || null, date_approximate: date_approximate || null, visibility: visibility || 'draft', source_attribution: source_attribution || null, tags: Array.isArray(tags) ? tags : null, storage_path: sp, mime_type: file_type, file_size, status: 'draft', display_order: (or2.data?.[0]?.display_order || 0) + 1, created_by: user_id || null, created_at: now, updated_at: now });
      if (ir.error) return errorResponse('save_error', ir.error, 500);
      const sur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', sp, 600);
      return successResponse({ action, item: { ...ir.data?.[0], signed_url: sur.signedUrl }, uploaded_at: now });
    }

    if (action === 'update_archive_item') {
      const { item_id, title, description, caption, date_approximate, visibility, source_attribution, tags, display_order, user_id } = payload || {};
      if (!item_id || !isValidUUID(item_id)) return errorResponse('validation_error', 'Valid item_id required', 422);
      const ir = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${item_id}&select=profile_id`);
      if (ir.data?.[0]) { const pr2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${ir.data[0].profile_id}&select=status`); if (pr2.data?.[0]?.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted', 422); }
      const now = new Date().toISOString(); const ud: Record<string, any> = { updated_at: now };
      if (title !== undefined) ud.title = title; if (description !== undefined) ud.description = description; if (caption !== undefined) ud.caption = caption;
      if (date_approximate !== undefined) ud.date_approximate = date_approximate; if (visibility !== undefined) ud.visibility = visibility;
      if (source_attribution !== undefined) ud.source_attribution = source_attribution; if (tags !== undefined) ud.tags = Array.isArray(tags) ? tags : null;
      if (display_order !== undefined) ud.display_order = display_order;
      const r = await dbQuery(baseUrl, serviceKey, 'archive_items', 'PATCH', ud, `id=eq.${item_id}`);
      if (r.error) return errorResponse('update_error', r.error, 500);
      return successResponse({ action, item_id, updated_at: now });
    }

    if (action === 'delete_archive_item') {
      const { item_id, user_id } = payload || {};
      if (!item_id || !isValidUUID(item_id)) return errorResponse('validation_error', 'Valid item_id required', 422);
      const ir = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, `id=eq.${item_id}&select=*`);
      if (ir.data?.[0]) {
        const pr2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${ir.data[0].profile_id}&select=status,featured_image_id`);
        if (pr2.data?.[0]?.status === 'submitted_for_review') return errorResponse('invalid_state', 'Submitted', 422);
        if (pr2.data?.[0]?.featured_image_id === item_id) await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { featured_image_id: null, updated_at: new Date().toISOString() }, `id=eq.${ir.data[0].profile_id}`);
      }
      const r = await dbQuery(baseUrl, serviceKey, 'archive_items', 'DELETE', undefined, `id=eq.${item_id}`);
      if (r.error) return errorResponse('delete_error', r.error, 500);
      return successResponse({ action, item_id, deleted: true });
    }

    if (action === 'upload_photo') {
      const { profile_id, user_id, file_name, file_type, file_size, file_data, alt_text } = payload || {};
      if (!user_id || !isValidUUID(user_id)) return errorResponse('validation_error', 'Valid user_id required', 422);
      if (!file_name || !file_data) return errorResponse('validation_error', 'file_name and file_data required', 422);
      if (!ALLOWED_PHOTO_TYPES.includes(file_type?.toLowerCase())) return errorResponse('validation_error', `Invalid type: ${file_type}`, 422);
      if (file_size && file_size > MAX_PHOTO_BYTES) return errorResponse('file_too_large', `Max ${MAX_PHOTO_MB}MB`, 413);
      const bytes = b64ToBytes(file_data); const sp = photoStoragePath(user_id, file_name);
      const ur = await storageUpload(baseUrl, serviceKey, 'swor-uploads', sp, bytes, file_type);
      if (ur.error) return errorResponse('upload_error', ur.error, 500);
      const now = new Date().toISOString();
      if (profile_id && isValidUUID(profile_id)) await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'PATCH', { photo_url: sp, photo_alt_text: alt_text || null, photo_status: 'draft', updated_at: now }, `id=eq.${profile_id}`);
      const sur = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', sp, 3600);
      return successResponse({ action, storage_path: sp, signed_url: sur.signedUrl, photo_status: 'draft', uploaded_at: now });
    }

    if (action === 'get_stewards') {
      const { profile_id } = payload || {};
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      const r = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'GET', undefined, `profile_id=eq.${profile_id}&is_active=eq.true&select=*&order=assigned_at.asc`);
      return successResponse({ action, profile_id, stewards: r.data || [] });
    }

    if (action === 'list_steward_assignments') {
      const { user_id, user_email, search, limit = 100, page = 1 } = payload || {};
      const { isGlobal } = await checkIsGlobalSteward(baseUrl, serviceKey, user_id, user_email);
      if (!isGlobal) return errorResponse('forbidden', 'Only global stewards', 403);
      const off = ((page || 1) - 1) * (limit || 100); const pl = Math.min(limit || 100, 200);
      const r = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'GET', undefined, `select=*&order=assigned_at.desc&limit=${pl}&offset=${off}`);
      if (r.error) return errorResponse('fetch_error', r.error, 500);
      const enriched = await Promise.all((r.data || []).map(async (a: any) => {
        let pn = 'Unknown';
        if (a.profile_id && isValidUUID(a.profile_id)) { const pr2 = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${a.profile_id}&select=full_name,known_as,title`); if (pr2.data?.[0]) pn = pr2.data[0].known_as || pr2.data[0].full_name || pr2.data[0].title || 'Unknown'; }
        return { assignment_id: a.id, profile_id: a.profile_id, profile_name: pn, steward_email: a.steward_email, steward_name: a.steward_name, is_active: a.is_active, assigned_at: a.assigned_at };
      }));
      let filtered = enriched;
      if (search?.trim()) { const q = search.toLowerCase().trim(); filtered = enriched.filter((a: any) => a.profile_name?.toLowerCase().includes(q) || a.steward_email?.toLowerCase().includes(q) || a.steward_name?.toLowerCase().includes(q)); }
      return successResponse({ action, assignments: filtered, total: filtered.length, page, limit: pl });
    }

    if (action === 'create_steward_assignment') {
      const { user_id, user_email, profile_id, steward_email, steward_name } = payload || {};
      const { isGlobal, email: ae } = await checkIsGlobalSteward(baseUrl, serviceKey, user_id, user_email);
      if (!isGlobal) return errorResponse('forbidden', 'Only global stewards', 403);
      if (!profile_id || !isValidUUID(profile_id)) return errorResponse('validation_error', 'Valid profile_id required', 422);
      if (!steward_email?.trim()) return errorResponse('validation_error', 'steward_email required', 422);
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, `id=eq.${profile_id}&select=id,full_name,known_as,title`);
      if (!pr.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const pn = pr.data[0].known_as || pr.data[0].full_name || pr.data[0].title || 'Unknown';
      const er = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'GET', undefined, `profile_id=eq.${profile_id}&steward_email=eq.${steward_email.trim().toLowerCase()}&is_active=eq.true&select=id`);
      if (er.data?.length > 0) return errorResponse('duplicate', 'Already exists', 409);
      const now = new Date().toISOString(); const rsn = steward_name?.trim() || steward_email.trim();
      const r = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'POST', { profile_id, steward_email: steward_email.trim().toLowerCase(), steward_name: rsn, steward_type: 'journey', assigned_by: user_id || null, assigned_by_email: ae, assigned_at: now, is_active: true, created_at: now, updated_at: now });
      if (r.error) return errorResponse('save_error', r.error, 500);
      await writeStewardAudit(baseUrl, serviceKey, { action_type: 'steward.assigned', actor_user_id: user_id, actor_email: ae, scope_type: 'system', target_id: profile_id, target_label: pn, details_json: { steward_email: steward_email.trim() } });
      try { await triggerNotification(baseUrl, serviceKey, 'steward_assigned', { steward_email: steward_email.trim().toLowerCase(), steward_name: rsn, profile_name: pn, profile_id, profile_url: `${PRODUCTION_BASE_URL}/people/${profile_id}` }); } catch (_) {}
      return successResponse({ action, assignment_id: r.data?.[0]?.id, profile_id, profile_name: pn, steward_email: steward_email.trim().toLowerCase(), created_at: now });
    }

    if (action === 'deactivate_steward_assignment') {
      const { user_id, user_email, assignment_id, note } = payload || {};
      const { isGlobal, email: ae } = await checkIsGlobalSteward(baseUrl, serviceKey, user_id, user_email);
      if (!isGlobal) return errorResponse('forbidden', 'Only global stewards', 403);
      if (!assignment_id || !isValidUUID(assignment_id)) return errorResponse('validation_error', 'Valid assignment_id required', 422);
      const ar = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'GET', undefined, `id=eq.${assignment_id}&select=*`);
      if (!ar.data?.[0]) return errorResponse('not_found', 'Not found', 404);
      const a = ar.data[0]; if (!a.is_active) return errorResponse('invalid_state', 'Already inactive', 422);
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'steward_assignments', 'PATCH', { is_active: false, deactivated_at: now, deactivation_note: note?.trim() || null, updated_at: now }, `id=eq.${assignment_id}`);
      if (r.error) return errorResponse('update_error', r.error, 500);
      return successResponse({ action, assignment_id, deactivated_at: now });
    }

    if (action === 'debug' || action === 'version_check') {
      const pr = await dbQuery(baseUrl, serviceKey, 'individual_profiles', 'GET', undefined, 'limit=1&select=id');
      const ar = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, 'limit=1&select=id');
      const mr = await dbQuery(baseUrl, serviceKey, 'journey_milestones', 'GET', undefined, 'limit=1&select=id');
      return successResponse({ version: VERSION, action: 'debug', timestamp: new Date().toISOString(), connectivity: { profiles: { ok: !pr.error, error: pr.error }, archive_items: { ok: !ar.error, error: ar.error }, milestones: { ok: !mr.error, error: mr.error } } });
    }

    return errorResponse('unknown_action', `Received: ${action}`, 400);
  } catch (err) {
    console.error(`[swor-profile v${VERSION}] Error:`, err);
    return json(500, { success: false, version: VERSION, error: 'server_error', detail: String(err) });
  }
});