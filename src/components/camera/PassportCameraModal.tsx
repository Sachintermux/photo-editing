import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, X, CheckCircle2, AlertCircle, Timer, Sun } from 'lucide-react';

interface PassportCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
}

type AiStatus = 'perfect' | 'adjust' | 'lighting' | 'searching';

export const PassportCameraModal: React.FC<PassportCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // AI Guidance state
  const [aiStatus, setAiStatus] = useState<AiStatus>('searching');
  const [aiMessage, setAiMessage] = useState('Position your face inside the oval');
  const [lumScore, setLumScore] = useState(120);

  // Check if device has multiple cameras (e.g. front and rear)
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      });
    }
  }, []);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream with selected facingMode
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Unable to start camera. Make sure no other app is using it.'
      );
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Toggle front and rear cameras
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Real-time AI Lighting & Face Posture Analysis Loop
  useEffect(() => {
    if (!isOpen) return;

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement('canvas');
      analysisCanvasRef.current.width = 240;
      analysisCanvasRef.current.height = 320;
    }

    const interval = setInterval(async () => {
      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      if (!video || video.readyState < 2 || !canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Sample current video frame to small offscreen canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Analyze Lighting in Center Area (Head Box)
      const sampleX = Math.round(canvas.width * 0.25);
      const sampleY = Math.round(canvas.height * 0.2);
      const sampleW = Math.round(canvas.width * 0.5);
      const sampleH = Math.round(canvas.height * 0.5);

      const frameData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH).data;
      let totalLum = 0;
      const sampleStep = 8; // fast sampling
      let sampledPixels = 0;

      for (let i = 0; i < frameData.length; i += 4 * sampleStep) {
        const lum = 0.299 * frameData[i] + 0.587 * frameData[i + 1] + 0.114 * frameData[i + 2];
        totalLum += lum;
        sampledPixels++;
      }

      const avgLum = sampledPixels > 0 ? Math.round(totalLum / sampledPixels) : 120;
      setLumScore(avgLum);

      // 2. Face Posture Detection (Uses Native Chromium FaceDetector if present, else lighting heuristic)
      if ('FaceDetector' in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(canvas);

          if (!faces || faces.length === 0) {
            setAiStatus('searching');
            setAiMessage('Looking for face... Look directly at the camera');
            return;
          }

          const face = faces[0];
          const faceRatio = face.boundingBox.height / canvas.height;

          // Official passport head size standard: roughly 45% - 70% of frame
          if (faceRatio < 0.35) {
            setAiStatus('adjust');
            setAiMessage('Move closer to the camera');
          } else if (faceRatio > 0.78) {
            setAiStatus('adjust');
            setAiMessage('Step back a little');
          } else {
            // Check horizontal centering
            const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
            const canvasCenterX = canvas.width / 2;
            const offsetXPct = Math.abs(faceCenterX - canvasCenterX) / canvas.width;

            if (offsetXPct > 0.12) {
              setAiStatus('adjust');
              setAiMessage('Center your face inside the oval');
            } else if (avgLum < 70) {
              setAiStatus('lighting');
              setAiMessage('Light is dim — face a window or lamp');
            } else if (avgLum > 225) {
              setAiStatus('lighting');
              setAiMessage('Too bright — avoid harsh glare');
            } else {
              setAiStatus('perfect');
              setAiMessage('✓ Perfect! Hold still and take photo');
            }
          }
          return;
        } catch (e) {
          // Fall back to lighting-only evaluation if detector encounters a browser error
        }
      }

      // Fallback for iOS Safari (Luminance heuristics)
      if (avgLum < 65) {
        setAiStatus('lighting');
        setAiMessage('Dim lighting — face a brighter light');
      } else if (avgLum > 230) {
        setAiStatus('lighting');
        setAiMessage('Too bright — step away from direct glare');
      } else {
        setAiStatus('perfect');
        setAiMessage('✓ Good lighting! Align eyes with guide and snap');
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Execute capture
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera (mirror effect)
    if (facingMode === 'user') {
      ctx.translate(snapCanvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.96);

    stopStream();
    onCapture(dataUrl);
    onClose();
  };

  const handleCaptureClick = () => {
    if (timerEnabled) {
      setCountdown(3);
      let remaining = 3;
      const timer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(timer);
          setCountdown(null);
          takeSnapshot();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    } else {
      takeSnapshot();
    }
  };

  if (!isOpen) return null;

  const isPerfect = aiStatus === 'perfect';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden touch-none">
      {/* Top Header Bar */}
      <div className="w-full z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="bg-brand-600 text-white p-1 rounded-lg">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-white text-xs font-bold tracking-wide">
            AI Passport Camera
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Timer Toggle */}
          <button
            onClick={() => setTimerEnabled(!timerEnabled)}
            className={`p-2 rounded-full text-xs font-semibold flex items-center space-x-1 transition ${
              timerEnabled
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
            }`}
            title="Toggle 3s Timer"
          >
            <Timer className="w-4 h-4" />
            <span className="text-[10px]">{timerEnabled ? '3s' : 'Off'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-2 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Real-Time AI Feedback Banner */}
      <div className="w-full z-20 px-4 -mt-2 flex flex-col items-center">
        <div
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg border transition-all duration-200 text-xs font-medium ${
            isPerfect
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/30'
              : aiStatus === 'lighting'
              ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
              : 'bg-zinc-900/85 border-zinc-700 text-zinc-200'
          }`}
        >
          {isPerfect ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span>{aiMessage}</span>

          {/* Lighting meter pill */}
          <div className="flex items-center space-x-1 pl-2 border-l border-zinc-700/80 text-[10px] text-zinc-400">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>{lumScore < 70 ? 'Dim' : lumScore > 220 ? 'Glare' : 'Good'}</span>
          </div>
        </div>
      </div>

      {/* Camera Viewport & Passport Biometric Overlay */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center max-w-xs bg-zinc-900 rounded-xl border border-zinc-800 text-white space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs text-zinc-300">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-brand-600 text-xs font-semibold rounded-lg text-white"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Dark Mask with Oval Cutout */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer Dimmer */}
              <div className="absolute inset-0 bg-black/45" />

              {/* Passport Biometric Framing Box (Aspect 35:45) */}
              <div
                style={{ aspectRatio: '35/45' }}
                className={`relative w-[78vw] max-w-[340px] max-h-[66vh] border-2 rounded-[50%] transition-colors duration-300 shadow-2xl flex flex-col items-center justify-between ${
                  isPerfect
                    ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                    : 'border-amber-400/90 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                }`}
              >
                {/* Clear window inside oval */}
                <div className="absolute -inset-[200vw] rounded-[50%]" />

                {/* Eye-level indicator line (roughly 60% from bottom / 40% from top) */}
                <div className="absolute top-[40%] w-3/4 border-b border-dashed border-sky-400/80 flex items-center justify-between px-1">
                  <span className="text-[9px] font-bold tracking-widest text-sky-300 -mt-3.5 select-none opacity-80">
                    EYE LEVEL
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-sky-300 -mt-3.5 select-none opacity-80">
                    EYE LEVEL
                  </span>
                </div>

                {/* Chin reference line */}
                <div className="absolute bottom-[22%] w-1/2 border-b border-dashed border-white/50 flex justify-center">
                  <span className="text-[8px] font-semibold text-white/70 -mb-3 select-none">
                    CHIN
                  </span>
                </div>

                {/* Shoulder reference curves at bottom */}
                <div className="absolute -bottom-8 w-[120%] border-t-2 border-dashed border-white/30 rounded-t-full h-8 pointer-events-none" />
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                <span className="text-8xl font-black text-white animate-ping">
                  {countdown}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full z-20 px-6 py-5 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex items-center justify-around">
        {/* Placeholder / Secondary gallery picker */}
        <div className="w-12 h-12 flex items-center justify-center">
          {/* Can be left empty for spacing */}
        </div>

        {/* Shutter Button */}
        <button
          onClick={handleCaptureClick}
          disabled={countdown !== null}
          className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-transform active:scale-95 ${
            isPerfect
              ? 'border-emerald-400 bg-white shadow-[0_0_20px_rgba(52,211,153,0.6)]'
              : 'border-white bg-white/90 shadow-lg'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full border-2 border-black/10 transition-colors ${
              isPerfect ? 'bg-emerald-500' : 'bg-brand-600'
            }`}
          />
        </button>

        {/* Switch Front/Back Camera Button */}
        <div className="w-12 h-12 flex items-center justify-center">
          {hasMultipleCameras && (
            <button
              onClick={toggleFacingMode}
              className="p-3 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 active:rotate-180 transition-transform duration-300"
              title="Switch Front/Back Camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};