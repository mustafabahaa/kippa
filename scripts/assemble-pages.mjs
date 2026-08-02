import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const landingOutput = resolve(root, 'frontend/landing/dist');
const docsOutput = resolve(root, 'docs/build');
const docsDestination = resolve(landingOutput, 'docs');

await rm(docsDestination, { recursive: true, force: true });
await mkdir(docsDestination, { recursive: true });
await cp(docsOutput, docsDestination, { recursive: true });

console.log(`GitHub Pages artifact assembled at ${landingOutput}`);
