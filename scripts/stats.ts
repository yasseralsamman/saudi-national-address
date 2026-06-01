// SPDX-License-Identifier: MIT
//
// Prints counts and a file-size table for the generated data/dist artifacts.
// Run after a build: `pnpm run stats`.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR } from './lib/load.js';

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function count(file: string): number {
  return (JSON.parse(readFileSync(join(DIST_DIR, file), 'utf8')) as unknown[]).length;
}

function main(): void {
  if (!existsSync(DIST_DIR)) {
    console.error(`No dist directory at ${DIST_DIR}. Run \`pnpm run build\` first.`);
    process.exit(1);
  }

  console.log('Counts:');
  console.log(`  regions:   ${count('regions.lite.json')}`);
  console.log(`  cities:    ${count('cities.lite.json')}`);
  console.log(`  districts: ${count('districts.lite.json')}`);
  console.log('');

  const files = readdirSync(DIST_DIR)
    .filter((f) => !f.endsWith('.sqlite'))
    .sort();
  const width = Math.max(...files.map((f) => f.length));
  console.log('Artifacts:');
  for (const f of files) {
    const size = humanSize(statSync(join(DIST_DIR, f)).size);
    console.log(`  ${f.padEnd(width)}  ${size.padStart(10)}`);
  }
}

main();
