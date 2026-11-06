import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const root = process.cwd();
const publicRoot = resolve(root, 'public');
const sourceRoot = resolve(root, 'src');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

createServer(async (request, response) => {
  if (request.method !== 'GET') {
    response.writeHead(405).end('Method not allowed');
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Bad request'); return; }
  const isSource = pathname.startsWith('/src/');
  const base = isSource ? sourceRoot : publicRoot;
  const relative = pathname === '/' ? 'index.html' : pathname.slice(isSource ? 5 : 1);
  const file = resolve(base, relative);
  if (!(file === base || file.startsWith(base + sep))) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    const extension = file.slice(file.lastIndexOf('.'));
    response.writeHead(200, { 'Content-Type': `${types[extension] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(Number(process.env.PORT || 4173), '127.0.0.1', () => {
  console.log(`Outfit, considered. is running at http://127.0.0.1:${process.env.PORT || 4173}`);
});
