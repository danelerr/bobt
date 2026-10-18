// Ana manda 50 USDC desde Madrid y a María le llegan BOBT en una sola operación (path payment).
import { remesa } from './flujos.mjs';
import { registrar, fmt } from './lib.mjs';

const r = await remesa(process.argv[2] ?? '50');
registrar('3. Remesa USDC → BOBT', [
  `Ana envía ${r.usdc} USDC desde Madrid; María recibe ${fmt(r.recibido)} BOBT en ~5 segundos: ${r.enlace}`,
  `Una sola operación: el cambio USDC → BOBT ocurre dentro de Stellar, sin intermediario ni P2P`,
]);
