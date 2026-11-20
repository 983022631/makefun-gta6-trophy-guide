// Leonida Trophy Guide — hand-in program (Node 22, standard library only).
// The guide itself is plain static files under app/: index.html opens it, the
// modules under app/js/ run it, and app/data/trophies.json holds the 55 trophies
// with their official names, descriptions, grades and our own guides. Nothing
// is built and nothing is fetched at run time, so handing the entry in is just
// copying: app/ and screenshots/ go to the output directory, and the dossier
// the judge reads is written there with the vendored make.fun library.
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it — the
// scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: the dossier text cap shapes the bytes, and the other
// limits refuse an entry the scorer would refuse anyway (at most 4 screenshots,
// each at most 256 KiB; app/ at most 993 files and directories and 48 MiB —
// app/ shares /output's own 1,000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
