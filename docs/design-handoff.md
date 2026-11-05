# Handoff: Mídia Kit Tais Donnaruma (Landing Page)

## Visão geral
Landing page one-page que funciona como mídia kit digital da criadora Tais Donnaruma (@taisdonnaruma) — moda, beleza, lifestyle e humor. Público: marcas e agências. Objetivo: apresentar a criadora, provar alcance com números reais das plataformas e levar ao contato comercial.

## Sobre os arquivos
Os arquivos em `prototipo/` são **referências de design feitas em HTML** — um protótipo que mostra visual e comportamento, **não código de produção**. A tarefa é **recriar este design no ambiente do projeto** (stack sugerida no briefing: **React + Tailwind CSS + Motion for React + Phosphor Icons**), usando os padrões dessa base. Se não houver projeto ainda, Next.js ou Vite + React são boas escolhas.

Para abrir o protótipo: sirva a pasta `prototipo/` com um servidor estático (ex.: `npx serve prototipo`) e abra `Midia Kit Tais Donnaruma.dc.html`. Todo o estilo está inline no markup; os dados (números, cases, listas) ficam na classe `Component` no `<script>` no fim do arquivo — é o melhor lugar para extrair o conteúdo.

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos, conteúdo e interações são finais para esta fase. Recriar fiel ao protótipo. Os números marcados como "Real" vêm de prints das plataformas (out–nov/2026); os poucos marcados "Demo" devem ser substituídos quando houver dado.

## Design tokens

### Cores
| Papel | Hex |
|---|---|
| Vinho / tinta principal (texto, fundos escuros) | `#451531` |
| Vermelho editorial (destaques, itálicos, CTAs) | `#B3093F` |
| Rosa vivo (acentos em fundo escuro, barras) | `#FF3877` |
| Rosa claro (acento texto em fundo escuro) | `#FF8FB0` / `#FFB3C9` |
| Rosa pó (hover de cards) | `#FFE3EB` |
| Off-white (fundo base) | `#F8F5F2` |
| Off-white quente (cards) | `#FCFAF8` / `#FFFDF9` |
| Lavanda (fundo Instagram, tags) | `#DCE5FD` |
| Azul lavanda (detalhes) | `#A5BEFA` |
| Azul piscina (fundo Marcas) | `#DCEFF4` |
| Turquesa (acento TikTok) | `#64B7CC` |
| Bege capa (fundo hero) | `#D8D2C6` |
| Texto secundário em fundo claro | `#6B4A5C` |
| Texto secundário em fundo escuro | `#E9DDE5` / `#C9AFBE` / `#E2D0DA` |

### Tipografia (Google Fonts)
- **Bodoni Moda** (serifada editorial) — títulos, itálicos de destaque. `font-weight:400`, `font-variation-settings:'opsz' 28` (mantém os traços finos legíveis em tamanhos grandes). Títulos de seção: `clamp(54px, 8vw, 132px)`, `line-height:.9`, `letter-spacing:-.02em`.
- **Hanken Grotesk** (sans) — corpo e **todos os números/métricas**. Corpo 17px / 1.55. Números: `font-weight:500`, `font-variant-numeric: tabular-nums lining-nums`, `letter-spacing:-.035em`; KPIs `clamp(46px,4.4vw,70px)`, `line-height:.9`.
- **Mrs Saint Delafield** (manuscrita) — assinatura/detalhes pontuais.
- Etiquetas/labels: Hanken 12.5px, `font-weight:600`, `letter-spacing:.1em`, `uppercase`.

### Forma e elevação
- Cards "janela": `border:1.5px solid #451531`, `border-radius:10px`, barra de título colorida no topo (8–9px de raio superior) e **sombra sólida deslocada** `box-shadow:7px 7px 0 <cor>` (vinho, vermelho, rosa ou turquesa). Não usar sombras borradas.
- Pills/tags: `border-radius:999px`, `border:1px solid #451531`, padding `6px 14px`, 13px.
- Fotos: `border-radius:14px`, borda 1.5px vinho.
- Linhas editoriais: `border-top:1px solid #451531` com header de seção "N° 03 · Os números · …" à esquerda e período/etiqueta em `#B3093F` à direita.
- Container: `max-width:1360px`, padding lateral `clamp(16px,3.5vw,48px)`, padding vertical de seção `clamp(80px,10vw,140px)`.
- Gaps de grid: `clamp(24px,3vw,44px)`.

### Ícones
Phosphor Icons (`@phosphor-icons/react`), estilos regular e fill.

## Seções (em ordem)
| # | id | Nome | Fundo |
|---|---|---|---|
| 01 | `s01` | Capa (hero) | `#D8D2C6` |
| 02 | `s02` | A anfitriã (sobre) | `#F8F5F2` |
| 03 | `s03` | Os números (visão geral das 3 plataformas, cards que viram) | `#451531` |
| 03b | `s03-ig` | Instagram em detalhe | `#DCE5FD` |
| 03c | `s03-ig-st` | Instagram · Stories | `#451531` |
| 03d | `s03-tt` | TikTok em detalhe | `#F8F5F2` |
| 03e | `s03-tt-v` | TikTok · Views / crescimento semanal | `#451531` |
| 03f | `s03-yt` | YouTube Shorts | `#451531` |
| 03g | `s03-yt-d` | YouTube em detalhe | `#F8F5F2` |
| 04 | `s04` | O programa (pilares de conteúdo) | `#F8F5F2` |
| 05 | `s05` | Marcas (logos de parceiras) | `#DCEFF4` |
| 05b | `s05b` | Cases (Aura Beauty, Riachuelo, 70mai, Nyma) + área de conteúdo educativo | `#F8F5F2` |
| 06 | `s06` | Serviços e valores (pacotes) | `#451531` / `#FCFAF8` |
| 07 | `s07` | RSVP / Contato | `#451531` |

