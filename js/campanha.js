'use strict';
/* Os Sete Sinos: lore, geografia, lugares, cenas e combates. Novas missões entram aqui como dados. */

/* ===== Geografia de Valdren (coordenadas em tiles do mapa de 240x160) ===== */
const GEO = {
  terras: [[.33, .46, .34], [.67, .42, .33], [.5, .76, .21], [.15, .74, .1], [.9, .8, .075], [.87, .15, .07]],
  serras: [[104, 30, 130, 22, 8], [130, 22, 152, 30, 9], [152, 30, 186, 24, 8], [186, 24, 202, 46, 7], [46, 56, 40, 84, 6]],
  colinas: [[142, 100, 9], [84, 60, 10]],
  rio: [[150, 36], [142, 52], [130, 70], [118, 88], [113, 106], [108, 128], [104, 150]],
  matas: [[96, 76, 22], [180, 84, 15]],
  secos: [[196, 116, 20]],
};
const REINOS = [
  { nome: 'Reino de Aurelia', cor: '#f2c14e', gov: 'Rainha Ysolde IV', x: 62, y: 104 },
  { nome: 'Marca do Vael', cor: '#46d0a8', gov: 'Burgomestres das cidades do rio', x: 118, y: 88 },
  { nome: 'Teocracia de Sarn', cor: '#b06fe0', gov: 'Alta Sineira Maren', x: 176, y: 72 },
  { nome: 'Portos Livres', cor: '#4aa3e8', gov: 'Conselho das Marés', x: 190, y: 118 },
];
/* no: id do lugar jogável; bloqueio: texto dos lugares de missões futuras */
const LUGARES_MAPA = [
  { id: 1, x: 118, y: 88, type: 'cidade', name: 'Vau-Claro', pop: 3400, no: 'vau', desc: 'Cidade de mercadores no único vau seguro do Rio Vael. Guarda o Primeiro Sino, calado há nove noites.' },
  { id: 2, x: 96, y: 76, type: 'mata', name: 'Mata dos Espinhos', no: 'mata', desc: 'Floresta antiga a oeste de Vau-Claro. Lenhadores não entram depois do pôr do sol.' },
  { id: 3, x: 84, y: 60, type: 'masmorra', name: 'Toca dos Dentes-Partidos', no: 'toca', hidden: true, desc: 'Caverna do clã goblin dos Dentes-Partidos, nas colinas ao norte da mata.' },
  { id: 4, x: 142, y: 100, type: 'ruina', name: 'Abadia de Vael', no: 'abadia', desc: 'Mosteiro abandonado há sessenta anos, quando o último monge morreu. Era ali que se cuidava do Primeiro Sino.' },
  { id: 5, x: 62, y: 104, type: 'capital', name: 'Aurelia', pop: 41000, bloqueio: 'A estrada até a capital ficará aberta em uma missão futura.', desc: 'Capital de muralhas brancas, sede da Rainha Ysolde IV. Guarda o Segundo Sino na Torre da Coroa.' },
  { id: 6, x: 176, y: 72, type: 'sino', name: 'Sarn, Cidade dos Salmos', pop: 12000, bloqueio: 'Os portões de Sarn só se abrem para quem traz prova do retorno do Primeiro Sino.', desc: 'Sede da Ordem dos Sineiros e do Terceiro Sino.' },
  { id: 7, x: 190, y: 118, type: 'porto', name: 'Porto do Sal', pop: 9000, bloqueio: 'Nenhum navio zarpa para os Portos Livres durante esta missão.', desc: 'Maior porto de Valdren. O Quarto Sino toca na neblina para guiar os navios.' },
  { id: 8, x: 150, y: 27, type: 'covil', name: 'Monte Cinzário', bloqueio: 'Ninguém sobe o Monte Cinzário sem os sete sinos tocando.', desc: 'Sob esta montanha dorme o Rei Cinzento. Nada cresce em suas encostas.' },
  { id: 9, x: 42, y: 70, type: 'forte', name: 'Forte Vigília', pop: 500, bloqueio: 'A fronteira oeste será tema de outra missão.', desc: 'Última guarnição antes das terras altas. Guarda o Quinto Sino.' },
  { id: 10, x: 216, y: 124, type: 'sino', name: 'Ilha do Sexto Sino', bloqueio: 'O caminho até a ilha ainda é desconhecido.', desc: 'Os mapas antigos marcam aqui uma torre. Os mapas novos não marcam nada.' },
  { id: 11, x: 120, y: 142, type: 'sino', name: 'Mosteiro do Sétimo Sino', bloqueio: 'O Sétimo Sino nunca foi encontrado.', desc: 'Lugar provável do último sino, segundo uma canção de marinheiros.' },
];

/* ===== Crônicas ===== */
const LORE = [
  { t: 'O mundo de Valdren', arte: 'l_mundo', p: ['Valdren é um continente de rios largos, cercado ao norte pela Cordilheira Cinzenta. Seu povo mede as horas pelos sinos: a vida de cada cidade gira em torno de um campanário.', 'Humanos, anões das serras e halflings do rio dividem as cidades. Elfos vivem nas matas antigas e raramente se misturam. Goblins, orcs e coisas piores ocupam o que ninguém vigia.'] },
  { t: 'A Era da Coroa', arte: 'p_coroa', p: ['Há trezentos anos Valdren tinha um único rei, Aldrec Voss. Temendo a morte, ele pactuou com Morrath, deus do Fim, e fundiu ferro de sepultura em uma coroa.', 'A coroa deu a ele a vida eterna e tirou todo o resto. Seu corpo virou cinza viva, e por onde passava os mortos se levantavam para servir. O povo passou a chamá-lo de Rei Cinzento.'] },
  { t: 'Os Sete Sineiros', arte: 'p_sineiros', p: ['Sete fundidores, guiados pela deusa Vael, roubaram a coroa e a fundiram em sete sinos de bronze. Não era possível matar o rei. Era possível fazê-lo dormir.', 'Enquanto os sete tocarem a cada amanhecer, ele dorme sob o Monte Cinzário. Se todos calarem, ele acorda.'] },
  { t: 'A Era dos Sinos', arte: 'p_sono', p: ['Três séculos de paz vieram depois. Reinos surgiram e caíram, e a Ordem dos Sineiros deixou de ser um exército para virar uma burocracia. Muita gente hoje acha que o Rei Cinzento é só uma história para crianças.', 'Dois dos sete sinos já estão perdidos para os registros, e ninguém na corte parece preocupado.'] },
  { t: 'A Noite das Nove Cinzas', arte: 'p_silencio', p: ['Nove noites atrás, o Primeiro Sino, em Vau-Claro, não tocou. Desde então o povo acorda com gosto de cinza na boca, e no cemitério a terra aparece remexida.', 'É aqui que a sua história começa.'] },
  { t: 'Os deuses', arte: 'l_deuses', p: ['Vael, Senhora das Horas: vigília, tempo e promessas cumpridas. Seu símbolo é um sino.', 'Orrin, o Martelo: forja, ofício e trabalho honesto. Sarya, a Verde: colheita, partos e chuva.', 'Morrath, o Fim: a morte e tudo que termina. Não é um deus mau, mas seus sacerdotes acham que nada deveria durar.'] },
  { t: 'As facções', arte: 'l_faccoes', p: ['Ordem dos Sineiros: guardiões dos sete sinos, sediados em Sarn. Antes temidos, hoje velhos e divididos.', 'Culto da Sexta Hora: seguidores do Rei Cinzento. Trabalham escondidos e acreditam que ele trará um mundo sem morte.', 'Coroa de Aurelia: a Rainha Ysolde IV quer ver os sinos sob controle do trono.', 'Clã dos Dentes-Partidos: goblins das colinas que aceitam qualquer serviço por prata.'] },
];

