# DiagnosticPro Documentation (000-docs/)

This directory contains all project documentation following the **Document Filing System Standard v4.2**.

## Quick Navigation

### 🚀 Mobile App Deployment (Latest)

**Start Here:** `000-DR-INDEX-mobile-documentation.md`

| Document | Purpose |
|----------|---------|
| `077-OD-GUID-app-store-submission.md` | **Complete guide** for App Store and Play Store submission |
| `078-OD-REFF-mobile-setup-summary.md` | **Quick summary** of what was done |
| `079-AA-AACR-mobile-app-conversion.md` | **After Action Review** with lessons learned |

---

## Naming Convention (v4.2 Standard)

All documents follow this pattern:
```
NNN-CC-ABCD-short-description.md
```

- **NNN**: Document number (000-999, chronological)
- **CC**: Category code (2 letters)
  - DR = Documentation & Reference
  - OD = Operations & Deployment
  - AA = After Action & Review
- **ABCD**: Document type (4 letters)
  - INDEX = Index/catalog
  - GUID = Guide
  - REFF = Reference
  - AACR = After Action Report

---

## Categories

| Code | Category |
|------|----------|
| AA | After Action & Review |
| DR | Documentation & Reference |
| OD | Operations & Deployment |
| PP | Product & Planning |
| AT | Architecture & Technical |

*(See Document Filing System Standard v4.2 for complete list)*

---

## File Organization

This directory (`000-docs/`) is **flat** - no subdirectories allowed per v4.2 standard.

All documents (project docs and canonical standards) live at the root level:

```
000-docs/
├── 000-DR-INDEX-mobile-documentation.md
├── 077-OD-GUID-app-store-submission.md
├── 078-OD-REFF-mobile-setup-summary.md
├── 079-AA-AACR-mobile-app-conversion.md
└── README.md (this file)
```

---

## Migration Note

This project previously used `01-docs/` with a different naming convention. New documentation should be created in `000-docs/` following the v4.2 standard.

**Legacy docs** remain in `01-docs/` until migrated.

---

## Creating New Documents

When creating a new document:

1. Find the highest NNN number in `000-docs/`
2. Increment by 1
3. Choose appropriate CC (category) and ABCD (type) from the standard
4. Use kebab-case for description (1-4 words)
5. Place directly in `000-docs/` (no subdirectories)

Example: `080-PP-PLAN-mobile-marketing-strategy.md`

---

**Standard Version:** v4.2
**Last Updated:** 2025-12-20
