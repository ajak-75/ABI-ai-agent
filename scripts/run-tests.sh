#!/usr/bin/env bash
# PHASE 1 offline test suite.
# Requires: node (22+), python3 (sqlite3 module). No Android SDK, no device.
set -euo pipefail

cd "$(dirname "$0")/.."
SCRATCH=".scratch"
mkdir -p "$SCRATCH"

echo "== 1/4 TypeScript strict type check =="
npx tsc --noEmit
echo "   ok"

echo "== 2/4 Compile pure modules for offline tests =="
npx tsc src/memory/schema.ts src/engine/placeholderReply.ts src/security/approvals.ts \
  --ignoreConfig --outDir "$SCRATCH" --module commonjs --target es2020 \
  --skipLibCheck --moduleResolution node >/dev/null 2>&1 || true

node -e "
const { MIGRATION_V1, SCHEMA_VERSION } = require('$PWD/$SCRATCH/schema.js');
require('fs').writeFileSync('$SCRATCH/ddl.json', JSON.stringify({ v: SCHEMA_VERSION, s: MIGRATION_V1 }));
console.log('   ddl statements:', MIGRATION_V1.length, '| schema version:', SCHEMA_VERSION);
"

echo "== 3/4 SQLite schema + repository query validation =="
python3 scripts/validate_sql.py

echo "== 4/4 Pure logic tests (routing reply, approval policy) =="
node scripts/logic_test.js

echo
echo "ALL TESTS PASSED"
