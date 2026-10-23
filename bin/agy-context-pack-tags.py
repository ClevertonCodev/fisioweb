#!/usr/bin/env python3
"""Resolve skills do manifest a partir do texto da tarefa."""
import json
import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 4:
        print("Uso: agy-context-pack-tags.py <manifest.json> <task.md> <skills-root>", file=sys.stderr)
        return 2

    manifest_path, task_path, skills_root = sys.argv[1:4]
    manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    task_lower = Path(task_path).read_text(encoding="utf-8").lower()
    task_raw = Path(task_path).read_text(encoding="utf-8")

    tags = set(manifest.get("default_tags", []))
    for tag, words in manifest.get("keywords", {}).items():
        for word in words:
            if word.lower() in task_lower:
                tags.add(tag)
                break

    skills: list[str] = []
    seen: set[str] = set()
    for tag in sorted(tags):
        for name in manifest.get("tags", {}).get(tag, []):
            if name not in seen:
                seen.add(name)
                skills.append(name)

    match = re.search(r"\*\*Skills:\*\*\s*(.+)", task_raw, re.I)
    if match:
        for part in re.findall(r"`([^`]+)`", match.group(1)):
            part = part.strip()
            if part and part not in seen:
                seen.add(part)
                skills.append(part)

    root = Path(skills_root)
    valid = [s for s in skills if (root / s / "SKILL.md").is_file()]
    print("\n".join(valid))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
