'use strict';
/* Voz do mestre: separa o texto em frases, pede o áudio ao servidor local e toca em ordem. */
const Voz = (() => {
  const CHAVE = 'os-sete-sinos-voz', TAM_MAX = 450, ADIANTADAS = 2, som = new Audio();
  let cfg = { ligada: true, volume: .9 };
  try { cfg = { ...cfg, ...JSON.parse(localStorage.getItem(CHAVE) || '{}') }; } catch (_) { /* usa o padrão */ }
  let online = false, fila = [], turno = 0, tocando = false, ctrl = new AbortController(), dito = 0, soltar = null;
  let pausada = false, emFala = false, retomar = null;
  const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch (_) { /* vale só nesta sessão */ } };
  const limpar = t => t.split('<acoes')[0].replace(/\s+/g, ' ').trim();
  function frases(t) {
    const saida = [];
    for (let f of t.match(/[^.!?…]+[.!?…]*["”]?\s*/g) || []) {
      f = f.trim();
      while (f.length > TAM_MAX) { const c = f.lastIndexOf(' ', TAM_MAX); saida.push(f.slice(0, c)); f = f.slice(c + 1); }
      if (/[\p{L}\p{N}]/u.test(f)) saida.push(f);
    }
    return saida;
  }
  const pedir = (texto, sinal) => fetch('/api/voz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto }), signal: sinal })
    .then(r => r.ok ? r.blob() : null).catch(() => null);
  function enfileirar(texto) {
    if (!online || !cfg.ligada) return;
    for (const f of frases(texto)) fila.push({ texto: f, audio: null });
    adiantar(); tocar();
  }
  /* só as próximas frases são pedidas: o navegador tem poucas conexões, e o áudio não pode travar saves nem o mestre */
  function adiantar() { for (const item of fila.slice(0, ADIANTADAS)) item.audio ||= pedir(item.texto, ctrl.signal); }
  async function tocar() {
    if (tocando) return;
    tocando = true; const meu = turno;
    while (fila.length && meu === turno) {
      const blob = await fila.shift().audio;
      if (meu !== turno) return;
      adiantar();
      if (!blob) continue;
      if (pausada) await new Promise(r => { retomar = r; });
      if (meu !== turno) return;
      const url = URL.createObjectURL(blob);
      emFala = true;
      await new Promise(fim => { soltar = fim; som.src = url; som.volume = cfg.volume; som.onended = som.onerror = fim; som.play().catch(fim); });
      emFala = false;
      URL.revokeObjectURL(url);
    }
    if (meu === turno) tocando = false;
  }
  function parar() {
    turno++; ctrl.abort(); ctrl = new AbortController(); fila = []; dito = 0; tocando = false;
    som.pause(); soltar?.(); soltar = null; retomar?.(); retomar = null; emFala = false;
  }
  /* fala só as frases já completas de um texto que ainda está chegando */
  function acompanhar(bruto, fim) {
    const t = limpar(bruto), novo = t.slice(dito);
    let corte = fim ? novo.length : 0;
    if (!fim) for (const m of novo.matchAll(/[.!?…]["”]?\s/g)) corte = m.index + m[0].length;
    if (!corte) return;
    dito += corte; enfileirar(novo.slice(0, corte));
  }
  function pintarControles() {
    $('voz-ligar').textContent = cfg.ligada ? 'Voz ligada' : 'Voz desligada';
    $('voz-ligar').classList.toggle('on', cfg.ligada);
    $('voz-volume').value = cfg.volume;
    document.body.classList.toggle('com-voz', online);
  }
  $('voz-ligar').addEventListener('click', () => { cfg.ligada = !cfg.ligada; if (!cfg.ligada) parar(); guardar(); pintarControles(); });
  $('voz-calar').addEventListener('click', parar);
  $('voz-volume').addEventListener('input', e => { cfg.volume = +e.target.value; som.volume = cfg.volume; guardar(); });
  pintarControles();
  return {
    falar(texto) { parar(); enfileirar(limpar(texto)); }, parar, acompanhar,
    pausar() { pausada = true; som.pause(); },
    continuar() { pausada = false; retomar?.(); retomar = null; if (emFala) som.play().catch(() => soltar?.()); },
    set online(v) { online = v; pintarControles(); },
    get estado() { return { online, ligada: cfg.ligada, volume: cfg.volume, fila: fila.length, textos: fila.map(f => f.texto), tocando, pausado: som.paused, tempo: som.currentTime }; },
  };
})();
