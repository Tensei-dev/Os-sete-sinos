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
  { id: 1, x: 118, y: 88, type: 'cidade', name: 'Vau-Claro', pop: 3400, no: 'vau', desc: 'Cidade de mercadores construída no único vau seguro do Rio Vael, cercada de campos e pontes de madeira. Guarda o Primeiro Sino, calado há nove noites, e seu povo acorda com gosto de cinza na boca.' },
  { id: 2, x: 96, y: 76, type: 'mata', name: 'Mata dos Espinhos', no: 'mata', desc: 'Floresta antiga a oeste de Vau-Claro, onde espinheiros fecham as trilhas e a luz mal alcança o chão. Lenhadores não entram depois do pôr do sol, e ultimamente nem antes dele.' },
  { id: 3, x: 84, y: 60, type: 'masmorra', name: 'Toca dos Dentes-Partidos', no: 'toca', hidden: true, desc: 'Caverna do clã goblin dos Dentes-Partidos, nas colinas ao norte da mata. Dizem que aceitam qualquer serviço por prata, e que quem vai cobrar uma dívida deles raramente volta.' },
  { id: 4, x: 142, y: 100, type: 'ruina', name: 'Abadia de Vael', no: 'abadia', desc: 'Mosteiro em ruínas sobre uma colina a leste do rio, abandonado há sessenta anos, quando morreu o último monge. Era ali que se cuidava do Primeiro Sino. Há dias, uma fumaça fina sobe de seus muros.' },
  { id: 5, x: 62, y: 104, type: 'capital', name: 'Aurelia', pop: 41000, bloqueio: 'A estrada até a capital ficará aberta em uma missão futura.', desc: 'Capital de muralhas brancas e cúpulas de cobre, a maior cidade de Valdren e sede da Rainha Ysolde IV. O Segundo Sino toca na Torre da Coroa, e seu som alcança léguas de campos reais.' },
  { id: 6, x: 176, y: 72, type: 'sino', name: 'Sarn, Cidade dos Salmos', pop: 12000, bloqueio: 'Os portões de Sarn só se abrem para quem traz prova do retorno do Primeiro Sino.', desc: 'Cidade de pedra clara erguida em torno de mosteiros e arquivos, sede da Ordem dos Sineiros. Sobre ela paira o Terceiro Sino, e nas ruas ninguém fala alto durante as horas de vigília.' },
  { id: 7, x: 190, y: 118, type: 'porto', name: 'Porto do Sal', pop: 9000, bloqueio: 'Nenhum navio zarpa para os Portos Livres durante esta missão.', desc: 'Maior porto de Valdren, com cais de madeira negra e armazéns que cheiram a peixe e especiarias. O Quarto Sino toca na neblina para guiar os navios de volta para casa.' },
  { id: 8, x: 150, y: 27, type: 'covil', name: 'Monte Cinzário', bloqueio: 'Ninguém sobe o Monte Cinzário sem os sete sinos tocando.', desc: 'Sob esta montanha cinzenta dorme o Rei Cinzento. Nada cresce em suas encostas, a neve ali cai suja, e os pastores da região desviam o olhar quando precisam passar perto.' },
  { id: 9, x: 42, y: 70, type: 'forte', name: 'Forte Vigília', pop: 500, bloqueio: 'A fronteira oeste será tema de outra missão.', desc: 'Última guarnição antes das terras altas, um punhado de muralhas contra o vento. Os soldados guardam o Quinto Sino e contam os dias até serem substituídos.' },
  { id: 10, x: 216, y: 124, type: 'sino', name: 'Ilha do Sexto Sino', bloqueio: 'O caminho até a ilha ainda é desconhecido.', desc: 'Os mapas antigos marcam aqui uma ilha com uma torre. Os mapas novos não marcam nada, e os marinheiros de Porto do Sal mudam de assunto quando alguém pergunta.' },
  { id: 11, x: 120, y: 142, type: 'sino', name: 'Mosteiro do Sétimo Sino', bloqueio: 'O Sétimo Sino nunca foi encontrado.', desc: 'Lugar provável do último sino, segundo uma canção de marinheiros. Nenhum registro da Ordem confirma que o mosteiro ainda exista.' },
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
  { arte: 'p_coroa', t: 'O Rei Cinzento', x: 'Boa noite. Eu sou o seu mestre. Puxe uma cadeira, porque esta história começa há trezentos anos, numa sala de pedra onde as tochas queimavam baixo. Aldrec Voss reinava sobre todo Valdren e tinha medo de uma única coisa: morrer. Procurou Morrath, o deus do Fim, e pagou pela imortalidade com tudo o que fazia dele um homem. Quando a coroa de ferro de sepultura tocou sua cabeça, a pele secou, o sangue virou cinza e o trono começou a fumegar. Ele nunca mais precisou dormir, comer ou respirar. E por onde passava, os mortos se levantavam para servi-lo.' },
  { arte: 'p_sineiros', t: 'Os Sete Sineiros', x: 'Foi no fundo de uma caverna, longe de qualquer exército, que sete fundidores decidiram o impossível. Guiados por Vael, a Senhora das Horas, eles roubaram a coroa da cabeça do rei e a jogaram na forja. O ferro gritou enquanto derretia. Durante sete dias, com o rosto coberto e as mãos em carne viva, eles a misturaram ao bronze e despejaram o metal em sete moldes. Não conseguiram matá-lo. Mas descobriram que, a cada amanhecer, o som daqueles sinos o fazia cair de joelhos e dormir.' },
  { arte: 'p_sono', t: 'Trezentos anos de sono', x: 'E assim foi por trezentos anos. Levaram o Rei Cinzento para baixo do Monte Cinzário e ergueram as sete torres pelas terras de Valdren, longe umas das outras, para que nenhum exército pudesse calar todas. Reinos nasceram e caíram. Os sineiros envelheceram, e seus filhos também. As pessoas esqueceram por que acordavam com aquele som, e passaram a contar a história do rei só para assustar crianças.' },
  { arte: 'p_silencio', t: 'O sino mudo', x: 'Até nove noites atrás. Em Vau-Claro, cidade do Rio Vael, o amanhecer chegou e o Primeiro Sino não tocou. A corda se moveu, o bronze balançou, e o silêncio caiu sobre os telhados. Na manhã seguinte, uma cinza fina cobria os degraus da torre, e cada morador acordou com o mesmo gosto na boca. Na terceira noite, os cães pararam de latir. Na sexta, a terra do cemitério apareceu remexida.' },
  { arte: 'p_chegada', t: 'A estrada para Vau-Claro', x: 'Você chega pela estrada do sul ao fim da tarde, com a poeira da viagem nas botas e a bolsa mais leve do que gostaria. O céu está cor de cobre, e à sua frente o campanário de Vau-Claro corta o horizonte como um dedo erguido, pedindo silêncio. Na bolsa, você traz uma carta do burgomestre oferecendo trabalho a quem não tenha medo de sujar as mãos. Ela diz muito pouco, e foi escrita com pressa. Agora me diga: quem é você?' },
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
  vau: { nome: 'Vau-Claro', tipo: 'Cidade', arte: 'm_vila', cena: 'vau', desc: 'Telhados de telha vermelha se apertam ao redor do único ponto onde o Rio Vael pode ser cruzado a pé. Há três séculos esta cidade cobra pedágio, vende sal e acerta seus relógios pelo Primeiro Sino. Agora, o sino não toca.', filhos: [
    { id: 'praca', x: 130, y: 62 }, { id: 'taverna', x: 170, y: 92 }, { id: 'burgo', x: 241, y: 28 }, { id: 'templo', x: 66, y: 134 }, { id: 'ferraria', x: 240, y: 118 }] },
  praca: { nome: 'Praça do Sino', tipo: 'Praça', arte: 'praca', cena: 'praca', pai: 'vau', desc: 'Pedras gastas por trezentos anos de feiras cercam o campanário, a construção mais antiga da cidade. Barracas seguem montadas, mas ninguém negocia alto. A cinza fina volta aos degraus toda manhã, por mais que varram.', filhos: [{ id: 'campanario', x: 160, y: 96 }] },
  campanario: { nome: 'Campanário', tipo: 'Torre', arte: 'campanario', cena: 'campanario', pai: 'praca', desc: 'A torre de pedra sobe sem janelas por quase toda a altura, e cento e doze degraus de carvalho velho contornam suas paredes. O ar ali dentro é frio e parado, com cheiro de cera, ferrugem e pombos.', filhos: [{ id: 'salasino', x: 262, y: 56 }] },
  salasino: { nome: 'Sala do Sino', tipo: 'Topo da torre', arte: 'sala_sino', cena: 'salasino', pai: 'campanario', desc: 'No topo da torre, entre arcos abertos para o vento, está pendurado o Primeiro Sino de Valdren. O bronze é mais escuro que o de qualquer outro sino, porque foi fundido da coroa de um rei.' },
  taverna: { nome: 'Taverna do Javali Manco', tipo: 'Taverna', arte: 'taverna', cena: 'taverna', pai: 'vau', desc: 'Vigas baixas, lanternas de ferro e uma lareira que nunca apaga. O Javali Manco serve cerveja escura e ensopado aos barqueiros do rio há quatro gerações. Se existe um boato em Vau-Claro, ele passou por estas mesas.', filhos: [{ id: 'balcao', x: 214, y: 92 }, { id: 'mesa', x: 76, y: 124 }, { id: 'quarto', x: 268, y: 66 }] },
  balcao: { nome: 'Balcão', tipo: 'Conversa', arte: 'balcao', cena: 'balcao', pai: 'taverna', desc: 'Uma tábua inteira de carvalho, polida por cotovelos e canecas, com prateleiras de garrafas subindo até o teto. Hanna Ruiva atende daqui e escuta tudo sem levantar os olhos do pano.' },
  mesa: { nome: 'Mesa dos caçadores', tipo: 'Conversa', arte: 'mesa', cena: 'mesa', pai: 'taverna', desc: 'A mesa do canto fica de costas para a parede e de frente para a porta. Bram Duas-Marcas se senta sempre ali, com uma besta encostada na cadeira e uma caneca que demora a esvaziar.' },
  quarto: { nome: 'Quarto alugado', tipo: 'Descanso', arte: 'quarto', cena: 'quarto', pai: 'taverna', desc: 'Um quarto estreito no andar de cima, com colchão de palha limpa, uma vela e uma janela que dá para o rio. Custa 5 peças de ouro a noite, e a porta tem tranca por dentro.' },
  burgo: { nome: 'Casa do Burgomestre', tipo: 'Residência', arte: 'burgomestre', cena: 'burgo', pai: 'vau', desc: 'A casa mais alta da rua principal, de pedra escura e janelas estreitas. Odran Vell governa a cidade de um escritório abarrotado de livros de contas. Foi ele quem assinou a carta que você traz na bolsa.' },
  templo: { nome: 'Templo de Vael', tipo: 'Templo', arte: 'templo', cena: 'templo', pai: 'vau', desc: 'Paredes altas, um vitral de âmbar e o cheiro pesado de cera, ervas e febre. Os bancos de oração viraram camas. Madre Ilsa cuida de quem chega, e agora quase todos chegam com os mesmos pesadelos.' },
  ferraria: { nome: 'Ferraria de Dorn', tipo: 'Loja', arte: 'ferraria', cena: 'ferraria', pai: 'vau', desc: 'O calor da forja alcança a rua antes do som do martelo. Lâminas, ferraduras e pregos pendem das vigas enegrecidas. Dorn Mão-de-Ferro vende o que está na parede e não trabalha fiado.' },

  mata: { nome: 'Mata dos Espinhos', tipo: 'Floresta', arte: 'm_mata', cena: 'mata', desc: 'Uma floresta antiga de troncos retorcidos, com espinheiros da altura de um cavaleiro. A luz chega verde e fraca ao chão, e os lenhadores de Vau-Claro não entram aqui depois do pôr do sol.', filhos: [{ id: 'trilha', x: 134, y: 132 }, { id: 'cabana', x: 66, y: 104 }, { id: 'pedras', x: 238, y: 136 }] },
  trilha: { nome: 'Trilha dos Lobos', tipo: 'Caminho', arte: 'trilha', cena: 'trilha', pai: 'mata', desc: 'Um corredor estreito de terra batida entre raízes grossas como pernas. Pegadas enormes cruzam o caminho, ainda úmidas, e há tufos de pelo cinzento presos nos espinhos.' },
  cabana: { nome: 'Cabana da Eremita', tipo: 'Moradia', arte: 'cabana', cena: 'cabana', pai: 'mata', desc: 'Uma cabana de troncos com o telhado coberto de musgo, escondida numa clareira onde nenhuma trilha termina. Fumaça sobe da chaminé de pedra, e ramos de ervas secam sob o beiral.', trava: J => J.f.lobos ? '' : 'Os lobos fecham a trilha. Passe por eles primeiro.' },
  pedras: { nome: 'Pedras Antigas', tipo: 'Marco', arte: 'trilha', cena: 'pedras', pai: 'mata', desc: 'Quatro pedras pálidas, mais altas que um homem, marcam um limite antigo das terras da Abadia. Os sinos gravados nelas foram quase apagados por séculos de chuva e musgo.' },

  toca: { nome: 'Toca dos Dentes-Partidos', tipo: 'Caverna', arte: 'm_toca', cena: 'toca', desc: 'Um buraco nas colinas ao norte da mata, com fumaça saindo por rachaduras na rocha. O cheiro de pelo molhado e carne velha chega muito antes da entrada.', filhos: [{ id: 'entrada', x: 212, y: 48 }, { id: 'salao', x: 120, y: 96 }, { id: 'jaula', x: 146, y: 128 }] },
  entrada: { nome: 'Boca da Toca', tipo: 'Entrada', arte: 'toca_entrada', cena: 'entrada', pai: 'toca', desc: 'A boca da caverna tem dentes: costelas e mandíbulas de animais cravadas na rocha, numa tentativa grosseira de assustar quem chega. Duas tochas mal acesas marcam a passagem.' },
  salao: { nome: 'Salão do Chefe', tipo: 'Salão', arte: 'toca_salao', cena: 'salao', pai: 'toca', desc: 'Uma caverna larga, enfumaçada e barulhenta, com um buraco no teto que serve de chaminé. No fundo, o trono de Grolk Dente-Único foi montado com ossos, barris roubados e tábuas de carroças.', trava: J => J.f.sentinela ? '' : 'O sentinela da entrada precisa ser resolvido primeiro.' },
  jaula: { nome: 'Jaula', tipo: 'Prisão', arte: 'toca_jaula', cena: 'jaula', pai: 'toca', desc: 'Um desvio estreito e úmido da caverna, longe do calor da fogueira. Grades de ferro enferrujado foram cravadas na rocha, e uma voz fraca vem lá de dentro.', trava: J => J.f.sentinela ? '' : 'O sentinela da entrada precisa ser resolvido primeiro.' },

  abadia: { nome: 'Abadia de Vael', tipo: 'Ruína', arte: 'm_abadia', cena: 'abadia', desc: 'Muros partidos sobre uma colina onde o vento não para. A Abadia de Vael cuidou do Primeiro Sino por dois séculos, até que o último monge morreu, há sessenta anos. Desde então, ninguém da cidade sobe até aqui.', filhos: [{ id: 'patio', x: 166, y: 112 }, { id: 'capela', x: 110, y: 52 }, { id: 'descida', x: 232, y: 86 }] },
  patio: { nome: 'Claustro', tipo: 'Pátio', arte: 'patio', cena: 'patio', pai: 'abadia', desc: 'O claustro virou um quadrado de mato alto e colunas tortas, onde os monges eram enterrados em fileiras. Todos os túmulos estão abertos, e a terra foi empurrada de dentro para fora.' },
  capela: { nome: 'Capela de Vael', tipo: 'Capela', arte: 'capela', cena: 'capela', pai: 'abadia', desc: 'O teto caiu em parte, mas um vitral resistiu: sete sinos pintados em azul e vermelho, que ainda filtram a luz sobre o altar. Há uma frase gravada na pedra e sete sininhos pendurados.' },
  descida: { nome: 'Escada da Cripta', tipo: 'Passagem', arte: 'cripta', cena: 'descida', pai: 'abadia', desc: 'Atrás da capela, degraus descem até uma porta de ferro maciço. A porta é antiga, mas a fechadura é nova, e o metal ainda brilha. Alguém usa esta passagem.', filhos: [{ id: 'galeria', x: 160, y: 120 }], trava: J => J.f.patio ? '' : 'Os mortos do claustro bloqueiam o caminho.' },
  galeria: { nome: 'Cripta', tipo: 'Masmorra', arte: 'm_cripta', cena: 'galeria', pai: 'descida', desc: 'Corredores de pedra escavados sob a abadia, com nichos de mortos dos dois lados. O frio aqui é seco, e um fio de cera negra corre pelo chão como uma trilha.', filhos: [{ id: 'ossuario', x: 172, y: 26 }, { id: 'camara', x: 250, y: 96 }], trava: J => (J.f.chave || J.f.tunel) ? '' : 'A porta está trancada. Alguém deve ter a chave.' },
  ossuario: { nome: 'Ossuário', tipo: 'Sala', arte: 'ossuario', cena: 'ossuario', pai: 'galeria', desc: 'Quando os nichos lotaram, os monges passaram a empilhar ossos. Paredes inteiras são feitas de crânios encaixados com cuidado, do chão ao teto, todos virados para a porta.' },
  camara: { nome: 'Câmara do Altar', tipo: 'Sala final', arte: 'altar_cinza', cena: 'camara', pai: 'galeria', desc: 'A sala mais funda da cripta, com um altar de pedra no centro. Uma luz violeta pulsa nas paredes, devagar como uma respiração, e um cântico baixo chega pelo corredor.', trava: J => J.f.ossuario ? '' : 'Os mortos do ossuário ainda guardam o caminho.' },
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
    : ['Vau-Claro segue em silêncio, e as pessoas andam com olheiras fundas.', 'Clique em um lugar da cidade para ver o que há ali.'] },
  praca: { t: 'Praça do Sino', x: J => J.f.fim ? ['As crianças brincam de novo na praça. Em cima, o bronze brilha.'] : ['Uma mulher varre cinza fina dos degraus do campanário. Ela diz que ontem varreu o mesmo lugar.', '"Nove noites sem sino", resmunga um velho. "Na décima, dizem que os mortos do cemitério levantam para perguntar a hora."', 'A porta da torre está aberta, e ninguém sobe.'] },
  campanario: { t: 'Campanário', x: ['Os degraus rangem a cada passo, e o ar fica mais frio conforme você sobe em direção à Sala do Sino.'] },
  salasino: { t: 'Sala do Sino', x: J => {
    if (J.f.badalo && !J.f.fim) return ['Você traz o badalo. Ele pesa mais do que deveria, como se soubesse o que vai acontecer.'];
    if (J.f.fim) return ['O sino descansa em silêncio entre uma hora e outra. Não é mais um silêncio ruim.'];
    return ['Você empurra o sino, e ele balança sem fazer som nenhum: o badalo foi arrancado.', J.f.pistaSino ? 'Você já examinou esta sala. As pegadas pequenas e a cera negra ainda estão aqui.' : 'Há marcas no chão, e a porta lá de baixo não foi arrombada.'];
  }, op: [
    { t: 'Examinar a sala com cuidado', se: J => !J.f.pistaSino && !J.f.badalo, teste: { per: 'Investigação', a: 'int', cd: 11, ok: 'sino_ok', ko: 'sino_ko' } },
    { t: 'Recolocar o badalo e tocar o sino', se: J => J.f.badalo && !J.f.fim, vai: 'final1' },
  ] },
  sino_ok: { arte: 'sala_sino', t: 'O que ficou para trás', x: ['Bom olho. Pegadas de pés pequenos, de três dedos: goblins. Cera negra pingada em círculo, que não é vela de igreja. E uma coisa pior: a tranca foi aberta com chave.', 'Alguém da cidade abriu a porta. Eu anotaria isso, se fosse você.'], faz: J => { J.f.pistaSino = J.f.pistaChave = true; diario(J, 'Goblins roubaram o badalo, e alguém abriu a torre com chave.'); }, op: [{ t: 'Continuar', vai: 'salasino' }] },
  sino_ko: { arte: 'sala_sino', t: 'Rastros confusos', x: ['A luz é ruim e você não tira muita coisa dali. Vê pegadas pequenas, talvez de goblins, e pingos de cera preta.'], faz: J => { J.f.pistaSino = true; diario(J, 'Pegadas pequenas e cera preta na sala do sino.'); }, op: [{ t: 'Continuar', vai: 'salasino' }] },

  taverna: { t: 'Taverna do Javali Manco', x: ['Há meia dúzia de fregueses e nenhuma canção. Hanna Ruiva, atrás do balcão, mede você de cima a baixo. Na mesa do canto, um caçador bebe sozinho.'] },
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
    return ['"Você veio. Ótimo. Sente-se", diz Odran Vell, afastando uma pilha de livros.', '"Roubaram o badalo do nosso sino. Se isso chegar a Sarn, a Ordem assume a cidade. Se chegar à rainha, pior. Traga-o de volta em silêncio. Pago 150 peças de ouro, 20 agora."'];
  }, op: [
    { t: 'Aceitar o trabalho', se: J => !J.f.contrato, faz: J => { J.f.contrato = true; J.h.ouro += 20; diario(J, 'Contrato aceito: recuperar o badalo por 150 po (20 já pagas).'); }, vai: 'burgo' },
    { t: 'Pedir um pagamento melhor', se: J => !J.f.contrato && !J.f.barganha, teste: { per: 'Persuasão', a: 'car', cd: 13, ok: 'burgo_mais', ko: 'burgo_nao' } },
  ] },
  burgo_mais: { arte: 'burgomestre', t: 'Odran Vell', x: ['Odran suspira. "Duzentas, então. E nem uma a mais."'], faz: J => { J.f.barganha = true; J.f.bonus = 50; }, op: [{ t: 'Continuar', vai: 'burgo' }] },
  burgo_nao: { arte: 'burgomestre', t: 'Odran Vell', x: ['"O cofre da cidade não é um poço, aventureiro."'], faz: J => { J.f.barganha = true; }, op: [{ t: 'Continuar', vai: 'burgo' }] },
  templo: { t: 'Templo de Vael', x: J => J.f.fim ? ['Madre Ilsa acende uma vela por você. "A Senhora das Horas não esquece quem cumpre promessas."'] : ['Madre Ilsa troca panos sem parar, e um homem magro, Tobin, o sacristão, evita olhar para você.'], op: [
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

  toca: { t: 'Toca dos Dentes-Partidos', x: ['A boca da caverna fica logo adiante. Sentinelas nunca estão longe, e é bom decidir como entrar.'] },
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

  abadia: { t: 'Abadia de Vael', x: ['O claustro, a capela e a escada da cripta estão ao seu alcance. O silêncio aqui parece vigiado.'] },
  patio: { t: 'Claustro', x: J => J.f.patio ? ['Só ossos espalhados agora.'] : ['Dois monges mortos há décadas se viram para você, ainda em hábitos podres. Uma luz vermelha acende onde deveriam estar os olhos.'], op: [{ t: 'Enfrentá-los', se: J => !J.f.patio, luta: 'patio' }] },
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

/* ===== Primeira chegada: descrição longa do ambiente, narrada só na primeira visita ===== */
const CHEGADAS = {
  vau: [
    'A estrada desce entre campos de cevada que ninguém colheu, e Vau-Claro se abre diante de você de uma vez: telhados vermelhos apertados uns contra os outros, fumaça de chaminés subindo reta no ar sem vento, e o Rio Vael correndo largo e marrom ao lado das muralhas baixas. O cheiro é de lama, lenha e peixe salgado.',
    'Devia haver barulho aqui. Esta é uma cidade de carroceiros e barqueiros, de gente que negocia aos gritos. Mas as rodas passam devagar, e as pessoas falam baixo, como numa casa com um doente. Uma mulher fecha a janela quando você passa. Um menino puxa a manga da mãe e aponta para as suas armas, e ela abaixa a mão dele sem dizer nada.',
    'Ao longe, acima de tudo, fica o campanário. Você se pega olhando para ele, esperando alguma coisa. Todo mundo aqui faz o mesmo.',
  ],
  praca: [
    'A rua se alarga e você chega à praça, um chão de pedras gastas pelo peso de trezentos anos de feiras. As barracas estão montadas, com nabos murchos, cordas e potes de sal, mas os vendedores nem anunciam. As pessoas compram em silêncio, olhando de lado para os estranhos.',
    'O campanário se ergue no meio de tudo, e daqui de baixo ele parece maior do que devia, como se a praça tivesse sido construída ao redor de uma coisa que já estava ali. Não há pombos nos beirais. Uma poeira cinzenta e fina se acumula nas frestas entre as pedras, e gruda nas solas das suas botas.',
  ],
  campanario: [
    'A porta range, e o barulho da praça some atrás de você como se alguém tivesse fechado uma tampa. Lá dentro, faz frio. A escada de madeira sobe em espiral colada às paredes, sumindo na escuridão acima, e a única luz vem de uma tocha presa ao ferro, que alguém ainda se dá ao trabalho de acender.',
    'O cheiro é de cera antiga, ferrugem e pedra molhada. No centro do vão, uma corda grossa desce do alto até um gancho na parede, tão gasta nas pontas que brilha. Ninguém tocou nela há nove noites, e mesmo assim ela oscila, muito devagar, sem que haja vento nenhum.',
  ],
  salasino: [
    'O último degrau dá numa sala de pedra aberta para o céu por quatro arcos. O vento entra frio e traz o cheiro do rio. Lá embaixo, Vau-Claro parece pequena, e as pessoas na praça são pontos parados.',
    'E então você vê o sino. Ele é maior do que qualquer coisa que você imaginou, um corpo de bronze quase negro pendurado numa viga do tamanho de um mastro. Há letras tão antigas na borda que os dedos as reconhecem melhor do que os olhos. Você encosta a mão, e o metal está frio demais para a tarde que faz.',
  ],
  taverna: [
    'O calor bate no seu rosto antes de os olhos se acostumarem. Lanternas de ferro pendem das vigas e pintam tudo de laranja, e o ar é grosso de fumaça, cebola frita e cerveja derramada. A lareira, grande o bastante para assar um boi, estala no canto, e as paredes guardam o escuro de quatro gerações de cachimbos.',
    'Alguém deve ter parado de falar quando você entrou, porque o silêncio dura um pouco demais. Depois, as conversas voltam, baixas, de cabeças juntas. As canecas batem na madeira sem pressa. O chão range sob seus pés e gruda um pouco nas botas.',
  ],
  balcao: [
    'O balcão é uma única tábua de carvalho, escurecida e lisa, marcada por gerações de canecas e por algumas facas. Atrás dele, prateleiras tortas sobem até o teto, carregadas de garrafas de vidro grosso, potes de conserva e coisas que você prefere não identificar. Uma vela pinga num pires e faz as sombras tremerem.',
    'Hanna Ruiva não levanta os olhos de imediato. Ela termina de secar a caneca, coloca-a no lugar exato, e só então olha para você: uma mulher forte, de cabelo cor de brasa e sardas nos braços, que parece já ter escutado toda história que você poderia contar.',
  ],
  mesa: [
    'A mesa do canto fica no pedaço mais escuro da taverna, longe da lareira, e de lá se vê a porta e as duas janelas. O homem sentado ali escolheu isso de propósito. Tem a barba curta e preta, um casaco de couro gasto nos cotovelos, e duas cicatrizes paralelas que descem pela bochecha esquerda, limpas demais para terem vindo de um acidente.',
    'Uma besta descansa encostada na cadeira, ao alcance da mão, e a corda dela está esticada. O cheiro é de couro, suor velho e fumaça de acampamento. Ele gira a caneca devagar entre os dedos, sem beber.',
  ],
  quarto: [
    'A escada estreita leva a um corredor que cheira a palha e sabão de cinzas. O quarto é pequeno, com uma cama de estrado, um banco, uma tigela de água e uma vela nova. Pela janela de vidro grosso, o rio corre escuro, e as luzes da outra margem tremem na água.',
    'Do andar de baixo, as vozes sobem abafadas pelas tábuas. A porta tem um bom ferrolho por dentro. Você nota que ele foi instalado há pouco tempo.',
  ],
  burgo: [
    'Um criado de olhos fundos leva você por um corredor de tapetes gastos até um escritório onde o sol da tarde entra em tiras pelas janelas estreitas. O cheiro é de papel velho, tinta e chá frio. Livros de contas ocupam as paredes do chão ao teto, e pilhas deles ocupam também duas cadeiras e parte do tapete.',
    'Atrás da mesa, um homem magro de barba branca escreve sem parar, à luz de uma vela acesa apesar do dia. Só depois de terminar a linha ele ergue o rosto. As mãos dele estão manchadas de tinta, e os olhos têm o brilho seco de quem há muito tempo não dorme.',
  ],
  templo: [
    'A luz do vitral cai cor de âmbar sobre fileiras de bancos que viraram camas. O ar pesa com cera, sálvia queimada e o cheiro azedo de febre. Alguém geme baixo perto do altar. Uma criada passa com um balde de panos, e ninguém olha para você.',
    'Sobre o altar, um pequeno sino de bronze sinaliza a presença de Vael. Ele é a única coisa limpa e brilhante na sala. Os doentes dormem todos virados para o mesmo lado, para o norte. Você leva um momento para perceber isso, e depois não consegue mais deixar de ver.',
  ],
  ferraria: [
    'O calor da forja encosta em você na porta. Lá dentro, tudo é preto de fuligem ou vermelho de brasa, e o ar tem gosto de ferro e carvão. Lâminas, ganchos e ferraduras pendem das vigas e balançam de leve a cada golpe do martelo.',
    'O homem na bigorna é enorme, careca, com uma barba preta aparada a fogo e os antebraços cheios de velhas queimaduras. Ele acerta mais duas pancadas no metal, mergulha a peça num barril, e a água grita em vapor antes que ele se vire.',
  ],
  mata: [
    'A estrada termina num muro de árvores. Logo depois da primeira fileira de troncos, o som do mundo diminui: nada de vento, nada de pássaros, só o estalo de um galho muito longe e sua própria respiração. A luz chega verde e cansada, filtrada por camadas de folhas.',
    'O ar é úmido e cheira a terra podre e a resina. Espinheiros grossos como um punho se enroscam nas árvores e fecham os lados da trilha, com pontas longas o bastante para atravessar couro. Em alguns deles, há trapos de pano presos, já desbotados. Você não vê de quem eram.',
  ],
  trilha: [
    'A trilha afunda entre raízes que saem da terra como costas de animais. Uma névoa baixa e esverdeada se arrasta entre os troncos, na altura dos joelhos, e molha sua roupa sem que você perceba. Você vê pegadas na lama, maiores que a sua mão aberta, tão recentes que a água ainda escorre para dentro delas.',
  ],
  cabana: [
    'As árvores se afastam de repente, como se tivessem combinado, e você entra numa clareira de capim alto. Há uma cabana de troncos ali, torta e antiga, com o telhado tão coberto de musgo que parece ter brotado do chão. A luz amarela das janelas é a primeira coisa quente que você vê em horas.',
    'O cheiro muda: fumaça de lenha, alecrim e alguma coisa amarga fervendo. Ramos de ervas secam sob o beiral, ao lado de ossos de pássaros amarrados com fio vermelho, que batem uns nos outros com um som seco.',
  ],
  pedras: [
    'A mata se abre num pequeno campo de pedras, onde nada cresce direito. Quatro blocos pálidos estão cravados na terra, mais altos do que você, formando um portão sem muros. O musgo cobre o lado norte deles, e a chuva de séculos quase apagou os sinos gravados na superfície.',
  ],
  toca: [
    'O chão sobe e a floresta se transforma em colinas de pedra e mato seco. Você sente o cheiro antes de ver qualquer coisa: fumaça, pelo molhado, gordura queimada e uma latrina que ninguém nunca limpou. Rolos de fumaça escapam por rachaduras na rocha, como se o morro estivesse respirando.',
    'Ossos roídos se espalham pelo caminho, junto com pedaços de carroça, um sapato de criança e um escudo amassado. De algum lugar sob seus pés vem um eco de risadas agudas, seguido de alguma coisa que apanha.',
  ],
  entrada: [
    'A boca da caverna se abre na encosta, baixa e larga, e foi enfeitada com muito esforço e pouca habilidade: mandíbulas de animais, costelas e presas cravadas na rocha, formando uma fileira de dentes tortos. Duas tochas de gordura soltam mais fumaça do que luz. Lá de dentro sai um bafo quente e fedorento.',
  ],
  salao: [
    'O túnel desemboca numa caverna larga, cheia de fumaça que sobe preguiçosa para um buraco no teto. Uma fogueira no centro joga sombras enormes nas paredes, e dezenas de marcas de garras, desenhos e nomes foram riscados na pedra. O chão é um tapete de ossos, palha podre e cacos de jarro.',
    'Goblins se amontoam em volta do fogo, brigando por um pedaço de carne, e o barulho é de cães e crianças ao mesmo tempo. Ao fundo, no alto de uma pilha de barris roubados e tábuas de carroça, há um trono feito de tudo o que este clã já matou.',
  ],
  jaula: [
    'Um desvio do túnel desce para o frio. A fogueira fica para trás, e o único som é a água pingando devagar em alguma poça que você não enxerga. O cheiro aqui é de ferrugem, urina e medo. Grades grossas foram cravadas direto na rocha, formando uma cela torta e sem luz.',
  ],
  abadia: [
    'O caminho sobe por uma colina nua, e o vento vai ficando mais forte a cada passo. No topo, a Abadia de Vael se ergue contra o céu como a carcaça de um grande animal: paredes sem teto, arcos que não sustentam mais nada, uma torre partida ao meio. O mato alto cresce pelas janelas e a hera escala as colunas.',
    'Não há pássaros aqui. Você encontra pegadas recentes no barro da entrada, de botas e de pés descalços pequenos, indo e voltando. Um fio fino de fumaça sobe por trás dos muros, sem que se veja fogueira alguma. É como se saísse do próprio chão.',
  ],
  patio: [
    'O portão caído dá num pátio quadrado, cercado por um corredor de colunas. Uma luz fria desenha as sombras dos arcos sobre um campo de lápides tortas. Mato seco raspa contra as pedras com o vento, e o som parece muito o de alguém andando.',
    'Você se aproxima e vê que as covas estão abertas, todas elas. A terra foi empurrada para fora, em montes, e os caixões apodrecidos têm as tampas estilhaçadas de baixo para cima. O cheiro é de terra revirada e pano velho.',
  ],
  capela: [
    'Metade do teto veio abaixo há muito tempo, e a chuva fez crescer musgo entre os bancos. Mesmo assim, a capela conserva um silêncio diferente, quase respeitoso. Sobre o altar, um vitral alto sobreviveu a tudo, e a luz que passa por ele pinta o chão de azul e vermelho, como se o sangue e o céu tivessem ficado de acordo.',
    'Sete sinos estão pintados no vidro, cada um numa altura. A poeira no altar foi tocada: há marcas de dedos recentes e pingos de cera negra sobre a pedra branca.',
  ],
  descida: [
    'Atrás da capela, uma laje foi arrastada para o lado, e degraus estreitos descem para a escuridão. O ar que sobe dali é mais frio do que a noite, com cheiro de pedra molhada e cera queimada. No fim da escada há uma porta de ferro coberta de ferrugem, com uma fechadura nova que brilha como um dente de ouro numa boca podre.',
  ],
  galeria: [
    'A escuridão aqui embaixo tem peso. Sua luz alcança só alguns passos de um corredor abobadado, com nichos abertos nas duas paredes, um sobre o outro, e em cada um deles há um monge enrolado em um pano que já foi branco. A poeira dos séculos cobre tudo, menos o centro do piso, marcado por passos recentes.',
    'Sua respiração sai em vapor. Em algum lugar à frente, gotas caem em intervalos regulares, e por trás delas você ouve, tão baixo que pode ser imaginação, uma voz cantando.',
  ],
  ossuario: [
    'O corredor se alarga numa sala onde os monges resolveram o problema de espaço com paciência terrível. As paredes são de crânios, milhares deles, encaixados com cuidado entre fêmures empilhados como lenha. Todas as órbitas estão viradas para a porta. O chão estala sob suas botas, e você prefere não olhar o motivo.',
  ],
  camara: [
    'O corredor termina numa câmara redonda, e a luz violeta enche seus olhos. Ela vem de marcas pintadas no chão, um círculo enorme traçado em cinza e cera negra, e pulsa devagar, no ritmo de uma respiração que não é a sua. Velas negras queimam sem cheiro de cera, com um cheiro doce de coisa queimada.',
    'O ar treme. Seus dentes doem, como quando um grande sino acaba de tocar, mas não há som nenhum. Aqui embaixo, a cinza cai do teto como neve, e você sente o gosto dela na língua.',
  ],
};

/* prompts para quem for gerar as ilustrações: estilo da imagem de referência */
const CENAS_ARTE = Object.keys(ART).filter(k => !k.startsWith('m_') && k !== 'vazio');
