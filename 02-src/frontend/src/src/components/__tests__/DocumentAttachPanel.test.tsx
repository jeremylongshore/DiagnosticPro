import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { DocumentAttachPanel } from "../DocumentAttachPanel";
import type { DocumentEvidenceTransport, EvidenceItem } from "@/services/evidence";

const TEST_EVIDENCE_TOKEN = 'test-evidence-token';

function makeFile(name: string, type: string, contents = 'work order WO-1042\nCode P0301\n') {
  return new File([contents], name, { type });
}

function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
}

function makeTransport(overrides: Partial<DocumentEvidenceTransport> = {}): DocumentEvidenceTransport {
  return {
    list: jest.fn(async () => ({ evidence: [] })),
    upload: jest.fn(async (_id: string, _blob: Blob, filename: string, kind) => ({
      evidence: {
        id: `ev_${filename}`,
        kind,
        mime: 'application/pdf',
        bytes: 2048,
        originalName: filename,
        status: 'ready'
      } as EvidenceItem
    })),
    remove: jest.fn(async () => undefined),
    ...overrides
  };
}

describe('DocumentAttachPanel', () => {
  it('renders the work-order/document explanation and controls', () => {
    render(<DocumentAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={makeTransport()} />);
    expect(screen.getByText(/Add work orders or relevant documents/i)).toBeInTheDocument();
    expect(screen.getByTestId('document-attach-work-order')).toBeInTheDocument();
    expect(screen.getByTestId('document-attach-relevant')).toBeInTheDocument();
    expect(screen.getByText(/original file stays private/i)).toBeInTheDocument();
  });

  it('lists only document evidence and exposes OCR status honestly', async () => {
    const transport = makeTransport({
      list: jest.fn(async () => ({
        evidence: [
          { id: 'ev_photo', kind: 'photo', mime: 'image/png', bytes: 1000, status: 'ready' as const },
          { id: 'ev_scan', kind: 'work_order', mime: 'application/pdf', bytes: 5000, originalName: 'scan.pdf', status: 'needs_ocr' as const }
        ]
      }))
    });
    render(<DocumentAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    await waitFor(() => expect(screen.getByText('scan.pdf')).toBeInTheDocument());
    expect(screen.getByText(/Needs OCR — not used/i)).toBeInTheDocument();
    expect(screen.queryByTestId('document-remove-ev_photo')).not.toBeInTheDocument();
  });

  it('rejects unsupported files before upload', async () => {
    render(<DocumentAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={makeTransport()} />);
    const input = screen.getByTestId('document-attach-input') as HTMLInputElement;
    setFiles(input, [makeFile('invoice.exe', 'application/octet-stream')]);
    expect(await screen.findByText(/use PDF, DOCX, TXT, CSV, or JSON/i)).toBeInTheDocument();
    expect(screen.queryByTestId('document-attach-upload')).not.toBeInTheDocument();
  });

  it('uploads a work order with its kind and filename', async () => {
    const transport = makeTransport();
    render(<DocumentAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    await userEvent.click(screen.getByTestId('document-attach-work-order'));
    const input = screen.getByTestId('document-attach-input') as HTMLInputElement;
    setFiles(input, [makeFile('work-order.pdf', 'application/pdf', '%PDF-1.7\nWO-1042')]);
    await userEvent.click(await screen.findByTestId('document-attach-upload'));
    await waitFor(() => expect(transport.upload).toHaveBeenCalledTimes(1));
    expect(transport.upload).toHaveBeenCalledWith('sub_1', expect.anything(), 'work-order.pdf', 'work_order', TEST_EVIDENCE_TOKEN);
    expect(await screen.findByText(/Ready for AI/i)).toBeInTheDocument();
  });

  it('removes a pending document without uploading it', async () => {
    const transport = makeTransport();
    render(<DocumentAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    await userEvent.click(screen.getByTestId('document-attach-relevant'));
    setFiles(screen.getByTestId('document-attach-input') as HTMLInputElement, [makeFile('notes.txt', 'text/plain')]);
    const remove = await screen.findByRole('button', { name: /Remove selected notes.txt/i });
    await userEvent.click(remove);
    expect(screen.queryByTestId('document-attach-upload')).not.toBeInTheDocument();
    expect(transport.upload).not.toHaveBeenCalled();
  });
});
