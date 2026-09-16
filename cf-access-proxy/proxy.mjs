#!/usr/bin/env node
// Proxy que injeta os headers de Cloudflare Access Service Token
// (CF-Access-Client-Id / CF-Access-Client-Secret) em todos os pedidos
// (HTTP normal + upgrade para WebSocket) antes de os reencaminhar para
// o hostname real. Existe para integrações (ex.: remote_homeassistant)
// que só sabem falar host:porta simples e não suportam headers
// personalizados, e por isso nunca passariam sozinhas pela camada
// Cloudflare Access de uma instância remota.
//
// Segredos vêm SEMPRE de variáveis de ambiente (ver run.sh, que as lê
// das opções do add-on via bashio). Nunca escrever credenciais aqui.

import http from 'node:http';
import https from 'node:https';

const TARGET_HOST = process.env.CF_TARGET_HOST;
const CF_ID = process.env.CF_ACCESS_CLIENT_ID;
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET;
const LOCAL_PORT = Number(process.env.CF_PROXY_PORT || 8099);

if (!TARGET_HOST || !CF_ID || !CF_SECRET) {
  console.error('Faltam variaveis de ambiente: CF_TARGET_HOST, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET');
  process.exit(1);
}

function buildHeaders(reqHeaders) {
  const headers = { ...reqHeaders };
  headers['host'] = TARGET_HOST;
  headers['CF-Access-Client-Id'] = CF_ID;
  headers['CF-Access-Client-Secret'] = CF_SECRET;
  return headers;
}

const server = http.createServer((req, res) => {
  const proxyReq = https.request({
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: buildHeaders(req.headers),
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => {
    res.writeHead(502);
    res.end('Proxy error: ' + e.message);
  });
  req.pipe(proxyReq);
});

server.on('upgrade', (req, clientSocket, head) => {
  const proxyReq = https.request({
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: buildHeaders(req.headers),
  });
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    let headerLines = `HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`;
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      headerLines += `${k}: ${v}\r\n`;
    }
    headerLines += '\r\n';
    clientSocket.write(headerLines);
    if (proxyHead && proxyHead.length) proxySocket.unshift(proxyHead);
    if (head && head.length) clientSocket.unshift(head);
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });
  proxyReq.on('error', () => clientSocket.destroy());
  clientSocket.on('error', () => proxyReq.destroy());
  proxyReq.end();
});

// 0.0.0.0: tem de ouvir em todas as interfaces para a porta publicada
// pelo Supervisor (ports: 8099/tcp) conseguir chegar até aqui de fora
// do contentor do add-on.
server.listen(LOCAL_PORT, '0.0.0.0', () => {
  console.log(`[cf-access-proxy] a ouvir em 0.0.0.0:${LOCAL_PORT} -> https://${TARGET_HOST}`);
});
