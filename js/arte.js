'use strict';
/* Cada trecho da história tem uma cena. Se existir img/<chave>.png (ou .jpg/.webp), ela é usada;
   sem arquivo, a cena é desenhada em código e passa pelo filtro de nanquim abaixo.
   Os mapas locais (chaves m_*) ficam em pixel art, como o mapa do mundo. */
const AW = 320, AH = 180, ESC = 3;
const artCache = {}, imgCache = {};
let g = null, rr = Math.random;
function arte(k) {
  if (!artCache[k]) {
    const mapa = k.startsWith('m_'), e = mapa ? 1 : ESC, c = newCanvas(AW * e, AH * e);
    g = c.getContext('2d', { willReadFrequently: !mapa }); g.scale(e, e); rr = mulberry(hashStr(k));
    (ART[k] || ART.vazio)(); artCache[k] = mapa ? c : acabar(c, k);
  }
  return artCache[k];
}
/* chama pronto(img) se existir arquivo para a cena, ou semArquivo() se não existir */
function imagemReal(k, pronto, semArquivo) {
  if (imgCache[k] === null) return semArquivo();
  if (imgCache[k]) return pronto(imgCache[k]);
  const exts = ['webp', 'png', 'jpg'];
  const tenta = i => {
    if (i >= exts.length) { imgCache[k] = null; semArquivo(); return; }
    const im = new Image();
    im.onload = () => { imgCache[k] = im; pronto(im); };
    im.onerror = () => tenta(i + 1);
    im.src = `img/${k}.${exts[i]}`;
  };
  tenta(0);
}
/* acabamento de ilustração: treme as linhas como traço à mão, passa nanquim nos contornos,
   hachura as sombras, tira saturação e fecha as bordas com fumaça */
