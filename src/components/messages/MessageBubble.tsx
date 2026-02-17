import React, { useState, useRef, useEffect } from 'react';
import { Languages, Loader2, Play, Pause } from 'lucide-react';
import { Message, User } from '@/lib/types';
import { Language, languages } from '@/lib/i18n';
import { getUserById } from '@/services/firestoreService';
import { ReadReceiptIndicator } from './ReadReceiptIndicator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatarUtils';
import { LanguageFlag } from '@/components/ui/language-flag';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  userLanguage: Language;
}

function AudioPlayer({ src, isOwn, duration }: { src: string; isOwn: boolean; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setProgress(
              audioDuration > 0 ? (audioRef.current.currentTime / audioDuration) * 100 : 0
            );
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration !== Infinity) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
            : 'bg-primary/10 hover:bg-primary/20'
        }`}
      >
        {isPlaying ? (
          <Pause className={`h-4 w-4 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`} />
        ) : (
          <Play className={`h-4 w-4 ml-0.5 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`h-1.5 rounded-full overflow-hidden ${
          isOwn ? 'bg-primary-foreground/20' : 'bg-primary/10'
        }`}>
          <div
            className={`h-full rounded-full transition-all ${
              isOwn ? 'bg-primary-foreground/60' : 'bg-primary/50'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] mt-0.5 block ${
          isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
        }`}>
          {isPlaying ? formatTime(currentTime) : formatTime(audioDuration)}
        </span>
      </div>
    </div>
  );
}

export function MessageBubble({ message, isOwn, userLanguage }: MessageBubbleProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [sender, setSender] = useState<User | null>(null);
  const senderLang = languages.find(l => l.code === message.originalLanguage);

  // Fetch sender data (for all messages, including own)
  useEffect(() => {
    const fetchSender = async () => {
      if (message.senderId) {
        const user = await getUserById(message.senderId);
        setSender(user);
      }
    };
    fetchSender();
  }, [message.senderId]);

  const hasTranslation = message.translations[userLanguage];
  const isTranslating = message.isTranslating;

  const displayText = showOriginal
    ? message.originalText
    : (message.translations[userLanguage] || message.originalText);

  const showToggle = message.originalLanguage !== userLanguage && !isOwn && hasTranslation;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {sender && sender.fullName && (
        <span className={`text-xs text-muted-foreground mb-1 ${isOwn ? 'mr-11' : 'ml-11'}`}>
          {sender.fullName}
        </span>
      )}
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2 items-start max-w-[80%]`}>
        {sender && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            {sender.email && getUserAvatarUrl(sender.email) && (
              <AvatarImage src={getUserAvatarUrl(sender.email)} alt={sender.fullName || 'User'} />
            )}
            <AvatarFallback className={`text-xs ${isOwn ? 'bg-primary/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
              {getInitials(sender.fullName)}
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-foreground rounded-bl-md'
          }`}
        >
          {/* Image attachment */}
          {message.imageUrl && (
            <div className="mb-2 -mx-2 -mt-1">
              <img
                src={message.imageUrl}
                alt="Attached"
                className="rounded-lg max-w-full cursor-pointer"
                onClick={() => window.open(message.imageUrl, '_blank')}
              />
            </div>
          )}

          {/* Video attachment */}
          {message.videoUrl && (
            <div className="mb-2 -mx-2 -mt-1">
              <video
                src={message.videoUrl}
                controls
                className="rounded-lg max-w-full"
              />
            </div>
          )}

          {/* Audio attachment */}
          {message.audioUrl && (
            <div className={message.originalText ? 'mb-2' : ''}>
              <AudioPlayer src={message.audioUrl} isOwn={isOwn} duration={message.audioDuration} />
            </div>
          )}

          {/* Text content */}
          {message.originalText && (
            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
          )}

          {isTranslating && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              <Loader2 className="h-3 w-3 animate-spin" />
              Translating...
            </div>
          )}

          {showToggle && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={`flex items-center gap-1 mt-1 text-xs ${
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}
            >
              <Languages className="h-3 w-3" />
              {showOriginal ? 'Show translation' : (<>Original (<LanguageFlag code={senderLang?.code || 'en'} size="xs" className="inline relative -top-px" />)</>)}
            </button>
          )}
        </div>
        <div className={`flex items-center gap-2 text-xs text-muted-foreground mt-1 ${isOwn ? 'mr-3' : 'ml-3'}`}>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <ReadReceiptIndicator
              senderId={message.senderId}
              readBy={message.readBy}
              createdAt={message.createdAt}
            />
          )}
        </div>
      </div>
    </div>
  );
}
