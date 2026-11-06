'use strict';
/* Mapa do mundo em pixel art: terreno, rios, reinos, estradas, névoa, câmera e ferramentas. */
/* ===== Escala: 1 tile = 6 milhas = 9 km. Ritmos de viagem do Livro do Jogador em km (1 milha = 1,5 km). ===== */
const W = 240, H = 160, TS = 8, PW = W * TS, PH = H * TS, N = W * H;
const KM = 9, SHIP_KM_DAY = 72;
const SEA = 0.4, BEACH = 0.418, LAKE_D = 0.016;
const STORE = 'os-sete-sinos-v1';
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a) {
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function makeNoise(rnd) {
  const size = 256, g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const at = (x, y) => g[(y & 255) * size + (x & 255)];
  const value = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y, oct) => { let s = 0, amp = 1, tot = 0; for (let o = 0; o < oct; o++) { s += value(x, y) * amp; tot += amp; amp *= .5; x *= 2.03; y *= 2.03; } return s / tot; };
}
class Heap {
  constructor() { this.v = []; this.k = []; }
  get size() { return this.v.length; }
  push(v, k) {
    const a = this.v, b = this.k; let i = a.length; a.push(v); b.push(k);
    while (i > 0) { const p = (i - 1) >> 1; if (b[p] <= k) break; a[i] = a[p]; b[i] = b[p]; i = p; }
    a[i] = v; b[i] = k;
  }
  pop() {
    const a = this.v, b = this.k, top = a[0], v = a.pop(), k = b.pop(), n = a.length;
    if (n) {
      let i = 0;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && b[c + 1] < b[c]) c++; if (b[c] >= k) break; a[i] = a[c]; b[i] = b[c]; i = c; }
      a[i] = v; b[i] = k;
    }
    return top;
  }
}

/* ===== Biomas ===== */
const B = { DEEP: 0, SHALLOW: 1, SAND: 2, GRASS: 3, FOREST: 4, TAIGA: 5, JUNGLE: 6, SAVANNA: 7, SWAMP: 8, DESERT: 9, SNOW: 10, HILLS: 11, MTN: 12, PEAK: 13, LAKE: 14 };
const BIOME = [
  { n: 'Mar profundo', p: ['#1b3f78'] },
  { n: 'Mar costeiro', p: ['#2d6fb5'] },
  { n: 'Praia', p: ['#e7d08d', '#dcc27a', '#f0dea4'] },
  { n: 'Planície', p: ['#7cb44c', '#6fa643', '#8cc158'] },
  { n: 'Floresta', p: ['#4a8a3c', '#417e35', '#559843'] },
  { n: 'Taiga', p: ['#5f8b66', '#54805b', '#6c9872'] },
  { n: 'Selva', p: ['#2f8a48', '#287c3f', '#3a9852'] },
  { n: 'Savana', p: ['#c4b45c', '#b6a64f', '#d1c26b'] },
  { n: 'Pântano', p: ['#5f7746', '#536a3d', '#6c8450'] },
  { n: 'Deserto', p: ['#e0ac62', '#d39e54', '#ebbb75'] },
  { n: 'Neve', p: ['#dde6ec', '#ccd8e2', '#edf2f6'] },
  { n: 'Colinas', p: ['#8c9c56', '#7f8f4c', '#9aaa62'] },
  { n: 'Montanha', p: ['#7d746b', '#6e665e', '#8c8378'] },
  { n: 'Picos', p: ['#8f8c8a', '#7f7c7a', '#a09d9a'] },
  { n: 'Lago', p: ['#3f8ccb', '#3a82c0', '#4797d6'] },
];
const SEA_BANDS = ['#173768', '#1b3f78', '#1f4a8a', '#26599f', '#2d6fb5', '#3a84c8'];
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const u32 = (r, g, b) => (255 << 24 | clamp(b, 0, 255) << 16 | clamp(g, 0, 255) << 8 | clamp(r, 0, 255)) >>> 0;
const hex32 = h => { const c = rgb(h); return u32(c[0], c[1], c[2]); };

let w = null;  // dados do mundo gerado
const terrainC = newCanvas(PW, PH), realmC = newCanvas(PW, PH), roadC = newCanvas(PW, PH), hexC = newCanvas(PW, PH);
const fogC = newCanvas(W * 3, H * 3), miniBase = newCanvas(W, H);
const SEED = 'valdren';

function biomeOf(e, m, t, q) {
  if (e < SEA) return e < q.deep ? B.DEEP : B.SHALLOW;
  if (e < BEACH) return t < .06 ? B.SNOW : B.SAND;
  if (e >= q.peak) return B.PEAK;
  if (e >= q.mtn) return B.MTN;
  if (t < .06) return B.SNOW;
  if (e >= q.hills) return B.HILLS;
  if (t < .24) return m > .3 ? B.TAIGA : B.GRASS;
  if (t < .7) return m < .2 ? B.SAVANNA : m < .52 ? B.GRASS : m < .9 ? B.FOREST : B.SWAMP;
  return m < .42 ? B.DESERT : m < .62 ? B.SAVANNA : m < .9 ? B.JUNGLE : B.SWAMP;
}
const rankNormalize = (f, keep) => {
  const idx = []; for (let i = 0; i < N; i++) if (keep(i)) idx.push(i);
  const sorted = idx.map(i => f[i]).sort((a, b) => a - b);
  const lut = v => { let lo = 0, hi = sorted.length - 1; while (lo < hi) { const c = (lo + hi) >> 1; if (sorted[c] < v) lo = c + 1; else hi = c; } return lo / sorted.length; };
  for (let i = 0; i < N; i++) f[i] = lut(f[i]);
};

const distSeg = (x, y, a, b, c, d) => { const vx = c - a, vy = d - b, t = clamp(((x - a) * vx + (y - b) * vy) / (vx * vx + vy * vy), 0, 1); return Math.hypot(x - a - vx * t, y - b - vy * t); };
/* Valdren é fixo: GEO (campanha.js) define terras, serras, rio e matas; o ruído só dá textura */
function genFields() {
  const rnd = mulberry(hashStr(SEED)), noise = makeNoise(rnd);
  const e = new Float32Array(N), m = new Float32Array(N), t = new Float32Array(N);
  const o = Array.from({ length: 10 }, () => rnd() * 200);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / H, v = y / H, nx = x / W, ny = y / H;
    const wx = noise(u * 2.2 + o[0], v * 2.2 + o[1], 3) - .5, wy = noise(u * 2.2 + o[2], v * 2.2 + o[3], 3) - .5;
    const base = noise(u * 3.1 + wx * 1.6 + o[4], v * 3.1 + wy * 1.6 + o[5], 6);
    let mask = 0;
    for (const [bx, by, br] of GEO.terras) { const dx = (nx - bx + wx * .12) * 1.5, dy = ny - by + wy * .12; mask = Math.max(mask, 1 - Math.hypot(dx, dy) / br); }
    const border = clamp(Math.min(x, W - 1 - x, y, H - 1 - y) / 16, 0, 1);
    e[y * W + x] = (base * .85 + clamp(mask, -.6, 1) * .85) * (border * .7 + .3) - (1 - border) * .35;
    m[y * W + x] = noise(u * 3.6 + o[6], v * 3.6 + o[7], 5);
    t[y * W + x] = ny + (noise(u * 2.6 + o[8], v * 2.6 + o[9], 4) - .5) * .4;
  }
  const sorted = Float32Array.from(e).sort(), lvl = sorted[N * .55 | 0], top = sorted[N - 1], bot = sorted[0];
  for (let i = 0; i < N; i++) e[i] = e[i] < lvl ? (e[i] - bot) / (lvl - bot) * SEA : SEA + (e[i] - lvl) / (top - lvl) * .1;
  rankNormalize(m, () => true);
  rankNormalize(t, () => true);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    for (const [cx, cy, cr] of GEO.matas) m[i] = clamp(m[i] + Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / cr / cr)) * .55, 0, .86);
    for (const [cx, cy, cr] of GEO.secos) m[i] = clamp(m[i] - Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / cr / cr)) * .9, 0, 1);
    if (e[i] < SEA) continue;
    let serra = 0; for (const [a, b, c, d, wd] of GEO.serras) serra = Math.max(serra, Math.exp(-((distSeg(x, y, a, b, c, d) / wd) ** 2)));
    const cr = 1 - Math.abs(2 * noise(x / H * 5.5 + o[1], y / H * 5.5 + o[3], 4) - 1);
    e[i] += serra * (.2 + cr * .22);
    for (const [cx, cy, wd] of GEO.colinas) e[i] += Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / wd / wd)) * .05;
    let leito = 1e9; for (let k = 0; k + 1 < GEO.rio.length; k++) leito = Math.min(leito, distSeg(x, y, ...GEO.rio[k], ...GEO.rio[k + 1]));
    e[i] -= Math.exp(-((leito / 3) ** 2)) * .03 * clamp(1 - serra, .3, 1);
    if (e[i] < SEA + (leito < 7 ? .024 : .002)) e[i] = SEA + (leito < 7 ? .024 : .002);
  }
  for (let i = 0; i < N; i++) t[i] = clamp(t[i] - Math.max(0, e[i] - .55) * .9, 0, 1);
  return { e, m, t, rnd };
}

