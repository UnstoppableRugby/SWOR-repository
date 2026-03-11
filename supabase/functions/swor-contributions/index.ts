// SWOR Journey Contributions CRUD v2.2
// Robust template matching swor-auth v2.4:
// 1. OPTIONS handled immediately
// 2. Global try/catch so function NEVER hangs
// 3. PROJECT_URL ?? SUPABASE_URL env var fallback
// 4. Plain fetch (matching working swor-auth pattern)
const VERSION = '2.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function successResponse(data: object) {
  return json(200, { success: true, version: VERSION, ...data });
}

function errorResponse(error: string, detail: string | null = null, status = 500) {
  return json(status, { success: false, version: VERSION, error, detail });
}

async function dbQuery(
  baseUrl: string,
  key: string,
  table: string,
  method: string,
  body?: object,
  query?: string
): Promise<{ data: any; error: string | null }> {
  const url = `${baseUrl}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${text}` };
    }
    let data = null;
    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        if ((method === 'PATCH' || method === 'DELETE') && (res.status === 200 || res.status === 204)) {
          return { data: [], error: null };
        }
        return { data: null, error: 'JSON parse error' };
      }
    } else if ((method === 'PATCH' || method === 'DELETE') && (res.status === 200 || res.status === 204)) {
      return { data: [], error: null };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: `Fetch error: ${String(e)}` };
  }
}

async function logAudit(
  baseUrl: string, key: string, contributionId: string | null, journeyId: string,
  actorId: string | null, actorName: string | null, action: string,
  beforeSnapshot: any, afterSnapshot: any
) {
  try {
    await dbQuery(baseUrl, key, 'journey_contribution_audit', 'POST', {
      contribution_id: contributionId, journey_id: journeyId, actor_id: actorId,
      actor_name: actorName, action, before_snapshot: beforeSnapshot, after_snapshot: afterSnapshot,
    });
  } catch (err) { console.error('[Audit] Failed:', err); }
}

function mapJourneyType(ft: string): string {
  switch (ft) { case 'individual': return 'person'; case 'collective': return 'club'; case 'event': return 'event'; default: return 'person'; }
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 120);
}

