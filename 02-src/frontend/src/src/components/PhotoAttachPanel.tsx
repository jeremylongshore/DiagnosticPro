import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Trash2, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { compressImage, validatePhotoFile } from "@/lib/imageCompress";
import {
  defaultEvidenceTransport,
  deleteEvidence,
  listEvidence,
  uploadEvidence,
  type EvidenceItem,
  type EvidenceTransport
} from "@/services/evidence";

const MAX_PHOTOS = 3;

export interface PhotoAttachPanelProps {
  submissionId: string;
  evidenceToken: string;
  transport?: EvidenceTransport;
  disabled?: boolean;
}

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
}

export const PhotoAttachPanel = ({ submissionId, evidenceToken, transport = defaultEvidenceTransport, disabled = false }: PhotoAttachPanelProps) => {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initial load (re-mount safety: pull current server state).
  useEffect(() => {
    let cancelled = false;
    if (!submissionId) return;
    setLoading(true);
    listEvidence(submissionId, transport, evidenceToken)
      .then((list) => {
        if (!cancelled) setItems(list.filter((item) => item.kind === 'photo'));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load photos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId, transport, evidenceToken]);

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capacity = MAX_PHOTOS - items.length - pending.length;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const accepted: PendingUpload[] = [];
    for (const file of Array.from(fileList)) {
      const v = validatePhotoFile({ type: file.type, size: file.size });
      if (!v.ok) {
        setError(`Photo rejected: ${v.error.replace(/_/g, ' ')}`);
        continue;
      }
      if (capacity - accepted.length <= 0) {
        setError(`Up to ${MAX_PHOTOS} photos total — extra photos ignored`);
        break;
      }
      accepted.push({
        id: `pending_${Math.random().toString(36).slice(2, 10)}`,
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
    if (accepted.length > 0) setPending((p) => [...p, ...accepted]);
  }

  function removePending(id: string) {
    setPending((p) => {
      const target = p.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return p.filter((x) => x.id !== id);
    });
  }

  async function uploadAll() {
    if (pending.length === 0 || !submissionId) return;
    setUploading(true);
    setError(null);
    try {
      for (const p of pending) {
        const compressed = await compressImage(p.file);
        const filename = p.file.name || `photo-${Date.now()}.jpg`;
        const item = await uploadEvidence(submissionId, compressed, filename, transport, evidenceToken);
        setItems((existing) => [...existing, item]);
        URL.revokeObjectURL(p.previewUrl);
      }
      setPending([]);
      toast({
        title: "Photos attached",
        description: `${pending.length} photo${pending.length === 1 ? '' : 's'} uploaded for your diagnostic report.`
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function removeUploaded(id: string) {
    setError(null);
    try {
      await deleteEvidence(submissionId, id, transport, evidenceToken);
      setItems((existing) => existing.filter((e) => e.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    }
  }

  if (disabled) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Optional: Attach photos (up to {MAX_PHOTOS})
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Photos help the AI see the issue. Compressed to 1280 px max; JPEG/PNG/WebP, up to 2 MB each. Optional — pay button stays enabled either way.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={capacity <= 0 || uploading}
          data-testid="photo-attach-camera"
        >
          <Camera className="h-4 w-4 mr-2" /> Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={capacity <= 0 || uploading}
          data-testid="photo-attach-library"
        >
          <ImageIcon className="h-4 w-4 mr-2" /> Choose from device
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="photo-attach-camera-input"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="photo-attach-library-input"
        />
        {pending.length > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={uploadAll}
            disabled={uploading}
            data-testid="photo-attach-upload"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload {pending.length} photo{pending.length === 1 ? '' : 's'}
              </>
            )}
          </Button>
        )}
      </div>

      {(items.length > 0 || pending.length > 0 || loading) && (
        <ul className="grid grid-cols-3 gap-3" data-testid="photo-attach-grid">
          {items.map((item) => (
            <li key={item.id} className="relative aspect-square rounded border border-border overflow-hidden bg-muted/40">
              <PhotoPreview evidence={item} />
              <button
                type="button"
                aria-label="Remove photo"
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background"
                onClick={() => removeUploaded(item.id)}
                data-testid={`photo-remove-${item.id}`}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
              <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center bg-background/80 rounded px-1 py-0.5">
                {item.status === 'ready' ? 'queued for report' : item.status}
              </span>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="relative aspect-square rounded border border-dashed overflow-hidden bg-muted/30">
              <img src={p.previewUrl} alt="Selected preview" className="object-cover w-full h-full opacity-80" />
              <button
                type="button"
                aria-label="Remove selected photo"
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background"
                onClick={() => removePending(p.id)}
                data-testid={`photo-pending-remove-${p.id}`}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
              <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center bg-background/80 rounded px-1 py-0.5">
                pending upload
              </span>
            </li>
          ))}
          {loading && (
            <li className="aspect-square rounded border border-dashed flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

// Tiny inline preview: shows the evidence record (no public URL by design —
// we never serve the bytes through this app). For UI we just show a status
// tile. If we add an authenticated preview endpoint later this is the swap.
const PhotoPreview = ({ evidence }: { evidence: EvidenceItem }) => {
  return (
    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center">
      {evidence.mime.replace('image/', '').toUpperCase()} · {(evidence.bytes / 1024).toFixed(0)} KB
    </div>
  );
};

export default PhotoAttachPanel;
