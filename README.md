# Portal 360º VR · Hub de experiências

Atualização do catálogo do Portal do Educador para receber novas aplicações ao longo do tempo. O hub organiza o acervo, apresenta detalhes e encaminha o aluno à experiência escolhida. Cada aplicação continua independente, com seus próprios recursos e atividades.

Este pacote completo reúne o hub atualizado e as aplicações, modelos, áudios, capas e vídeos recuperados do repositório original `Newpc-Alan/portal-360-vr`, árvore `02f6633ed56185f0d681ddb3099a600cd7b750c1`.

## Publicação no novo repositório

O destino desta correção é `newpceducador-hue/portal-360-`, branch `main`, pasta `/ (root)`. Consulte o passo a passo em **INSTALAR.txt**.

1. Use “Extrair Tudo” no ZIP e copie o conteúdo extraído para a raiz do repositório clonado com GitHub Desktop.
2. Preserve as pastas completas: `hub/`, `apps/`, `assets/` e `sala/`. Não retire os arquivos de dentro delas.
3. Mantenha `.nojekyll` na raiz. Este pacote não inclui `CNAME`, pois o destino usa o endereço padrão do GitHub Pages. Remova um CNAME antigo somente desse novo repositório.
4. Faça o commit, envie com Push origin e aguarde a publicação concluir no GitHub Pages.
5. Acesse `https://newpceducador-hue.github.io/portal-360-/?catalog=1` e confira cada aplicação.

O envio anterior colocou arquivos de `hub/` na raiz e omitiu `apps/` e `assets/`, gerando erros 404. Este pacote recompõe essa estrutura. Ele não publica automaticamente o site. As aplicações originais foram preservadas; a execução em headset físico ainda precisa ser validada.

Para conferir a integridade dos caminhos antes de publicar:

```bash
node tools/validar-hub.cjs --completo
node --test tests/*.test.cjs
```

A pasta `tests/` e os arquivos de documentação são apoio de manutenção.

## Organização dos arquivos

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura acessível do hub e carregamento dos módulos. |
| `hub/hub.css` | Identidade visual, layout responsivo e estados da interface. |
| `hub/catalogo.js` | Cadastro central das experiências e endereços da abertura. |
| `hub/core.js` | Busca, filtros, ordenação, URLs e validação dos dados. |
| `hub/app.js` | Renderização do catálogo, detalhes, favoritos e recentes. |
| `hub/media.js` | Abertura local, controles de áudio e videoaulas. |
| `hub/launcher.js` e `hub/launcher.css` | Carregamento da experiência e entrada em VR. |
| `hub/bridge.js` | Integração opcional para novas aplicações. |
| `diagnostico-vr.html` | Verificações do navegador e teste explícito de entrada em VR. |
| `apps/` | Aplicações originais completas, incluídas neste pacote. |
| `assets/` | Logo, capas, vídeos e outros arquivos originais incluídos. |

Os caminhos das cinco aplicações cadastradas foram preservados: `apps/sistema-solar/`, `apps/dna/`, `apps/corpo-humano/`, `apps/terra/` e `apps/celula/`. História e Química permanecem identificadas como propostas em desenvolvimento, sem botão de acesso a uma aplicação inexistente.

## Como ampliar o acervo

O arquivo `hub/catalogo.js` contém um objeto com `version`, `intro` e `experiences`. Para acrescentar uma aplicação, adicione um registro em `experiences`. Não é necessário criar um card manualmente no HTML.

| Campo | Uso |
| --- | --- |
| `id` | Identificador único e estável, em minúsculas e com hífens. É usado também nos favoritos e recentes. |
| `title` | Nome apresentado ao aluno. |
| `summary` | Frase curta do card. |
| `description` | Explicação da experiência no painel de detalhes. |
| `category` / `categoryLabel` | Identificador em minúsculas com hífens e nome em português. Novas categorias entram nos filtros a partir do cadastro. |
| `levels` | Etapas: `efi` (Fundamental I), `efii` (Fundamental II), `em` (Ensino Médio). São sugestões de uso, não validação curricular automática. |
| `status` | `available` para uma aplicação publicada e conferida; `soon` para uma proposta ainda indisponível. |
| `formats` | Recursos efetivamente suportados: `3d`, `vr`, `360` e/ou `simulacao`. Em propostas, representam formatos previstos. |
| `cover` | Caminho da capa em `assets/` ou URL HTTPS; obrigatório para uma experiência disponível. |
| `path` | Endereço real da aplicação, normalmente `apps/nome/`; obrigatório quando disponível. URLs externas devem usar HTTPS. |
| `keywords` | Termos usados na busca. |
| `objectives` | Objetivos curtos, específicos da experiência. |
| `videoId` | ID de um vídeo do YouTube com 11 caracteres, ou `null` quando não houver videoaula. |
| `featured` | `true` para dar prioridade na ordenação recomendada; `false` para os demais. |

