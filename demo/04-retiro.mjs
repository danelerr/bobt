// María devuelve BOBT al emisor (se destruyen) y recibe Bs en su cuenta bancaria.
import { retiro } from './flujos.mjs';
import { registrar, fmt } from './lib.mjs';

const r = await retiro(Number(process.argv[2] ?? 300));
registrar('4. Retiro a bolivianos', [
  `María devuelve ${fmt(r.monto)} BOBT al emisor y se destruyen: ${r.enlace}`,
  `El banco le paga Bs ${fmt(r.monto)} en su cuenta (simulado, referencia ${r.referencia})`,
  `Saldo de María: ${fmt(r.saldo)} BOBT`,
]);
