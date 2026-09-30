// API del catálogo interno: login/logout/sesión y entrega de páginas protegidas.
// Credenciales y secreto viven en variables de entorno de Netlify (nunca en el código):
//   CATALOG_USER, CATALOG_PASS, AUTH_SECRET
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COOKIE = 'lz_session';
const SESSION_SECONDS = 8 * 60 * 60;

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const sign = (payload) => crypto.createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('base64url');

function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${exp}.${sign(exp)}`;
}
function validToken(token) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}
function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? m[1] : null;
}
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
const cookieHeader = (value, maxAge) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

const pagesDir = () => path.join(process.cwd(), 'private', 'pages');

export default async (req) => {
  if (!process.env.AUTH_SECRET || !process.env.CATALOG_USER || !process.env.CATALOG_PASS) {
    return json({ error: 'Servidor sin configurar' }, 500);
  }
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, '');

  if (route === 'login' && req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch { /* cuerpo inválido */ }
    const ok = safeEqual(body.user ?? '', process.env.CATALOG_USER) &
               safeEqual(body.pass ?? '', process.env.CATALOG_PASS);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 1000)); // frena fuerza bruta
      return json({ error: 'Usuario o contraseña incorrectos' }, 401);
    }
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(makeToken(), SESSION_SECONDS) });
  }

  if (route === 'logout') {
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader('', 0) });
  }

  // Todo lo demás requiere sesión válida
  if (!validToken(getCookie(req, COOKIE))) return json({ error: 'No autorizado' }, 401);

  if (route === 'meta') {
    return json(JSON.parse(fs.readFileSync(path.join(pagesDir(), 'meta.json'), 'utf8')));
  }

  const m = route.match(/^page\/(\d{1,3})$/);
  if (m) {
    const file = path.join(pagesDir(), `p${m[1].padStart(3, '0')}.jpg`);
    if (!fs.existsSync(file)) return json({ error: 'No encontrada' }, 404);
    return new Response(fs.readFileSync(file), {
      headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' },
    });
  }

  return json({ error: 'No encontrado' }, 404);
};

export const config = { path: '/api/*' };