function acabar(c, k) {
  const w2 = c.width, h2 = c.height, x = c.getContext('2d'), src = x.getImageData(0, 0, w2, h2), o = src.data, out = x.createImageData(w2, h2), d = out.data, n = w2 * h2;
  const fum = makeNoise(mulberry(hashStr(k) ^ 0x7a11)), lum = new Float32Array(n), mapaX = new Int32Array(n);
  for (let y = 0; y < h2; y++) for (let i = 0; i < w2; i++) {
    const dx = (fum(i / 46, y / 46, 2) - .5) * 15, dy = (fum(i / 46 + 40, y / 46 + 40, 2) - .5) * 15;
    const q = clamp(y + dy | 0, 0, h2 - 1) * w2 + clamp(i + dx | 0, 0, w2 - 1), z = y * w2 + i;
    mapaX[z] = q * 4; lum[z] = o[q * 4] * .3 + o[q * 4 + 1] * .59 + o[q * 4 + 2] * .11;
  }
  for (let y = 0; y < h2; y++) for (let i = 0; i < w2; i++) {
    const z = y * w2 + i, q = mapaX[z], l = lum[z], e = z * 4;
    const gx = i > 1 && i < w2 - 2 ? lum[z + 2] - lum[z - 2] : 0, gy = y > 1 && y < h2 - 2 ? lum[z + 2 * w2] - lum[z - 2 * w2] : 0;
    const tinta = clamp((Math.hypot(gx, gy) - 26) / 34, 0, 1);
    const hach = l < 92 && (i + y) % 7 < 2 && fum(i / 20, y / 20, 2) > .47 ? .3 : 0;
    const vx = i / w2 - .5, vy = y / h2 - .5, nuvem = fum(i / 150, y / 110, 4), borda = clamp((Math.hypot(vx * 1.05, vy * 1.2) - .34 + (nuvem - .5) * .55) * 2.1, 0, .9);
    const cin = l * .3, cont = v => clamp((v * .7 + cin - 128) * 1.14 + 118, 0, 255);
    const fator = (1 - tinta * .92) * (1 - hach) * (1 - borda), gr = (Math.imul(i, 57) ^ Math.imul(y, 131)) >>> 2 & 7;
    d[e] = cont(o[q]) * fator + 12 + gr * .5; d[e + 1] = cont(o[q + 1]) * fator + 10 + gr * .5; d[e + 2] = cont(o[q + 2]) * fator + 11 + gr * .5; d[e + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  return c;
}

/* ---------- primitivas ---------- */
const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
/* traço: formas orgânicas com sombra dura à direita e contorno de nanquim */
const TINTA = '#120c0a';
const tom = (h, f) => { const c = rgb(h); return '#' + c.map(v => clamp(v * f | 0, 0, 255).toString(16).padStart(2, '0')).join(''); };
function liso(pts) { const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s0 = m(pts[n - 1], pts[0]); g.moveTo(s0[0], s0[1]); for (let i = 0; i < n; i++) { const c = m(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], c[0], c[1]); } g.closePath(); }
function reto(pts) { pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); }
function forma(cor, caminho, sx, lw = .8) {
  g.save(); g.beginPath(); caminho(); g.fillStyle = cor; g.fill(); g.clip();
  if (sx !== undefined) { g.fillStyle = 'rgba(8,4,12,.36)'; g.beginPath(); g.moveTo(sx + 3, -20); g.lineTo(AW + 400, -20); g.lineTo(AW + 400, AH + 20); g.lineTo(sx - 5, AH + 20); g.fill(); }
  g.restore(); g.beginPath(); caminho(); g.strokeStyle = TINTA; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke();
}
function gradV(y0, y1, cores) { const l = g.createLinearGradient(0, y0, 0, y1); cores.forEach((c, i) => l.addColorStop(i / Math.max(1, cores.length - 1), c)); g.fillStyle = l; g.fillRect(0, y0, AW, y1 - y0); }
function pedras(x, y, w, h, b = '#4a4650', d = '#2c2a32', l = '#5c5862') {
  r(x, y, w, h, tom(b, .62));
  for (let yy = 0, k = 0; yy < h; yy += 11, k++) for (let xx = -((k % 2) * 10) - 4; xx < w; ) {
    const bw = 15 + rr() * 11, bh = 10, c = rr() < .28 ? l : rr() < .4 ? tom(b, .84) : b;
    if (xx + bw > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); forma(c, () => liso([[x + xx, y + yy + 1], [x + xx + bw * .5, y + yy - .4], [x + xx + bw, y + yy + 1], [x + xx + bw + .6, y + yy + bh * .5], [x + xx + bw, y + yy + bh], [x + xx + bw * .5, y + yy + bh + .4], [x + xx, y + yy + bh], [x + xx - .6, y + yy + bh * .5]]), x + xx + bw * .6, .6); g.restore(); }
    xx += bw + .6;
  }
}
function tabuas(x, y, w, h, b = '#5b3a24', d = '#2c190d', l = '#6f4a30', vert = true) {
  r(x, y, w, h, b); g.strokeStyle = d; g.lineWidth = .8;
  if (vert) for (let xx = 0; xx < w; xx += 14) { r(x + xx + 7, y, 6, h, rr() < .5 ? tom(b, .82) : l); g.beginPath(); g.moveTo(x + xx, y); g.lineTo(x + xx + (rr() - .5) * 2, y + h); g.stroke(); for (let k = 0; k < 2; k++) { const yy = y + rr() * h; g.beginPath(); g.moveTo(x + xx + 3, yy); g.quadraticCurveTo(x + xx + 7, yy + 8, x + xx + 4, yy + 18); g.stroke(); } }
  else for (let yy = 0; yy < h; yy += 9) { r(x, y + yy, w, 5, rr() < .5 ? tom(b, .84) : l); g.beginPath(); g.moveTo(x, y + yy); g.lineTo(x + w, y + yy + (rr() - .5) * 2); g.stroke(); }
}
const chama = (x, y, e = 1) => { forma('#d8561f', () => liso([[x, y + 8 * e], [x - 5 * e, y + 3 * e], [x - 2 * e, y - 3 * e], [x, y - 11 * e], [x + 3 * e, y - 3 * e], [x + 5 * e, y + 3 * e]]), undefined, .5); g.fillStyle = '#f2c14e'; g.beginPath(); liso([[x, y + 7 * e], [x - 3 * e, y + 3 * e], [x, y - 5 * e], [x + 3 * e, y + 3 * e]]); g.fill(); g.fillStyle = '#fff3c0'; g.beginPath(); liso([[x, y + 6 * e], [x - 1.4 * e, y + 3 * e], [x, y - 1 * e], [x + 1.4 * e, y + 3 * e]]); g.fill(); };
function tocha(x, y) { forma('#3a2412', () => reto([[x - 1.6, y + 1], [x + 1.6, y + 1], [x + 1, y + 13], [x - 1, y + 13]])); chama(x, y - 4); luz(x, y - 4, 52, '#e87a30', .1); }
function vela(x, y) { forma('#d8d0bc', () => reto([[x, y], [x + 2.4, y], [x + 2.4, y + 6], [x, y + 6]]), undefined, .4); chama(x + 1.2, y - 2.5, .32); luz(x + 1, y - 2, 16, '#e8a040', .1); }
function sino(x, y, s, badalo = true) {
  const b = '#a97d33', P = (a, c) => [x + a * s, y + c * s];
  forma(b, () => { const q = [P(-2.2, 0), P(2.2, 0), P(4.6, 3), P(5, 8), P(5.6, 11), P(8.4, 13.6), P(-8.4, 13.6), P(-5.6, 11), P(-5, 8), P(-4.6, 3)]; g.moveTo(...q[0]); g.lineTo(...q[1]); g.quadraticCurveTo(...q[2], ...q[3]); g.quadraticCurveTo(...q[4], ...q[5]); g.lineTo(...q[6]); g.quadraticCurveTo(...q[7], ...q[8]); g.quadraticCurveTo(...q[9], ...q[0]); g.closePath(); }, x + s * .8, Math.max(.8, s * .3));
  g.fillStyle = 'rgba(255,232,170,.55)'; g.beginPath(); liso([P(-3.2, 2), P(-1.8, 2), P(-2.8, 9), P(-5, 12), P(-4.4, 8)]); g.fill();
  g.strokeStyle = TINTA; g.lineWidth = Math.max(.5, s * .2); g.beginPath(); g.moveTo(...P(-6.5, 11.5)); g.quadraticCurveTo(...P(0, 12.6), ...P(6.5, 11.5)); g.stroke();
  if (badalo) forma('#3a3a42', () => liso([P(-.4, 13.6), P(.4, 13.6), P(1.3, 17), P(0, 18.4), P(-1.3, 17)]), x, .6);
}
function arvore(x, y, h = 30, c = '#2f6a34', d = '#1f4a26', l = '#4a8a48') {
  forma('#3a2412', () => liso([[x - 3.4, y], [x - 1.8, y - h * .5], [x + 1.8, y - h * .5], [x + 3.4, y]]), x + 1);
  for (const [dx, dy, e] of [[-.4, -.56, .42], [.4, -.58, .42], [0, -.86, .44], [0, -.62, .5]]) { const cx = x + dx * h, cy = y + dy * h, R = h * e * .72, q = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, m = R * (.82 + rr() * .3); q.push([cx + Math.cos(a) * m, cy + Math.sin(a) * m * .86]); } forma(c, () => liso(q), cx + R * .2); }
  g.fillStyle = l; g.globalAlpha = .55; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(x - h * .24 + rr() * h * .34, y - h * .96 + rr() * h * .36, 1.2 + rr() * 2.2, 0, 7); g.fill(); } g.globalAlpha = 1;
}
function pinho(x, y, h = 40, c = '#1f4a34', l = '#2f6a48') {
  forma('#2a1a0e', () => reto([[x - 1.4, y], [x + 1.4, y], [x + .8, y - h * .3], [x - .8, y - h * .3]]));
  for (let i = 0; i < 5; i++) { const b = y - h * .14 - i * h * .17, w2 = (5 - i) * h * .075 + 2, t = b - h * .27; forma(i % 2 ? l : c, () => reto([[x, t], [x + w2, b], [x + w2 * .45, b - 1.5], [x + w2 * .2, b + .8], [x - w2 * .3, b - 1.2], [x - w2, b]]), x + .6, .6); }
}
function montanha(x, y, w, h, c = '#4a4658', d = '#2c2a3e', neve = '#d8dfe8') {
  const L = [], R2 = []; for (let i = 1; i <= 7; i++) { const f = i / 7, j = (rr() - .5) * w * .06; L.push([x - w / 2 * f + j, y + h * f + (rr() - .5) * 2]); R2.push([x + w / 2 * f + j, y + h * f + (rr() - .5) * 2]); }
  forma(c, () => reto([[x, y], ...R2, ...L.slice().reverse()]), x + 3, 1);
  const n = [[x, y]]; for (let i = 1; i <= 2; i++) n.push(R2[i - 1]); n.push([R2[1][0] - w * .08, R2[1][1] + 6], [x + w * .05, R2[1][1] - 2], [x - w * .1, R2[1][1] + 8], [L[1][0] + w * .06, L[1][1] - 2], L[1], L[0]);
  forma(neve, () => reto(n), x + 2, .7);
}
function luz(x, y, rad, cor, forca = .1) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = cor;
  for (let i = 4; i > 0; i--) { g.globalAlpha = forca; g.beginPath(); g.arc(x, y, rad * i / 4, 0, 7); g.fill(); }
  g.restore();
}
function escuro(a, c = '#060410') { g.save(); g.globalAlpha = a; r(0, 0, AW, AH, c); g.restore(); }
function vinheta() {
  g.save(); g.fillStyle = '#05030a';
  for (let i = 0; i < 5; i++) { g.globalAlpha = .13; const m = i * 7; g.fillRect(0, 0, AW, 8 - i + m / 2); g.fillRect(0, AH - m / 2 - 8 + i, AW, m / 2 + 8); g.fillRect(0, 0, m, AH); g.fillRect(AW - m, 0, m, AH); }
  g.restore();
}
function chao(y, b, d, l) { r(0, y, AW, AH - y, b); for (let i = 0, yy = y; yy < AH; i++, yy += 3 + i) { r(0, yy, AW, 1, d); for (let k = 0; k < 7; k++) r(rr() * AW, yy + 2, 14, 1, l); } }
const salaPedra = (y = 124) => { pedras(0, 0, AW, y); chao(y, '#3a3640', '#2a2730', '#4a4650'); r(0, y - 2, AW, 2, '#26232b'); };
const salaMadeira = (y = 124) => { tabuas(0, 0, AW, y); chao(y, '#4e3220', '#37210f', '#5f4029'); r(0, y - 3, AW, 3, '#2c1a0d'); };
function caverna(y = 128) {
  r(0, 0, AW, AH, '#2a2520');
  for (let i = 0; i < 140; i++) r(rr() * AW, rr() * AH, 6 + rr() * 16, 2 + rr() * 5, rr() < .5 ? '#352e27' : '#211c18');
  chao(y, '#3a3025', '#2a2218', '#4a3e30');
  for (let x = 0; x < AW; x += 10 + rr() * 16) { const h = 8 + rr() * 26; for (let k = 0; k < h; k += 3) r(x + k / 4, k, 8 - k / 4 * 1.0, 3, '#1c1814'); }
}
function janela(x, y, w, h, c = '#6fa8d8') { r(x - 2, y - 2, w + 4, h + 4, '#2a1a0e'); r(x, y, w, h, c); r(x + w / 2, y, 1, h, '#2a1a0e'); r(x, y + h / 2, w, 1, '#2a1a0e'); }
function porta(x, y, w, h) { r(x - 2, y - 2, w + 4, h + 2, '#2c1a0d'); tabuas(x, y, w, h, '#6a4228', '#3f2614', '#7d5233'); r(x + w - 5, y + h / 2, 2, 2, '#e3b04b'); }
function barril(x, y) { r(x, y, 14, 18, '#7a4f2c'); r(x, y + 3, 14, 2, '#3a3a3e'); r(x, y + 13, 14, 2, '#3a3a3e'); r(x + 3, y, 2, 18, '#94633a'); }
function mesa(x, y, w) { r(x, y, w, 4, '#8a5a34'); r(x, y + 4, w, 2, '#4d3019'); r(x + 3, y + 6, 3, 15, '#4d3019'); r(x + w - 6, y + 6, 3, 15, '#4d3019'); }
function caneca(x, y) { r(x, y, 4, 5, '#b7ad98'); r(x, y, 4, 1, '#f0e8d0'); r(x + 4, y + 1, 1, 3, '#b7ad98'); }
function estante(x, y, w, h) { r(x, y, w, h, '#4a2e18'); for (let yy = 4; yy < h - 4; yy += 16) { r(x + 2, yy + y, w - 4, 13, '#22140a'); for (let xx = 3; xx < w - 5; xx += 3 + (rr() * 2 | 0)) { const bh = 8 + rr() * 5; r(x + xx, y + yy + 13 - bh, 2, bh, ['#8a3a30', '#3a5a8a', '#4a7a4a', '#c2a050', '#6a4a8a'][rr() * 5 | 0]); } } }
function cama(x, y) { r(x, y, 70, 18, '#7a4f2c'); r(x + 2, y - 6, 66, 8, '#a23a30'); r(x + 2, y - 8, 18, 8, '#e8dcc0'); r(x, y - 16, 4, 34, '#5c3a20'); r(x + 66, y - 10, 4, 28, '#5c3a20'); }
function bigorna(x, y) { r(x, y, 26, 5, '#4a4a52'); r(x + 7, y + 5, 12, 8, '#36363c'); r(x + 3, y + 13, 20, 4, '#4a4a52'); r(x + 2, y, 22, 1, '#7a7a84'); }
function forja(x, y) { pedras(x, y, 74, 58, '#524a46', '#3a3431', '#655c56'); r(x + 12, y + 26, 50, 24, '#1a0c06'); r(x + 15, y + 38, 44, 12, '#e8743a'); r(x + 20, y + 42, 34, 8, '#f2c14e'); luz(x + 37, y + 42, 60, '#e8602a', .11); }
function altar(x, y, w = 70) { pedras(x, y, w, 26, '#6a6670', '#4a4650', '#7c7882'); r(x - 4, y - 4, w + 8, 5, '#8c8892'); }
function ossos(x, y) { r(x, y, 12, 2, '#d8d0bc'); r(x - 1, y - 1, 2, 4, '#d8d0bc'); r(x + 11, y - 1, 2, 4, '#d8d0bc'); r(x + 15, y - 5, 7, 6, '#d8d0bc'); r(x + 16, y - 3, 2, 2, '#1a1410'); r(x + 19, y - 3, 2, 2, '#1a1410'); }
function morro(y, c, amp = 14, f = .02, f2 = .07) { for (let x = 0; x < AW; x += 2) { const h = y + Math.sin(x * f + y) * amp + Math.sin(x * f2 + 2) * amp / 3; r(x, h, 2, AH - h, c); } }
function lua(x, y, rad) { g.fillStyle = '#e8e4d0'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); r(x - 4, y - 3, 4, 3, '#c8c4b0'); r(x + 3, y + 3, 3, 2, '#c8c4b0'); luz(x, y, rad * 3, '#8a9ac8', .05); }
function estrelas(n, ymax) { for (let i = 0; i < n; i++) r(rr() * AW, rr() * ymax, 1, 1, rr() < .3 ? '#fff4d0' : '#9aa8d0'); }
function cinzas(n) { for (let i = 0; i < n; i++) r(rr() * AW, rr() * AH, 1 + (rr() * 2 | 0), 1, rr() < .5 ? '#9a9490' : '#6a6460'); }
function torreSino(x, y, w, h, pedra = '#6a6670', comBadalo = false) {
  pedras(x - w / 2, y - h, w, h, pedra, '#4a4650', '#7c7882');
  r(x - w / 2 - 4, y - h - 2, w + 8, 3, '#35323b');
  for (let i = 0; i < w / 2 + 8; i++) r(x - i, y - h - 28 + i * .95, i * 2, 2, '#7e2a22');
  r(x - w / 2 + 3, y - h - 2 - 24 + 6, w - 6, 18 + 6, '#16121c'); r(x - w / 2 + 3, y - h - 2, w - 6, 3, '#35323b');
  sino(x, y - h - 19, 1, comBadalo);
}

