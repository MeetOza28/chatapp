#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/.env"

if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
  echo "POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB must be set in .env" >&2
  exit 1
fi

BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="${BACKUP_DIR}/chatapp-${TIMESTAMP}.sql"

docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" chatapp_postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists --no-owner --no-privileges \
  > "${OUTPUT_FILE}"

echo "Backup written to ${OUTPUT_FILE}"