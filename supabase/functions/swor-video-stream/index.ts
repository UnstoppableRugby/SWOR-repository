// SWOR Video Streaming v1.1 - Range Request Support for Progressive Video Loading
const VERSION = '1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Type',
  'x-swor-stream-version': VERSION
};

function errorResponse(error: string, detail: string | null = null, status = 500): Response {
  return new Response(JSON.stringify({ success: false, error, detail, version: VERSION }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Parse Range header: "bytes=0-1023" -> { start: 0, end: 1023 }
function parseRangeHeader(rangeHeader: string | null, fileSize: number): { start: number; end: number } | null {
  if (!rangeHeader) return null;
  
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;
  
  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
  
  // Handle suffix range (e.g., "bytes=-500" means last 500 bytes)
  if (!match[1] && match[2]) {
    start = Math.max(0, fileSize - parseInt(match[2], 10));
    end = fileSize - 1;
  }
  
  // Clamp values
  start = Math.max(0, start);
  end = Math.min(fileSize - 1, end);
  
  if (start > end || start >= fileSize) {
    return null;
  }
  
  return { start, end };
}

// Get content type from file extension
function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mov': return 'video/quicktime';
    case 'avi': return 'video/x-msvideo';
    case 'mkv': return 'video/x-matroska';
    default: return 'video/mp4';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const baseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!baseUrl || !serviceKey) {
    return errorResponse('config_error', 'Missing Supabase configuration', 500);
  }

  try {
    const url = new URL(req.url);
    
    // Support both GET with query params and POST with body
    let storagePath: string | null = null;
    
    if (req.method === 'GET') {
      storagePath = url.searchParams.get('path');
    } else if (req.method === 'POST') {
      const body = await req.json();
      
      // Handle action-based requests for getting stream URL
      if (body.action === 'get_stream_url') {
        const { storage_path } = body.payload || {};
        if (!storage_path) {
          return errorResponse('validation_error', 'storage_path is required', 422);
        }
        
        // Return the streaming URL using the Supabase functions base URL
        const streamUrl = `${baseUrl}/functions/v1/swor-video-stream?path=${encodeURIComponent(storage_path)}`;
        
        return new Response(JSON.stringify({
          success: true,
          version: VERSION,
          stream_url: streamUrl,
          storage_path: storage_path,
          supports_range_requests: true,
          usage: 'Use the stream_url as the video src. The browser will handle range requests automatically.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      storagePath = body.storage_path || body.path;
    }
    
    if (!storagePath) {
      return errorResponse('validation_error', 'storage_path or path query parameter is required', 422);
    }

    const bucket = 'swor-uploads';
    const storageUrl = `${baseUrl}/storage/v1/object/${bucket}/${storagePath}`;
    
    // First, get file metadata (HEAD request to get size)
    const headResponse = await fetch(storageUrl, {
      method: 'HEAD',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    if (!headResponse.ok) {
      if (headResponse.status === 404) {
        return errorResponse('not_found', `Video file not found: ${storagePath}`, 404);
      }
      const errText = await headResponse.text();
      return errorResponse('storage_error', `Failed to access video: HTTP ${headResponse.status} - ${errText}`, headResponse.status);
    }
    
    const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);
    const contentType = headResponse.headers.get('content-type') || getContentType(storagePath);
    
    if (contentLength === 0) {
      return errorResponse('invalid_file', 'Video file is empty or size unknown', 400);
    }
    
    // Parse Range header from the request
    const rangeHeader = req.headers.get('range');
    const range = parseRangeHeader(rangeHeader, contentLength);
    
    // Prepare headers for the storage request
    const storageHeaders: Record<string, string> = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    };
    
    // If range is requested, add Range header to storage request
    if (range) {
      storageHeaders['Range'] = `bytes=${range.start}-${range.end}`;
    }
    
    // Fetch the video (full or partial)
    const videoResponse = await fetch(storageUrl, {
      method: 'GET',
      headers: storageHeaders
    });
    
    if (!videoResponse.ok && videoResponse.status !== 206) {
      const errText = await videoResponse.text();
      return errorResponse('fetch_error', `Failed to fetch video: HTTP ${videoResponse.status} - ${errText}`, videoResponse.status);
    }
    
    // Build response headers
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    };
    
    let status = 200;
    
    if (range) {
      // Partial content response
      status = 206;
      const chunkSize = range.end - range.start + 1;
      responseHeaders['Content-Length'] = chunkSize.toString();
      responseHeaders['Content-Range'] = `bytes ${range.start}-${range.end}/${contentLength}`;
    } else {
      // Full content response
      responseHeaders['Content-Length'] = contentLength.toString();
    }
    
    // Stream the response body
    return new Response(videoResponse.body, {
      status,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('[VideoStream] Error:', error);
    return errorResponse('server_error', String(error), 500);
  }
});
