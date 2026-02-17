import React, { useRef, useState, useEffect } from 'react';
import { Video, X, Loader2, VideoIcon, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VideoPickerResult {
  blob: Blob;
  previewUrl: string; // objectURL — revoke after use
  duration: number;
}

interface VideoPickerProps {
  onVideoSelect: (result: VideoPickerResult) => void;
  disabled?: boolean;
}

// Max input file size before we reject (50 MB)
const MAX_INPUT_MB = 50;

// Target bitrate for chat videos (good quality at 720p)
const TARGET_BITRATE = 1_200_000; // 1.2 Mbps

// Target FPS — 24 for smooth 720p chat clips
const TARGET_FPS = 24;

// Max output dimensions — 720p
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;

export function VideoPicker({ onVideoSelect, disabled }: VideoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showMenu]);

  const processFile = async (file: File) => {
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      alert(`Video too large. Maximum ${MAX_INPUT_MB} MB.`);
      return;
    }
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file.');
      return;
    }

    const mimeType = getSupportedMimeType();

    if (!mimeType) {
      const previewUrl = URL.createObjectURL(file);
      const duration = await getFileDuration(file);
      onVideoSelect({ blob: file, previewUrl, duration });
      return;
    }

    setPhase('compressing');
    setProgress(0);

    try {
      const { blob, duration } = await seekBasedCompress(file, mimeType, (p) => {
        setProgress(Math.round(p * 100));
      });
      const previewUrl = URL.createObjectURL(blob);
      setPhase('idle');
      setProgress(0);
      onVideoSelect({ blob, previewUrl, duration });
    } catch (err) {
      console.error('Video compression error, using original:', err);
      const previewUrl = URL.createObjectURL(file);
      const duration = await getFileDuration(file);
      setPhase('idle');
      setProgress(0);
      onVideoSelect({ blob: file, previewUrl, duration });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processFile(file);
  };

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      {/* Camera input — forces camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Gallery input — native picker without forcing camera */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {phase !== 'idle' ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">{progress}%</span>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMenu(prev => !prev)}
          disabled={disabled}
          title="Attach video"
        >
          <Video className="h-5 w-5" />
        </Button>
      )}

      {showMenu && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden w-44">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
            onClick={() => { setShowMenu(false); cameraInputRef.current?.click(); }}
          >
            <VideoIcon className="h-4 w-4 text-primary flex-shrink-0" />
            Record video
          </button>
          <div className="h-px bg-border mx-3" />
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
            onClick={() => { setShowMenu(false); galleryInputRef.current?.click(); }}
          >
            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
            Choose from gallery
          </button>
        </div>
      )}
    </div>
  );
}

interface VideoPreviewProps {
  src: string;
  onRemove?: () => void;
  className?: string;
}

export function VideoPreview({ src, onRemove, className }: VideoPreviewProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      <video src={src} controls className="rounded-lg max-w-full max-h-48" playsInline />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Real-time compression with audio ──────────────────────────────────────
// Plays the video at normal speed (off-screen, silent to the user) while:
//   1. Drawing frames to canvas via requestAnimationFrame
//   2. Capturing audio silently via Web Audio API
//   3. Recording canvas video + audio with MediaRecorder
//
// This preserves audio sync and works on all browsers including mobile.

async function seekBasedCompress(
  file: File,
  mimeType: string,
  onProgress: (fraction: number) => void
): Promise<{ blob: Blob; duration: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    // 1. Load video metadata
    const { duration, width, height } = await loadVideoMeta(objectUrl);

    // 2. Calculate output dimensions
    const [outW, outH] = calcDimensions(width, height, MAX_WIDTH, MAX_HEIGHT);

    // 3. Canvas for video frames
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // 4. Video element — NOT muted so audio context can tap it
    const video = document.createElement('video');
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objectUrl;
    video.load();
    await waitForEvent(video, 'loadedmetadata');

    // 5. Capture audio via Web Audio API
    // createMediaElementSource disconnects audio from default output,
    // so we route it to both: (a) MediaStreamDestination for recording,
    // and (b) speakers via a GainNode at 0 volume (silent).
    // On Android, the audio pipeline won't process unless connected to destination.
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(video);
    const audioDest = audioCtx.createMediaStreamDestination();
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0; // mute speakers
    source.connect(audioDest);               // for recording
    source.connect(silentGain);              // for Android audio pipeline
    silentGain.connect(audioCtx.destination); // silent output to speakers

    // 6. Combined stream: canvas video track + audio track
    const canvasStream = canvas.captureStream(TARGET_FPS);
    const audioTracks = audioDest.stream.getAudioTracks();
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ]);

    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: TARGET_BITRATE,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    // 7. Draw frames during playback
    let raf: number;
    const drawFrame = () => {
      ctx.drawImage(video, 0, 0, outW, outH);
      if (duration > 0) onProgress(video.currentTime / duration);
      raf = requestAnimationFrame(drawFrame);
    };

    recorder.start();
    raf = requestAnimationFrame(drawFrame);
    await video.play();

    // 8. Wait for playback to finish
    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
      video.onerror = () => resolve(); // resolve on error to avoid hang
    });

    cancelAnimationFrame(raf);
    onProgress(1);

    // Set up onstop BEFORE calling stop() to avoid race condition
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.stop();
    });

    combined.getTracks().forEach((t) => t.stop());
    video.src = '';
    audioCtx.close();

    return { blob, duration: Math.round(duration) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadVideoMeta(src: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.playsInline = true;
    v.muted = true;
    v.onloadedmetadata = () => {
      resolve({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
      v.src = '';
    };
    v.onerror = reject;
    v.src = src;
    v.load();
  });
}

function getFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.playsInline = true;
    v.muted = true;
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(v.duration) || 0);
      v.src = '';
    };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    v.src = url;
    v.load();
  });
}

function waitForEvent(el: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEvent = () => { el.removeEventListener(event, onEvent); resolve(); };
    const onError = (e: Event) => { el.removeEventListener('error', onError); reject(e); };
    el.addEventListener(event, onEvent, { once: true });
    el.addEventListener('error', onError, { once: true });
  });
}


function calcDimensions(w: number, h: number, maxW: number, maxH: number): [number, number] {
  if (w <= maxW && h <= maxH) return [w, h];
  const ratio = Math.min(maxW / w, maxH / h);
  return [Math.floor(w * ratio), Math.floor(h * ratio)];
}

function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}