/* ---------- personagens (y = linha dos pés; 20*s de altura) ---------- */
function boneco(x, y, s, o = {}) {
  const p = o.p || '#d6a47c', t = o.t || '#4f6a46', c = o.c || '#3e2616', cap = o.capuz, calca = tom(t, .6), L = (pts, cor, lw = .8) => forma(cor, () => liso(pts.map(q => [x + q[0] * s, y - q[1] * s])), x + .4 * s, lw);
  if (o.escudo) L([[-7.6, 13], [-3.8, 13.4], [-3.4, 8], [-5.6, 5.2], [-7.8, 8]], '#7a2520');
  if (cap) L([[-5.8, .3], [-7, 8], [-5.2, 15], [0, 16.6], [5.2, 15], [7, 8], [5.8, .3], [2, 1.4], [-2, .8]], tom(cap, .58));
  if (o.saia) {
    L([[-5, .2], [-3.9, 6.6], [-3.1, 13.4], [3.1, 13.4], [3.9, 6.6], [5, .2], [1.6, .8], [-1.6, .5]], t);
    g.strokeStyle = TINTA; g.lineWidth = .5; for (const f of [-2.2, .4, 2.6]) { g.beginPath(); g.moveTo(x + f * .55 * s, y - 9 * s); g.quadraticCurveTo(x + f * s, y - 4 * s, x + f * 1.3 * s, y - .5 * s); g.stroke(); }
  } else {
    L([[-3.3, 3], [-3.3, 9], [-.3, 9.2], [-.5, 3]], calca); L([[.5, 3], [.3, 9.2], [3.3, 9], [3.3, 3]], calca);
    L([[-3.8, 0], [-3.5, 3.6], [-.5, 3.6], [-.3, 0]], '#33241a'); L([[.3, 0], [.5, 3.6], [3.5, 3.6], [3.8, 0]], '#33241a');
  }
  L([[-3.7, 7.6], [-4.3, 13.6], [-2.4, 15.1], [2.4, 15.1], [4.3, 13.6], [3.7, 7.6], [0, 7.2]], t);
  L([[-3.9, 8], [-3.8, 9.6], [3.8, 9.6], [3.9, 8]], o.cinto || '#3a2412', .6); forma('#c9a24a', () => reto([[x - .8 * s, y - 9.5 * s], [x + .8 * s, y - 9.5 * s], [x + .8 * s, y - 8.1 * s], [x - .8 * s, y - 8.1 * s]]), undefined, .4);
  if (!o.saia && !cap) L([[-3.6, 8.4], [-3, 4.4], [-1.2, 3.2], [-.4, 8.2]], tom(o.cinto || '#7a2520', 1.6));
  L([[-3.9, 14.6], [-5.5, 13.4], [-6, 8.4], [-4.6, 7.8], [-3.8, 11]], tom(t, .86)); L([[3.9, 14.6], [5.5, 13.4], [6, 8.4], [4.6, 7.8], [3.8, 11]], tom(t, .86));
  L([[-6.1, 8.6], [-6.1, 7], [-4.6, 7], [-4.5, 8.4]], p, .6); L([[6.1, 8.6], [6.1, 7], [4.6, 7], [4.5, 8.4]], p, .6);
  if (o.longo) L([[-2.8, 12], [-3, 18], [0, 20], [3, 18], [2.8, 12], [1.6, 15], [-1.6, 15]], c);
  L([[-1.8, 15.4], [-2.2, 17.6], [0, 19.5], [2.2, 17.6], [1.8, 15.4], [0, 14.6]], p);
  g.fillStyle = TINTA; g.fillRect(x - 1.3 * s, y - 17.6 * s, s * .9, s * .32); g.fillRect(x + .4 * s, y - 17.6 * s, s * .9, s * .32); g.fillStyle = 'rgba(70,30,20,.5)'; g.fillRect(x - .1 * s, y - 17.2 * s, s * .35, s * 1.1);
  g.strokeStyle = TINTA; g.lineWidth = .5; g.beginPath(); g.moveTo(x - .8 * s, y - 15.7 * s); g.lineTo(x + .8 * s, y - 15.8 * s); g.stroke();
  if (o.barba) L([[-2.1, 16.8], [-2, 14.4], [0, 12.6], [2, 14.4], [2.1, 16.8], [.9, 16], [-.9, 16]], o.barba, .6);
  if (cap) {
    L([[-3, 13.8], [-3.5, 18], [0, 21.4], [3.5, 18], [3, 13.8], [1.9, 15.4], [2, 18.2], [0, 19.2], [-2, 18.2], [-1.9, 15.4]], cap);
    g.fillStyle = 'rgba(8,4,10,.55)'; g.beginPath(); liso([[-2, 18.3], [0, 19.3], [2, 18.3], [1.9, 16.6], [-1.9, 16.6]].map(q => [x + q[0] * s, y - q[1] * s])); g.fill();
    if (o.olhos) { g.fillStyle = o.olhos; g.fillRect(x - 1.2 * s, y - 17.7 * s, s * .7, s * .4); g.fillRect(x + .5 * s, y - 17.7 * s, s * .7, s * .4); }
  } else if (!o.longo) L([[-2.3, 17.4], [-2.2, 19.2], [0, 20.3], [2.2, 19.2], [2.3, 17.4], [.6, 18.8], [-1, 18.6]], c);
  if (o.coroa) forma('#a8a4a0', () => reto([[x - 2.5 * s, y - 19.2 * s], [x - 2.9 * s, y - 22 * s], [x - 1.3 * s, y - 20.4 * s], [x, y - 22.6 * s], [x + 1.3 * s, y - 20.4 * s], [x + 2.9 * s, y - 22 * s], [x + 2.5 * s, y - 19.2 * s]]), x + .4 * s);
  if (o.arma) { forma('#b8c2ce', () => reto([[x + 6 * s, y - 8 * s], [x + 7 * s, y - 8 * s], [x + 6.8 * s, y - 19 * s], [x + 6.5 * s, y - 20 * s], [x + 6.2 * s, y - 19 * s]]), x + 6.5 * s, .6); forma('#8a6a2a', () => reto([[x + 5 * s, y - 8.3 * s], [x + 8 * s, y - 8.3 * s], [x + 8 * s, y - 7.5 * s], [x + 5 * s, y - 7.5 * s]]), undefined, .5); }
  if (o.cajado) { forma('#5a3a22', () => reto([[x + 6.4 * s, y], [x + 7.2 * s, y], [x + 7.2 * s, y - 21 * s], [x + 6.4 * s, y - 21 * s]]), x + 6.8 * s, .6); g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(x + 6.8 * s, y - 22 * s, 1.5 * s, 0, 7); g.fill(); g.strokeStyle = TINTA; g.lineWidth = .7; g.stroke(); luz(x + 6.8 * s, y - 22 * s, 7 * s, '#7fc0ff', .09); }
}
function goblin(x, y, s, arma = true) {
  const c = '#6d8f3a', L = (pts, cor, lw = .7) => forma(cor, () => liso(pts.map(q => [x + q[0] * s, y - q[1] * s])), x + .4 * s, lw);
  L([[-2.8, 0], [-2.4, 4.2], [-.4, 4.2], [-.6, 0]], '#4a3a26'); L([[.6, 0], [.4, 4.2], [2.4, 4.2], [2.8, 0]], '#4a3a26');
  L([[-3.2, 3.6], [-3.4, 8.6], [-1, 9.8], [3, 9.4], [3.4, 3.6], [0, 3]], '#5e4228'); L([[-3, 8], [-5, 6.4], [-5, 3.6], [-3.9, 3.6]], c); L([[3, 8], [5, 6.4], [5, 3.6], [3.9, 3.6]], c);
  L([[-3.2, 12], [-8, 14.2], [-3, 13.8]], tom(c, .84)); L([[3.2, 12], [8, 14.2], [3, 13.8]], tom(c, .84));
  L([[-3.4, 9.4], [-3.7, 12.6], [-1.6, 15], [1.6, 15], [3.7, 12.6], [3.4, 9.4], [0, 8.2]], c);
  g.fillStyle = '#f0d060'; g.fillRect(x - 2.2 * s, y - 12.8 * s, 1.2 * s, .7 * s); g.fillRect(x + .9 * s, y - 12.8 * s, 1.2 * s, .7 * s); g.fillStyle = TINTA; g.fillRect(x - 1.7 * s, y - 12.7 * s, .45 * s, .55 * s); g.fillRect(x + 1.4 * s, y - 12.7 * s, .45 * s, .55 * s);
  forma('#2a1410', () => liso([[x - 2 * s, y - 10.8 * s], [x, y - 10.2 * s], [x + 2 * s, y - 10.8 * s], [x, y - 9.4 * s]]), undefined, .4); g.fillStyle = '#e8e0c8'; for (const f of [-1.2, .1, 1.1]) g.fillRect(x + f * s, y - 10.6 * s, .4 * s, .6 * s);
  if (arma) forma('#8a8a92', () => reto([[x + 4.6 * s, y - 4 * s], [x + 5.4 * s, y - 4 * s], [x + 5.8 * s, y - 12 * s], [x + 4.6 * s, y - 11 * s]]), x + 5.1 * s, .6);
}
function esqueleto(x, y, s) {
  const c = '#d6ceb8', os = (a, b2, e, f, lw) => { g.lineCap = 'round'; for (const [w2, cor] of [[lw * s + 1, TINTA], [lw * s, c]]) { g.strokeStyle = cor; g.lineWidth = w2; g.beginPath(); g.moveTo(x + a * s, y - b2 * s); g.lineTo(x + e * s, y - f * s); g.stroke(); } };
  os(-1.6, 0, -1.6, 4, .7); os(-1.6, 4.4, -1.2, 8.4, .8); os(1.6, 0, 1.6, 4, .7); os(1.6, 4.4, 1.2, 8.4, .8); forma(c, () => liso([[x - 2.6 * s, y - 8 * s], [x, y - 9.4 * s], [x + 2.6 * s, y - 8 * s], [x, y - 7 * s]]), x, .6);
  os(0, 9, 0, 15, .7); for (let i = 0; i < 4; i++) { const yy = 10.4 + i * 1.3, w2 = 2.2 + (i > 0 ? .5 : 0); os(-w2, yy - .3, w2, yy - .3, .55); }
  os(-3, 15, 3, 15, .7); os(-3, 15, -4.6, 10.6, .55); os(-4.6, 10.4, -4.8, 6.8, .5); os(3, 15, 4.6, 10.6, .55); os(4.6, 10.4, 5.2, 7, .5);
  forma('#7c7a80', () => reto([[x + 5 * s, y - 7 * s], [x + 5.8 * s, y - 7 * s], [x + 6 * s, y - 16.6 * s], [x + 5.1 * s, y - 16 * s]]), x + 5.4 * s, .6);
  forma(c, () => liso([[x - 2.5 * s, y - 18 * s], [x, y - 20.4 * s], [x + 2.5 * s, y - 18 * s], [x + 1.6 * s, y - 15.2 * s], [x - 1.6 * s, y - 15.2 * s]]), x + .5 * s);
  for (const f of [-1.5, .4]) { g.fillStyle = '#16100e'; g.fillRect(x + f * s, y - 18.3 * s, 1.1 * s, 1.1 * s); g.fillStyle = '#c0342a'; g.fillRect(x + (f + .35) * s, y - 18 * s, .45 * s, .45 * s); }
  g.fillStyle = '#16100e'; for (let i = -1; i < 2; i++) g.fillRect(x + i * s - .1, y - 16 * s, .3 * s, .7 * s); luz(x, y - 17.6 * s, 4 * s, '#c02a2a', .08);
}
function lobo(x, y, s, dir = 1) {
  const X = v => x + v * s * dir, c = '#54545f', L = (pts, cor, lw = .8) => forma(cor, () => liso(pts.map(q => [X(q[0]), y - q[1] * s])), undefined, lw);
  L([[-10, 7], [-14, 10.5], [-13, 8], [-9, 5]], c);
  L([[6, 7], [6.4, 0], [7.6, 0], [8.4, 7]], tom(c, .7)); L([[-7, 7], [-7.4, 0], [-6, 0], [-4, 7]], tom(c, .7));
  L([[-10, 8.8], [-7, 10.6], [-2, 10], [3, 11], [8, 11], [10, 9], [9, 5], [3, 4.6], [-6, 4.4], [-10, 5.6]], c);
  L([[3, 7], [3.6, 0], [5, 0], [6, 7]], c); L([[-5, 7], [-5.4, 0], [-4, 0], [-2, 7]], c);
  g.strokeStyle = TINTA; g.lineWidth = .6; for (let i = 0; i < 8; i++) { const a = -8 + i * 2.2, b = 9.8 + rr() * .6; g.beginPath(); g.moveTo(X(a), y - b * s); g.lineTo(X(a + 1.2), y - (b - 1.4) * s); g.stroke(); }
  L([[7, 11], [8, 14], [9.2, 12.6], [10.4, 14.2], [11, 11.8], [15.4, 9.4], [15, 8.2], [10.6, 7.4], [8, 8]], tom(c, 1.14));
  g.fillStyle = '#f2c14e'; g.fillRect(X(11), y - 11 * s, .9 * s, .6 * s); g.fillStyle = '#e8e0c8'; for (const f of [12, 13.4]) g.fillRect(X(f), y - 8.6 * s, .4 * s, .8 * s); g.fillStyle = TINTA; g.fillRect(X(14.6), y - 10 * s, .9 * s, .8 * s);
}

