#!/usr/bin/env python3
"""Interpreta review.json do portão agy-verify."""
import json
import sys
from pathlib import Path

BLOCKING = {"critical", "high", "medium"}


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: agy-review-check.py <review.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"FALHOU: {path} não existe", file=sys.stderr)
        return 2

    data = json.loads(path.read_text(encoding="utf-8"))
    findings = data.get("findings", [])
    blocking = [f for f in findings if str(f.get("severity", "")).lower() in BLOCKING]

    if data.get("verdict") == "pass" and not blocking:
        print("PASS: nenhum achado critical/high/medium")
        return 0

    if not blocking and data.get("verdict") == "fail":
        print("FAIL: verdict fail sem findings (ajuste review.json)")
        return 1

    if blocking:
        print(f"FAIL: {len(blocking)} achado(s) critical/high/medium")
        for item in blocking:
            sev = item.get("severity", "?")
            title = item.get("title", item.get("summary", "sem título"))
            print(f"  - [{sev}] {title}")
        return 1

    print("PASS: nenhum achado critical/high/medium")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
