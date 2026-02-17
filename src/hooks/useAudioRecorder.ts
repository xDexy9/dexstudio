import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        cleanupStream();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAudioUrl(null);
      setAudioBlob(null);
      startTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [isSupported, startTimer, cleanupStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  }, [stopTimer]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setIsRecording(false);
    setDuration(0);
    setAudioUrl(null);
    setAudioBlob(null);
    chunksRef.current = [];
    stopTimer();
  }, [stopTimer, cleanupStream]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
  }, [audioUrl]);

  return {
    isRecording,
    isPaused,
    duration,
    audioUrl,
    audioBlob,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  };
}