function genWater(f) {
  const { e } = f;
  const ocean = new Uint8Array(N), filled = new Float32Array(N), parent = new Int32Array(N).fill(-1), seen = new Uint8Array(N);
  // oceano = água ligada à borda do mapa
  const st = [];
  for (let x = 0; x < W; x++) st.push(x, N - W + x);
  for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) {
    const i = st.pop(); if (ocean[i] || e[i] >= SEA) continue; ocean[i] = 1;
    const x = i % W; if (x > 0) st.push(i - 1); if (x < W - 1) st.push(i + 1); if (i >= W) st.push(i - W); if (i < N - W) st.push(i + W);
  }
  for (let i = 0; i < N; i++) if (!ocean[i] && e[i] < SEA) e[i] = SEA + .001;
  // priority-flood: dá a cada tile uma descida garantida até o mar e preenche as depressões (lagos)
  const heap = new Heap(), order = [];
  for (let i = 0; i < N; i++) if (ocean[i]) { seen[i] = 1; filled[i] = e[i]; heap.push(i, e[i]); }
  while (heap.size) {
    const c = heap.pop(), x = c % W, y = c / W | 0;
    if (!ocean[c]) order.push(c);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx; if (seen[n]) continue; seen[n] = 1;
      filled[n] = Math.max(e[n], filled[c] + 1e-5); parent[n] = c; heap.push(n, filled[n]);
    }
  }
  const lakeD = new Float32Array(N), lake = new Uint8Array(N), flow = new Float32Array(N), cabeceira = GEO.rio[0][1] * W + GEO.rio[0][0];
  for (let i = 0; i < N; i++) if (!ocean[i]) { lakeD[i] = filled[i] - e[i]; if (lakeD[i] > LAKE_D) lake[i] = 1; }
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k]; flow[i] += .4 + f.m[i] + (i === cabeceira ? 900 : 0); if (parent[i] >= 0) flow[parent[i]] += flow[i];
  }
  return { ocean, lake, lakeD, parent, flow };
}

/* ===== Nomes e textos gerados ===== */
const PT = {
  capital: { label: 'Capital', spr: 'castle', pop: [18000, 42000], rank: 4 },
  cidade: { label: 'Cidade', spr: 'town', pop: [5000, 14000], rank: 3 },
  porto: { label: 'Porto', spr: 'port', pop: [1500, 7000], rank: 3 },
  vila: { label: 'Vila', spr: 'village', pop: [300, 1800], rank: 2 },
  forte: { label: 'Fortaleza', spr: 'fort', pop: [120, 600], rank: 2 },
  templo: { label: 'Santuário', spr: 'temple', rank: 1 },
  torre: { label: 'Torre arcana', spr: 'tower', rank: 1 },
  ruina: { label: 'Ruína', spr: 'ruin', rank: 1 },
  masmorra: { label: 'Masmorra', spr: 'cave', rank: 1 },
  covil: { label: 'Covil', spr: 'lair', rank: 1 },
  marco: { label: 'Marcador', spr: 'flag', rank: 2 },
  mata: { label: 'Floresta', spr: 'grove', rank: 2 },
  sino: { label: 'Torre de sino', spr: 'belltower', rank: 2 },
};
const ENCOUNTERS = {
  floresta: ['2d4 lobos famintos', 'Um urso-coruja caçando', '1d6 goblins armando uma emboscada', 'Uma dríade que exige respeito à floresta', 'Um grupo de lenhadores perdidos', '1d4 aranhas gigantes', 'Um batedor élfico desconfiado', 'Um círculo de cogumelos que atrai quem dorme perto'],
  planicie: ['2d6 bandidos cobrando pedágio', 'Uma caravana pedindo escolta', '1d4 worgs com cavaleiros goblins', 'Um cavaleiro andante em busca de duelo', 'Uma manada de bisões em disparada', '1d3 ogros saqueadores', 'Peregrinos com um ferido grave', 'Um centauro mensageiro'],
  montanha: ['1d4 harpias', 'Um gigante da colina procurando comida', 'Uma avalanche bloqueia a passagem', '1d6 orcs vigiando o desfiladeiro', 'Um grifo disputa a carcaça de um cavalo', 'Anões prospectores presos em uma mina', '1d4 cabras gigantes', 'Uma mantícora na crista'],
  pantano: ['1d6 homens-lagarto caçando', 'Uma bruxa verde disfarçada de velha', '2d4 sapos gigantes', 'Fogos-fátuos atraem o grupo para fora da trilha', 'Um crocodilo gigante', 'Uma névoa tóxica (TR de Con CD 12)', '1d4 ghouls em uma cabana afundada', 'Um barqueiro que aceita lembranças como pagamento'],
  deserto: ['Uma tempestade de areia (viagem perde meio dia)', '1d4 escorpiões gigantes', 'Uma caravana de nômades oferece água', '1d3 gnolls seguindo o rastro do grupo', 'Uma múmia em um túmulo exposto pelo vento', 'Um oásis que é ilusão', 'Uma lâmia em ruínas antigas', 'Um cavaleiro da areia sem montaria'],
  frio: ['2d4 lobos invernais', 'Um yeti defendendo sua caça', 'Uma nevasca (TR de Con CD 12 ou 1 de exaustão)', 'Caçadores perdidos no gelo', 'Um gigante do gelo cobrando passagem', 'Gelo fino sobre um lago escondido', '1d4 ursos polares', 'Um acampamento abandonado, ainda aquecido'],
  mar: ['Uma nau pirata no horizonte', 'Uma tempestade repentina', '1d4 sahuagin escalam o casco', 'Destroços com um sobrevivente', 'Uma sereia canta à noite', 'Um tubarão gigante segue o navio', 'Uma ilha que não consta nas cartas', 'Calmaria: a viagem atrasa 1d3 dias'],
};
const ENC_GROUP = { [B.FOREST]: 'floresta', [B.JUNGLE]: 'floresta', [B.TAIGA]: 'floresta', [B.GRASS]: 'planicie', [B.SAVANNA]: 'planicie', [B.SAND]: 'planicie', [B.HILLS]: 'montanha', [B.MTN]: 'montanha', [B.PEAK]: 'montanha', [B.SWAMP]: 'pantano', [B.DESERT]: 'deserto', [B.SNOW]: 'frio', [B.DEEP]: 'mar', [B.SHALLOW]: 'mar', [B.LAKE]: 'mar' };

/* ===== Caminhos ===== */
const gScore = new Float64Array(N), cameFrom = new Int32Array(N), stamp = new Uint32Array(N);
let stampN = 0;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
function astar(s, g, cost, hMin) {
  stampN++;
  const h = new Heap(), gx = g % W, gy = g / W | 0;
  gScore[s] = 0; stamp[s] = stampN; cameFrom[s] = -1; h.push(s, 0);
  while (h.size) {
    const c = h.pop(); if (c === g) break;
    const cx = c % W, cy = c / W | 0;
    for (const [dx, dy, dd] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx, step = cost(c, n); if (step === Infinity) continue;
      const ng = gScore[c] + dd * step;
      if (stamp[n] !== stampN || ng < gScore[n]) {
        gScore[n] = ng; stamp[n] = stampN; cameFrom[n] = c;
        const ax = Math.abs(nx - gx), ay = Math.abs(ny - gy);
        h.push(n, ng + hMin * (Math.max(ax, ay) + .414 * Math.min(ax, ay)));
      }
    }
  }
  if (stamp[g] !== stampN) return null;
  const path = []; for (let c = g; c !== -1; c = cameFrom[c]) path.push(c);
  return path.reverse();
}
const ROAD_COST = { [B.SAND]: 1.2, [B.GRASS]: 1, [B.SAVANNA]: 1, [B.FOREST]: 1.6, [B.TAIGA]: 1.7, [B.JUNGLE]: 2.4, [B.DESERT]: 1.8, [B.SNOW]: 2.2, [B.SWAMP]: 3, [B.HILLS]: 2.3, [B.MTN]: 7, [B.PEAK]: 16 };
const TRAVEL_MUL = { [B.SAND]: 1, [B.GRASS]: 1, [B.SAVANNA]: 1, [B.FOREST]: 2, [B.TAIGA]: 2, [B.JUNGLE]: 2, [B.DESERT]: 2, [B.SNOW]: 2, [B.SWAMP]: 2, [B.HILLS]: 2, [B.MTN]: 3, [B.PEAK]: 4 };
const isWaterB = b => b === B.DEEP || b === B.SHALLOW || b === B.LAKE;

/* ===== Geração do mundo ===== */
function generate() {
  const f = genFields(), wat = genWater(f), { e, m, t } = f;
  const land = []; for (let i = 0; i < N; i++) if (!wat.ocean[i] && !wat.lake[i]) land.push(i);
  const bands = { deep: SEA * .72, hills: SEA + .082, mtn: SEA + .13, peak: SEA + .25 };
  const biome = new Uint8Array(N);
  for (let i = 0; i < N; i++) biome[i] = wat.lake[i] ? B.LAKE : biomeOf(e[i], m[i], t[i], bands);
  const shade = new Float32Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; shade[i] = e[i + W + 1] - e[i - W - 1]; }
  const riverT = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (!wat.ocean[i] && !wat.lake[i] && wat.flow[i] > 60) riverT[i] = 1;
  const massId = new Int16Array(N).fill(-1);
  let masses = 0;
  for (const s of land) {
    if (massId[s] >= 0) continue;
    const id = masses++, st = [s]; massId[s] = id;
    while (st.length) {
      const c = st.pop(), cx = c % W, cy = c / W | 0;
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (massId[n] < 0 && !wat.ocean[n] && !wat.lake[n]) { massId[n] = id; st.push(n); } }
    }
  }
  /* cada lugar da história cai no tile de terra mais próximo do ponto planejado */
  const emTerra = (x, y) => { for (let rad = 0; rad < 30; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const i = (y + dy) * W + x + dx; if (Math.max(Math.abs(dx), Math.abs(dy)) === rad && i >= 0 && i < N && !isWaterB(biome[i]) && biome[i] !== B.PEAK) return i; } return y * W + x; };
  const places = LUGARES_MAPA.map(p => { const i = emTerra(p.x, p.y); return { realm: -1, pop: 0, secret: '', hidden: false, ...p, x: i % W, y: i / W | 0 }; });
  const realms = REINOS.map(r => { const i = emTerra(r.x, r.y); return { name: r.nome, color: r.cor, ruler: r.gov, tile: i }; });
  const realm = new Int8Array(N).fill(-1), dist = new Float32Array(N).fill(1e9), heap = new Heap();
  const claim = i => isWaterB(biome[i]) ? (wat.lake[i] ? 3 : 7) : ({ [B.MTN]: 4, [B.PEAK]: 8, [B.SWAMP]: 2.4, [B.DESERT]: 2.4, [B.SNOW]: 3, [B.HILLS]: 1.5, [B.FOREST]: 1.3 }[biome[i]] || 1);
  realms.forEach((r, k) => { dist[r.tile] = 0; realm[r.tile] = k; heap.push(r.tile, 0); });
  while (heap.size) {
    const c = heap.pop(), cx = c % W, cy = c / W | 0;
    for (const [dx, dy, dd] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx, nd = dist[c] + dd * claim(n);
      if (nd < dist[n] && nd < 80) { dist[n] = nd; realm[n] = realm[c]; heap.push(n, nd); }
    }
  }
  for (let i = 0; i < N; i++) if (wat.ocean[i]) realm[i] = -1;
  for (const p of places) p.realm = realm[p.y * W + p.x];
  const isPort = new Uint8Array(N), road = new Uint8Array(N), roads = [];
  const roadCost = (a, n) => { if (isWaterB(biome[n])) return Infinity; return road[n] ? .35 : ROAD_COST[biome[n]] + (riverT[n] ? 1 : 0); };
  const towns = places.filter(p => (PT[p.type].rank >= 2 || p.no) && !p.hidden), done = [towns[0]], rest = towns.slice(1);
  while (rest.length) {
    let bd = 1e9, a = null, bi = -1;
    rest.forEach((p, k) => { for (const c of done) { const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < bd) { bd = d; a = c; bi = k; } } });
    const b = rest.splice(bi, 1)[0]; done.push(b);
    const path = astar(a.y * W + a.x, b.y * W + b.x, roadCost, .35);
    if (path) { roads.push(path); for (const i of path) road[i] = 1; }
  }
  return { seed: SEED, ...f, ...wat, bands, biome, shade, riverT, massId, realm, realms, places, road, roads, isPort, name: 'Valdren' };
}

