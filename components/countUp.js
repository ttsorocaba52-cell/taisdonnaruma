// Animação sutil dos números das métricas: contam suavemente até o valor real
// ao entrarem na tela, com um leve fade/desfoque. Mantém o formato brasileiro
// (vírgula decimal, ponto de milhar) e prefixos/sufixos como "+", "K", "M", "%".
//
// Alvos: números em destaque (fonte tabular) fora da capa (#s01) e da seção de
// valores (#s06). Para excluir um número específico, adicione data-no-count.

const DURATION = 1800;
const ease = (k) => 1 - Math.pow(1 - k, 4); // easeOutQuart: desacelera com delicadeza no fim
const NUM = /^([^\d]*?)(\d[\d.]*(?:,\d+)?)([^\d]*)$/;

function parse(text) {
  const m = text.match(NUM);
  if (!m || /R\$/.test(m[1])) return null;
  const [, pre, raw, suf] = m;
  const dec = raw.includes(",") ? raw.split(",")[1].length : 0;
  const value = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  if (!isFinite(value)) return null;
  return { pre, suf, dec, value, group: raw.includes(".") };
}

function format({ pre, suf, dec, group }, v) {
  const s = v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: group });
  return pre + s + suf;
}

export function setupCountUp() {
  const targets = [...document.querySelectorAll('[style*="tabular-nums"]')].filter(
    (el) =>
      !el.closest("#s01, #s06, [data-no-count]") &&
      el.childNodes.length === 1 &&
      el.firstChild.nodeType === Node.TEXT_NODE,
  );
  const items = new Map();
  targets.forEach((el) => {
    const node = el.firstChild;
    const final = node.nodeValue;
    const p = parse(final.trim());
    if (!p) return;
    items.set(el, { node, final, p });
    node.nodeValue = format(p, 0);
  });

  const run = (el, delay) => {
    const { node, final, p } = items.get(el);
    el.animate([{ opacity: 0.35, filter: "blur(3px)" }, { opacity: 1, filter: "blur(0px)" }], {
      duration: 1100,
      delay,
      easing: "cubic-bezier(.2,.7,.1,1)",
      fill: "backwards",
    });
    let t0 = null;
    const step = (now) => {
      if (t0 === null) t0 = now + delay;
      const k = Math.max(0, Math.min(1, (now - t0) / DURATION));
      // altera o próprio nó de texto (o React continua dono dele)
      node.nodeValue = k >= 1 ? final : format(p, p.value * ease(k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      // números que entram juntos começam em leve cascata
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          io.unobserve(e.target);
          run(e.target, Math.min(i, 6) * 70);
        });
    },
    { threshold: 0.4 },
  );
  items.forEach((_, el) => io.observe(el));
  return io;
}
