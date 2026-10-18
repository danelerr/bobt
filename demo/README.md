# Demo de BOBT en la testnet de Stellar

BOBT es el boliviano digital en Stellar: 1 BOBT = 1 Bs, respaldado 1:1. Esta demo muestra los cuatro flujos con
transacciones reales en la testnet. El banco y las reservas están simulados.

```sh
npm install
npm run demo     # crea cuentas, el activo y el mercado, y corre todos los flujos
npm start        # demo web en http://localhost:4321
```

| Paso | Script | Qué pasa en Stellar |
|---|---|---|
| Preparar | `npm run preparar` | Emisor con `AUTH_REQUIRED`, `AUTH_REVOCABLE` y `AUTH_CLAWBACK_ENABLED`; trustlines autorizadas (KYC); ofertas BOBT/USDC en el DEX |
| Depositar | `npm run deposito -- 500` | El emisor acuña BOBT contra un cobro QR (simulado) |
| Remesa | `npm run remesa -- 50` | Path payment: se envía USDC y llega BOBT en una operación |
| Retirar | `npm run retiro -- 300` | Los BOBT vuelven al emisor y se destruyen; el banco paga Bs (simulado) |
| Cumplimiento | `npm run cumplimiento` | Un pago a una cuenta sin KYC es rechazado; congelamiento y clawback |
| Transparencia | `npm run transparencia` | Lo emitido en la cadena contra las reservas |

Las claves de prueba quedan en `.estado.json` (ignorado por git). Solo testnet: BOBT no recibe dinero real hasta
operar con un emisor autorizado.
