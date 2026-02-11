import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, FileText, Image, File, ExternalLink, AlertCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  storagePath: string;
  mime: string | null;
  fileSize: number | null;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  storagePath,
  mime,
  fileSize
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [downloadData, setDownloadData] = useState<{ data: string; contentType: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isImage = mime?.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  const isWord = mime?.includes('word') || mime?.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx');

  useEffect(() => {
    if (isOpen && storagePath) {
      loadPreview();
    }
    return () => {
      // Cleanup
      setImageData(null);
      setPdfData(null);
      setDownloadData(null);
      setError('');
      setZoom(1);
      setRotation(0);
    };
  }, [isOpen, storagePath]);

  const loadPreview = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('[Preview] Loading file:', storagePath, 'MIME:', mime);
      
      // Get file data directly (works for all file types)
      const { data, error: fetchError } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'get_file_data',
          payload: { storage_path: storagePath }
        }
      });

      if (fetchError) {
        console.error('[Preview] Fetch error:', fetchError);
        throw new Error(fetchError.message);
      }
      
      if (!data.success) {
        console.error('[Preview] API error:', data.error, data.detail);
        throw new Error(data.detail || data.error || 'Failed to load file');
      }

      console.log('[Preview] File loaded successfully, content type:', data.content_type);

      // Store download data for all file types
      setDownloadData({
        data: data.data,
        contentType: data.content_type
      });

      // Create data URL for preview based on file type
      if (isImage) {
        const dataUrl = `data:${data.content_type};base64,${data.data}`;
        setImageData(dataUrl);
      } else if (isPdf) {
        const dataUrl = `data:application/pdf;base64,${data.data}`;
        setPdfData(dataUrl);
      }

    } catch (err: any) {
      console.error('[Preview] Error:', err);
      setError(err.message || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadData) {
      // Create a blob from base64 data
      const byteCharacters = atob(downloadData.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: downloadData.contentType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = () => {
    if (isImage) return 'Image';
    if (isPdf) return 'PDF Document';
    if (isWord) return 'Word Document';
    return 'Document';
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="w-6 h-6" />;
    if (isPdf || isWord) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1A2332]/10 bg-white/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#B8826D]/10 rounded-lg flex items-center justify-center text-[#B8826D]">
              {getFileIcon()}
            </div>
            <div>
              <h3 className="font-medium text-[#1A2332] text-sm truncate max-w-[300px]" title={fileName}>
                {fileName}
              </h3>
              <p className="text-xs text-[#1A2332]/50">
                {getFileTypeLabel()} • {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {downloadData && (
              <button
                onClick={handleDownload}
                className="flex items-center px-3 py-2 text-sm text-[#1A2332] hover:bg-[#1A2332]/5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
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

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-[#1A2332]/5 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="w-10 h-10 text-[#B8826D] animate-spin mb-4" />
              <p className="text-[#1A2332]/60">Loading preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-[#1A2332]/70 font-medium mb-2">Unable to load preview</p>
              <p className="text-sm text-[#1A2332]/50 text-center max-w-md mb-4">{error}</p>
              {downloadData && (
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File Instead
                </button>
              )}
            </div>
          ) : isImage && imageData ? (
            // Image Preview
            <div className="relative h-full">
              {/* Image Controls */}
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white/90 rounded-lg p-1 shadow-lg">
                <button
                  onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                  className="p-2 text-[#1A2332]/70 hover:text-[#1A2332] hover:bg-[#1A2332]/5 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#1A2332]/60 min-w-[40px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="p-2 text-[#1A2332]/70 hover:text-[#1A2332] hover:bg-[#1A2332]/5 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-[#1A2332]/10" />
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-2 text-[#1A2332]/70 hover:text-[#1A2332] hover:bg-[#1A2332]/5 rounded transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
              
              {/* Image Display */}
              <div className="flex items-center justify-center p-8 min-h-[400px] overflow-auto">
                <img
                  src={imageData}
                  alt={fileName}
                  className="max-w-full rounded-lg shadow-lg transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                />
              </div>
            </div>
          ) : isPdf && pdfData ? (
            // PDF Preview using embedded base64 data
            <div className="h-full min-h-[500px]">
              <iframe
                src={pdfData}
                className="w-full h-full min-h-[500px] border-0"
                title={fileName}
              />
            </div>
          ) : (
            // Document Preview (Word, etc.) - Show download option
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-20 h-20 bg-[#B8826D]/10 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-[#B8826D]" />
              </div>
              <h4 className="text-lg font-medium text-[#1A2332] mb-2">{fileName}</h4>
              <p className="text-sm text-[#1A2332]/60 mb-6 text-center max-w-md">
                {isWord 
                  ? 'Word documents cannot be previewed directly in the browser. Please download the file to view its contents.'
                  : 'This file type cannot be previewed in the browser. Please download to view.'}
              </p>
              <div className="flex items-center space-x-3">
                {downloadData && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-5 py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with file info */}
        <div className="px-4 py-3 border-t border-[#1A2332]/10 bg-white/30">
          <div className="flex items-center justify-between text-xs text-[#1A2332]/50">
            <span>Storage path: {storagePath}</span>
            <span>MIME type: {mime || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