Exemplo de uma proposta **ainda não publicada**:

```javascript
{
  id: 'pantanal',
  title: 'Pantanal Imersivo',
  summary: 'Paisagens, águas e vida no Pantanal.',
  description: 'Proposta em desenvolvimento para explorar paisagens e relações ecológicas do Pantanal.',
  category: 'biologia',
  categoryLabel: 'Biologia',
  levels: ['efi', 'efii'],
  status: 'soon',
  formats: ['360', 'vr'],
  cover: null,
  path: null,
  keywords: ['Pantanal', 'bioma', 'biodiversidade', 'Mato Grosso do Sul'],
  objectives: ['Reconhecer características do Pantanal.', 'Observar relações entre seres vivos e ambiente.'],
  videoId: null,
  featured: false
}
```

Quando o Pantanal estiver pronto, coloque a aplicação e a capa nos caminhos escolhidos, preencha `path` e `cover` e altere `status` para `available`. Confirme os formatos realmente implementados antes de divulgar a experiência. Vídeo 360° e VR não são equivalentes: informe os dois somente se a aplicação oferecer os dois.

Uma aplicação não precisa ter aula guiada, missão, avaliação e exploração livre para entrar no catálogo. Anuncie somente o que ela oferece. O hub cuida da descoberta e do acesso; a pedagogia e a interação pertencem a cada experiência.

## Abertura, aulas e arquivos originais

A abertura usa o MP4 local configurado em `intro.video`, inicialmente `assets/abertura.mp4`. O pôster é `assets/abertura-poster.jpg`. O catálogo utiliza uma capa estática para economizar recursos: o campo `intro.background` preserva a referência anterior, mas não inicia reprodução em loop nesta versão. Esses arquivos de mídia não estão incluídos neste pacote. A reprodução com som depende da interação e das permissões do navegador; o aluno pode seguir ao catálogo.

As videoaulas continuam externas, pelo YouTube, somente nos dois cadastros que já tinham vídeo: Sistema Solar e Corpo Humano. Não confunda essas aulas com o vídeo local de abertura. O acesso ao YouTube pode depender da rede da escola.

O logo original continua em `assets/logo-portal-educador.png`. As capas e os caminhos das aplicações foram reaproveitados. As narrações e os modelos dentro de `apps/` não foram alterados. Não são anunciadas contagens de sistemas ou objetos que não puderam ser verificadas nos arquivos recebidos.

## Favoritos e recentes

Favoritos e acessos recentes ficam no armazenamento local do navegador daquele dispositivo. Não exigem login e não são sincronizados entre tablets, computadores e óculos. Apagar os dados do site ou usar uma sessão privada pode removê-los. Em dispositivos compartilhados, essas preferências são do navegador compartilhado, não de cada aluno.

## Entrada em 3D e VR

As experiências são preparadas quando escolhidas; o hub não baixa todas as aplicações antecipadamente. O botão principal considera o contexto do navegador e os formatos informados no cadastro. A escolha de VR passa por uma consulta a `isSessionSupported('immersive-vr')` quando a API está disponível.

Uma resposta positiva nessa consulta não garante que a sessão será iniciada: o navegador ainda pode negar permissão ou encontrar outro impedimento. Após preparar a aplicação, o carregador apresenta um botão **Entrar em VR** para um novo clique explícito. Esse passo preserva a ativação do usuário no momento de solicitar a sessão, inclusive quando o carregamento leva mais tempo.

O carregador mantém compatibilidade com aplicações legadas de mesma origem que exponham a função global `alternarVR`. Nesse caso, informa que os controles de VR foram carregados; não presume que todos os modelos e texturas estejam prontos. A integração opcional por `hub/bridge.js` permite que novas aplicações comuniquem a prontidão real. Os apps existentes não foram reescritos neste pacote.

Se a preparação demorar além do prazo do carregador, a interface oferece recuperação, com opções para tentar novamente ou abrir a aplicação diretamente.

Para links externos, a experiência precisa implementar sua própria entrada em VR e suas permissões. O hub não consegue controlar livremente o conteúdo de outra origem. No computador sem suporte a VR, use o modo de exploração compatível com a aplicação.