Detalhes de cada seção (layout exato, cópia, valores) estão no arquivo do protótipo — cada `<section>` tem `data-screen-label` com o nome acima. Pontos-chave:

- **Capa:** nome "Tais Donnaruma" grande em Bodoni centralizado, foto protagonista (`assets/banner-hero.png`), linha superior "Mídia kit · Edição 2026 · Fun but chic · @taisdonnaruma", elementos de colagem.
- **Os números:** 3 cards (Instagram 270K, TikTok 400K, YouTube 100K) que giram em 3D no hover/clique (`rotateY(180deg)`) revelando métricas de 30 dias. Contadores animam de 0 ao valor ao entrar na tela.
- **Seções de plataforma:** grid de KPIs com bordas compartilhadas (borda esquerda/topo no container, direita/baixo em cada célula), cada KPI com etiqueta "Real"/"Demo"; cards-janela com gráficos simples (rosca via `conic-gradient`, barras horizontais, barras de gênero).
- **Marca do público feminino:** destaque para a maioria feminina da audiência (ver seções de Instagram/YouTube).
- **Cases:** cada case tem marca, tipo, plataforma, descrição, 3 resultados (views somadas, melhor publi, nº de conteúdos) e fotos.
- **Colagem:** pequenos "adesivos" (fotos inclinadas, ícone de like, ticket) posicionados nas margens das seções, **apenas em telas ≥ 1200px**.

## Interações e comportamento
- **Navegação:** barra fixa minimalista com monograma "T✦D" e botões-âncora por seção; o item ativo acompanha a seção visível (IntersectionObserver, `rootMargin:'-45% 0px -50% 0px'`). Scroll suave.
- **Revelação no scroll:** elementos com `data-r` entram com `opacity 0→1` e `translateY 28px→0`, `1s cubic-bezier(.2,.7,.1,1)`, com atraso escalonado (`data-d`, ex.: 100–120ms). Imagens com `data-ri` revelam por `clip-path: inset(100% 0 0 0) → inset(0)`, `1.4s cubic-bezier(.7,0,.2,1)`. Em Motion: `whileInView` + `viewport={{ once:true, margin:'0px 0px -8% 0px' }}`.
- **Contadores:** `data-count` anima até o valor em 1.6s, easing cúbico de saída, ao atingir 40% de visibilidade.
- **Selos giratórios:** `data-spin` gira 360° contínuo (22s+); `data-spin2` balança ±8° em 3.6s.
- **Hover:** cards sobem `translateY(-6px)` (`.35s cubic-bezier(.2,.8,.2,1)`); células de KPI ganham fundo `#FFE3EB`; links/nav vão para `#B3093F`.
- **Contato:** botão de copiar e-mail (estado "copiado").
- **Acessibilidade:** respeitar `prefers-reduced-motion` (desligar todas as animações); foco `outline:2px solid #B3093F; outline-offset:3px`.

## Responsivo
Layout fluido com `clamp()` e grids `repeat(auto-fit, minmax(min(100%, Xpx), 1fr))` — colapsa para 1 coluna no mobile sem breakpoints. Colagem escondida abaixo de 1200px. Testar em 375px, 768px, 1280px e 1440px.

## Estado
- Seção ativa da navegação.
- Card de plataforma virado (índice).
- E-mail copiado (feedback temporário).
- Sem fetch de dados — conteúdo estático. Recomendo extrair números, cases e pacotes para um arquivo `content.ts` para facilitar a atualização mensal dos números.

## Assets
Em `prototipo/assets/`:
- `banner-hero.png` — foto da capa.
- `fotos/f01–f16.jpg` — fotos da Tais (sobre, colagem, posts em destaque).
- `fotos/aura-case.png`, `riachuelo-case.png`, `70mai-case.png`, `nyma-case.png` — fotos dos cases.
- `prints/p1.jpeg`, `p3.jpeg`, `p7.jpeg` — prints das plataformas (Instagram, TikTok, YouTube).
- `tiktok-1.png` — imagem do bloco TikTok.
Os logos das marcas parceiras estão em `assets/marcas/` no projeto original, caso sejam usados. Otimizar as imagens (WebP/AVIF, `loading="lazy"` fora da primeira dobra).

## Arquivos
- `prototipo/Midia Kit Tais Donnaruma.dc.html` — o protótipo completo (markup + dados + lógica).
- `prototipo/support.js` — runtime para abrir o protótipo no navegador (não portar).
- `prototipo/image-slot.js` — componente de placeholder de imagem arrastável (não portar; usar `<img>`).
