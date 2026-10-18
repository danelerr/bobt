// Prueba de reservas: lo emitido en la cadena contra los Bs en el banco.
import { transparencia } from './flujos.mjs';
import { registrar, fmt } from './lib.mjs';

const r = await transparencia();
registrar('6. Transparencia', [
  `BOBT en circulación (leído de la cadena): ${fmt(r.emitido)}`,
  `Bs en la cuenta de reservas (banco simulado): ${fmt(r.reservas)}`,
  `Respaldo: ${fmt(r.respaldo * 100)} %`,
  `Cualquiera puede verificar lo emitido: ${r.enlace}`,
]);