/* ===== Prólogo ===== */
const PROLOGO = [
  { arte: 'p_coroa', t: 'O Rei Cinzento', x: 'Boa noite. Eu sou o seu mestre. Puxe uma cadeira, porque esta história começa há trezentos anos, com um rei que tinha medo de morrer. Aldrec Voss pagou pela imortalidade, e o preço foi tudo o que fazia dele um homem.' },
  { arte: 'p_sineiros', t: 'Os Sete Sineiros', x: 'Sete fundidores arrancaram a coroa da cabeça dele e a derreteram em sete sinos de bronze. Não conseguiram matá-lo. Mas descobriram que, a cada amanhecer, o som dos sinos o mantém dormindo.' },
  { arte: 'p_sono', t: 'Trezentos anos de sono', x: 'E assim foi por trezentos anos. Os sinos tocaram, o rei dormiu sob o Monte Cinzário, e as pessoas esqueceram por que acordavam com aquele som.' },
  { arte: 'p_silencio', t: 'O sino mudo', x: 'Até nove noites atrás. Na cidade de Vau-Claro, o Primeiro Sino não tocou. Desde então, cada morador acorda com gosto de cinza na boca.' },
  { arte: 'p_chegada', t: 'A estrada para Vau-Claro', x: 'Você chega pela estrada do sul ao fim da tarde, com a bolsa leve e uma carta do burgomestre oferecendo trabalho a quem não tenha medo de sujar as mãos. Agora me diga: quem é você?' },
];

/* ===== Heróis ===== */
const CLASSES = {
  guerreiro: { nome: 'Guerreiro', desc: 'Veterano de armadura. Aguenta pancada e bate forte.', hp: 13, ca: 16, a: { for: 3, des: 1, con: 2, int: -1, sab: 1, car: 0 }, atk: 'for', arma: 'Espada longa', dano: [1, 8], per: ['Atletismo', 'Intimidação', 'Sobrevivência'], hab: { nome: 'Retomar Fôlego', usos: 1, tipo: 'cura', dano: [1, 10], bonus: 2 } },
  ladina: { nome: 'Ladina', desc: 'Silenciosa e precisa. Resolve metade dos problemas antes de serem notados.', hp: 10, ca: 14, a: { for: 0, des: 3, con: 1, int: 1, sab: 0, car: 2 }, atk: 'des', arma: 'Adagas', dano: [1, 6], per: ['Furtividade', 'Investigação', 'Persuasão', 'Intuição'], hab: { nome: 'Ataque Furtivo', usos: 2, tipo: 'ataque', extra: [2, 6] } },
  clerigo: { nome: 'Clérigo de Vael', desc: 'Servo da Senhora das Horas. Cura aliados e queima mortos-vivos.', hp: 11, ca: 16, a: { for: 1, des: 0, con: 2, int: 0, sab: 3, car: 1 }, atk: 'sab', arma: 'Maça de bronze', dano: [1, 6], sagrado: true, per: ['Religião', 'Intuição', 'Persuasão'], hab: { nome: 'Curar Ferimentos', usos: 3, tipo: 'cura', dano: [1, 8], bonus: 3 } },
  maga: { nome: 'Maga', desc: 'Estudiosa de magia. Frágil de perto, devastadora à distância.', hp: 8, ca: 12, a: { for: -1, des: 2, con: 1, int: 3, sab: 1, car: 0 }, atk: 'int', arma: 'Raio de Fogo', dano: [1, 10], per: ['Arcanismo', 'Religião', 'Investigação'], hab: { nome: 'Mísseis Mágicos', usos: 3, tipo: 'auto', dano: [3, 4], bonus: 3 } },
};
const ATRIB = { for: 'FOR', des: 'DES', con: 'CON', int: 'INT', sab: 'SAB', car: 'CAR' };

/* ===== Árvore de lugares: mundo > lugar > sala > detalhe =====
   filhos: pontos clicáveis sobre a imagem (x, y em 320x180). trava(J) devolve o motivo do bloqueio. */
