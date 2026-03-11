// SWOR File Upload v10.3 - Phase 5 Email Notifications Integration
const VERSION = '10.3';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'x-swor-edge-version': VERSION
};

// ========== FILE SIZE LIMITS ==========
const MAX_IMAGE_DOC_MB = 8;
const MAX_VIDEO_MB = 50;
const MAX_IMAGE_DOC_BYTES = MAX_IMAGE_DOC_MB * 1024 * 1024;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

// ========== ALLOWED FILE TYPES ==========
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ========== KNOWN GLOBAL STEWARDS (for demo/builder access) ==========
const KNOWN_GLOBAL_STEWARD_EMAILS = [
  'alun@adesignbranding.co.za',
];

function isKnownGlobalStewardEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return KNOWN_GLOBAL_STEWARD_EMAILS.some(
    e => e.toLowerCase() === email.toLowerCase()
  );
}

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify({ ...data, version: VERSION }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function errorResponse(error: string, detail: string | null = null, status = 500): Response {
  return jsonResponse({ success: false, error, detail }, status);
}

function successResponse(data: object): Response {
  return jsonResponse({ success: true, ...data });
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function itemType(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function isVideoType(mime: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mime.toLowerCase());
}

function storagePath(jid: string, fname: string): string {
  const ts = Date.now();
  const r = Math.random().toString(36).substring(2, 8);
  const safe = fname.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `journeys/${jid}/${ts}-${r}-${safe}`;
}

function thumbnailPath(videoPath: string): string {
  return videoPath.replace(/\.[^.]+$/, '_thumb.jpg');
}

function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidEmail(str: string | null | undefined): boolean {
  if (!str) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

function isValidUrl(str: string | null | undefined): { valid: boolean; error?: string } {
  if (!str) return { valid: false, error: 'URL is required' };
  const trimmed = str.trim();
  const unsafeSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  for (const scheme of unsafeSchemes) {
    if (lowerUrl.startsWith(scheme)) {
      return { valid: false, error: `Unsafe URL scheme: ${scheme}` };
    }
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: `Invalid URL protocol: ${url.protocol}` };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

function detectSourceType(url: string): string | null {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('wikipedia.org')) return 'wiki';
  if (lowerUrl.includes('archive.org')) return 'archive';
  if (lowerUrl.includes('bbc.co.uk') || lowerUrl.includes('bbc.com')) return 'news';
  if (lowerUrl.includes('theguardian.com')) return 'news';
  if (lowerUrl.includes('nytimes.com')) return 'news';
  if (lowerUrl.includes('reuters.com')) return 'news';
  return null;
}

function isEmbeddableSource(sourceType: string | null): boolean {
  const embeddableSources = ['youtube', 'vimeo'];
  return sourceType !== null && embeddableSources.includes(sourceType);
}

async function dbQuery(baseUrl: string, key: string, table: string, method: string, body?: object, query?: string): Promise<{ data: any; error: string | null; debug?: any }> {
  const url = `${baseUrl}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${text}`, debug: { url, method, status: res.status } };
    }
    let data = null;
    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        if ((method === 'PATCH' || method === 'DELETE') && (res.status === 200 || res.status === 204)) {
          return { data: [], error: null };
        }
        return { data: null, error: `JSON parse error: ${String(parseErr)}` };
      }
    } else if ((method === 'PATCH' || method === 'DELETE') && (res.status === 200 || res.status === 204)) {
      return { data: [], error: null };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: `Fetch error: ${String(e)}` };
  }
}

async function storageUpload(baseUrl: string, key: string, bucket: string, path: string, bytes: Uint8Array, contentType: string): Promise<{ error: string | null }> {
  const url = `${baseUrl}/storage/v1/object/${bucket}/${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': contentType
      },
      body: bytes
    });
    if (!res.ok) {
      const errText = await res.text();
      return { error: `HTTP ${res.status}: ${errText}` };
    }
    return { error: null };
  } catch (e) {
    return { error: `Fetch error: ${String(e)}` };
  }
}

async function createSignedUrl(baseUrl: string, key: string, bucket: string, path: string, expiresIn: number = 3600): Promise<{ signedUrl: string | null; error: string | null }> {
  const url = `${baseUrl}/storage/v1/object/sign/${bucket}/${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn })
    });
    if (!res.ok) {
      const errText = await res.text();
      return { signedUrl: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = await res.json();
    const signedPath = data.signedURL || data.signedUrl;
    if (signedPath) {
      return { signedUrl: `${baseUrl}/storage/v1${signedPath}`, error: null };
    }
    return { signedUrl: null, error: 'No signed URL in response' };
  } catch (e) {
    return { signedUrl: null, error: `Fetch error: ${String(e)}` };
  }
}

async function createSignedUploadUrl(baseUrl: string, key: string, bucket: string, path: string): Promise<{ signedUrl: string | null; token: string | null; error: string | null }> {
  const url = `${baseUrl}/storage/v1/object/upload/sign/${bucket}/${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const errText = await res.text();
      return { signedUrl: null, token: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = await res.json();
    const uploadUrl = data.url || data.signedURL || data.signedUrl;
    const token = data.token;
    if (uploadUrl) {
      const fullUrl = uploadUrl.startsWith('http') ? uploadUrl : `${baseUrl}/storage/v1${uploadUrl}`;
      return { signedUrl: fullUrl, token: token || null, error: null };
    }
    return { signedUrl: null, token: null, error: 'No upload URL in response' };
  } catch (e) {
    return { signedUrl: null, token: null, error: `Fetch error: ${String(e)}` };
  }
}

async function downloadFile(baseUrl: string, key: string, bucket: string, path: string): Promise<{ data: string | null; contentType: string | null; error: string | null }> {
  const url = `${baseUrl}/storage/v1/object/${bucket}/${path}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      return { data: null, contentType: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return { data: base64, contentType, error: null };
  } catch (e) {
    return { data: null, contentType: null, error: `Fetch error: ${String(e)}` };
  }
}

async function resolveJourneyId(baseUrl: string, key: string, journeyIdOrSlug: string): Promise<{ id: string | null; title: string | null; slug: string | null; debug: any }> {
  if (!journeyIdOrSlug) return { id: null, title: null, slug: null, debug: { reason: 'empty input' } };
  if (isValidUUID(journeyIdOrSlug)) {
    const result = await dbQuery(baseUrl, key, 'journeys', 'GET', undefined, `id=eq.${journeyIdOrSlug}&select=id,title,slug`);
    if (!result.error && Array.isArray(result.data) && result.data.length > 0) {
      return { id: result.data[0].id, title: result.data[0].title || null, slug: result.data[0].slug || null, debug: { method: 'uuid' } };
    }
  }
  const slugResult = await dbQuery(baseUrl, key, 'journeys', 'GET', undefined, `slug=eq.${encodeURIComponent(journeyIdOrSlug)}&select=id,title,slug`);
  if (!slugResult.error && Array.isArray(slugResult.data) && slugResult.data.length > 0) {
    return { id: slugResult.data[0].id, title: slugResult.data[0].title || null, slug: slugResult.data[0].slug || null, debug: { method: 'slug' } };
  }
  return { id: null, title: null, slug: null, debug: { reason: 'not found' } };
}

async function userExists(baseUrl: string, key: string, userId: string): Promise<boolean> {
  if (!isValidUUID(userId)) return false;
  const result = await dbQuery(baseUrl, key, 'users', 'GET', undefined, `id=eq.${userId}&select=id&limit=1`);
  return !result.error && Array.isArray(result.data) && result.data.length > 0;
}

