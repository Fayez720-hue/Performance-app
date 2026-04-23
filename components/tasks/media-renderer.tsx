import React from 'react';
import { ExternalLink, FileIcon, ImageIcon, VideoIcon, MusicIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaRendererProps {
  text: string;
}

export function MediaRenderer({ text }: MediaRendererProps) {
  if (!text) return null;

  // Regex to find [Uploaded: URL] or [Uploaded: Name] or [Attached Type: Name]
  // We want to support both just names (old) and potential URLs (new)
  const mediaRegex = /\[(Uploaded|Attached\s+\w+):\s*(.*?)\]/g;

  const parts = text.split(mediaRegex);
  const elements = [];

  let lastIndex = 0;
  let match;

  // Re-run regex to get matches and their positions
  const matches = Array.from(text.matchAll(mediaRegex));

  let currentPos = 0;

  // This is a bit tricky with split and matchAll.
  // Let's use a simpler approach: process line by line or use a more robust parser.

  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const lineMatches = Array.from(line.matchAll(/\[(Uploaded|Attached\s+(\w+)):\s*(.*?)\]/g));

        if (lineMatches.length === 0) {
          return <p key={i} className="whitespace-pre-wrap text-sm">{line}</p>;
        }

        const segments = [];
        let lastMatchEnd = 0;

        lineMatches.forEach((m, j) => {
          // Push text before match
          if (m.index! > lastMatchEnd) {
            segments.push(line.substring(lastMatchEnd, m.index));
          }

          const type = m[2] || 'file'; // image, video, etc
          const content = m[3]; // filename or URL

          const isUrl = content.startsWith('http') || content.startsWith('data:');

          segments.push(
            <div key={`match-${j}`} className="my-2 flex flex-col gap-2 rounded-md border border-border bg-muted/50 p-2">
              <div className="flex items-center gap-2">
                {type.includes('image') ? <ImageIcon className="h-4 w-4 text-blue-400" /> :
                 type.includes('video') ? <VideoIcon className="h-4 w-4 text-red-400" /> :
                 type.includes('audio') ? <MusicIcon className="h-4 w-4 text-emerald-400" /> :
                 <FileIcon className="h-4 w-4 text-zinc-400" />}
                <span className="text-xs font-medium truncate max-w-[200px]">{isUrl ? 'Media Attachment' : content}</span>

                {isUrl && (
                  <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" asChild>
                    <a href={content} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>

              {isUrl && type.includes('image') && (
                <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border">
                  <img
                    src={content}
                    alt="Attached media"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {!isUrl && (
                <span className="text-[10px] text-muted-foreground italic">
                  (File not yet uploaded to server)
                </span>
              )}
            </div>
          );

          lastMatchEnd = m.index! + m[0].length;
        });

        if (lastMatchEnd < line.length) {
          segments.push(line.substring(lastMatchEnd));
        }

        return <div key={i} className="text-sm">{segments}</div>;
      })}
    </div>
  );
}
