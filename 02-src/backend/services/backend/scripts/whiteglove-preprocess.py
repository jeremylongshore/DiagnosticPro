#!/usr/bin/env python3
"""Preprocess markdown for whiteglove-pdf rendering.

Strips emoji / pictographic glyphs that Latin Modern can't render. Targets:
  - BMP miscellaneous symbols U+2600-27BF
  - Supplementary plane pictographs U+1F300-1FAFF
  - Variation selector U+FE0F (often follows emoji)
  - Zero-width joiner U+200D (used in compound emoji)

Usage:
    python3 preprocess.py <input.md> <output.md>

Exit codes:
    0 on success, 1 on missing args, 2 on read/write failure.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# One regex covers every range we strip. Compiled once at import.
EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001FAFF"
    r"\U00002600-\U000027BF"
    r"\U0000FE0F"
    r"\U0000200D]"
)


def strip(text: str) -> str:
    """Remove emoji / pictographic glyphs from text."""
    return EMOJI_RE.sub("", text)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: preprocess.py <input.md> <output.md>", file=sys.stderr)
        return 1
    src, dst = Path(argv[1]), Path(argv[2])
    try:
        text = src.read_text(encoding="utf-8")
    except OSError as e:
        print(f"read failed: {src}: {e}", file=sys.stderr)
        return 2
    try:
        dst.write_text(strip(text), encoding="utf-8")
    except OSError as e:
        print(f"write failed: {dst}: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
