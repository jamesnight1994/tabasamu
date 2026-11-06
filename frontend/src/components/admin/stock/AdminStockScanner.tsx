'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { Camera, CameraOff, ImagePlus } from 'lucide-react';

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type AdminStockScannerProps = {
  onScan: (code: string) => void;
  disabled?: boolean;
};

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const Ctor = (window as Window & { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

export function AdminStockScanner({ onScan, disabled = false }: AdminStockScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!live) return;

    const detector = getBarcodeDetector();
    if (!detector) {
      setCameraError('This browser cannot decode QR from the camera. Paste the code or upload a QR image.');
      return;
    }

    let cancelled = false;
    const tick = async () => {
      const video = videoRef.current;
      if (cancelled || !video || video.readyState < 2) return;
      try {
        const codes = await detector.detect(video);
        const value = codes[0]?.rawValue?.trim();
        if (value) {
          stopCamera();
          onScan(value);
        }
      } catch {
        /* keep polling */
      }
    };

    const timer = window.setInterval(() => {
      void tick();
    }, 250);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [live, onScan, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not available in this browser. Paste the code or upload a QR image.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setCameraError('Camera permission was blocked. Paste the code or upload a QR image.');
    }
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const detector = getBarcodeDetector();
    if (!detector) {
      setCameraError('This browser cannot decode a QR image. Paste the code from the print list.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const value = codes[0]?.rawValue?.trim();
      if (!value) {
        setCameraError('No QR code found in that image.');
        return;
      }
      setCameraError(null);
      onScan(value);
    } catch {
      setCameraError('Could not read that image. Paste the code instead.');
    }
  };

  return (
    <div className="admin-stock-scanner">
      <div className="admin-stock-scanner__frame">
        <video
          ref={videoRef}
          className="admin-stock-scanner__video"
          muted
          playsInline
          autoPlay
          aria-label="QR camera preview"
        />
        {!live ? (
          <p className="admin-stock-scanner__placeholder">Camera is off. Use it on a phone, or paste / upload a code.</p>
        ) : null}
      </div>
      <div className="admin-stock-scanner__actions">
        {live ? (
          <Button variant="secondary" isDisabled={disabled} onPress={stopCamera}>
            <CameraOff size={16} aria-hidden />
            Stop camera
          </Button>
        ) : (
          <Button variant="secondary" isDisabled={disabled} onPress={() => void startCamera()}>
            <Camera size={16} aria-hidden />
            Scan with camera
          </Button>
        )}
        <Button variant="ghost" isDisabled={disabled} onPress={() => fileRef.current?.click()}>
          <ImagePlus size={16} aria-hidden />
          Upload QR image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload a QR image"
          onChange={(event) => void onFile(event)}
        />
      </div>
      {cameraError ? <p className="admin-stock-scanner__error">{cameraError}</p> : null}
    </div>
  );
}
