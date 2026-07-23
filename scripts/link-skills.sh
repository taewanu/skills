#!/usr/bin/env bash
set -euo pipefail

# Symlinks every skill in this repo into the local harness skill directories:
#   ~/.claude/skills  — Claude Code
#   ~/.agents/skills  — Codex and other Agent Skills-compatible harnesses
# Symlinks rather than copies, so editing a skill here is live everywhere at
# once and `git pull` is the whole update story. Re-run after adding,
# removing, or renaming a skill. Skills under deprecated/ are not linked.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DESTS=("$HOME/.claude/skills" "$HOME/.agents/skills")

names=()
srcs=()
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  names+=("$(basename "$src")")
  srcs+=("$src")
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*' -print0)

for DEST in "${DESTS[@]}"; do
  # A $DEST that is itself a symlink into this repo would make us write the
  # per-skill links back into the repo's own skills/ tree. Bail instead.
  if [ -L "$DEST" ]; then
    resolved="$(readlink -f "$DEST" 2>/dev/null || python3 -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' "$DEST")"
    case "$resolved" in
      "$REPO"|"$REPO"/*)
        echo "error: $DEST is a symlink into this repo ($resolved)." >&2
        echo "Remove it (rm \"$DEST\") and re-run; the script recreates it as a real dir." >&2
        exit 1
        ;;
    esac
  fi

  mkdir -p "$DEST"

  for i in "${!names[@]}"; do
    target="$DEST/${names[$i]}"
    if [ -e "$target" ] && [ ! -L "$target" ]; then
      rm -rf "$target"
    fi
    ln -sfn "${srcs[$i]}" "$target"
    echo "linked ${names[$i]} -> ${srcs[$i]} ($DEST)"
  done
done
