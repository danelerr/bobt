// Demo web local de BOBT: `npm start` y abrir http://localhost:4321. Solo testnet.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import * as flujos from './flujos.mjs';

const PUERTO = Number(process.env.PORT ?? 4321);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const MARCA = ['bobt-moneda.svg', 'bobt-logo-compacto.svg', 'franja-tricolor.svg', 'bobt-moneda-64.png'];

const json = (res, codigo, datos) => {
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(datos));
};

async function cuerpo(req) {
  let texto = '';
  for await (const parte of req) texto += parte;
  return texto ? JSON.parse(texto) : {};
}

const monto = (valor, min, max) => {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`El monto debe estar entre ${min} y ${max}.`);
  return Math.round(n * 100) / 100;
};

const API = {
  'GET /api/estado': async () => ({ ...(await flujos.saldos()), transparencia: await flujos.transparencia() }),
  'GET /api/cotizar': async (_, url) => ({ bobt: await flujos.cotizar(monto(url.searchParams.get('usdc'), 1, 500)) }),
  'POST /api/deposito': async (b) => flujos.deposito(monto(b.monto, 1, 5000), b.referencia),
  'POST /api/remesa': async (b) => flujos.remesa(monto(b.usdc, 1, 500)),
  'POST /api/retiro': async (b) => flujos.retiro(monto(b.monto, 1, 5000)),
  'POST /api/cumplimiento': async () => flujos.cumplimiento(),
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ruta = API[`${req.method} ${url.pathname}`];
  try {
    if (ruta) return json(res, 200, await ruta(req.method === 'POST' ? await cuerpo(req) : {}, url));
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': TIPOS['.html'] });
      return res.end(await readFile(new URL('./web/index.html', import.meta.url)));
    }
    const archivo = url.pathname.replace('/marca/', '');
    if (url.pathname.startsWith('/marca/') && MARCA.includes(archivo)) {
      res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] });
      return res.end(await readFile(new URL(`../marca/${archivo}`, import.meta.url)));
    }
    json(res, 404, { error: 'No encontrado' });
  } catch (e) {
    json(res, 400, { error: e.message });
  }
}).listen(PUERTO, () => console.log(`Demo de BOBT en http://localhost:${PUERTO}`));
