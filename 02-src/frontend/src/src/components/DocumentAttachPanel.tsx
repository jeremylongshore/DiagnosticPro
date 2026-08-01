import { useEffect, useRef, useState } from "react";
import { AlertCircle, ClipboardList, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  defaultDocumentEvidenceTransport,
  deleteEvidence,
  listDocumentEvidence,
  uploadDocument,
  type DocumentEvidenceTransport,
  type DocumentKind,
  type EvidenceItem
} from "@/services/evidence";

const MAX_DOCUMENTS = 5;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ".pdf,.docx,.txt,.csv,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/json";

interface PendingDocument {
  id: string;
  file: File;
  kind: DocumentKind;
}

export interface DocumentAttachPanelProps {
  submissionId: string;
  evidenceToken: string;
  transport?: DocumentEvidenceTransport;
  disabled?: boolean;
}

function kindLabel(kind: DocumentKind | string): string {
  return kind === 'work_order' ? 'Work order' : 'Relevant document';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
}

function isSupportedDocument(file: File): boolean {
  const allowedTypes = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json'
  ]);
  const allowedExtensions = new Set(['.pdf', '.docx', '.txt', '.csv', '.json']);
  return allowedTypes.has(file.type.toLowerCase()) || allowedExtensions.has(extensionOf(file.name));
}

function evidenceStatusLabel(item: EvidenceItem): string {
  if (item.status === 'ready') return 'Ready for AI';
  if (item.status === 'needs_ocr') return 'Needs OCR — not used';
  if (item.status === 'failed') return 'Could not be read';
  if (item.status === 'uploaded') return 'Uploaded — checking text';
  return item.status;
}

export const DocumentAttachPanel = ({
  submissionId,
  evidenceToken,
  transport = defaultDocumentEvidenceTransport,
  disabled = false
}: DocumentAttachPanelProps) => {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionKind, setSelectionKind] = useState<DocumentKind>('document');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    if (!submissionId) return;
    setLoading(true);
    listDocumentEvidence(submissionId, transport, evidenceToken)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load documents');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId, transport, evidenceToken]);

  const capacity = MAX_DOCUMENTS - items.length - pending.length;

  function openPicker(kind: DocumentKind) {
    setSelectionKind(kind);
    fileInputRef.current?.click();
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const accepted: PendingDocument[] = [];
    for (const file of Array.from(fileList)) {
      if (!isSupportedDocument(file)) {
        setError('Document rejected: use PDF, DOCX, TXT, CSV, or JSON files.');
        continue;
      }
      if (file.size <= 0) {
        setError('Document rejected: the file is empty.');
        continue;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        setError('Document rejected: files must be 10 MB or smaller.');
        continue;
      }
      if (capacity - accepted.length <= 0) {
        setError(`Up to ${MAX_DOCUMENTS} documents total — extra files ignored.`);
        break;
      }
      accepted.push({
        id: `pending_${Math.random().toString(36).slice(2, 10)}`,
        file,
        kind: selectionKind
      });
    }
    if (accepted.length > 0) setPending((current) => [...current, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePending(id: string) {
    setPending((current) => current.filter((item) => item.id !== id));
  }

  async function uploadAll() {
    if (pending.length === 0 || !submissionId) return;
    setUploading(true);
    setError(null);
    let uploadedCount = 0;
    try {
      for (const pendingItem of pending) {
        const item = await uploadDocument(
          submissionId,
          pendingItem.file,
          pendingItem.file.name,
          pendingItem.kind,
          transport,
          evidenceToken
        );
        uploadedCount += 1;
        setItems((current) => [...current, item]);
        setPending((current) => current.filter((candidate) => candidate.id !== pendingItem.id));
      }
      toast({
        title: "Documents attached",
        description: `${uploadedCount} document${uploadedCount === 1 ? '' : 's'} will be included as diagnostic evidence.`
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Document upload failed';
      setError(message);
      toast({ title: "Document upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function removeUploaded(id: string) {
    setError(null);
    try {
      await deleteEvidence(submissionId, id, transport, evidenceToken);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  }

  if (disabled) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4" data-testid="document-attach-panel">
      <div>
        <h3 className="font-semibold text-base flex items-center gap-2">
          <FileText className="h-4 w-4" /> Add work orders or relevant documents
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Work orders, estimates, service notes, and text-based manuals can give the AI dates, tests, parts, codes, and quoted work. Your original file stays private; readable text is extracted before it is used. Up to {MAX_DOCUMENTS} files, 10 MB each. Optional — payment stays enabled either way.
        </p>
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
          onClick={() => openPicker('work_order')}
          disabled={capacity <= 0 || uploading}
          data-testid="document-attach-work-order"
        >
          <ClipboardList className="h-4 w-4 mr-2" /> Attach work order
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openPicker('document')}
          disabled={capacity <= 0 || uploading}
          data-testid="document-attach-relevant"
        >
          <FileText className="h-4 w-4 mr-2" /> Attach other document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_TYPES}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
          data-testid="document-attach-input"
        />
        {pending.length > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={uploadAll}
            disabled={uploading}
            data-testid="document-attach-upload"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload {pending.length} file{pending.length === 1 ? '' : 's'}
              </>
            )}
          </Button>
        )}
      </div>

      {(items.length > 0 || pending.length > 0 || loading) && (
        <ul className="space-y-2" data-testid="document-attach-list">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded border border-border/80 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.originalName || item.original_name || kindLabel(item.kind)}</p>
                <p className="text-xs text-muted-foreground">
                  {kindLabel(item.kind)} · {formatBytes(item.bytes)} · {evidenceStatusLabel(item)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.originalName || item.original_name || 'document'}`}
                className="rounded p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => removeUploaded(item.id)}
                data-testid={`document-remove-${item.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded border border-dashed border-border px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{kindLabel(item.kind)} · {formatBytes(item.file.size)} · pending upload</p>
              </div>
              <button
                type="button"
                aria-label={`Remove selected ${item.file.name}`}
                className="rounded p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => removePending(item.id)}
                data-testid={`document-pending-remove-${item.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </li>
          ))}
          {loading && (
            <li className="flex items-center gap-2 rounded border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading attached documents...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default DocumentAttachPanel;
