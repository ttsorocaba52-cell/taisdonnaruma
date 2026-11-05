# Mídia Kit · Tais Donnaruma

Landing page one-page que funciona como mídia kit digital da criadora **Tais Donnaruma** (@taisdonnaruma): moda, lifestyle, beleza e humor. Público: marcas e agências.

Feita em **Next.js 16** (App Router), recriando fielmente o protótipo do design handoff (`docs/design-handoff.md`).

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Build de produção

```bash
npm run build
npm start
```

A página é gerada como estática, então pode ser publicada na Vercel, Netlify ou qualquer hospedagem estática.

## Onde editar o conteúdo

Todo o conteúdo (números, cases, pacotes, contatos) fica em `components/MidiaKit.jsx`, no método `renderVals()`:

| O quê | Chave em `renderVals()` |
|---|---|
| Números da capa | `heroStats` |
| Cards das 3 plataformas (frente/verso) | `plat` (início do método) e `totals` |
| Instagram | `igKpis`, `igAge`, `igFormats`, `igTop`, `stStats`, `stDays` |
| TikTok | `tdKpis`, `tdGrowth`, `tdAge`, `tdCities`, `tdFormats`, `ttGrid`, `ttGrow`, `ttVids` |
| YouTube | `shKpis`, `shTop`, `shEng`, `ytKpis`, `ytWeeks`, `ytSources`, `ytThemes` |
| Pilares de conteúdo | `progRaw` |
| Marcas parceiras | `logos` |
| Cases | `cases` |
| Pacotes e valores | `plans`, `priceNotes` |
| RSVP / contato | `rsvpRaw`, `contacts`, `mailto` |

Os textos fixos de cada seção estão no JSX do `render()`, no mesmo arquivo. Cada `<section>` tem `data-screen-label` com o nome da seção.

## Imagens

Ficam em `public/assets/`, já otimizadas em WebP:

- `banner-hero.webm` / `banner-hero.mp4`: motion da capa (toca uma vez e para no último frame)
- `banner-hero-end.webp`: imagem final da capa (usada ao fim do vídeo, sem autoplay ou com movimento reduzido)
- `fotos/`: fotos da Tais e dos cases
- `marcas/`: logos das marcas parceiras
- `prints/`: prints das plataformas

Para trocar uma imagem, substitua o arquivo mantendo o mesmo nome ou atualize o caminho em `renderVals()`.

## Estrutura

```
app/
  layout.tsx    fontes (Bodoni Moda, Hanken Grotesk, Mrs Saint Delafield), metadados e SEO
  globals.css   estilos base e animação de revelação no scroll
  hover.css     estados de hover dos elementos
  page.tsx      página principal
components/
  MidiaKit.jsx  a landing page completa (conteúdo, interações e layout)
docs/
  design-handoff.md  especificação de design original
public/assets/  imagens
```

## Comportamento

- Navegação fixa com a seção ativa destacada
- Revelação suave dos elementos ao rolar
- Números das métricas contam suavemente até o valor real ao entrar na tela (exceto os da capa e os preços); a lógica fica em `components/countUp.js`, e `data-no-count` exclui um número específico
- Foco nas métricas ao passar o cursor: a métrica em destaque ganha cor e cresce um pouco, e as vizinhas do grupo esmaecem (cards, barras, colunas e listas; lógica em `components/metricFocus.js`, `data-no-focus` exclui um grupo)
- Cards das plataformas que viram no hover (desktop) ou no toque (mobile)
- Polaroids que embaralham ao toque
- Alternância entre "Pacotes" e "Por formato" na seção de valores; o card em destaque (claro, elevado e com brilho) segue o cursor e volta ao recomendado quando o cursor sai
- Botão no fim dos cases ("Ver pacotes e formatos") que abre um painel lateral com os pacotes e formatos; ao escolher um, o painel fecha, a página vai até o RSVP e o formato já vem marcado
- RSVP que monta um e-mail com os formatos escolhidos
- Botão de copiar o e-mail de contato
- Colagem de adesivos nas margens apenas em telas a partir de 1200px
- Respeita `prefers-reduced-motion`, desligando as animações
- Responsivo de 320px a telas largas: menu em tela cheia no celular (abaixo de 760px), grades sem cards sozinhos na última linha, KPIs em 2 colunas no celular e 3 no tablet, vídeos do TikTok em faixa com rolagem lateral no celular
