import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { PhotoAttachPanel } from "../PhotoAttachPanel";
import type { EvidenceItem, EvidenceTransport } from "@/services/evidence";

const TEST_EVIDENCE_TOKEN = 'test-evidence-token';

// jsdom does not implement URL.createObjectURL / revokeObjectURL. Stub them.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock';
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => undefined;
}

function makeBlob(name: string, type: string, sizeBytes: number): File {
  // Real-ish PNG/JPEG/WEBP bytes are not needed — only mime + size. Tests never
  // POST because transport is mocked. We pad to sizeBytes but cap to keep test
  // memory sane; the component's size check only sees `file.size` which jsdom
  // reports as the actual blob length, so we DON'T override `size` (File makes
  // it non-configurable in modern jsdom and override would throw).
  const capped = Math.min(sizeBytes, 64 * 1024);
  const data = new Uint8Array(capped);
  return new File([data], name, { type });
}

/**
 * Drive a hidden file input. userEvent.upload is unreliable on
 * display:none inputs in jsdom; fireEvent.change with a constructed
 * FileList is the canonical alternative.
 */
function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
}

function makeTransport(overrides: Partial<EvidenceTransport> = {}): EvidenceTransport {
  return {
    list: jest.fn(async () => ({ evidence: [] })),
    upload: jest.fn(async (_id: string, _blob: Blob, name: string) => ({
      evidence: {
        id: `ev_${name}`,
        kind: 'photo',
        mime: 'image/jpeg',
        bytes: 12345,
        status: 'uploaded'
      } as EvidenceItem
    })),
    remove: jest.fn(async () => undefined),
    ...overrides
  };
}

describe('PhotoAttachPanel', () => {
  it('renders the heading + helper copy', async () => {
    const transport = makeTransport();
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    expect(screen.getByText(/Optional: Attach photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Compressed to 1280 px max/i)).toBeInTheDocument();
  });

  it('loads existing evidence on mount', async () => {
    const list = jest.fn(async () => ({
      evidence: [
        { id: 'ev_a', kind: 'photo', mime: 'image/png', bytes: 80000, status: 'uploaded' as const },
        { id: 'ev_b', kind: 'photo', mime: 'image/jpeg', bytes: 60000, status: 'ready' as const }
      ]
    }));
    const transport = makeTransport({ list });
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    await waitFor(() => expect(list).toHaveBeenCalledWith('sub_1', TEST_EVIDENCE_TOKEN));
    await waitFor(() => expect(screen.getByTestId('photo-remove-ev_a')).toBeInTheDocument());
    expect(screen.getByTestId('photo-remove-ev_b')).toBeInTheDocument();
    expect(screen.getByText(/queued for report/i)).toBeInTheDocument();
  });

  it('rejects unsupported MIME and surfaces error text', async () => {
    const transport = makeTransport();
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    const input = screen.getByTestId('photo-attach-library-input') as HTMLInputElement;
    const gifFile = makeBlob('a.gif', 'image/gif', 1000);
    setFiles(input, [gifFile]);
    expect(await screen.findByText(/unsupported mime/i)).toBeInTheDocument();
    expect(screen.queryByTestId('photo-attach-upload')).not.toBeInTheDocument();
  });

  it('rejects oversize files before upload', async () => {
    const transport = makeTransport();
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    const input = screen.getByTestId('photo-attach-library-input') as HTMLInputElement;
    // Stub File.size for this one case; jsdom's File makes size non-configurable
    // in some versions so wrap in a Proxy that overrides the get.
    const realFile = new File([new Uint8Array(1024)], 'big.png', { type: 'image/png' });
    const huge = new Proxy(realFile, {
      get(target, prop) {
        if (prop === 'size') return 5 * 1024 * 1024;
        return Reflect.get(target, prop);
      }
    });
    setFiles(input, [huge]);
    expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
  });

  it('caps pending uploads at MAX_PHOTOS (3)', async () => {
    const list = jest.fn(async () => ({
      evidence: [
        { id: 'ev_a', kind: 'photo', mime: 'image/png', bytes: 1000, status: 'uploaded' as const }
      ]
    }));
    const transport = makeTransport({ list });
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    await waitFor(() => expect(list).toHaveBeenCalled());

    const input = screen.getByTestId('photo-attach-library-input') as HTMLInputElement;
    const four = [
      makeBlob('a.png', 'image/png', 1000),
      makeBlob('b.png', 'image/png', 1000),
      makeBlob('c.png', 'image/png', 1000),
      makeBlob('d.png', 'image/png', 1000)
    ];
    setFiles(input, four);
    expect(await screen.findByText(/Up to 3 photos/i)).toBeInTheDocument();
  });

  it('uploads all pending photos via the transport', async () => {
    const transport = makeTransport();
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    const input = screen.getByTestId('photo-attach-library-input') as HTMLInputElement;
    setFiles(input, [makeBlob('a.png', 'image/png', 1000), makeBlob('b.png', 'image/png', 2000)]);
    await waitFor(() => expect(screen.getByTestId('photo-attach-upload')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('photo-attach-upload'));
    await waitFor(() => expect(transport.upload).toHaveBeenCalledTimes(2));
    expect(transport.upload).toHaveBeenCalledWith('sub_1', expect.anything(), expect.stringMatching(/\.png$/), TEST_EVIDENCE_TOKEN);
  });

  it('removes a pending selection before upload', async () => {
    const transport = makeTransport();
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    const input = screen.getByTestId('photo-attach-library-input') as HTMLInputElement;
    setFiles(input, [makeBlob('a.png', 'image/png', 1000)]);
    const pendingId = (await screen.findAllByTestId(/^photo-pending-remove-/))[0].getAttribute('data-testid')!.replace('photo-pending-remove-', '');
    await userEvent.click(screen.getByTestId(`photo-pending-remove-${pendingId}`));
    await waitFor(() => expect(screen.queryByTestId('photo-attach-upload')).not.toBeInTheDocument());
  });

  it('removes an uploaded item via the transport', async () => {
    const list = jest.fn(async () => ({
      evidence: [{ id: 'ev_x', kind: 'photo', mime: 'image/png', bytes: 1024, status: 'uploaded' as const }]
    }));
    const transport = makeTransport({ list, remove: jest.fn(async () => undefined) });
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={transport} />);
    await waitFor(() => expect(screen.getByTestId('photo-remove-ev_x')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('photo-remove-ev_x'));
    await waitFor(() => expect(transport.remove).toHaveBeenCalledWith('sub_1', 'ev_x', TEST_EVIDENCE_TOKEN));
    await waitFor(() => expect(screen.queryByTestId('photo-remove-ev_x')).not.toBeInTheDocument());
  });

  it('hides entirely when disabled', () => {
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={makeTransport()} disabled />);
    expect(screen.queryByText(/Optional: Attach photos/i)).not.toBeInTheDocument();
  });

  it('exposes capture=environment on the camera input (mobile UX)', () => {
    render(<PhotoAttachPanel submissionId="sub_1" evidenceToken={TEST_EVIDENCE_TOKEN} transport={makeTransport()} />);
    const cameraInput = screen.getByTestId('photo-attach-camera-input') as HTMLInputElement;
    expect(cameraInput.getAttribute('capture')).toBe('environment');
    expect(cameraInput.getAttribute('accept')).toContain('image/jpeg');
  });
});
