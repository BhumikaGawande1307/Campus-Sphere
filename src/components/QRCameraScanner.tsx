import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Button } from './Button';
import { Input } from './Input';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';

interface QRCameraScannerProps {
  onScanSuccess: (payload: { token: string; latitude?: number; longitude?: number }) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScanSuccess,
  onClose,
  isOpen,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [processingScan, setProcessingScan] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // GPS Geolocation state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'acquiring' | 'acquired' | 'denied' | 'unsupported'>('acquiring');

  // Manual fallback input
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Acquire Geolocation
  useEffect(() => {
    if (!isOpen) return;

    if ('geolocation' in navigator) {
      setLocationStatus('acquiring');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLocationStatus('acquired');
        },
        () => {
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('unsupported');
    }
  }, [isOpen]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setHasCameraPermission(true);
        setIsScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Could not access device camera. You can still enter the session code manually below.'
      );
    }
  }, [facingMode]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Frame scanner loop with jsQR
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning || processingScan) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim()) {
        // Trigger verification
        handleDetectedToken(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [isScanning, processingScan]);

  useEffect(() => {
    if (isScanning && !processingScan) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning, processingScan, scanFrame]);

  // Handle Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const handleDetectedToken = async (rawToken: string) => {
    let token = rawToken.trim();
    // Support JSON payload or direct string
    try {
      const parsed = JSON.parse(rawToken);
      if (parsed.token) token = parsed.token;
    } catch {
      // Direct token string
    }

    setProcessingScan(true);
    stopCamera();

    // Haptic vibration feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }

    try {
      await onScanSuccess({
        token,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
    } finally {
      setProcessingScan(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleDetectedToken(manualToken.trim());
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0c16]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 dark:border-violet-500/15 bg-white dark:bg-midnight-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live Attendance Scanner
              </h3>
              <p className="text-xs text-slate-500">
                Point camera at the classroom projector screen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Camera Viewport & Overlay */}
        <div className="relative bg-black flex-1 min-h-[320px] max-h-[420px] flex items-center justify-center overflow-hidden">
          {hasCameraPermission === false || cameraError ? (
            <div className="p-8 text-center space-y-3 text-white max-w-sm">
              <CameraOff className="h-12 w-12 mx-auto text-rose-400" />
              <p className="text-sm font-semibold">{cameraError || 'Camera unavailable'}</p>
              <Button size="sm" variant="secondary" onClick={() => setShowManualInput(true)}>
                Enter Token Manually
              </Button>
            </div>
          ) : (
            <>
              {/* Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target & Radar Scan Line */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Target Box */}
                <div className="relative w-64 h-64 border-2 border-dashed border-violet-400/60 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Corner Target Accents */}
                  <div className="absolute top-0 left-0 h-6 w-6 border-t-4 border-l-4 border-violet-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 h-6 w-6 border-t-4 border-r-4 border-violet-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-violet-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-violet-500 rounded-br-xl" />

                  {/* Animated Radar Scanning Line */}
                  <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-glow-md animate-radar-sweep" />
                </div>
              </div>

              {/* Camera Switch Control */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                  title="Switch Camera (Front/Back)"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* Processing Spinner Overlay */}
          {processingScan && (
            <div className="absolute inset-0 bg-[#0a0c16]/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 text-white">
              <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold animate-pulse">
                Verifying Dynamic Token & Geofence...
              </p>
            </div>
          )}
        </div>

        {/* Footer: GPS Status & Manual Input Toggle */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-midnight-950/60 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>
                {locationStatus === 'acquired'
                  ? `GPS Active (±${Math.round(coords?.accuracy || 10)}m)`
                  : locationStatus === 'acquiring'
                  ? 'Acquiring high-accuracy GPS...'
                  : 'GPS geofencing inactive'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>{showManualInput ? 'Hide Manual Input' : 'Enter Code Manually'}</span>
            </button>
          </div>

          {/* Manual Input Form */}
          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1 animate-in fade-in duration-150">
              <div className="flex-1">
                <Input
                  placeholder="e.g. CS-DYN-88910"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="font-mono text-sm uppercase"
                  required
                />
              </div>
              <Button type="submit" isLoading={processingScan} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                Submit
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