/* ===== Sprites ===== */
const SP = {
  k: '#1a120c', s: '#cfc8b8', S: '#8f8878', r: '#b5412f', R: '#7e2a22', t: '#8a5a34', T: '#5c3a20', g: '#f2c14e', G: '#b9852e',
  y: '#ffd76a', b: '#3f78b8', B: '#2a4e80', p: '#8a5cc0', P: '#c9a0ee', w: '#efe8d8', e: '#3a3430', o: '#e8743a', f: '#7fd0ff',
};
function pix(rows, pal, outline) {
  const h = rows.length, wd = Math.max(...rows.map(r => r.length)), pad = outline ? 1 : 0, c = newCanvas(wd + pad * 2, h + pad * 2), x = c.getContext('2d');
  const put = (ox, oy, colorOf) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < wd; xx++) { const ch = rows[yy][xx]; if (ch && ch !== '.') { x.fillStyle = colorOf(ch); x.fillRect(xx + pad + ox, yy + pad + oy, 1, 1); } } };
  if (outline) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(a, b, () => '#140b06');
  put(0, 0, ch => pal[ch]);
  return c;
}
const PLACE_SPR = {
  castle: pix([
    '.......g.......', '.......ggg.....', '.......k.......', '..k.k.sSs.k.k..', '..sss.sSs.sss..', '..sSs.sSs.sSs..',
    '..sSskkSkksSs..', 'k.sSssssssSss.k', 'sssssskkksssssS', 'sSsSsskykksSsSS', 'sSsSskkkkksSsSS', 'SSSSSkkkkkSSSSS'], SP, true),
  town: pix([
    '......r.......', '.....rRr......', '....rrRRr..r..', '...rrrRRRrrRr.', '...tytttytrrRRr', '...ttttttttytt.',
    '.r..tykktt.tt..', 'rRr.ttkktt.ttt.', 'tytt........ty.'], SP, true),
  village: pix(['...t.........', '..tTt...r....', '.tTTTt.rRr...', 'ttTTTTrrRRr..', '.tyktt.tykt..', '.ttktt.ttkt..'], SP, true),
  port: pix([
    '.....g.....', '.....k.w...', '.....k.ww..', '.....k.www.', '..wwwk.www.', '..wwwk.ww..', '.....k.....',
    'TTTTTTTTTTT', '.TtttttttT.', '..TTTTTTT..', 'bBbbBbbBbbB'], SP, true),
  fort: pix(['s.s.s.s.s.s', 'sssssssssss', 'sSssSssSssS', 'sSssSssSssS', 'sssskkkssss', 'SSSSkkkSSSS'], SP, true),
  temple: pix([
    '.....g.....', '....sws....', '..sswwwss..', '.sswwwwwss.', 'sSSSSSSSSSs', '.s.s.s.s.s.', '.s.s.s.s.s.', '.s.s.s.s.s.', 'SSSSSSSSSSS'], SP, true),
  tower: pix(['...P...', '...p...', '..pPp..', '.pPPpp.', 'pPPPppp', '.sSSSS.', '.sySSS.', '.sSSSS.', '.sSSyS.', '.sSSSS.', '.sSkkS.', 'ssSkkSS'], SP, true),
  ruin: pix(['.s.....s....', '.sS....sS...', '.sS....sS.s.', '.sS..s.sS.S.', '.sS.sS.s..S.', 'ssSSsSSs.sSS'], SP, true),
  cave: pix(['....SSSSS....', '..SSeeSSeSS..', '.SeSkkkkkSeS.', '.SeekkkkkkeS.', 'SSekkkkkkkeSS', 'SeekkkkkkkkeS'], SP, true),
  lair: pix(['.w...w...w.', '.ww..w..ww.', '..ww.w.ww..', '...r.w.r...', '..rrkkkrr..', '.rrkoookrr.', 'rRkooyookRr'], SP, true),
  grove: pix(['...bb.....', '..bcbb.bb.', '.bcccbbcbb', '.bccbbbccb', '..bbbbbbb.', '...T...T..'], { ...SP, b: '#2c5a2a', c: '#4f8f42' }, true),
  belltower: pix(['...r...', '..rRr..', '.rrRRr.', 'SsgggsS', 'SsgkgsS', 'Ssssss.', 'SsSsSs.', 'SsSsSs.', 'SSkkSS.'], SP, true),
  flag: pix(['k.......', 'krrrrr..', 'krrrrrr.', 'krrrrr..', 'k.......', 'k.......', 'k.......', 'kk......'], SP, true),
};
const PARTY_SPR = pix([
  '...gg....', '..gggg...', '...gg....', '.bbbbbb..', 'bbbBBbbb.', 'b.bBBb.bk', 'y.bBBb.yk', '..bBBb..k', '..t..t...', '.tt..tt..'], SP, true);

function trees() {
  const P = { g: '#3f7c34', G: '#5ea048', d: '#2c5a2a', t: '#5c3a20', s: '#1d3f24', w: '#e8eef2', j: '#1f7038', J: '#3fa35a', a: '#8d9a3e', A: '#b1b552', c: '#3e8a58', C: '#67b37a', h: '#7a8742', q: '#94a94f', b: '#4f4632', z: '#6f6448' };
  return {
    oak: pix(['.gGg..', 'gGGGg.', 'gGGgd.', '.gdd..', '..t...'], P),
    oak2: pix(['..gg..', '.gGGg.', 'gGGGgd', 'gGggdd', '.gdd..', '..t...'], P),
    pine: pix(['..d...', '..g...', '.gGd..', '.gGd..', 'gGGdd.', 'gGdds.', '..t...'], P),
    snowpine: pix(['..w...', '.wwd..', '.wGd..', 'wwGdd.', 'gwdds.', '..t...'], P),
    jungle: pix(['.jJJj..', 'jJJJJj.', 'jJJjjd.', '.jjjd..', '..t....', '..t....'], P),
    acacia: pix(['.aAAAa.', 'aAAAAaa', '...t...', '..t....', '..t....'], P),
    shrub: pix(['.hq.', 'hqqh'], P),
    tuft: pix(['q.q', '.q.'], P),
    dead: pix(['b..b.', '.b.b.', '..bb.', '..b..', '..b..'], P),
    cactus: pix(['..c..', 'c.C..', 'cCCc.', '..Cc.', '..C..'], P),
    reed: pix(['z.z', 'z.z', '.zz'], P),
    dune: pix(['..zz..', '.z..z.'], { z: '#c79548' }),
  };
}
function mountains(rnd) {
  const list = [];
  for (let v = 0; v < 8; v++) {
    const snow = v >= 4, mw = 19 + (rnd() * 8 | 0), mh = 13 + (rnd() * 6 | 0) + (snow ? 3 : 0), c = newCanvas(mw, mh), x = c.getContext('2d');
    const peak = mw / 2 + (rnd() - .5) * 3 | 0, dL = peak / mh, dR = (mw - peak) / mh;
    const jag = () => (rnd() * 3 - 1) | 0;
    let lJ = 0, rJ = 0;
    for (let y = 1; y < mh; y++) {
      if (y % 2 === 0) { lJ = jag(); rJ = jag(); }
      const l = peak - y * dL + lJ | 0, r = peak + y * dR + rJ | 0;
      const ridge = peak + Math.sin(y * .9 + v) * 1.4 | 0;
      for (let px = l; px <= r; px++) {
        const lit = px < ridge, top = y < mh * (snow ? .46 : .22) + (px * 7 % 3);
        x.fillStyle = top ? (lit ? '#f4f6f8' : '#c6d0dc') : lit ? (px % 3 ? '#a59b8e' : '#938a7e') : (px % 3 ? '#655d57' : '#5a534e');
        x.fillRect(px, y, 1, 1);
      }
      x.fillStyle = '#332d2a'; x.fillRect(l - 1, y, 1, 1); x.fillRect(r + 1, y, 1, 1);
    }
    x.fillStyle = '#332d2a'; x.fillRect(peak, 0, 1, 1);
    list.push(c);
  }
  return list;
}
const hillSpr = (() => {
  const c = newCanvas(13, 6), x = c.getContext('2d'), rows = ['....aaaaa....', '..aaAAAAaab..', '.aAAAAAAAaab.', 'aAAAAAAAAaabb'];
  const pal = { a: '#a8b56a', A: '#94a45c', b: '#66763e' };
  rows.forEach((r, y) => [...r].forEach((ch, px) => { if (ch !== '.') { x.fillStyle = pal[ch]; x.fillRect(px, y, 1, 1); } }));
  return c;
})();