const NOS = {
  vau: { nome: 'Vau-Claro', tipo: 'Cidade', arte: 'm_vila', cena: 'vau', desc: 'Cidade do vau do Rio Vael.', filhos: [
    { id: 'praca', x: 176, y: 94 }, { id: 'taverna', x: 124, y: 50 }, { id: 'burgo', x: 262, y: 142 }, { id: 'templo', x: 254, y: 40 }, { id: 'ferraria', x: 138, y: 160 }] },
  praca: { nome: 'Praça do Sino', tipo: 'Praça', arte: 'praca', cena: 'praca', pai: 'vau', desc: 'O coração da cidade, com o campanário ao centro. Hoje está cheia de gente que não dorme direito.', filhos: [{ id: 'campanario', x: 160, y: 96 }] },
  campanario: { nome: 'Campanário', tipo: 'Torre', arte: 'campanario', cena: 'campanario', pai: 'praca', desc: 'Cento e doze degraus de madeira velha sobem até o sino.', filhos: [{ id: 'salasino', x: 262, y: 56 }] },
  salasino: { nome: 'Sala do Sino', tipo: 'Topo da torre', arte: 'sala_sino', cena: 'salasino', pai: 'campanario', desc: 'O Primeiro Sino de Valdren, com três séculos de idade.' },
  taverna: { nome: 'Taverna do Javali Manco', tipo: 'Taverna', arte: 'taverna', cena: 'taverna', pai: 'vau', desc: 'Cerveja escura, ensopado honesto e os melhores boatos do rio.', filhos: [{ id: 'balcao', x: 214, y: 92 }, { id: 'mesa', x: 76, y: 124 }, { id: 'quarto', x: 268, y: 66 }] },
  balcao: { nome: 'Balcão', tipo: 'Conversa', arte: 'balcao', cena: 'balcao', pai: 'taverna', desc: 'Hanna Ruiva atende aqui. Ela ouve tudo que se diz na cidade.' },
  mesa: { nome: 'Mesa dos caçadores', tipo: 'Conversa', arte: 'mesa', cena: 'mesa', pai: 'taverna', desc: 'Bram Duas-Marcas bebe sozinho e olha muito para a porta.' },
  quarto: { nome: 'Quarto alugado', tipo: 'Descanso', arte: 'quarto', cena: 'quarto', pai: 'taverna', desc: 'Cama limpa por 5 peças de ouro a noite.' },
  burgo: { nome: 'Casa do Burgomestre', tipo: 'Residência', arte: 'burgomestre', cena: 'burgo', pai: 'vau', desc: 'Odran Vell governa a cidade daqui. Foi ele quem assinou a sua carta.' },
  templo: { nome: 'Templo de Vael', tipo: 'Templo', arte: 'templo', cena: 'templo', pai: 'vau', desc: 'Madre Ilsa cuida dos doentes, e agora todos têm os mesmos pesadelos.' },
  ferraria: { nome: 'Ferraria de Dorn', tipo: 'Loja', arte: 'ferraria', cena: 'ferraria', pai: 'vau', desc: 'Dorn Mão-de-Ferro vende de pregos a lâminas.' },

  mata: { nome: 'Mata dos Espinhos', tipo: 'Floresta', arte: 'm_mata', cena: 'mata', desc: 'Uma trilha sobe da estrada e se perde entre os troncos.', filhos: [{ id: 'trilha', x: 118, y: 104 }, { id: 'cabana', x: 90, y: 126 }, { id: 'pedras', x: 214, y: 46 }] },
  trilha: { nome: 'Trilha dos Lobos', tipo: 'Caminho', arte: 'trilha', cena: 'trilha', pai: 'mata', desc: 'Pegadas grandes cruzam o caminho.' },
  cabana: { nome: 'Cabana da Eremita', tipo: 'Moradia', arte: 'cabana', cena: 'cabana', pai: 'mata', desc: 'Fumaça sobe de uma chaminé de pedra no meio do nada.', trava: J => J.f.lobos ? '' : 'Os lobos fecham a trilha. Passe por eles primeiro.' },
  pedras: { nome: 'Pedras Antigas', tipo: 'Marco', arte: 'trilha', cena: 'pedras', pai: 'mata', desc: 'Quatro pedras pálidas marcam um antigo limite da Abadia.' },

  toca: { nome: 'Toca dos Dentes-Partidos', tipo: 'Caverna', arte: 'm_toca', cena: 'toca', desc: 'Dentes de ossos cravados na rocha marcam a entrada.', filhos: [{ id: 'entrada', x: 160, y: 150 }, { id: 'salao', x: 168, y: 60 }, { id: 'jaula', x: 56, y: 112 }] },
  entrada: { nome: 'Boca da Toca', tipo: 'Entrada', arte: 'toca_entrada', cena: 'entrada', pai: 'toca', desc: 'Um sentinela goblin se coça ao lado de uma tocha.' },
  salao: { nome: 'Salão do Chefe', tipo: 'Salão', arte: 'toca_salao', cena: 'salao', pai: 'toca', desc: 'O trono de Grolk Dente-Único é feito de ossos e barris roubados.', trava: J => J.f.sentinela ? '' : 'O sentinela da entrada precisa ser resolvido primeiro.' },
  jaula: { nome: 'Jaula', tipo: 'Prisão', arte: 'toca_jaula', cena: 'jaula', pai: 'toca', desc: 'Grades enferrujadas e uma voz fraca lá dentro.', trava: J => J.f.sentinela ? '' : 'O sentinela da entrada precisa ser resolvido primeiro.' },

  abadia: { nome: 'Abadia de Vael', tipo: 'Ruína', arte: 'm_abadia', cena: 'abadia', desc: 'Muros caídos cercam um claustro tomado pelo mato.', filhos: [{ id: 'patio', x: 140, y: 112 }, { id: 'capela', x: 130, y: 72 }, { id: 'descida', x: 220, y: 68 }] },
  patio: { nome: 'Claustro', tipo: 'Pátio', arte: 'patio', cena: 'patio', pai: 'abadia', desc: 'Os túmulos dos monges estão abertos. Foram abertos por dentro.' },
  capela: { nome: 'Capela de Vael', tipo: 'Capela', arte: 'capela', cena: 'capela', pai: 'abadia', desc: 'Um vitral resistiu. Sete sinos pintados, e uma frase gravada no altar.' },
  descida: { nome: 'Escada da Cripta', tipo: 'Passagem', arte: 'cripta', cena: 'descida', pai: 'abadia', desc: 'Uma porta de ferro fecha a escada que desce para a cripta.', filhos: [{ id: 'galeria', x: 160, y: 120 }], trava: J => J.f.patio ? '' : 'Os mortos do claustro bloqueiam o caminho.' },
  galeria: { nome: 'Cripta', tipo: 'Masmorra', arte: 'm_cripta', cena: 'galeria', pai: 'descida', desc: 'Corredores de pedra sob a abadia.', filhos: [{ id: 'ossuario', x: 160, y: 40 }, { id: 'camara', x: 276, y: 92 }], trava: J => (J.f.chave || J.f.tunel) ? '' : 'A porta está trancada. Alguém deve ter a chave.' },
  ossuario: { nome: 'Ossuário', tipo: 'Sala', arte: 'ossuario', cena: 'ossuario', pai: 'galeria', desc: 'Paredes inteiras feitas de crânios.' },
  camara: { nome: 'Câmara do Altar', tipo: 'Sala final', arte: 'altar_cinza', cena: 'camara', pai: 'galeria', desc: 'Uma luz violeta pulsa na escuridão.', trava: J => J.f.ossuario ? '' : 'Os mortos do ossuário ainda guardam o caminho.' },
};