async function getUserByEmail(baseUrl: string, key: string, email: string): Promise<{ user: any | null; error: string | null }> {
  if (!isValidEmail(email)) return { user: null, error: 'Invalid email format' };
  const result = await dbQuery(baseUrl, key, 'users', 'GET', undefined, `email=eq.${encodeURIComponent(email)}&select=id,email,display_name&limit=1`);
  if (result.error) return { user: null, error: result.error };
  if (Array.isArray(result.data) && result.data.length > 0) return { user: result.data[0], error: null };
  return { user: null, error: null };
}

async function createPlaceholderUser(baseUrl: string, key: string, email: string): Promise<{ user: any | null; error: string | null }> {
  if (!isValidEmail(email)) return { user: null, error: 'Invalid email format' };
  const result = await dbQuery(baseUrl, key, 'users', 'POST', {
    email: email.toLowerCase().trim(),
    display_name: email.split('@')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  if (result.error) return { user: null, error: result.error };
  const user = Array.isArray(result.data) ? result.data[0] : result.data;
  return { user, error: null };
}

async function ensureUserExists(baseUrl: string, key: string, authUserId: string, authUserEmail: string | null): Promise<{ userId: string; created: boolean; error: string | null }> {
  if (!isValidUUID(authUserId)) return { userId: '', created: false, error: 'Invalid auth user ID' };
  const existsById = await userExists(baseUrl, key, authUserId);
  if (existsById) return { userId: authUserId, created: false, error: null };
  const now = new Date().toISOString();
  const displayName = authUserEmail ? authUserEmail.split('@')[0] : 'User';
  const result = await dbQuery(baseUrl, key, 'users', 'POST', {
    id: authUserId,
    email: authUserEmail?.toLowerCase().trim() || null,
    display_name: displayName,
    created_at: now,
    updated_at: now
  });
  if (result.error) {
    if (result.error.includes('duplicate') || result.error.includes('conflict') || result.error.includes('23505')) {
      return { userId: authUserId, created: false, error: null };
    }
    return { userId: '', created: false, error: result.error };
  }
  return { userId: authUserId, created: true, error: null };
}

async function validateAuthToken(req: Request, baseUrl: string, anonKey: string): Promise<{ userId: string | null; userEmail: string | null; error: string | null; errorCode: string | null }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return { userId: null, userEmail: null, error: 'Authorization header is required', errorCode: 'auth_required' };
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { userId: null, userEmail: null, error: 'Invalid Authorization header format', errorCode: 'invalid_token' };
  }
  const token = parts[1];
  if (!token || token.length < 10) return { userId: null, userEmail: null, error: 'Invalid or empty token', errorCode: 'invalid_token' };
  const supabase = createClient(baseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return { userId: null, userEmail: null, error: `Token validation failed: ${error.message}`, errorCode: 'invalid_token' };
    if (!user) return { userId: null, userEmail: null, error: 'No user found for this token', errorCode: 'invalid_token' };
    if (!user.id || !isValidUUID(user.id)) return { userId: null, userEmail: null, error: 'Invalid user ID in token', errorCode: 'invalid_token' };
    return { userId: user.id, userEmail: user.email || null, error: null, errorCode: null };
  } catch (e) {
    return { userId: null, userEmail: null, error: `Token validation exception: ${String(e)}`, errorCode: 'invalid_token' };
  }
}

const ROLE_GLOBAL_STEWARD = 'global_steward';
const ROLE_STEWARD = 'steward';

async function checkStewardPermission(baseUrl: string, key: string, userId: string, journeyId: string | null): Promise<{ authorized: boolean; role: string | null; reason: string; debug?: any }> {
  if (!userId || !isValidUUID(userId)) return { authorized: false, role: null, reason: 'Invalid or missing user ID' };
  const rolesResult = await dbQuery(baseUrl, key, 'roles', 'GET', undefined, `user_id=eq.${userId}&role=in.(${ROLE_GLOBAL_STEWARD},${ROLE_STEWARD})&select=id,role,scope_type,scope_id`);
  if (rolesResult.error) return { authorized: false, role: null, reason: `Failed to query roles: ${rolesResult.error}` };
  const roles = rolesResult.data || [];
  const globalSteward = roles.find((r: any) => r.role === ROLE_GLOBAL_STEWARD && r.scope_type === 'site');
  if (globalSteward) return { authorized: true, role: ROLE_GLOBAL_STEWARD, reason: 'User has global_steward role' };
  if (journeyId) {
    const journeySteward = roles.find((r: any) => r.role === ROLE_STEWARD && r.scope_type === 'journey' && r.scope_id === journeyId);
    if (journeySteward) return { authorized: true, role: ROLE_STEWARD, reason: `User has steward role for journey ${journeyId}` };
  }
  return { authorized: false, role: null, reason: journeyId ? `User lacks steward role for journey ${journeyId}` : 'User lacks global_steward role' };
}

async function checkStewardPermissionByEmail(baseUrl: string, key: string, email: string): Promise<{ authorized: boolean; role: string | null; reason: string; userId: string | null }> {
  if (!email || !isValidEmail(email)) return { authorized: false, role: null, reason: 'Invalid or missing email', userId: null };
  if (!isKnownGlobalStewardEmail(email)) return { authorized: false, role: null, reason: `Email ${email} is not a known global steward`, userId: null };
  const userLookup = await getUserByEmail(baseUrl, key, email);
  if (userLookup.user) return { authorized: true, role: ROLE_GLOBAL_STEWARD, reason: `Email ${email} is a known global steward`, userId: userLookup.user.id };
  return { authorized: true, role: ROLE_GLOBAL_STEWARD, reason: `Email ${email} is a known global steward (demo access)`, userId: null };
}

async function isGlobalSteward(baseUrl: string, key: string, userId: string): Promise<{ isGlobal: boolean; roleId: string | null; reason: string }> {
  if (!userId || !isValidUUID(userId)) return { isGlobal: false, roleId: null, reason: 'Invalid or missing user ID' };
  const rolesResult = await dbQuery(baseUrl, key, 'roles', 'GET', undefined, `user_id=eq.${userId}&role=eq.${ROLE_GLOBAL_STEWARD}&scope_type=eq.site&select=id`);
  if (rolesResult.error) return { isGlobal: false, roleId: null, reason: `Failed to query roles: ${rolesResult.error}` };
  const roles = rolesResult.data || [];
  if (roles.length > 0) return { isGlobal: true, roleId: roles[0].id, reason: 'User has global_steward role' };
  return { isGlobal: false, roleId: null, reason: 'User does not have global_steward role' };
}

async function getDraftItem(baseUrl: string, key: string, itemId: string): Promise<{ item: any | null; error: string | null }> {
  if (!isValidUUID(itemId)) return { item: null, error: 'Invalid item ID format' };
  const result = await dbQuery(baseUrl, key, 'draft_items', 'GET', undefined, `id=eq.${itemId}&select=id,journey_id,status,item_type,visibility,content_json,storage_path,created_by,reviewed_by,reviewed_at`);
  if (result.error) return { item: null, error: result.error };
  if (!Array.isArray(result.data) || result.data.length === 0) return { item: null, error: 'Draft item not found' };
  return { item: result.data[0], error: null };
}

function getViewerVisibilityLevels(viewerUserId: string | null, viewerRelationship: string | null): string[] {
  const levels = ['public'];
  if (viewerUserId) {
    if (viewerRelationship === 'connection' || viewerRelationship === 'family') levels.push('connections');
    if (viewerRelationship === 'family') levels.push('family');
  }
  return levels;
}

function organizeItemsByType(items: any[]): { images: any[]; documents: any[]; texts: any[]; links: any[]; videos: any[] } {
  const organized = { images: [], documents: [], texts: [], links: [], videos: [] } as any;
  for (const item of items) {
    const type = item.item_type || 'document';
    switch (type) {
      case 'image': organized.images.push(item); break;
      case 'text': organized.texts.push(item); break;
      case 'link': organized.links.push(item); break;
      case 'video': organized.videos.push(item); break;
      default: organized.documents.push(item); break;
    }
  }
  return organized;
}

