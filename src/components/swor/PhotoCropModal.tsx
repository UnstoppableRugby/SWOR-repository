import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Move, Loader2, Upload, HelpCircle } from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  imagePreview: string;
  profileName: string;
  onCropComplete: (croppedImageData: string, altText: string) => void;
  isUploading?: boolean;
}

// Fixed 4:5 portrait aspect ratio
const ASPECT_RATIO = 4 / 5;
const OUTPUT_MAX_SIZE = 1200; // Max dimension for output

const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  imagePreview,
  profileName,
  onCropComplete,
  isUploading = false
}) => {
  // Image state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Transform state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Alt text
  const [altText, setAltText] = useState('');
  const [showAltTextHelp, setShowAltTextHelp] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate crop area dimensions based on container
  const getCropAreaDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 280, height: 350 };
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Calculate max crop area that fits in container with padding
    const maxWidth = Math.min(containerWidth - 48, 320);
    const maxHeight = Math.min(containerHeight - 48, 400);
    
    // Apply 4:5 aspect ratio
    let cropWidth = maxWidth;
    let cropHeight = cropWidth / ASPECT_RATIO;
    
    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * ASPECT_RATIO;
    }
    
    return { width: cropWidth, height: cropHeight };
  }, []);

  const [cropArea, setCropArea] = useState({ width: 280, height: 350 });

  // Update crop area on resize
  useEffect(() => {
    const updateCropArea = () => {
      setCropArea(getCropAreaDimensions());
    };
    
    updateCropArea();
    window.addEventListener('resize', updateCropArea);
    return () => window.removeEventListener('resize', updateCropArea);
  }, [getCropAreaDimensions, isOpen]);

  // Load and fix EXIF orientation
  useEffect(() => {
    if (!isOpen || !imagePreview) return;
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
      
      // Calculate initial zoom to fit image in crop area
      const cropDims = getCropAreaDimensions();
      const scaleX = cropDims.width / img.width;
      const scaleY = cropDims.height / img.height;
      const initialZoom = Math.max(scaleX, scaleY) * 1.1; // Slightly larger to allow movement
      setZoom(Math.max(initialZoom, 0.5));
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imagePreview;
  }, [isOpen, imagePreview, getCropAreaDimensions]);

  // Handle mouse/touch drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  }, [position]);

  // Handle mouse/touch drag move
  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Calculate bounds based on image size and zoom
    const scaledWidth = imageDimensions.width * zoom;
    const scaledHeight = imageDimensions.height * zoom;
    const maxX = Math.max(0, (scaledWidth - cropArea.width) / 2);
    const maxY = Math.max(0, (scaledHeight - cropArea.height) / 2);
    
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY))
    });
  }, [isDragging, dragStart, imageDimensions, zoom, cropArea]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse/touch listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const newX = clientX - dragStart.x;
        const newY = clientY - dragStart.y;
        
        const scaledWidth = imageDimensions.width * zoom;
        const scaledHeight = imageDimensions.height * zoom;
        const maxX = Math.max(0, (scaledWidth - cropArea.width) / 2);
        const maxY = Math.max(0, (scaledHeight - cropArea.height) / 2);
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY))
        });
      };
      
      const handleGlobalEnd = () => setIsDragging(false);
      
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalEnd);
        window.removeEventListener('touchmove', handleGlobalMove);
        window.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isDragging, dragStart, imageDimensions, zoom, cropArea]);

  // Handle zoom change
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
    setZoom(clampedZoom);
    
    // Adjust position to stay within bounds
    const scaledWidth = imageDimensions.width * clampedZoom;
    const scaledHeight = imageDimensions.height * clampedZoom;
    const maxX = Math.max(0, (scaledWidth - cropArea.width) / 2);
    const maxY = Math.max(0, (scaledHeight - cropArea.height) / 2);
    
    setPosition(prev => ({
      x: Math.max(-maxX, Math.min(maxX, prev.x)),
      y: Math.max(-maxY, Math.min(maxY, prev.y))
    }));
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Generate cropped image
  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate output dimensions maintaining 4:5 ratio
    let outputWidth = OUTPUT_MAX_SIZE;
    let outputHeight = OUTPUT_MAX_SIZE / ASPECT_RATIO;
    
    if (outputHeight > OUTPUT_MAX_SIZE) {
      outputHeight = OUTPUT_MAX_SIZE;
      outputWidth = OUTPUT_MAX_SIZE * ASPECT_RATIO;
    }
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    
    // Calculate the source crop area from the original image
    const img = imageRef.current;
    const scaledWidth = imageDimensions.width * zoom;
    const scaledHeight = imageDimensions.height * zoom;
    
    // Calculate what portion of the image is visible in the crop area
    const cropCenterX = (scaledWidth / 2) - position.x;
    const cropCenterY = (scaledHeight / 2) - position.y;
    
    // Convert crop area to source image coordinates
    const sourceX = (cropCenterX - cropArea.width / 2) / zoom;
    const sourceY = (cropCenterY - cropArea.height / 2) / zoom;
    const sourceWidth = cropArea.width / zoom;
    const sourceHeight = cropArea.height / zoom;
    
    // Handle rotation
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);
    }
    
    // Draw the cropped portion
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );
    ctx.restore();
    
    // Get the cropped image as base64
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = croppedDataUrl.split(',')[1];
    
    // Generate alt text if not provided
    const finalAltText = altText.trim() || `Portrait of ${profileName || 'user'}`;
    
    onCropComplete(base64Data, finalAltText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1A2332]/10">
          <div>
            <h3 className="font-serif text-lg sm:text-xl text-[#1A2332]">Adjust Your Photo</h3>
            <p className="text-sm text-[#1A2332]/60 mt-0.5">Move and zoom to frame your photo</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-[#1A2332]/40 hover:text-[#1A2332] p-2 -mr-2 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-[#1A2332] overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[350px]"
        >
          {/* Image */}
          {imageLoaded && (
            <img
              ref={imageRef}
              src={imagePreview}
              alt="Photo to crop"
              className="absolute select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                cursor: isDragging ? 'grabbing' : 'grab',
                maxWidth: 'none',
                maxHeight: 'none'
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              draggable={false}
            />
          )}
          
          {/* Crop Overlay */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: cropArea.width,
              height: cropArea.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '8px'
            }}
          />
          
          {/* Aspect Ratio Label */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 rounded text-xs text-white/80">
            4:5 Portrait
          </div>
          
          {/* Move Hint */}
          {!isDragging && imageLoaded && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center px-3 py-1.5 bg-black/50 rounded-full text-xs text-white/80">
              <Move className="w-3.5 h-3.5 mr-1.5" />
              Drag to reposition
            </div>
          )}
          
          {/* Loading state */}
          {!imageLoaded && (
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-5 bg-[#F5F1E8] border-t border-[#1A2332]/10 space-y-4">
          {/* Zoom Slider */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleZoomChange(zoom - 0.1)}
              disabled={zoom <= 0.5 || isUploading}
              className="p-2 text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-white rounded-lg transition-colors disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                disabled={isUploading}
                className="w-full h-2 bg-[#1A2332]/10 rounded-full appearance-none cursor-pointer disabled:opacity-50
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#B8826D]
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[#B8826D]
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white"
              />
            </div>
            
            <button
              onClick={() => handleZoomChange(zoom + 0.1)}
              disabled={zoom >= 3 || isUploading}
              className="p-2 text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-white rounded-lg transition-colors disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            
            {/* Rotate Button */}
            <button
              onClick={handleRotate}
              disabled={isUploading}
              className="p-2 text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-white rounded-lg transition-colors disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center ml-2"
              aria-label="Rotate 90 degrees"
              title="Rotate"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Alt Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="photo-alt-text" className="text-sm font-medium text-[#1A2332]/80">
                Photo description
                <span className="text-[#1A2332]/40 font-normal ml-1">(optional)</span>
              </label>
              <button
                onClick={() => setShowAltTextHelp(!showAltTextHelp)}
                className="text-[#1A2332]/40 hover:text-[#1A2332]/60 p-1"
                aria-label="Help with photo description"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            
            {showAltTextHelp && (
              <p className="text-xs text-[#8B9D83] mb-2 p-2 bg-[#8B9D83]/10 rounded">
                This helps people using screen readers understand your photo. 
                If left blank, we'll use "Portrait of {profileName || 'your name'}".
              </p>
            )}
            
            <input
              id="photo-alt-text"
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder={`e.g., Portrait from 1985, or Team photo at Twickenham`}
              disabled={isUploading}
              className="w-full px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-3 text-[#1A2332]/70 hover:text-[#1A2332] hover:bg-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={isUploading || !imageLoaded}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Use photo
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PhotoCropModal;
