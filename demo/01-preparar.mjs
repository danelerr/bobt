// Crea las cuentas, el activo BOBT con cumplimiento en el protocolo y el mercado BOBT/USDC.
import { Keypair, Operation, Asset, Memo, AuthRequiredFlag, AuthRevocableFlag, AuthClawbackEnabledFlag } from '@stellar/stellar-sdk';
import {
  server, USDC, COMPRA, VENTA, TIPO_CAMBIO, guardarEstado, bobt, par, enlace, fondear, enviar, saldo,
  registrar, iniciarResultados, bancoSimulado, fmt,
} from './lib.mjs';

const NOMBRES = {
  emisor: 'Emisor de BOBT (la entidad regulada)',
  formador: 'Formador de mercado BOBT/USDC',
  maria: 'María, comerciante en Cochabamba',
  ana: 'Ana, su hermana en Madrid',
};

const estado = { cuentas: {}, banco: { reservas: 0, movimientos: [] } };
for (const [nombre, descripcion] of Object.entries(NOMBRES)) {
  const kp = Keypair.random();
  estado.cuentas[nombre] = { descripcion, publica: kp.publicKey(), secreta: kp.secret() };
}
guardarEstado(estado);
iniciarResultados();

console.log('Fondeando cuentas con Friendbot...');
await Promise.all(Object.values(estado.cuentas).map((c) => fondear(c.publica)));

const emisor = par(estado, 'emisor');
const BOBT = bobt(estado);

// 1. Cumplimiento en el protocolo: solo cuentas autorizadas tienen BOBT, se puede congelar y recuperar.
const hashEmisor = await enviar(emisor, [
  Operation.setOptions({ setFlags: AuthRequiredFlag | AuthRevocableFlag | AuthClawbackEnabledFlag }),
]);

// 2. Trustlines: el formador y María aceptan BOBT (y USDC); el emisor los autoriza tras el KYC.
for (const nombre of ['formador', 'maria']) {
  await enviar(par(estado, nombre), [Operation.changeTrust({ asset: BOBT }), Operation.changeTrust({ asset: USDC })]);
}
const hashKyc = await enviar(
  emisor,
  ['formador', 'maria'].map((n) =>
    Operation.setTrustLineFlags({ trustor: estado.cuentas[n].publica, asset: BOBT, flags: { authorized: true } }),
  ),
  { memo: Memo.text('KYC aprobado') },
);
await enviar(par(estado, 'ana'), [Operation.changeTrust({ asset: USDC })]);

// 3. USDC de testnet: el formador y Ana cambian XLM por USDC en el DEX de la testnet.
async function comprarUsdc(nombre, xlm) {
  const kp = par(estado, nombre);
  const { records } = await server.strictSendPaths(Asset.native(), xlm, [USDC]).call();
  if (!records.length) throw new Error('No hay ruta XLM → USDC en la testnet ahora mismo.');
  const mejor = records.reduce((a, b) => (Number(b.destination_amount) > Number(a.destination_amount) ? b : a));
  await enviar(kp, [
    Operation.pathPaymentStrictSend({
      sendAsset: Asset.native(), sendAmount: xlm, destination: kp.publicKey(), destAsset: USDC,
      destMin: (Number(mejor.destination_amount) * 0.98).toFixed(7),
      path: mejor.path.map((p) => (p.asset_type === 'native' ? Asset.native() : new Asset(p.asset_code, p.asset_issuer))),
    }),
  ]);
  return saldo(kp.publicKey(), USDC);
}
const usdcFormador = await comprarUsdc('formador', '5000');
const usdcAna = await comprarUsdc('ana', '1500');

// 4. El formador deposita Bs en el banco y recibe BOBT 1:1 para tener inventario.
const inventario = 20000;
bancoSimulado.cobroQr(estado, inventario, 'FORMADOR-INVENTARIO');
const hashInventario = await enviar(
  emisor,
  [Operation.payment({ destination: estado.cuentas.formador.publica, asset: BOBT, amount: String(inventario) })],
  { memo: Memo.text('Acuñación inventario') },
);

// 5. Ofertas en el DEX de Stellar: vende BOBT por USDC y USDC por BOBT, con su diferencial.
const usdcEnOferta = Math.floor(Number(usdcFormador) * 0.9);
const hashMercado = await enviar(par(estado, 'formador'), [
  // Precio en USDC por BOBT: quien trae 1 USDC recibe COMPRA Bs.
  Operation.manageSellOffer({ selling: BOBT, buying: USDC, amount: String(inventario), price: { n: 100, d: Math.round(COMPRA * 100) } }),
  // Precio en BOBT por USDC: quien quiere 1 USDC entrega VENTA Bs.
  Operation.manageSellOffer({ selling: USDC, buying: BOBT, amount: String(usdcEnOferta), price: { n: Math.round(VENTA * 100), d: 100 } }),
]);
guardarEstado(estado);

registrar('1. Preparación', [
  `Activo BOBT: ${enlace.activo(estado)}`,
  `Emisor con autorización obligatoria, congelamiento y clawback: ${enlace.tx(hashEmisor)}`,
  `KYC aprobado (trustlines autorizadas): ${enlace.tx(hashKyc)}`,
  `Inventario del formador, ${fmt(inventario)} BOBT respaldados por ${fmt(inventario)} Bs: ${enlace.tx(hashInventario)}`,
  `Mercado BOBT/USDC (oficial ${TIPO_CAMBIO}; compra ${COMPRA}, venta ${VENTA}): ${enlace.tx(hashMercado)}`,
  `USDC de testnet: formador ${fmt(usdcFormador)}, Ana ${fmt(usdcAna)}`,
  ...Object.entries(estado.cuentas).map(([, c]) => `${c.descripcion}: ${enlace.cuenta(c.publica)}`),
]);
