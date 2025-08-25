import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  EyeIcon,
  CameraIcon,
  InformationCircleIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

interface CarImage {
  id: string;
  url: string;
  angle: number;
  view: 'exterior' | 'interior' | 'engine' | 'trunk';
  hotspots?: Array<{
    x: number;
    y: number;
    title: string;
    description: string;
    icon?: React.ReactNode;
  }>;
}

interface CarViewer360Props {
  images: CarImage[];
  carTitle: string;
  autoPlay?: boolean;
  showHotspots?: boolean;
  className?: string;
  onImageChange?: (image: CarImage) => void;
}

const CarViewer360: React.FC<CarViewer360Props> = ({
  images,
  carTitle,
  autoPlay = false,
  showHotspots = true,
  className = '',
  onImageChange
}) => {
  const { language } = useAppStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentView, setCurrentView] = useState<'exterior' | 'interior' | 'engine' | 'trunk'>('exterior');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentImage = images[currentImageIndex];
  const filteredImages = images.filter(img => img.view === currentView);
  const currentViewIndex = filteredImages.findIndex(img => img.id === currentImage?.id);

  useEffect(() => {
    if (onImageChange && currentImage) {
      onImageChange(currentImage);
    }
  }, [currentImage, onImageChange]);

  useEffect(() => {
    if (isPlaying && !isDragging) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => {
          const viewImages = images.filter(img => img.view === currentView);
          const currentIndex = viewImages.findIndex(img => img.id === images[prev]?.id);
          const nextIndex = (currentIndex + 1) % viewImages.length;
          return images.findIndex(img => img.id === viewImages[nextIndex]?.id);
        });
      }, 150);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isDragging, currentView, images]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) return; // Don't rotate when zoomed
    setIsDragging(true);
    setLastMouseX(e.clientX);
    setIsPlaying(false);
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom > 1) return;

    const deltaX = e.clientX - lastMouseX;
    const sensitivity = 2;
    
    if (Math.abs(deltaX) > sensitivity) {
      const viewImages = images.filter(img => img.view === currentView);
      const currentIndex = viewImages.findIndex(img => img.id === currentImage?.id);
      
      let newIndex;
      if (deltaX > 0) {
        newIndex = (currentIndex + 1) % viewImages.length;
      } else {
        newIndex = currentIndex === 0 ? viewImages.length - 1 : currentIndex - 1;
      }
      
      const globalIndex = images.findIndex(img => img.id === viewImages[newIndex]?.id);
      setCurrentImageIndex(globalIndex);
      setLastMouseX(e.clientX);
    }
  }, [isDragging, lastMouseX, currentView, images, currentImage]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom > 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setLastMouseX(touch.clientX);
    setIsPlaying(false);
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || zoom > 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMouseX;
    const sensitivity = 5;
    
    if (Math.abs(deltaX) > sensitivity) {
      const viewImages = images.filter(img => img.view === currentView);
      const currentIndex = viewImages.findIndex(img => img.id === currentImage?.id);
      
      let newIndex;
      if (deltaX > 0) {
        newIndex = (currentIndex + 1) % viewImages.length;
      } else {
        newIndex = currentIndex === 0 ? viewImages.length - 1 : currentIndex - 1;
      }
      
      const globalIndex = images.findIndex(img => img.id === viewImages[newIndex]?.id);
      setCurrentImageIndex(globalIndex);
      setLastMouseX(touch.clientX);
    }
  }, [isDragging, lastMouseX, currentView, images, currentImage]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(1, Math.min(5, zoom + delta));
    setZoom(newZoom);
    
    if (newZoom === 1) {
      setPanX(0);
      setPanY(0);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (zoom > 1) {
      const rect = imageRef.current?.getBoundingClientRect();
      if (rect) {
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 100;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 100;
        setPanX(x);
        setPanY(y);
      }
    }
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const switchView = (view: 'exterior' | 'interior' | 'engine' | 'trunk') => {
    const viewImages = images.filter(img => img.view === view);
    if (viewImages.length > 0) {
      const newIndex = images.findIndex(img => img.id === viewImages[0].id);
      setCurrentImageIndex(newIndex);
      setCurrentView(view);
      resetView();
    }
  };

  const viewLabels = {
    exterior: language === 'ar' ? 'الخارج' : 'Exterior',
    interior: language === 'ar' ? 'الداخل' : 'Interior',
    engine: language === 'ar' ? 'المحرك' : 'Engine',
    trunk: language === 'ar' ? 'الصندوق' : 'Trunk'
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden ${className} ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Main Viewer */}
      <div className="relative aspect-video lg:aspect-square">
        <img
          ref={imageRef}
          src={currentImage?.url}
          alt={`${carTitle} - ${viewLabels[currentView]}`}
          className={`w-full h-full object-cover cursor-${zoom > 1 ? 'move' : 'grab'} ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{
            transform: `scale(${zoom}) translate(${panX * (zoom - 1)}px, ${panY * (zoom - 1)}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleImageClick}
          draggable={false}
        />

        {/* Loading Indicator */}
        {!currentImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Hotspots */}
        <AnimatePresence>
          {showHotspots && currentImage?.hotspots && zoom === 1 && (
            <>
              {currentImage.hotspots.map((hotspot, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg ${
                    selectedHotspot === index ? 'ring-4 ring-white' : ''
                  }`}
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => setSelectedHotspot(selectedHotspot === index ? null : index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {hotspot.icon || <InformationCircleIcon className="w-4 h-4 text-white" />}
                </motion.div>
              ))}

              {/* Hotspot Info Panel */}
              {selectedHotspot !== null && currentImage.hotspots[selectedHotspot] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-4 shadow-xl"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {currentImage.hotspots[selectedHotspot].title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentImage.hotspots[selectedHotspot].description}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Control Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
            <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
              <span className="text-white text-sm font-medium">
                {language === 'ar' ? `${currentViewIndex + 1} من ${filteredImages.length}` : `${currentViewIndex + 1} of ${filteredImages.length}`}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Play/Pause Button */}
              <motion.button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </motion.button>

              {/* Zoom Controls */}
              <div className="flex items-center bg-black bg-opacity-50 rounded-lg">
                <motion.button
                  onClick={() => handleZoom(-0.5)}
                  disabled={zoom <= 1}
                  className="text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.95 }}
                >
                  <MagnifyingGlassMinusIcon className="w-5 h-5" />
                </motion.button>
                <span className="text-white text-sm px-2 border-x border-gray-600">
                  {Math.round(zoom * 100)}%
                </span>
                <motion.button
                  onClick={() => handleZoom(0.5)}
                  disabled={zoom >= 5}
                  className="text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.95 }}
                >
                  <MagnifyingGlassPlusIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Reset View Button */}
              {(zoom > 1 || panX !== 0 || panY !== 0) && (
                <motion.button
                  onClick={resetView}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </motion.button>
              )}

              {/* Thumbnails Toggle */}
              <motion.button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`text-white p-2 rounded-lg transition-all ${
                  showThumbnails ? 'bg-primary-500' : 'bg-black bg-opacity-50 hover:bg-opacity-70'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </motion.button>

              {/* Fullscreen Button */}
              <motion.button
                onClick={toggleFullscreen}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
                whileTap={{ scale: 0.95 }}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-5 h-5" />
                ) : (
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>

          {/* View Selector */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
              {(['exterior', 'interior', 'engine', 'trunk'] as const).map(view => {
                const viewImages = images.filter(img => img.view === view);
                if (viewImages.length === 0) return null;

                return (
                  <motion.button
                    key={view}
                    onClick={() => switchView(view)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                      currentView === view
                        ? 'bg-primary-500 text-white'
                        : 'text-white hover:bg-white hover:bg-opacity-20'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {viewLabels[view]}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Drag Hint */}
          {!isDragging && !isPlaying && zoom === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm pointer-events-none"
            >
              {language === 'ar' ? 'اسحب للدوران حول السيارة' : 'Drag to rotate around the car'}
            </motion.div>
          )}
        </div>
      </div>

      {/* Thumbnails Strip */}
      <AnimatePresence>
        {showThumbnails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 p-4"
          >
            <div className="flex space-x-2 overflow-x-auto">
              {filteredImages.map((image, index) => {
                const globalIndex = images.findIndex(img => img.id === image.id);
                return (
                  <motion.button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(globalIndex)}
                    className={`flex-shrink-0 relative overflow-hidden rounded-lg ${
                      globalIndex === currentImageIndex
                        ? 'ring-2 ring-primary-500'
                        : 'hover:ring-2 hover:ring-white hover:ring-opacity-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={image.url}
                      alt={`${carTitle} - Angle ${image.angle}°`}
                      className="w-16 h-16 object-cover"
                    />
                    {globalIndex === currentImageIndex && (
                      <div className="absolute inset-0 bg-primary-500 bg-opacity-20" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30">
        <motion.div
          className="h-full bg-primary-500"
          style={{
            width: `${((currentViewIndex + 1) / filteredImages.length) * 100}%`
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default CarViewer360;