'use strict';
/* Motor da campanha: herói, imersão por níveis, cenas do mestre, testes e combate. */
let J = null;
const TURNOS_IMG = 4;  // turnos mínimos entre duas pinturas novas
const novoJogo = () => ({ h: null, f: {}, no: null, cena: null, diario: [], luta: null, vivas: [], turnosImg: TURNOS_IMG });
const mod = (h, a) => h.a[a];
const dado = (n, d) => { let s = 0; for (let i = 0; i < n; i++) s += roll(d); return s; };
const sinal = v => (v >= 0 ? '+' : '') + v;

function diario(j, t) { j.diario.unshift({ dia: S.day, t }); pushLog('Diário: ' + t); }
function ganhar(j, xp) { j.h.xp += xp; }
function descansar(j) { j.h.hp = j.h.hpMax; j.h.usos = CLASSES[j.h.classe].hab.usos; S.day++; syncDay(); }
function subirNivel(j) { const h = j.h; h.nivel = 2; const g2 = 2 + roll(6) + mod(h, 'con'); h.hpMax += Math.max(1, g2); h.hp = h.hpMax; h.usos = CLASSES[h.classe].hab.usos; pushLog(`*${h.nome} alcançou o nível 2!*`); }
function revelarLugar(id) { const p = S.places.find(q => q.id === id); if (p) { p.hidden = false; dirty(); save(); } }

/* ---------- prólogo e criação ---------- */
function mostrarArte(cv2, k) {
  const c = cv2.getContext('2d'); cv2.dataset.k = k;
  imagemReal(k, im => { if (cv2.dataset.k === k) pintarNo(cv2, im); }, () => {
    if (cv2.dataset.k !== k) return;
    const base = arte(k), pintura = !k.startsWith('m_');
    cv2.width = base.width; cv2.height = base.height; cv2.classList.toggle('pixel', !pintura); c.imageSmoothingEnabled = pintura;
    c.drawImage(base, 0, 0);
  });
}
function pintarNo(cv2, im) {
  const c = cv2.getContext('2d'); cv2.width = AW * ESC; cv2.height = AH * ESC; cv2.classList.remove('pixel');
  const e = Math.max(cv2.width / im.width, cv2.height / im.height), iw = im.width * e, ih = im.height * e;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(im, (cv2.width - iw) / 2, (cv2.height - ih) / 2, iw, ih);
}
function prologo(i = 0) {
  const pr = $('prologo'), s = PROLOGO[i]; pr.hidden = false;
  pr.innerHTML = `<canvas id="pr-arte"></canvas><div class="texto"><h2>${esc(s.t)}</h2><p>${esc(s.x)}</p><div class="row"><button id="pr-ok" class="btn gold">${i + 1 < PROLOGO.length ? 'Continuar' : 'Criar personagem'}</button>${i ? '' : '<button id="pr-pula" class="btn">Pular prólogo</button>'}</div></div>`;
  mostrarArte($('pr-arte'), s.arte);
  $('pr-ok').addEventListener('click', () => i + 1 < PROLOGO.length ? prologo(i + 1) : criacao());
  $('pr-pula')?.addEventListener('click', criacao);
}
function criacao() {
  const pr = $('prologo'); pr.hidden = false;
  pr.innerHTML = `<div class="criar"><h2>Quem chega a Vau-Claro?</h2><label class="label" for="h-nome">Nome</label><input id="h-nome" maxlength="24" value="Aventureiro"><div class="classes">${Object.entries(CLASSES).map(([k, c]) => `<button class="classe" data-c="${k}"><b>${c.nome}</b><span>${c.desc}</span><small class="tn">Vida ${c.hp} · CA ${c.ca} · ${c.arma}</small><small>${c.hab.nome}</small></button>`).join('')}</div></div>`;
  pr.querySelectorAll('.classe').forEach(b => b.addEventListener('click', () => {
    const c = CLASSES[b.dataset.c], nome = $('h-nome').value.trim() || 'Aventureiro';
    J.h = { nome, classe: b.dataset.c, nivel: 1, xp: 0, hp: c.hp, hpMax: c.hp, ca: c.ca, a: { ...c.a }, ouro: 30, pocoes: 1, usos: c.hab.usos };
    pr.hidden = true; diario(J, 'Você chegou a Vau-Claro. Fale com o burgomestre.'); save();
    const v = S.places.find(p => p.id === 1); focusOn(v.x, v.y, Math.max(fitZ(), 1.5)); openPlace(v);
  }));
}