/* ===== Combates ===== */
const LUTAS = {
  lobos: { arte: 'lobos', t: 'Lobos cinzentos', ok: 'lobos_ok', fuga: true, inimigos: [{ n: 'Lobo', hp: 9, ca: 12, atk: 3, dano: [1, 4], bonus: 1 }, { n: 'Lobo', hp: 9, ca: 12, atk: 3, dano: [1, 4], bonus: 1 }] },
  sentinela: { arte: 'toca_entrada', t: 'Sentinela goblin', ok: 'sentinela_ok', inimigos: [{ n: 'Goblin sentinela', hp: 8, ca: 13, atk: 3, dano: [1, 6], bonus: 1 }] },
  grolk: { arte: 'toca_salao', t: 'Grolk Dente-Único', ok: 'grolk_morto', inimigos: [{ n: 'Grolk', hp: 18, ca: 14, atk: 4, dano: [1, 8], bonus: 1 }, { n: 'Goblin', hp: 6, ca: 12, atk: 3, dano: [1, 6], bonus: 0 }] },
  patio: { arte: 'patio', t: 'Monges mortos', ok: 'patio_ok', fuga: true, inimigos: [{ n: 'Esqueleto', hp: 9, ca: 12, atk: 3, dano: [1, 6], bonus: 1, morto: true }, { n: 'Esqueleto', hp: 9, ca: 12, atk: 3, dano: [1, 6], bonus: 1, morto: true }] },
  ossuario: { arte: 'ossuario', t: 'Guardiões do ossuário', ok: 'ossuario_ok', fuga: true, inimigos: [{ n: 'Esqueleto', hp: 11, ca: 13, atk: 4, dano: [1, 6], bonus: 2, morto: true }, { n: 'Esqueleto', hp: 11, ca: 13, atk: 4, dano: [1, 6], bonus: 2, morto: true }] },
  sedaine: { arte: 'altar_cinza', t: 'Irmã Sedaine', ok: 'sedaine_ok', inimigos: [{ n: 'Irmã Sedaine', hp: 26, ca: 13, atk: 5, dano: [1, 8], bonus: 2 }, { n: 'Esqueleto', hp: 8, ca: 12, atk: 3, dano: [1, 6], bonus: 1, morto: true }] },
};

/* ===== Cenas: o mestre narra (x), e as opções (op) levam adiante =====
   op: t texto, se condição, faz efeito, vai cena, sair volta ao lugar acima, luta combate,
   teste { per, a, cd, ok, ko } rolagem de d20 */
