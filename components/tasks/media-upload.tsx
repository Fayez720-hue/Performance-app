'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2, Mic, FileUp, Camera, Image as ImageIcon } from 'lucide-react';
import { pickMedia } from '@/lib/media';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MediaUploadProps {
  onUpload: (content: string) => void;
  label?: string;
}

export function MediaUpload({ onUpload, label }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNativePick = async () => {
    try {
      setIsUploading(true);
      const media = await pickMedia();

      if (media && media.base64) {
        await uploadBase64(media.base64, media.name, media.type);
      }
    } catch (error) {
      console.error('Native pick failed', error);
      fileInputRef.current?.click();
    } finally {
      setIsUploading(false);
    }
  };

  const uploadBase64 = async (base64: string, name: string, type: string) => {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: base64,
        name: name,
        type: type
      }),
    });

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    onUpload(`\n[Attached ${type}: ${data.url}]`);
    toast.success(`${type} uploaded`);
  };

  const handleWebPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
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

  const startWebRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsUploading(true);
          try {
            await uploadBase64(base64, `voice_${Date.now()}.webm`, 'audio');
          } catch (e) {
            toast.error("Failed to upload recording");
          } finally {
            setIsUploading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error('Web recording failed', err);
      toast.error("Microphone access denied or error occurred");
    }
  };

  const stopWebRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {Capacitor.isNativePlatform() ? (
            <>
              <DropdownMenuItem onClick={() => handleNativePick()}>
                <Camera className="mr-2 h-4 w-4" /> Take Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNativePick()}>
                <ImageIcon className="mr-2 h-4 w-4" /> Gallery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNativePick()}>
                <Mic className="mr-2 h-4 w-4" /> Record Voice
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startWebRecording}>
                <Mic className="mr-2 h-4 w-4" /> Record Audio
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isRecording} onOpenChange={(open) => {
        if (!open && isRecording) stopWebRecording();
      }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Recording Audio</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
              <Mic className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</div>
            <p className="text-xs text-muted-foreground">Click stop to save the recording</p>
            <Button variant="destructive" className="w-full" onClick={stopWebRecording}>
              Stop & Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
