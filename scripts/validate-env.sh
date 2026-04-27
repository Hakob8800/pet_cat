#!/usr/bin/env bash
# Validates that every key defined in .env.example exists with a non-empty value
# in the target env file.
#
# Usage:
#   bash scripts/validate-env.sh                     # checks .env.example vs .env
#   bash scripts/validate-env.sh .env.example .env   # explicit paths
#   bash scripts/validate-env.sh .env.example .env.example  # lint the example file itself
set -euo pipefail

EXAMPLE="${1:-.env.example}"
TARGET="${2:-.env}"

if [[ ! -f "$EXAMPLE" ]]; then
  echo "ERROR: example file '$EXAMPLE' not found." >&2
  exit 1
fi

if [[ ! -f "$TARGET" ]]; then
  echo "ERROR: env file '$TARGET' not found." >&2
  exit 1
fi

MISSING=()

while IFS= read -r line; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue   # skip comments
  [[ -z "${line//[[:space:]]/}" ]] && continue   # skip blank lines
  KEY="${line%%=*}"
  KEY="${KEY//[[:space:]]/}"
  [[ -z "$KEY" ]] && continue
  if ! grep -qE "^${KEY}=.+" "$TARGET"; then
    MISSING+=("$KEY")
  fi
done < "$EXAMPLE"

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: Missing or empty variables in '$TARGET':" >&2
  for key in "${MISSING[@]}"; do
    echo "  - $key" >&2
  done
  exit 1
fi

echo "OK: All required environment variables are present in '$TARGET'."
