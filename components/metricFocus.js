// Foco nas métricas ao passar o cursor: a métrica sob o cursor ganha destaque
// (número em cor de acento e levemente maior) e as vizinhas do mesmo grupo
// ficam esmaecidas. Vale para cards de KPI, barras, colunas de gráfico e listas.
//
// Os grupos são detectados automaticamente: um "item" é o ancestral do número
// cujo pai tem 2+ filhos equivalentes (com a mesma quantidade de números).
// Fica de fora a capa (#s01) e os preços (#s06). Para excluir um grupo, use data-no-focus.

const VALUE = /^[+]?\d[\d.,]*\s?(K|M|%)\+?$/; // 4,76M · 932K · +44,4% · 9M+

function isMetric(el) {
  if (el.childNodes.length !== 1 || el.firstChild.nodeType !== Node.TEXT_NODE) return false;
  const t = el.textContent.trim();
  return el.matches('[style*="tabular-nums"]') ? /\d/.test(t) && !/R\$/.test(t) : VALUE.test(t);
}

function isDarkSection(section) {
  const [r, g, b] = getComputedStyle(section).color.match(/\d+/g).map(Number);
  return r * 0.299 + g * 0.587 + b * 0.114 > 160; // texto claro = fundo escuro
}

export function setupMetricFocus() {
  const nums = [...document.querySelectorAll("section span, section div")].filter(
    (el) => !el.closest("#s01, #s06, [data-no-focus]") && isMetric(el),
  );
  const numSet = new Set(nums);
  const count = (el) => {
    let n = numSet.has(el) ? 1 : 0;
    el.querySelectorAll("span, div").forEach((d) => numSet.has(d) && n++);
    return n;
  };

  nums.forEach((num) => {
    const section = num.closest("section");
    let item = num;
    while (item.parentElement && item.parentElement !== section) {
      const parent = item.parentElement;
      // frente/verso de card que vira não são itens separados
      const isFlip = [...parent.children].some((c) => getComputedStyle(c).backfaceVisibility === "hidden");
      const n = count(item);
      const peers = isFlip ? [] : [...parent.children].filter((c) => count(c) === n);
      if (peers.length >= 2 && peers.includes(item) && item !== num) {
        if (!parent.hasAttribute("data-focus")) {
          parent.setAttribute("data-focus", "");
          parent.style.setProperty("--focus", isDarkSection(section) ? "#FF8FB0" : "#B3093F");
        }
        if (!item.hasAttribute("data-focus-item")) {
          item.setAttribute("data-focus-item", "");
          // acrescenta o fade do foco às transições que o item já tem (reveal, hover etc.)
          const t = getComputedStyle(item).transition;
          const base = !t || /^all 0s/.test(t) ? "" : t + ", ";
          item.style.transition = base + "filter .45s cubic-bezier(.2,.7,.1,1)";
        }
        break;
      }
      item = parent;
    }
    const host = num.closest("[data-focus-item]");
    if (host) {
      num.setAttribute("data-focus-num", "");
      // o número cresce a partir do lado em que está alinhado, sem sair da borda
      const r = document.createRange();
      r.selectNodeContents(num); // mede o texto em si, não a caixa (que pode ocupar a largura toda)
      const n = r.getBoundingClientRect(), h = host.getBoundingClientRect();
      const box = num.getBoundingClientRect();
      const rel = h.width ? (n.left + n.width / 2 - h.left) / h.width : 0;
      // origem relativa à caixa do número, no ponto onde o texto está
      const ox = box.width ? Math.round(((n.left - box.left + (rel > 0.62 ? n.width : rel < 0.38 ? 0 : n.width / 2)) / box.width) * 100) : 0;
      num.style.transformOrigin = ox + "% 100%";
    }
    else if (num.matches('[style*="tabular-nums"]')) {
      // número de destaque sozinho: ganha o realce só ao passar o cursor nele
      num.setAttribute("data-focus-solo", "");
      num.style.setProperty("--focus", isDarkSection(section) ? "#FF8FB0" : "#B3093F");
    }
  });

  // cards de plataforma que viram: ao passar o cursor num card, os outros esmaecem
  document.querySelectorAll('section [style*="perspective"]').forEach((card) => {
    const grid = card.parentElement;
    if (!grid || grid.closest("[data-no-focus]") || grid.children.length < 2) return;
    grid.setAttribute("data-focus-o", "");
    card.setAttribute("data-focus-oitem", "");
    const t = getComputedStyle(card).transition;
    card.style.transition = (!t || /^all 0s/.test(t) ? "" : t + ", ") + "filter .45s cubic-bezier(.2,.7,.1,1)";
  });
}