const CENAS = {
  vau: { t: 'Vau-Claro', x: J => J.f.fim
    ? ['O sino voltou a marcar as horas de Vau-Claro. As pessoas acenam para você nas ruas. Por enquanto, a cidade dorme em paz.']
    : ['Eu descrevo assim: telhados vermelhos, um rio largo e um campanário de pedra no meio de tudo. As pessoas andam com olheiras fundas. Ninguém fala alto.', 'Clique em um lugar da cidade para ver o que há ali.'] },
  praca: { t: 'Praça do Sino', x: J => J.f.fim ? ['As crianças brincam de novo na praça. Em cima, o bronze brilha.'] : ['Uma mulher varre cinza fina dos degraus do campanário. Ela diz que ontem varreu o mesmo lugar.', '"Nove noites sem sino", resmunga um velho. "Na décima, dizem que os mortos do cemitério levantam para perguntar a hora."', 'A porta da torre está aberta, e ninguém sobe.'] },
  campanario: { t: 'Campanário', x: ['Os degraus rangem a cada passo. O ar fica mais frio conforme você sobe. Lá em cima, algo balança devagar sem fazer som nenhum.'] },
  salasino: { t: 'Sala do Sino', x: J => {
    if (J.f.badalo && !J.f.fim) return ['Você traz o badalo. Ele pesa mais do que deveria, como se soubesse o que vai acontecer.'];
    if (J.f.fim) return ['O sino descansa em silêncio entre uma hora e outra. Não é mais um silêncio ruim.'];
    return ['O Primeiro Sino é enorme, maior que um cavalo. Alguém o puxa e ele balança, mas não faz som: o badalo foi arrancado.', J.f.pistaSino ? 'Você já examinou esta sala. As pegadas pequenas e a cera negra ainda estão aqui.' : 'Há marcas no chão, e a porta lá de baixo não foi arrombada.'];
  }, op: [
    { t: 'Examinar a sala com cuidado', se: J => !J.f.pistaSino && !J.f.badalo, teste: { per: 'Investigação', a: 'int', cd: 11, ok: 'sino_ok', ko: 'sino_ko' } },
    { t: 'Recolocar o badalo e tocar o sino', se: J => J.f.badalo && !J.f.fim, vai: 'final1' },
  ] },
  sino_ok: { arte: 'sala_sino', t: 'O que ficou para trás', x: ['Bom olho. Pegadas de pés pequenos, de três dedos: goblins. Cera negra pingada em círculo, que não é vela de igreja. E uma coisa pior: a tranca foi aberta com chave.', 'Alguém da cidade abriu a porta. Eu anotaria isso, se fosse você.'], faz: J => { J.f.pistaSino = J.f.pistaChave = true; diario(J, 'Goblins roubaram o badalo, e alguém abriu a torre com chave.'); }, op: [{ t: 'Continuar', vai: 'salasino' }] },
  sino_ko: { arte: 'sala_sino', t: 'Rastros confusos', x: ['A luz é ruim e você não tira muita coisa dali. Vê pegadas pequenas, talvez de goblins, e pingos de cera preta.'], faz: J => { J.f.pistaSino = true; diario(J, 'Pegadas pequenas e cera preta na sala do sino.'); }, op: [{ t: 'Continuar', vai: 'salasino' }] },

  taverna: { t: 'Taverna do Javali Manco', x: ['O calor da lareira bate no rosto. Há meia dúzia de fregueses e nenhuma canção. Hanna Ruiva, atrás do balcão, mede você de cima a baixo. Na mesa do canto, um caçador bebe sozinho.'] },
  balcao: { t: 'Hanna Ruiva', x: J => J.f.fim ? ['"Essa é por conta da casa", diz Hanna, deslizando uma caneca. "Pela primeira vez em dias, dormi até o galo."'] : ['"Forasteiro com carta do Odran, né?", diz Hanna. "Boa sorte. Cerveja custa uma peça. Conselho é de graça."'], op: [
    { t: 'Perguntar sobre o sino', vai: 'hanna_sino' },
    { t: 'Perguntar sobre o sacristão', se: J => J.f.pistaChave && !J.f.tobin, vai: 'hanna_tobin' },
  ] },
  hanna_sino: { arte: 'balcao', t: 'Hanna Ruiva', x: ['"Na noite em que parou, cães uivaram até a alvorada. Bram, ali no canto, viu luzes verdes na mata. Pergunte a ele, mas leve uma rodada."', '"E a Abadia velha... tem fumaça lá de novo. E ali não mora ninguém há sessenta anos."'], faz: J => diario(J, 'Hanna falou de luzes na mata e de fumaça na Abadia de Vael.'), op: [{ t: 'Agradecer', vai: 'balcao' }] },
  hanna_tobin: { arte: 'balcao', t: 'Hanna Ruiva', x: ['"O Tobin? Único além da Madre que tem a chave da torre. Coitado, anda um trapo. A filha dele, Nina, sumiu faz duas semanas. Ele diz que foi visitar a tia."', 'Ela limpa o mesmo copo pela terceira vez. "Tobin não tem tia."'], faz: J => diario(J, 'Tobin, o sacristão, tem a chave. A filha dele, Nina, sumiu.'), op: [{ t: 'Agradecer', vai: 'balcao' }] },
  mesa: { t: 'Bram Duas-Marcas', x: J => J.f.sabeToca ? ['Bram ergue a caneca para você e continua olhando a porta.'] : ['"Tá de pé me olhando por quê?", diz o caçador, sem levantar a vista. Duas cicatrizes cortam a cara dele.'], op: [
    { t: 'Pagar uma rodada (2 po)', se: J => !J.f.sabeToca && J.h.ouro >= 2, faz: J => { J.h.ouro -= 2; }, vai: 'bram' },
    { t: 'Convencê-lo a falar', se: J => !J.f.sabeToca, teste: { per: 'Persuasão', a: 'car', cd: 12, ok: 'bram', ko: 'bram_ko' } },
  ] },
  bram: { arte: 'mesa', t: 'Bram Duas-Marcas', x: ['Bram desenha na mesa com o dedo molhado de cerveja. "Goblins. Os Dentes-Partidos. Têm uma toca nas colinas, ao norte da Mata dos Espinhos. Viram eles carregando um troço pesado, de ferro, na noite que o sino calou."', '"Cuidado com os lobos na trilha. Eles não caçam mais sozinhos."', 'Marquei a toca no seu mapa.'], faz: J => { J.f.sabeToca = true; revelarLugar(3); diario(J, 'A Toca dos Dentes-Partidos foi marcada no mapa.'); }, op: [{ t: 'Voltar', vai: 'mesa' }] },
  bram_ko: { arte: 'mesa', t: 'Bram Duas-Marcas', x: ['"Conversa não enche caneca", resmunga ele, e vira o rosto.'], op: [{ t: 'Voltar', vai: 'mesa' }] },
  quarto: { t: 'Quarto alugado', x: J => [`Cama de palha limpa e uma vela. Custa 5 po e recupera toda a sua vida e habilidades. Você tem ${J.h.ouro} po.`], op: [{ t: 'Dormir (5 po, avança 1 dia)', se: J => J.h.ouro >= 5, faz: J => { J.h.ouro -= 5; descansar(J); }, vai: 'dormiu' }] },
  dormiu: { arte: 'quarto', t: 'Uma noite mal dormida', x: J => J.f.fim ? ['Você dorme como uma pedra. Pela manhã, o sino marca a hora.'] : ['Você dorme. Sonha com um trono de cinza e uma voz que pergunta que horas são. Acorda com gosto ruim na boca, mas descansado.'], op: [{ t: 'Levantar', sair: true }] },
  burgo: { t: 'Odran Vell', x: J => {
    if (J.f.fim) return ['"Vau-Claro tem uma dívida com você", diz Odran. Dessa vez, ele olha nos seus olhos.'];
    if (J.f.contrato) return ['"Traga o badalo. O resto, deixe comigo", diz Odran, voltando aos papéis.'];
    return ['Odran Vell é um homem magro, de barba branca, que não dorme há dias. "Você veio. Ótimo. Sente-se."', '"Roubaram o badalo do nosso sino. Se isso chegar a Sarn, a Ordem assume a cidade. Se chegar à rainha, pior. Traga-o de volta em silêncio. Pago 150 peças de ouro, 20 agora."'];
  }, op: [
    { t: 'Aceitar o trabalho', se: J => !J.f.contrato, faz: J => { J.f.contrato = true; J.h.ouro += 20; diario(J, 'Contrato aceito: recuperar o badalo por 150 po (20 já pagas).'); }, vai: 'burgo' },
    { t: 'Pedir um pagamento melhor', se: J => !J.f.contrato && !J.f.barganha, teste: { per: 'Persuasão', a: 'car', cd: 13, ok: 'burgo_mais', ko: 'burgo_nao' } },
  ] },
  burgo_mais: { arte: 'burgomestre', t: 'Odran Vell', x: ['Odran suspira. "Duzentas, então. E nem uma a mais."'], faz: J => { J.f.barganha = true; J.f.bonus = 50; }, op: [{ t: 'Continuar', vai: 'burgo' }] },
  burgo_nao: { arte: 'burgomestre', t: 'Odran Vell', x: ['"O cofre da cidade não é um poço, aventureiro."'], faz: J => { J.f.barganha = true; }, op: [{ t: 'Continuar', vai: 'burgo' }] },
  templo: { t: 'Templo de Vael', x: J => J.f.fim ? ['Madre Ilsa acende uma vela por você. "A Senhora das Horas não esquece quem cumpre promessas."'] : ['O templo cheira a cera e a remédio. Doentes dormem nos bancos. Madre Ilsa troca panos sem parar, e um homem magro, Tobin, o sacristão, evita olhar para você.'], op: [
    { t: 'Perguntar sobre os sinos', vai: 'ilsa_sinos' },
    { t: 'Pedir cura', se: J => !J.f.curaTemplo && J.h.hp < J.h.hpMax, faz: J => { J.f.curaTemplo = true; J.h.hp = J.h.hpMax; }, vai: 'ilsa_cura' },
    { t: 'Pressionar Tobin sobre a chave da torre', se: J => J.f.pistaChave && !J.f.tobin, teste: { per: 'Intuição', a: 'sab', cd: 11, ok: 'tobin_ok', ko: 'tobin_ko' } },
  ] },
  ilsa_sinos: { arte: 'templo', t: 'Madre Ilsa', x: ['"Sete sinos, feitos da coroa do Rei Cinzento. Enquanto tocarem, ele dorme. Um sino calado não o acorda. Mas o sono dele fica leve, e a cinza sobe."', '"O badalo tem que ser derretido por um rito de Morrath para que o sino morra de verdade. Se alguém quisesse fazer isso, usaria um lugar consagrado. Como a velha Abadia."', 'Ela põe um frasco na sua mão. "Leve. Vai precisar."'], faz: J => { if (!J.f.pocaoIlsa) { J.f.pocaoIlsa = true; J.h.pocoes++; diario(J, 'Madre Ilsa suspeita de um rito na Abadia de Vael.'); } }, op: [{ t: 'Agradecer', vai: 'templo' }] },
  ilsa_cura: { arte: 'templo', t: 'Madre Ilsa', x: ['Ela apoia a mão no seu ombro e murmura uma prece curta. O calor desce pelas costelas, e a dor some.'], op: [{ t: 'Agradecer', vai: 'templo' }] },
  tobin_ok: { arte: 'templo', t: 'A confissão de Tobin', x: ['Você não ergue a voz. Só olha. E o homem desaba.', '"Eles levaram a Nina. Uma mulher de capuz veio com os goblins e disse: a chave ou a menina. Eu dei a chave. Deusa me perdoe. Ela disse que a Nina fica na toca até o rito acabar."'], faz: J => { J.f.tobin = true; diario(J, 'Tobin confessou: entregou a chave porque a filha Nina é refém na toca.'); }, op: [{ t: 'Prometer buscar Nina', vai: 'templo' }] },
  tobin_ko: { arte: 'templo', t: 'Tobin', x: ['"Não sei de nada!", diz ele, recuando para a sacristia. Madre Ilsa olha feio para você. Mas o medo dele era real, e Tobin continua aqui.'], op: [{ t: 'Deixar para depois', vai: 'templo' }] },
  ferraria: { t: 'Ferraria de Dorn', x: J => [`O martelo para quando você entra. "Dorn. Vendo o que está na parede. Sem fiado." Você tem ${J.h.ouro} po.`], op: [
    { t: 'Comprar poção de cura (20 po)', se: J => J.h.ouro >= 20, faz: J => { J.h.ouro -= 20; J.h.pocoes++; }, vai: 'ferraria' },
    { t: 'Comprar água benta (15 po)', se: J => J.h.ouro >= 15 && !J.f.agua, faz: J => { J.h.ouro -= 15; J.f.agua = true; }, vai: 'ferraria' },
    { t: 'Afiar a arma (25 po, +1 de dano)', se: J => J.h.ouro >= 25 && !J.f.afiada, faz: J => { J.h.ouro -= 25; J.f.afiada = true; }, vai: 'ferraria' },
  ] },

  mata: { t: 'Mata dos Espinhos', x: ['Os galhos fecham o céu. Tudo aqui tem espinho, até o silêncio. Mais adiante, a trilha se divide.'] },
  trilha: { t: 'Trilha dos Lobos', x: J => J.f.lobos ? ['A trilha está livre agora.'] : ['Você ouve antes de ver: respiração. Olhos amarelos entre os troncos. Dois lobos cinzentos, com cinza no pelo, bloqueiam a trilha.'], op: [
    { t: 'Passar sem provocar', se: J => !J.f.lobos, teste: { per: 'Sobrevivência', a: 'sab', cd: 12, ok: 'lobos_ok', ko: 'lobos_ataque' } },
    { t: 'Sacar a arma', se: J => !J.f.lobos, luta: 'lobos' },
  ] },
  lobos_ataque: { arte: 'lobos', t: 'Lobos cinzentos', x: ['Um galho quebra sob o seu pé. Os lobos avançam.'], op: [{ t: 'Lutar', luta: 'lobos' }] },
  lobos_ok: { arte: 'trilha', t: 'Caminho livre', x: ['Os lobos somem entre as árvores. A trilha está aberta, e já dá para ver fumaça ao longe.'], faz: J => { J.f.lobos = true; ganhar(J, 50); }, op: [{ t: 'Seguir', sair: true }] },
  cabana: { t: 'Mirel, a Eremita', x: J => J.f.mirel ? ['Mirel mexe uma panela e nem olha para você. "Já disse o que sabia."'] : ['Uma velha de cabelos brancos, apoiada em um cajado, espera na porta como se soubesse que você vinha.', '"Os goblins cavam há meses, buscando prata. A jaula deles dá num túnel, e o túnel dá na cripta da Abadia. Quem entra por ali não precisa de chave."', '"Tome este unguento. E não confie em ninguém de capuz, nem no meu."'], faz: J => { if (!J.f.mirel) { J.f.mirel = true; J.h.pocoes++; ganhar(J, 25); diario(J, 'Mirel contou: a jaula da toca tem um túnel até a cripta da Abadia.'); } } },
  pedras: { t: 'Pedras Antigas', x: ['Quatro pedras com sinos gravados. Do lado de cá, a mata. Do lado de lá, ao longe, a torre quebrada da Abadia. Alguém deixou cera negra pingada na pedra maior.'] },

  toca: { t: 'Toca dos Dentes-Partidos', x: ['Cheiro de fumaça, pelo molhado e carne velha. Lá dentro, risadas agudas ecoam na pedra.'] },
  entrada: { t: 'Boca da Toca', x: J => J.f.sentinela ? ['A entrada está livre.'] : ['Um goblin está sentado numa pedra, afiando um osso. Ainda não viu você.'], op: [
    { t: 'Passar sem ser visto', se: J => !J.f.sentinela, teste: { per: 'Furtividade', a: 'des', cd: 12, ok: 'sentinela_ok', ko: 'sentinela_visto' } },
    { t: 'Atacar', se: J => !J.f.sentinela, luta: 'sentinela' },
  ] },
  sentinela_visto: { arte: 'toca_entrada', t: 'Visto!', x: ['Uma pedrinha rola. O goblin levanta as orelhas e guincha.'], op: [{ t: 'Lutar', luta: 'sentinela' }] },
  sentinela_ok: { arte: 'toca_entrada', t: 'Caminho livre', x: ['O caminho para dentro está livre.'], faz: J => { J.f.sentinela = true; ganhar(J, 25); }, op: [{ t: 'Entrar', sair: true }] },
  salao: { t: 'Salão do Chefe', x: J => {
    if (J.f.grolkFim) return ['O salão está vazio e fede a fumaça.'];
    return ['Em um trono de ossos, Grolk Dente-Único rói uma costela. Ao redor, goblins param de rir. Em volta do pescoço dele, em um cordão, há uma chave de ferro.', '"Grande vem na casa de Grolk", diz ele, mostrando o único dente. "Grande quer o quê?"'];
  }, op: [
    { t: 'Exigir a chave com ameaças', se: J => !J.f.grolkFim, teste: { per: 'Intimidação', a: 'for', cd: 14, ok: 'grolk_medo', ko: 'grolk_ri' } },
    { t: 'Oferecer 30 po pela chave', se: J => !J.f.grolkFim && J.h.ouro >= 30, faz: J => { J.h.ouro -= 30; }, vai: 'grolk_compra' },
    { t: 'Atacar Grolk', se: J => !J.f.grolkFim, luta: 'grolk' },
  ] },
  grolk_ri: { arte: 'toca_salao', t: 'Grolk ri', x: ['A gargalhada dele faz os outros rirem também. Então ele para. "Mata."'], op: [{ t: 'Lutar', luta: 'grolk' }] },
  grolk_medo: { arte: 'toca_salao', t: 'Grolk recua', x: ['Algo na sua voz faz o sorriso dele sumir. Ele arranca o cordão e joga a chave aos seus pés. "Moça do capuz não paga bem o bastante. Leva."'], faz: J => { J.f.grolkFim = J.f.chave = true; ganhar(J, 75); diario(J, 'Você tem a chave da cripta da Abadia.'); }, op: [{ t: 'Continuar', sair: true }] },
  grolk_compra: { arte: 'toca_salao', t: 'Negócio fechado', x: ['Grolk morde uma moeda e sorri. "Grande sabe negociar." A chave cai aos seus pés.'], faz: J => { J.f.grolkFim = J.f.chave = true; ganhar(J, 50); diario(J, 'Você comprou a chave da cripta da Abadia.'); }, op: [{ t: 'Continuar', sair: true }] },
  grolk_morto: { arte: 'toca_salao', t: 'O trono vazio', x: ['Grolk cai sobre os próprios ossos. Os goblins fogem pelos túneis. Você pega a chave do cordão, e encontra 25 peças de ouro no baú.'], faz: J => { J.f.grolkFim = J.f.chave = true; J.h.ouro += 25; ganhar(J, 100); diario(J, 'Grolk caiu. Você tem a chave da cripta.'); }, op: [{ t: 'Continuar', sair: true }] },
  jaula: { t: 'A jaula', x: J => J.f.nina ? ['A jaula está aberta. No fundo, um túnel estreito desce para o leste.'] : ['Uma menina de uns dez anos segura as grades com as duas mãos. "Você veio do meu pai?"'], op: [
    { t: 'Soltar a menina', se: J => !J.f.nina && J.f.grolkFim, vai: 'nina' },
    { t: 'Forçar a tranca', se: J => !J.f.nina && !J.f.grolkFim, teste: { per: 'Atletismo', a: 'for', cd: 13, ok: 'nina', ko: 'nina_ko' } },
    { t: 'Descer o túnel até a cripta', se: J => J.f.nina && J.f.mirel, faz: J => { J.f.tunel = true; J.f.patio = true; }, irNo: 'galeria' },
  ] },
  nina_ko: { arte: 'toca_jaula', t: 'A tranca aguenta', x: ['O ferro geme, mas não cede. Só quem manda aqui tem a chave disso.'], op: [{ t: 'Voltar', vai: 'jaula' }] },
  nina: { arte: 'toca_jaula', t: 'Nina', x: ['A grade cede. Nina se agarra na sua cintura. "A moça de capuz leva tudo para a Abadia. Ela disse que meu pai é um bom menino."', 'Você a coloca no caminho de casa, seguindo a trilha.'], faz: J => { J.f.nina = true; ganhar(J, 50); diario(J, 'Nina está livre e voltou a Vau-Claro.'); }, op: [{ t: 'Continuar', vai: 'jaula' }] },

  abadia: { t: 'Abadia de Vael', x: ['Colunas caídas, mato alto e um silêncio de lugar vigiado. Um fio de fumaça sobe de algum lugar debaixo das pedras.'] },
  patio: { t: 'Claustro', x: J => J.f.patio ? ['Só ossos espalhados agora.'] : ['Os túmulos estão abertos. Dois monges mortos há décadas se viram para você, ainda em hábitos podres. Uma luz vermelha acende onde deveriam estar os olhos.'], op: [{ t: 'Enfrentá-los', se: J => !J.f.patio, luta: 'patio' }] },
  patio_ok: { arte: 'patio', t: 'Silêncio', x: ['Os ossos caem de uma vez, como se um fio tivesse sido cortado. O caminho até a escada está livre.'], faz: J => { J.f.patio = true; ganhar(J, 50); }, op: [{ t: 'Continuar', sair: true }] },
  capela: { t: 'Capela de Vael', x: J => J.f.bencao ? ['A luz do vitral parece um pouco mais quente sobre você.'] : ['Sob o vitral, gravado no altar: "Seis horas vigio, uma hora calo. Qual hora o rei não pode ouvir?" Sete sininhos pendem do altar, cada um com um número.'], op: [
    { t: 'Tocar o primeiro sino', se: J => !J.f.bencao && !J.f.errouCapela, vai: 'capela_ko' },
    { t: 'Tocar o sexto sino', se: J => !J.f.bencao && !J.f.errouCapela, vai: 'capela_ko' },
    { t: 'Tocar o sétimo sino', se: J => !J.f.bencao && !J.f.errouCapela, vai: 'capela_ok' },
    { t: 'Interpretar o enigma', se: J => !J.f.bencao && !J.f.errouCapela && !J.f.dica, teste: { per: 'Religião', a: 'sab', cd: 12, ok: 'capela_dica', ko: 'capela_sem' } },
  ] },
  capela_dica: { arte: 'capela', t: 'Uma lembrança', x: ['Você lembra de uma prece antiga: "Vigia seis, e na sétima descansa." Sete sinos, e a hora calada é a sétima.'], faz: J => { J.f.dica = true; }, op: [{ t: 'Voltar', vai: 'capela' }] },
  capela_sem: { arte: 'capela', t: 'Nada vem à mente', x: ['As palavras parecem familiares, mas a lembrança foge.'], faz: J => { J.f.dica = true; }, op: [{ t: 'Voltar', vai: 'capela' }] },
  capela_ok: { arte: 'capela', t: 'A bênção de Vael', x: ['A nota é pura, e dura mais do que deveria. O frio sai dos seus ossos. Sua arma brilha por um instante.', 'Daqui em diante, você acerta com +2 os mortos-vivos.'], faz: J => { J.f.bencao = true; ganhar(J, 50); }, op: [{ t: 'Continuar', vai: 'capela' }] },
  capela_ko: { arte: 'capela', t: 'Uma nota errada', x: ['O som sai rachado. O vitral escurece, e a capela fica quieta. Ela não vai responder de novo.'], faz: J => { J.f.errouCapela = true; }, op: [{ t: 'Continuar', vai: 'capela' }] },
  descida: { t: 'Escada da Cripta', x: J => (J.f.chave || J.f.tunel) ? ['A chave de Grolk gira, e a porta geme. Lá embaixo há frio e um brilho violeta.'] : ['Uma porta de ferro maciça. A fechadura é nova, ainda brilhante. Não adianta forçar.'] },
  galeria: { t: 'Cripta', x: ['Túmulos em nichos dos dois lados. Cera negra faz uma trilha no chão, seguindo para leste.'] },
  ossuario: { t: 'Ossuário', x: J => J.f.ossuario ? ['Os crânios das paredes parecem observar você.'] : ['Paredes de crânios. Dois deles se soltam, e os esqueletos se montam no ar, com lâminas antigas nas mãos.'], op: [{ t: 'Lutar', se: J => !J.f.ossuario, luta: 'ossuario' }] },
  ossuario_ok: { arte: 'ossuario', t: 'Caminho aberto', x: ['Um osso rola e para. Dá para ouvir, mais adiante, um cântico baixo.'], faz: J => { J.f.ossuario = true; ganhar(J, 75); }, op: [{ t: 'Continuar', sair: true }] },
  camara: { t: 'Câmara do Altar', x: J => J.f.sedaine ? ['O brilho violeta apagou. O altar é só pedra agora.'] : ['O badalo, um pedaço de ferro do tamanho de um braço, está sobre o altar, cercado de velas negras. Uma mulher de capuz roxo ergue os olhos.', '"Irmã Sedaine, da Sexta Hora", diz ela, sem pressa. "Faltam minutos. Sabe o que ele prometeu? Um mundo em que ninguém mais morre. Fique para ver."'], op: [
    { t: 'Convencê-la a parar', se: J => !J.f.sedaine && !J.f.falou, teste: { per: 'Persuasão', a: 'car', cd: 15, ok: 'sedaine_duvida', ko: 'sedaine_ri' } },
    { t: 'Jogar água benta no círculo', se: J => !J.f.sedaine && J.f.agua && !J.f.aguaUsada, faz: J => { J.f.aguaUsada = true; J.f.fraca = true; }, vai: 'sedaine_agua' },
    { t: 'Atacar', se: J => !J.f.sedaine, luta: 'sedaine' },
  ] },
  sedaine_duvida: { arte: 'altar_cinza', t: 'Uma dúvida', x: ['Por um instante, a mão dela treme. "Ele me prometeu meu filho de volta", diz, baixo. Então a voz endurece. Mas o rito falhou: ela perdeu a concentração.'], faz: J => { J.f.falou = J.f.fraca = true; }, op: [{ t: 'Atacar', luta: 'sedaine' }] },
  sedaine_ri: { arte: 'altar_cinza', t: 'Tarde demais', x: ['"Palavras", ela sorri. "Todos têm muitas, no fim."'], faz: J => { J.f.falou = true; }, op: [{ t: 'Atacar', luta: 'sedaine' }] },
  sedaine_agua: { arte: 'altar_cinza', t: 'O círculo racha', x: ['A água chia nas marcas do chão, e Sedaine grita de dor. O rito está ferido, e ela também.'], op: [{ t: 'Atacar', luta: 'sedaine' }] },
  sedaine_ok: { arte: 'altar_cinza', t: 'O badalo', x: ['Sedaine cai de joelhos. O capuz escorrega e mostra uma mulher comum, cansada. "A Sexta Hora vem", diz ela. E se desfaz em cinza.', 'No lugar dela fica uma carta selada. Você pega o badalo, que está gelado, e o peso quase derruba você. É hora de voltar a Vau-Claro.'], faz: J => { J.f.sedaine = J.f.badalo = true; ganhar(J, 150); diario(J, 'Sedaine caiu e o badalo foi recuperado. Leve-o à Sala do Sino, em Vau-Claro.'); }, op: [{ t: 'Sair da cripta', sair: true }] },

  final1: { arte: 'sala_sino', t: 'O peso do ferro', x: J => [J.f.tobin ? 'Tobin sobe atrás de você, pálido. Ele sabe o que fez, e a cidade ainda não sabe. Madre Ilsa e Odran esperam a sua palavra.' : 'Com ajuda de Dorn, o badalo volta ao lugar. Toda a praça olha para cima, em silêncio.', J.f.nina ? 'Nina, de mãos dadas com o pai, olha para você.' : 'Nina nunca voltou da toca. Alguém terá que contar isso a Tobin.'], op: [
    { t: 'Guardar o segredo de Tobin', se: J => J.f.tobin, faz: J => { J.f.perdao = true; }, vai: 'final2' },
    { t: 'Contar tudo a Odran', se: J => J.f.tobin, vai: 'final2' },
    { t: 'Puxar a corda', se: J => !J.f.tobin, vai: 'final2' },
  ] },
  final2: { arte: 'sino_final', t: 'O sino toca', x: J => ['Você puxa a corda.', 'O som atravessa o rio, a mata e as colinas. As pessoas choram na praça. Pela primeira vez em muitos dias, ninguém sente gosto de cinza na boca.', J.f.perdao ? 'Tobin aperta sua mão e não diz nada. Às vezes isso é tudo.' : (J.f.tobin ? 'Tobin entrega a chave a Odran e vai embora em silêncio.' : ''), `Odran paga o que deve. Você ganha ${130 + (J.f.bonus || 0)} peças de ouro.`].filter(Boolean), faz: J => { if (!J.f.fim) { J.f.fim = true; J.h.ouro += 130 + (J.f.bonus || 0); subirNivel(J); diario(J, 'O Primeiro Sino voltou a tocar. Missão concluída.'); } }, op: [{ t: 'Abrir a carta de Sedaine', vai: 'final3' }] },
  final3: { arte: 'p_silencio', t: 'Fim da Missão 1', x: ['Dentro, uma única linha, em tinta cinza: "Um sino a menos não muda a hora. O Segundo já está sob nossa mão."', 'Ao longe, na direção de Aurelia, um mensageiro vem em disparada pela estrada.', 'Aqui eu fecho o livro por hoje. Você jogou bem. A Missão 2 começa quando você quiser.'], op: [{ t: 'Voltar à cidade', irNo: 'vau' }] },
};

/* prompts para quem for gerar as ilustrações: estilo da imagem de referência */
const CENAS_ARTE = Object.keys(ART).filter(k => !k.startsWith('m_') && k !== 'vazio');
