// Piezas comunes de la demo de BOBT. Solo testnet.
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { Horizon, Keypair, Networks, TransactionBuilder, Asset, BASE_FEE } from '@stellar/stellar-sdk';

export const server = new Horizon.Server('https://horizon-testnet.stellar.org');
export const NETWORK = Networks.TESTNET;

// Tipo de cambio oficial del BCB del 15-10-2026 (Bs por dólar). Actualizar el día del video.
export const TIPO_CAMBIO = 11.68;
// El formador de mercado compra y vende alrededor del tipo oficial (su ganancia es la diferencia).
export const COMPRA = 11.62; // Bs que entrega por cada USDC
export const VENTA = 11.74; // Bs que pide por cada USDC

// USDC de Circle en la testnet de Stellar.
export const USDC = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');

const ESTADO = new URL('./.estado.json', import.meta.url);
const RESULTADOS = new URL('./RESULTADOS.md', import.meta.url);

export function leerEstado() {
  if (!existsSync(ESTADO)) throw new Error('Falta .estado.json: correr primero `npm run preparar`.');
  return JSON.parse(readFileSync(ESTADO, 'utf8'));
}

export function guardarEstado(estado) {
  writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
}

export const bobt = (estado) => new Asset('BOBT', estado.cuentas.emisor.publica);
export const par = (estado, nombre) => Keypair.fromSecret(estado.cuentas[nombre].secreta);

export const enlace = {
  tx: (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
  cuenta: (id) => `https://stellar.expert/explorer/testnet/account/${id}`,
  activo: (estado) => `https://stellar.expert/explorer/testnet/asset/BOBT-${estado.cuentas.emisor.publica}`,
};

export async function fondear(publica) {
  const r = await fetch(`https://friendbot.stellar.org?addr=${publica}`);
  if (!r.ok) throw new Error(`Friendbot falló para ${publica}: ${r.status}`);
}

/** Arma, firma y envía una transacción. Devuelve el hash. */
export async function enviar(fuente, operaciones, { memo, firmantes = [fuente] } = {}) {
  const cuenta = await server.loadAccount(fuente.publicKey());
  const tb = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: NETWORK }).setTimeout(60);
  for (const op of operaciones) tb.addOperation(op);
  if (memo) tb.addMemo(memo);
  const tx = tb.build();
  for (const f of firmantes) tx.sign(f);
  try {
    return (await server.submitTransaction(tx)).hash;
  } catch (e) {
    const codigos = e?.response?.data?.extras?.result_codes;
    throw new Error(`Transacción rechazada: ${JSON.stringify(codigos ?? e.message)}`);
  }
}

/** Saldo de un activo en una cuenta (0 si no tiene trustline). */
export async function saldo(publica, activo) {
  const { balances } = await server.loadAccount(publica);
  const b = balances.find((x) =>
    activo.isNative() ? x.asset_type === 'native' : x.asset_code === activo.code && x.asset_issuer === activo.issuer,
  );
  return b ? b.balance : '0';
}

/** Registra un paso en RESULTADOS.md (para pegar los enlaces en la entrega). */
export function registrar(titulo, lineas) {
  const texto = `\n## ${titulo}\n\n${lineas.map((l) => `- ${l}`).join('\n')}\n`;
  appendFileSync(RESULTADOS, texto);
  console.log(`\n${titulo}\n${lineas.map((l) => `  ${l}`).join('\n')}`);
}

export function iniciarResultados() {
  writeFileSync(RESULTADOS, `# Demo de BOBT en la testnet de Stellar\n\nGenerado el ${new Date().toLocaleString('es-BO')}. El banco está simulado; todo lo demás es real en la testnet.\n`);
}

// El banco boliviano detrás de una interfaz (ver DEMO.md). En la demo, un registro local de las
// reservas en Bs; después, una implementación por proveedor real (BNB, BCP, OpenBCB...).
export const bancoSimulado = {
  reservas: (estado) => estado.banco.reservas,
  /** El QR se pagó: entran Bs a la cuenta de reservas. */
  cobroQr(estado, monto, referencia) {
    estado.banco.reservas += monto;
    estado.banco.movimientos.push({ tipo: 'cobro QR', monto, referencia, fecha: new Date().toISOString() });
  },
  /** Se paga a una cuenta bancaria: salen Bs de las reservas. */
  pago(estado, monto, referencia) {
    estado.banco.reservas -= monto;
    estado.banco.movimientos.push({ tipo: 'pago', monto, referencia, fecha: new Date().toISOString() });
  },
};

export const fmt = (n) => Number(n).toLocaleString('es-BO', { maximumFractionDigits: 2 });
