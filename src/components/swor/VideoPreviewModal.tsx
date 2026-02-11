import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, Video, Play, Pause, Volume2, VolumeX, Maximize, Film, Clock, FileText, User, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  storagePath: string;
  thumbPath?: string | null;
  mime: string | null;
  fileSize: number | null;
  duration?: number | null;
  title?: string | null;
  description?: string | null;
  creditPreference?: string | null;
  creditLine?: string | null;
  rightsStatus?: string | null;
  sourceNotes?: string | null;
  visibility?: string | null;
  uploaderName?: string | null;
  createdAt?: string | null;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  storagePath,
  thumbPath,
  mime,
  fileSize,
  duration,
  title,
  description,
  creditPreference,
  creditLine,
  rightsStatus,
  sourceNotes,
  visibility,
  uploaderName,
  createdAt
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && storagePath) {
      loadVideo();
    }
    return () => {
      // Cleanup
      if (thumbUrl && thumbUrl.startsWith('blob:')) {
        URL.revokeObjectURL(thumbUrl);
      }
      setStreamUrl(null);
      setThumbUrl(null);
      setError('');
      setIsPlaying(false);
      setBufferedPercent(0);
      setCurrentTime(0);
      setDownloadProgress(null);
    };
  }, [isOpen, storagePath]);

  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  const loadVideo = async () => {
    setLoading(true);
    setError('');
    setIsStreaming(false);

    try {
      console.log('[VideoPreview] Loading video with streaming:', storagePath);
      
      // Get streaming URL from the edge function
      const { data, error: fetchError } = await supabase.functions.invoke('swor-video-stream', {
        body: {
          action: 'get_stream_url',
          payload: { storage_path: storagePath }
        }
      });

      if (fetchError) {
        console.error('[VideoPreview] Stream URL error:', fetchError);
        throw new Error(fetchError.message);
      }
      
      if (!data.success) {
        console.error('[VideoPreview] API error:', data.error, data.detail);
        throw new Error(data.detail || data.error || 'Failed to get stream URL');
      }

      console.log('[VideoPreview] Stream URL obtained:', data.stream_url);
      setStreamUrl(data.stream_url);
      setIsStreaming(true);

      // Load thumbnail if available
      if (thumbPath) {
        try {
          const { data: thumbData, error: thumbError } = await supabase.functions.invoke('swor-file-upload', {
            body: {
              action: 'get_file_data',
              payload: { storage_path: thumbPath }
            }
          });

          if (!thumbError && thumbData?.success) {
            const thumbBlob = base64ToBlob(thumbData.data, thumbData.content_type || 'image/jpeg');
            const thumbBlobUrl = URL.createObjectURL(thumbBlob);
            setThumbUrl(thumbBlobUrl);
          }
        } catch (thumbErr) {
          console.warn('[VideoPreview] Thumbnail load failed:', thumbErr);
        }
      }

    } catch (err: any) {
      console.error('[VideoPreview] Error:', err);
      setError(err.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVisibilityLabel = (vis: string | null | undefined) => {
    switch (vis) {
      case 'private_draft': return 'Private Draft';
      case 'family': return 'Family / Trusted Circle';
      case 'connections': return 'Connections Only';
      case 'public': return 'Public';
      default: return vis || 'Unknown';
    }
  };

  const getCreditLabel = (pref: string | null | undefined) => {
    switch (pref) {
      case 'name': return 'By Name';
      case 'organisation': return 'By Organisation';
      case 'anonymous': return 'Anonymous';
      case 'none': return 'No Credit';
      default: return pref || 'Not specified';
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const buffered = videoRef.current.buffered;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        // Get the buffered range that includes the current time
        let bufferedEnd = 0;
        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) <= videoRef.current.currentTime) {
            bufferedEnd = Math.max(bufferedEnd, buffered.end(i));
          }
        }
        setBufferedPercent((bufferedEnd / duration) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleDownload = async () => {
    if (!streamUrl) return;
    
    setDownloadProgress(0);
    
    try {
      // Fetch the full video for download
      const response = await fetch(streamUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (contentLength > 0) {
          setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
        }
      }
      
      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: mime || 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadProgress(null);
    } catch (err) {
      console.error('[VideoPreview] Download error:', err);
      setDownloadProgress(null);
      // Fallback: open in new tab
      window.open(streamUrl, '_blank');
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && videoDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoDuration;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1A2332]/10 bg-white/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-[#1A2332] text-sm truncate max-w-[300px]" title={title || fileName}>
                {title || fileName}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-[#1A2332]/50">
                <span>Video • {formatFileSize(fileSize)} • {formatDuration(duration)}</span>
                {isStreaming && (
                  <span className="flex items-center text-green-600">
                    <Wifi className="w-3 h-3 mr-1" />
                    Streaming
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {streamUrl && (
              <button
                onClick={handleDownload}
                disabled={downloadProgress !== null}
                className="flex items-center px-3 py-2 text-sm text-[#1A2332] hover:bg-[#1A2332]/5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadProgress !== null ? `${downloadProgress}%` : 'Download'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-[#1A2332]/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
              <p className="text-[#1A2332]/60">Preparing video stream...</p>
              <p className="text-xs text-[#1A2332]/40 mt-2">Setting up progressive loading</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-[#1A2332]/70 font-medium mb-2">Unable to load video</p>
              <p className="text-sm text-[#1A2332]/50 text-center max-w-md">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Video Player Section */}
              <div className="lg:col-span-2 bg-black relative">
                {streamUrl ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                  >
                    <video
                      ref={videoRef}
                      src={streamUrl}
                      poster={thumbUrl || undefined}
                      className="w-full max-h-[500px] object-contain"
                      controls
                      preload="metadata"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onProgress={handleProgress}
                      onLoadedMetadata={handleLoadedMetadata}
                    >
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Custom overlay play button (shows when paused) */}
                    {!isPlaying && showControls && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
                        onClick={handlePlayPause}
                      >
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-cyan-600 ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Buffer Progress Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div 
                        className="h-full bg-cyan-500/30 transition-all duration-300"
                        style={{ width: `${bufferedPercent}%` }}
                      />
                      <div 
                        className="h-full bg-cyan-500 absolute top-0 left-0 transition-all duration-100"
                        style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#1A2332]/10">
                    <Film className="w-16 h-16 text-[#1A2332]/20 mb-4" />
                    <p className="text-[#1A2332]/50">Video not available</p>
                  </div>
                )}

                {/* Streaming Info Bar */}
                {isStreaming && (
                  <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span>Range Streaming Active</span>
                    {bufferedPercent > 0 && bufferedPercent < 100 && (
                      <span className="text-cyan-300">• {Math.round(bufferedPercent)}% buffered</span>
                    )}
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="bg-white/50 p-4 lg:border-l border-[#1A2332]/10 overflow-y-auto max-h-[500px]">
                <h4 className="text-sm font-medium text-[#1A2332] mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-[#B8826D]" />
                  Video Details
                </h4>

                <div className="space-y-4">
                  {/* Streaming Status */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                      <Wifi className="w-4 h-4 mr-2" />
                      Progressive Streaming
                    </div>
                    <p className="text-xs text-green-600">
                      Video loads progressively with range requests. Seek anywhere without downloading the full file.
                    </p>
                  </div>

                  {/* Thumbnail Preview */}
                  {thumbUrl && (
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Thumbnail</label>
                      <div className="mt-1 rounded-lg overflow-hidden border border-[#1A2332]/10">
                        <img 
                          src={thumbUrl} 
                          alt="Video thumbnail" 
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  <div>
                    <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">File Name</label>
                    <p className="text-sm text-[#1A2332] mt-0.5 break-all">{fileName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Size</label>
                      <p className="text-sm text-[#1A2332] mt-0.5">{formatFileSize(fileSize)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Duration</label>
                      <p className="text-sm text-[#1A2332] mt-0.5 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-[#1A2332]/40" />
                        {formatDuration(videoDuration || duration)}
                      </p>
                    </div>
                  </div>

                  {/* Playback Progress */}
                  {videoDuration > 0 && (
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Playback</label>
                      <div className="mt-1">
                        <div 
                          className="h-2 bg-[#1A2332]/10 rounded-full overflow-hidden cursor-pointer"
                          onClick={handleSeek}
                        >
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all"
                            style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-[#1A2332]/50 mt-1">
                          <span>{formatDuration(currentTime)}</span>
                          <span>{formatDuration(videoDuration)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Format</label>
                    <p className="text-sm text-[#1A2332] mt-0.5">{mime || 'Unknown'}</p>
                  </div>

                  {/* Title & Description */}
                  {title && (
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Title</label>
                      <p className="text-sm text-[#1A2332] mt-0.5">{title}</p>
                    </div>
                  )}

                  {description && (
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Description</label>
                      <p className="text-sm text-[#1A2332]/80 mt-0.5 whitespace-pre-wrap">{description}</p>
                    </div>
                  )}

                  {/* Visibility */}
                  {visibility && (
                    <div>
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Visibility
                      </label>
                      <p className="text-sm text-[#1A2332] mt-0.5">{getVisibilityLabel(visibility)}</p>
                    </div>
                  )}

                  {/* Attribution */}
                  <div className="pt-3 border-t border-[#1A2332]/10">
                    <h5 className="text-xs font-medium text-[#1A2332]/70 uppercase tracking-wide mb-2 flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      Attribution
                    </h5>

                    {uploaderName && (
                      <div className="mb-2">
                        <label className="text-xs text-[#1A2332]/50">Uploaded By</label>
                        <p className="text-sm text-[#1A2332] mt-0.5">{uploaderName}</p>
                      </div>
                    )}

                    {creditPreference && (
                      <div className="mb-2">
                        <label className="text-xs text-[#1A2332]/50">Credit Preference</label>
                        <p className="text-sm text-[#1A2332] mt-0.5">{getCreditLabel(creditPreference)}</p>
                      </div>
                    )}

                    {creditLine && (
                      <div className="mb-2">
                        <label className="text-xs text-[#1A2332]/50">Credit Line</label>
                        <p className="text-sm text-[#1A2332] mt-0.5">{creditLine}</p>
                      </div>
                    )}

                    {rightsStatus && (
                      <div className="mb-2">
                        <label className="text-xs text-[#1A2332]/50">Rights Status</label>
                        <p className="text-sm text-[#1A2332] mt-0.5">{rightsStatus}</p>
                      </div>
                    )}

                    {sourceNotes && (
                      <div>
                        <label className="text-xs text-[#1A2332]/50">Source Notes</label>
                        <p className="text-sm text-[#1A2332]/80 mt-0.5 italic">"{sourceNotes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  {createdAt && (
                    <div className="pt-3 border-t border-[#1A2332]/10">
                      <label className="text-xs text-[#1A2332]/50 uppercase tracking-wide">Uploaded</label>
                      <p className="text-sm text-[#1A2332]/70 mt-0.5">{formatDate(createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1A2332]/10 bg-white/30">
          <div className="flex items-center justify-between text-xs text-[#1A2332]/50">
            <div className="flex items-center space-x-4">
              <span className="truncate max-w-[40%]">Path: {storagePath}</span>
              {isStreaming && (
                <span className="flex items-center text-green-600">
                  <Wifi className="w-3 h-3 mr-1" />
                  HTTP Range Requests Enabled
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1A2332] text-white rounded-lg text-sm hover:bg-[#1A2332]/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
