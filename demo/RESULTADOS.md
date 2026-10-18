# Demo de BOBT en la testnet de Stellar

Generado el 18/10/2026, 11:10:20 a. m.. El banco está simulado; todo lo demás es real en la testnet.

## 1. Preparación

- Activo BOBT: https://stellar.expert/explorer/testnet/asset/BOBT-GATKWGAZCW4O63DJ6UB7YI3K3LOW4FFJ2LMMDIOIKZQV5JOC4NMFRIKH
- Emisor con autorización obligatoria, congelamiento y clawback: https://stellar.expert/explorer/testnet/tx/4857326c0832cdcb476364658d8019d0d7a44584ebe801aa432236fd6549047c
- KYC aprobado (trustlines autorizadas): https://stellar.expert/explorer/testnet/tx/a199bf305db2e1dd3f3f7afc8679c72c1dd1701f57884c214d554cf1a23ff047
- Inventario del formador, 20.000 BOBT respaldados por 20.000 Bs: https://stellar.expert/explorer/testnet/tx/a67adf6ebcf87a29bcae3ecc6e08de32b0c9533a907352286a7cd45e5f51ca46
- Mercado BOBT/USDC (oficial 11.68; compra 11.62, venta 11.74): https://stellar.expert/explorer/testnet/tx/8e57eaa27e9925fa7e9baea96b7c51a9e2bd79b7441820cde6dc455972266e7f
- USDC de testnet: formador 4.427,59, Ana 1.328,17
- Emisor de BOBT (la entidad regulada): https://stellar.expert/explorer/testnet/account/GATKWGAZCW4O63DJ6UB7YI3K3LOW4FFJ2LMMDIOIKZQV5JOC4NMFRIKH
- Formador de mercado BOBT/USDC: https://stellar.expert/explorer/testnet/account/GAJTFWFKEZHVGX44RTRKAC3GFYNUFBEBNMJIB3MSEYPB7KTNEM7BR4EQ
- María, comerciante en Cochabamba: https://stellar.expert/explorer/testnet/account/GDUCLYYQTPTQZWFHLF7ILQRQYIV7TO537QK2XX6IC5Y6RKSNMJUT5HHW
- Ana, su hermana en Madrid: https://stellar.expert/explorer/testnet/account/GBR7M63TJ6WQIFF7PSTNQFJ5OTAAUSSKRM537A7JWUBA4KSM7E6BWI77

## 2. Depósito por QR

- María pagó un QR de Bs 500 (referencia QR-MVDYQRC0); el banco lo confirma (simulado)
- El emisor acuña 500 BOBT a María: https://stellar.expert/explorer/testnet/tx/249d7012db4b652fbfde8dedbd3546fa3971dd1ecbae6b8c3b896756ae94dd02
- Saldo de María: 500 BOBT

## 3. Remesa USDC → BOBT

- Ana envía 50 USDC desde Madrid; María recibe 581 BOBT en ~5 segundos: https://stellar.expert/explorer/testnet/tx/f5611b1131c34edfb83bd4122a903003c5fb761026fe3ddcc34271638a15b912
- Una sola operación: el cambio USDC → BOBT ocurre dentro de Stellar, sin intermediario ni P2P

## 4. Retiro a bolivianos

- María devuelve 300 BOBT al emisor y se destruyen: https://stellar.expert/explorer/testnet/tx/05363883e3669c6ab17212f63937c493da782cae794cdc7317ce02edda5aa66a
- El banco le paga Bs 300 en su cuenta (simulado, referencia RETIRO-MVDYQZ3L)
- Saldo de María: 781 BOBT

## 5. Cumplimiento en el protocolo

- Pago a una cuenta sin KYC: rechazado por la red (Transacción rechazada: {"transaction":"tx_failed","operations":["op_not_authorized"]})
- Fraude detectado: el emisor congela la cuenta y recupera 10 BOBT en una transacción: https://stellar.expert/explorer/testnet/tx/11d3d7599059d6fea8e9728dab14bf8f06e0bc510d3cbd2714cb457ceffe0882

## 6. Transparencia

- BOBT en circulación (leído de la cadena): 20.190
- Bs en la cuenta de reservas (banco simulado): 20.190
- Respaldo: 100 %
- Cualquiera puede verificar lo emitido: https://stellar.expert/explorer/testnet/asset/BOBT-GATKWGAZCW4O63DJ6UB7YI3K3LOW4FFJ2LMMDIOIKZQV5JOC4NMFRIKH