/* ===== Pintura do terreno em pixel art ===== */
function bake() {
  const rnd = mulberry(hashStr(w.seed) ^ 0x51ed);
  const RT = new Float32Array(65536); for (let i = 0; i < 65536; i++) RT[i] = rnd();
  const hash = (x, y) => RT[(Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0 & 65535];
  const tctx = terrainC.getContext('2d'), img = tctx.createImageData(PW, PH), d = new Uint32Array(img.data.buffer);
  const pb = new Uint8Array(PW * PH), blocked = new Uint8Array(PW * PH);
  const PAL = BIOME.map(b => {
    const out = []; for (let s = 0; s < 3; s++) { const c = rgb(b.p[s % b.p.length]); for (const l of [-16, 0, 14]) out.push(u32(c[0] + l, c[1] + l, c[2] + l)); }
    return out;
  });
  const bandsU = SEA_BANDS.map(hex32), { e, m, t, lakeD, shade, bands } = w;
  const foam = hex32('#a9dbe8'), lakeBank = hex32('#2f75b0');
  for (let py = 0; py < PH; py++) {
    const fy = clamp((py + .5) / TS - .5, 0, H - 1.001), y0 = fy | 0, ty = fy - y0;
    for (let px = 0; px < PW; px++) {
      const fx = clamp((px + .5) / TS - .5, 0, W - 1.001), x0 = fx | 0, tx = fx - x0, i = y0 * W + x0;
      const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, g = tx * ty;
      const s4 = f => f[i] * a + f[i + 1] * b + f[i + W] * c + f[i + W + 1] * g;
      const r1 = hash(px, py), r2 = hash(py + 917, px + 311);
      const ee = s4(e) + (r1 - .5) * .008, mm = s4(m) + (r1 - .5) * .05, tt = s4(t) + (r2 - .5) * .05;
      const q = PW * py + px;
      if (s4(lakeD) > LAKE_D + (r1 - .5) * .002) { pb[q] = B.LAKE; d[q] = PAL[B.LAKE][3 * (hash(px >> 2, py >> 2) * 3 | 0) + 1]; continue; }
      const bb = biomeOf(ee, mm, tt, bands); pb[q] = bb;
      if (ee < SEA) { const k = ee / SEA, wave = hash(px >> 3, py) < .07 ? 1 : 0; d[q] = bandsU[Math.min(5, (k * k * 6 + wave) | 0)]; continue; }
      const sh = s4(shade), l = sh > .012 ? 2 : sh < -.012 ? 0 : 1, s = (hash(px >> 2, py >> 2) * .55 + r1 * .45) * 3 | 0;
      d[q] = PAL[bb][s * 3 + l];
    }
  }
  // espuma nas costas e margem dos lagos
  for (let py = 1; py < PH - 1; py++) for (let px = 1; px < PW - 1; px++) {
    const q = PW * py + px, b = pb[q]; if (b > B.SHALLOW && b !== B.LAKE) continue;
    const isL = v => !isWaterB(v), near = isL(pb[q - 1]) || isL(pb[q + 1]) || isL(pb[q - PW]) || isL(pb[q + PW]);
    if (near) { if (b === B.LAKE) d[q] = lakeBank; else if (hash(px, py) < .7) d[q] = foam; }
  }
  // rios: cada tile desce até o tile pai, com um leve serpentear
  const nodeX = i => (i % W) * TS + 4 + (hash(i, 3) - .5) * 6 | 0, nodeY = i => (i / W | 0) * TS + 4 + (hash(i, 7) - .5) * 6 | 0;
  const rCol = hex32('#3f8ccb'), rEdge = hex32('#2c669c');
  const stamp = (x, y, r, col) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const q = PW * (y + yy) + x + xx; if (q >= 0 && q < d.length && !isWaterB(pb[q])) { d[q] = col; blocked[q] = 1; } } };
  const lineTo = (x0, y0, x1, y1, fn) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) fn(x0 + (x1 - x0) * k / n | 0, y0 + (y1 - y0) * k / n | 0); };
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
    if (!w.riverT[i]) continue;
    const pa = w.parent[i]; if (pa < 0) continue;
    const r = w.flow[i] > 420 ? 2 : w.flow[i] > 140 ? 1 : 0, ex = nodeX(pa), ey = nodeY(pa);
    lineTo(nodeX(i), nodeY(i), ex, ey, (x, y) => pass ? stamp(x, y, r === 2 ? 1 : 0, rCol) : stamp(x, y, r, rEdge));
    if (r === 0 && pass) lineTo(nodeX(i), nodeY(i), ex, ey, (x, y) => stamp(x, y, 0, rCol));
  }
  tctx.putImageData(img, 0, 0);

  // vegetação e relevo, em ordem de profundidade
  const T = trees(), M = mountains(rnd), items = [];
  const isDry = (x, y) => { if (x < 0 || y < 0 || x >= PW || y >= PH) return false; const q = PW * y + x; return !blocked[q] && !isWaterB(pb[q]); };
  for (let gy = 2; gy < PH - 2; gy += 5) for (let gx = 2; gx < PW - 2; gx += 5) {
    const x = gx + (rnd() * 4 | 0), y = gy + (rnd() * 4 | 0); if (!isDry(x, y) || !isDry(x - 3, y) || !isDry(x + 3, y)) continue;
    const b = pb[PW * y + x], r = rnd(), roll = rnd(); let s = null;
    if (b === B.FOREST) s = r < .7 ? (roll < .5 ? T.oak : roll < .85 ? T.oak2 : T.pine) : null;
    else if (b === B.TAIGA) s = r < .62 ? T.pine : null;
    else if (b === B.JUNGLE) s = r < .74 ? T.jungle : null;
    else if (b === B.SAVANNA) s = r < .08 ? T.acacia : r < .17 ? T.shrub : r < .24 ? T.tuft : null;
    else if (b === B.GRASS) s = r < .02 ? T.oak : r < .05 ? T.shrub : r < .1 ? T.tuft : null;
    else if (b === B.SWAMP) s = r < .13 ? T.dead : r < .36 ? T.reed : r < .42 ? T.shrub : null;
    else if (b === B.DESERT) s = r < .018 ? T.cactus : r < .12 ? T.dune : null;
    else if (b === B.SNOW) s = r < .05 ? T.snowpine : null;
    else if (b === B.HILLS) s = r < .2 ? hillSpr : r < .3 ? T.oak : r < .36 ? T.shrub : null;
    if (s) items.push({ s, x: x - (s.width >> 1), y: y - s.height, o: y });
  }
  for (let gy = 4; gy < PH - 2; gy += 10) for (let gx = 4; gx < PW - 2; gx += 11) {
    const x = gx + (rnd() * 8 | 0), y = gy + (rnd() * 6 | 0), q = PW * y + x; if (y >= PH || x >= PW) continue;
    const b = pb[q]; if (b !== B.MTN && b !== B.PEAK) continue;
    const s = M[(b === B.PEAK ? 4 : 0) + (rnd() * 4 | 0)];
    items.push({ s, x: x - (s.width >> 1), y: y - s.height, o: y });
  }
  items.sort((a, b) => a.o - b.o);
  for (const it of items) tctx.drawImage(it.s, it.x, it.y);

  bakeRealms(); bakeRoads(); bakeHex();
  const mctx = miniBase.getContext('2d'); mctx.imageSmoothingEnabled = true; mctx.imageSmoothingQuality = 'high';
  mctx.drawImage(terrainC, 0, 0, W, H);
}
function bakeRealms() {
  const c = realmC.getContext('2d'); c.clearRect(0, 0, PW, PH);
  const real = i => !isWaterB(w.biome[i]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, k = w.realm[i]; if (!real(i) || k < 0) continue;
    c.globalAlpha = .13; c.fillStyle = w.realms[k].color; c.fillRect(x * TS, y * TS, TS, TS); c.globalAlpha = 1;
  }
  const stip = (x0, y0, dx, dy, col) => { for (let s = 0; s < TS; s++) if ((s + x0 + y0) % 6 < 3) { const px = x0 + dx * s, py = y0 + dy * s; c.fillStyle = 'rgba(26,18,12,.7)'; c.fillRect(px + 1, py + 1, 1, 1); c.fillStyle = col; c.fillRect(px, py, 1, 1); } };
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
    const i = y * W + x, k = w.realm[i]; if (!real(i)) continue;
    const kR = w.realm[i + 1], kD = w.realm[i + W];
    if (real(i + 1) && kR !== k) stip((x + 1) * TS - 1, y * TS, 0, 1, w.realms[k >= 0 ? k : kR].color);
    if (real(i + W) && kD !== k) stip(x * TS, (y + 1) * TS - 1, 1, 0, w.realms[k >= 0 ? k : kD].color);
  }
}
function bakeRoads() {
  const c = roadC.getContext('2d'); c.clearRect(0, 0, PW, PH);
  for (const path of w.roads) {
    let run = 0;
    for (let k = 0; k + 1 < path.length; k++) {
      const a = path[k], b = path[k + 1], ax = (a % W) * TS + 4, ay = (a / W | 0) * TS + 4, bx = (b % W) * TS + 4, by = (b / W | 0) * TS + 4;
      for (let s = 0; s < TS; s++) {
        if ((run++ % 6) > 3) continue;
        const px = ax + (bx - ax) * s / TS | 0, py = ay + (by - ay) * s / TS | 0;
        c.fillStyle = '#4d341f'; c.fillRect(px, py + 1, 2, 2); c.fillStyle = '#e3cb96'; c.fillRect(px, py, 2, 1);
      }
    }
  }
}
function bakeHex() {
  const c = hexC.getContext('2d'); c.clearRect(0, 0, PW, PH); c.fillStyle = 'rgba(16,10,6,.5)';
  const R = 4 * TS / Math.sqrt(3), hh = 2 * TS, cols = PW / (R * 1.5) + 2 | 0, rows = PH / (hh * 2) + 2 | 0;
  const line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let k = 0; k <= n; k++) c.fillRect(x0 + (x1 - x0) * k / n | 0, y0 + (y1 - y0) * k / n | 0, 1, 1); };
  for (let q = 0; q < cols; q++) for (let r = 0; r < rows; r++) {
    const cx = q * R * 1.5, cy = r * hh * 2 + (q % 2 ? hh : 0);
    line(cx - R, cy, cx - R / 2, cy - hh); line(cx - R / 2, cy - hh, cx + R / 2, cy - hh); line(cx - R, cy, cx - R / 2, cy + hh);
  }
}

