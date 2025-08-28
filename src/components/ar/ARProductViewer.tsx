/**
 * AR Product Viewer Component
 * 3D product visualization with augmented reality
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CameraIcon,
  CubeIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface ARProductViewerProps {
  product: Product;
  onClose?: () => void;
}

const ARProductViewer: React.FC<ARProductViewerProps> = ({ product, onClose }) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'ar'>('3d');
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState(1);
  const modelViewerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkARSupport();
    load3DModel();
  }, [product]);

  /**
   * Check if AR is supported
   */
  const checkARSupport = () => {
    if (typeof window !== 'undefined') {
      // Check for WebXR support
      const hasWebXR = 'xr' in navigator;
      
      // Check for AR Quick Look (iOS)
      const hasARQuickLook = document.createElement('a').relList.supports('ar');
      
      // Check for Scene Viewer (Android)
      const hasSceneViewer = /android/i.test(navigator.userAgent);
      
      setIsARSupported(hasWebXR || hasARQuickLook || hasSceneViewer);
    }
  };

  /**
   * Load 3D model
   */
  const load3DModel = async () => {
    setIsLoading(true);
    
    try {
      // In production, load actual 3D model from storage
      // For demo, we'll simulate with a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (canvasRef.current) {
        render3DModel();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading 3D model:', error);
      toast.error('Failed to load 3D model');
      setIsLoading(false);
    }
  };

  /**
   * Render 3D model on canvas
   */
  const render3DModel = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder 3D representation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 150 * scale;
    
    // Save context state
    ctx.save();
    
    // Apply rotation
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation.y * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    // Draw car shape (simplified)
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 2;
    
    // Car body
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX - size * 0.8, centerY - size * 0.3);
    ctx.lineTo(centerX - size * 0.3, centerY - size * 0.4);
    ctx.lineTo(centerX + size * 0.3, centerY - size * 0.4);
    ctx.lineTo(centerX + size * 0.8, centerY - size * 0.3);
    ctx.lineTo(centerX + size, centerY);
    ctx.lineTo(centerX + size, centerY + size * 0.3);
    ctx.lineTo(centerX - size, centerY + size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Windows
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(centerX - size * 0.6, centerY - size * 0.3, size * 0.4, size * 0.2);
    ctx.fillRect(centerX + size * 0.1, centerY - size * 0.3, size * 0.4, size * 0.2);
    
    // Wheels
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(centerX - size * 0.5, centerY + size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + size * 0.5, centerY + size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context state
    ctx.restore();
    
    // Add product info
    ctx.fillStyle = '#1F2937';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(product.title, centerX, canvas.height - 20);
  };

  /**
   * Handle rotation
   */
  const handleRotation = (axis: 'x' | 'y' | 'z', delta: number) => {
    setRotation(prev => ({
      ...prev,
      [axis]: (prev[axis] + delta) % 360
    }));
    render3DModel();
  };

  /**
   * Handle scale
   */
  const handleScale = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
    render3DModel();
  };

  /**
   * Launch AR view
   */
  const launchARView = async () => {
    if (!isARSupported) {
      toast.error('AR is not supported on this device');
      return;
    }
    
    setViewMode('ar');
    
    try {
      // Check for iOS AR Quick Look
      if ('relList' in HTMLAnchorElement.prototype) {
        const a = document.createElement('a');
        if (a.relList.supports('ar')) {
          // Create AR Quick Look link
          a.href = product.model3D || '#';
          a.rel = 'ar';
          
          const img = document.createElement('img');
          img.src = product.images?.[0]?.url || '';
          a.appendChild(img);
          
          a.click();
          return;
        }
      }
      
      // Check for Android Scene Viewer
      if (/android/i.test(navigator.userAgent)) {
        const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
          product.model3D || ''
        )}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
        
        window.location.href = intent;
        return;
      }
      
      // Fallback to WebXR
      if ('xr' in navigator) {
        const xr = (navigator as any).xr;
        const supported = await xr.isSessionSupported('immersive-ar');
        
        if (supported) {
          const session = await xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
          });
          
          // Handle WebXR session
          handleWebXRSession(session);
        }
      }
      
    } catch (error) {
      console.error('Error launching AR:', error);
      toast.error('Failed to launch AR view');
      setViewMode('3d');
    }
  };

  /**
   * Handle WebXR session
   */
  const handleWebXRSession = (session: any) => {
    // WebXR implementation
    session.addEventListener('end', () => {
      setViewMode('3d');
    });
    
    // Setup XR rendering
    // This would involve Three.js or similar for actual 3D rendering
    toast.success('AR mode activated');
  };

  /**
   * Reset view
   */
  const resetView = () => {
    setRotation({ x: 0, y: 0, z: 0 });
    setScale(1);
    render3DModel();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'
    >
      <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <CubeIcon className='w-8 h-8 mr-3' />
              <div>
                <h2 className='text-2xl font-bold'>3D Product View</h2>
                <p className='text-primary-100'>{product.title}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className='p-2 hover:bg-white/20 rounded-lg transition-colors'
              >
                <XMarkIcon className='w-6 h-6' />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          {isLoading ? (
            <div className='flex items-center justify-center h-96'>
              <div className='text-center'>
                <ArrowPathIcon className='w-12 h-12 text-primary-500 animate-spin mx-auto mb-4' />
                <p className='text-gray-600'>Loading 3D model...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 3D Viewer */}
              <div className='bg-gray-100 rounded-xl p-4 mb-6'>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className='w-full h-auto rounded-lg bg-white'
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      handleRotation('y', e.movementX);
                      handleRotation('x', e.movementY);
                    }
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    handleScale(-e.deltaY * 0.001);
                  }}
                />
              </div>

              {/* Controls */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                <button
                  onClick={() => handleRotation('y', -30)}
                  className='flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                >
                  <ArrowPathIcon className='w-5 h-5 mr-2' />
                  Rotate Left
                </button>
                
                <button
                  onClick={() => handleRotation('y', 30)}
                  className='flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                >
                  <ArrowPathIcon className='w-5 h-5 mr-2 scale-x-[-1]' />
                  Rotate Right
                </button>
                
                <button
                  onClick={() => handleScale(0.2)}
                  className='flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                >
                  <ArrowsPointingOutIcon className='w-5 h-5 mr-2' />
                  Zoom In
                </button>
                
                <button
                  onClick={() => handleScale(-0.2)}
                  className='flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                >
                  <ArrowsPointingOutIcon className='w-5 h-5 mr-2 rotate-45' />
                  Zoom Out
                </button>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col sm:flex-row gap-4'>
                {isARSupported && (
                  <button
                    onClick={launchARView}
                    className='flex-1 flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium'
                  >
                    <CameraIcon className='w-5 h-5 mr-2' />
                    View in AR
                  </button>
                )}
                
                <button
                  onClick={resetView}
                  className='flex-1 flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium'
                >
                  <ArrowPathIcon className='w-5 h-5 mr-2' />
                  Reset View
                </button>
              </div>

              {/* Info */}
              <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
                <div className='flex items-start'>
                  <InformationCircleIcon className='w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0' />
                  <div className='text-sm text-blue-700'>
                    <p className='font-medium mb-1'>Interactive 3D View</p>
                    <ul className='space-y-1'>
                      <li>• Drag to rotate the model</li>
                      <li>• Scroll to zoom in/out</li>
                      {isARSupported && <li>• Click "View in AR" to see in your space</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ARProductViewer;