/* ---------- entrada a partir do mapa do mundo ---------- */
function htmlEntrada(p) {
  if (!J?.h) return '';
  if (p.bloqueio) return `<p class="trava">${esc(p.bloqueio)}</p>`;
  if (!p.no) return '';
  if (moving) return '<p class="trava">O grupo está em viagem.</p>';
  const aqui = p.x === S.party.x && p.y === S.party.y;
  if (aqui) return '<button class="btn gold" id="c-entrar">Entrar</button>';
  const rt = planRoute(p.x, p.y);
  if (!rt || rt.fail) return '<p class="trava">Não há caminho até aqui.</p>';
  const d = Math.max(1, Math.ceil(routeDays(rt, +$('pace').value)));
  return `<button class="btn gold" id="c-entrar">Viajar e entrar (${d} ${d > 1 ? 'dias' : 'dia'})</button>`;
}
function ligarEntrada(p) {
  $('c-entrar')?.addEventListener('click', () => {
    if (p.x === S.party.x && p.y === S.party.y) return entrarNo(p.no);
    route = planRoute(p.x, p.y); closeCard0();
    startTravel(() => entrarNo(p.no));
  });
}

/* ---------- imersão ---------- */
const trilhaNos = id => { const t = []; for (let n = id; n; n = NOS[n].pai) t.unshift(n); return t; };
function entrarNo(id) {
  J.no = id; $('imersao').hidden = false; $('balao').hidden = true;
  const n = NOS[id];
  mostrarArte($('arte'), n.arte); desenharPins(); migalhas();
  irCena(n.cena); save();
}
function migalhas() {
  const m = $('migalhas'); m.innerHTML = '<button class="btn small" id="mg-mundo">Valdren</button>';
  trilhaNos(J.no).forEach(id => { m.insertAdjacentHTML('beforeend', ` <span>›</span> <button class="btn small${id === J.no ? ' on' : ''}" data-n="${id}">${esc(NOS[id].nome)}</button>`); });
  $('mg-mundo').addEventListener('click', sairMundo);
  m.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => { if (b.dataset.n !== J.no && !J.luta) entrarNo(b.dataset.n); }));
}
function sairMundo() { if (J.luta) return; J.no = null; J.cena = null; $('imersao').hidden = true; save(); dirty(); }
function subir() { const p = NOS[J.no].pai; p ? entrarNo(p) : sairMundo(); }
function desenharPins() {
  const box = $('pins'); box.innerHTML = '';
  for (const f of NOS[J.no].filhos || []) {
    const n = NOS[f.id], b = document.createElement('button'), tr = n.trava?.(J);
    b.className = 'pin' + (tr ? ' trancado' : ''); b.style.left = f.x / AW * 100 + '%'; b.style.top = f.y / AH * 100 + '%';
    b.innerHTML = `<i></i><span>${esc(n.nome)}</span>`;
    b.addEventListener('click', () => abrirBalao(f, n, tr));
    box.appendChild(b);
  }
}
function abrirBalao(f, n, tr) {
  const b = $('balao');
  b.innerHTML = `<button class="btn small x" id="bl-x" aria-label="Fechar">✕</button><h2>${esc(n.nome)}</h2><div class="kind">${esc(n.tipo)}</div><hr><p>${esc(n.desc)}</p>${tr ? `<p class="trava">${esc(tr)}</p>` : '<button class="btn gold" id="bl-in">Entrar</button>'}`;
  b.style.left = clamp(f.x / AW * 100, 2, 56) + '%'; b.style.top = clamp(f.y / AH * 100, 3, 42) + '%'; b.hidden = false;
  $('bl-x').addEventListener('click', () => { b.hidden = true; });
  $('bl-in')?.addEventListener('click', () => entrarNo(f.id));
}