/* ===== Estado da campanha ===== */
const S = { name: '', places: [], realmNames: [], party: { x: 0, y: 0 }, day: 1, fog: new Uint8Array(N), mode: 'pl', log: [], nextId: 1000 };
const L = { realms: true, roads: true, labels: true, hex: false, fog: true, clouds: true };
let tool = 'explore', selected = null, route = null, ruler = [], fogMode = 1, hover = null, moving = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const rle = a => { const out = []; let cur = a[0], n = 0; for (let i = 0; i < a.length; i++) { if (a[i] === cur) n++; else { out.push(n); cur = a[i]; n = 1; } } out.push(n); return a[0] + ':' + out.map(v => v.toString(36)).join(','); };
const unrle = s => { const [first, runs] = s.split(':'), a = new Uint8Array(N); let v = +first, i = 0; for (const r of runs.split(',')) { const n = parseInt(r, 36); a.fill(v, i, i + n); i += n; v = 1 - v; } return a; };
const snapshot = () => ({ v: 1, j: J, name: S.name, places: S.places, realmNames: S.realmNames, party: S.party, day: S.day, fog: rle(S.fog), mode: S.mode, log: S.log.slice(0, 40), nextId: S.nextId });
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(snapshot())); } catch (_) { /* sem armazenamento: o código do mundo continua disponível */ } }, 300); }
function loadSaved() { try { const j = localStorage.getItem(STORE); return j ? JSON.parse(j) : null; } catch (_) { return null; } }

let mundoPronto = false;
function iniciarMundo(saved, depois) {
  $('busy').hidden = false;
  setTimeout(() => {
    if (!mundoPronto) { w = generate(); bake(); mundoPronto = true; }
    const okPlace = p => p && PT[p.type] && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < W && p.y < H && typeof p.name === 'string';
    S.name = w.name; S.places = saved?.places?.filter(okPlace) || w.places.map(p => ({ ...p }));
    S.realmNames = saved?.realmNames || w.realms.map(r => r.name);
    S.nextId = saved?.nextId || 1000; S.day = saved?.day || 1; S.log = Array.isArray(saved?.log) ? saved.log.map(String) : []; S.mode = saved?.mode || 'pl';
    const v = S.places.find(p => p.id === 1);
    S.party = saved?.party ? { x: clamp(saved.party.x | 0, 0, W - 1), y: clamp(saved.party.y | 0, 0, H - 1) } : { x: v.x, y: v.y };
    if (saved?.fog) S.fog = unrle(saved.fog); else S.fog.fill(1);
    fogDirty = true;
    selected = route = null; ruler = [];
    syncPorts(); renderFog(); setMode(S.mode); renderLog(); syncDay();
    $('worldname').textContent = S.name; closePanels();
    fit();
    $('busy').hidden = true; save(); dirty(); depois?.();
  }, 30);
}
function syncPorts() { w.isPort.fill(0); for (const p of S.places) if (p.type === 'porto') w.isPort[p.y * W + p.x] = 1; }

/* ===== Névoa de guerra ===== */
function reveal(cx, cy, r, v = 1) {
  for (let y = Math.max(0, cy - r | 0); y <= Math.min(H - 1, cy + r); y++) for (let x = Math.max(0, cx - r | 0); x <= Math.min(W - 1, cx + r); x++)
    if (Math.hypot(x - cx, y - cy) <= r) S.fog[y * W + x] = v;
  fogDirty = true;
}
let fogDirty = true;
function renderFog() {
  fogDirty = false;
  const c = fogC.getContext('2d'), iw = W * 3, img = c.createImageData(iw, H * 3), d = new Uint32Array(img.data.buffer);
  const A = hex32('#141c30'), B2 = hex32('#161f35'), C = hex32('#121a2c');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (S.fog[i]) continue;
    const edge = (x > 0 && S.fog[i - 1]) || (x < W - 1 && S.fog[i + 1]) || (y > 0 && S.fog[i - W]) || (y < H - 1 && S.fog[i + W]);
    for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) {
      const px = x * 3 + xx, py = y * 3 + yy;
      if (edge && (px + py) % 2) continue;
      const h = (Math.imul(px, 31) ^ Math.imul(py, 97)) >>> 3 & 7;
      d[py * iw + px] = h < 5 ? A : h < 7 ? B2 : C;
    }
  }
  c.putImageData(img, 0, 0);
}

/* ===== Câmera e desenho ===== */
const cv = $('map'), ctx = cv.getContext('2d'), mini = $('mini'), mctx = mini.getContext('2d');
const cam = { x: 0, y: 0, z: 1 };
let vw = 0, vh = 0, dpr = 1, needDraw = true;
const dirty = () => { needDraw = true; };
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2); vw = innerWidth; vh = innerHeight;
  cv.width = vw * dpr | 0; cv.height = vh * dpr | 0; clampCam(); dirty();
}
const fitZ = () => Math.min(vw / PW, vh / PH);
function fit() { cam.z = Math.max(fitZ(), .2); cam.x = PW / 2 - vw / 2 / cam.z; cam.y = PH / 2 - vh / 2 / cam.z; clampCam(); dirty(); }
function focusOn(tx, ty, z) { if (z) cam.z = clamp(z, fitZ(), 8); cam.x = (tx + .5) * TS - vw / 2 / cam.z; cam.y = (ty + .5) * TS - vh / 2 / cam.z; clampCam(); dirty(); }
function clampCam() {
  const mx = Math.max(0, (vw / cam.z - PW) / 2), my = Math.max(0, (vh / cam.z - PH) / 2), pad = 40;
  cam.x = clamp(cam.x, -mx - pad, Math.max(-mx - pad, PW - vw / cam.z + mx + pad));
  cam.y = clamp(cam.y, -my - pad, Math.max(-my - pad, PH - vh / cam.z + my + pad));
}
function zoomAt(sx, sy, f) {
  const nz = clamp(cam.z * f, fitZ() * .9, 8), wx = sx / cam.z + cam.x, wy = sy / cam.z + cam.y;
  cam.z = nz; cam.x = wx - sx / nz; cam.y = wy - sy / nz; clampCam(); dirty();
}
const S2W = (sx, sy) => ({ x: sx / cam.z + cam.x, y: sy / cam.z + cam.y });
const W2S = (x, y) => ({ x: (x - cam.x) * cam.z, y: (y - cam.y) * cam.z });
const canSee = p => S.mode === 'dm' || (!p.hidden && S.fog[p.y * W + p.x]);
const iconScale = () => clamp(Math.round(cam.z), 1, 4);
const ptScreen = p => W2S((p.x + .5) * TS, (p.y + .5) * TS);

