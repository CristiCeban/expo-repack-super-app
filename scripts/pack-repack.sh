#!/bin/sh
# Rebuild and pack Re.Pack + the Expo integration from a local checkout of
# callstack/repack into ./tarballs, then reinstall.
# Usage: scripts/pack-repack.sh [path-to-repack-checkout]
set -eu
REPACK_DIR="${1:-$HOME/Developer/callstack/repack}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPACK_DIR"
echo "Packing from $(git rev-parse --short HEAD) ($(git branch --show-current))"
# build:js and build:ts race when run in parallel, so build @callstack/repack sequentially.
pnpm --filter @callstack/repack run build:js
pnpm --filter @callstack/repack run build:ts
pnpm turbo run build --only --force \
  --filter=@callstack/repack-dev-server \
  --filter=@callstack/repack-plugin-expo-modules \
  --filter=@callstack/repack-plugin-reanimated \
  --filter=@callstack/repack-expo

rm -f "$ROOT"/tarballs/*.tgz
for pkg in repack dev-server plugin-expo-modules plugin-reanimated repack-expo; do
  (cd "packages/$pkg" && pnpm pack --pack-destination "$ROOT/tarballs")
done

cd "$ROOT"
# Tarball contents change without a version bump, so force pnpm to re-read them.
pnpm install --force
echo "Done. Restart the dev servers (pnpm start) and re-run prebuild if the config plugin changed."