/* ---------- plantas vistas de cima ---------- */
function gramaTop(b = '#6fa244', d = '#5f9239', l = '#7fb353') { r(0, 0, AW, AH, b); for (let i = 0; i < 1400; i++) r(rr() * AW, rr() * AH, 2, 1, rr() < .5 ? d : l); }
function casaTop(x, y, w, h, c = '#b5412f', d = '#7e2a22') { r(x + 2, y + 2, w, h, 'rgba(0,0,0,.35)'); r(x, y, w, h, c); r(x, y + h / 2 | 0, w, h - (h / 2 | 0), d); r(x, y + h / 2 - 1 | 0, w, 1, '#efc7a0'); for (let yy = 2; yy < h; yy += 3) r(x, y + yy, w, 1, 'rgba(0,0,0,.16)'); }
function copa(x, y, s = 7, c = '#3f7c34', l = '#5ea048') { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - s + 2, y - s + 3, s * 2, s * 2); r(x - s, y - s, s * 2, s * 2, c); r(x - s + 1, y - s, s, s, l); r(x - s, y + s - 2, s * 2, 2, '#2c5a2a'); }
function trilha(pts, w, c) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.imageSmoothingEnabled = false; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }

/* ---------- cenas ---------- */
const ART = {
  vazio() { r(0, 0, AW, AH, '#141c30'); },
  /* prólogo */
  p_coroa() {
    salaPedra(132); r(120, 0, 80, 132, '#2a2230'); for (let i = 0; i < 4; i++) { r(30 + i * 80 - (i > 1 ? 0 : 0), 0, 14, 132, '#35323b'); }
    r(136, 62, 48, 8, '#4a3a5a'); r(132, 84, 56, 48, '#3a2a48'); r(136, 34, 8, 58, '#3a2a48'); r(176, 34, 8, 58, '#3a2a48'); r(144, 40, 32, 48, '#6a2a3a');
    boneco(160, 132, 4, { t: '#4c4856', p: '#a8a4b0', c: '#8a8690', longo: true, barba: '#9a96a0', coroa: true, saia: true });
    tocha(58, 78); tocha(262, 78); cinzas(70); luz(160, 70, 70, '#6a4a9a', .1); escuro(.28); vinheta();
  },
  p_sineiros() {
    caverna(136); forja(123, 78); sino(160, 16, 3, true);
    const cores = ['#8a3a30', '#3a5a8a', '#4a7a4a', '#c2a050', '#6a4a8a', '#a0603a', '#5a7a8a'];
    cores.forEach((c, i) => { const x = 28 + i * 44 + (i > 2 ? 10 : 0); boneco(x, 158 + (i % 2) * 8, 2, { t: c, t2: '#2a2030', capuz: c }); });
    luz(160, 60, 96, '#e8a040', .09); vinheta();
  },
  p_sono() {
    gradV(0, 118, ['#1a2348', '#2a3460', '#4a4a7a', '#8a5a7a', '#d08a5a']); lua(262, 34, 11); estrelas(70, 80);
    montanha(160, 34, 180, 90, '#3a3648', '#2a2638', '#c8ccd8'); morro(116, '#2a3a30', 8); morro(136, '#1f2c26', 8, .03);
    [34, 74, 116, 204, 246, 288].forEach((x, i) => torreSino(x, 142 + (i % 2) * 6, 13, 20 + i % 3 * 5, '#5c5862', true));
    torreSino(160, 136, 15, 26, '#6a6670', true); vinheta();
  },
  p_silencio() {
    gradV(0, 150, ['#0c0e20', '#14183a', '#1e2448', '#2a2c50']); lua(70, 40, 13); estrelas(90, 110); morro(146, '#141a24', 5);
    torreSino(190, 164, 44, 86, '#4a4650', false); r(0, 164, AW, 16, '#10141c'); cinzas(180); vinheta();
  },
  p_chegada() {
    gradV(0, 110, ['#3a2a58', '#7a3a60', '#c8603e', '#eaa04e', '#f2c878']); morro(92, '#5a4a6a', 9); morro(104, '#3f4a3a', 6);
    torreSino(214, 116, 20, 38, '#6a6670', false);
    for (const [x, w] of [[150, 26], [180, 22], [240, 26], [270, 24]]) { r(x, 100, w, 16, '#7a5a3c'); for (let i = 0; i < w / 2 + 2; i++) r(x + w / 2 - i, 88 + i, i * 2, 2, '#7e2a22'); r(x + 6, 104, 5, 5, '#ffd76a'); }
    morro(116, '#3a5a2e', 3, .05); g.fillStyle = '#8a6a44'; g.beginPath(); g.moveTo(70, 180); g.lineTo(150, 180); g.lineTo(186, 118); g.lineTo(176, 118); g.fill();
    boneco(104, 164, 2, { t: '#3a3a4a', t2: '#2a2a38', capuz: '#2a2a38' }); pinho(30, 170, 74); pinho(286, 172, 84); vinheta();
  },
  chegada() { ART.p_chegada(); },
  derrota() { gradV(0, AH, ['#0c0810', '#1a0c14', '#2a1014']); r(0, 146, AW, 34, '#1a100c'); boneco(160, 170, 2, { t: '#4a3a3a', t2: '#2a2020', p: '#b08a70' }); for (let i = 0; i < 12; i++) r(120 + i * 8, 170, 6, 2, '#6a1a1a'); cinzas(60); vinheta(); },
  /* mapas locais */
  m_vila() {
    gramaTop(); trilha([[70, -5], [92, 40], [84, 86], [110, 130], [100, 186]], 22, '#3f8ccb'); trilha([[70, -5], [92, 40], [84, 86], [110, 130], [100, 186]], 14, '#57a2de');
    trilha([[-5, 92], [150, 92], [326, 92]], 9, '#c7a86c'); trilha([[176, -5], [176, 186]], 7, '#c7a86c'); trilha([[176, 92], [262, 142]], 5, '#c7a86c'); trilha([[176, 92], [252, 42]], 5, '#c7a86c');
    r(74, 85, 28, 15, '#7a5a3c'); for (let i = 0; i < 28; i += 4) r(74 + i, 85, 1, 15, '#54391f');
    r(150, 72, 54, 42, '#a8a29a'); for (let x = 150; x < 204; x += 6) for (let y = 72; y < 114; y += 6) r(x + ((y / 6 | 0) % 2) * 3, y, 1, 6, '#8e8880'), r(x, y, 6, 1, '#8e8880');
    r(170, 82, 14, 14, '#6a6670'); r(172, 84, 10, 10, '#7e2a22'); r(176, 84, 1, 10, '#efc7a0'); r(172, 89, 10, 1, '#efc7a0');
    [[124, 62, 22, 16], [116, 104, 24, 15], [214, 62, 20, 15, '#6a7a8a', '#4a5a6a'], [216, 104, 22, 16], [242, 72, 18, 14, '#7a6a4a', '#5a4a30'], [128, 128, 18, 14], [200, 128, 20, 14, '#7a6a4a', '#5a4a30'], [30, 62, 22, 15], [24, 106, 20, 15, '#7a6a4a', '#5a4a30'], [52, 120, 16, 13], [204, 22, 20, 14], [284, 104, 20, 14, '#6a7a8a', '#4a5a6a']].forEach(a => casaTop(...a));
    casaTop(238, 26, 34, 22, '#8a8690', '#6a6670'); r(252, 18, 6, 10, '#e3e0d4'); r(250, 21, 10, 3, '#e3e0d4');
    casaTop(248, 128, 30, 18, '#3a4a6a', '#2a3a58'); casaTop(120, 34, 28, 20, '#8a5a34', '#6a4224'); r(148, 40, 3, 8, '#333');
    casaTop(126, 150, 24, 14, '#4a4a52', '#36363c'); r(136, 146, 4, 6, '#2a2a30');
    for (let i = 0; i < 26; i++) copa(rr() * AW, rr() < .5 ? rr() * 20 : 158 + rr() * 22, 5 + rr() * 3);
  },
  m_mata() {
    gramaTop('#3a6a34', '#2f5a2c', '#4a7a40'); trilha([[160, 188], [150, 130], [100, 96], [130, 60], [214, 44]], 7, '#8a7248'); trilha([[100, 96], [50, 66]], 5, '#8a7248');
    for (let i = 0; i < 180; i++) { const x = rr() * AW, y = rr() * AH; if (Math.abs(x - 150 + (y - 130) * .2) < 12 && y > 110) continue; copa(x, y, 6 + rr() * 4, rr() < .5 ? '#245028' : '#2e6030', '#3f7c3a'); }
    r(70, 110, 40, 24, '#3a6a34'); casaTop(80, 112, 20, 14, '#6a5a3a', '#4a3e28'); r(90, 104, 3, 7, '#333'); r(38, 58, 26, 18, '#4a4038'); r(45, 62, 12, 9, '#100c08');
    r(202, 36, 24, 16, '#3a6a34'); for (let i = 0; i < 4; i++) r(206 + i * 5, 40, 2, 6, '#b8b0a0');
  },
  m_toca() {
    r(0, 0, AW, AH, '#2a2520'); for (let i = 0; i < 300; i++) r(rr() * AW, rr() * AH, 12, 4, rr() < .5 ? '#352e27' : '#211c18');
    const c = '#5a4c3c'; trilha([[160, 186], [160, 130], [110, 96], [160, 60]], 22, c); trilha([[110, 96], [56, 110]], 16, c); trilha([[160, 60], [260, 74]], 14, c);
    g.fillStyle = c; g.beginPath(); g.ellipse(170, 56, 52, 30, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(56, 112, 28, 20, 0, 0, 7); g.fill();
    for (let i = 0; i < 70; i++) { const x = 118 + rr() * 104, y = 34 + rr() * 44; r(x, y, 3, 1, '#4a3e30'); }
    r(160, 50, 12, 10, '#e8743a'); r(163, 52, 6, 6, '#f2c14e'); for (let i = 0; i < 4; i++) r(40 + i * 8, 100, 2, 20, '#3a3a40'); r(38, 100, 34, 2, '#3a3a40');
    r(264, 68, 26, 14, '#0c0806'); escuro(.12);
  },
  m_abadia() {
    gramaTop('#67804a', '#58703f', '#789255'); trilha([[160, 188], [160, 120]], 8, '#9a8a6a');
    r(70, 40, 180, 98, '#8c8678'); for (let i = 0; i < 90; i++) r(70 + rr() * 170, 40 + rr() * 90, 8, 4, rr() < .5 ? '#7c7668' : '#9a9486');
    for (const [x, y, w, h] of [[70, 40, 180, 6], [70, 40, 6, 98], [244, 40, 6, 98], [70, 132, 74, 6], [176, 132, 74, 6], [190, 40, 6, 58], [190, 92, 54, 6]]) r(x, y, w, h, '#5c5862');
    r(90, 54, 80, 36, '#3a3640'); r(90, 54, 80, 3, '#7c7882'); for (let x = 96; x < 166; x += 12) r(x, 62, 4, 22, '#6a6670'); r(150, 60, 16, 22, '#b98a3a');
    r(206, 56, 28, 24, '#26222a'); r(214, 62, 12, 12, '#0c0a10'); for (let i = 0; i < 16; i++) copa(rr() * AW, rr() < .5 ? rr() * 30 : 146 + rr() * 34, 5 + rr() * 3, '#4a6a3a', '#5e8048');
    r(120, 104, 40, 18, '#7a7468'); for (let i = 0; i < 6; i++) r(122 + i * 6, 106, 3, 12, '#b8b0a0');
  },
  m_cripta() {
    r(0, 0, AW, AH, '#17141c'); const c = '#3a3640';
    trilha([[40, 158], [40, 90], [160, 90], [270, 90]], 24, c); trilha([[160, 90], [160, 36]], 20, c);
    r(236, 58, 70, 64, c); r(120, 18, 80, 40, c);
    for (let x = 60; x < 230; x += 22) { r(x, 74, 10, 6, '#6a6670'); r(x, 100, 10, 6, '#6a6670'); }
    r(262, 80, 30, 20, '#6a6670'); r(274, 72, 6, 6, '#7a2a9a'); luz(277, 86, 46, '#8a3aba', .1);
    for (let i = 0; i < 14; i++) ossos(124 + rr() * 56, 24 + rr() * 26); escuro(.1);
  },
  /* Vau-Claro */
  praca() {
    gradV(0, 100, ['#3a2a58', '#6a3a60', '#b0603e', '#e8a050']); morro(92, '#4a4a5a', 5);
    torreSino(160, 122, 32, 62, '#6a6670', false);
    for (const [x, w] of [[20, 50], [80, 40], [218, 44], [266, 56]]) { r(x, 88, w, 34, '#7a5a3c'); for (let i = 0; i < w / 2 + 3; i++) r(x + w / 2 - i, 68 + i * .8, i * 2, 2, '#7e2a22'); r(x + 10, 96, 7, 8, '#ffd76a'); }
    chao(122, '#6a6660', '#524e4a', '#7c7872');
    [[60, 150], [90, 158], [118, 146], [206, 152], [236, 160]].forEach(([x, y], i) => boneco(x, y, 2, { t: ['#6a4a3a', '#4a5a4a', '#5a4a6a', '#6a5a3a', '#4a5a6a'][i], c: ['#3a2412', '#8a8680', '#6a3a18', '#2a1a10', '#b8a080'][i], saia: i % 2 === 1 }));
    cinzas(50); vinheta();
  },
  campanario() {
    pedras(0, 0, AW, AH, '#403c48', '#2c2a32', '#504c58');
    for (let i = 0; i < 12; i++) { r(40 + i * 18, 160 - i * 12, 22, 5, '#5c4a34'); r(40 + i * 18, 165 - i * 12, 3, 170, '#3a2c20'); }
    r(280, 0, 3, 120, '#8a7a5a'); janela(52, 40, 16, 26, '#3a3a6a'); tocha(180, 110); boneco(84, 134, 2, { t: '#3a3a4a', capuz: '#2a2a38' }); vinheta();
  },
  sala_sino() {
    pedras(0, 0, AW, AH, '#4a4650', '#35323b', '#5c5862'); tabuas(0, 0, AW, 18, '#3a2412', '#23140a', '#4a2e18', false);
    gradV(0, 0, ['#000']); r(20, 40, 44, 80, '#26264a'); r(256, 40, 44, 80, '#26264a'); estrelas(0, 0); r(0, 136, AW, 44, '#3a2c20'); for (let x = 0; x < AW; x += 22) r(x, 136, 1, 44, '#2a2016');
    r(150, 18, 20, 24, '#4a2e18'); sino(160, 40, 6, false);
    r(138, 150, 12, 4, '#1a1014'); r(174, 158, 8, 3, '#1a1014'); r(112, 162, 5, 3, '#2a1a10'); r(120, 170, 5, 3, '#2a1a10'); r(104, 152, 5, 3, '#2a1a10');
    luz(160, 86, 70, '#c8b070', .05); vinheta();
  },
  taverna() {
    salaMadeira(116); forja; r(30, 42, 74, 74, '#3a342c'); r(40, 72, 54, 44, '#1a0c06'); r(46, 96, 42, 20, '#e8743a'); r(54, 102, 26, 14, '#f2c14e'); luz(67, 100, 70, '#e8702a', .1);
    r(26, 38, 82, 6, '#5c3a20'); r(150, 56, 150, 4, '#3a2412'); for (let i = 0; i < 7; i++) { r(158 + i * 19, 40 + (i % 2) * 2, 7, 15, ['#5a2a2a', '#2a5a3a', '#7a6a2a'][i % 3]); }
    mesa(44, 142, 64); caneca(60, 137); caneca(82, 137); boneco(36, 166, 2, { t: '#4a5a3a', c: '#3a2412', barba: '#3a2412' }); boneco(120, 166, 2, { t: '#6a4a3a', c: '#8a8680' });
    mesa(150, 122, 150); barril(286, 98); barril(270, 104); boneco(214, 122, 2, { t: '#8a3a30', t2: '#5a2a20', c: '#b0482a', longo: true, saia: true }); vinheta();
  },
  balcao() {
    salaMadeira(112); estante; r(0, 34, AW, 3, '#3a2412'); r(0, 74, AW, 3, '#3a2412'); for (let i = 0; i < 16; i++) { r(10 + i * 19, 16 + (i % 3), 7, 18, ['#5a2a2a', '#2a5a3a', '#7a6a2a', '#3a3a6a'][i % 4]); r(14 + i * 19, 56, 8, 18, ['#7a6a2a', '#5a2a2a', '#2a5a3a'][i % 3]); }
    boneco(160, 136, 5, { t: '#8a3a30', t2: '#5a2a20', c: '#b0482a', longo: true, saia: true }); tabuas(0, 116, AW, 64, '#6a4228', '#3f2614', '#7d5233', false); r(0, 114, AW, 4, '#8a5a34'); caneca(90, 108); caneca(226, 108); vela(50, 108); vinheta();
  },
  mesa() {
    salaMadeira(104); janela(232, 26, 50, 40, '#26264a'); mesa(70, 124, 180); [110, 150, 200].forEach(x => caneca(x, 119)); r(128, 120, 30, 3, '#d8c8a0'); r(136, 116, 2, 8, '#a02a2a');
    boneco(160, 140, 5, { t: '#4a5a3a', t2: '#2a3a2a', c: '#3a2412', barba: '#4a2e18' }); boneco(60, 170, 3, { t: '#5a4a3a', c: '#6a4a2a' }); r(236, 76, 2, 50, '#6a4228'); g.strokeStyle = '#c8b890'; vinheta();
  },
  quarto() { salaMadeira(114); janela(218, 28, 46, 42, '#1e2448'); lua(0, 0, 0); cama(40, 134); mesa(186, 134, 50); vela(206, 129); r(120, 130, 30, 22, '#5c3a20'); r(120, 136, 30, 2, '#7a5a3a'); luz(206, 120, 60, '#e8a040', .05); escuro(.18); vinheta(); },
  burgomestre() {
    salaMadeira(120); estante(18, 20, 74, 100); estante(228, 20, 74, 100); janela(132, 22, 56, 44, '#b0603e'); mesa(96, 132, 128); r(130, 126, 26, 6, '#d8c8a0'); vela(190, 127); r(166, 124, 8, 8, '#2a2a3a');
    boneco(160, 150, 5, { t: '#3a3a5a', t2: '#2a2a48', c: '#b8b0a8', barba: '#b8b0a8', cinto: '#e3b04b' }); vinheta();
  },
  templo() {
    salaPedra(126); r(120, 0, 80, 126, '#35323b'); janela(136, 12, 48, 70, '#d8a050'); r(136, 44, 48, 2, '#2a1a0e'); r(0, 86, 0, 0, '#000'); luz(160, 50, 90, '#e8c070', .08);
    altar(124, 100); sino(160, 72, 2, true); vela(132, 92); vela(186, 92);
    for (let i = 0; i < 4; i++) { r(18, 132 + i * 11, 96, 5, '#5c3a20'); r(206, 132 + i * 11, 96, 5, '#5c3a20'); } boneco(246, 168, 5, { t: '#d8d0bc', t2: '#b0a890', capuz: '#b98a3a', saia: true, p: '#c8a080' }); boneco(84, 130, 2, { t: '#5a4a3a', c: '#3a2c20' }); vinheta();
  },
  ferraria() { salaPedra(122); forja(214, 66); bigorna(114, 134); r(40, 34, 90, 4, '#3a2412'); for (let i = 0; i < 6; i++) { r(46 + i * 14, 38, 3, 26, '#9aa2ae'); r(44 + i * 14, 62, 7, 2, '#5c3a20'); } boneco(84, 172, 5, { t: '#4a3a2a', t2: '#7a5a3a', c: '#2a1a10', barba: '#2a1a10', p: '#c8946c' }); barril(30, 136); vinheta(); },
  /* Mata dos Espinhos */
  trilha() {
    gradV(0, 90, ['#1a2a28', '#24403a', '#35584a']); for (let i = 0; i < 9; i++) pinho(rr() * AW, 118, 78, '#14302a', '#1f4a3c'); morro(112, '#23402c', 4); r(0, 124, AW, 56, '#2f5a2c');
    g.fillStyle = '#7a6444'; g.beginPath(); g.moveTo(112, 180); g.lineTo(200, 180); g.lineTo(168, 116); g.lineTo(152, 116); g.fill();
    for (let i = 0; i < 6; i++) { arvore(rr() * 90, 176 - rr() * 30, 54, '#245028', '#14301a', '#2f6a34'); arvore(230 + rr() * 90, 176 - rr() * 30, 54, '#245028', '#14301a', '#2f6a34'); } vinheta();
  },
  lobos() { ART.trilha(); lobo(120, 158, 3, 1); lobo(206, 150, 3, -1); lobo(166, 136, 2, 1); escuro(.16); vinheta(); },
  cabana() {
    gradV(0, 100, ['#1f2c3a', '#3a4a50', '#5a6a58']); for (let i = 0; i < 10; i++) pinho(rr() * AW, 120, 90, '#1a3a2c', '#28503a'); r(0, 118, AW, 62, '#37602f');
    r(90, 74, 110, 56, '#5c3f28'); for (let y = 74; y < 130; y += 7) r(90, y, 110, 1, '#3a2614'); for (let i = 0; i < 62; i++) r(145 - i, 34 + i * .7, i * 2, 2, '#6a7a44'); r(176, 34, 10, 26, '#4a4650'); porta(132, 96, 24, 34); janela(106, 92, 14, 12, '#ffd76a'); janela(170, 92, 14, 12, '#ffd76a');
    boneco(234, 172, 5, { t: '#5a6a4a', t2: '#3a4a30', c: '#c8c8c0', longo: true, saia: true, cajado: true, p: '#c8a888' }); vinheta();
  },
  /* Toca dos Dentes-Partidos */
  toca_entrada() {
    gradV(0, 110, ['#1a2a28', '#24403a', '#35584a']); morro(70, '#3a3026', 9); r(100, 58, 120, 80, '#0c0806'); for (let i = 0; i < 9; i++) { r(102 + i * 13, 58, 7, 12 + (i % 3) * 5, '#d8d0bc'); } r(0, 136, AW, 44, '#3f5a30'); tocha(84, 84); tocha(236, 84); goblin(70, 170, 5); ossos(238, 160); r(120, 40, 80, 16, '#3a3026'); vinheta();
  },
  toca_salao() {
    caverna(126); r(136, 76, 48, 50, '#5c3a20'); r(130, 70, 60, 8, '#7a4f2c'); ossos(142, 66); for (let i = 0; i < 4; i++) r(138 + i * 13, 58, 4, 14, '#d8d0bc');
    goblin(160, 128, 7); r(70, 140, 40, 12, '#1a0c06'); r(76, 136, 28, 8, '#e8743a'); r(84, 132, 12, 6, '#f2c14e'); luz(90, 134, 74, '#e8702a', .11); [[44, 170], [122, 164], [228, 166], [270, 174]].forEach(([x, y]) => goblin(x, y, 2)); barril(250, 112); vinheta();
  },
  toca_jaula() { caverna(130); r(0, 0, 0, 0, '#000'); for (let x = 90; x < 232; x += 13) r(x, 50, 4, 104, '#3a3a40'); r(84, 48, 154, 5, '#4a4a52'); r(84, 152, 154, 5, '#4a4a52'); boneco(160, 156, 4, { t: '#8a7a5a', c: '#7a4a1a', longo: true, saia: true, p: '#e0b48c' }); tocha(46, 88); r(262, 96, 30, 44, '#0a0806'); vinheta(); },
  /* Abadia de Vael */
  patio() {
    gradV(0, 110, ['#1e2238', '#2a2c50', '#4a4466', '#6a5a70']); lua(258, 36, 12); estrelas(60, 70); pedras(0, 66, 76, 68, '#5c5862', '#42404a', '#6e6a74'); pedras(240, 50, 80, 84, '#5c5862', '#42404a', '#6e6a74');
    for (let i = 0; i < 8; i++) r(rr() * 76, 66, 8, 6 + rr() * 16, '#2a2c50'); for (let x = 96; x < 228; x += 34) { r(x, 62, 12, 72, '#6a6670'); r(x - 4, 58, 20, 5, '#7c7882'); } r(100, 58, 104, 4, '#7c7882');
    r(0, 134, AW, 46, '#44503a'); for (let i = 0; i < 40; i++) r(rr() * AW, 134 + rr() * 46, 3, 2, '#566648'); esqueleto(116, 176, 4); esqueleto(208, 170, 4); cinzas(40); vinheta();
  },
  capela() {
    salaPedra(128); r(102, 10, 116, 118, '#26222c'); janela(126, 14, 68, 62, '#5a3a8a'); for (let i = 0; i < 6; i++) r(128 + i * 11, 16, 7, 58, ['#8a3a50', '#3a5a9a', '#b98a3a'][i % 3]); altar(124, 100, 72); sino(160, 82, 1, true);
    for (let i = 0; i < 7; i++) { sino(22 + i * 20 + (i > 3 ? 120 : 0), 40 + (i % 2) * 8, 1, false); } r(0, 0, 0, 0, '#000'); for (let i = 0; i < 3; i++) r(40 + i * 90, 150 + i * 2, 36, 6, '#3a2412'); luz(160, 50, 80, '#8a5ad0', .07); cinzas(30); vinheta();
  },
  cripta() {
    pedras(0, 0, AW, AH, '#3a3640', '#26232b', '#4a4650'); for (let i = 0; i < 5; i++) { const x = 36 + i * 56; r(x - 10, 0, 76, 16, '#26232b'); g.fillStyle = '#17141c'; g.beginPath(); g.ellipse(x + 28, 94, 24, 56, 0, 0, 7); g.fill(); } chao(132, '#2c2830', '#1e1b22', '#3a3640');
    [64, 176].forEach(x => { r(x - 8, 122, 54, 16, '#6a6670'); r(x - 10, 118, 58, 5, '#7c7882'); }); tocha(120, 72); tocha(232, 72); escuro(.2); vinheta();
  },
  ossuario() { pedras(0, 0, AW, AH, '#403a3a', '#2c2828', '#524a4a'); for (let y = 8; y < 118; y += 12) for (let x = 2; x < AW; x += 14) { r(x, y, 10, 8, '#c8c0ac'); r(x + 2, y + 3, 2, 2, '#1a1410'); r(x + 6, y + 3, 2, 2, '#1a1410'); } chao(122, '#2c2628', '#1e1a1c', '#3a3434'); for (let i = 0; i < 9; i++) ossos(rr() * 290, 136 + rr() * 34); esqueleto(100, 170, 5); esqueleto(212, 174, 5); tocha(160, 60); escuro(.24); vinheta(); },
  altar_cinza() {
    pedras(0, 0, AW, AH, '#2c2838', '#1e1a28', '#3a3648'); chao(128, '#201c28', '#141018', '#2c2838'); altar(120, 104, 80); r(150, 92, 20, 12, '#3a3a40'); r(158, 84, 4, 12, '#3a3a40'); r(154, 94, 12, 6, '#3a3a40'); luz(160, 94, 110, '#8a3aba', .1);
    g.strokeStyle = '#b060e0'; g.lineWidth = 1; g.beginPath(); g.arc(160, 150, 60, 0, 7); g.stroke(); g.beginPath(); g.ellipse(160, 150, 90, 20, 0, 0, 7); g.stroke();
    boneco(160, 160, 5, { t: '#2a2030', capuz: '#4a2f62', saia: true, p: '#c8b8b0', cajado: true, olhos: '#c060f0' }); esqueleto(70, 172, 3); esqueleto(250, 172, 3); vela(70, 110); vela(248, 110); cinzas(90); vinheta();
  },
  sino_final() {
    gradV(0, 120, ['#3a5a90', '#7a8ab0', '#e8a878', '#f8d898']); r(20, 40, 0, 0, '#000'); luz(160, 40, 140, '#f8d898', .05); pedras(0, 120, AW, 60, '#6a6670', '#4a4650', '#7c7882'); r(0, 0, 30, 120, '#4a4650'); r(290, 0, 30, 120, '#4a4650'); r(0, 0, AW, 12, '#3a2412');
    r(152, 12, 16, 16, '#4a2e18'); sino(160, 26, 5, true); for (let i = 0; i < 5; i++) { g.strokeStyle = '#fff0b0'; g.globalAlpha = .4 - i * .06; g.beginPath(); g.arc(160, 60, 66 + i * 18, 0, 7); g.stroke(); } g.globalAlpha = 1; boneco(96, 172, 3, { t: '#3a3a4a', capuz: null, c: '#4a2e18' }); boneco(226, 172, 2, { t: '#d8d0bc', capuz: '#b98a3a', saia: true }); vinheta();
  },
  /* crônicas */
  l_mundo() { gradV(0, AH, ['#1a2a48', '#2a4a78', '#3a6a9a']); morro(120, '#3f7c44', 12); morro(138, '#5f8a4a', 8); montanha(120, 40, 120, 80); montanha(220, 56, 90, 64); arvore(50, 160, 44); arvore(270, 166, 50); vinheta(); },
  l_deuses() { gradV(0, AH, ['#141034', '#2a2058', '#4a2a78']); estrelas(120, 180); sino(60, 56, 2); r(146, 56, 28, 8, '#8a8a92'); r(156, 64, 8, 28, '#6a4228'); r(242, 60, 18, 18, '#6aa04a'); r(248, 78, 6, 18, '#4a7030'); g.fillStyle = '#9a94a0'; g.beginPath(); g.arc(160, 134, 14, 0, 7); g.fill(); vinheta(); },
  l_faccoes() { salaPedra(126); [70, 160, 250].forEach((x, i) => { r(x - 22, 18, 44, 92, ['#b98a3a', '#3a3648', '#8a2a24'][i]); r(x - 22, 106, 22, 12, ['#b98a3a', '#3a3648', '#8a2a24'][i]); r(x, 106, 22, 12, ['#b98a3a', '#3a3648', '#8a2a24'][i]); }); sino(70, 38, 2); r(150, 46, 20, 20, '#a8a4a0'); goblin(250, 86, 3, false); vinheta(); },
};