O retorno ao hub deve apontar para a raiz com `?catalog=1`, evitando repetir a apresentação. Preserve os controles próprios dos apps para sair da sessão VR.

## Integração opcional para aplicações futuras

Em uma nova aplicação hospedada em `apps/nome/`, carregue a ponte e sinalize os eventos reais:

```html
<script src="../../hub/bridge.js"></script>
```

```javascript
// Execute somente depois de concluir o carregamento da cena e dos assets.
PortalHubBridge.ready({
  enterVR: () => alternarVR('vr')
});

// Exemplo para um app com Three.js: vincule à instância real do renderer.
renderer.xr.addEventListener('sessionstart', () => PortalHubBridge.xrStart());
renderer.xr.addEventListener('sessionend', () => PortalHubBridge.xrEnd());

// Em falhas, passe uma mensagem que ajude o aluno.
// PortalHubBridge.error('Não foi possível carregar o modelo. Tente novamente.');

// No controle de retorno ao hub:
// PortalHubBridge.back();
```

Substitua `alternarVR('vr')` pelo ponto de entrada real da nova aplicação se ela tiver outra API. A função registrada precisa solicitar a sessão diretamente em resposta ao clique; evite aguardar downloads dentro dela antes de chamar a API WebXR. Faça o carregamento antes de `ready()`.

A ponte é opcional e não inicia nem modifica sessões por conta própria. `xrStart()` e `xrEnd()` devem refletir o início e o fim reais da sessão, não apenas o clique do usuário. O carregador verifica a origem e a janela remetente das mensagens. A integração direta por essa ponte destina-se a aplicações de mesma origem. Não acrescente o script indiscriminadamente aos apps antigos sem testar os pontos corretos de integração.

## Uso em rede escolar e modo offline

Nenhum novo service worker da raiz é instalado por este hub. Não foi criado um download automático de todo o acervo. O funcionamento offline continua dependendo da implementação e dos arquivos já armazenados por cada aplicação.

Ao atualizar posteriormente um app que já usa `offline.js` e `sw.js`, preserve o registro existente. Conforme a documentação anterior, DNA e Sistema Solar carregavam `offline.js` ao fim do HTML e usavam o script `tools/gerar-precache.py` para atualizar o precache; Corpo Humano e Terra também tinham seus próprios service workers. Esses arquivos internos não vieram nos anexos e precisam ser conferidos no repositório antes de qualquer mudança. Esta atualização do hub não exige substituir o HTML interno dos apps.

## Verificação antes de disponibilizar à escola

- Abra o portal por HTTPS. Para desenvolvimento local, use um servidor em `localhost`; não teste WebXR abrindo `index.html` por `file://`. Um endereço HTTP comum na rede local não equivale a HTTPS ou localhost.
- Confira a abertura, o acesso direto com `?catalog=1`, as capas, a busca, os filtros, os favoritos e os detalhes.
- Abra cada aplicação real em 3D e verifique seu retorno ao catálogo.
- Nos óculos, abra `diagnostico-vr.html`, consulte a compatibilidade e faça o teste de sessão por um clique explícito.
- Teste também a entrada real em cada app, o encerramento do VR e o retorno ao hub. O diagnóstico de sessão não valida modelos, áudio, desempenho ou controles de uma aplicação específica.
- Confira os áudios originais, a legibilidade e a fluidez dentro do headset antes do uso em turma.

Foram disponibilizados testes automatizados para a lógica do catálogo em `tests/core.test.cjs`. Na raiz do projeto, execute:

```bash
node --test tests/*.test.cjs
```

Os testes de código não substituem os testes no navegador e no headset. As pastas `apps/` e `assets/` não estavam nos anexos recebidos; portanto, não houve validação completa do conteúdo das cenas nem homologação em Meta Quest nesta atualização.

## Manutenção

- Atualize `version` em `hub/catalogo.js` ao publicar uma nova versão do catálogo. Essa identificação também pode ser usada nas URLs de abertura, mas não substitui a atualização dos caches internos de cada app.
- Mantenha títulos, descrições, etapas e formatos no cadastro central; evite copiar esses dados para outros arquivos.
- Preserve os IDs já usados para manter os favoritos e recentes correspondentes.
- Use capas leves e coerentes entre si. Teste qualquer caminho novo antes de marcar a aplicação como disponível.
- Valide o catálogo e execute o teste de acesso das experiências afetadas a cada atualização.