/* ---------- o mestre narra ---------- */
function falas(ce) { const v = typeof ce.x === 'function' ? ce.x(J) : ce.x; return v; }
function irCena(id, nota) {
  const ce = CENAS[id]; J.cena = id; J.luta = null;
  if (ce.arte) mostrarArte($('arte'), ce.arte); else mostrarArte($('arte'), NOS[J.no].arte);
  const texto = falas(ce);  // o texto vem antes do efeito: a cena narra o estado em que você chegou
  ce.faz?.(J);
  $('titulo').textContent = ce.t;
  $('falas').innerHTML = (nota ? `<p class="dado">${esc(nota)}</p>` : '') + texto.map(p => `<p>${esc(p)}</p>`).join('');
  montarOpcoes(); $('falas').scrollTop = 0;
}
function montarOpcoes() {
  const ce = CENAS[J.cena] || {}, op = $('opcoes'); op.innerHTML = '';
  (ce.op || []).filter(o => !o.se || o.se(J)).forEach(o => botao(o.t, () => escolher(o)));
  if (NOS[J.no].pai) botao('Voltar', subir, true); else botao('Voltar ao mapa do mundo', sairMundo, true);
  desenharPins(); renderHud(); mostrarFala(true); save();
}
function botao(t, fn, leve) { const b = document.createElement('button'); b.className = 'btn' + (leve ? '' : ' escolha'); b.textContent = t; b.addEventListener('click', fn); $('opcoes').appendChild(b); }
function escolher(o) {
  o.faz?.(J);
  if (o.teste) return testar(o.teste);
  if (o.luta) return iniciarLuta(o.luta);
  if (o.irNo) return entrarNo(o.irNo);
  if (o.sair) return subir();
  irCena(o.vai || J.cena);
}
function bonusTeste(t) { const c = CLASSES[J.h.classe]; return mod(J.h, t.a) + (c.per.includes(t.per) ? 2 : 0); }
function testar(t) {
  const b = bonusTeste(t), d = roll(20), tot = d + b, ok = tot >= t.cd;
  const nota = `${t.per}: d20 ${d} ${sinal(b)} = ${tot} contra CD ${t.cd}. ${ok ? 'Sucesso.' : 'Falha.'}`;
  pushLog(`${t.per}: *${tot}* contra CD ${t.cd} (${ok ? 'sucesso' : 'falha'})`);
  animarDado(d, () => irCena(ok ? t.ok : t.ko, nota));
}
function animarDado(fim, depois) {
  const o = $('opcoes'); o.innerHTML = `<div class="d20 tn" id="d20">20</div>`;
  if (reduced) { $('d20').textContent = fim; return setTimeout(depois, 300); }
  let n = 0; const t = setInterval(() => { const e = $('d20'); if (!e) return clearInterval(t); e.textContent = ++n < 10 ? roll(20) : fim; if (n >= 10) { clearInterval(t); setTimeout(depois, 500); } }, 55);
}

