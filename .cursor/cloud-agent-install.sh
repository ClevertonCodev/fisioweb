#!/usr/bin/env bash
# Idempotent install for Cursor Cloud Agent Builds (see .cursor/environment.json).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
    cp .env.example .env
fi

composer install --no-interaction --prefer-dist --optimize-autoloader
npm install
npm run build

php artisan key:generate --force --no-interaction

if ! grep -q '^JWT_SECRET=.\+' .env 2>/dev/null; then
    php artisan jwt:secret --force --no-interaction
fi

mkdir -p database
touch database/database.sqlite
php artisan migrate --force --no-interaction

./vendor/bin/phpunit
