import React, { useRef, useState } from 'react';
import { Image, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
  onImageSelect: (imageDataUrl: string) => void;
  disabled?: boolean;
}

export function ImagePicker({ onImageSelect, disabled }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for demo)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Maximum size is 5MB.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setIsLoading(true);

    try {
      // Resize image to reasonable size for localStorage
      const resizedImage = await resizeImage(file, 800, 800);
      onImageSelect(resizedImage);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleClick}
        disabled={disabled || isLoading}
        className="flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}

interface ImagePreviewProps {
  src: string;
  onRemove?: () => void;
  className?: string;
}

export function ImagePreview({ src, onRemove, className }: ImagePreviewProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <img 
        src={src} 
        alt="Attached" 
        className="rounded-lg max-w-full max-h-48 object-cover"
      />
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

// Utility to resize image
async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.8 quality for smaller size
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
