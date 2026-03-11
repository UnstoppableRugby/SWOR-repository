// SWOR Archive Export v1.1 - Secure ZIP export with manifest + email link
const VERSION = '1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'x-swor-edge-version': VERSION
};

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

function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function dbQuery(baseUrl: string, key: string, table: string, method: string, body?: object, query?: string): Promise<{ data: any; error: string | null }> {
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const text = await res.text();
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${text}` };
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
    }
    return { data, error: null };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { data: null, error: 'Request timeout' };
    }
    return { data: null, error: `Fetch error: ${String(e)}` };
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

async function downloadFile(baseUrl: string, key: string, bucket: string, path: string): Promise<{ data: Uint8Array | null; error: string | null }> {
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
      return { data: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const arrayBuffer = await res.arrayBuffer();
    return { data: new Uint8Array(arrayBuffer), error: null };
  } catch (e) {
    return { data: null, error: `Fetch error: ${String(e)}` };
  }
}

async function uploadFile(baseUrl: string, key: string, bucket: string, path: string, data: Uint8Array, contentType: string): Promise<{ error: string | null }> {
  const url = `${baseUrl}/storage/v1/object/${bucket}/${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: data
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

async function logAudit(baseUrl: string, key: string, entityType: string, entityId: string, action: string, actorId?: string, actorName?: string, details?: object) {
  await dbQuery(baseUrl, key, 'swor_audit_log', 'POST', {
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_user_id: actorId || null,
    actor_name: actorName || null,
    details: details || null
  });
}

// Send email via Resend
async function sendEmailViaResend(to: string, subject: string, htmlContent: string): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SWOR <noreply@swor.org>',
        to: [to],
        subject,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Email send failed: ${errText}` };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: `Email error: ${String(e)}` };
  }
}

// Simple ZIP creation using deflate-raw compression
class SimpleZip {
  private files: Array<{
    name: string;
    data: Uint8Array;
    date: Date;
  }> = [];

  addFile(name: string, data: Uint8Array | string) {
    const bytes = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data;
    this.files.push({
      name,
      data: bytes,
      date: new Date()
    });
  }

  generate(): Uint8Array {
    const centralDirectory: Uint8Array[] = [];
    const localFiles: Uint8Array[] = [];
    let offset = 0;

    for (const file of this.files) {
      const nameBytes = new TextEncoder().encode(file.name);
      const crc = this.crc32(file.data);
      
      const date = file.date;
      const dosTime = (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11);
      const dosDate = date.getDate() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 10, true);
      localView.setUint16(6, 0, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, dosTime, true);
      localView.setUint16(12, dosDate, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, file.data.length, true);
      localView.setUint32(22, file.data.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localFiles.push(localHeader);
      localFiles.push(file.data);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 10, true);
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, file.data.length, true);
      centralView.setUint32(24, file.data.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);

      centralDirectory.push(centralHeader);
      offset += localHeader.length + file.data.length;
    }

    const centralDirSize = centralDirectory.reduce((sum, arr) => sum + arr.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, this.files.length, true);
    endView.setUint16(10, this.files.length, true);
    endView.setUint32(12, centralDirSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    const totalSize = offset + centralDirSize + 22;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    
    for (const part of localFiles) {
      result.set(part, pos);
      pos += part.length;
    }
    for (const part of centralDirectory) {
      result.set(part, pos);
      pos += part.length;
    }
    result.set(endRecord, pos);

    return result;
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

// Check if user is owner or steward for a profile
async function checkProfileAccess(baseUrl: string, key: string, profileId: string, userId?: string, isSteward?: boolean): Promise<{ isOwner: boolean; isSteward: boolean; profile: any }> {
  const profileResult = await dbQuery(baseUrl, key, 'individual_profiles', 'GET', undefined, `id=eq.${profileId}&select=*`);
  const profile = profileResult.data?.[0];
  
  if (!profile) {
    return { isOwner: false, isSteward: false, profile: null };
  }
  
  const isOwner = userId ? profile.user_id === userId : false;
  
  let assignedSteward = false;
  if (userId) {
    const stewardResult = await dbQuery(baseUrl, key, 'steward_assignments', 'GET', undefined, `profile_id=eq.${profileId}&steward_user_id=eq.${userId}&is_active=eq.true&select=id`);
    assignedSteward = (stewardResult.data?.length || 0) > 0;
  }
  
  return { isOwner, isSteward: assignedSteward || !!isSteward, profile };
}

// Get profile owner email
async function getProfileOwnerEmail(baseUrl: string, key: string, userId: string): Promise<string | null> {
  if (!userId) return null;
  
  // Try to get from auth.users via admin API or profiles table
  const profileResult = await dbQuery(baseUrl, key, 'profiles', 'GET', undefined, `id=eq.${userId}&select=email`);
  if (profileResult.data?.[0]?.email) {
    return profileResult.data[0].email;
  }
  
  return null;
}

// Format file size for email
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const baseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!baseUrl || !serviceKey) {
    return errorResponse('config_error', 'Missing configuration', 500);
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    // START EXPORT - Creates ZIP and returns export_id
    if (action === 'start_export') {
      const { profile_id, user_id, is_steward } = payload || {};
      
      if (!profile_id || !isValidUUID(profile_id)) {
        return errorResponse('validation_error', 'Valid profile_id is required', 422);
      }
      
      const { isOwner, isSteward: assignedSteward, profile } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id, is_steward);
      
      if (!profile) {
        return errorResponse('not_found', 'Profile not found', 404);
      }
      
      const canExport = isOwner || assignedSteward;
      if (!canExport) {
        return errorResponse('forbidden', 'Only profile owner or steward can export archive', 403);
      }
      
      const exportId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_started', user_id, undefined, {
        export_id: exportId,
        profile_name: profile.full_name || profile.title
      });
      
      const query = `profile_id=eq.${profile_id}&status=in.(draft,submitted_for_review,approved)&select=*&order=display_order.asc.nullsfirst,created_at.asc`;
      const itemsResult = await dbQuery(baseUrl, serviceKey, 'archive_items', 'GET', undefined, query);
      
      if (itemsResult.error) {
        await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_failed', user_id, undefined, {
          export_id: exportId,
          error: 'Failed to fetch archive items'
        });
        return errorResponse('fetch_error', itemsResult.error, 500);
      }
      
      const items = itemsResult.data || [];
      
      if (items.length === 0) {
        return errorResponse('no_items', 'No archive items to export', 422);
      }
      
      const zip = new SimpleZip();
      const manifest: any = {
        export_id: exportId,
        profile_id,
        profile_name: profile.full_name || profile.title || 'Unknown',
        exported_at: now,
        exported_by: user_id || 'unknown',
        item_count: items.length,
        items: [],
        missing_files: []
      };
      
      let successCount = 0;
      let failCount = 0;
      
      for (const item of items) {
        const itemManifest: any = {
          id: item.id,
          title: item.title,
          description: item.description,
          date_context: item.date_approximate,
          visibility: item.visibility,
          status: item.status,
          display_order: item.display_order,
          item_type: item.item_type,
          mime_type: item.mime_type,
          file_size: item.file_size,
          source_attribution: item.source_attribution,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
        
        if (item.storage_path) {
          const folder = item.item_type === 'image' ? 'images' : 'documents';
          const pathParts = item.storage_path.split('/');
          const originalFilename = pathParts[pathParts.length - 1];
          const zipPath = `${folder}/${originalFilename}`;
          
          const fileResult = await downloadFile(baseUrl, serviceKey, 'swor-uploads', item.storage_path);
          
          if (fileResult.data) {
            zip.addFile(zipPath, fileResult.data);
            itemManifest.file_path = zipPath;
            itemManifest.file_included = true;
            successCount++;
          } else {
            itemManifest.file_included = false;
            itemManifest.file_error = fileResult.error;
            manifest.missing_files.push({
              item_id: item.id,
              title: item.title,
              error: fileResult.error
            });
            failCount++;
          }
        } else {
          itemManifest.file_included = false;
          itemManifest.file_error = 'No storage path';
        }
        
        manifest.items.push(itemManifest);
      }
      
      manifest.files_included = successCount;
      manifest.files_missing = failCount;
      
      zip.addFile('manifest.json', JSON.stringify(manifest, null, 2));
      
      const zipData = zip.generate();
      
      const exportPath = `exports/${profile_id}/${exportId}.zip`;
      const uploadResult = await uploadFile(baseUrl, serviceKey, 'swor-exports', exportPath, zipData, 'application/zip');
      
      if (uploadResult.error) {
        await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_failed', user_id, undefined, {
          export_id: exportId,
          error: 'Failed to upload ZIP'
        });
        return errorResponse('upload_error', uploadResult.error, 500);
      }
      
      const signedUrlResult = await createSignedUrl(baseUrl, serviceKey, 'swor-exports', exportPath, 3600);
      
      await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_completed', user_id, undefined, {
        export_id: exportId,
        item_count: items.length,
        files_included: successCount,
        files_missing: failCount,
        zip_size_bytes: zipData.length
      });
      
      // Get owner email for the response (optional, for email link feature)
      const ownerEmail = profile.user_id ? await getProfileOwnerEmail(baseUrl, serviceKey, profile.user_id) : null;
      
      return successResponse({
        action: 'start_export',
        export_id: exportId,
        status: 'complete',
        profile_id,
        profile_name: profile.full_name || profile.title,
        item_count: items.length,
        files_included: successCount,
        files_missing: failCount,
        missing_files: manifest.missing_files,
        zip_size_bytes: zipData.length,
        download_url: signedUrlResult.signedUrl,
        download_expires_at: new Date(Date.now() + 3600000).toISOString(),
        completed_at: now,
        owner_email: ownerEmail
      });
    }

    // GET EXPORT STATUS - For polling
    if (action === 'get_export_status') {
      const { export_id, profile_id, user_id, is_steward } = payload || {};
      
      if (!export_id || !isValidUUID(export_id)) {
        return errorResponse('validation_error', 'Valid export_id is required', 422);
      }
      
      if (!profile_id || !isValidUUID(profile_id)) {
        return errorResponse('validation_error', 'Valid profile_id is required', 422);
      }
      
      const { isOwner, isSteward: assignedSteward, profile } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id, is_steward);
      
      if (!profile) {
        return errorResponse('not_found', 'Profile not found', 404);
      }
      
      const canAccess = isOwner || assignedSteward;
      if (!canAccess) {
        return errorResponse('forbidden', 'Only profile owner or steward can access export', 403);
      }
      
      const exportPath = `exports/${profile_id}/${export_id}.zip`;
      const signedUrlResult = await createSignedUrl(baseUrl, serviceKey, 'swor-exports', exportPath, 3600);
      
      if (signedUrlResult.error) {
        return successResponse({
          action: 'get_export_status',
          export_id,
          status: 'not_found',
          error: 'Export file not found or expired'
        });
      }
      
      return successResponse({
        action: 'get_export_status',
        export_id,
        status: 'complete',
        download_url: signedUrlResult.signedUrl,
        download_expires_at: new Date(Date.now() + 3600000).toISOString()
      });
    }

    // EMAIL EXPORT LINK - Send download link via email
    if (action === 'email_export_link') {
      const { export_id, profile_id, user_id, is_steward, to_email, message_note } = payload || {};
      
      // Validate required fields
      if (!export_id || !isValidUUID(export_id)) {
        return errorResponse('validation_error', 'Valid export_id is required', 422);
      }
      
      if (!profile_id || !isValidUUID(profile_id)) {
        return errorResponse('validation_error', 'Valid profile_id is required', 422);
      }
      
      if (!to_email || !isValidEmail(to_email)) {
        return errorResponse('validation_error', 'Valid email address is required', 422);
      }
      
      // Check auth and permissions
      const { isOwner, isSteward: assignedSteward, profile } = await checkProfileAccess(baseUrl, serviceKey, profile_id, user_id, is_steward);
      
      if (!profile) {
        return errorResponse('not_found', 'Profile not found', 404);
      }
      
      const canSend = isOwner || assignedSteward;
      if (!canSend) {
        return errorResponse('forbidden', 'Only profile owner or steward can send export emails', 403);
      }
      
      // Generate fresh signed URL for the export
      const exportPath = `exports/${profile_id}/${export_id}.zip`;
      const signedUrlResult = await createSignedUrl(baseUrl, serviceKey, 'swor-exports', exportPath, 3600);
      
      if (signedUrlResult.error || !signedUrlResult.signedUrl) {
        await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_email_failed', user_id, undefined, {
          export_id,
          recipient_email: to_email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: 'Export file not found'
        });
        return errorResponse('not_found', 'Export file not found or has expired. Please generate a new export.', 404);
      }
      
      // Get item count from manifest if possible (we'll estimate based on profile)
      const profileName = profile.full_name || profile.title || 'Your SWOR Profile';
      const expiryHours = 1;
      
      // Build calm, plain English email
      const emailSubject = 'Your SWOR archive export is ready';
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1A2332; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #F5F1E8; padding: 30px; border-radius: 8px;">
    <h1 style="font-size: 24px; margin: 0 0 20px 0; color: #1A2332;">Your SWOR archive export is ready</h1>
    
    <p style="margin: 0 0 16px 0;">
      The archive export for <strong>${profileName}</strong> has been prepared and is ready to download.
    </p>
    
    <p style="margin: 0 0 24px 0;">
      <a href="${signedUrlResult.signedUrl}" 
         style="display: inline-block; background-color: #8B9D83; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Download Archive
      </a>
    </p>
    
    <div style="background-color: white; padding: 16px; border-radius: 6px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #1A2332;">
        <strong>Please note:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666;">
        <li>This link expires in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}</li>
        <li>The download includes your archive files and a manifest.json with metadata</li>
        <li>You can generate a new export anytime from your SWOR profile</li>
      </ul>
    </div>
    
    ${message_note ? `
    <div style="background-color: #E8EDE6; padding: 12px 16px; border-radius: 6px; margin: 0 0 20px 0; font-size: 14px;">
      <p style="margin: 0; color: #666;"><em>${message_note}</em></p>
    </div>
    ` : ''}
    
    <p style="margin: 0; font-size: 14px; color: #666;">
      If you have any questions, please contact your steward or visit SWOR.
    </p>
  </div>
  
  <p style="margin: 20px 0 0 0; font-size: 12px; color: #999; text-align: center;">
    SWOR - Stories Worth Recording
  </p>
</body>
</html>
      `.trim();
      
      // Send email via Resend
      const emailResult = await sendEmailViaResend(to_email, emailSubject, emailHtml);
      
      if (!emailResult.success) {
        await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_email_failed', user_id, undefined, {
          export_id,
          recipient_email: to_email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error: emailResult.error
        });
        return errorResponse('email_failed', emailResult.error || 'Failed to send email', 500);
      }
      
      // Log success
      await logAudit(baseUrl, serviceKey, 'archive_export', profile_id, 'archive_export_email_sent', user_id, undefined, {
        export_id,
        recipient_email: to_email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        profile_name: profileName
      });
      
      return successResponse({
        action: 'email_export_link',
        export_id,
        sent_to: to_email,
        profile_name: profileName
      });
    }

    // DEBUG / VERSION CHECK
    if (action === 'debug' || action === 'version_check') {
      return successResponse({
        version: VERSION,
        action: 'debug',
        timestamp: new Date().toISOString(),
        capabilities: ['start_export', 'get_export_status', 'email_export_link']
      });
    }

    return errorResponse('unknown_action', `Received: ${action}`, 400);
  } catch (error) {
    return jsonResponse({ success: false, error: 'server_error', detail: String(error) }, 500);
  }
});
