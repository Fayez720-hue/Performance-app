'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2 } from 'lucide-react';
import { pickMedia } from '@/lib/media';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

interface MediaUploadProps {
  onUpload: (content: string) => void;
  label?: string;
}

export function MediaUpload({ onUpload, label }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNativePick = async () => {
    try {
      setIsUploading(true);
      const media = await pickMedia();

      if (media) {
        onUpload(`\n[Attached ${media.type}: ${media.name}]`);
        toast.success(`${media.type} attached`);
      }
    } catch (error) {
      console.error('Native pick failed', error);
      // Fallback to web pick if native fails
      fileInputRef.current?.click();
    } finally {
      setIsUploading(false);
    }
  };

  const handleWebPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate upload or handle small files
    setTimeout(() => {
      onUpload(`\n[Uploaded: ${file.name}]`);
      toast.success("File attached");
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1000);
  };

  const handleClick = () => {
    if (Capacitor.isNativePlatform()) {
      handleNativePick();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleWebPick}
        accept="image/*,video/*,audio/*"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isUploading}
        className="h-8 text-xs gap-1.5"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="h-3.5 w-3.5" />
        )}
        {label || 'Attach Media'}
      </Button>
    </div>
  );
}
