#!/usr/bin/env python3
"""Print the conversation text of Claude Code sessions active in a local date range.

Usage: sessions.py FROM [TO]
  FROM, TO: local dates as YYYY-MM-DD, TO inclusive (defaults to FROM).

One "=== <project> · <session title> · <session id> ===" block per session, then one
line per message: "[MM-DD HH:MM] user|assistant: text". Thinking, tool calls, tool results,
subagent traffic, system reminders, and slash-command boilerplate are left out.
Reads $CLAUDE_CONFIG_DIR/projects, falling back to ~/.claude/projects.
"""
import json
import os
import re
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path

NOISE = re.compile(r"<(system-reminder|local-command-caveat|local-command-stdout)>.*?</\1>", re.S)


def local_bounds(first, last):
    start = datetime.combine(date.fromisoformat(first), time()).astimezone()
    end = datetime.combine(date.fromisoformat(last) + timedelta(days=1), time()).astimezone()
    return start, end


def text_of(content):
    if isinstance(content, str):
        parts = [content]
    else:
        parts = [p.get("text", "") for p in content or [] if isinstance(p, dict) and p.get("type") == "text"]
    return NOISE.sub("", "\n".join(parts)).strip()


def session_block(path, start, end):
    title, project, lines = None, None, []
    with path.open(encoding="utf-8", errors="replace") as f:
        for raw in f:
            try:
                d = json.loads(raw)
            except ValueError:
                continue
            if d.get("type") == "ai-title":
                title = d.get("aiTitle") or title
            if d.get("type") not in ("user", "assistant") or d.get("isSidechain") or d.get("isMeta"):
                continue
            stamp = d.get("timestamp")
            if not stamp:
                continue
            at = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            if not start <= at < end:
                continue
            text = text_of((d.get("message") or {}).get("content"))
            if text:
                project = project or (Path(d["cwd"]).name if d.get("cwd") else None)
                lines.append(f"[{at.astimezone():%m-%d %H:%M}] {d['type']}: {text}")
    if not lines:
        return None
    head = f"=== {project or path.parent.name} · {title or 'untitled'} · {path.stem} ==="
    return "\n".join([head, *lines])


def main():
    if not 2 <= len(sys.argv) <= 3:
        sys.exit(__doc__)
    start, end = local_bounds(sys.argv[1], sys.argv[-1])
    root = Path(os.environ.get("CLAUDE_CONFIG_DIR") or Path.home() / ".claude") / "projects"
    files = sorted(root.glob("*/*.jsonl"), key=lambda p: p.stat().st_mtime)
    blocks = [b for p in files if p.stat().st_mtime >= start.timestamp() for b in [session_block(p, start, end)] if b]
    print("\n\n".join(blocks) if blocks else f"No session activity between {sys.argv[1]} and {sys.argv[-1]}.")


if __name__ == "__main__":
    main()
