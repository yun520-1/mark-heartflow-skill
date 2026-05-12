#!/usr/bin/env python3
import sys
import fitz
try:
    doc = fitz.open(sys.argv[1])
    texts = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    print("".join(texts), end="")
except Exception as e:
    print("", end="")
