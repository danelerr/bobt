// Los flujos de BOBT como funciones: los usan los scripts de la terminal y el servidor de la demo web.
import { Keypair, Operation, Memo } from '@stellar/stellar-sdk';
import { server, USDC, leerEstado, guardarEstado, bobt, par, enlace, fondear, enviar, saldo, bancoSimulado } from './lib.mjs';

const ref = (prefijo) => `${prefijo}-${Date.now().toString(36).toUpperCase()}`;

/** María pagó un QR por `monto` Bs: el emisor acuña la misma cantidad de BOBT. */
export async function deposito(monto, referencia = ref('QR')) {
  const estado = leerEstado();
  // En producción esto lo dispara el webhook del banco cuando el QR se paga.
  bancoSimulado.cobroQr(estado, monto, referencia);
  const hash = await enviar(
    par(estado, 'emisor'),
    [Operation.payment({ destination: estado.cuentas.maria.publica, asset: bobt(estado), amount: String(monto) })],
    { memo: Memo.text(referencia) },
  );
  guardarEstado(estado);
  return { monto, referencia, hash, enlace: enlace.tx(hash), saldo: await saldo(estado.cuentas.maria.publica, bobt(estado)) };
}

/** Cuántos BOBT recibiría María por `usdc` USDC, según el mercado de Stellar. */
export async function cotizar(usdc) {
  const estado = leerEstado();
  const { records } = await server.strictSendPaths(USDC, String(usdc), [bobt(estado)]).call();
  if (!records.length) throw new Error('No hay ruta USDC → BOBT: correr `npm run preparar`.');
  return Number(records[0].destination_amount);
}

/** Ana manda `usdc` USDC desde Madrid y a María le llegan BOBT en una sola operación (path payment). */
export async function remesa(usdc) {
  const estado = leerEstado();
  const BOBT = bobt(estado);
  const cotizacion = await cotizar(usdc);
  const antes = Number(await saldo(estado.cuentas.maria.publica, BOBT));
  const hash = await enviar(
    par(estado, 'ana'),
    [
      Operation.pathPaymentStrictSend({
        sendAsset: USDC, sendAmount: String(usdc), destination: estado.cuentas.maria.publica, destAsset: BOBT,
        destMin: (cotizacion * 0.995).toFixed(7), path: [],
      }),
    ],
    { memo: Memo.text('Para mama') },
  );
  const recibido = Number(await saldo(estado.cuentas.maria.publica, BOBT)) - antes;
  return { usdc: Number(usdc), recibido, hash, enlace: enlace.tx(hash) };
}

/** María devuelve `monto` BOBT al emisor (se destruyen) y el banco le paga Bs. */
export async function retiro(monto) {
  const estado = leerEstado();
  const referencia = ref('RETIRO');
  // Pagar al emisor es destruir: esos BOBT dejan de existir.
  const hash = await enviar(
    par(estado, 'maria'),
    [Operation.payment({ destination: estado.cuentas.emisor.publica, asset: bobt(estado), amount: String(monto) })],
    { memo: Memo.text(referencia) },
  );
  // En producción, el anchor ve el pago y ordena la transferencia (SEP-24 o SEP-6).
  bancoSimulado.pago(estado, monto, referencia);
  guardarEstado(estado);
  return { monto, referencia, hash, enlace: enlace.tx(hash), saldo: await saldo(estado.cuentas.maria.publica, bobt(estado)) };
}

/** Una cuenta sin KYC no puede recibir BOBT; ante un fraude, el emisor congela y recupera. */
export async function cumplimiento() {
  const estado = leerEstado();
  const BOBT = bobt(estado);
  const emisor = par(estado, 'emisor');
  const cuenta = Keypair.random();
  await fondear(cuenta.publicKey());
  await enviar(cuenta, [Operation.changeTrust({ asset: BOBT })]);

  let rechazo = null;
  try {
    await enviar(par(estado, 'maria'), [Operation.payment({ destination: cuenta.publicKey(), asset: BOBT, amount: '10' })]);
  } catch (e) {
    rechazo = e.message;
  }

  await enviar(emisor, [Operation.setTrustLineFlags({ trustor: cuenta.publicKey(), asset: BOBT, flags: { authorized: true } })]);
  await enviar(par(estado, 'maria'), [Operation.payment({ destination: cuenta.publicKey(), asset: BOBT, amount: '10' })]);
  const hash = await enviar(
    emisor,
    [
      Operation.setTrustLineFlags({ trustor: cuenta.publicKey(), asset: BOBT, flags: { authorized: false } }),
      Operation.clawback({ asset: BOBT, from: cuenta.publicKey(), amount: '10' }),
    ],
    { memo: Memo.text('Orden UIF (simulada)') },
  );
  // Los 10 Bs de respaldo se devuelven a la víctima por el banco.
  bancoSimulado.pago(estado, 10, 'DEVOLUCION-FRAUDE');
  guardarEstado(estado);
  return { rechazo, hash, enlace: enlace.tx(hash), cuenta: enlace.cuenta(cuenta.publicKey()) };
}

/** Lo emitido en la cadena contra los Bs en el banco. */
export async function transparencia() {
  const estado = leerEstado();
  const BOBT = bobt(estado);
  const { records } = await server.assets().forCode(BOBT.code).forIssuer(BOBT.issuer).call();
  const a = records[0];
  const emitido = a
    ? [
        a.balances.authorized, a.balances.authorized_to_maintain_liabilities, a.balances.unauthorized,
        a.claimable_balances_amount, a.liquidity_pools_amount, a.contracts_amount,
      ].reduce((s, x) => s + Number(x ?? 0), 0)
    : 0;
  const reservas = bancoSimulado.reservas(estado);
  return { emitido, reservas, respaldo: emitido ? reservas / emitido : 1, enlace: enlace.activo(estado) };
}

/** Saldos de María y Ana, para la pantalla. */
export async function saldos() {
  const estado = leerEstado();
  const BOBT = bobt(estado);
  return {
    maria: { bobt: Number(await saldo(estado.cuentas.maria.publica, BOBT)), enlace: enlace.cuenta(estado.cuentas.maria.publica) },
    ana: { usdc: Number(await saldo(estado.cuentas.ana.publica, USDC)), enlace: enlace.cuenta(estado.cuentas.ana.publica) },
    activo: enlace.activo(estado),
    emisor: estado.cuentas.emisor.publica,
  };
}
