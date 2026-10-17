/* DNA Imersivo v2.0 — conteúdo separado da interface e dos modelos.
   Base: DNA Imersivo enviado pelo usuário. Ampliações e revisões em FONTES.md. */
(function(){'use strict';
const bases={
 A:{key:'adenina',name:'Adenina',color:0x58cfef,hex:'#58cfef',pair:'T',family:'Purina',rings:2,bonds:2,text:'A adenina é uma base nitrogenada. No pareamento canônico do DNA, combina com a timina. Uma purina tem dois anéis em sua estrutura.'},
 T:{key:'timina',name:'Timina',color:0xf5bc59,hex:'#f5bc59',pair:'A',family:'Pirimidina',rings:1,bonds:2,text:'A timina é uma base nitrogenada do DNA. No pareamento canônico, combina com a adenina por duas ligações de hidrogênio. No RNA, usa-se uracila no lugar da timina.'},
 C:{key:'citosina',name:'Citosina',color:0x9be69b,hex:'#9be69b',pair:'G',family:'Pirimidina',rings:1,bonds:3,text:'A citosina é uma base nitrogenada. Combina com a guanina por três ligações de hidrogênio no pareamento canônico. É uma pirimidina, com um anel.'},
 G:{key:'guanina',name:'Guanina',color:0xe38fb4,hex:'#e38fb4',pair:'C',family:'Purina',rings:2,bonds:3,text:'A guanina é uma base nitrogenada. Combina com a citosina no DNA. É uma purina, com dois anéis, assim como a adenina.'}
};
const info={
 dna:{name:'Dupla hélice',kind:'Duas fitas complementares',text:'O DNA armazena informação biológica na sequência das bases. As duas fitas têm orientações opostas: uma de 5′ para 3′ e a outra de 3′ para 5′.',detail:'Neste modelo didático são mostrados 24 pares. Ele não é um genoma nem uma sequência de um gene identificado. O modelo atômico 1BNA é outro exemplo, com 12 pares e uma sequência experimental própria.'},
 fosfato:{name:'Grupo fosfato',kind:'Parte do nucleotídeo',text:'O fosfato participa do esqueleto do DNA. Ao longo de uma fita, grupos fosfato e açúcares se alternam.',detail:'As ligações fosfodiéster unem nucleotídeos em uma cadeia. As cores e os encaixes da atividade são convenções; não representam uma reação química.'},
 acucar:{name:'Desoxirribose',kind:'Açúcar do DNA',text:'A desoxirribose é o açúcar do DNA. Junto com um grupo fosfato e uma base nitrogenada, forma um nucleotídeo.',detail:'Os números 5′ e 3′ referem-se a posições no açúcar. A síntese de uma nova fita ocorre pela adição de nucleotídeos à extremidade 3′.'},
 esqueleto:{name:'Fita açúcar–fosfato',kind:'Esqueleto de uma cadeia',text:'As laterais da dupla hélice são formadas pela alternância entre açúcar e fosfato. As bases ficam voltadas para a parte interna.',detail:'As fitas são antiparalelas. As ligações covalentes do esqueleto não são as ligações de hidrogênio entre bases complementares.'},
 ligacoes:{name:'Ligações de hidrogênio',kind:'Interações entre as bases',text:'No pareamento canônico, A–T forma duas ligações de hidrogênio e C–G forma três. As bases também interagem por empilhamento.',detail:'A estabilidade do DNA não depende apenas da contagem dessas ligações. Na replicação, as fitas se separam sem romper as ligações covalentes do esqueleto.'}
};
for(const [letter,b] of Object.entries(bases))info[b.key]={name:b.name,kind:b.family+' · '+letter,text:b.text,detail:'Complemento: '+b.pair+'. No DNA canônico, o par tem '+b.bonds+' ligações de hidrogênio. A representação didática simplifica a geometria e a escala.',letter};
const activities=[
 {id:'contexto',label:'Contexto',title:'Onde o DNA está?',subtitle:'Do contexto celular ao trecho molecular.',kicker:'LOCALIZE'},
 {id:'estrutura',label:'Estrutura',title:'Uma molécula. Muitas descobertas.',subtitle:'Selecione uma base para examiná-la de perto.',kicker:'EXPLORE'},
 {id:'montagem',label:'Monte',title:'Construa um nucleotídeo.',subtitle:'Escolha uma peça e encaixe no destino correspondente.',kicker:'CONSTRUA'},
 {id:'pareamento',label:'Pareamento',title:'Uma fita revela a outra.',subtitle:'Escolha um nucleotídeo e complete o trecho.',kicker:'EXPERIMENTE'},
 {id:'replicacao',label:'Replicação',title:'De uma molécula para duas.',subtitle:'Acompanhe as fitas originais e construa as novas.',kicker:'INVESTIGUE'},
 {id:'molecular',label:'Atômico',title:'Por dentro da estrutura molecular.',subtitle:'Exemplo experimental: DNA 1BNA, diferente da maquete.',kicker:'OBSERVE OS ÁTOMOS'},
 {id:'desafio',label:'Desafio',title:'Agora, explique o que descobriu.',subtitle:'Uma nova situação, sem respostas automáticas.',kicker:'APLIQUE'}
];
const guide=[
 {view:'contexto',title:'Localize o DNA',goal:'Selecione o núcleo, observe a cromatina e chegue ao trecho de DNA.',check:'contexto',audio:'aula-contexto'},
 {view:'estrutura',title:'Investigue as partes',goal:'Selecione três componentes diferentes da hélice. A ficha fica na lateral.',check:'estrutura',audio:'aula-estrutura'},
 {view:'montagem',title:'Monte uma unidade',goal:'Encaixe fosfato, desoxirribose e uma base para formar um nucleotídeo.',check:'montagem',audio:'aula-montagem'},
 {view:'pareamento',title:'Complete a outra fita',goal:'Construa a sequência complementar. Erros podem ser revistos e pistas ficam registradas.',check:'pareamento',audio:'aula-pareamento'},
 {view:'replicacao',title:'Copie e acompanhe',goal:'Construa as novas fitas e identifique uma fita original em cada molécula formada.',check:'replicacao',audio:'aula-replicacao'},
 {view:'desafio',title:'Mostre o que entendeu',goal:'Resolva uma sequência diferente e responda às situações finais. Depois consulte seu resumo.',check:'desafio',audio:'aula-desafio'}
];
const context=[
 {name:'Célula eucariótica',text:'Este é um esquema de uma célula animal. Selecione o núcleo para investigar o DNA nuclear.',target:'nucleo'},
 {name:'Núcleo',text:'No núcleo, o DNA está associado a proteínas. Esse conjunto forma a cromatina. Selecione o fio de cromatina.',target:'cromatina'},
 {name:'Cromatina',text:'O DNA pode se enrolar em proteínas chamadas histonas. A representação mostra um trecho simplificado, não um cromossomo permanentemente em X. Selecione o trecho de DNA.',target:'dna'},
 {name:'DNA',text:'Chegamos ao DNA. A escala foi alterada entre as etapas para facilitar a observação. Além do DNA nuclear, células eucarióticas também podem ter DNA em organelas.',target:null}
];
const questions=[
 {id:'unidade',skill:'componentes',q:'Qual conjunto forma um nucleotídeo de DNA?',options:['Fosfato, desoxirribose e base nitrogenada','Adenina, timina e guanina','Duas proteínas e um açúcar'],correct:0,why:'Cada nucleotídeo reúne fosfato, desoxirribose e uma base. Uma base isolada não é um nucleotídeo completo.'},
 {id:'origem',skill:'replicacao',q:'Após a replicação semiconservativa, como fica cada molécula?',options:['Uma fica antiga e a outra inteiramente nova','Cada uma tem uma fita original e uma nova','Cada uma tem duas fitas originais'],correct:1,why:'Cada fita original funciona como molde de uma nova fita. Por isso ambas as moléculas conservam uma fita antiga.'},
 {id:'sentido',skill:'orientacao',q:'As fitas do DNA são antiparalelas. O que isso significa?',options:['Têm sempre a mesma sequência na mesma direção','Têm orientações opostas, 5′→3′ e 3′→5′','Só uma das fitas contém bases'],correct:1,why:'As extremidades das fitas estão em sentidos opostos. O pareamento não elimina a orientação de cada cadeia.'},
 {id:'separacao',skill:'replicacao',q:'O que o modelo de abertura da dupla hélice representa?',options:['Romper completamente os esqueletos açúcar–fosfato','Transformar o DNA em proteína','Separar as fitas, mantendo seus esqueletos'],correct:2,why:'As fitas se separam para serem usadas como moldes. O esqueleto de cada fita é preservado nessa representação.'}
];
const sources=[
 ['DNA: composição, localização e complementaridade','https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet'],
 ['Replicação do DNA — NHGRI','https://www.genome.gov/genetics-glossary/DNA-Replication'],
 ['Mecanismos da replicação — Molecular Biology of the Cell','https://www.ncbi.nlm.nih.gov/books/NBK26850/'],
 ['Estrutura experimental 1BNA — RCSB PDB','https://www.rcsb.org/structure/1BNA'],
 ['Three.js / WebXR','https://threejs.org/docs/pages/WebXRManager.html']
];
window.DNA_DATA={bases,info,activities,guide,context,questions,sources,sequence:'ATGCCGTAACGTTAGCGATCGTAC',version:'2.3.0',complement:s=>s.split('').map(c=>bases[c].pair).join('')};
})();
