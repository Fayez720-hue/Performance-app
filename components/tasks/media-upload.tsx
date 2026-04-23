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

      if (media && media.base64) {
        // Upload base64 to server
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: media.base64,
            name: media.name,
            type: media.type
          }),
        });

        if (!response.ok) throw new Error("Native upload failed");

        const data = await response.json();
        onUpload(`\n[Attached ${media.type}: ${data.url}]`);
        toast.success(`${media.type} uploaded`);
      }
    } catch (error) {
      console.error('Native pick/upload failed', error);
      // Fallback to web pick if native fails
      fileInputRef.current?.click();
    } finally {
      setIsUploading(false);
    }
  };

  const handleWebPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onUpload(`\n[Uploaded: ${data.url}]`);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error('Web upload failed', error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
