// Servidor local privado de Os Sete Sinos: entrega a página e liga o painel do mestre ao Claude Code.
// Escuta só em 127.0.0.1. Usa o login do Claude Code já existente na máquina, sem chave de API.
// Uso: node servidor/servidor.mjs   (porta: variável PORTA, padrão 8787)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.dirname(AQUI);
const HOST = '127.0.0.1', PORTA = +(process.env.PORTA || 8787);
const REGRAS = path.join(AQUI, 'mestre.md');
const TEMPO_MAX = 180000, CORPO_MAX = 32 * 1024;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const CHAVE = /^[a-z0-9-]{3,40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/* pasta vazia: o mestre não enxerga o projeto nem carrega configurações de lá */
const PASTA_MESTRE = path.join(os.tmpdir(), 'os-sete-sinos-mestre');
fs.mkdirSync(PASTA_MESTRE, { recursive: true });

function acharClaude() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  const ext = path.join(os.homedir(), '.vscode', 'extensions');
  try {
    const achados = fs.readdirSync(ext).filter(d => d.startsWith('anthropic.claude-code-')).sort().reverse();
    for (const d of achados) { const b = path.join(ext, d, 'resources', 'native-binary', 'claude.exe'); if (fs.existsSync(b)) return b; }
  } catch { /* sem extensão: tenta o PATH */ }
  return process.platform === 'win32' ? 'claude.exe' : 'claude';
}
const CLAUDE = acharClaude();
let ocupado = false;

/* pintor: processo Python que mantém o modelo na memória. Pinta uma imagem por vez e guarda
   só o pedido mais novo: um pedido antigo que ainda não começou é descartado */
