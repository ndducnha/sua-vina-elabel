#!/usr/bin/env node
/**
 * Copy the canonical products dataset (data/products.json) into both apps'
 * public/data folders so each Vite build bundles its own copy.
 *
 *   node scripts/sync-data.mjs
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../data/products.json');
const targets = [
  resolve(here, '../frontend/public/data/products.json'),
  resolve(here, '../landing/public/data/products.json'),
];

for (const dest of targets) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`✓ ${dest}`);
}
