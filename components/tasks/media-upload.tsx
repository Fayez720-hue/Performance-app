'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Image as ImageIcon, Mic, X, Loader2 } from 'lucide-react';
import { pickMedia, type MediaAttachment } from '@/lib/media';
import { toast } from 'sonner';

interface MediaUploadProps {
  onUpload: (url: string) => void;
  label?: string;
}

export function MediaUpload({ onUpload, label }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = async () => {
    try {
      const media = await pickMedia();
      if (!media) return;

      setIsUploading(true);

      // Since we don't have a dedicated media storage bucket yet,
      // we'll append the info to the text for now or simulate an upload.
      // In a real app, you'd upload to S3/Cloudinary here.

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For now, we return a "Mock Link" or the Base64 if small.
      // But ideally we just notify the user it's attached.
      onUpload(`\n[Attached ${media.type}: ${media.name}]`);

      toast.success(`${media.type} attached`);
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Failed to attach media');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePick}
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