async function ensureUniqueSlug(baseUrl: string, key: string, baseSlug: string): Promise<string> {
  let slug = baseSlug; let attempt = 0;
  while (attempt < 20) {
    const r = await dbQuery(baseUrl, key, 'journeys', 'GET', undefined, `slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
    if (r.error) break;
    if (Array.isArray(r.data) && r.data.length === 0) return slug;
    attempt++; slug = `${baseSlug}-${attempt + 1}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

async function findUserId(baseUrl: string, key: string, email: string): Promise<string | null> {
  if (!email) return null;
  const r = await dbQuery(baseUrl, key, 'users', 'GET', undefined, `email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
  if (r.error || !r.data) return null;
  const rows = Array.isArray(r.data) ? r.data : [r.data];
  return rows.length > 0 ? rows[0].id : null;
}

Deno.serve(async (req) => {
  // 1. HANDLE OPTIONS IMMEDIATELY
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  // 2. GLOBAL TRY/CATCH
  try {
    if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Only POST accepted', 405);

    // 3. ENV VAR FALLBACKS
    const baseUrl = Deno.env.get('PROJECT_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!baseUrl || !serviceKey) return errorResponse('config_error', `Missing env. url=${!!baseUrl}, key=${!!serviceKey}`, 500);

    const body = await req.json();
    const { action, payload } = body;
    if (!action) return errorResponse('missing_action', 'Action is required', 400);

    // ===================== GET APPROVED CONTRIBUTIONS =====================
    if (action === 'get_approved_contributions') {
      const { journey_id, visibility_filter } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id is required', 422);
      const qp = [`journey_id=eq.${encodeURIComponent(journey_id)}`, 'status=eq.approved', 'order=created_at.asc'];
      if (visibility_filter === 'public_only') qp.push('visibility=eq.public');
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, qp.join('&'));
      if (r.error) return errorResponse('db_error', r.error, 500);
      const all = r.data || [];
      const pub = all.filter((c: any) => { const v = c.visibility || 'public'; return v === 'public' || v === 'connections'; });
      const grouped: Record<string, any[]> = { text: [], moment: [], person: [], organisation: [], period: [], section_proposal: [], image: [], document: [], other: [] };
      for (const c of pub) { const t = c.type || 'other'; if (grouped[t]) grouped[t].push(c); else grouped.other.push(c); }
      const counts: Record<string, number> = {};
      for (const [k, items] of Object.entries(grouped)) { if ((items as any[]).length > 0) counts[k] = (items as any[]).length; }
      return successResponse({ contributions_by_type: grouped, all_contributions: pub, total_count: pub.length, counts });
    }

    // ===================== GET USER JOURNEYS =====================
    if (action === 'get_user_journeys') {
      const { user_id, user_email, role: fr, status: fs } = payload || {};
      if (!user_id && !user_email) return errorResponse('validation_error', 'user_id or user_email required', 422);
      const qp: string[] = [];
      if (user_id) qp.push(`user_id=eq.${encodeURIComponent(user_id)}`);
      else if (user_email) qp.push(`user_email=eq.${encodeURIComponent(user_email)}`);
      if (fr) qp.push(`role=eq.${encodeURIComponent(fr)}`);
      if (fs) qp.push(`status=eq.${encodeURIComponent(fs)}`);
      qp.push('order=last_edited_at.desc');
      const r = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'GET', undefined, qp.join('&'));
      if (r.error) return errorResponse('db_error', r.error, 500);
      const journeys = r.data || [];
      const jws = [];
      for (const j of journeys) {
        const jid = encodeURIComponent(j.journey_id);
        const pr = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `journey_id=eq.${jid}&status=eq.submitted_for_review&select=id`);
        const tr = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `journey_id=eq.${jid}&select=id`);
        const ar = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `journey_id=eq.${jid}&status=eq.approved&select=id`);
        const dr = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `journey_id=eq.${jid}&status=eq.draft&select=id`);
        jws.push({ ...j, stats: { pending_contributions: Array.isArray(pr.data) ? pr.data.length : 0, total_contributions: Array.isArray(tr.data) ? tr.data.length : 0, approved_contributions: Array.isArray(ar.data) ? ar.data.length : 0, draft_contributions: Array.isArray(dr.data) ? dr.data.length : 0 } });
      }
      return successResponse({ journeys: jws });
    }

    // ===================== CREATE USER JOURNEY =====================
    if (action === 'create_user_journey') {
      const { user_id, user_email, user_name, journey_id: rs, journey_name, journey_type, role: jr, status: js, cover_image, description, country, era } = payload || {};
      if (!user_id || !journey_name) return errorResponse('validation_error', 'user_id and journey_name required', 422);
      const bs = rs || generateSlug(journey_name);
      const slug = await ensureUniqueSlug(baseUrl, serviceKey, bs);
      const dt = mapJourneyType(journey_type || 'individual');
      const cbuid = await findUserId(baseUrl, serviceKey, user_email || '');
      const ji: any = { type: dt, title: journey_name, slug, canonical_status: false, visibility: 'private_draft', status: js || 'draft' };
      if (cbuid) ji.created_by = cbuid;
      const jres = await dbQuery(baseUrl, serviceKey, 'journeys', 'POST', ji);
      if (jres.error) return errorResponse('db_error', `Journey create failed: ${jres.error}`, 500);
      const jrec = Array.isArray(jres.data) ? jres.data[0] : jres.data;
      if (!jrec?.id) return errorResponse('db_error', 'No ID returned', 500);
      const jid = jrec.id;
      const uji = { user_id, user_email: user_email || '', user_name: user_name || null, journey_id: jid, journey_name, journey_type: journey_type || 'individual', role: jr || 'owner', status: js || 'draft', cover_image: cover_image || null, description: description || null, country: country || null, era: era || null, last_edited_at: new Date().toISOString() };
      const ujres = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'POST', uji);
      if (ujres.error) { await dbQuery(baseUrl, serviceKey, 'journeys', 'DELETE', undefined, `id=eq.${jid}`); return errorResponse('db_error', `user_journey create failed: ${ujres.error}`, 500); }
      const uj = Array.isArray(ujres.data) ? ujres.data[0] : ujres.data;
      await logAudit(baseUrl, serviceKey, null, jid, user_id, user_name, 'user_journey_created', null, { journey_name, slug, journeys_id: jid });
      return successResponse({ journey: uj, journeys_record: { id: jid, slug, type: dt } });
    }

    // ===================== UPDATE USER JOURNEY =====================
    if (action === 'update_user_journey') {
      const { id, journey_name, status: js, cover_image, description, country, era } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const ud: any = { last_edited_at: new Date().toISOString() };
      if (journey_name !== undefined) ud.journey_name = journey_name;
      if (js !== undefined) ud.status = js;
      if (cover_image !== undefined) ud.cover_image = cover_image;
      if (description !== undefined) ud.description = description;
      if (country !== undefined) ud.country = country;
      if (era !== undefined) ud.era = era;
      const r = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'PATCH', ud, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      const updated = Array.isArray(r.data) && r.data.length > 0 ? r.data[0] : { id, ...ud };
      if (updated.journey_id && (journey_name !== undefined || js !== undefined)) {
        const ju: any = { updated_at: new Date().toISOString() };
        if (journey_name !== undefined) ju.title = journey_name;
        if (js !== undefined) ju.status = js;
        await dbQuery(baseUrl, serviceKey, 'journeys', 'PATCH', ju, `id=eq.${updated.journey_id}`);
      }
      return successResponse({ journey: updated });
    }

    // ===================== DELETE USER JOURNEY =====================
    if (action === 'delete_user_journey') {
      const { id, actor_id, actor_name } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const br = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'GET', undefined, `id=eq.${id}`);
      const before = Array.isArray(br.data) && br.data.length > 0 ? br.data[0] : null;
      const r = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'DELETE', undefined, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      if (before?.journey_id) {
        const or = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'GET', undefined, `journey_id=eq.${encodeURIComponent(before.journey_id)}&select=id&limit=1`);
        if (Array.isArray(or.data) && or.data.length === 0) {
          await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'DELETE', undefined, `journey_id=eq.${encodeURIComponent(before.journey_id)}`);
          await dbQuery(baseUrl, serviceKey, 'journey_contribution_audit', 'DELETE', undefined, `journey_id=eq.${encodeURIComponent(before.journey_id)}`);
          await dbQuery(baseUrl, serviceKey, 'journeys', 'DELETE', undefined, `id=eq.${before.journey_id}`);
        }
      }
      if (before) await logAudit(baseUrl, serviceKey, null, before.journey_id, actor_id, actor_name, 'user_journey_deleted', { journey_name: before.journey_name }, null);
      return successResponse({ deleted: true });
    }

    // ===================== GET JOURNEY STATS =====================
    if (action === 'get_journey_stats') {
      const { journey_id } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id required', 422);
      const ar = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `journey_id=eq.${encodeURIComponent(journey_id)}&select=id,status,type,created_at,updated_at`);
      const c = Array.isArray(ar.data) ? ar.data : [];
      const stats = { total: c.length, draft: c.filter((x: any) => x.status === 'draft').length, submitted_for_review: c.filter((x: any) => x.status === 'submitted_for_review').length, approved: c.filter((x: any) => x.status === 'approved').length, rejected: c.filter((x: any) => x.status === 'rejected').length, by_type: {} as Record<string, number>, last_activity: c.length > 0 ? c.reduce((l: string, x: any) => (x.updated_at > l ? x.updated_at : l), c[0].updated_at) : null };
      for (const x of c) stats.by_type[x.type] = (stats.by_type[x.type] || 0) + 1;
      const sr = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'GET', undefined, `journey_id=eq.${encodeURIComponent(journey_id)}&select=user_name,user_email,role`);
      return successResponse({ stats, stewards: sr.data || [] });
    }

    // ===================== CREATE CONTRIBUTION =====================
    if (action === 'create_contribution') {
      const { journey_id, contributor_id, contributor_name, contributor_email, contributor_relationship, type, content, visibility, status, storage_path } = payload || {};
      if (!journey_id || !type) return errorResponse('validation_error', 'journey_id and type required', 422);
      const id2: any = { journey_id, contributor_id: contributor_id || null, contributor_name: contributor_name || null, contributor_email: contributor_email || null, contributor_relationship: contributor_relationship || null, type, content: content || {}, visibility: visibility || 'private_draft', status: status || 'draft', storage_path: storage_path || null };
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'POST', id2);
      if (r.error) return errorResponse('db_error', r.error, 500);
      const contrib = Array.isArray(r.data) ? r.data[0] : r.data;
      await dbQuery(baseUrl, serviceKey, 'user_journeys', 'PATCH', { last_edited_at: new Date().toISOString() }, `journey_id=eq.${encodeURIComponent(journey_id)}`);
      await logAudit(baseUrl, serviceKey, contrib?.id, journey_id, contributor_id, contributor_name, 'contribution_created', null, { type, visibility: id2.visibility, status: id2.status });
      return successResponse({ contribution: contrib });
    }

    // ===================== GET CONTRIBUTIONS =====================
    if (action === 'get_contributions') {
      const { journey_id, status: fs, type: ft, contributor_id: fc } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id required', 422);
      const qp = [`journey_id=eq.${encodeURIComponent(journey_id)}`];
      if (fs) qp.push(`status=eq.${encodeURIComponent(fs)}`);
      if (ft) qp.push(`type=eq.${encodeURIComponent(ft)}`);
      if (fc) qp.push(`contributor_id=eq.${encodeURIComponent(fc)}`);
      qp.push('order=created_at.desc');
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, qp.join('&'));
      if (r.error) return errorResponse('db_error', r.error, 500);
      return successResponse({ contributions: r.data || [] });
    }

    // ===================== UPDATE CONTRIBUTION =====================
    if (action === 'update_contribution') {
      const { id, content, visibility, status, type, contributor_relationship, actor_id, actor_name } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const br = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `id=eq.${id}`);
      if (br.error || !br.data || (Array.isArray(br.data) && br.data.length === 0)) return errorResponse('not_found', 'Not found', 404);
      const before = Array.isArray(br.data) ? br.data[0] : br.data;
      const ud: any = {};
      if (content !== undefined) ud.content = content; if (visibility !== undefined) ud.visibility = visibility;
      if (status !== undefined) ud.status = status; if (type !== undefined) ud.type = type;
      if (contributor_relationship !== undefined) ud.contributor_relationship = contributor_relationship;
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'PATCH', ud, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      await logAudit(baseUrl, serviceKey, id, before.journey_id, actor_id, actor_name, 'contribution_updated', { status: before.status }, { status: ud.status || before.status });
      return successResponse({ contribution: { ...before, ...ud } });
    }

    // ===================== SUBMIT FOR REVIEW =====================
    if (action === 'submit_for_review') {
      const { id, actor_id, actor_name } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const br = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `id=eq.${id}`);
      if (br.error || !br.data || (Array.isArray(br.data) && br.data.length === 0)) return errorResponse('not_found', 'Not found', 404);
      const before = Array.isArray(br.data) ? br.data[0] : br.data;
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'PATCH', { status: 'submitted_for_review' }, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      await logAudit(baseUrl, serviceKey, id, before.journey_id, actor_id, actor_name, 'contribution_submitted', { status: before.status }, { status: 'submitted_for_review' });
      return successResponse({ contribution: { ...before, status: 'submitted_for_review' } });
    }

    // ===================== APPROVE CONTRIBUTION =====================
    if (action === 'approve_contribution') {
      const { id, reviewer_id, reviewer_name } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const br = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `id=eq.${id}`);
      if (br.error || !br.data || (Array.isArray(br.data) && br.data.length === 0)) return errorResponse('not_found', 'Not found', 404);
      const before = Array.isArray(br.data) ? br.data[0] : br.data;
      const now = new Date().toISOString();
      const ud: any = { status: 'approved', reviewed_by: reviewer_id || reviewer_name, reviewed_at: now };
      if (before.visibility === 'private_draft') ud.visibility = 'public';
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'PATCH', ud, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      await logAudit(baseUrl, serviceKey, id, before.journey_id, reviewer_id, reviewer_name, 'contribution_approved', { status: before.status }, { status: 'approved' });
      return successResponse({ contribution: { ...before, ...ud } });
    }

    // ===================== REJECT CONTRIBUTION =====================
    if (action === 'reject_contribution') {
      const { id, reviewer_id, reviewer_name, rejection_note } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const br = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `id=eq.${id}`);
      if (br.error || !br.data || (Array.isArray(br.data) && br.data.length === 0)) return errorResponse('not_found', 'Not found', 404);
      const before = Array.isArray(br.data) ? br.data[0] : br.data;
      const now = new Date().toISOString();
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'PATCH', { status: 'rejected', rejection_note: rejection_note || null, reviewed_by: reviewer_id || reviewer_name, reviewed_at: now }, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      await logAudit(baseUrl, serviceKey, id, before.journey_id, reviewer_id, reviewer_name, 'contribution_rejected', { status: before.status }, { status: 'rejected' });
      return successResponse({ contribution: { ...before, status: 'rejected', rejection_note, reviewed_by: reviewer_id || reviewer_name, reviewed_at: now } });
    }

    // ===================== DELETE CONTRIBUTION =====================
    if (action === 'delete_contribution') {
      const { id, actor_id, actor_name } = payload || {};
      if (!id) return errorResponse('validation_error', 'id required', 422);
      const br = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, `id=eq.${id}`);
      if (br.error || !br.data || (Array.isArray(br.data) && br.data.length === 0)) return errorResponse('not_found', 'Not found', 404);
      const before = Array.isArray(br.data) ? br.data[0] : br.data;
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'DELETE', undefined, `id=eq.${id}`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      await logAudit(baseUrl, serviceKey, null, before.journey_id, actor_id, actor_name, 'contribution_deleted', { type: before.type, status: before.status }, null);
      return successResponse({ deleted: true });
    }

    // ===================== GET AUDIT LOG =====================
    if (action === 'get_contribution_audit') {
      const { journey_id } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id required', 422);
      const r = await dbQuery(baseUrl, serviceKey, 'journey_contribution_audit', 'GET', undefined, `journey_id=eq.${encodeURIComponent(journey_id)}&order=created_at.desc&limit=50`);
      if (r.error) return errorResponse('db_error', r.error, 500);
      return successResponse({ entries: r.data || [] });
    }

    // ===================== BATCH SAVE =====================
    if (action === 'batch_save') {
      const { journey_id, items, actor_id, actor_name } = payload || {};
      if (!journey_id || !items || !Array.isArray(items)) return errorResponse('validation_error', 'journey_id and items array required', 422);
      const results: any[] = []; const errors: any[] = [];
      for (const item of items) {
        try {
          if (item.id && !item.id.startsWith('temp_')) {
            const ur = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'PATCH', { content: item.content || {}, visibility: item.visibility || 'private_draft', type: item.type || 'text', status: item.status || 'draft' }, `id=eq.${item.id}`);
            if (ur.error) throw new Error(ur.error);
            results.push(Array.isArray(ur.data) && ur.data.length > 0 ? ur.data[0] : { id: item.id, ...item });
          } else {
            const ir = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'POST', { journey_id, contributor_id: actor_id || null, contributor_name: actor_name || null, type: item.type || 'text', content: item.content || {}, visibility: item.visibility || 'private_draft', status: item.status || 'draft' });
            if (ir.error) throw new Error(ir.error);
            results.push(Array.isArray(ir.data) ? ir.data[0] : ir.data);
          }
        } catch (err: any) { errors.push({ item_id: item.id, error: err.message }); }
      }
      await dbQuery(baseUrl, serviceKey, 'user_journeys', 'PATCH', { last_edited_at: new Date().toISOString() }, `journey_id=eq.${encodeURIComponent(journey_id)}`);
      await logAudit(baseUrl, serviceKey, null, journey_id, actor_id, actor_name, 'batch_save', { item_count: items.length }, { saved_count: results.length, error_count: errors.length });
      return successResponse({ saved: results, errors: errors.length > 0 ? errors : undefined, saved_count: results.length, error_count: errors.length });
    }

    // ===================== DEBUG =====================
    if (action === 'debug') {
      const tr = await dbQuery(baseUrl, serviceKey, 'journey_contributions', 'GET', undefined, 'limit=3');
      const ujr = await dbQuery(baseUrl, serviceKey, 'user_journeys', 'GET', undefined, 'limit=3');
      const jr = await dbQuery(baseUrl, serviceKey, 'journeys', 'GET', undefined, 'limit=3&select=id,slug,type,status');
      return successResponse({
        version: VERSION, timestamp: new Date().toISOString(),
        config: { baseUrl: baseUrl ? 'set' : 'missing', keyLength: serviceKey.length },
        db_test: { ok: !tr.error, count: Array.isArray(tr.data) ? tr.data.length : 0, error: tr.error },
        user_journeys_test: { ok: !ujr.error, count: Array.isArray(ujr.data) ? ujr.data.length : 0, error: ujr.error },
        journeys_test: { ok: !jr.error, count: Array.isArray(jr.data) ? jr.data.length : 0, error: jr.error },
      });
    }

    return errorResponse('unknown_action', `Unknown action: ${action}`, 400);
  } catch (err) {
    // 4. CATCH-ALL
    console.error(`[swor-contributions v${VERSION}] Error:`, err);
    return json(500, { success: false, version: VERSION, error: 'server_error', detail: String(err) });
  }
});