# Backend Service

Node.js Express API deployed to the self-hosted DiagnosticPro backend.

## Services

The optional evidence flow accepts:

- Photos: JPEG, PNG, or WebP, up to 3 files at 2 MiB each.
- Work orders and relevant documents: text-bearing PDF, DOCX, TXT, CSV, or JSON, up to 5 files at 10 MiB each.

Documents are parsed before analysis. Extracted text is bounded, marked as
untrusted customer evidence in the prompt, and only included in a paid report
when extraction succeeds. Scanned PDFs are retained with `needs_ocr` status and
are not represented as understood evidence.

Private upload route:

```text
POST /evidence/:submissionId/document
multipart field: document
text field: kind=work_order|document
```
