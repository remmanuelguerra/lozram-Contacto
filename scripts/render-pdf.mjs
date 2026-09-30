// Convierte el PDF del catálogo en imágenes JPG (una por página) dentro de private/pages.
// Uso: node scripts/render-pdf.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { createRequire } from 'node:module';
import * as napi from '@napi-rs/canvas';

// Polyfills para Node < 20.16 (pdf.js los necesita)
const req = createRequire(import.meta.url);
if (!process.getBuiltinModule) process.getBuiltinModule = (n) => req(n);
globalThis.DOMMatrix ??= napi.DOMMatrix;
globalThis.ImageData ??= napi.ImageData;
globalThis.Path2D ??= napi.Path2D;

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const pdfPath = process.argv[2] || fs.readdirSync('.').find(f => f.toLowerCase().endsWith('.pdf'));
const outDir = 'private/pages';
const TARGET_WIDTH = 1500; // px por página: buen detalle y cada imagen queda muy por debajo del límite de 6 MB de las funciones

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const data = new Uint8Array(fs.readFileSync(pdfPath));
const pdf = await pdfjs.getDocument({
  data,
  standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts') + path.sep,
  isEvalSupported: false,
}).promise;

let w = 0, h = 0;
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const file = path.join(outDir, `p${String(i).padStart(3, '0')}.jpg`);
  fs.writeFileSync(file, canvas.toBuffer('image/jpeg', 82));
  w = canvas.width; h = canvas.height;
  console.log(`página ${i}/${pdf.numPages}`, (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
}
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ pages: pdf.numPages, width: w, height: h }));
