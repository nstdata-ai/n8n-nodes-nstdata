#!/bin/sh
# Run as the OS user that owns the n8n data directory.
set -eu
if [ "$#" -ne 2 ]; then
  echo 'Usage: sh install-local.sh PACKAGE.tgz N8N_DATA_DIRECTORY' >&2
  exit 2
fi
archive=$1
data_dir=$2
name=n8n-nodes-nstdata
if [ ! -f "$archive" ] || [ ! -d "$data_dir" ]; then
  echo 'Check the archive path and the existing n8n data directory.' >&2
  exit 1
fi
install_dir="$data_dir/nodes"
target="$install_dir/node_modules/$name"
mkdir -p "$install_dir/node_modules"
lock="$install_dir/.nstdata-install-lock"
mkdir "$lock" || { echo 'Another installation may be running. Check before retrying.' >&2; exit 1; }
trap 'rmdir "$lock"' EXIT
stage=$(mktemp -d "$install_dir/.nstdata-stage.XXXXXX")
trap 'rm -rf "$stage"; rmdir "$lock"' EXIT
tar -xzf "$archive" -C "$stage"
version=$(node - "$stage/package" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const p = require(path.resolve(root, 'package.json'));
if (p.name !== 'n8n-nodes-nstdata' || !p.n8n?.nodes?.length || !p.n8n?.credentials?.length) {
  throw Error('Expected the Nstdata Crawl community node package.');
}
for (const entry of [...p.n8n.nodes, ...p.n8n.credentials]) {
  if (!fs.statSync(path.join(root, entry)).isFile()) throw Error('Missing ' + entry);
}
console.log(p.version);
JS
)
if [ -e "$target" ] || [ -L "$target" ]; then
  backups="$install_dir/.nstdata-backups"
  mkdir -p "$backups"
  backup=$(mktemp -d "$backups/package.XXXXXX")
  mv "$target" "$backup/$name"
  if ! mv "$stage/package" "$target"; then
    mv "$backup/$name" "$target"
    exit 1
  fi
  echo "Previous package: $backup/$name"
else
  mv "$stage/package" "$target"
fi
echo "Installed $name $version in $target"
