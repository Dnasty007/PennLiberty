#!/usr/bin/env bash
# One-time: link Penn Liberty rentals skill into Hermes (run inside WSL)
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_SRC="$PROJECT_DIR/hermes-skills/penn-liberty-rentals"
SKILL_DEST="$HOME/.hermes/skills/penn-liberty-rentals"

mkdir -p "$HOME/.hermes/skills"
ln -sfn "$SKILL_SRC" "$SKILL_DEST"

if command -v hermes >/dev/null 2>&1; then
  hermes config set "skills.config.penn-liberty-rentals.project_path" "$PROJECT_DIR" || true
  echo "Hermes config updated: project_path=$PROJECT_DIR"
else
  echo "Note: 'hermes' not in PATH — install Hermes first, then run:"
  echo "  hermes config set skills.config.penn-liberty-rentals.project_path \"$PROJECT_DIR\""
fi

echo "Skill linked: $SKILL_DEST"
echo "Next: see SETUP-HERMES-TELEGRAM.md (Telegram bot + hermes gateway)"