/* ---------- combate ---------- */
function iniciarLuta(id) {
  const L2 = LUTAS[id]; J.luta = { id, inimigos: L2.inimigos.map(e => ({ ...e, max: e.hp })), reg: [`${L2.t}! Você age primeiro.`], furtivo: false };
  if (id === 'sedaine' && J.f.fraca) { J.luta.inimigos[0].hp -= 8; J.luta.reg.push('Sedaine começa ferida (−8 de vida).'); }
  mostrarArte($('arte'), L2.arte); desenharLuta();
}
const vivos = () => J.luta.inimigos.filter(e => e.hp > 0);
function desenharLuta() {
  const c = CLASSES[J.h.classe], L2 = LUTAS[J.luta.id];
  $('pins').innerHTML = ''; $('titulo').textContent = L2.t; mostrarFala(false);
  $('falas').innerHTML = J.luta.inimigos.map(e => `<div class="inimigo${e.hp > 0 ? '' : ' morto'}"><span>${esc(e.n)}</span><span class="tn">${Math.max(0, e.hp)}/${e.max}</span><i style="width:${Math.max(0, e.hp) / e.max * 100}%"></i></div>`).join('') + J.luta.reg.slice(-5).map(l => `<p class="golpe">${esc(l)}</p>`).join('');
  const op = $('opcoes'); op.innerHTML = '';
  botao(`Atacar com ${c.arma}`, () => turno('ataque'));
  if (J.h.usos > 0) botao(`${c.hab.nome} (${J.h.usos})`, () => turno('hab'));
  if (J.h.pocoes > 0 && J.h.hp < J.h.hpMax) botao(`Beber poção (${J.h.pocoes})`, () => turno('pocao'));
  if (L2.fuga) botao('Fugir', () => { J.luta = null; irCena(NOS[J.no].cena, 'Você recua antes que seja tarde.'); }, true);
  renderHud(); save();
}
function golpear(alvo, extra = []) {
  const c = CLASSES[J.h.classe], h = J.h, ben = J.f.bencao && alvo.morto ? 2 : 0, b = mod(h, c.atk) + 2 + ben, d = roll(20), tot = d + b;
  if (d !== 20 && (d === 1 || tot < alvo.ca)) { J.luta.reg.push(`Você erra ${alvo.n} (d20 ${d} ${sinal(b)} = ${tot}, CA ${alvo.ca}).`); return; }
  const crit = d === 20, [n, dd] = c.dano, vl = dado(crit ? n * 2 : n, dd) + mod(h, c.atk) + (J.f.afiada ? 1 : 0) + (c.sagrado && alvo.morto ? roll(4) : 0) + extra.reduce((a, [q, f]) => a + dado(crit ? q * 2 : q, f), 0);
  alvo.hp -= vl; J.luta.reg.push(`${crit ? 'Crítico! ' : ''}Você acerta ${alvo.n} e causa ${vl} de dano.`);
}
function turno(acao) {
  const c = CLASSES[J.h.classe], alvo = vivos()[0], h = J.h;
  if (acao === 'ataque') golpear(alvo);
  else if (acao === 'pocao') { h.pocoes--; const v = dado(2, 4) + 2; h.hp = Math.min(h.hpMax, h.hp + v); J.luta.reg.push(`Você bebe a poção e recupera ${v} de vida.`); }
  else {
    h.usos--; const a = c.hab;
    if (a.tipo === 'cura') { const v = dado(...a.dano) + a.bonus; h.hp = Math.min(h.hpMax, h.hp + v); J.luta.reg.push(`${a.nome}: você recupera ${v} de vida.`); }
    else if (a.tipo === 'auto') { const v = dado(...a.dano) + a.bonus; alvo.hp -= v; J.luta.reg.push(`${a.nome}: acerto automático em ${alvo.n}, ${v} de dano.`); }
    else golpear(alvo, [a.extra]);
  }
  if (!vivos().length) return vitoria();
  for (const e of vivos()) {
    const d = roll(20), tot = d + e.atk;
    if (d === 20 || (d !== 1 && tot >= h.ca)) { const v = Math.max(1, dado(...e.dano) + e.bonus); h.hp -= v; J.luta.reg.push(`${e.n} acerta você: ${v} de dano.`); }
    else J.luta.reg.push(`${e.n} erra você.`);
    if (h.hp <= 0) return derrota();
  }
  desenharLuta();
}
function vitoria() { const id = LUTAS[J.luta.id].ok; J.luta = null; irCena(id, 'Vitória!'); }
function derrota() {
  J.luta = null; J.h.hp = Math.ceil(J.h.hpMax / 2); J.h.ouro = Math.floor(J.h.ouro * .7); S.day += 2; syncDay();
  const v = S.places.find(p => p.id === 1); S.party.x = v.x; S.party.y = v.y;
  diario(J, 'Você foi derrotado e acordou no templo. Perdeu parte do ouro.');
  J.no = 'templo'; mostrarArte($('arte'), 'derrota'); migalhas(); desenharPins();
  $('titulo').textContent = 'Tudo fica escuro';
  $('falas').innerHTML = '<p>Sua visão escurece. A última coisa que você ouve é um silêncio enorme.</p><p>Dois dias depois, você acorda no templo. Um lenhador trouxe você em uma carroça. Madre Ilsa não pergunta nada, e parte da sua bolsa sumiu no caminho. Eu sou um mestre piedoso: a história continua.</p>';
  $('opcoes').innerHTML = ''; botao('Levantar', () => entrarNo('templo')); renderHud(); save();
}

