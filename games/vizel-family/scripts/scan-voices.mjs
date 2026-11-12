#!/usr/bin/env node
/**
 * Scans public/audio/voices/<speaker>/*.mp3|ogg|wav|m4a and writes public/audio/voices/manifest.json.
 * The game only plays recordings listed in the manifest — run this after adding family recordings.
 * Nothing is uploaded anywhere; files stay local in the project.
 */
import { readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = new URL('../public/audio/voices/', import.meta.url).pathname;
const speakers = ['father', 'mother', 'avigail', 'daniel', 'yedidya', 'esti'];
const files = [];
for (const s of speakers) {
  const dir = join(root, s);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (/\.(mp3|ogg|wav|m4a)$/i.test(f) && statSync(join(dir, f)).isFile()) files.push(`${s}/${f}`);
  }
}
files.sort();
writeFileSync(join(root, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
console.log(`manifest.json: ${files.length} recording(s)`);
for (const f of files) console.log('  ' + f);
