import React from 'react';
import { ExternalLink, File, Image, Video, Music, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaRendererProps {
  text: string;
}

export function MediaRenderer({ text }: MediaRendererProps) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const lineMatches = Array.from(line.matchAll(/\[(Uploaded|Attached\s+(\w+)):\s*(.*?)\]/g));

        if (lineMatches.length === 0) {
          if (!line.trim()) return <div key={i} className="h-2" />;
          return <p key={i} className="whitespace-pre-wrap text-sm text-muted-foreground">{line}</p>;
        }

        const segments = [];
        let lastMatchEnd = 0;

        lineMatches.forEach((m, j) => {
          if (m.index !== undefined && m.index > lastMatchEnd) {
            segments.push(line.substring(lastMatchEnd, m.index));
          }

          const type = (m[2] || '').toLowerCase();
          let content = m[3] || '';
          
          if (content.startsWith('http://')) {
            content = content.replace('http://', 'https://');
          }

          const isUrl = content.startsWith('http') || content.startsWith('data:');
          const isVercelBlob = content.includes('blob.vercel-storage.com');

          segments.push(
            <div key={`match-${j}`} className="my-2 flex flex-col gap-2 rounded-md border border-border bg-muted/50 p-2 max-w-sm">
              <div className="flex items-center gap-2">
                {type.includes('image') ? <Image className="h-4 w-4 text-blue-400" /> :
                 type.includes('video') ? <Video className="h-4 w-4 text-red-400" /> :
                 type.includes('audio') ? <Music className="h-4 w-4 text-emerald-400" /> :
                 <File className="h-4 w-4 text-zinc-400" />}
                <span className="text-xs font-medium truncate flex-1">{isUrl ? 'Media Attachment' : content}</span>

                {isUrl && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Open link">
                      <a href={content} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Download">
                      <a href={content} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Audio only */}
              {isUrl && (type.includes('audio') || content.match(/\.(mp3|wav|ogg|m4a|webm)/i)) && (
                <div className="w-full bg-black/5 rounded p-1">
                  <audio controls className="w-full h-8 scale-90 origin-left">
                    <source src={content} />
                  </audio>
                </div>
              )}

              {/* Image - but NOT for audio/video types */}
              {isUrl && (type.includes('image') || content.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || (isVercelBlob && !type.includes('audio') && !type.includes('video'))) && (
                <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border bg-black/20">
                  <img
                    src={content}
                    alt="Attached media"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Video only */}
              {isUrl && (type.includes('video') || content.match(/\.(mp4|webm|mov|avi)/i)) && (
                <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border bg-black/20">
                  <video controls className="h-full w-full object-contain">
                    <source src={content} />
                  </video>
                </div>
              )}

              {!isUrl && (
                <span className="text-[10px] text-muted-foreground italic">
                  (File info: {content})
                </span>
              )}
            </div>
          );

          lastMatchEnd = (m.index || 0) + m[0].length;
        });

        if (lastMatchEnd < line.length) {
          segments.push(line.substring(lastMatchEnd));
        }

        return <div key={i} className="text-sm">{segments}</div>;
      })}
    </div>
  );
}