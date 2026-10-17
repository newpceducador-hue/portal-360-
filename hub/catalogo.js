/* Registro central do Portal 360º VR. Uma entrada por experiência.
 * Acrescente novos itens sem alterar o HTML do hub.
 * "soon" identifica propostas: formatos e objetivos ainda são previstos.
 */
(function (root, factory) {
  'use strict';
  var catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else root.PortalHubCatalog = catalog;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
    version: '20261017-hub2',
    intro: {
      video: 'assets/abertura.mp4',
      poster: 'assets/abertura-poster.jpg',
      background: 'assets/abertura-fundo.mp4'
    },
    experiences: [
      {
        id: 'sistema-solar',
        title: 'Sistema Solar VR',
        summary: 'Planetas, órbitas e descobertas além da Terra.',
        description: 'Explore os planetas, órbitas, fases da Lua, estações, eclipses e cometas em um ambiente interativo para computador, lousa e realidade virtual.',
        category: 'astronomia', categoryLabel: 'Astronomia',
        levels: ['efi', 'efii', 'em'], status: 'available', formats: ['3d', 'vr'],
        cover: 'assets/capa-sistema-solar-card.webp', path: 'apps/sistema-solar/',
        keywords: ['planetas', 'Lua', 'Sol', 'órbitas', 'eclipses', 'estações', 'fases', 'Terra', 'Marte', 'Júpiter', 'Saturno', 'cometas'],
        objectives: ['Reconhecer os planetas do Sistema Solar.', 'Explorar movimentos e fenômenos astronômicos.'],
        videoId: 'ZtPpHocvT7A', featured: true
      },
      {
        id: 'dna',
        title: 'DNA Imersivo',
        summary: 'Entre na dupla hélice e descubra suas conexões.',
        description: 'Explore as bases nitrogenadas, as fitas de açúcar-fosfato e as ligações de hidrogênio. A experiência inclui o jogo de completar a fita e narração em áudio.',
        category: 'biologia', categoryLabel: 'Biologia',
        levels: ['efii', 'em'], status: 'available', formats: ['3d', 'vr'],
        cover: 'assets/capa-dna-card.webp', path: 'apps/dna/',
        keywords: ['dupla hélice', 'genética', 'bases nitrogenadas', 'adenina', 'timina', 'citosina', 'guanina', 'pareamento', 'cromossomo'],
        objectives: ['Identificar a estrutura da dupla hélice.', 'Relacionar as bases complementares do DNA.'],
        videoId: null, featured: false
      },
      {
        id: 'corpo-humano',
        title: 'Corpo Humano Imersivo',
        summary: 'Uma viagem pelos órgãos e sistemas do corpo.',
        description: 'Explore os sistemas do corpo humano com missões, fichas narradas e relatório do professor, em 3D e realidade virtual.',
        category: 'biologia', categoryLabel: 'Biologia',
        levels: ['efi', 'efii', 'em'], status: 'available', formats: ['3d', 'vr'],
        cover: 'assets/capa-corpo-humano-card.webp?v=3', path: 'apps/corpo-humano/',
        keywords: ['órgãos', 'sistemas', 'anatomia', 'olho', 'visão', 'orelha', 'audição', 'sentidos', 'rins', 'bexiga', 'hormônios', 'glândulas', 'tireoide', 'coração', 'pulmões', 'respiração', 'circulação', 'digestão', 'sangue', 'diafragma', 'alvéolos', 'esqueleto', 'ossos', 'músculos', 'articulações', 'movimento', 'nervoso', 'cérebro', 'medula', 'nervos'],
        objectives: ['Identificar órgãos e sistemas do corpo humano.', 'Relacionar estruturas às suas funções.'],
        videoId: 'TlR7TouWP5o', featured: true
      },
      {
        id: 'terra',
        title: 'Terra por Dentro',
        summary: 'Das camadas internas aos vulcões e às rochas.',
        description: 'Veja a Terra aberta ao meio: camadas internas, viagem ao centro, placas tectônicas, vulcões e rochas, com fichas narradas em 3D e realidade virtual.',
        category: 'geociencias', categoryLabel: 'Geociências',
        levels: ['efii', 'em'], status: 'available', formats: ['3d', 'vr'],
        cover: 'assets/capa-terra-card.webp?v=3', path: 'apps/terra/',
        keywords: ['geologia', 'crosta', 'manto', 'núcleo', 'camadas', 'vulcões', 'terremotos', 'placas tectônicas', 'interior do planeta', 'ondas sísmicas', 'campo magnético', 'lava', 'magma', 'erupção', 'cratera', 'rochas', 'minerais', 'granito', 'basalto', 'ciclo das rochas'],
        objectives: ['Distinguir as camadas internas da Terra.', 'Explorar processos geológicos e seus efeitos.'],
        videoId: null, featured: false
      },
      {
        id: 'celula',
        title: 'Célula 3D VR',
        summary: 'Descubra a vida em uma escala microscópica.',
        description: 'Explore a célula animal e a vegetal abertas ao meio, acompanhe o caminho de uma proteína e viaje pelo interior da célula em 3D e realidade virtual.',
        category: 'biologia', categoryLabel: 'Biologia',
        levels: ['efii', 'em'], status: 'available', formats: ['3d', 'vr'],
        cover: 'assets/capa-celula-card.webp?v=1', path: 'apps/celula/',
        keywords: ['organelas', 'microscópio', 'membrana', 'núcleo', 'mitocôndria', 'ribossomo', 'retículo', 'Golgi', 'lisossomo', 'citoplasma', 'célula animal', 'célula vegetal', 'cloroplasto', 'parede celular', 'vacúolo', 'fotossíntese', 'proteína'],
        objectives: ['Reconhecer estruturas das células animal e vegetal.', 'Relacionar organelas aos processos celulares.'],
        videoId: null, featured: false
      },
      {
        id: 'historia',
        title: 'História VR',
        summary: 'Outros tempos, novas perspectivas.',
        description: 'Proposta em desenvolvimento: ambientes históricos, civilizações, acontecimentos e missões em primeira pessoa.',
        category: 'historia', categoryLabel: 'História',
        levels: ['efi', 'efii'], status: 'soon', formats: ['3d', 'vr'],
        cover: null, path: null,
        keywords: ['civilizações', 'Brasil', 'mundo', 'antiga', 'passado'],
        objectives: ['Explorar contextos históricos.', 'Observar modos de vida de diferentes sociedades.'],
        videoId: null, featured: false
      },
      {
        id: 'quimica',
        title: 'Química VR',
        summary: 'Conheça a matéria por dentro.',
        description: 'Proposta em desenvolvimento: moléculas, átomos, ligações e experimentos interativos em escala imersiva.',
        category: 'quimica', categoryLabel: 'Química',
        levels: ['efii', 'em'], status: 'soon', formats: ['3d', 'vr'],
        cover: null, path: null,
        keywords: ['átomos', 'moléculas', 'ligações', 'experimentos', 'matéria'],
        objectives: ['Visualizar átomos e moléculas.', 'Explorar ligações e transformações da matéria.'],
        videoId: null, featured: false
      }
    ]
  };
});
