// Servidor local de prueba: sirve public/ y enruta /api/* a la función de Netlify.
// Uso: npm run dev  ->  http://localhost:8888
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

process.env.CATALOG_USER ??= 'admin';
process.env.CATALOG_PASS ??= 'prueba123';
process.env.AUTH_SECRET ??= 'secreto-solo-para-pruebas-locales-0123456789';

const { default: api } = await import('../netlify/functions/api.mjs');
const root = path.resolve('public');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8888');

  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    // Las cookies "Secure" no se guardan en http://localhost en todos los navegadores; Chrome/Firefox sí lo permiten.
    const r = await api(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }

  let file = path.join(root, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('404');
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(8888, () => {
  console.log('Listo: http://localhost:8888');
  console.log(`Usuario: ${process.env.CATALOG_USER}  Contraseña: ${process.env.CATALOG_PASS}`);
});