// Phase 5: Trigger notification (non-blocking)
async function triggerNotification(baseUrl: string, key: string, action: string, payload: any): Promise<void> {
  try {
    const notificationUrl = `${baseUrl}/functions/v1/swor-notifications`;
    await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ action, payload })
    });
    console.log(`[Notification] Triggered ${action} notification`);
  } catch (err) {
    // Non-blocking - log but don't fail
    console.error(`[Notification] Failed to trigger ${action}:`, err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const baseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  
  if (!baseUrl || !serviceKey) {
    return errorResponse('config_error', `url=${!!baseUrl}, key=${!!serviceKey}`, 500);
  }

  try {
    const body = await req.json();

    // LEGACY FILE UPLOAD (base64)
    if (body.fileName && body.fileData) {
      const { fileName, fileType: mime, fileSize, fileData, journeyId, visibility = 'private_draft', sourceNotes = '', uploadedBy, uploaderName } = body;
      const isVideo = isVideoType(mime);
      const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_DOC_BYTES;
      const maxMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_DOC_MB;
      if (fileSize > maxBytes) {
        return errorResponse('file_too_large', `File size ${(fileSize / (1024 * 1024)).toFixed(1)}MB exceeds maximum of ${maxMB}MB`, 413);
      }
      const bytes = b64ToBytes(fileData);
      const path = storagePath(journeyId || 'unassigned', fileName);
      const type = itemType(mime);
      const uploadResult = await storageUpload(baseUrl, serviceKey, 'swor-uploads', path, bytes, mime);
      if (uploadResult.error) return errorResponse('storage_upload_fail', uploadResult.error, 500);
      const vis = ['public', 'connections', 'family', 'private_draft'].includes(visibility) ? visibility : 'private_draft';
      const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journeyId);
      const validJourneyId = journeyResolution.id;
      let validUserId: string | null = null;
      if (uploadedBy && isValidUUID(uploadedBy)) {
        const exists = await userExists(baseUrl, serviceKey, uploadedBy);
        if (exists) validUserId = uploadedBy;
      }
      const draftResult = await dbQuery(baseUrl, serviceKey, 'draft_items', 'POST', {
        journey_id: validJourneyId,
        item_type: type,
        status: 'submitted_for_review',
        visibility: vis,
        content_json: { file_name: fileName, source_notes: sourceNotes, uploader_name: uploaderName },
        storage_path: path,
        thumb_path: type === 'image' ? path : null,
        mime: mime,
        size: fileSize,
        source_notes: sourceNotes,
        created_by: validUserId
      });
      if (draftResult.error) return errorResponse('db_insert_fail', draftResult.error, 500);
      const draft = Array.isArray(draftResult.data) ? draftResult.data[0] : draftResult.data;
      if (!draft || !draft.id) return errorResponse('db_insert_fail', 'No draft returned from insert', 500);
      await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', {
        journey_id: validJourneyId,
        actor_user_id: validUserId,
        action: 'upload_created',
        target_table: 'draft_items',
        target_id: draft.id,
        before_snapshot: null,
        after_snapshot: { file_name: fileName, item_type: type, visibility: vis, storage_path: path, mime, size: fileSize }
      });
      return successResponse({
        draft_item_id: draft.id,
        storage_path: path,
        thumb_path: type === 'image' ? path : null,
        mime: mime,
        size: fileSize,
        status: 'submitted_for_review',
        visibility: vis,
        journey_id_used: validJourneyId,
        created_by_used: validUserId
      });
    }

    const { action, payload } = body;

    // GET VIDEO UPLOAD URL
    if (action === 'get_video_upload_url') {
      const { journey_id, file_name, file_type, file_size } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id is required', 422);
      if (!file_name) return errorResponse('validation_error', 'file_name is required', 422);
      if (!file_type) return errorResponse('validation_error', 'file_type is required', 422);
      if (!ALLOWED_VIDEO_TYPES.includes(file_type.toLowerCase())) {
        return errorResponse('validation_error', `Invalid video type: ${file_type}. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`, 422);
      }
      if (file_size && file_size > MAX_VIDEO_BYTES) {
        return errorResponse('file_too_large', `Video size ${(file_size / (1024 * 1024)).toFixed(1)}MB exceeds maximum of ${MAX_VIDEO_MB}MB`, 413);
      }
      const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
      const validJourneyId = journeyResolution.id;
      if (!validJourneyId) return errorResponse('not_found', `Journey not found: ${journey_id}`, 404);
      const path = storagePath(validJourneyId, file_name);
      const thumbPath = thumbnailPath(path);
      const uploadUrlResult = await createSignedUploadUrl(baseUrl, serviceKey, 'swor-uploads', path);
      if (uploadUrlResult.error) return errorResponse('signed_url_fail', uploadUrlResult.error, 500);
      const thumbUploadResult = await createSignedUploadUrl(baseUrl, serviceKey, 'swor-uploads', thumbPath);
      return successResponse({
        action: 'get_video_upload_url',
        upload_url: uploadUrlResult.signedUrl,
        upload_token: uploadUrlResult.token,
        storage_path: path,
        thumb_upload_url: thumbUploadResult.signedUrl,
        thumb_upload_token: thumbUploadResult.token,
        thumb_path: thumbPath,
        journey_id: validJourneyId,
        max_size_mb: MAX_VIDEO_MB,
        allowed_types: ALLOWED_VIDEO_TYPES
      });
    }

    // REGISTER VIDEO UPLOAD
    if (action === 'register_video_upload') {
      const { journey_id, storage_path, thumb_path, file_name, file_type, file_size, duration, title, description, visibility = 'private_draft', source_notes = '', credit_preference = 'none', credit_line = '', rights_status = '', compression_applied = false, submitted_by, submitter_name } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id is required', 422);
      if (!storage_path) return errorResponse('validation_error', 'storage_path is required', 422);
      if (!file_name) return errorResponse('validation_error', 'file_name is required', 422);
      const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
      const validJourneyId = journeyResolution.id;
      if (!validJourneyId) return errorResponse('not_found', `Journey not found: ${journey_id}`, 404);
      let validUserId: string | null = null;
      if (submitted_by && isValidUUID(submitted_by)) {
        const exists = await userExists(baseUrl, serviceKey, submitted_by);
        if (exists) validUserId = submitted_by;
      }
      const vis = ['public', 'connections', 'family', 'private_draft'].includes(visibility) ? visibility : 'private_draft';
      const validCreditPrefs = ['name', 'organisation', 'anonymous', 'none'];
      const creditPref = validCreditPrefs.includes(credit_preference) ? credit_preference : 'none';
      const contentJson = {
        file_name: file_name,
        title: title?.trim() || null,
        description: description?.trim() || null,
        duration: duration || null,
        thumb_path: thumb_path || null,
        compression_applied: compression_applied === true,
        source_notes: source_notes?.trim() || null,
        credit_preference: creditPref,
        credit_line: credit_line?.trim() || null,
        rights_status: rights_status?.trim() || null,
        submitter_name: submitter_name || null
      };
      const draftResult = await dbQuery(baseUrl, serviceKey, 'draft_items', 'POST', {
        journey_id: validJourneyId,
        item_type: 'video',
        status: 'submitted_for_review',
        visibility: vis,
        content_json: contentJson,
        storage_path: storage_path,
        thumb_path: thumb_path || null,
        mime: file_type || 'video/mp4',
        size: file_size || null,
        source_notes: source_notes?.trim() || null,
        created_by: validUserId
      });
      if (draftResult.error) return errorResponse('db_insert_fail', draftResult.error, 500);
      const draft = Array.isArray(draftResult.data) ? draftResult.data[0] : draftResult.data;
      if (!draft || !draft.id) return errorResponse('db_insert_fail', 'No draft returned from insert', 500);
      await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', {
        journey_id: validJourneyId,
        actor_user_id: validUserId,
        action: 'video_submitted',
        target_table: 'draft_items',
        target_id: draft.id,
        before_snapshot: null,
        after_snapshot: { file_name, title: title?.trim() || null, item_type: 'video', visibility: vis, storage_path, thumb_path: thumb_path || null, duration: duration || null, file_size: file_size || null, compression_applied: compression_applied === true, credit_preference: creditPref }
      });
      return successResponse({
        action: 'register_video_upload',
        draft_item_id: draft.id,
        journey_id: validJourneyId,
        item_type: 'video',
        status: 'submitted_for_review',
        visibility: vis,
        storage_path: storage_path,
        thumb_path: thumb_path || null,
        file_name: file_name,
        duration: duration || null,
        compression_applied: compression_applied === true,
        credit_preference: creditPref,
        created_by: validUserId
      });
    }

    // SUBMIT TEXT ITEM
    if (action === 'submit_text_item') {
      const { journey_id, title, body: textBody, visibility = 'private_draft', source_notes = '', credit_preference = 'none', credit_line = '', rights_status = '', submitted_by, submitter_name } = payload || {};
      if (!title || !title.trim()) return errorResponse('validation_error', 'title is required', 422);
      if (!textBody || !textBody.trim()) return errorResponse('validation_error', 'body is required', 422);
      if (!journey_id) return errorResponse('validation_error', 'journey_id is required', 422);
      const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
      const validJourneyId = journeyResolution.id;
      if (!validJourneyId) return errorResponse('not_found', `Journey not found: ${journey_id}`, 404);
      let validUserId: string | null = null;
      if (submitted_by && isValidUUID(submitted_by)) {
        const exists = await userExists(baseUrl, serviceKey, submitted_by);
        if (exists) validUserId = submitted_by;
      }
      const vis = ['public', 'connections', 'family', 'private_draft'].includes(visibility) ? visibility : 'private_draft';
      const validCreditPrefs = ['name', 'organisation', 'anonymous', 'none'];
      const creditPref = validCreditPrefs.includes(credit_preference) ? credit_preference : 'none';
      const contentJson = { title: title.trim(), body: textBody.trim(), source_notes: source_notes?.trim() || null, credit_preference: creditPref, credit_line: credit_line?.trim() || null, rights_status: rights_status?.trim() || null, submitter_name: submitter_name || null };
      const draftResult = await dbQuery(baseUrl, serviceKey, 'draft_items', 'POST', {
        journey_id: validJourneyId,
        item_type: 'text',
        status: 'submitted_for_review',
        visibility: vis,
        content_json: contentJson,
        storage_path: null,
        thumb_path: null,
        mime: 'text/plain',
        size: textBody.length,
        source_notes: source_notes?.trim() || null,
        created_by: validUserId
      });
      if (draftResult.error) return errorResponse('db_insert_fail', draftResult.error, 500);
      const draft = Array.isArray(draftResult.data) ? draftResult.data[0] : draftResult.data;
      if (!draft || !draft.id) return errorResponse('db_insert_fail', 'No draft returned from insert', 500);
      await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', {
        journey_id: validJourneyId,
        actor_user_id: validUserId,
        action: 'text_submitted',
        target_table: 'draft_items',
        target_id: draft.id,
        before_snapshot: null,
        after_snapshot: { title: title.trim(), body_preview: textBody.trim().substring(0, 200), item_type: 'text', visibility: vis, credit_preference: creditPref }
      });
      return successResponse({ action: 'submit_text_item', draft_item_id: draft.id, journey_id: validJourneyId, item_type: 'text', status: 'submitted_for_review', visibility: vis, title: title.trim(), body_length: textBody.length, credit_preference: creditPref, created_by: validUserId });
    }

    // SUBMIT LINK ITEM
    if (action === 'submit_link_item') {
      const { journey_id, url, title = '', description = '', allow_embedding = false, source_type = '', visibility = 'private_draft', source_notes = '', credit_preference = 'none', credit_line = '', rights_status = '', submitted_by, submitter_name } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id is required', 422);
      const urlValidation = isValidUrl(url);
      if (!urlValidation.valid) return errorResponse('validation_error', urlValidation.error || 'Invalid URL', 422);
      const trimmedUrl = url.trim();
      const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
      const validJourneyId = journeyResolution.id;
      if (!validJourneyId) return errorResponse('not_found', `Journey not found: ${journey_id}`, 404);
      let validUserId: string | null = null;
      if (submitted_by && isValidUUID(submitted_by)) {
        const exists = await userExists(baseUrl, serviceKey, submitted_by);
        if (exists) validUserId = submitted_by;
      }
      const vis = ['public', 'connections', 'family', 'private_draft'].includes(visibility) ? visibility : 'private_draft';
      const validCreditPrefs = ['name', 'organisation', 'anonymous', 'none'];
      const creditPref = validCreditPrefs.includes(credit_preference) ? credit_preference : 'none';
      const detectedSourceType = source_type?.trim() || detectSourceType(trimmedUrl);
      const canEmbed = allow_embedding === true && isEmbeddableSource(detectedSourceType);
      const contentJson = { url: trimmedUrl, title: title?.trim() || null, description: description?.trim() || null, allow_embedding: canEmbed, source_type: detectedSourceType, source_notes: source_notes?.trim() || null, credit_preference: creditPref, credit_line: credit_line?.trim() || null, rights_status: rights_status?.trim() || null, submitter_name: submitter_name || null };
      const draftResult = await dbQuery(baseUrl, serviceKey, 'draft_items', 'POST', {
        journey_id: validJourneyId,
        item_type: 'link',
        status: 'submitted_for_review',
        visibility: vis,
        content_json: contentJson,
        storage_path: null,
        thumb_path: null,
        mime: 'text/uri-list',
        size: trimmedUrl.length,
        source_notes: source_notes?.trim() || null,
        created_by: validUserId
      });
      if (draftResult.error) return errorResponse('db_insert_fail', draftResult.error, 500);
      const draft = Array.isArray(draftResult.data) ? draftResult.data[0] : draftResult.data;
      if (!draft || !draft.id) return errorResponse('db_insert_fail', 'No draft returned from insert', 500);
      await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', {
        journey_id: validJourneyId,
        actor_user_id: validUserId,
        action: 'link_submitted',
        target_table: 'draft_items',
        target_id: draft.id,
        before_snapshot: null,
        after_snapshot: { url: trimmedUrl, title: title?.trim() || null, item_type: 'link', visibility: vis, source_type: detectedSourceType, allow_embedding: canEmbed, credit_preference: creditPref }
      });
      return successResponse({ action: 'submit_link_item', draft_item_id: draft.id, journey_id: validJourneyId, item_type: 'link', status: 'submitted_for_review', visibility: vis, url: trimmedUrl, title: title?.trim() || null, source_type: detectedSourceType, allow_embedding: canEmbed, credit_preference: creditPref, created_by: validUserId });
    }

    // GET SIGNED URL
    if (action === 'get_signed_url') {
      const { storage_path, expires_in = 3600 } = payload || {};
      if (!storage_path) return errorResponse('validation_error', 'storage_path required', 422);
      const result = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', storage_path, expires_in);
      if (result.error) return errorResponse('signed_url_fail', result.error, 500);
      return successResponse({ signed_url: result.signedUrl, expires_in, storage_path });
    }

    // GET FILE DATA
    if (action === 'get_file_data') {
      const { storage_path } = payload || {};
      if (!storage_path) return errorResponse('validation_error', 'storage_path required', 422);
      const result = await downloadFile(baseUrl, serviceKey, 'swor-uploads', storage_path);
      if (result.error) return errorResponse('download_fail', result.error, 500);
      return successResponse({ data: result.data, content_type: result.contentType, storage_path });
    }

    // GET JOURNEY ITEMS
    if (action === 'get_journey_items') {
      const { journey_id } = payload || {};
      let resolvedJourneyId = journey_id;
      if (journey_id && !isValidUUID(journey_id)) {
        const resolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
        resolvedJourneyId = resolution.id;
      }
      let query = 'order=created_at.desc';
      if (resolvedJourneyId) query = `journey_id=eq.${resolvedJourneyId}&${query}`;
      const result = await dbQuery(baseUrl, serviceKey, 'draft_items', 'GET', undefined, query);
      if (result.error) return errorResponse('fetch_items_fail', result.error, 500);
      const items = result.data || [];
      return successResponse({ items, count: items.length, journey_id_resolved: resolvedJourneyId });
    }

    // GET APPROVED ITEMS
    if (action === 'get_approved_items') {
      const { journey_id, viewer_user_id = null, viewer_relationship = null, include_signed_urls = true } = payload || {};
      if (!journey_id) return errorResponse('validation_error', 'journey_id required', 422);
      let resolvedJourneyId = journey_id;
      if (!isValidUUID(journey_id)) {
        const resolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
        resolvedJourneyId = resolution.id;
        if (!resolvedJourneyId) return errorResponse('not_found', `Journey not found: ${journey_id}`, 404);
      }
      const visibilityLevels = getViewerVisibilityLevels(viewer_user_id, viewer_relationship);
      const visibilityFilter = visibilityLevels.map(v => `visibility.eq.${v}`).join(',');
      const query = `journey_id=eq.${resolvedJourneyId}&status=eq.approved&or=(${visibilityFilter})&order=created_at.asc`;
      const result = await dbQuery(baseUrl, serviceKey, 'draft_items', 'GET', undefined, query);
      if (result.error) return errorResponse('fetch_approved_fail', result.error, 500);
      let items = result.data || [];
      if (include_signed_urls && items.length > 0) {
        const itemsWithUrls = await Promise.all(items.map(async (item: any) => {
          const updatedItem = { ...item };
          if (item.storage_path) {
            const urlResult = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', item.storage_path, 3600);
            updatedItem.signed_url = urlResult.signedUrl;
            updatedItem.signed_url_expires_in = 3600;
          }
          if (item.thumb_path && item.thumb_path !== item.storage_path) {
            const thumbResult = await createSignedUrl(baseUrl, serviceKey, 'swor-uploads', item.thumb_path, 3600);
            updatedItem.thumb_signed_url = thumbResult.signedUrl;
          }
          return updatedItem;
        }));
        items = itemsWithUrls;
      }
      const organized = organizeItemsByType(items);
      return successResponse({ journey_id: resolvedJourneyId, viewer_visibility_levels: visibilityLevels, total_count: items.length, items_by_type: organized, counts: { images: organized.images.length, documents: organized.documents.length, texts: organized.texts.length, links: organized.links.length, videos: organized.videos.length }, items });
    }

    // GET ALL ITEMS
    if (action === 'get_all_items') {
      const result = await dbQuery(baseUrl, serviceKey, 'draft_items', 'GET', undefined, 'order=created_at.desc');
      if (result.error) return errorResponse('fetch_all_fail', result.error, 500);
      const items = result.data || [];
      return successResponse({ items, count: items.length });
    }

    // GET AUDIT LOG
    if (action === 'get_audit_log') {
      const { journey_id } = payload || {};
      let query = 'order=created_at.desc&limit=50';
      if (journey_id) {
        let resolvedJourneyId = journey_id;
        if (!isValidUUID(journey_id)) {
          const resolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
          resolvedJourneyId = resolution.id;
        }
        if (resolvedJourneyId) query = `journey_id=eq.${resolvedJourneyId}&${query}`;
      }
      const result = await dbQuery(baseUrl, serviceKey, 'audit_log', 'GET', undefined, query);
      if (result.error) return errorResponse('fetch_audit_fail', result.error, 500);
      const entries = result.data || [];
      return successResponse({ entries, count: entries.length });
    }

    // APPROVE ITEM - Phase 5: with email notification
    if (action === 'approve_item') {
      try {
        const { item_id, new_visibility, demo_user_email } = payload || {};
        let reviewerId: string | null = null;
        let reviewerEmail: string | null = null;
        let authMethod: string = 'unknown';
        let permissionCheck: { authorized: boolean; role: string | null; reason: string } = { authorized: false, role: null, reason: 'Not checked' };
        if (demo_user_email && isValidEmail(demo_user_email)) {
          const demoCheck = await checkStewardPermissionByEmail(baseUrl, serviceKey, demo_user_email);
          if (demoCheck.authorized) {
            reviewerEmail = demo_user_email;
            reviewerId = demoCheck.userId;
            authMethod = 'demo_global_steward';
            permissionCheck = demoCheck;
          } else {
            return jsonResponse({ success: false, error: 'forbidden', detail: demoCheck.reason }, 403);
          }
        } else {
          const authResult = await validateAuthToken(req, baseUrl, anonKey || serviceKey);
          if (authResult.error || !authResult.userId) {
            return jsonResponse({ success: false, error: authResult.errorCode || 'unauthorized', detail: authResult.error || 'Authentication required' }, 401);
          }
          reviewerId = authResult.userId;
          reviewerEmail = authResult.userEmail;
          authMethod = 'auth_token';
          await ensureUserExists(baseUrl, serviceKey, reviewerId, reviewerEmail);
        }
        if (!item_id) return jsonResponse({ success: false, error: 'validation_error', detail: 'item_id is required' }, 422);
        if (!isValidUUID(item_id)) return jsonResponse({ success: false, error: 'validation_error', detail: `item_id must be a valid UUID` }, 422);
        const draftItemResult = await getDraftItem(baseUrl, serviceKey, item_id);
        if (draftItemResult.error || !draftItemResult.item) return jsonResponse({ success: false, error: 'not_found', detail: draftItemResult.error || 'Draft item not found' }, 404);
        const draftItem = draftItemResult.item;
        const journeyId = draftItem.journey_id;
        if (draftItem.status === 'approved') return jsonResponse({ success: false, error: 'conflict', detail: 'Item is already approved' }, 409);
        if (draftItem.status === 'rejected') return jsonResponse({ success: false, error: 'conflict', detail: 'Item has been rejected' }, 409);
        if (authMethod !== 'demo_global_steward') {
          permissionCheck = await checkStewardPermission(baseUrl, serviceKey, reviewerId!, journeyId);
          if (!permissionCheck.authorized) return jsonResponse({ success: false, error: 'forbidden', detail: permissionCheck.reason }, 403);
        }
        const now = new Date().toISOString();
        const updateData: Record<string, unknown> = { status: 'approved', reviewed_at: now, updated_at: now, reviewed_by: reviewerId };
        if (new_visibility) updateData.visibility = new_visibility;
        const result = await dbQuery(baseUrl, serviceKey, 'draft_items', 'PATCH', updateData, `id=eq.${item_id}`);
        if (result.error) return jsonResponse({ success: false, error: 'server_error', detail: `Database update failed: ${result.error}` }, 500);
        await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', {
          journey_id: journeyId,
          actor_user_id: reviewerId,
          action: 'item_approved',
          target_table: 'draft_items',
          target_id: item_id,
          before_snapshot: { status: draftItem.status, visibility: draftItem.visibility, item_type: draftItem.item_type },
          after_snapshot: { status: 'approved', reviewed_by_user_id: reviewerId, reviewer_email: reviewerEmail, reviewed_at: now, new_visibility: new_visibility || draftItem.visibility, authorized_role: permissionCheck.role, auth_method: authMethod, item_type: draftItem.item_type }
        });

        // Phase 5: Trigger email notification (non-blocking)
        if (draftItem.created_by) {
          const journeyInfo = await resolveJourneyId(baseUrl, serviceKey, journeyId);
          triggerNotification(baseUrl, serviceKey, 'item_approved', {
            user_id: draftItem.created_by,
            item_type: draftItem.item_type,
            journey_title: journeyInfo.title || 'Rugby Journey',
            journey_id: journeyId,
            journey_slug: journeyInfo.slug
          });
        }

        return jsonResponse({ success: true, action: 'approve_item', draft_item_id: item_id, journey_id: journeyId, item_type: draftItem.item_type, status: 'approved', reviewed_by: reviewerId, reviewer_email: reviewerEmail, reviewed_at: now, authorized_role: permissionCheck.role, auth_method: authMethod }, 200);
      } catch (err: any) {
        return jsonResponse({ success: false, error: 'server_error', detail: err.message || String(err) }, 500);
      }
    }

    // REJECT ITEM - Phase 5: with email notification
    if (action === 'reject_item') {
      try {
        const { item_id, rejection_note, demo_user_email } = payload || {};
        let reviewerId: string | null = null;
        let reviewerEmail: string | null = null;
        let authMethod: string = 'unknown';
        let permissionCheck: { authorized: boolean; role: string | null; reason: string } = { authorized: false, role: null, reason: 'Not checked' };
        if (demo_user_email && isValidEmail(demo_user_email)) {
          const demoCheck = await checkStewardPermissionByEmail(baseUrl, serviceKey, demo_user_email);
          if (demoCheck.authorized) {
            reviewerEmail = demo_user_email;
            reviewerId = demoCheck.userId;
            authMethod = 'demo_global_steward';
            permissionCheck = demoCheck;
          } else {
            return jsonResponse({ success: false, error: 'forbidden', detail: demoCheck.reason }, 403);
          }
        } else {
          const authResult = await validateAuthToken(req, baseUrl, anonKey || serviceKey);
          if (authResult.error || !authResult.userId) {
            return jsonResponse({ success: false, error: authResult.errorCode || 'unauthorized', detail: authResult.error || 'Authentication required' }, 401);
          }
          reviewerId = authResult.userId;
          reviewerEmail = authResult.userEmail;
          authMethod = 'auth_token';
          await ensureUserExists(baseUrl, serviceKey, reviewerId, reviewerEmail);
        }
        if (!item_id) return jsonResponse({ success: false, error: 'validation_error', detail: 'item_id is required' }, 422);
        if (!isValidUUID(item_id)) return jsonResponse({ success: false, error: 'validation_error', detail: `item_id must be a valid UUID` }, 422);
        const draftItemResult = await getDraftItem(baseUrl, serviceKey, item_id);
        if (draftItemResult.error || !draftItemResult.item) return jsonResponse({ success: false, error: 'not_found', detail: draftItemResult.error || 'Draft item not found' }, 404);
        const draftItem = draftItemResult.item;
        const journeyId = draftItem.journey_id;
        if (draftItem.status === 'rejected') return jsonResponse({ success: false, error: 'conflict', detail: 'Item is already rejected' }, 409);
        if (draftItem.status === 'approved') return jsonResponse({ success: false, error: 'conflict', detail: 'Item has been approved' }, 409);
        if (authMethod !== 'demo_global_steward') {
          permissionCheck = await checkStewardPermission(baseUrl, serviceKey, reviewerId!, journeyId);
          if (!permissionCheck.authorized) return jsonResponse({ success: false, error: 'forbidden', detail: permissionCheck.reason }, 403);
        }
        const now = new Date().toISOString();
        const updateData: Record<string, unknown> = { status: 'rejected', reviewed_at: now, updated_at: now, reviewed_by: reviewerId };
        const result = await dbQuery(baseUrl, serviceKey, 'draft_items', 'PATCH', updateData, `id=eq.${item_id}`);
        if (result.error) return jsonResponse({ success: false, error: 'server_error', detail: `Database update failed: ${result.error}` }, 500);
        await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', {
          journey_id: journeyId,
          actor_user_id: reviewerId,
          action: 'item_rejected',
          target_table: 'draft_items',
          target_id: item_id,
          before_snapshot: { status: draftItem.status, visibility: draftItem.visibility, item_type: draftItem.item_type },
          after_snapshot: { status: 'rejected', reviewed_by_user_id: reviewerId, reviewer_email: reviewerEmail, reviewed_at: now, rejection_note: rejection_note || null, authorized_role: permissionCheck.role, auth_method: authMethod, item_type: draftItem.item_type }
        });

        // Phase 5: Trigger email notification (non-blocking)
        if (draftItem.created_by) {
          const journeyInfo = await resolveJourneyId(baseUrl, serviceKey, journeyId);
          triggerNotification(baseUrl, serviceKey, 'item_rejected', {
            user_id: draftItem.created_by,
            item_type: draftItem.item_type,
            journey_title: journeyInfo.title || 'Rugby Journey',
            journey_id: journeyId,
            journey_slug: journeyInfo.slug,
            rejection_note: rejection_note || null
          });
        }

        return jsonResponse({ success: true, action: 'reject_item', draft_item_id: item_id, journey_id: journeyId, item_type: draftItem.item_type, status: 'rejected', reviewed_by: reviewerId, reviewer_email: reviewerEmail, reviewed_at: now, rejection_note: rejection_note || null, authorized_role: permissionCheck.role, auth_method: authMethod }, 200);
      } catch (err: any) {
        return jsonResponse({ success: false, error: 'server_error', detail: err.message || String(err) }, 500);
      }
    }

    // RESET ITEM TO PENDING (Re-review workflow)
    if (action === 'reset_to_pending') {
      try {
        const { item_id, reset_note, demo_user_email } = payload || {};
        let actorId: string | null = null;
        let actorEmail: string | null = null;
        let authMethod: string = 'unknown';
        let permissionCheck: { authorized: boolean; role: string | null; reason: string } = { authorized: false, role: null, reason: 'Not checked' };
        if (demo_user_email && isValidEmail(demo_user_email)) {
          const demoCheck = await checkStewardPermissionByEmail(baseUrl, serviceKey, demo_user_email);
          if (demoCheck.authorized) {
            actorEmail = demo_user_email;
            actorId = demoCheck.userId;
            authMethod = 'demo_global_steward';
            permissionCheck = demoCheck;
          } else {
            return jsonResponse({ success: false, error: 'forbidden', detail: demoCheck.reason }, 403);
          }
        } else {
          const authResult = await validateAuthToken(req, baseUrl, anonKey || serviceKey);
          if (authResult.error || !authResult.userId) {
            return jsonResponse({ success: false, error: authResult.errorCode || 'unauthorized', detail: authResult.error || 'Authentication required' }, 401);
          }
          actorId = authResult.userId;
          actorEmail = authResult.userEmail;
          authMethod = 'auth_token';
          await ensureUserExists(baseUrl, serviceKey, actorId, actorEmail);
        }
        if (!item_id) return jsonResponse({ success: false, error: 'validation_error', detail: 'item_id is required' }, 422);
        if (!isValidUUID(item_id)) return jsonResponse({ success: false, error: 'validation_error', detail: 'item_id must be a valid UUID' }, 422);
        const draftItemResult = await getDraftItem(baseUrl, serviceKey, item_id);
        if (draftItemResult.error || !draftItemResult.item) {
          return jsonResponse({ success: false, error: 'not_found', detail: draftItemResult.error || 'Draft item not found' }, 404);
        }
        const draftItem = draftItemResult.item;
        const journeyId = draftItem.journey_id;
        const validResetStates = ['approved', 'rejected'];
        if (!validResetStates.includes(draftItem.status)) {
          return jsonResponse({ success: false, error: 'conflict', detail: `Cannot reset item with status '${draftItem.status}'. Only 'approved' or 'rejected' items can be reset to pending.` }, 409);
        }
        if (authMethod !== 'demo_global_steward') {
          permissionCheck = await checkStewardPermission(baseUrl, serviceKey, actorId!, journeyId);
          if (!permissionCheck.authorized) {
            return jsonResponse({ success: false, error: 'forbidden', detail: permissionCheck.reason }, 403);
          }
        }
        const beforeSnapshot = { status: draftItem.status, visibility: draftItem.visibility, item_type: draftItem.item_type, reviewed_by: draftItem.reviewed_by, reviewed_at: draftItem.reviewed_at };
        const now = new Date().toISOString();
        const updateData: Record<string, unknown> = { status: 'submitted_for_review', reviewed_by: null, reviewed_at: null, updated_at: now };
        const result = await dbQuery(baseUrl, serviceKey, 'draft_items', 'PATCH', updateData, `id=eq.${item_id}`);
        if (result.error) {
          return jsonResponse({ success: false, error: 'server_error', detail: `Database update failed: ${result.error}` }, 500);
        }
        const afterSnapshot = { status: 'submitted_for_review', visibility: draftItem.visibility, item_type: draftItem.item_type, reviewed_by: null, reviewed_at: null, reset_by_user_id: actorId, reset_by_email: actorEmail, reset_at: now, reset_note: reset_note?.trim() || null, previous_status: draftItem.status, authorized_role: permissionCheck.role, auth_method: authMethod };
        await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', { journey_id: journeyId, actor_user_id: actorId, action: 'item_reset_to_pending', target_table: 'draft_items', target_id: item_id, before_snapshot: beforeSnapshot, after_snapshot: afterSnapshot });
        return jsonResponse({ success: true, action: 'reset_to_pending', draft_item_id: item_id, journey_id: journeyId, item_type: draftItem.item_type, previous_status: draftItem.status, new_status: 'submitted_for_review', reset_by: actorId, reset_by_email: actorEmail, reset_at: now, reset_note: reset_note?.trim() || null, authorized_role: permissionCheck.role, auth_method: authMethod }, 200);
      } catch (err: any) {
        return jsonResponse({ success: false, error: 'server_error', detail: err.message || String(err) }, 500);
      }
    }

    // CHECK GLOBAL STEWARD
    if (action === 'check_global_steward') {
      const { user_id } = payload || {};
      if (!user_id) return jsonResponse({ success: false, error: 'unauthorized', detail: 'user_id is required' }, 401);
      const result = await isGlobalSteward(baseUrl, serviceKey, user_id);
      return successResponse({ action: 'check_global_steward', user_id, is_global_steward: result.isGlobal, role_id: result.roleId, reason: result.reason });
    }

    // GET STEWARDS
    if (action === 'get_stewards') {
      const { journey_id, requester_id } = payload || {};
      if (!requester_id) return jsonResponse({ success: false, error: 'unauthorized', detail: 'requester_id must be provided' }, 401);
      if (!isValidUUID(requester_id)) return jsonResponse({ success: false, error: 'unauthorized', detail: 'Invalid requester_id format' }, 401);
      if (!journey_id) return errorResponse('validation_error', 'journey_id is required', 422);
      const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
      const resolvedJourneyId = journeyResolution.id;
      if (!resolvedJourneyId) return errorResponse('not_found', `Journey not found: ${journey_id}`, 404);
      const globalStewardsResult = await dbQuery(baseUrl, serviceKey, 'roles', 'GET', undefined, `role=eq.${ROLE_GLOBAL_STEWARD}&scope_type=eq.site&select=id,user_id,role,scope_type,scope_id,granted_at`);
      const journeyStewardsResult = await dbQuery(baseUrl, serviceKey, 'roles', 'GET', undefined, `role=eq.${ROLE_STEWARD}&scope_type=eq.journey&scope_id=eq.${resolvedJourneyId}&select=id,user_id,role,scope_type,scope_id,granted_at`);
      const globalStewards = globalStewardsResult.data || [];
      const journeyStewards = journeyStewardsResult.data || [];
      const allUserIds = [...globalStewards.map((s: any) => s.user_id), ...journeyStewards.map((s: any) => s.user_id)].filter((id: string) => isValidUUID(id));
      const uniqueUserIds = [...new Set(allUserIds)];
      let usersMap: Record<string, any> = {};
      if (uniqueUserIds.length > 0) {
        const usersResult = await dbQuery(baseUrl, serviceKey, 'users', 'GET', undefined, `id=in.(${uniqueUserIds.join(',')})&select=id,email,display_name`);
        if (!usersResult.error && Array.isArray(usersResult.data)) {
          for (const user of usersResult.data) usersMap[user.id] = user;
        }
      }
      const enrichSteward = (steward: any) => ({ ...steward, created_at: steward.granted_at, user_email: usersMap[steward.user_id]?.email || null, user_name: usersMap[steward.user_id]?.display_name || null });
      return successResponse({ action: 'get_stewards', journey_id: resolvedJourneyId, global_stewards: globalStewards.map(enrichSteward), journey_stewards: journeyStewards.map(enrichSteward), counts: { global: globalStewards.length, journey: journeyStewards.length, total: globalStewards.length + journeyStewards.length } });
    }

    // ADD JOURNEY STEWARD
    if (action === 'add_journey_steward') {
      try {
        const { journey_id, target_email, target_user_id, actor_id } = payload || {};
        if (!actor_id) return jsonResponse({ success: false, error: 'unauthorized', detail: 'actor_id must be provided' }, 401);
        if (!isValidUUID(actor_id)) return jsonResponse({ success: false, error: 'unauthorized', detail: 'Invalid actor_id format' }, 401);
        const globalCheck = await isGlobalSteward(baseUrl, serviceKey, actor_id);
        if (!globalCheck.isGlobal) return jsonResponse({ success: false, error: 'forbidden', detail: 'Only global stewards can add journey stewards' }, 403);
        if (!journey_id) return jsonResponse({ success: false, error: 'validation_error', detail: 'journey_id is required' }, 422);
        const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
        const resolvedJourneyId = journeyResolution.id;
        if (!resolvedJourneyId) return jsonResponse({ success: false, error: 'not_found', detail: `Journey not found: ${journey_id}` }, 404);
        let targetUserId: string | null = null;
        let targetUserEmail: string | null = null;
        let userCreated = false;
        if (target_email && isValidEmail(target_email)) {
          const userLookup = await getUserByEmail(baseUrl, serviceKey, target_email);
          if (userLookup.user) {
            targetUserId = userLookup.user.id;
            targetUserEmail = userLookup.user.email;
          } else {
            const createResult = await createPlaceholderUser(baseUrl, serviceKey, target_email);
            if (createResult.error) return jsonResponse({ success: false, error: 'server_error', detail: `Failed to create placeholder user: ${createResult.error}` }, 500);
            targetUserId = createResult.user.id;
            targetUserEmail = createResult.user.email;
            userCreated = true;
          }
        } else if (target_user_id && isValidUUID(target_user_id)) {
          const exists = await userExists(baseUrl, serviceKey, target_user_id);
          if (!exists) return jsonResponse({ success: false, error: 'not_found', detail: `User not found: ${target_user_id}` }, 404);
          targetUserId = target_user_id;
        } else {
          return jsonResponse({ success: false, error: 'validation_error', detail: 'Either target_email or target_user_id is required' }, 422);
        }
        const existingRoleResult = await dbQuery(baseUrl, serviceKey, 'roles', 'GET', undefined, `user_id=eq.${targetUserId}&role=eq.${ROLE_STEWARD}&scope_type=eq.journey&scope_id=eq.${resolvedJourneyId}&select=id`);
        if (!existingRoleResult.error && Array.isArray(existingRoleResult.data) && existingRoleResult.data.length > 0) {
          return jsonResponse({ success: false, error: 'conflict', detail: 'User already has steward role for this journey' }, 409);
        }
        const now = new Date().toISOString();
        const roleResult = await dbQuery(baseUrl, serviceKey, 'roles', 'POST', { user_id: targetUserId, role: ROLE_STEWARD, scope_type: 'journey', scope_id: resolvedJourneyId, granted_at: now, granted_by: actor_id });
        if (roleResult.error) return jsonResponse({ success: false, error: 'server_error', detail: `Failed to insert role: ${roleResult.error}` }, 500);
        const newRole = Array.isArray(roleResult.data) ? roleResult.data[0] : roleResult.data;
        await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', { journey_id: resolvedJourneyId, actor_user_id: actor_id, action: 'steward_added', target_table: 'roles', target_id: newRole?.id || null, before_snapshot: null, after_snapshot: { role_id: newRole?.id, user_id: targetUserId, user_email: targetUserEmail, role: ROLE_STEWARD, scope_type: 'journey', scope_id: resolvedJourneyId, user_created: userCreated, added_by: actor_id } });
        return jsonResponse({ success: true, action: 'add_journey_steward', role_id: newRole?.id, user_id: targetUserId, user_email: targetUserEmail, journey_id: resolvedJourneyId, user_created: userCreated, added_by: actor_id }, 200);
      } catch (err: any) {
        return jsonResponse({ success: false, error: 'server_error', detail: err.message || String(err) }, 500);
      }
    }

    // REMOVE JOURNEY STEWARD
    if (action === 'remove_journey_steward') {
      try {
        const { journey_id, target_user_id, actor_id } = payload || {};
        if (!actor_id) return jsonResponse({ success: false, error: 'unauthorized', detail: 'actor_id must be provided' }, 401);
        if (!isValidUUID(actor_id)) return jsonResponse({ success: false, error: 'unauthorized', detail: 'Invalid actor_id format' }, 401);
        const globalCheck = await isGlobalSteward(baseUrl, serviceKey, actor_id);
        if (!globalCheck.isGlobal) return jsonResponse({ success: false, error: 'forbidden', detail: 'Only global stewards can remove journey stewards' }, 403);
        if (!journey_id) return jsonResponse({ success: false, error: 'validation_error', detail: 'journey_id is required' }, 422);
        if (!target_user_id || !isValidUUID(target_user_id)) return jsonResponse({ success: false, error: 'validation_error', detail: 'target_user_id (valid UUID) is required' }, 422);
        const journeyResolution = await resolveJourneyId(baseUrl, serviceKey, journey_id);
        const resolvedJourneyId = journeyResolution.id;
        if (!resolvedJourneyId) return jsonResponse({ success: false, error: 'not_found', detail: `Journey not found: ${journey_id}` }, 404);
        const roleResult = await dbQuery(baseUrl, serviceKey, 'roles', 'GET', undefined, `user_id=eq.${target_user_id}&role=eq.${ROLE_STEWARD}&scope_type=eq.journey&scope_id=eq.${resolvedJourneyId}&select=id,user_id,role,scope_type,scope_id,granted_at`);
        if (roleResult.error) return jsonResponse({ success: false, error: 'server_error', detail: `Failed to lookup role: ${roleResult.error}` }, 500);
        if (!Array.isArray(roleResult.data) || roleResult.data.length === 0) return jsonResponse({ success: false, error: 'not_found', detail: 'Journey steward role not found' }, 404);
        const roleToRemove = roleResult.data[0];
        const beforeSnapshot = { role_id: roleToRemove.id, user_id: roleToRemove.user_id, role: roleToRemove.role, scope_type: roleToRemove.scope_type, scope_id: roleToRemove.scope_id, granted_at: roleToRemove.granted_at };
        const deleteResult = await dbQuery(baseUrl, serviceKey, 'roles', 'DELETE', undefined, `id=eq.${roleToRemove.id}`);
        if (deleteResult.error) return jsonResponse({ success: false, error: 'server_error', detail: `Failed to delete role: ${deleteResult.error}` }, 500);
        await dbQuery(baseUrl, serviceKey, 'audit_log', 'POST', { journey_id: resolvedJourneyId, actor_user_id: actor_id, action: 'steward_removed', target_table: 'roles', target_id: roleToRemove.id, before_snapshot: beforeSnapshot, after_snapshot: { removed_by: actor_id, removed_at: new Date().toISOString() } });
        return jsonResponse({ success: true, action: 'remove_journey_steward', removed_role_id: roleToRemove.id, user_id: target_user_id, journey_id: resolvedJourneyId, removed_by: actor_id }, 200);
      } catch (err: any) {
        return jsonResponse({ success: false, error: 'server_error', detail: err.message || String(err) }, 500);
      }
    }

    // DEBUG / VERSION CHECK
    if (action === 'debug' || action === 'version_check') {
      const dbResult = await dbQuery(baseUrl, serviceKey, 'draft_items', 'GET', undefined, 'limit=5');
      const journeysResult = await dbQuery(baseUrl, serviceKey, 'journeys', 'GET', undefined, 'limit=5');
      const rolesResult = await dbQuery(baseUrl, serviceKey, 'roles', 'GET', undefined, 'limit=10');
      let storageStatus = { ok: false, error: '' };
      try {
        const storageRes = await fetch(`${baseUrl}/storage/v1/bucket`, { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } });
        storageStatus = { ok: storageRes.ok, error: storageRes.ok ? '' : `HTTP ${storageRes.status}` };
      } catch (e) {
        storageStatus = { ok: false, error: String(e) };
      }
      return successResponse({ version_confirmed: VERSION, phase: '10.3 - Phase 5 Email Notifications', timestamp: new Date().toISOString(), file_limits: { max_image_doc_mb: MAX_IMAGE_DOC_MB, max_video_mb: MAX_VIDEO_MB, allowed_video_types: ALLOWED_VIDEO_TYPES }, role_constants: { ROLE_GLOBAL_STEWARD, ROLE_STEWARD }, known_global_steward_emails: KNOWN_GLOBAL_STEWARD_EMAILS, config: { baseUrl, keyLength: serviceKey.length }, connectivity: { draft_items: { ok: !dbResult.error, count: Array.isArray(dbResult.data) ? dbResult.data.length : 0 }, journeys: { ok: !journeysResult.error, count: Array.isArray(journeysResult.data) ? journeysResult.data.length : 0 }, roles: { ok: !rolesResult.error, count: Array.isArray(rolesResult.data) ? rolesResult.data.length : 0 }, storage: storageStatus } });
    }

    // CHECK STEWARD PERMISSION
    if (action === 'check_steward_permission') {
      const { user_id, journey_id } = payload || {};
      if (!user_id) return errorResponse('validation_error', 'user_id required', 422);
      const result = await checkStewardPermission(baseUrl, serviceKey, user_id, journey_id);
      return successResponse({ action: 'check_steward_permission', user_id, journey_id, ...result });
    }

    return errorResponse('unknown_action', `Received: ${action}`, 400);
  } catch (error) {
    return jsonResponse({ success: false, error: 'server_error', detail: String(error) }, 500);
  }
});
