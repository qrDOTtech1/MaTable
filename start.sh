#!/bin/sh
set -e

if [ "$SERVICE" = "web" ]; then
  echo "▶ Starting @atable/web"
  exec npm run start --workspace=@atable/web
else
  echo "▶ Starting @atable/api (DB push + seed + server)"
  npm run deploy --workspace=@atable/db
  npm run seed --workspace=@atable/db || echo "seed failed (non-fatal)"
  exec node apps/api/dist/server.js
fi
