// El cumplimiento vive en el protocolo: una cuenta sin KYC no puede recibir BOBT, y ante un fraude el
// emisor congela y recupera los fondos (clawback).
import { cumplimiento } from './flujos.mjs';
import { registrar } from './lib.mjs';

const r = await cumplimiento();
registrar('5. Cumplimiento en el protocolo', [
  `Pago a una cuenta sin KYC: rechazado por la red (${r.rechazo ?? 'no se rechazó: revisar'})`,
  `Fraude detectado: el emisor congela la cuenta y recupera 10 BOBT en una transacción: ${r.enlace}`,
]);