/* ---------- ficha, crônicas, campanha ---------- */
function renderHud() {
  const h = J.h; if (!h) return;
  $('hud').innerHTML = `<b>${esc(h.nome)}</b> <span class="tn">Nv ${h.nivel}</span><span class="vida"><i style="width:${Math.max(0, h.hp) / h.hpMax * 100}%"></i><em class="tn">${Math.max(0, h.hp)}/${h.hpMax}</em></span><span class="tn">${h.ouro} po</span><span class="tn">${h.pocoes} poções</span>`;
}
function abrirFicha() {
  if (!J.h) return; const h = J.h, c = CLASSES[h.classe];
  dialog(`<div class="row sp"><h2>${esc(h.nome)}</h2><button class="btn small" data-close aria-label="Fechar">✕</button></div>
    <p>${c.nome}, nível ${h.nivel}. Vida ${h.hp}/${h.hpMax}, CA ${h.ca}, ${h.xp} XP, ${h.ouro} po.</p>
    <div class="atrib tn">${Object.keys(ATRIB).map(a => `<span><small>${ATRIB[a]}</small>${sinal(h.a[a])}</span>`).join('')}</div>
    <p>Arma: ${c.arma} (d${c.dano[1]}). Habilidade: ${c.hab.nome}, ${h.usos} usos. Perícias: ${c.per.join(', ')}.</p>
    <p>Mochila: ${h.pocoes} poções${J.f.agua ? ', água benta' : ''}${J.f.chave ? ', chave da cripta' : ''}${J.f.badalo && !J.f.fim ? ', badalo do Primeiro Sino' : ''}.</p>
    <h2>Diário</h2>${J.diario.map(d => `<p><b>Dia ${d.dia}:</b> ${esc(d.t)}</p>`).join('') || '<p>Nada anotado ainda.</p>'}`);
}
function abrirCronicas(i = 0) {
  const s = LORE[i];
  dialog(`<div class="row sp"><h2>Crônicas de Valdren</h2><button class="btn small" data-close aria-label="Fechar">✕</button></div>
    <div class="abas">${LORE.map((l, k) => `<button class="btn small${k === i ? ' on' : ''}" data-l="${k}">${esc(l.t)}</button>`).join('')}</div>
    <canvas id="lo-arte"></canvas><h2>${esc(s.t)}</h2>${s.p.map(p => `<p>${esc(p)}</p>`).join('')}`);
  $('dialog').classList.add('larga'); mostrarArte($('lo-arte'), s.arte);
  $('dialog').querySelectorAll('[data-l]').forEach(b => b.addEventListener('click', () => abrirCronicas(+b.dataset.l)));
}
function abrirCampanha() {
  const code = btoa(encodeURIComponent(JSON.stringify(snapshot())));
  dialog(`<div class="row sp"><h2>Campanha</h2><button class="btn small" data-close aria-label="Fechar">✕</button></div>
    <p>O progresso fica salvo neste navegador. Para levar a outro computador, copie o código e cole lá.</p>
    <label class="label" for="w-code">Código da campanha</label><textarea id="w-code" spellcheck="false">${code}</textarea>
    <div class="row"><button id="w-copy" class="btn">Copiar código</button><button id="w-load" class="btn">Carregar código colado</button><button id="w-reset" class="btn">Recomeçar</button></div><div id="err" role="alert"></div>`);
  $('w-copy').addEventListener('click', e => { const pick = () => { $('w-code').select(); $('err').textContent = 'Não consegui copiar sozinho. O texto já está selecionado: use Ctrl+C.'; }; navigator.clipboard ? navigator.clipboard.writeText($('w-code').value).then(() => { e.target.textContent = 'Copiado'; }, pick) : pick(); });
  $('w-load').addEventListener('click', () => {
    try { const j = JSON.parse(decodeURIComponent(atob($('w-code').value.trim()))); if (!Array.isArray(j.places) || typeof j.fog !== 'string') throw 0; $('dialog').hidden = true; carregar(j); }
    catch (_) { $('err').textContent = 'Esse código não é válido. Copie novamente o texto inteiro.'; }
  });
  $('w-reset').addEventListener('click', e => { if (!e.target.dataset.ok) { e.target.dataset.ok = '1'; e.target.textContent = 'Confirmar: apaga todo o progresso'; return; } $('dialog').hidden = true; try { localStorage.removeItem(STORE); } catch (_) { /* nada salvo */ } carregar(null); });
}
function carregar(s) {
  J = s?.j?.h ? { ...novoJogo(), ...s.j, luta: null } : novoJogo();
  $('imersao').hidden = true; $('prologo').hidden = true;
  iniciarMundo(s, () => { if (!J.h) prologo(); else if (J.no) { entrarNo(J.no); } renderHud(); });
}

