import React, { useRef } from 'react';
import type { MediaAttachment } from '../../types';
import { Image as ImageIcon, Film, FileText, X, Upload, AlertTriangle } from 'lucide-react';

interface MediaAttachmentPickerProps {
  attachments: MediaAttachment[];
  onChange: (attachments: MediaAttachment[]) => void;
}

// CHANGE: broadened from images/video only to any file type. Evidence and
// intake material arrives as PDFs, field reports, and spreadsheets just as
// often as photos -- restricting intake to media types would just push those
// formats into a separate, untracked channel instead of through this record.
function getKind(file: File): 'image' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

export const MediaAttachmentPicker: React.FC<MediaAttachmentPickerProps> = ({ attachments, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // CHANGE: every newly attached file defaults to 'field_capture'. The person
    // must explicitly tap to flip it to 'ai_generated' -- defaulting the other
    // way would make it too easy for AI-sourced material to slip through
    // untagged, which is exactly what DEC-0001 exists to prevent.
    const newAttachments: MediaAttachment[] = Array.from(files).map((file) => ({
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      kind: getKind(file),
      url: URL.createObjectURL(file),
      origin: 'field_capture',
    }));

    onChange([...attachments, ...newAttachments]);
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const handleToggleOrigin = (id: string) => {
    onChange(
      attachments.map((a) =>
        a.id === id ? { ...a, origin: a.origin === 'field_capture' ? 'ai_generated' : 'field_capture' } : a
      )
    );
  };

  const hasAiGenerated = attachments.some((a) => a.origin === 'ai_generated');

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] font-mono uppercase text-zinc-600">
          Attach Photos, Video, or Documents (optional)
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-zinc-700 hover:text-zinc-950 border border-zinc-300 rounded hover:bg-zinc-100 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Add File</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {attachments.map((att) => (
            <div key={att.id} className="relative border border-zinc-300 rounded overflow-hidden bg-zinc-50 group">
              {att.kind === 'image' && <img src={att.url} alt={att.name} className="w-full h-24 object-cover" />}
              {att.kind === 'video' && <video src={att.url} className="w-full h-24 object-cover" muted />}
              {att.kind === 'document' && (
                <div className="w-full h-24 flex flex-col items-center justify-center gap-1 p-2">
                  <FileText className="w-6 h-6 text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-600 text-center leading-tight line-clamp-2 px-1">
                    {att.name}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemove(att.id)}
                className="absolute top-1 right-1 p-0.5 rounded bg-zinc-900/80 text-white hover:bg-zinc-900 transition-colors"
                aria-label={`Remove ${att.name}`}
              >
                <X className="w-3 h-3" />
              </button>

              {att.kind !== 'document' && (
                <div className="absolute top-1 left-1 p-0.5 rounded bg-zinc-900/70 text-white">
                  {att.kind === 'image' ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleToggleOrigin(att.id)}
                title="Tap to change tag"
                className={`absolute bottom-0 left-0 right-0 py-1 text-[9px] font-mono font-bold uppercase text-center transition-colors ${
                  att.origin === 'ai_generated' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-emerald-700 text-white hover:bg-emerald-800'
                }`}
              >
                {att.origin === 'ai_generated' ? 'AI-Generated \u2022 tap to fix' : 'Field Capture \u2022 tap to flag AI'}
              </button>
            </div>
          ))}
        </div>
      )}

      {hasAiGenerated && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-300 rounded text-[11px] font-mono text-amber-900">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            DEC-0001 policy: AI-generated imagery, video, or documents must never be presented as real field
            evidence. This tag will stay attached through triage and record review.
          </span>
        </div>
      )}
    </div>
  );
};