const clouds = Array.from({ length: 9 }, (_, i) => ({ x: (i * 397) % PW, y: (i * 211 + 90) % PH, s: 1 + i % 2, v: 2 + (i % 4) * .8 }));
const cloudSpr = (() => {
  const r = mulberry(77), c = newCanvas(90, 34), x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,.9)';
  for (const [cx, cy, rr] of [[22, 22, 11], [40, 16, 15], [60, 21, 12], [73, 24, 7]])
    for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (Math.hypot(xx, yy) <= rr - r() * 2) x.fillRect(cx + xx, cy + yy, 1, 1);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(165,185,215,.65)'; x.fillRect(0, 25, 90, 9);
  return c;
})();
const cloudShadow = (() => { const c = newCanvas(90, 34), x = c.getContext('2d'); x.drawImage(cloudSpr, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#0a1020'; x.fillRect(0, 0, 90, 34); return c; })();

function draw(now) {
  const ds = dpr * cam.z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = S.mode === 'pl' ? '#141c30' : SEA_BANDS[0]; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(ds, 0, 0, ds, -cam.x * ds, -cam.y * ds);
  ctx.drawImage(terrainC, 0, 0);
  if (L.realms) ctx.drawImage(realmC, 0, 0);
  if (L.roads) ctx.drawImage(roadC, 0, 0);
  if (L.hex) ctx.drawImage(hexC, 0, 0);
  if (L.clouds) {
    const t = reduced ? 0 : now / 1000;
    for (const c of clouds) {
      const x = ((c.x + t * c.v) % (PW + 240)) - 200 | 0;
      ctx.globalAlpha = .24; ctx.drawImage(cloudShadow, x + 10, c.y + 22, 90 * c.s, 34 * c.s);
      ctx.globalAlpha = .8; ctx.drawImage(cloudSpr, x, c.y, 90 * c.s, 34 * c.s);
    }
    ctx.globalAlpha = 1;
  }
  if (S.mode === 'pl' || L.fog) {
    if (fogDirty) renderFog();
    ctx.globalAlpha = S.mode === 'pl' ? 1 : .3; ctx.drawImage(fogC, 0, 0, PW, PH); ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRoute(); drawRuler(); drawPlaces(); drawParty(); if (L.labels) drawLabels();
  drawMini();
  $('zoomv').textContent = cam.z.toFixed(2).replace('.', ',') + 'x';
}
function drawPlaces() {
  const sc = iconScale();
  for (const p of S.places) {
    if (!canSee(p)) continue;
    const c = PLACE_SPR[PT[p.type].spr], s = ptScreen(p), iw = c.width * sc, ih = c.height * sc;
    if (s.x < -iw || s.y < -ih || s.x > vw + iw || s.y > vh + ih) continue;
    const x = Math.round(s.x - iw / 2), y = Math.round(s.y - ih + 3 * sc);
    ctx.globalAlpha = p.hidden ? .72 : 1; ctx.drawImage(c, x, y, iw, ih); ctx.globalAlpha = 1;
    if (p.hidden) { ctx.fillStyle = '#b98ce6'; ctx.strokeStyle = '#120a06'; ctx.lineWidth = 2; ctx.save(); ctx.translate(x + iw, y); ctx.rotate(Math.PI / 4); ctx.strokeRect(-3, -3, 6, 6); ctx.fillRect(-3, -3, 6, 6); ctx.restore(); }
    if (selected === p) { ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2; const m = 4; ctx.setLineDash([6, 4]); ctx.strokeRect(x - m, y - m, iw + m * 2, ih + m * 2); ctx.setLineDash([]); }
  }
}
// sobre um lugar, o token fica ao lado para não esconder o ícone
const partyScreen = () => {
  const s = W2S((S.party.x + .5) * TS, (S.party.y + .5) * TS), p = S.places.find(q => q.x === S.party.x && q.y === S.party.y && canSee(q));
  if (p) s.x += (PLACE_SPR[PT[p.type].spr].width + PARTY_SPR.width + 2) / 2 * iconScale();
  return s;
};
function drawParty() {
  const sc = iconScale() + 1, s = partyScreen(), iw = PARTY_SPR.width * sc, ih = PARTY_SPR.height * sc;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(s.x - iw / 2 + sc, s.y + sc * 2, iw - sc * 2, sc);
  ctx.drawImage(PARTY_SPR, Math.round(s.x - iw / 2), Math.round(s.y - ih + 3 * sc), iw, ih);
}
function textOut(t, x, y, font, fill, lw = 3) {
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#120a06'; ctx.lineWidth = lw; ctx.strokeText(t, x, y); ctx.fillStyle = fill; ctx.fillText(t, x, y);
}
function drawLabels() {
  const z = cam.z, sc = iconScale(), boxes = [];
  const fits = (x, y, wd, h) => { for (const b of boxes) if (Math.abs(b.x - x) < (b.w + wd) / 2 && Math.abs(b.y - y) < (b.h + h) / 2) return false; boxes.push({ x, y, w: wd, h }); return true; };
  const minRank = z < .45 ? 4 : z < .75 ? 3 : z < 1.25 ? 2 : 1;
  const list = S.places.filter(p => canSee(p) && (PT[p.type].rank >= minRank || p === selected)).sort((a, b) => PT[b.type].rank - PT[a.type].rank);
  // nomes de reinos enquanto a visão está afastada
  if (L.realms && z < 1.05) w.realms.forEach((r, k) => {
    const x0 = r.tile % W, y0 = r.tile / W | 0; if (S.mode === 'pl' && !S.fog[r.tile]) return;
    const s = W2S((x0 + .5) * TS, (y0 - 6) * TS), t = S.realmNames[k].toUpperCase();
    ctx.globalAlpha = .92; textOut(t, s.x, s.y, '700 15px "Pixelify Sans", monospace', r.color, 4); ctx.globalAlpha = 1;
    const tw = ctx.measureText(t).width; boxes.push({ x: s.x, y: s.y - 5, w: tw, h: 18 });
  });
  for (const p of list) {
    const rank = PT[p.type].rank, c = PLACE_SPR[PT[p.type].spr], s = ptScreen(p), f = rank >= 4 ? '700 15px' : rank >= 3 ? '600 13px' : '400 12px';
    const y = s.y + 3 * sc + (rank >= 4 ? 16 : 13); if (s.x < -80 || s.x > vw + 80 || s.y < -30 || s.y > vh + 30) continue;
    ctx.font = `${f} "Pixelify Sans", monospace`;
    const wd = ctx.measureText(p.name).width + 6; if (!fits(s.x, y - 5, wd, 16)) continue;
    textOut(p.name, s.x, y, ctx.font, rank >= 4 ? '#f2c14e' : '#f3e6c9');
    if (rank >= 3 && p.pop && z > .9) textOut(`${fmt(p.pop)} hab.`, s.x, y + 12, '400 11px "Pixelify Sans", monospace', '#c9b793');
  }
}
function drawRoute() {
  if (!route) return;
  const r = Math.max(2, Math.min(3, cam.z * 1.6));
  [[r + 1, '#120a06'], [r, '#f2c14e']].forEach(([rad, col]) => {
    ctx.fillStyle = col;
    route.path.forEach((i, k) => { if (k % 2) return; const s = W2S((i % W + .5) * TS, ((i / W | 0) + .5) * TS); ctx.fillRect(s.x - rad, s.y - rad, rad * 2, rad * 2); });
  });
}
function drawRuler() {
  if (!ruler.length) return;
  const pts = ruler.map(p => W2S(p.x, p.y));
  ctx.setLineDash([8, 5]);
  for (const [lw, col] of [[4, '#120a06'], [2, '#f3e6c9']]) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
  ctx.setLineDash([]);
  let km = 0;
  pts.forEach((p, i) => {
    ctx.fillStyle = '#120a06'; ctx.fillRect(p.x - 5, p.y - 5, 10, 10); ctx.fillStyle = '#f2c14e'; ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    if (i) { km += rulerKm(ruler[i - 1], ruler[i]); textOut(`${fmt(km)} km`, p.x, p.y - 12, '600 14px "Pixelify Sans", monospace', '#f3e6c9'); }
  });
}
const rulerKm = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) / TS * KM;
function drawMini() {
  mctx.imageSmoothingEnabled = false;
  mctx.drawImage(miniBase, 0, 0);
  if (S.mode === 'pl') mctx.drawImage(fogC, 0, 0, W, H);
  else if (L.realms) { mctx.globalAlpha = .55; mctx.imageSmoothingEnabled = true; mctx.drawImage(realmC, 0, 0, W, H); mctx.imageSmoothingEnabled = false; mctx.globalAlpha = 1; }
  mctx.fillStyle = '#ffd76a'; mctx.fillRect(S.party.x - 1, S.party.y - 1, 3, 3);
  mctx.strokeStyle = '#f3e6c9'; mctx.lineWidth = 1;
  mctx.strokeRect(cam.x / TS + .5, cam.y / TS + .5, vw / cam.z / TS, vh / cam.z / TS);
}
let lastCloud = 0;
function frame(now) {
  if (L.clouds && !reduced && now - lastCloud > 120) { lastCloud = now; needDraw = true; }
  if (needDraw && w) { needDraw = false; draw(now); }
  requestAnimationFrame(frame);
}

/* ===== Viagem ===== */
function travelCost(a, n) {
  const bn = w.biome[n];
  if (bn === B.LAKE) return Infinity;
  const na = isWaterB(bn), aa = isWaterB(w.biome[a]);
  if (na && !aa && !w.isPort[a]) return Infinity;
  if (!na && aa && !w.isPort[n]) return Infinity;
  if (na) return .5;
  return w.road[n] ? .9 : TRAVEL_MUL[bn];
}
function planRoute(tx, ty) {
  const s = S.party.y * W + S.party.x, g = ty * W + tx;
  if (s === g) return null;
  const path = astar(s, g, travelCost, .45);
  if (!path) return { fail: true, x: tx, y: ty };
  let land = 0, eff = 0, sea = 0;
  for (let k = 1; k < path.length; k++) {
    const a = path[k - 1], b = path[k], diag = (a % W !== b % W) && ((a / W | 0) !== (b / W | 0)), km = (diag ? 1.414 : 1) * KM;
    if (isWaterB(w.biome[b])) sea += km; else { land += km; eff += km * (w.road[b] ? 1 : TRAVEL_MUL[w.biome[b]]); }
  }
  return { path, land, eff, sea, x: tx, y: ty };
}
const routeDays = (r, pace) => r.eff / pace + r.sea / SHIP_KM_DAY;
function startTravel(aoChegar) {
  if (!route || route.fail || moving) return;
  const r = route, days = Math.max(1, Math.ceil(routeDays(r, +$('pace').value)));
  moving = true; let k = 1;
  const finish = () => {
    moving = false; S.day += days; route = null; syncDay(); closeCard();
    const here = S.places.find(p => p.x === S.party.x && p.y === S.party.y);
    pushLog(`Grupo chegou a *${here ? here.name : BIOME[w.biome[S.party.y * W + S.party.x]].n}* em ${days} ${days > 1 ? 'dias' : 'dia'}.`);
    save(); dirty(); if (typeof aoChegar === 'function') aoChegar();
  };
  const step = () => {
    const i = r.path[k++]; S.party.x = i % W; S.party.y = i / W | 0; reveal(S.party.x, S.party.y, 9); dirty();
    if (k < r.path.length) setTimeout(step, reduced ? 0 : 28); else finish();
  };
  step();
}
function rollEncounter() {
  const i = S.party.y * W + S.party.x, g = ENC_GROUP[w.biome[i]], d = roll(20);
  if (d < 15) { pushLog(`Encontro: d20 = *${d}*. Nada aparece (precisa de 15+).`); return; }
  const t = ENCOUNTERS[g], o = roll(t.length);
  pushLog(`Encontro: d20 = *${d}*. d${t.length} = ${o} (${g}): *${t[o - 1]}*.`);
}

/* ===== Interface ===== */
const TOOLS = [
  { id: 'explore', label: 'Explorar', pl: true, hint: 'Clique em um lugar para abrir a ficha. Arraste para mover o mapa.' },
  { id: 'travel', label: 'Viagem', hint: 'Clique no destino para traçar a rota do grupo. Rotas por mar exigem porto na partida e na chegada.' },
  { id: 'ruler', label: 'Régua', pl: true, hint: 'Clique para medir em linha reta. Esc limpa a medição.' },
  { id: 'pin', label: 'Marcador', hint: 'Clique no mapa para criar um lugar novo.' },
  { id: 'fog', label: 'Névoa', hint: 'Pinte para revelar ou esconder. Segure o botão direito para mover o mapa.' },
];
function setTool(id) {
  tool = id; if (id !== 'ruler') { ruler = []; }
  if (id !== 'travel') route = null;
  cv.className = 't-' + id;
  document.querySelectorAll('#toolbar .btn').forEach(b => b.classList.toggle('on', b.dataset.t === id));
  $('fogopts').hidden = id !== 'fog';
  setStatus(); dirty();
}
function setStatus(text) { $('status').textContent = text || TOOLS.find(t => t.id === tool).hint; }
function setMode(m) {
  S.mode = m;
  $('m-dm').classList.toggle('on', m === 'dm'); $('m-pl').classList.toggle('on', m === 'pl');
  const dm = m === 'dm';
  document.querySelectorAll('#toolbar .btn').forEach((b, i) => { b.hidden = !dm && !TOOLS[i].pl; });
  $('l-fog-w').hidden = !dm; $('dm-party').hidden = !dm;
  if (!dm && !TOOLS.find(t => t.id === tool).pl) setTool('explore');
  closeCard(); $('list').hidden = true; save(); dirty();
}
function closeCard0() { $('card').hidden = true; selected = null; dirty(); }
function closeCard() { closeCard0(); if (tool === 'travel') route = null; }
function closePanels() { closeCard(); $('list').hidden = true; $('dialog').hidden = true; }
const CLOSE = '<button class="btn small x" data-close aria-label="Fechar">✕</button>';

function realmName(k) { return k >= 0 && k < S.realmNames.length ? S.realmNames[k] : 'Terras sem dono'; }
function openPlace(p) {
  selected = p; $('list').hidden = true;
  const dm = S.mode === 'dm', T = PT[p.type], c = $('card');
  const facts = `<dl><dt>Território</dt><dd>${esc(realmName(p.realm))}</dd>${p.pop ? `<dt>População</dt><dd class="tn">${fmt(p.pop)}</dd>` : ''}<dt>Terreno</dt><dd>${BIOME[w.biome[p.y * W + p.x]].n}</dd><dt>Do grupo</dt><dd class="tn">${fmt(Math.hypot(p.x - S.party.x, p.y - S.party.y) * KM)} km em linha reta</dd></dl>`;
  if (!dm) {
    c.innerHTML = `${CLOSE}<h2>${esc(p.name)}</h2><div class="kind">${T.label}</div><hr>${facts}<hr><p>${esc(p.desc) || '<i>Sem descrição.</i>'}</p>${htmlEntrada(p)}`;
  } else {
    const opts = Object.keys(PT).map(k => `<option value="${k}"${k === p.type ? ' selected' : ''}>${PT[k].label}</option>`).join('');
    c.innerHTML = `${CLOSE}<h2>${esc(p.name)}</h2><div class="kind">${T.label}${p.hidden ? ' · oculto dos jogadores' : ''}</div>${htmlEntrada(p)}<hr>${facts}<hr>
      <h3><label for="c-name">NOME</label></h3><input type="text" id="c-name" value="${esc(p.name)}">
      <h3><label for="c-type">TIPO</label></h3><select id="c-type">${opts}</select>
      <h3><label for="c-desc">DESCRIÇÃO PARA OS JOGADORES</label></h3><textarea id="c-desc">${esc(p.desc)}</textarea>
      <div class="secret"><h3><label for="c-secret">SEGREDO DO MESTRE</label></h3><textarea id="c-secret">${esc(p.secret)}</textarea></div>
      <label class="chk"><input type="checkbox" id="c-hidden"${p.hidden ? ' checked' : ''}>Ocultar dos jogadores</label>
      <div class="row"><button class="btn gold" id="c-go">Viajar até aqui</button>${p.no ? '' : '<button class="btn" id="c-rm">Excluir lugar</button>'}</div>`;
    const sync = () => { p.name = $('c-name').value.trim() || p.name; p.desc = $('c-desc').value; p.secret = $('c-secret').value; p.hidden = $('c-hidden').checked; c.querySelector('h2').textContent = p.name; save(); dirty(); };
    ['c-name', 'c-desc', 'c-secret'].forEach(id => $(id).addEventListener('input', sync));
    $('c-hidden').addEventListener('change', () => { sync(); openPlace(p); });
    $('c-type').addEventListener('change', e => { p.type = e.target.value; syncPorts(); save(); openPlace(p); dirty(); });
    $('c-go').addEventListener('click', () => { setTool('travel'); doRoute(p.x, p.y); });
    $('c-rm')?.addEventListener('click', e => {
      if (e.target.dataset.ok) { S.places.splice(S.places.indexOf(p), 1); syncPorts(); closeCard(); save(); dirty(); return; }
      e.target.dataset.ok = '1'; e.target.textContent = 'Confirmar exclusão';
    });
  }
  ligarEntrada(p); c.hidden = false; c.scrollTop = 0; dirty();
}
function doRoute(tx, ty) {
  route = planRoute(tx, ty); selected = null;
  const c = $('card'); $('list').hidden = true;
  if (!route) { c.hidden = true; return dirty(); }
  if (route.fail) {
    c.innerHTML = `${CLOSE}<h2>Sem rota</h2><div class="kind">Destino inalcançável</div><hr><p>Não há caminho até lá. Lagos não são navegáveis, e o mar só pode ser cruzado de um porto a outro. Mude a categoria de um lugar para Porto para abrir uma rota.</p>`;
    route = null; c.hidden = false; return dirty();
  }
  const paces = [['Lento', 27, 'pode usar furtividade'], ['Normal', 36, ''], ['Rápido', 45, '−5 em Percepção passiva']];
  const dest = S.places.find(p => p.x === tx && p.y === ty && canSee(p));
  c.innerHTML = `${CLOSE}<h2>${esc(dest ? dest.name : 'Rota do grupo')}</h2><div class="kind">Plano de viagem</div><hr>
    <dl><dt>Por terra</dt><dd class="tn">${fmt(route.land)} km</dd>${route.sea ? `<dt>Por mar</dt><dd class="tn">${fmt(route.sea)} km a 72 km/dia</dd>` : ''}<dt>Com terreno</dt><dd class="tn">equivale a ${fmt(route.eff)} km de marcha</dd></dl><hr>
    <table><tr><th>Ritmo</th><th>Dias</th><th>Efeito</th></tr>${paces.map(([n, k, fx]) => `<tr><td>${n}</td><td>${Math.max(1, Math.ceil(routeDays(route, k)))}</td><td>${fx}</td></tr>`).join('')}</table>
    <p style="margin-top:6px"><i>Fora de estrada, terreno difícil conta em dobro e montanha em triplo.</i></p>
    <button class="btn gold" id="c-walk">Partir (avança o calendário)</button>`;
  $('c-walk').addEventListener('click', () => startTravel());
  c.hidden = false; c.scrollTop = 0; dirty();
}
function openList(kind) {
  const l = $('list'); closeCard();
  if (!l.hidden && l.dataset.kind === kind) { l.hidden = true; return; }
  l.dataset.kind = kind; l.hidden = false;
  if (kind === 'places') {
    l.innerHTML = `<div class="row" style="justify-content:space-between"><span class="label">Lugares</span><button class="btn small" data-close aria-label="Fechar">✕</button></div><input id="q" placeholder="Buscar por nome ou tipo" aria-label="Buscar lugar"><div id="items"></div>`;
    $('q').addEventListener('input', fillItems); fillItems();
  } else {
    l.innerHTML = `<div class="row" style="justify-content:space-between"><span class="label">Reinos</span><button class="btn small" data-close aria-label="Fechar">✕</button></div><div id="items"></div>`;
    const it = $('items'), dm = S.mode === 'dm';
    w.realms.forEach((r, k) => {
      if (!dm && !S.fog[r.tile]) return;
      const tiles = w.realm.reduce((a, v, i) => a + (v === k && !isWaterB(w.biome[i]) ? 1 : 0), 0);
      const ps = S.places.filter(p => p.realm === k && PT[p.type].pop), pop = ps.reduce((a, p) => a + p.pop, 0);
      const d = document.createElement('div'); d.className = 'realm';
      d.innerHTML = `<i style="background:${r.color}"></i><div>${dm ? `<input id="r-${k}" value="${esc(S.realmNames[k])}" aria-label="Nome do reino" style="width:100%;background:var(--ink);border:2px solid var(--walnut-3)">` : `<b>${esc(S.realmNames[k])}</b>`}
        <small>Governo: ${esc(r.ruler)}</small><small class="tn">${fmt(pop)} habitantes · ${fmt(tiles * KM * KM)} km²</small><button class="btn small" data-k="${k}" style="margin-top:3px">Ver no mapa</button></div>`;
      it.appendChild(d);
      d.querySelector('[data-k]').addEventListener('click', () => focusOn(r.tile % W, r.tile / W | 0, 1));
      if (dm) d.querySelector('input').addEventListener('input', e => { S.realmNames[k] = e.target.value; save(); dirty(); });
    });
    if (!it.children.length) it.innerHTML = '<div class="label">Nenhum reino descoberto ainda.</div>';
  }
}
function fillItems() {
  const q = $('q').value.trim().toLowerCase(), it = $('items'); it.innerHTML = '';
  const list = S.places.filter(canSee).filter(p => !q || (p.name + ' ' + PT[p.type].label).toLowerCase().includes(q))
    .sort((a, b) => PT[b.type].rank - PT[a.type].rank || a.name.localeCompare(b.name, 'pt-BR'));
  for (const p of list) {
    const b = document.createElement('button'); b.className = 'item';
    const src = PLACE_SPR[PT[p.type].spr], c = newCanvas(16, 16), x = c.getContext('2d'); x.drawImage(src, (16 - src.width) / 2 | 0, (16 - src.height) / 2 | 0);
    const t = document.createElement('span'); t.innerHTML = `${esc(p.name)}<small>${PT[p.type].label} · ${esc(realmName(p.realm))}${p.hidden ? ' · oculto' : ''}</small>`;
    b.append(c, t); b.addEventListener('click', () => { focusOn(p.x, p.y, Math.max(cam.z, 1.2)); openPlace(p); });
    it.appendChild(b);
  }
  if (!list.length) it.innerHTML = `<div class="label">Nada encontrado.</div>`;
}
function dialog(html) { const d = $('dialog'); d.classList.remove('larga'); d.innerHTML = html; d.hidden = false; }
function openHelp() {
  dialog(`<div class="row" style="justify-content:space-between"><h2>Como usar</h2><button class="btn small" data-close aria-label="Fechar">✕</button></div>
    <p>Clique em um lugar do mapa para abrir a ficha e use <b>Entrar</b>. Dentro dele, clique nos marcadores dourados para descer mais um nível. As migalhas no topo levam de volta.</p>
    <p>Eu narro à direita, e você escolhe o que fazer. Testes usam d20 mais o seu modificador.</p>
    <div class="keys"><span>1 a 5</span><span>Trocar de ferramenta</span><span>M</span><span>Alternar Mestre e Jogadores</span><span>F</span><span>Ver o mapa inteiro</span><span>G</span><span>Ir até o grupo</span><span>H</span><span>Mostrar hexágonos</span><span>+ e −</span><span>Zoom</span><span>Esc</span><span>Fechar e limpar</span></div>
    <p>Tudo é salvo neste navegador. Para levar a campanha a outro computador, use o código na janela Campanha.</p>`);
}
function syncDay() { $('day').textContent = S.day; }
const roll = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + a[0] % n; };
function pushLog(text) { S.log.unshift(text); S.log.length = Math.min(S.log.length, 40); renderLog(); save(); }
function renderLog() { $('log').innerHTML = S.log.map(l => `<div>${esc(l).replace(/\*(.+?)\*/g, '<b>$1</b>')}</div>`).join(''); }
function hoverInfo(tx, ty) {
  if (tool === 'fog' || tool === 'travel' && route) return;
  const i = ty * W + tx;
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return setStatus();
  if (S.mode === 'pl' && !S.fog[i]) return setStatus('Terra desconhecida');
  const k = w.realm[i], extra = !isWaterB(w.biome[i]) && k >= 0 ? ` · ${realmName(k)}` : '';
  setStatus(`${BIOME[w.biome[i]].n}${extra}${w.road[i] ? ' · estrada' : ''}${w.riverT[i] ? ' · rio' : ''}`);
}
function placeAt(sx, sy) {
  const sc = iconScale(); let best = null, bd = 1e9;
  for (const p of S.places) {
    if (!canSee(p)) continue;
    const s = ptScreen(p), c = PLACE_SPR[PT[p.type].spr], hw = c.width * sc / 2 + 3, top = c.height * sc - 3 * sc + 3;
    if (Math.abs(sx - s.x) <= hw && sy <= s.y + 3 * sc + 3 && sy >= s.y - top) { const d = Math.hypot(sx - s.x, sy - s.y); if (d < bd) { bd = d; best = p; } }
  }
  return best;
}
function overParty(sx, sy) { const s = partyScreen(), sc = iconScale() + 1; return Math.abs(sx - s.x) < PARTY_SPR.width * sc / 2 && sy < s.y + 4 * sc && sy > s.y - PARTY_SPR.height * sc; }

function clickMap(sx, sy) {
  const p = S2W(sx, sy), tx = clamp(p.x / TS | 0, 0, W - 1), ty = clamp(p.y / TS | 0, 0, H - 1), hit = placeAt(sx, sy);
  if (tool === 'explore') { if (hit) openPlace(hit); else closeCard(); }
  else if (tool === 'travel') { if (!moving) { if (hit) doRoute(hit.x, hit.y); else doRoute(tx, ty); } }
  else if (tool === 'ruler') { ruler.push(p); if (ruler.length > 1) { const km = ruler.slice(1).reduce((a, q, i) => a + rulerKm(ruler[i], q), 0); setStatus(`${fmt(km)} km · ${(km / +$('pace').value).toFixed(1).replace('.', ',')} dias de marcha em terreno aberto`); } dirty(); }
  else if (tool === 'pin') {
    const np = { id: ++S.nextId, x: tx, y: ty, type: 'marco', name: 'Novo marcador', realm: w.realm[ty * W + tx], pop: 0, desc: '', secret: '', hidden: false, custom: true };
    S.places.push(np); save(); openPlace(np); $('c-name').select();
  }
}
/* ponteiro: um dedo move, dois dão zoom; clique = soltar sem arrastar */
const ptrs = new Map(); let drag = null, pinch = 0;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = null; return; }
  const pan = e.button !== 0 || (tool !== 'fog');
  if (S.mode === 'dm' && e.button === 0 && tool === 'explore' && overParty(e.clientX, e.clientY)) { drag = { party: true, sx: e.clientX, sy: e.clientY, moved: false }; return; }
  drag = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, pan };
  if (!pan) paintFog(e.clientX, e.clientY);
});
cv.addEventListener('pointermove', e => {
  const t = ptrs.get(e.pointerId);
  if (t) { t.x = e.clientX; t.y = e.clientY; }
  if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch); pinch = d; return;
  }
  const p = S2W(e.clientX, e.clientY), tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS);
  if (!drag) { if (!hover || hover.x !== tx || hover.y !== ty) { hover = { x: tx, y: ty }; hoverInfo(tx, ty); } return; }
  if (drag.party) {
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) <= 4) return;
    drag.moved = true; S.party.x = clamp(tx, 0, W - 1); S.party.y = clamp(ty, 0, H - 1); dirty(); return;
  }
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; if (drag.pan) cv.classList.add('dragging'); }
  if (drag.pan) { if (drag.moved) { cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z; clampCam(); dirty(); } }
  else paintFog(e.clientX, e.clientY);
});
const endPtr = e => {
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
  if (!drag) return;
  const d = drag; drag = null; cv.classList.remove('dragging');
  if (d.party) { if (d.moved) { reveal(S.party.x, S.party.y, 9); save(); dirty(); } else if (e.type === 'pointerup') clickMap(e.clientX, e.clientY); return; }
  if (d.pan && !d.moved && e.button === 0 && e.type === 'pointerup') clickMap(e.clientX, e.clientY);
  if (!d.pan) save();
};
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18); }, { passive: false });
function paintFog(sx, sy) { const p = S2W(sx, sy); reveal(p.x / TS | 0, p.y / TS | 0, +$('f-size').value, fogMode); dirty(); }
mini.addEventListener('pointerdown', e => { const r = mini.getBoundingClientRect(); focusOn((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); });

/* montagem dos controles */
TOOLS.forEach((t, i) => {
  const b = document.createElement('button'); b.className = 'btn'; b.dataset.t = t.id; b.innerHTML = `${t.label}<kbd>${i + 1}</kbd>`;
  b.addEventListener('click', () => setTool(t.id)); $('toolbar').appendChild(b);
});
[4, 6, 8, 10, 12, 20, 100].forEach(n => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'd' + n;
  b.addEventListener('click', () => { const v = roll(n), note = n !== 20 ? '' : v === 20 ? ' crítico!' : v === 1 ? ' falha crítica!' : ''; pushLog(`d${n}: *${v}${note}*`); });
  $('dgrid').appendChild(b);
});
$('m-dm').addEventListener('click', () => setMode('dm'));
$('m-pl').addEventListener('click', () => setMode('pl'));
$('b-places').addEventListener('click', () => openList('places'));
$('b-realms').addEventListener('click', () => openList('realms'));
$('b-help').addEventListener('click', openHelp);
$('b-side').addEventListener('click', () => $('side').classList.toggle('fold'));
$('b-dice').addEventListener('click', () => $('dice').classList.toggle('open'));
$('d-m').addEventListener('click', () => { S.day = Math.max(1, S.day - 1); syncDay(); save(); });
$('d-p').addEventListener('click', () => { S.day++; syncDay(); save(); });
$('b-enc').addEventListener('click', rollEncounter);
$('f-show').addEventListener('click', () => { fogMode = 1; $('f-show').classList.add('on'); $('f-hide').classList.remove('on'); });
$('f-hide').addEventListener('click', () => { fogMode = 0; $('f-hide').classList.add('on'); $('f-show').classList.remove('on'); });
$('f-all').addEventListener('click', () => { S.fog.fill(1); fogDirty = true; save(); dirty(); });
$('f-none').addEventListener('click', () => { S.fog.fill(0); reveal(S.party.x, S.party.y, 9); save(); dirty(); });
for (const k of Object.keys(L)) $('l-' + k).addEventListener('change', e => { L[k] = e.target.checked; dirty(); });
document.addEventListener('click', e => {
  if (!e.target.closest('[data-close]')) return;
  const box = e.target.closest('.panel');
  if (box.id === 'card') closeCard(); else box.hidden = true;
});
addEventListener('keydown', e => {
  if (!$('imersao').hidden || !$('prologo').hidden) return;
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (e.key === 'Escape') e.target.blur(); return; }
  const k = e.key.toLowerCase(), avail = TOOLS.filter(t => S.mode === 'dm' || t.pl);
  if (k >= '1' && k <= '5' && avail[+k - 1]) setTool(avail[+k - 1].id);
  else if (k === 'm') setMode(S.mode === 'dm' ? 'pl' : 'dm');
  else if (k === 'f') fit();
  else if (k === 'g') focusOn(S.party.x, S.party.y);
  else if (k === 'h') { L.hex = !L.hex; $('l-hex').checked = L.hex; dirty(); }
  else if (k === '+' || k === '=') zoomAt(vw / 2, vh / 2, 1.25);
  else if (k === '-') zoomAt(vw / 2, vh / 2, .8);
  else if (k === 'escape') { ruler = []; closePanels(); setStatus(); dirty(); }
});
addEventListener('resize', resize);
if (document.fonts?.ready) document.fonts.ready.then(dirty);
if (innerWidth > 760) $('side').classList.remove('fold');

resize(); setTool('explore');
requestAnimationFrame(frame);