const PYTHON = path.join(RAIZ, '.ia', 'venv', 'Scripts', 'python.exe');
const GERADOR = path.join(RAIZ, 'ferramentas', 'gerar_imagens.py');
let pintor = null, pintorPronto = false, pintando = null, proxima = null;
function ligarPintor() {
  if (!fs.existsSync(PYTHON)) return;
  pintor = spawn(PYTHON, ['-I', GERADOR, '--pintor'], { cwd: RAIZ, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  let resto = '';
  pintor.stdout.on('data', d => {
    resto += d.toString('utf8');
    const linhas = resto.split('\n'); resto = linhas.pop();
    for (const l of linhas) {
      if (!l.startsWith('@@')) continue;
      const m = JSON.parse(l.slice(2));
      if (m.pronto) { pintorPronto = true; console.log('Pintor pronto: imagens ao vivo ligadas.'); }
      else if (pintando) { json(pintando.res, 200, m.ok ? { arquivo: `img/vivo/${pintando.chave}.webp` } : { erro: m.erro }); pintando = null; }
      pintarProxima();
    }
  });
  pintor.on('error', () => { pintor = null; });
  pintor.on('close', () => {
    pintor = null; pintorPronto = false;
    for (const p of [pintando, proxima]) if (p) json(p.res, 503, { erro: 'O pintor parou.' });
    pintando = proxima = null;
  });
}
function pintarProxima() {
  if (pintando || !proxima || !pintorPronto) return;
  pintando = proxima; proxima = null;
  pintor.stdin.write(JSON.stringify({ chave: pintando.chave, cena: pintando.cena }) + '\n');
}
function pedirPintura({ chave, cena }, res) {
  if (!pintor) return json(res, 503, { erro: 'O pintor não está ligado.' });
  if (typeof chave !== 'string' || !CHAVE.test(chave) || typeof cena !== 'string' || !cena.trim() || cena.length > 400) return json(res, 400, { erro: 'Pedido de imagem inválido.' });
  if (proxima) json(proxima.res, 200, { descartada: true });
  proxima = { chave, cena: cena.trim(), res };
  pintarProxima();
}

/* só aceita pedidos do próprio endereço, o que barra outros sites e DNS rebinding */
function daqui(req) {
  const ok = [`127.0.0.1:${PORTA}`, `localhost:${PORTA}`];
  if (!ok.includes(req.headers.host)) return false;
  const o = req.headers.origin;
  return !o || ok.some(h => o === `http://${h}`);
}
function lerCorpo(req) {
  return new Promise((res, rej) => {
    let n = 0; const partes = [];
    req.on('data', c => { n += c.length; if (n > CORPO_MAX) rej(new Error('grande')); else partes.push(c); });
    req.on('end', () => res(Buffer.concat(partes).toString('utf8')));
    req.on('error', rej);
  });
}
function json(res, cod, obj) { res.writeHead(cod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }

function arquivo(req, res, url) {
  const rel = url === '/' ? 'index.html' : decodeURIComponent(url).replace(/^\/+/, '');
  const alvo = path.resolve(RAIZ, rel);
  const liberado = alvo === path.join(RAIZ, 'index.html') || ['css', 'js', 'img'].some(d => alvo.startsWith(path.join(RAIZ, d) + path.sep));
  const tipo = TIPOS[path.extname(alvo).toLowerCase()];
  if (!liberado || !tipo) return json(res, 404, { erro: 'não encontrado' });
  fs.readFile(alvo, (e, dados) => {
    if (e) return json(res, 404, { erro: 'não encontrado' });
    res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(dados);
  });
}

/* um turno do mestre: resposta em NDJSON, uma linha {t} por trecho e {fim, sessao} no final */
function turno(pedido, req, res) {
  const { texto, estado, sessao } = pedido;
  if (typeof texto !== 'string' || !texto.trim() || texto.length > 2000) return json(res, 400, { erro: 'Escreva o que você quer fazer.' });
  if (sessao && !UUID.test(sessao)) return json(res, 400, { erro: 'Sessão inválida.' });
  if (ocupado) return json(res, 429, { erro: 'O mestre ainda está falando.' });
  ocupado = true;
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--tools', '', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources', 'user', '--effort', 'low', '--system-prompt-file', REGRAS];
  if (sessao) args.push('--resume', sessao);
  const filho = spawn(CLAUDE, args, { cwd: PASTA_MESTRE, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' });
  const manda = o => res.write(JSON.stringify(o) + '\n');
  let resto = '', erros = '', idSessao = sessao || null, acabou = false, deuTexto = false;
  const limite = setTimeout(() => filho.kill(), TEMPO_MAX);
  const fechar = o => { if (acabou) return; acabou = true; ocupado = false; clearTimeout(limite); manda(o); res.end(); };

  filho.stdout.on('data', d => {
    resto += d.toString('utf8');
    const linhas = resto.split('\n'); resto = linhas.pop();
    for (const l of linhas) {
      let m; try { m = JSON.parse(l); } catch { continue; }
      if (m.session_id) idSessao = m.session_id;
      const ev = m.type === 'stream_event' ? m.event : null;
      if (ev?.type === 'content_block_delta' && ev.delta?.type === 'text_delta') { deuTexto = true; manda({ t: ev.delta.text }); }
      if (m.type === 'result' && m.is_error) erros += String(m.result || 'erro do mestre');
    }
  });
  filho.stderr.on('data', d => { erros += d.toString('utf8').slice(0, 400); });
  filho.on('error', () => fechar({ erro: 'Não encontrei o Claude Code nesta máquina. Defina CLAUDE_BIN com o caminho do claude.exe.' }));
  filho.on('close', cod => fechar(cod === 0 && deuTexto ? { fim: true, sessao: idSessao } : { erro: (erros.trim() || 'O mestre não respondeu.').slice(0, 300), perdeuSessao: /session|conversation/i.test(erros) }));
  res.on('close', () => { if (!acabou) { acabou = true; ocupado = false; clearTimeout(limite); filho.kill(); } });
  filho.stdin.end(`<estado>\n${JSON.stringify(estado ?? {})}\n</estado>\n<jogador>\n${texto}\n</jogador>\n`);
}

const servidor = http.createServer(async (req, res) => {
  if (!daqui(req)) return json(res, 403, { erro: 'Acesso permitido só nesta máquina.' });
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && url === '/api/status') return json(res, 200, { mestre: true, pintor: !!pintor });
  if (req.method === 'POST' && url === '/api/mestre') {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { erro: 'Formato inválido.' });
    try { return turno(JSON.parse(await lerCorpo(req)), req, res); }
    catch { return res.headersSent ? res.end() : json(res, 400, { erro: 'Pedido inválido.' }); }
  }
  if (req.method === 'POST' && url === '/api/imagem') {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { erro: 'Formato inválido.' });
    try { return pedirPintura(JSON.parse(await lerCorpo(req)), res); }
    catch { return json(res, 400, { erro: 'Pedido inválido.' }); }
  }
  if (req.method === 'GET') return arquivo(req, res, url);
  json(res, 405, { erro: 'Método não permitido.' });
});
servidor.listen(PORTA, HOST, () => { console.log(`Os Sete Sinos: http://${HOST}:${PORTA}  (feche esta janela para desligar)`); ligarPintor(); });
for (const sinal of ['SIGINT', 'SIGTERM']) process.on(sinal, () => { pintor?.stdin.end(); process.exit(0); });
