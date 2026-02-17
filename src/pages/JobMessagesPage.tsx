import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Languages, ExternalLink, Mic, MicOff, Square, Play, Pause, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import {
  getJobById,
  getMessagesByJob,
  subscribeToJobMessages,
  addMessage,
  generateId,
  getVehicleById,
  markJobMessagesAsRead
} from '@/services/firestoreService';
import { Message, Job } from '@/lib/types';
import { Language } from '@/lib/i18n';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageTemplatesPanel } from '@/components/messages/MessageTemplatesPanel';
import { ImagePicker, ImagePreview } from '@/components/ImagePicker';
import { VideoPicker, VideoPreview, VideoPickerResult } from '@/components/VideoPicker';
import { uploadVideoToStorage } from '@/services/videoUploadService';
import { detectLanguage, translateToAllLanguages } from '@/lib/googleTranslate';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export default function JobMessagesPage() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { t, language: userLanguage } = useLanguage();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingVideo, setPendingVideo] = useState<VideoPickerResult | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, isSupported, toggleListening, resetTranscript } = useSpeechToText();

  // Audio recorder
  const {
    isRecording,
    duration: recordingDuration,
    audioUrl: recordedAudioUrl,
    audioBlob: recordedAudioBlob,
    isSupported: audioRecordingSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  } = useAudioRecorder();

  // Audio preview playback
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Update message input when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setNewMessage(prev => prev + (prev ? ' ' : '') + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Load job and vehicle data
  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) return;

      try {
        const foundJob = await getJobById(jobId);
        setJob(foundJob || null);

        if (foundJob) {
          const vehicleData = await getVehicleById(foundJob.vehicleId);
          setVehicle(vehicleData);
        }
      } catch (error) {
        console.error('Error loading job data:', error);
      }
    };

    loadJobData();
  }, [jobId]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = subscribeToJobMessages(jobId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [jobId]);

  // Mark messages as read
  useEffect(() => {
    if (!jobId || !user) return;

    const markAsRead = async () => {
      try {
        await markJobMessagesAsRead(user.id, jobId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();
  }, [jobId, user, messages.length]);

  // Always scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    requestAnimationFrame(() => {
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    });
  }, [messages, jobId]);

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingImage && !pendingVideo && !recordedAudioBlob) || !user || !jobId || isSending) return;

    setIsSending(true);
    const messageText = newMessage;
    const imageUrl = pendingImage;
    const videoData = pendingVideo;
    const audioBlob = recordedAudioBlob;
    const audioDur = recordingDuration;
    setNewMessage('');
    setPendingImage(null);
    setPendingVideo(null);

    // Upload video blob to Firebase Storage (much faster than base64 in Firestore)
    let storageVideoUrl: string | undefined;
    if (videoData?.blob) {
      try {
        setVideoUploadProgress(0);
        storageVideoUrl = await uploadVideoToStorage(
          videoData.blob,
          jobId,
          (pct) => setVideoUploadProgress(pct)
        );
        // Revoke the objectURL now that upload is done
        URL.revokeObjectURL(videoData.previewUrl);
        setVideoUploadProgress(0);
      } catch (err) {
        console.error('Video upload failed:', err);
        setIsSending(false);
        setVideoUploadProgress(0);
        return;
      }
    }

    // Convert audio blob to data URL if present
    let audioDataUrl: string | undefined;
    if (audioBlob) {
      audioDataUrl = await blobToDataUrl(audioBlob);
      resetRecording();
    }

    // Detect language using Gemini (only if there's text)
    const detectedLang = messageText ? await detectLanguage(messageText) : userLanguage;

    // Create initial message with placeholder
    const tempMessage: Message = {
      id: generateId(),
      jobId,
      senderId: user.id,
      originalText: messageText,
      originalLanguage: detectedLang,
      translations: {},
      imageUrl: imageUrl || undefined,
      videoUrl: storageVideoUrl,
      videoDuration: videoData?.duration || undefined,
      audioUrl: audioDataUrl,
      audioDuration: audioDataUrl ? audioDur : undefined,
      createdAt: new Date().toISOString(),
      isTranslating: messageText ? true : false,
    };

    // Add message immediately with translating state
    setMessages(prev => [...prev, tempMessage]);

    // Generate translations using Gemini (only if there's text)
    let translations: Partial<Record<Language, string>> = {};
    if (messageText) {
      translations = await translateToAllLanguages(messageText, detectedLang);
    }

    // Update message with translations
    const finalMessage: Message = {
      ...tempMessage,
      translations,
      isTranslating: false,
    };

    console.log('Attempting to save message:', {
      hasVideo: !!finalMessage.videoUrl,
      videoSize: finalMessage.videoUrl ? `${(finalMessage.videoUrl.length / 1024).toFixed(2)}KB` : 'N/A',
      hasImage: !!finalMessage.imageUrl,
      hasAudio: !!finalMessage.audioUrl
    });

    // Save to storage
    try {
      await addMessage(finalMessage);
      console.log('Message saved successfully');
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Failed to send message. Video might be too large for storage.');
      setIsSending(false);
      return;
    }

    // Update UI
    setMessages(prev =>
      prev.map(m => m.id === tempMessage.id ? finalMessage : m)
    );

    setIsSending(false);
  };

  const handleImageSelect = (imageDataUrl: string) => {
    setPendingImage(imageDataUrl);
  };

  const handleVideoSelect = (result: VideoPickerResult) => {
    setPendingVideo(result);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPreviewPlaying) {
      audioPreviewRef.current.pause();
    } else {
      audioPreviewRef.current.play();
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  // Access control: mechanics can only view their own assigned job chats
  if (user?.role === 'mechanic' && job.assignedMechanicId !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-center px-8">
          {t('messages.accessDenied') || 'You do not have access to this chat.'}
        </p>
        <button
          onClick={() => navigate('/messages')}
          className="text-primary text-sm underline"
        >
          {t('common.back') || 'Go back'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b flex items-center gap-3 safe-top bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {vehicle && (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <CarBrandLogo brand={vehicle.brand} size="md" className="text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {user?.role !== 'mechanic' && (
            <h1 className="font-semibold truncate text-sm">{job.customerName}</h1>
          )}
          {vehicle ? (
            <>
              <div className="flex items-center gap-2">
                <LicensePlate plateNumber={vehicle.licensePlate} size="sm" />
              </div>
              <p className="text-xs text-primary/80 font-medium truncate mt-0.5">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground truncate">No vehicle assigned</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="gap-1.5 h-8 text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('common.viewJob')}
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            <Languages className="h-3 w-3" />
            <span className="hidden sm:inline">AI Translation</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Languages className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('messages.noMessages')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Messages are automatically translated using AI
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === user?.id}
              userLanguage={userLanguage}
            />
          ))
        )}
      </div>

      {/* Image Preview */}
      {pendingImage && (
        <div className="flex-shrink-0 px-4 py-2 border-t bg-background">
          <ImagePreview
            src={pendingImage}
            onRemove={() => setPendingImage(null)}
          />
        </div>
      )}

      {/* Video Preview */}
      {pendingVideo && (
        <div className="flex-shrink-0 px-4 py-2 border-t bg-background">
          <VideoPreview
            src={pendingVideo.previewUrl}
            onRemove={() => setPendingVideo(null)}
          />
        </div>
      )}

      {/* Audio Recording State */}
      {isRecording && (
        <div className="flex-shrink-0 px-4 py-3 border-t bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">Recording... {formatDuration(recordingDuration)}</span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={stopRecording}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Square className="h-3 w-3 mr-1 fill-current" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Audio Preview (after recording) */}
      {recordedAudioUrl && !isRecording && (
        <div className="flex-shrink-0 px-4 py-3 border-t bg-primary/5">
          <div className="flex items-center gap-3">
            <audio
              ref={audioPreviewRef}
              src={recordedAudioUrl}
              onEnded={() => setIsPreviewPlaying(false)}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full flex-shrink-0"
              onClick={togglePreviewPlay}
            >
              {isPreviewPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-primary/20">
                <div className="h-full w-full rounded-full bg-primary/40" />
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">{formatDuration(recordingDuration)}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setIsPreviewPlaying(false);
                resetRecording();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Templates */}
      <MessageTemplatesPanel
        onSelectTemplate={(text) => setNewMessage(text)}
      />

      {/* Video upload progress bar */}
      {videoUploadProgress > 0 && (
        <div className="flex-shrink-0 px-4 py-1.5 border-t bg-background">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Uploading video {videoUploadProgress}%</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${videoUploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-background safe-bottom">
        <div className="flex items-center gap-2">
          <ImagePicker onImageSelect={handleImageSelect} disabled={isSending || isRecording} />
          <VideoPicker onVideoSelect={handleVideoSelect} disabled={isSending || isRecording} />
          {/* Audio record button */}
          {audioRecordingSupported && !isRecording && !recordedAudioUrl && (
            <Button
              size="icon"
              variant="outline"
              onClick={startRecording}
              disabled={isSending}
              className="flex-shrink-0"
              title="Record audio"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isListening ? 'Listening...' : isRecording ? 'Recording...' : t('messages.typeMessage')}
            className={`flex-1 h-11 ${isListening ? 'border-primary ring-2 ring-primary/20' : ''}`}
            disabled={isSending || isRecording}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          {isSupported && !isRecording && !recordedAudioUrl && (
            <Button
              size="icon"
              variant={isListening ? 'destructive' : 'outline'}
              onClick={toggleListening}
              disabled={isSending}
              className="flex-shrink-0"
              title={isListening ? 'Stop listening' : 'Speech to text'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Languages className="h-4 w-4" />}
            </Button>
          )}
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !pendingImage && !pendingVideo && !recordedAudioBlob) || isSending || isRecording}
            className="flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
