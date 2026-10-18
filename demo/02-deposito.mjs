// María paga un QR de Bs 500 y recibe 500 BOBT.
import { deposito } from './flujos.mjs';
import { registrar, fmt } from './lib.mjs';

const r = await deposito(Number(process.argv[2] ?? 500));
registrar('2. Depósito por QR', [
  `María pagó un QR de Bs ${fmt(r.monto)} (referencia ${r.referencia}); el banco lo confirma (simulado)`,
  `El emisor acuña ${fmt(r.monto)} BOBT a María: ${r.enlace}`,
  `Saldo de María: ${fmt(r.saldo)} BOBT`,
]);
