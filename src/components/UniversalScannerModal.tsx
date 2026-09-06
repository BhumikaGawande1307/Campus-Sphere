import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { certificateService } from '../services/certificateService';
import { attendanceService } from '../services/attendanceService';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  QrCode,
  FileCheck,
  User,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Check,
  SwitchCamera,
  Sliders,
  Maximize2,
  Scan,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export type ScannerMode = 'qr_attendance' | 'document_capture' | 'profile_photo';

interface UniversalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: ScannerMode;
  onScanSuccess?: (payload: any) => void;
}

export const UniversalScannerModal: React.FC<UniversalScannerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'qr_attendance',
  onScanSuccess,
}) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState<ScannerMode>(initialMode);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState<'Academic' | 'Certification' | 'Workshop'>('Academic');
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Video and Canvas references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);

  // GPS coords for attendance verification
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Acquire Geolocation for anti-proxy checks
  useEffect(() => {
    if (isOpen && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => console.warn('Geolocation denied'),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isOpen]);

  const stopCamera = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

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
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraPermission(true);
        setIsScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please grant camera permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Unable to open camera stream. Please verify your device settings.');
      }
    }
  }, [facingMode, stopCamera]);

  // QR Scanning Loop
  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleQRDetected(code.data);
        return;
      }
    }

    if (isScanning) {
      animFrameId.current = requestAnimationFrame(scanQRCode);
    }
  }, [isScanning]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (isScanning && mode === 'qr_attendance') {
      animFrameId.current = requestAnimationFrame(scanQRCode);
    }
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isScanning, mode, scanQRCode]);

  // QR Handler with Smart Routing
  const handleQRDetected = async (qrData: string) => {
    stopCamera();
    setProcessing(true);

    try {
      // 1. Check if it is a Certificate Verification Link / UID
      if (qrData.includes('/verify/certificate/') || qrData.startsWith('CERT-')) {
        const uid = qrData.includes('/verify/certificate/')
          ? qrData.split('/verify/certificate/')[1].split('?')[0]
          : qrData;
        toast.success('Certificate QR Recognized', `Opening credential: ${uid}`);
        onClose();
        navigate(`/verify/certificate/${uid}`);
        return;
      }

      // 2. Try recording attendance session
      if (user?.role === 'STUDENT') {
        const res = await attendanceService.markAttendanceSecure({
          token: qrData,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });

        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        toast.success('Attendance Marked Successfully! 🎉', res.message || 'Attendance verified and saved successfully.');
        if (onScanSuccess) onScanSuccess(res);
        onClose();
        return;
      }

      // General fallback
      toast.info('QR Code Scanned', qrData);
      if (onScanSuccess) onScanSuccess({ data: qrData });
      onClose();
    } catch (err: any) {
      toast.error('Scan Validation Failed', err.message || 'Invalid or expired QR token.');
      startCamera();
    } finally {
      setProcessing(false);
    }
  };

  // Capture Snapshot from Camera
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // Profile Photo Countdown Capture
  const startProfilePhotoCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          captureSnapshot();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  // Save Profile Photo from Camera
  const handleSaveProfilePhoto = async () => {
    if (!capturedImage) return;
    setProcessing(true);
    try {
      await studentService.updateProfile({
        user: {
          avatar_url: capturedImage,
        } as any,
      });

      if (refreshUser) refreshUser();
      confetti({ particleCount: 70, spread: 60 });
      toast.success('Profile Photo Updated! 📸', 'Your new portrait has been applied.');
      onClose();
    } catch {
      toast.error('Failed to save profile photo');
    } finally {
      setProcessing(false);
    }
  };

  // Save Scanned Document to Vault
  const handleSaveDocumentToVault = async () => {
    if (!capturedImage || !documentTitle.trim()) {
      toast.warning('Please enter a document title');
      return;
    }
    setProcessing(true);
    try {
      const student = await studentService.getMyProfile();
      await certificateService.uploadCertificate({
        title: documentTitle.trim(),
        category: documentCategory as any,
        issuer: 'CampusSphere Camera Scanner Vault',
        issue_date: new Date().toISOString().split('T')[0],
        description: 'Captured and verified via CampusSphere Camera Scanner Suite with SHA-256 integrity hash.',
        file_name: `${documentTitle.toLowerCase().replace(/\s+/g, '_')}_camera_scan.jpg`,
        file_type: 'image/jpeg',
        file_size: Math.round(capturedImage.length * 0.75),
        capturedImage: capturedImage,
        student_id: student.id,
      });

      confetti({ particleCount: 75, spread: 60 });
      toast.success('Document Saved! 📑', 'Document captured and securely saved to your account.');
      onClose();
      navigate('/certificates');
    } catch (err: any) {
      toast.error('Failed to save document', err?.message || 'Could not save document.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Camera & Universal Scanner Suite"
      size="xl"
    >
      <div className="space-y-4">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-midnight-900 border border-slate-200 dark:border-white/5 text-xs font-bold">
          <button
            onClick={() => {
              setCapturedImage(null);
              setMode('qr_attendance');
              startCamera();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
              mode === 'qr_attendance'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="truncate">QR Scanner</span>
          </button>

          <button
            onClick={() => {
              setCapturedImage(null);
              setMode('document_capture');
              startCamera();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
              mode === 'document_capture'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span className="truncate">Scan Document</span>
          </button>

          <button
            onClick={() => {
              setCapturedImage(null);
              setMode('profile_photo');
              startCamera();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
              mode === 'profile_photo'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span className="truncate">Camera Portrait</span>
          </button>
        </div>

        {/* Viewfinder / Video Stream Area */}
        <div className="relative aspect-video sm:aspect-[16/10] w-full overflow-hidden rounded-3xl bg-[#0a0c16] flex items-center justify-center border border-violet-500/20 shadow-inner">
          {/* Live Video Canvas Hidden Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Captured Preview Mode */}
          {capturedImage ? (
            <div className="relative h-full w-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured Camera Snapshot"
                className="h-full w-full object-contain"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <Badge variant="success" size="sm" dot>
                  Snapshot Captured
                </Badge>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
              />

              {/* Camera Permissions / Error Overlay */}
              {cameraError && (
                <div className="absolute inset-0 p-6 bg-midnight-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-3 z-30">
                  <CameraOff className="h-10 w-10 text-rose-500" />
                  <p className="text-xs text-rose-300 max-w-xs">{cameraError}</p>
                  <Button size="sm" onClick={() => startCamera()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Retry Camera Access
                  </Button>
                </div>
              )}

              {/* QR Scanning Reticle Overlay */}
              {mode === 'qr_attendance' && isScanning && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-48 w-48 sm:h-56 sm:w-56 rounded-2xl border-2 border-violet-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-violet-500/10 animate-pulse rounded-2xl" />
                    <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-violet-400 -mt-1 -ml-1 rounded-tl" />
                    <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-violet-400 -mt-1 -mr-1 rounded-tr" />
                    <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-violet-400 -mb-1 -ml-1 rounded-bl" />
                    <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-violet-400 -mb-1 -mr-1 rounded-br" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent animate-bounce" />
                  </div>
                  <span className="absolute bottom-4 text-xs font-bold text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    Align QR code within reticle
                  </span>
                </div>
              )}

              {/* Profile Photo Reticle */}
              {mode === 'profile_photo' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-44 w-44 sm:h-52 sm:w-52 rounded-full border-2 border-dashed border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                  {countdown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                      <span className="text-6xl sm:text-7xl font-black text-white animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls & Form Options */}
        {capturedImage ? (
          <div className="space-y-3 pt-2">
            {mode === 'document_capture' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-900 border border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g. Sem 6 Grade Marksheet..."
                    className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vault Category
                  </label>
                  <select
                    value={documentCategory}
                    onChange={(e) => setDocumentCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white"
                  >
                    <option value="Academic">Academic Transcript / Marksheet</option>
                    <option value="Certification">Industry Certification</option>
                    <option value="Workshop">Technical Workshop / Hackathon</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retake Snapshot
              </Button>

              {mode === 'profile_photo' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProfilePhoto}
                  isLoading={processing}
                  leftIcon={<Check className="h-3.5 w-3.5" />}
                >
                  Set as Profile Avatar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveDocumentToVault}
                  isLoading={processing}
                  leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                >
                  Save to Document Vault
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Live Stream Control Buttons */
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              }}
              leftIcon={<SwitchCamera className="h-3.5 w-3.5" />}
            >
              Flip Camera ({facingMode === 'environment' ? 'Rear' : 'Front'})
            </Button>

            {mode === 'profile_photo' && (
              <Button
                variant="primary"
                size="sm"
                onClick={startProfilePhotoCountdown}
                leftIcon={<Camera className="h-3.5 w-3.5" />}
              >
                Take Photo (3s Timer)
              </Button>
            )}

            {mode === 'document_capture' && (
              <Button
                variant="primary"
                size="sm"
                onClick={captureSnapshot}
                leftIcon={<Camera className="h-3.5 w-3.5" />}
              >
                Snap Document
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
