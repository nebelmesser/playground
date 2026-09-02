import { createServer } from 'node:https';
import { request as httpRequest } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const certDir = join(repo, '.certs');
const port = Number(process.env.HTTPS_PORT || 4000);
const targetPort = Number(process.env.JEKYLL_PORT || 4001);

const server = createServer({
  cert: readFileSync(join(certDir, 'lan.crt')),
  key: readFileSync(join(certDir, 'lan.key')),
  minVersion: 'TLSv1.2',
}, (req, res) => {
  const proxy = httpRequest({
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${targetPort}`,
    },
  }, (upstream) => {
    const headers = {
      ...upstream.headers,
      'Permissions-Policy': 'accelerometer=*, gyroscope=*, magnetometer=*',
    };
    res.writeHead(upstream.statusCode || 200, headers);
    upstream.pipe(res);
  });
  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Jekyll proxy failed: ${err.message}`);
  });
  req.pipe(proxy);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`HTTPS: https://0.0.0.0:${port}/4d/viewer.html → http://127.0.0.1:${targetPort}`);
});