/* ---------- mestre ao vivo: conversa com o Claude pelo servidor local ---------- */
let mestreOnline = false, pintorOnline = false, falando = false, pinturas = 0;
function mostrarViva(chave) {
  const im = new Image(), cv2 = $('arte'), k = 'viva:' + chave;
  cv2.dataset.k = k;
  im.onload = () => {
    if (cv2.dataset.k !== k) return;
    pintarNo(cv2, im); cv2.classList.remove('surge'); void cv2.offsetWidth; cv2.classList.add('surge');
  };
  im.src = `img/vivo/${chave}.webp?v=${J.vivas.indexOf(chave)}`;
}
/* pintura em segundo plano: o jogo segue, e a imagem só aparece se o herói continuar no mesmo lugar */
async function pedirImagem(chave, cena) {
  if (J.vivas.includes(chave)) return mostrarViva(chave);
  if (!pintorOnline || J.turnosImg < TURNOS_IMG) return;
  J.turnosImg = 0; const no = J.no;
  pinturas++; $('selo').hidden = false;
  try {
    const r = await (await fetch('/api/imagem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave, cena }) })).json();
    if (r.arquivo) { J.vivas.push(chave); save(); if (J.no === no && !J.luta) mostrarViva(chave); }
  } catch (_) { /* sem imagem nova, a cena atual continua na tela */ }
  if (--pinturas === 0) $('selo').hidden = true;
}
const FLAGS_MESTRE = new Set(['contrato', 'pistaSino', 'pistaChave', 'tobin', 'sabeToca', 'lobos', 'sentinela', 'mirel', 'chave', 'nina', 'grolkFim', 'patio', 'bencao', 'ossuario']);
const LUTA_FEITA = { lobos: 'lobos', sentinela: 'sentinela', grolk: 'grolkFim', patio: 'patio', ossuario: 'ossuario', sedaine: 'sedaine' };
function mostrarFala(v) { $('fala').hidden = !(v && mestreOnline); }
function estadoJogo() {
  const h = J.h, c = CLASSES[h.classe], n = NOS[J.no], ce = CENAS[J.cena];
  return {
    heroi: { nome: h.nome, classe: c.nome, nivel: h.nivel, vida: `${h.hp}/${h.hpMax}`, ca: h.ca, ouro: h.ouro, pocoes: h.pocoes, atributos: h.a, pericias: c.per, habilidade: `${c.hab.nome} (${h.usos})` },
    lugar: { id: J.no, nome: n.nome, tipo: n.tipo, descricao: n.desc, caminho: trilhaNos(J.no).map(i => NOS[i].nome) },
    saidas: (n.filhos || []).map(f => ({ id: f.id, nome: NOS[f.id].nome, bloqueio: NOS[f.id].trava?.(J) || undefined })),
    cena: ce ? { titulo: ce.t, texto: falas(ce) } : null,
    botoes: [...$('opcoes').querySelectorAll('.btn')].map(b => b.textContent),
    flags: Object.keys(J.f).filter(k => J.f[k]), dia: S.day, diario: J.diario.slice(0, 6).map(d => d.t),
    imagem: { disponivel: pintorOnline && J.turnosImg >= TURNOS_IMG, prontas: J.vivas.slice(-30) },
  };
}
function bolha(cls, texto) { const p = document.createElement('p'); p.className = cls; p.textContent = texto; $('falas').appendChild(p); $('falas').scrollTop = 1e6; return p; }
async function falarMestre(texto, visivel = true) {
  if (falando || !mestreOnline) return;
  falando = true; $('mestre').classList.add('ocupado'); $('fala-ir').disabled = true;
  if (visivel) bolha('jogador', texto);
  J.turnosImg++;
  const p = bolha('narra', '…'); let bruto = '', falha = null;
  const pinta = () => { p.textContent = bruto.split('<acoes')[0].trim() || '…'; $('falas').scrollTop = 1e6; };
  try {
    const r = await fetch('/api/mestre', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, estado: estadoJogo(), sessao: J.sessao || undefined }) });
    if (!r.ok) { falha = (await r.json().catch(() => ({}))).erro || 'O mestre não respondeu.'; } else {
      const leitor = r.body.getReader(), dec = new TextDecoder(); let resto = '';
      for (;;) {
        const { value, done } = await leitor.read(); if (done) break;
        resto += dec.decode(value, { stream: true });
        const linhas = resto.split('\n'); resto = linhas.pop();
        for (const l of linhas) {
          if (!l) continue; const m = JSON.parse(l);
          if (m.t) { bruto += m.t; pinta(); }
          if (m.fim) J.sessao = m.sessao;
          if (m.erro) { falha = m.erro; if (m.perdeuSessao) J.sessao = null; }
        }
      }
    }
  } catch (_) { falha = 'Perdi a conexão com o servidor local. Veja se a janela do servidor continua aberta.'; }
  falando = false; $('mestre').classList.remove('ocupado'); $('fala-ir').disabled = false;
  if (falha) { p.className = 'erro'; p.textContent = falha; return; }
  pinta(); aplicarAcoes(bruto); save();
}
/* o que o mestre pede passa por esta lista fechada e por limites: nada além disso muda o jogo */
function aplicarAcoes(bruto) {
  const m = bruto.match(/<acoes>([\s\S]*?)<\/acoes>/); if (!m) return;
  let a; try { a = JSON.parse(m[1]); } catch (_) { return; }
  if (!a || typeof a !== 'object') return;
  const h = J.h, num = (v, min, max) => Number.isFinite(v) ? clamp(Math.round(v), min, max) : 0;
  if (typeof a.arte === 'string' && ART[a.arte] && !a.arte.startsWith('m_')) mostrarArte($('arte'), a.arte);
  if (typeof a.ir === 'string' && NOS[a.ir] && a.ir !== J.no && !NOS[a.ir].trava?.(J)) { J.no = a.ir; J.cena = NOS[a.ir].cena; if (!a.arte) mostrarArte($('arte'), NOS[a.ir].arte); migalhas(); }
  if (typeof a.imagem?.chave === 'string' && typeof a.imagem.cena === 'string' && !a.luta) pedirImagem(a.imagem.chave, a.imagem.cena);
  for (const f of Array.isArray(a.flag) ? a.flag : []) if (FLAGS_MESTRE.has(f)) { J.f[f] = true; if (f === 'sabeToca') revelarLugar(3); }
  if (a.cura) h.hp = Math.min(h.hpMax, h.hp + num(a.cura, 0, 12));
  if (a.ouro) h.ouro = Math.max(0, h.ouro + num(a.ouro, -100, 100));
  if (a.xp) ganhar(J, num(a.xp, 0, 100));
  if (typeof a.diario === 'string' && a.diario.trim()) diario(J, a.diario.trim().slice(0, 200));
  if (a.dano) { h.hp -= num(a.dano, 0, 12); if (h.hp <= 0) return derrota(); }
  const t = a.teste;
  if (typeof a.luta === 'string' && LUTAS[a.luta] && !J.f[LUTA_FEITA[a.luta]]) return iniciarLuta(a.luta);
  montarOpcoes();
  if (t && ATRIB[t.a] && typeof t.per === 'string') {
    const pedido = { per: t.per.slice(0, 24), a: t.a, cd: num(t.cd, 5, 25) || 12 }, b = bonusTeste(pedido), d = roll(20), tot = d + b, ok2 = tot >= pedido.cd;
    const nota = `${pedido.per}: d20 ${d} ${sinal(b)} = ${tot} contra CD ${pedido.cd}. ${ok2 ? 'Sucesso.' : 'Falha.'}`;
    pushLog(`${pedido.per}: *${tot}* contra CD ${pedido.cd} (${ok2 ? 'sucesso' : 'falha'})`);
    const guarda = $('opcoes').innerHTML;
    mostrarFala(false);
    animarDado(d, () => { $('opcoes').innerHTML = guarda; montarOpcoes(); bolha('dado', nota); falarMestre(`[Resultado da rolagem] ${nota}`, false); });
  }
}
async function verServidor() {
  if (!location.protocol.startsWith('http')) return;
  try { const st = await (await fetch('/api/status')).json(); mestreOnline = st.mestre === true; pintorOnline = st.pintor === true; } catch (_) { mestreOnline = false; }
  $('mestre-vivo').hidden = !mestreOnline;
  if (J?.no && !J.luta) mostrarFala(true);
}
$('fala').addEventListener('submit', e => {
  e.preventDefault(); const c = $('fala-txt'), v = c.value.trim();
  if (v && !falando) { c.value = ''; falarMestre(v); }
});
$('fala-txt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('fala').requestSubmit(); } });

/* ---------- ligações ---------- */
$('b-world').addEventListener('click', abrirCampanha);
$('b-ficha').addEventListener('click', abrirFicha);
$('b-lore').addEventListener('click', () => abrirCronicas());
$('im-ficha').addEventListener('click', abrirFicha);
$('im-lore').addEventListener('click', () => abrirCronicas());
carregar(loadSaved());
verServidor();
