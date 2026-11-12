"use client";
// Mídia Kit · Tais Donnaruma — ported from the design handoff prototype.
// Content (numbers, cases, packages) lives in renderVals() below.
import { Component, Fragment, createRef } from "react";
import HeroMotion from "./HeroMotion";
import { setupCountUp } from "./countUp";
import { setupMetricFocus } from "./metricFocus";

function Slot({ src, ph }) {
  return (
    <span style={{ display: "block", position: "relative", width: "100%", height: "100%", aspectRatio: "3/2" }}>
      <span style={{ position: "absolute", inset: 0, overflow: "hidden", background: "rgba(127,127,127,.08)" }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={ph || ""}
            loading="lazy"
            decoding="async"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 12,
              textAlign: "center",
              fontSize: 12,
              lineHeight: 1.3,
              opacity: 0.75,
            }}
          >
            <i className="ph ph-image" style={{ fontSize: 22 }}></i>
            <span>{ph}</span>
          </span>
        )}
      </span>
    </span>
  );
}

// Vídeos das publis, na ordem dos cases (Aura, Riachuelo, 70mai, Nyma, Couple2)
const PUBLIS = [
  { slug: "aura", dur: "0:16" },
  { slug: "riachuelo", dur: "1:18" },
  { slug: "70mai", dur: "0:42" },
  { slug: "nyma", dur: "1:01" },
  { slug: "couple2", dur: "0:58" },
];
const N_CASES = PUBLIS.length;

// Conteúdo educativo: vídeos em public/assets/educativo (edu-N.mp4, edu-N-preview.mp4, edu-N-poster.webp)
const EDU = [
  { tag: "Tendência", t: "Chinelo com acessórios: sim ou não?", dur: "1:39" },
  { tag: "Collab", t: "Renner x TIG: o que esperar da collab", dur: "1:39" },
  { tag: "Opinião", t: "Tendências que dividem opiniões", dur: "1:43" },
  { tag: "Provador", t: "Provador da collab TIG x Renner", dur: "1:50" },
  { tag: "Moda comentada", t: "Victoria's Secret Fashion Show 2026", dur: "2:02" },
].map((x, i) => ({
  ...x,
  n: "0" + (i + 1),
  video: `/assets/educativo/edu-${i + 1}.mp4`,
  preview: `/assets/educativo/edu-${i + 1}-preview.mp4`,
  poster: `/assets/educativo/edu-${i + 1}-poster.webp`,
  rot: ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg"][i],
}));
const publi = ({ slug, dur }) => ({
  video: `/assets/publis/${slug}.mp4`,
  preview: `/assets/publis/${slug}-preview.mp4`,
  poster: `/assets/publis/${slug}-poster.webp`,
  dur,
});

// Pacote/formato escolhido no painel -> opção marcada no RSVP (índice em rsvpRaw)
const RSVP_FOR_PLAN = { Essencial: 0, "Combo completo": 3, Produção: 4, Stories: 0, Feed: 2, Vídeo: 1, Diária: 4 };

export default class MidiaKit extends Component {
  state = {
    fmt: false,
    active: 0,
    copied: false,
    flip: -1,
    pol: 0,
    prog: -1,
    sel: [],
    vw: null,
    planHover: -1,
    menu: false,
    pkgOpen: false,
    reel: -1,
    reelList: "cases",
    caseIdx: 0,
  };
  progRef = createRef();
  followRef = createRef();
  rootRef = createRef();
  pkgCloseRef = createRef();
  pkgTriggerRef = createRef();
  onResize = () => this.setState((st) => ({ vw: window.innerWidth, menu: window.innerWidth < 760 ? st.menu : false }));

  componentDidMount() {
    this.io2 = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) this.setState({ active: +e.target.dataset.sec });
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    this.t0 = setTimeout(() => document.querySelectorAll("[data-sec]").forEach((s) => this.io2.observe(s)), 50);
    this.t = setTimeout(() => this.setupMotion(), 80);
    this.fine = matchMedia("(pointer:fine)").matches;
    this.tf = setTimeout(() => setupMetricFocus(), 60);
    this.onResize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKey);
  }
  componentDidUpdate(_, prev) {
    this.observeNew();
    if (prev.caseIdx !== this.state.caseIdx) {
      if (this.io4) document.querySelectorAll("video[data-autoplay]").forEach((el) => this.io4.observe(el));
      setupMetricFocus();
      const tab = document.getElementById("case-tab-" + this.state.caseIdx);
      const bar = tab?.parentElement;
      if (tab && bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
    }
    // trava a rolagem da página enquanto o menu do celular está aberto
    const locked = this.state.menu || this.state.pkgOpen || this.state.reel >= 0;
    if (prev.menu !== this.state.menu || prev.pkgOpen !== this.state.pkgOpen || prev.reel !== this.state.reel)
      document.documentElement.style.overflow = locked ? "hidden" : "";
    // painel de pacotes: foco no botão de fechar ao abrir; volta ao botão que abriu ao fechar
    if (!prev.pkgOpen && this.state.pkgOpen) this.pkgCloseRef.current?.focus({ preventScroll: true });
    if (prev.pkgOpen && !this.state.pkgOpen && this.pkgReturn) this.pkgTriggerRef.current?.focus({ preventScroll: true });
  }
  onKey = (e) => {
    if (this.state.reel >= 0) {
      if (e.key === "Escape") this.closeReel();
      if (e.key === "ArrowRight") this.stepReel(1);
      if (e.key === "ArrowLeft") this.stepReel(-1);
      return;
    }
    if (e.key === "Escape" && (this.state.menu || this.state.pkgOpen)) {
      this.pkgReturn = this.state.pkgOpen;
      this.setState({ menu: false, pkgOpen: false });
    }
  };
  componentWillUnmount() {
    clearTimeout(this.t);
    clearTimeout(this.tf);
    clearTimeout(this.t0);
    clearTimeout(this.tc);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKey);
    document.documentElement.style.overflow = "";
    this.io && this.io.disconnect();
    this.io2 && this.io2.disconnect();
    this.io3 && this.io3.disconnect();
    this.io4 && this.io4.disconnect();
  }
  setupMotion() {
    // Reveal-on-scroll: elements start hidden via CSS (html.rv) and get .in when visible.
    if (!document.documentElement.classList.contains("rv")) return;
    this.io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          this.io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    this.observeNew();
    this.io3 = setupCountUp();
    this.io4 = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          const vid = e.target;
          if (e.isIntersecting) {
            const p = vid.play();
            if (p && p.catch) p.catch(() => {});
          } else vid.pause();
        }),
      { threshold: 0.3 },
    );
    document.querySelectorAll("video[data-autoplay]").forEach((el) => this.io4.observe(el));
    document
      .querySelectorAll("[data-spin]")
      .forEach((el, i) => el.animate([{ rotate: "0deg" }, { rotate: "360deg" }], { duration: 22000 + i * 6000, iterations: Infinity }));
    document.querySelectorAll("[data-spin2]").forEach((el) =>
      el.animate([{ rotate: "-8deg" }, { rotate: "8deg" }, { rotate: "-8deg" }], {
        duration: 3600,
        iterations: Infinity,
        easing: "ease-in-out",
      }),
    );
    document.querySelectorAll("[data-tw]").forEach((el, i) =>
      el.animate(
        [
          { scale: "1", rotate: "0deg" },
          { scale: ".55", rotate: "45deg" },
          { scale: "1", rotate: "0deg" },
        ],
        { duration: 2800 + i * 400, iterations: Infinity, easing: "ease-in-out" },
      ),
    );
  }
  observeNew() {
    if (!this.io) return;
    document.querySelectorAll("[data-r]:not([data-obs]),[data-ri]:not([data-obs])").forEach((el) => {
      el.setAttribute("data-obs", "");
      if (el.dataset.d) el.style.setProperty("--d", el.dataset.d + "ms");
      this.io.observe(el);
    });
  }
  // player das publis
  openReel(i, list = "cases") {
    this.reelReturn = document.activeElement;
    this.setState({ reel: i, reelList: list, menu: false, pkgOpen: false });
  }
  closeReel = () => {
    this.setState({ reel: -1 });
    this.reelReturn?.focus?.({ preventScroll: true });
  };
  // visualizador de cases
  setCase = (i) => this.setState({ caseIdx: (i + N_CASES) % N_CASES });
  stepCase = (d) => this.setState((st) => ({ caseIdx: (st.caseIdx + d + N_CASES) % N_CASES }));
  stepReel = (d) =>
    this.setState((st) => {
      const n = st.reelList === "edu" ? EDU.length : N_CASES;
      return { reel: (st.reel + d + n) % n };
    });
  goId(id) {
    const s = document.getElementById(id);
    if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 40, behavior: "smooth" });
  }
  go(i) {
    const s = document.getElementById("s0" + (i + 1));
    if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 40, behavior: "smooth" });
  }
  renderVals() {
    const { active, copied, flip, pol, prog, sel } = this.state;
    const showPrices = this.props.showPrices ?? true;
    const narrow = this.state.vw != null && this.state.vw < 760;
    const navRaw = [
      ["Sobre", 1],
      ["Números", 2],
      ["Marcas", 4],
      ["Conteúdo", 3],
      ["Serviços", 5],
      ["Contato", 6],
    ].filter((x) => showPrices || x[1] !== 5);
    const pols = [
      { id: "v7-pol-1", src: "/assets/fotos/f14.webp", ph: "Foto 1", cap: "look do dia" },
      { id: "v7-pol-2", src: "/assets/fotos/f07.webp", ph: "Foto 2", cap: "bastidores" },
      { id: "v7-pol-3", src: "/assets/fotos/f08.webp", ph: "Foto 3", cap: "fim de semana" },
    ];
    const poses = [
      { x: "0px", y: "0px", r: "-3deg", z: 3 },
      { x: "26px", y: "-14px", r: "6deg", z: 2 },
      { x: "-24px", y: "-6px", r: "-9deg", z: 1 },
    ];
    const plat = [
      {
        name: "Instagram",
        icon: "ph ph-instagram-logo",
        num: 258,
        suf: "K",
        unit: "seguidores",
        sub: "4,7M",
        subk: "visualizações",
        period: "30 dias",
        print: "/assets/prints/p1.webp",
        printId: "v8-pr-1",
        ar: "736/1600",
        rows: [
          { k: "Visualizações", v: "4,76M" },
          { k: "Espectadores", v: "1,4M" },
          { k: "Interações", v: "184K" },
        ],
      },
      {
        name: "TikTok",
        icon: "ph ph-tiktok-logo",
        num: 412,
        suf: "K",
        unit: "seguidores",
        sub: "+20M",
        subk: "curtidas",
        period: "27/10 a 02/11",
        print: "/assets/prints/p3.webp",
        printId: "v8-pr-2",
        ar: "736/1600",
        rows: [
          { k: "Views de publicação", v: "267K" },
          { k: "Curtidas", v: "22,8K" },
          { k: "Para você", v: "71,5%" },
        ],
      },
      {
        name: "YouTube",
        icon: "ph ph-youtube-logo",
        num: 132,
        suf: "K",
        unit: "inscritos",
        sub: "4,3M",
        subk: "visualizações",
        period: "28 dias",
        print: "/assets/prints/p7.webp",
        printId: "v8-pr-3",
        ar: "736/1600",
        rows: [
          { k: "Visualizações", v: "4,3M" },
          { k: "Novos inscritos", v: "+9,9K" },
          { k: "Horas assistidas", v: "35,7K" },
        ],
      },
    ];
    const progRaw = [
      [
        "Moda",
        "Looks reais, styling acessível e muito provador. Tendência traduzida para a vida.",
        "Look do dia · Provador · Tendências",
        "/assets/fotos/f01.webp",
      ],
      [
        "Lifestyle",
        "Rotina, viagens, vida a dois e as cachorrinhas mais famosas do feed.",
        "Vlog · Rotina · Viagem",
        "/assets/fotos/f06.webp",
      ],
      [
        "Beleza",
        "Make, skincare e cabelo testados na frente da câmera, com opinião sincera.",
        "GRWM · Resenha · Tutorial",
        "/assets/fotos/f12.webp",
      ],
      ["Humor", "Esquetes e trends do dia a dia. O motivo de quem chega e fica.", "Esquete · Trend · Shorts", "/assets/fotos/f07.webp"],
    ];
    const rsvpRaw = ["Stories", "Vídeo TikTok e/ou Reels", "Carrossel de fotos", "Combo sugerido", "Diária de produção"];
    const mailBody = sel.length
      ? "Olá, Tais! Temos interesse em: " + sel.map((i) => rsvpRaw[i]).join(", ") + "."
      : "Olá, Tais! Gostaríamos de conversar sobre uma parceria.";
    const toggleSel = (i) => this.setState((s) => ({ sel: s.sel.includes(i) ? s.sel.filter((x) => x !== i) : [...s.sel, i].sort() }));
    return {
      grain: this.props.grain ?? true,
      showPrices,
      pricingPlans: showPrices && (this.props.pricingStyle ?? "Planos") === "Planos",
      knobX: this.state.fmt ? "28px" : "3px",
      pkgC: this.state.fmt ? "#C9AFBE" : "#F8F5F2",
      fmtC: this.state.fmt ? "#F8F5F2" : "#C9AFBE",
      togglePlan: () => this.setState((st) => ({ fmt: !st.fmt, planHover: -1 })),
      setPkg: () => this.setState({ fmt: false, planHover: -1 }),
      setFmt: () => this.setState({ fmt: true, planHover: -1 }),
      plansLeave: () => this.setState({ planHover: -1 }),
      plans: (() => {
        const dark = {
          bg: "rgba(248,245,242,.05)",
          fg: "#F8F5F2",
          bd: "rgba(248,245,242,.2)",
          lift: "0px",
          sh: "none",
          accent: "#FFB3C9",
          muted: "#E2D0DA",
          btnBg: "rgba(248,245,242,.08)",
          btnFg: "#F8F5F2",
          btnBd: "rgba(248,245,242,.28)",
          line: "rgba(248,245,242,.22)",
          badge: "",
        };
        const hi = {
          bg: "#F8F5F2",
          fg: "#451531",
          bd: "#FFB3C9",
          lift: "-18px",
          sh: "0 0 0 6px rgba(255,179,201,.18), 0 30px 80px rgba(255,56,119,.38)",
          accent: "#B3093F",
          muted: "#6B4A5C",
          btnBg: "#451531",
          btnFg: "#F8F5F2",
          btnBd: "#451531",
          line: "rgba(69,21,49,.2)",
        };
        // O destaque (card claro, elevado e com brilho) segue o cursor: vai para o card sob o cursor
        // e volta ao card recomendado (def) quando o cursor sai da grade. O selo fica no card original.
        const paint = (list, def) => {
          const h = this.state.planHover;
          const on = h >= 0 && h < list.length ? h : def;
          return list.map((p, i) => ({
            ...p,
            ...(i === on ? hi : dark),
            badge: p.badge || "",
            enter: () => this.setState({ planHover: i }),
            // escolher no painel: fecha, marca o formato no RSVP e rola até o contato
            pick: () => {
              const idx = RSVP_FOR_PLAN[p.name];
              this.pkgReturn = false;
              this.setState(
                (st) => ({ pkgOpen: false, menu: false, sel: idx == null || st.sel.includes(idx) ? st.sel : [...st.sel, idx].sort() }),
                () => this.go(6),
              );
            },
          }));
        };
        if (!this.state.fmt)
          return paint(
            [
              {
                name: "Essencial",
                icon: "ph ph-circle-dashed",
                from: "A partir de",
                price: "R$ 750",
                unit: "/ sequência",
                desc: "Presença rápida e próxima para marcas que querem começar a parceria.",
                cta: "Quero começar",
                feats: [
                  { t: "Sequência de stories", v: "" },
                  { t: "Menção e link da marca", v: "" },
                  { t: "Story unitário", v: "R$ 300" },
                ],
              },
              {
                badge: "Mais escolhido",
                name: "Combo completo",
                icon: "ph ph-sparkle",
                from: "Pacote",
                price: "R$ 4.550",
                unit: "/ campanha",
                desc: "A presença mais completa da campanha, do feed aos stories, no Instagram e no TikTok.",
                cta: "Reservar o combo",
                feats: [
                  { t: "Stories", v: "" },
                  { t: "Vídeo com repost", v: "" },
                  { t: "Carrossel de fotos", v: "" },
                ],
              },
              {
                name: "Produção",
                icon: "ph ph-camera",
                from: "Diária padrão",
                price: "R$ 8.000",
                unit: "/ até 8h",
                desc: "Conteúdo em volume para os canais da marca, com a Tais em set.",
                cta: "Agendar diária",
                feats: [
                  { t: "Até 8 horas de produção", v: "" },
                  { t: "Looks e cenários combinados", v: "" },
                  { t: "Diária simples · até 4h", v: "R$ 4.000" },
                ],
              },
            ],
            1,
          );
        const m = [
          [
            "Stories",
            "ph ph-circle-dashed",
            [
              ["Unitário", "R$ 300"],
              ["Combo", "R$ 750"],
            ],
            "R$ 300",
            "/ story",
            "Bastidores, recebidos e indicações com link direto.",
          ],
          [
            "Feed",
            "ph ph-squares-four",
            [["Carrossel de fotos", "R$ 1.000"]],
            "R$ 1.000",
            "/ carrossel",
            "Publicação no feed do Instagram, com fotos editoriais.",
          ],
          [
            "Vídeo",
            "ph ph-video-camera",
            [
              ["TikTok e/ou Reels", "R$ 2.000"],
              ["Vídeo com repost", "R$ 3.000"],
            ],
            "R$ 2.000",
            "/ vídeo",
            "O formato que mais alcança: humor, provador e trends.",
          ],
          [
            "Diária",
            "ph ph-camera",
            [
              ["Simples · até 4h", "R$ 4.000"],
              ["Padrão · até 8h", "R$ 8.000"],
            ],
            "R$ 4.000",
            "/ diária",
            "Produção de conteúdo com a Tais para os canais da marca.",
          ],
        ];
        return paint(
          m.map(([name, icon, it, price, unit, desc], i) => ({
            badge: i === 2 ? "Maior alcance" : "",
            name,
            icon,
            from: "A partir de",
            price,
            unit,
            desc,
            cta: "Solicitar",
            feats: it.map(([t, v]) => ({ t, v })),
          })),
          2,
        );
      })(),
      pricingCarta: showPrices && (this.props.pricingStyle ?? "Planos") === "Carta",
      pricingCards: showPrices && (this.props.pricingStyle ?? "Planos") === "Cards",
      stk: {
        sobre: [
          {
            l: "auto",
            r: "3%",
            t: "10px",
            b: "auto",
            photo: true,
            like: false,
            ticket: false,
            heart: true,
            cap: "",
            capC: "#451531",
            ar: "4/5",
            ph: "Recorte / foto",
            id: "stk-sobre-1",
            src: "/assets/fotos/f08.webp",
            w: "76px",
            rot: "7deg",
          },
          {
            l: "3%",
            r: "auto",
            t: "auto",
            b: "18px",
            w: "auto",
            photo: false,
            like: false,
            ticket: true,
            rot: "-4deg",
            icon: "ph ph-airplane-tilt",
            kicker: "Embarque · Portão 26",
            label: "SP → Rio",
          },
        ],
        num: [{ l: "auto", r: "5%", t: "4px", b: "auto", w: "110px", rot: "6deg", photo: false, like: true, ticket: false }],
        ig: [
          {
            l: "auto",
            r: "3%",
            t: "8px",
            b: "auto",
            photo: true,
            like: false,
            ticket: false,
            heart: true,
            cap: "",
            capC: "#451531",
            ar: "1/1",
            ph: "Recorte / foto",
            id: "stk-ig-1",
            src: "/assets/fotos/f13.webp",
            w: "92px",
            rot: "-7deg",
          },
        ],
        tt: [
          {
            l: "auto",
            r: "3%",
            t: "22px",
            b: "auto",
            w: "auto",
            photo: false,
            like: false,
            ticket: true,
            rot: "4deg",
            icon: "ph ph-video-camera",
            kicker: "Gravando · take 03",
            label: "provador",
          },
          { l: "2%", r: "auto", t: "auto", b: "2px", w: "110px", rot: "-4deg", photo: false, like: true, ticket: false },
        ],
        marcas: [
          {
            l: "auto",
            r: "3%",
            t: "14px",
            b: "auto",
            w: "auto",
            photo: false,
            like: false,
            ticket: true,
            rot: "-4deg",
            icon: "ph ph-suitcase-rolling",
            kicker: "Bagagem de mão",
            label: "recebidos",
          },
        ],
        contato: [
          {
            l: "2%",
            r: "auto",
            t: "10px",
            b: "auto",
            photo: true,
            like: false,
            ticket: false,
            heart: true,
            cap: "",
            capC: "#451531",
            ar: "4/5",
            ph: "Recorte / foto",
            id: "stk-contato-1",
            src: "/assets/fotos/f04.webp",
            w: "76px",
            rot: "-7deg",
          },
          { l: "auto", r: "4%", t: "4px", b: "auto", w: "110px", rot: "8deg", photo: false, like: true, ticket: false },
        ],
      },
      collage: (this.props.collage ?? true) && this.state.vw != null && this.state.vw >= 1200,
      goTop: (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      goContact: () => {
        this.setState({ menu: false });
        this.go(6);
      },
      menuOpen: this.state.menu,
      toggleMenu: () => this.setState((st) => ({ menu: !st.menu })),
      closeMenu: () => this.setState({ menu: false }),
      pkgOpen: this.state.pkgOpen,
      reel: this.state.reel,
      reelItems:
        this.state.reelList === "edu"
          ? EDU.map((x) => ({
              kicker: x.n + " · " + x.tag,
              title: x.t,
              video: x.video,
              poster: x.poster,
              foot: "Conteúdo educativo",
              label: "Vídeo",
            }))
          : null,
      caseIdx: this.state.caseIdx,
      nextCase: () => this.stepCase(1),
      prevCase: () => this.stepCase(-1),
      caseKeys: (e) => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!k) return;
        e.preventDefault();
        const i = (this.state.caseIdx + k + N_CASES) % N_CASES;
        this.setCase(i);
        document.getElementById("case-tab-" + i)?.focus();
      },
      caseTouchStart: (e) => {
        this.touchX = e.touches[0].clientX;
        this.touchY = e.touches[0].clientY;
      },
      caseTouchEnd: (e) => {
        // deslizar para os lados troca de case (ignora rolagem vertical)
        const dx = e.changedTouches[0].clientX - this.touchX,
          dy = e.changedTouches[0].clientY - this.touchY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.stepCase(dx < 0 ? 1 : -1);
      },
      closeReel: this.closeReel,
      nextReel: () => this.stepReel(1),
      prevReel: () => this.stepReel(-1),
      pkgCloseRef: this.pkgCloseRef,
      pkgTriggerRef: this.pkgTriggerRef,
      openPkg: () => this.setState({ pkgOpen: true, menu: false, planHover: -1 }),
      closePkg: () => {
        this.pkgReturn = true;
        this.setState({ pkgOpen: false, planHover: -1 });
      },
      seeAllPrices: () => {
        this.pkgReturn = false;
        this.setState({ pkgOpen: false, planHover: -1 }, () => this.go(5));
      },
      nav: navRaw.map(([label, i]) => ({
        label,
        go: () => {
          this.setState({ menu: false });
          this.go(i);
        },
        fg: i === active ? "#B3093F" : "#451531",
      })),
      heroStats: [
        { v: "258K", k: "Instagram", icon: "ph ph-instagram-logo", go: () => this.goId("s03-ig") },
        { v: "412K", k: "TikTok", icon: "ph ph-tiktok-logo", go: () => this.goId("s03-tt") },
        { v: "132K", k: "YouTube", icon: "ph ph-youtube-logo", go: () => this.goId("s03-yt") },
      ],
      // Faixa infinita: duas metades idênticas (cada uma com 4 repetições, mais larga que qualquer tela);
      // o CSS desloca -50% em loop, então a emenda é invisível.
      ticker: [...Array(8)].flatMap(() => ["fun but chic", "moda", "humor", "lifestyle", "beleza"]),
      shuffle: () => this.setState((s) => ({ pol: (s.pol + 1) % 3 })),
      polaroids: pols.map((p, i) => ({ ...p, ...poses[(i - pol + 3) % 3] })),
      stStats: [
        { k: "Média por dia", v: "31K" },
        { k: "Views em 30 dias", v: "932K" },
        { k: "Stories publicados / dia", v: "8 a 12" },
        { k: "Cliques no link / dia", v: "2,1K" },
      ],
      stDays: (() => {
        const d = [
          ["Seg", 28],
          ["Ter", 31],
          ["Qua", 29],
          ["Qui", 34],
          ["Sex", 38],
          ["Sáb", 25],
          ["Dom", 30],
        ];
        return d.map(([dd, v]) => ({
          d: dd,
          v: v + "K",
          h: (v / 38) * 82 + "%",
          c: v === 38 ? "#FF3877" : "#A5BEFA",
          ink: v === 38 ? "#FF8FB0" : "#F8F5F2",
        }));
      })(),
      ttGrid: [
        { k: "Views", icon: "ph ph-play", v: "267K", note: "últimos 7 dias · +6%" },
        { k: "Curtidas", icon: "ph ph-heart", v: "22,8K", note: "últimos 7 dias · +8,4%" },
        { k: "Curtidas totais", icon: "ph ph-heart-half", v: "+20M", note: "acumulado do perfil" },
        { k: "Para você", icon: "ph ph-compass", v: "71,5%", note: "do tráfego vem da For You" },
      ],
      tt2: (() => {
        const v = [380, 420, 360, 510, 470, 560, 520, 640],
          l = [300, 340, 290, 420, 380, 470, 430, 520],
          mx = 700;
        const pt = (a) => a.map((x, i) => ((i * 400) / (a.length - 1)).toFixed(1) + "," + (170 - (x / mx) * 160).toFixed(1)).join(" ");
        const line = pt(v);
        return {
          line,
          line2: pt(l),
          area: "0,170 " + line + " 400,170",
          weeks: [
            { k: "Sem 1", v: "0,8M" },
            { k: "Sem 2", v: "0,9M" },
            { k: "Sem 3", v: "1,0M" },
            { k: "Sem 4", v: "1,1M" },
          ],
        };
      })(),
      ttGrow: [
        ["Compartilhamentos", "576", 44.4, "ph ph-share-fat"],
        ["Views do perfil", "5K", 19.2, "ph ph-user-circle"],
        ["Curtidas", "22,8K", 8.4, "ph ph-heart"],
        ["Views de publicação", "267K", 6, "ph ph-play"],
      ].map(([k, v, d, icon], i) => ({
        k,
        v,
        icon,
        d: "+" + String(d).replace(".", ",") + "%",
        w: Math.max(8, (d / 44.4) * 100) + "%",
        c: i === 0 ? "#FF8FB0" : "#64B7CC",
      })),
      ttVids: [
        { id: "v7-tt-1", src: "/assets/fotos/f02.webp", views: "1,2M", likes: "98K", bg: "#A5BEFA" },
        { id: "v7-tt-2", src: "/assets/fotos/f15.webp", views: "870K", likes: "64K", bg: "#FFB3C9" },
        { id: "v7-tt-3", src: "/assets/fotos/f13.webp", views: "640K", likes: "51K", bg: "#64B7CC" },
        { id: "v7-tt-4", src: "/assets/fotos/f03.webp", views: "520K", likes: "40K", bg: "#FFB3C9" },
        { id: "v7-tt-5", src: "/assets/fotos/f11.webp", views: "410K", likes: "33K", bg: "#A5BEFA" },
      ],
      shCols: this.state.vw != null && this.state.vw < 640 ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))",
      shKpis: [
        { k: "Views", per: "28 dias", v: "4,3M", note: "visualizações no canal" },
        { k: "Público", per: "mensal", v: "1,9M", note: "espectadores únicos" },
        { k: "Novos", per: "público", v: "52,7%", note: "espectadores novos no mês" },
        { k: "Inscritos", per: "28 dias", v: "+9,9K", note: "novos inscritos" },
      ],
      shTop: [
        { n: 1, id: "v7-sh-1", src: "/assets/fotos/f16.webp", views: "1,0M", likes: "64K", com: "1,2K", bg: "#FFB3C9" },
        { n: 2, id: "v7-sh-2", src: "/assets/fotos/f10.webp", views: "800K", likes: "51K", com: "980", bg: "#A5BEFA" },
        { n: 3, id: "v7-sh-3", src: "/assets/fotos/f04.webp", views: "600K", likes: "38K", com: "740", bg: "#FFB3C9" },
      ],
      shEng: [
        { k: "Visualizações", v: "4,3M", w: "100%", c: "#FF3877", icon: "ph ph-play" },
        { k: "Vídeo mais visto", v: "2,7M", w: "63%", c: "#FFB3C9", icon: "ph ph-crown-simple" },
        { k: "Público mensal", v: "1,9M", w: "44%", c: "#64B7CC", icon: "ph ph-users-three" },
        { k: "Horas assistidas", v: "35,7K", w: "30%", c: "#A5BEFA", icon: "ph ph-timer" },
      ],
      territories: ["Moda", "Lifestyle", "Beleza", "Humor", "Viagens", "Vida a dois", "Wellness"],
      platforms: plat.map((p, i) => ({
        ...p,
        n: "0" + (i + 1),
        big: p.num + p.suf,
        d: i * 100,
        rot: flip === i ? "180deg" : "0deg",
        enter: () => this.fine && this.setState({ flip: i }),
        leave: () => this.fine && this.setState({ flip: -1 }),
        toggle: () => !this.fine && this.setState((s) => ({ flip: s.flip === i ? -1 : i })),
      })),
      totals: [
        { v: "800K", k: "seguidores somados nas três plataformas", d: 0 },
        { v: "9M+", k: "visualizações no último mês (Instagram + YouTube)", d: 80 },
        { v: "1,9M", k: "pessoas por mês no YouTube", d: 160 },
      ],
      progRef: this.progRef,
      followRef: this.followRef,
      followOp: prog >= 0 && this.fine ? 1 : 0,
      progMove: (e) => {
        const r = this.progRef.current,
          f = this.followRef.current;
        if (!r || !f) return;
        const b = r.getBoundingClientRect();
        f.style.transform = `translate(${e.clientX - b.left + 24}px, ${e.clientY - b.top - f.offsetHeight / 2}px)`;
      },
      progLeave: () => this.setState({ prog: -1 }),
      progCols: narrow ? "40px minmax(0,1fr)" : "70px minmax(0,1fr) minmax(0,auto)",
      progLast: narrow ? "2 / 3" : "auto",
      program: progRaw.map(([t, desc, formats, src], i) => ({
        n: ["I.", "II.", "III.", "IV."][i],
        t,
        desc,
        formats,
        src,
        id: "v7-prog-" + (i + 1),
        d: i * 70,
        op: prog === i ? 1 : 0,
        sc: prog === i ? 1 : 0.85,
        rr: prog === i ? "0deg" : i % 2 ? "6deg" : "-6deg",
        ink: prog === i ? "#B3093F" : "#451531",
        x: prog === i ? "14px" : "0px",
        enter: () => this.setState({ prog: i }),
      })),
      logos: [
        ["Avon", "avon"],
        ["Riachuelo", "riachuelo"],
        ["Olla", "olla"],
        ["Realme", "realme"],
        ["99", "99"],
        ["Nyma Wellness", "nyma"],
        ["SYS Home Decor", "sys"],
        ["70mai", "70mai"],
      ].map(([t, f], i) => ({ t, src: "/assets/marcas/" + f + ".webp", d: i * 60 })),
      igKpis: [
        { k: "Visualizações", v: "4,76M", note: "últimos 30 dias", icon: "ph ph-play", real: 1 },
        { k: "Espectadores", v: "1,4M", note: "contas únicas em 30 dias", icon: "ph ph-users", real: 1 },
        { k: "Interações", v: "184K", note: "curtidas, comentários e shares", icon: "ph ph-heart", real: 1 },
        { k: "Views em Reels", v: "2,7M", note: "formato que mais entrega", icon: "ph ph-film-strip", real: 1 },
        { k: "Views em Stories", v: "932K", note: "últimos 30 dias", icon: "ph ph-circle-dashed", real: 1 },
        { k: "Views em Posts", v: "875K", note: "fotos e carrosséis", icon: "ph ph-squares-four", real: 1 },
      ].map((k) => ({ ...k, tag: k.real ? "Real" : "Demo", tagC: k.real ? "#451531" : "#B3093F" })),
      igAge: [
        ["13–17", 18.1],
        ["18–24", 30.3],
        ["25–34", 29.8],
        ["35–44", 12.2],
        ["45+", 9.7],
      ].map(([k, v]) => ({ k, v: v.toFixed(1).replace(".", ",") + "%", w: (v / 30.3) * 100 + "%", c: v === 30.3 ? "#B3093F" : "#451531" })),
      igFormats: [
        ["Reels", "2,7M", 100, "visualizações", "ph ph-film-strip"],
        ["Stories", "932K", 35, "visualizações", "ph ph-circle-dashed"],
        ["Posts", "875K", 32, "visualizações", "ph ph-squares-four"],
      ].map(([t, v, w, unit, icon]) => ({ t, v, w: w + "%", unit, icon })),
      igTop: [
        { id: "v7-ig-top-1", src: "/assets/fotos/f01.webp", fmt: "Reels", views: "1,8M", likes: "142K", saves: "9,6K" },
        { id: "v7-ig-top-2", src: "/assets/fotos/f12.webp", fmt: "Carrossel", views: "920K", likes: "88K", saves: "12K" },
        { id: "v7-ig-top-3", src: "/assets/fotos/f03.webp", fmt: "Reels", views: "760K", likes: "61K", saves: "5,4K" },
      ],
      ytKpis: [
        { k: "Visualizações", v: "4,3M", note: "últimos 28 dias", icon: "ph ph-play", real: 1 },
        { k: "Público mensal", v: "1,9M", note: "pessoas diferentes por mês", icon: "ph ph-users-three", real: 1 },
        { k: "Novos inscritos", v: "+9,9K", note: "últimos 28 dias", icon: "ph ph-trend-up", real: 1 },
        { k: "Tempo de exibição", v: "35,7K", note: "horas assistidas · 28 dias", icon: "ph ph-timer", real: 1 },
        { k: "Espectadores novos", v: "52,7%", note: "do público mensal", icon: "ph ph-sparkle", real: 1 },
        { k: "Vídeo mais visto", v: "2,7M", note: "views em 28 dias", icon: "ph ph-crown-simple", real: 1 },
      ].map((k) => ({ ...k, tag: k.real ? "Real" : "Demo", tagC: k.real ? "#451531" : "#B3093F" })),
      ytWeeks: [
        ["6–12/10", 1.2],
        ["13–19/10", 1.2],
        ["20–26/10", 0.8],
        ["27/10–2/11", 1.1],
      ].map(([k, v], i, a) => ({
        k,
        v: v.toFixed(1).replace(".", ",") + "M",
        h: Math.round((v / 1.2) * 78) + "%",
        c: i === a.length - 1 ? "#B3093F" : "#FF3877",
      })),
      ytSources: [
        ["Novos", 52.7],
        ["Casuais", 45.1],
        ["Frequentes", 2.2],
      ].map(([k, v], i) => ({ k, v: v.toFixed(1).replace(".", ",") + "%", w: (v / 52.7) * 100 + "%", c: i === 0 ? "#B3093F" : "#451531" })),
      ytThemes: [
        ["Como conquistar uma mãe de pet", "2,7M", 100],
        ["Quando a ex dele tinha um bat…", "968,8K", 36],
        ["Acho que ele gostou…", "168,3K", 6],
      ].map(([t, v, w], i) => ({ n: "0" + (i + 1), t, v, w: w + "%" })),
      tdKpis: [
        { k: "Seguidores", v: "412K", note: "perfil @taisdonnaruma", icon: "ph ph-user-plus" },
        { k: "Views na semana", v: "267K", note: "+6% vs. semana anterior", icon: "ph ph-play" },
        { k: "Curtidas na semana", v: "22,8K", note: "+8,4% vs. semana anterior", icon: "ph ph-heart" },
        { k: "Compartilhamentos", v: "576", note: "+44,4% na semana", icon: "ph ph-share-fat" },
        { k: "Views do perfil", v: "5K", note: "+19,2% na semana", icon: "ph ph-user-circle" },
        { k: "Para você", v: "71,5%", note: "do tráfego vem da For You", icon: "ph ph-compass" },
      ],
      tdGrowth: [
        ["27/10", 57],
        ["28/10", 34],
        ["29/10", 35],
        ["30/10", 30],
        ["31/10", 28],
        ["01/11", 48],
        ["02/11", 35],
      ].map(([m, v]) => ({ m, v: v + "K", h: Math.round((v / 57) * 78) + "%", c: v === 57 ? "#B3093F" : "#64B7CC" })),
      tdAge: [
        ["18–24", 34.7],
        ["25–34", 36.1],
        ["35–44", 16.5],
        ["45+", 12.7],
      ].map(([k, v]) => ({ k, v: v.toFixed(1).replace(".", ",") + "%", w: (v / 36.1) * 100 + "%", c: v === 36.1 ? "#B3093F" : "#451531" })),
      tdCities: [
        ["Brasil", "80%"],
        ["Portugal", "2,7%"],
        ["Moçambique", "0,5%"],
        ["EUA", "0,4%"],
        ["Angola", "0,3%"],
      ].map(([k, v]) => ({ k, v })),
      tdFormats: [
        ["Provador e looks", "340K", 100],
        ["Trends com humor", "290K", 85],
        ["Rotina e GRWM", "180K", 53],
        ["Recebidos e reviews", "150K", 44],
      ].map(([t, v, w], i) => ({ n: "0" + (i + 1), t, v, w: w + "%" })),
      eduTags: ["Tendências", "Collabs e lançamentos", "Provador", "Moda comentada"],
      edu: EDU.map((x, i) => ({ ...x, play: () => this.openReel(i, "edu") })),
      eduSlots: [
        ["Dica", "Como montar um look-base", "#FFE3EB", "-3deg"],
        ["Beleza", "Skincare sem complicar", "#DCE5FD", "2deg"],
        ["Guia", "O que vale a pena comprar", "#FFE3EB", "-1deg"],
      ].map(([tag, t, bg, rot], i) => ({ tag, t, bg, rot, id: "v8-edu-" + (i + 1) })),
      cases: [
        {
          brand: "Aura Beauty",
          type: "Publi · beleza e perfumaria",
          platform: "Instagram · Reels",
          desc: "Verão no Brasil em clima de editorial: sol, céu azul e a fragrância da Aura Beauty no ritmo leve e solar da Tais.",
          res: [
            { v: "36,2K", k: "Views somadas" },
            { v: "31,2K", k: "Melhor publi" },
            { v: "2", k: "Conteúdos" },
          ],
          deliv: [],
        },
        {
          brand: "Riachuelo",
          type: "Publi · moda",
          platform: "Instagram · Reels + Stories",
          desc: "Look do dia com peças da Riachuelo: styling real, cheio de personalidade e com a sacola na mão, do provador para a rua.",
          res: [
            { v: "86,9K", k: "Views somadas" },
            { v: "42,6K", k: "Melhor publi" },
            { v: "4", k: "Conteúdos" },
          ],
          deliv: [],
        },
        {
          brand: "70mai Brasil",
          type: "Publi · tecnologia no dia a dia",
          platform: "Instagram · Reels",
          desc: "A dashcam 70mai apresentada no carro, com o humor da Tais: tecnologia de segurança explicada de um jeito leve, que viralizou.",
          res: [
            { v: "8,7M", k: "Views somadas" },
            { v: "8,2M", k: "Melhor publi" },
            { v: "2", k: "Publis" },
          ],
          deliv: [],
        },
        {
          brand: "Nyma Wellness Club",
          type: "Publi · lifestyle e bem-estar",
          platform: "Instagram · Reels + Stories",
          desc: "Um momento de autocuidado no tapete: aula, look confortável e o kit da Nyma apresentados no tom leve e real da Tais.",
          res: [
            { v: "87,3K", k: "Views somadas" },
            { v: "4", k: "Conteúdos" },
            { v: "35,2K", k: "Melhor publi" },
          ],
          deliv: [],
        },
        {
          brand: "Couple2",
          type: "Publi · app para casais",
          platform: "Vídeo · esquete de casal",
          desc: "Esquete de casal com o namorado apresentando o Couple2, o app para casais: contador de dias juntos, localização e lembrete das datas importantes, no humor do dia a dia da Tais.",
          res: [
            { v: "4,9M", k: "Visualizações" },
            { v: "346K", k: "Curtidas" },
            { v: "5.129", k: "Reposts" },
            { v: "1.499", k: "Comentários" },
          ],
          deliv: [],
        },
      ].map((c, i) => ({
        ...c,
        n: "0" + (i + 1),
        id: ["v8-case-aura", "v8-case-riachuelo", "v8-case-70mai", "v8-case-nyma", "v8-case-couple2"][i],
        id2: "v7-case-" + (i + 1) + "b",
        src: [
          "/assets/fotos/aura-case.webp",
          "/assets/fotos/riachuelo-case.webp",
          "/assets/fotos/70mai-case.webp",
          "/assets/fotos/nyma-case.webp",
          "/assets/fotos/couple2-case.webp",
        ][i],
        src2: [
          "/assets/fotos/f15.webp",
          "/assets/fotos/f05.webp",
          "/assets/fotos/f06.webp",
          "/assets/fotos/f12.webp",
          "/assets/fotos/f02.webp",
        ][i],
        ph: "Foto da campanha",
        imgOrder: i % 2 ? 2 : 1,
        txtOrder: i % 2 ? 1 : 2,
        radius: i % 2 ? "24px" : "999px 999px 24px 24px",
        rot: i % 2 ? "-4deg" : "4deg",
        // publi completa (com som, abre no player) + prévia curta sem som que roda no card
        ...publi(PUBLIS[i]),
        play: () => this.openReel(i),
        select: () => this.setCase(i),
      })),
      menu: [
        {
          t: "Stories",
          icon: "ph ph-circle-dashed",
          d: 0,
          items: [
            { k: "Unitário", desc: "1 story publicado", v: "R$ 300" },
            { k: "Combo", desc: "Sequência de stories", v: "R$ 750" },
          ],
        },
        {
          t: "Feed",
          icon: "ph ph-squares-four",
          d: 70,
          items: [{ k: "Carrossel de fotos", desc: "Publicação no feed do Instagram", v: "R$ 1.000" }],
        },
        {
          t: "Vídeo",
          icon: "ph ph-video-camera",
          d: 140,
          items: [
            { k: "TikTok e/ou Reels", desc: "1 vídeo publicado", v: "R$ 2.000" },
            { k: "Vídeo com repost", desc: "Vídeo + repost na outra plataforma", v: "R$ 3.000" },
          ],
        },
        {
          t: "Diária de produção",
          icon: "ph ph-camera",
          d: 210,
          items: [
            { k: "Simples", desc: "Até 4 horas", v: "R$ 4.000" },
            { k: "Padrão", desc: "Até 8 horas", v: "R$ 8.000" },
          ],
        },
      ].map((g, i) => ({ ...g, n: ["I.", "II.", "III.", "IV."][i] })),
      comboItems: ["Stories", "Vídeo com repost", "Carrossel de fotos"],
      priceNotes: [
        "Os preços são flexíveis conforme o projeto. Fique à vontade para consultar.",
        "Valores sujeitos a ajuste conforme a quantidade de dias úteis até a data do pagamento ou acréscimo por atraso.",
      ],
      rsvp: rsvpRaw.map((t, i) => {
        const on = sel.includes(i);
        return { t, bg: on ? "#B3093F" : "transparent", op: on ? 1 : 0, toggle: () => toggleSel(i) };
      }),
      rsvpNote: sel.length
        ? sel.length + (sel.length > 1 ? " formatos selecionados" : " formato selecionado")
        : "Nenhum formato marcado? Tudo bem, vamos conversar.",
      mailto:
        "mailto:ctttaisdonnaruma@gmail.com?subject=" +
        encodeURIComponent("Convite · Parceria com Tais Donnaruma") +
        "&body=" +
        encodeURIComponent(mailBody),
      contacts: [
        {
          v: "ctttaisdonnaruma@gmail.com",
          hint: copied ? "copiado" : "copiar",
          icon: "ph ph-envelope-simple",
          href: "mailto:ctttaisdonnaruma@gmail.com",
          target: "_self",
          click: (e) => {
            e.preventDefault();
            try {
              navigator.clipboard.writeText("ctttaisdonnaruma@gmail.com");
            } catch (_) {}
            this.setState({ copied: true });
            clearTimeout(this.tc);
            this.tc = setTimeout(() => this.setState({ copied: false }), 1800);
          },
        },
        {
          v: "@taisdonnaruma",
          hint: "instagram",
          icon: "ph ph-instagram-logo",
          href: "https://www.instagram.com/taisdonnaruma/",
          target: "_blank",
          click: null,
        },
        {
          v: "@taisdonnaruma",
          hint: "tiktok",
          icon: "ph ph-tiktok-logo",
          href: "https://www.tiktok.com/@taisdonnaruma",
          target: "_blank",
          click: null,
        },
        {
          v: "(19) 99150-0182",
          hint: "whatsapp",
          icon: "ph ph-whatsapp-logo",
          href: "https://wa.me/5519991500182",
          target: "_blank",
          click: null,
        },
      ],
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={{ position: "relative", width: "100%", overflowX: "clip" }}>
        {v.grain ? (
          <>
            <div
              style={{
                position: "fixed",
                inset: "0",
                zIndex: "90",
                pointerEvents: "none",
                opacity: ".13",
                mixBlendMode: "multiply",
                backgroundImage:
                  "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3CfeColorMatrix type=%22saturate%22 values=%220%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')",
              }}
            ></div>
          </>
        ) : null}
        <nav
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            zIndex: "80",
            background: "rgba(248,245,242,.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(69,21,49,.18)",
          }}
        >
          <div
            style={{
              maxWidth: "1360px",
              margin: "0 auto",
              padding: "10px clamp(16px,3.5vw,48px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <a
              href="#s01"
              onClick={v.goTop}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "2px",
                fontFamily: "var(--font-bodoni),serif",
                fontVariationSettings: "'opsz' 28",
                fontStyle: "italic",
                fontSize: "24px",
                lineHeight: "1",
                whiteSpace: "nowrap",
              }}
            >
              T<span style={{ color: "#B3093F", fontStyle: "normal", fontSize: "14px" }}>✦</span>D
            </a>
            <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "clamp(12px,2.2vw,30px)", overflowX: "auto" }}>
              {v.nav.map((item, _i1) => (
                <Fragment key={_i1}>
                  <button
                    onClick={item.go}
                    style={{
                      appearance: "none",
                      background: "transparent",
                      border: "0",
                      cursor: "pointer",
                      padding: "6px 0",
                      fontFamily: "var(--font-hanken),sans-serif",
                      fontWeight: "600",
                      fontSize: "12.5px",
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      color: item.fg,
                      transition: "color .25s",
                    }}
                    className="hv1"
                  >
                    {item.label}
                  </button>
                </Fragment>
              ))}
            </div>
            <button
              onClick={v.goContact}
              style={{
                appearance: "none",
                cursor: "pointer",
                flex: "none",
                background: "#451531",
                color: "#F8F5F2",
                border: "0",
                borderRadius: "999px",
                padding: "9px 16px",
                fontFamily: "var(--font-hanken),sans-serif",
                fontWeight: "600",
                fontSize: "12.5px",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transition: "background .25s",
              }}
              className="hv2"
            >
              RSVP
            </button>
            <button
              className="nav-burger"
              onClick={v.toggleMenu}
              aria-label={v.menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={v.menuOpen}
              aria-controls="menu-mobile"
            >
              <i className={v.menuOpen ? "ph ph-x" : "ph ph-list"} style={{ fontSize: "22px" }}></i>
            </button>
          </div>
        </nav>
        {/* Painel lateral com os pacotes e formatos (abre pelo botão no fim dos cases) */}
        {v.showPrices ? (
          <div className={v.pkgOpen ? "pkg-drawer open" : "pkg-drawer"} aria-hidden={!v.pkgOpen}>
            <div className="pkg-backdrop" onClick={v.closePkg}></div>
            <aside id="pacotes" role="dialog" aria-modal="true" aria-labelledby="pacotes-titulo" className="pkg-panel">
              <div className="pkg-head">
                <span>N° 07 · Formatos e investimento</span>
                <button
                  ref={v.pkgCloseRef}
                  className="pkg-close"
                  onClick={v.closePkg}
                  aria-label="Fechar pacotes"
                  tabIndex={v.pkgOpen ? 0 : -1}
                >
                  <i className="ph ph-x"></i>
                </button>
              </div>
              <h2 id="pacotes-titulo">
                Escolha o seu <em>formato</em>
              </h2>
              <p className="pkg-lead">Valores de referência. Cada projeto pode ser ajustado ao objetivo, prazo e escopo da sua marca.</p>
              <div className="pkg-toggle" role="group" aria-label="Tipo de valor">
                <button onClick={v.setPkg} aria-pressed={!v.knobX.startsWith("28")} tabIndex={v.pkgOpen ? 0 : -1} style={{ color: v.pkgC }}>
                  Pacotes
                </button>
                <button
                  className="pkg-switch"
                  onClick={v.togglePlan}
                  aria-label="Alternar entre pacotes e formatos"
                  tabIndex={v.pkgOpen ? 0 : -1}
                >
                  <span style={{ transform: `translateX(${v.knobX})` }}></span>
                </button>
                <button onClick={v.setFmt} aria-pressed={v.knobX.startsWith("28")} tabIndex={v.pkgOpen ? 0 : -1} style={{ color: v.fmtC }}>
                  Por formato
                </button>
              </div>
              <div className="pkg-list" onMouseLeave={v.plansLeave}>
                {v.plans.map((p, i) => (
                  <article
                    key={p.name}
                    onMouseEnter={p.enter}
                    className="pkg-card"
                    style={{
                      background: p.bg,
                      color: p.fg,
                      borderColor: p.bd,
                      boxShadow: p.sh === "none" ? "none" : "0 18px 50px rgba(255,56,119,.3)",
                    }}
                  >
                    {p.badge ? <span className="pkg-badge">{p.badge}</span> : null}
                    <div className="pkg-card-top">
                      <span className="pkg-name" style={{ color: p.accent }}>
                        <i className={p.icon}></i>
                        {p.name}
                      </span>
                      <span className="pkg-from" style={{ color: p.muted }}>
                        {p.from}
                      </span>
                    </div>
                    <div className="pkg-price">
                      <strong>{p.price}</strong>
                      <span style={{ color: p.muted }}>{p.unit}</span>
                    </div>
                    <p style={{ color: p.muted }}>{p.desc}</p>
                    <ul>
                      {p.feats.map((x) => (
                        <li key={x.t}>
                          <i className="ph ph-check-circle" style={{ color: p.accent }}></i>
                          <span>{x.t}</span>
                          {x.v ? <b>{x.v}</b> : null}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="pkg-pick"
                      onClick={p.pick}
                      tabIndex={v.pkgOpen ? 0 : -1}
                      style={{ background: p.btnBg, color: p.btnFg, borderColor: p.btnBd }}
                    >
                      {p.cta} <i className="ph ph-arrow-right"></i>
                    </button>
                  </article>
                ))}
              </div>
              <ul className="pkg-notes">
                {v.priceNotes.map((n) => (
                  <li key={n}>
                    <i className="ph ph-info"></i>
                    {n}
                  </li>
                ))}
              </ul>
              <button className="pkg-all" onClick={v.seeAllPrices} tabIndex={v.pkgOpen ? 0 : -1}>
                Ver a seção completa na página <i className="ph ph-arrow-down"></i>
              </button>
            </aside>
          </div>
        ) : null}
        {/* Player de vídeo (publis dos cases e conteúdos educativos) */}
        {v.reel >= 0
          ? (() => {
              const items =
                v.reelItems ||
                v.cases.map((c) => ({
                  kicker: c.n + " · " + c.type,
                  title: c.brand,
                  video: c.video,
                  poster: c.poster,
                  foot: c.platform,
                  label: "Publi",
                }));
              const it = items[v.reel];
              return (
                <div className="reel-modal" role="dialog" aria-modal="true" aria-label={it.label + " " + it.title}>
                  <div className="reel-backdrop" onClick={v.closeReel}></div>
                  <div className="reel-box">
                    <div className="reel-head">
                      <div>
                        <span className="reel-kicker">{it.kicker}</span>
                        <strong>{it.title}</strong>
                      </div>
                      <button type="button" className="reel-close" onClick={v.closeReel} aria-label="Fechar vídeo" autoFocus>
                        <i className="ph ph-x"></i>
                      </button>
                    </div>
                    <div className="reel-stage">
                      <button type="button" className="reel-nav prev" onClick={v.prevReel} aria-label={it.label + " anterior"}>
                        <i className="ph ph-caret-left"></i>
                      </button>
                      <video
                        key={it.video}
                        className="reel-video"
                        src={it.video}
                        poster={it.poster}
                        controls
                        autoPlay
                        playsInline
                        preload="auto"
                      ></video>
                      <button
                        type="button"
                        className="reel-nav next"
                        onClick={v.nextReel}
                        aria-label={"Próximo: " + it.label.toLowerCase()}
                      >
                        <i className="ph ph-caret-right"></i>
                      </button>
                    </div>
                    <div className="reel-foot">
                      <span>{it.foot}</span>
                      <span>
                        {v.reel + 1} / {items.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          : null}
        {/* Menu do celular (abaixo de 760px): tela cheia com os links */}
        <div id="menu-mobile" className={v.menuOpen ? "menu-mobile open" : "menu-mobile"} aria-hidden={!v.menuOpen} onClick={v.closeMenu}>
          <div className="menu-mobile-inner" onClick={(e) => e.stopPropagation()}>
            <span className="menu-mobile-kicker">Mídia kit · Edição 2026</span>
            <ul>
              {v.nav.map((item, i) => (
                <li key={i} style={{ transitionDelay: v.menuOpen ? 80 + i * 45 + "ms" : "0ms" }}>
                  <button onClick={item.go} tabIndex={v.menuOpen ? 0 : -1} style={{ color: item.fg === "#B3093F" ? "#FF8FB0" : "#F8F5F2" }}>
                    <span>{"0" + (i + 1)}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <button className="menu-mobile-cta" onClick={v.goContact} tabIndex={v.menuOpen ? 0 : -1}>
              Vamos criar juntos <i className="ph ph-arrow-right"></i>
            </button>
            <span className="menu-mobile-foot">@taisdonnaruma</span>
          </div>
        </div>

        <section
          id="s01"
          data-sec="0"
          data-screen-label="01 Capa"
          style={{ position: "relative", padding: "76px clamp(16px,3.5vw,48px) 0", overflow: "hidden", background: "#D8D2C6" }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                padding: "10px 0",
                borderBottom: "1px solid #451531",
                fontSize: "12.5px",
                fontWeight: "600",
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>Mídia kit · Edição 2026</span>
              <span style={{ color: "#B3093F", whiteSpace: "nowrap" }}>Fun but chic</span>
              <span style={{ whiteSpace: "nowrap" }}>@taisdonnaruma</span>
            </div>
            <div
              className="hero-banner"
              style={{
                position: "relative",
                margin: "0 calc(clamp(16px,3.5vw,48px) * -1)",
                overflow: "hidden",
                background: "#D8D2C6",
              }}
            >
              <HeroMotion />
            </div>
            <div
              className="hero-stats"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
                borderTop: "1px solid #451531",
              }}
            >
              <p
                style={{
                  margin: "0",
                  padding: "18px 18px 22px 0",
                  fontSize: "18px",
                  fontWeight: "500",
                  lineHeight: "1.45",
                  textWrap: "pretty",
                }}
              >
                Moda, lifestyle, beleza e humor, com elegância e zero tédio.
              </p>
              {v.heroStats.map((s, _i2) => (
                <Fragment key={_i2}>
                  <button
                    onClick={s.go}
                    style={{
                      appearance: "none",
                      background: "transparent",
                      border: "0",
                      borderLeft: "1px solid rgba(69,21,49,.25)",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "16px 18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      color: "#451531",
                      transition: "background .3s",
                    }}
                    className="hv3"
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontSize: "clamp(40px,4vw,58px)",
                        lineHeight: ".9",
                      }}
                    >
                      {s.v}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <i style={{ fontSize: "15px" }} className={[s.icon].join(" ")}></i>
                      {s.k}
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </section>
        <div style={{ background: "#451531", color: "#F8F5F2", overflow: "hidden", marginTop: "0" }}>
          <div data-marquee="" style={{ display: "flex", width: "max-content", padding: "14px 0" }}>
            {v.ticker.map((t, _i3) => (
              <Fragment key={_i3}>
                <span style={{ display: "flex", alignItems: "center", gap: "26px", paddingRight: "26px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-bodoni),serif",
                      fontVariationSettings: "'opsz' 28",
                      fontStyle: "italic",
                      fontSize: "26px",
                      lineHeight: "1",
                    }}
                  >
                    {t}
                  </span>
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#A5BEFA",
                      clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                    }}
                  ></span>
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        <section
          id="s02"
          data-sec="1"
          data-screen-label="02 A anfitriã"
          style={{ position: "relative", padding: "clamp(80px,10vw,150px) clamp(16px,3.5vw,48px)", background: "#F8F5F2" }}
        >
          {v.collage ? (
            <>
              {v.stk.sobre.map((k, _i4) => (
                <Fragment key={_i4}>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: "6",
                      left: k.l,
                      right: k.r,
                      top: k.t,
                      bottom: k.b,
                      width: k.w,
                      transform: `rotate(${k.rot})`,
                      pointerEvents: "none",
                    }}
                  >
                    {k.photo ? (
                      <>
                        <div
                          style={{
                            position: "relative",
                            background: "#FFFDF9",
                            padding: "7px",
                            boxShadow: "0 14px 28px rgba(69,21,49,.24)",
                            pointerEvents: "auto",
                          }}
                        >
                          <div style={{ aspectRatio: k.ar, overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                            <Slot src={k.src} ph={k.ph} />
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-11px",
                              width: "58px",
                              height: "20px",
                              transform: "translateX(-50%) rotate(-5deg)",
                              background: "rgba(255,179,201,.78)",
                            }}
                          ></span>
                          {k.cap ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  right: "0",
                                  bottom: "-34px",
                                  textAlign: "center",
                                  fontFamily: "var(--font-script),cursive",
                                  fontSize: "30px",
                                  lineHeight: "1",
                                  color: k.capC,
                                }}
                              >
                                {k.cap}
                              </span>
                            </>
                          ) : null}
                          {k.heart ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "-16px",
                                  bottom: "-16px",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "11px",
                                  background: "#FF3877",
                                  color: "#FFFDF9",
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 8px 18px rgba(179,9,63,.35)",
                                }}
                              >
                                <i style={{ fontSize: "22px" }} className="ph-fill ph-heart"></i>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {k.like ? (
                      <>
                        <div style={{ position: "relative", height: "110px" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "56px",
                              height: "56px",
                              borderRadius: "14px",
                              background: "#FF3877",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              boxShadow: "0 10px 22px rgba(179,9,63,.35)",
                            }}
                          >
                            <i style={{ fontSize: "30px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "-9px",
                              marginLeft: "18px",
                              width: "0",
                              height: "0",
                              borderLeft: "10px solid transparent",
                              borderRight: "10px solid transparent",
                              borderTop: "11px solid #FF3877",
                            }}
                          ></span>
                          <span
                            style={{
                              position: "absolute",
                              left: "62px",
                              bottom: "46px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "9px",
                              background: "#FFB3C9",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(12deg)",
                            }}
                          >
                            <i style={{ fontSize: "18px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "34px",
                              bottom: "88px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "#FFB3C9",
                              opacity: ".7",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(-14deg)",
                            }}
                          >
                            <i style={{ fontSize: "12px" }} className="ph-fill ph-heart"></i>
                          </span>
                        </div>
                      </>
                    ) : null}
                    {k.ticket ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            background: "#FFFDF9",
                            border: "1.5px solid #451531",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 12px 26px rgba(69,21,49,.22)",
                            color: "#451531",
                          }}
                        >
                          <div
                            style={{
                              background: "#FFB3C9",
                              padding: "12px",
                              display: "grid",
                              placeItems: "center",
                              borderRight: "1.5px dashed #451531",
                            }}
                          >
                            <i style={{ fontSize: "28px" }} className={[k.icon].join(" ")}></i>
                          </div>
                          <div style={{ padding: "8px 14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "600",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "#6B4A5C",
                              }}
                            >
                              {k.kicker}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "22px",
                                lineHeight: "1.1",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {k.label}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </>
          ) : null}
          <div
            style={{
              maxWidth: "1360px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
              gap: "clamp(48px,6vw,110px)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
              <button
                onClick={v.shuffle}
                aria-label="Embaralhar fotos"
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "0",
                  padding: "0",
                  cursor: "pointer",
                  position: "relative",
                  width: "min(calc(100% - 84px),380px)",
                  aspectRatio: "4/5",
                }}
              >
                {v.polaroids.map((p, _i5) => (
                  <Fragment key={_i5}>
                    <div
                      style={{
                        position: "absolute",
                        inset: "0",
                        zIndex: p.z,
                        transform: `translate(${p.x},${p.y}) rotate(${p.r})`,
                        transition: "transform .7s cubic-bezier(.2,.8,.2,1)",
                      }}
                    >
                      <div
                        style={{
                          background: "#FFFDF9",
                          padding: "12px 12px 52px",
                          boxShadow: "0 18px 40px rgba(69,21,49,.16)",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                          <Slot src={p.src} ph={p.ph} />
                        </div>
                        <span
                          style={{
                            position: "absolute",
                            left: "0",
                            right: "0",
                            bottom: "10px",
                            textAlign: "center",
                            fontFamily: "var(--font-script),cursive",
                            fontSize: "34px",
                            lineHeight: "1",
                            color: "#451531",
                          }}
                        >
                          {p.cap}
                        </span>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </button>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#6B4A5C",
                }}
              >
                <i style={{ fontSize: "15px" }} className="ph ph-hand-tap"></i>Toque para embaralhar
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
              <span data-r="" style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase" }}>
                N° 02 · A anfitriã
              </span>
              <h2
                data-r=""
                data-d="80"
                style={{
                  margin: "0",
                  fontFamily: "var(--font-bodoni),serif",
                  fontVariationSettings: "'opsz' 28",
                  fontWeight: "400",
                  fontSize: "clamp(46px,5.6vw,88px)",
                  lineHeight: ".98",
                  letterSpacing: "-.02em",
                  textWrap: "balance",
                }}
              >
                Moda com <em style={{ color: "#B3093F" }}>humor</em>, rotina com <em style={{ color: "#B3093F" }}>estilo</em>.
              </h2>
              <div
                data-r=""
                data-d="160"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  maxWidth: "56ch",
                  fontSize: "17px",
                  lineHeight: "1.65",
                  textWrap: "pretty",
                }}
              >
                <p style={{ margin: "0" }}>
                  <span
                    style={{
                      float: "left",
                      fontFamily: "var(--font-bodoni),serif",
                      fontVariationSettings: "'opsz' 28",
                      fontSize: "76px",
                      lineHeight: ".78",
                      padding: "6px 10px 0 0",
                      color: "#B3093F",
                    }}
                  >
                    S
                  </span>
                  ou criadora de conteúdo e influenciadora digital no TikTok, Instagram e YouTube, onde compartilho minha rotina, lifestyle
                  e experiências reais de forma leve, divertida e autêntica.
                </p>
                <p style={{ margin: "0" }}>
                  Estudante de Moda e apaixonada pelo universo fashion, levo esse tema para os meus conteúdos sempre com muito humor,
                  personalidade e proximidade com a minha comunidade.
                </p>
                <p style={{ margin: "0" }}>
                  Além da moda, meu dia a dia envolve viagens, rotina de casal, wellness e minhas duas cachorrinhas, que já fazem parte da
                  minha identidade nas redes.
                </p>
              </div>
              <div
                data-r=""
                data-d="240"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "10px 14px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                }}
              >
                {v.territories.map((t, _i6) => (
                  <Fragment key={_i6}>
                    <span style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span>{t}</span>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          background: "#FF3877",
                          clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                        }}
                      ></span>
                    </span>
                  </Fragment>
                ))}
              </div>
              <span
                data-r=""
                data-d="300"
                style={{ fontFamily: "var(--font-script),cursive", fontSize: "64px", lineHeight: ".8", color: "#B3093F" }}
              >
                Tais
              </span>
            </div>
          </div>
        </section>

        <section
          id="s03"
          data-sec="2"
          data-screen-label="03 Os números"
          style={{
            position: "relative",
            padding: "clamp(80px,10vw,150px) clamp(16px,3.5vw,48px)",
            background: "#451531",
            color: "#F8F5F2",
            overflow: "hidden",
          }}
        >
          {v.collage ? (
            <>
              {v.stk.num.map((k, _i7) => (
                <Fragment key={_i7}>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: "6",
                      left: k.l,
                      right: k.r,
                      top: k.t,
                      bottom: k.b,
                      width: k.w,
                      transform: `rotate(${k.rot})`,
                      pointerEvents: "none",
                    }}
                  >
                    {k.photo ? (
                      <>
                        <div
                          style={{
                            position: "relative",
                            background: "#FFFDF9",
                            padding: "7px",
                            boxShadow: "0 14px 28px rgba(69,21,49,.24)",
                            pointerEvents: "auto",
                          }}
                        >
                          <div style={{ aspectRatio: k.ar, overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                            <Slot src={k.src} ph={k.ph} />
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-11px",
                              width: "58px",
                              height: "20px",
                              transform: "translateX(-50%) rotate(-5deg)",
                              background: "rgba(255,179,201,.78)",
                            }}
                          ></span>
                          {k.cap ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  right: "0",
                                  bottom: "-34px",
                                  textAlign: "center",
                                  fontFamily: "var(--font-script),cursive",
                                  fontSize: "30px",
                                  lineHeight: "1",
                                  color: k.capC,
                                }}
                              >
                                {k.cap}
                              </span>
                            </>
                          ) : null}
                          {k.heart ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "-16px",
                                  bottom: "-16px",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "11px",
                                  background: "#FF3877",
                                  color: "#FFFDF9",
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 8px 18px rgba(179,9,63,.35)",
                                }}
                              >
                                <i style={{ fontSize: "22px" }} className="ph-fill ph-heart"></i>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {k.like ? (
                      <>
                        <div style={{ position: "relative", height: "110px" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "56px",
                              height: "56px",
                              borderRadius: "14px",
                              background: "#FF3877",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              boxShadow: "0 10px 22px rgba(179,9,63,.35)",
                            }}
                          >
                            <i style={{ fontSize: "30px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "-9px",
                              marginLeft: "18px",
                              width: "0",
                              height: "0",
                              borderLeft: "10px solid transparent",
                              borderRight: "10px solid transparent",
                              borderTop: "11px solid #FF3877",
                            }}
                          ></span>
                          <span
                            style={{
                              position: "absolute",
                              left: "62px",
                              bottom: "46px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "9px",
                              background: "#FFB3C9",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(12deg)",
                            }}
                          >
                            <i style={{ fontSize: "18px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "34px",
                              bottom: "88px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "#FFB3C9",
                              opacity: ".7",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(-14deg)",
                            }}
                          >
                            <i style={{ fontSize: "12px" }} className="ph-fill ph-heart"></i>
                          </span>
                        </div>
                      </>
                    ) : null}
                    {k.ticket ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            background: "#FFFDF9",
                            border: "1.5px solid #451531",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 12px 26px rgba(69,21,49,.22)",
                            color: "#451531",
                          }}
                        >
                          <div
                            style={{
                              background: "#FFB3C9",
                              padding: "12px",
                              display: "grid",
                              placeItems: "center",
                              borderRight: "1.5px dashed #451531",
                            }}
                          >
                            <i style={{ fontSize: "28px" }} className={[k.icon].join(" ")}></i>
                          </div>
                          <div style={{ padding: "8px 14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "600",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "#6B4A5C",
                              }}
                            >
                              {k.kicker}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "22px",
                                lineHeight: "1.1",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {k.label}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </>
          ) : null}
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <span
                  data-r=""
                  style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase", color: "#A5BEFA" }}
                >
                  N° 03 · Os números
                </span>
                <h2
                  data-r=""
                  data-d="80"
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(50px,7vw,116px)",
                    lineHeight: ".92",
                    letterSpacing: "-.02em",
                  }}
                >
                  Números que <em style={{ color: "#A5BEFA" }}>vestem bem</em>
                </h2>
              </div>
              <span
                data-r=""
                data-d="160"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#EFE4EA",
                }}
              >
                <i style={{ fontSize: "15px" }} className="ph ph-cursor-click"></i>Passe o mouse ou toque para ver os insights
              </span>
            </div>
            <div
              className="plat-cards"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
                gap: "clamp(16px,2vw,26px)",
                marginTop: "clamp(36px,5vw,64px)",
              }}
            >
              {v.platforms.map((p, _i8) => (
                <Fragment key={_i8}>
                  <div
                    data-r=""
                    data-d={p.d}
                    onMouseEnter={p.enter}
                    onMouseLeave={p.leave}
                    onClick={p.toggle}
                    style={{ perspective: "1400px", cursor: "pointer", containerType: "inline-size" }}
                  >
                    <div
                      style={{
                        display: "grid",
                        transformStyle: "preserve-3d",
                        transform: `rotateY(${p.rot})`,
                        transition: "transform .8s cubic-bezier(.2,.8,.2,1)",
                      }}
                    >
                      <div
                        style={{
                          gridArea: "1/1",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          border: "1px solid rgba(248,245,242,.35)",
                          borderRadius: "22px",
                          padding: "clamp(20px,2.4vw,30px)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "18px",
                          minHeight: "var(--plat-h,440px)",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: "8px",
                            border: "1px solid rgba(248,245,242,.14)",
                            borderRadius: "16px",
                            pointerEvents: "none",
                          }}
                        ></div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12.5px",
                            fontWeight: "600",
                            letterSpacing: ".12em",
                            textTransform: "uppercase",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <i style={{ fontSize: "20px" }} className={[p.icon].join(" ")}></i>
                            {p.name}
                          </span>
                          <span style={{ color: "#A5BEFA" }}>{p.n}</span>
                        </div>
                        <div style={{ flex: "1", display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-hanken),sans-serif",
                              fontVariantNumeric: "tabular-nums lining-nums",
                              fontWeight: "500",
                              fontSize: "clamp(56px,32cqi,150px)",
                              lineHeight: ".85",
                              letterSpacing: "-.035em",
                            }}
                          >
                            {p.big}
                          </span>
                          <span style={{ fontSize: "20px", fontWeight: "500" }}>{p.unit}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: "10px",
                            borderTop: "1px solid rgba(248,245,242,.3)",
                            paddingTop: "14px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-bodoni),serif",
                              fontVariationSettings: "'opsz' 28",
                              fontSize: "30px",
                              lineHeight: "1",
                            }}
                          >
                            {p.sub}
                          </span>
                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "600",
                              letterSpacing: ".1em",
                              textTransform: "uppercase",
                              color: "#EFE4EA",
                            }}
                          >
                            {p.subk}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          gridArea: "1/1",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                          background: "#DCE5FD",
                          color: "#451531",
                          borderRadius: "22px",
                          padding: "clamp(20px,2.4vw,30px)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          minHeight: "var(--plat-h,440px)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12.5px",
                            fontWeight: "600",
                            letterSpacing: ".12em",
                            textTransform: "uppercase",
                          }}
                        >
                          <span>{p.name} · insights</span>
                          <span style={{ color: "#B3093F" }}>{p.period}</span>
                        </div>
                        <div style={{ flex: "1", display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                          {p.rows.map((r, _i9) => (
                            <Fragment key={_i9}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  padding: "12px 0",
                                  borderTop: "1px solid rgba(69,21,49,.25)",
                                }}
                              >
                                <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                                  {r.k}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-hanken),sans-serif",
                                    fontVariantNumeric: "tabular-nums lining-nums",
                                    fontWeight: "500",
                                    fontSize: "clamp(40px,3.6vw,52px)",
                                    lineHeight: ".95",
                                    letterSpacing: "-.035em",
                                  }}
                                >
                                  {r.v}
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-bodoni),serif",
                            fontVariationSettings: "'opsz' 28",
                            fontStyle: "italic",
                            fontSize: "20px",
                            color: "#B3093F",
                          }}
                        >
                          dados reais
                        </span>
                      </div>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              className="totals"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
                marginTop: "clamp(36px,5vw,64px)",
                borderTop: "1px solid rgba(248,245,242,.35)",
              }}
            >
              {v.totals.map((t, _i10) => (
                <Fragment key={_i10}>
                  <div
                    data-r=""
                    data-d={t.d}
                    style={{ padding: "20px 20px 0 0", display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontSize: "clamp(44px,4.4vw,64px)",
                        lineHeight: "1",
                        color: "#A5BEFA",
                      }}
                    >
                      {t.v}
                    </span>
                    <span style={{ fontSize: "15px", lineHeight: "1.45", maxWidth: "24ch", color: "#EFE4EA" }}>{t.k}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <section
          id="s05"
          data-sec="4"
          data-screen-label="05 Marcas"
          style={{ position: "relative", padding: "clamp(70px,8vw,120px) clamp(16px,3.5vw,48px)", background: "#DCEFF4" }}
        >
          {v.collage ? (
            <>
              {v.stk.marcas.map((k, _i36) => (
                <Fragment key={_i36}>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: "6",
                      left: k.l,
                      right: k.r,
                      top: k.t,
                      bottom: k.b,
                      width: k.w,
                      transform: `rotate(${k.rot})`,
                      pointerEvents: "none",
                    }}
                  >
                    {k.photo ? (
                      <>
                        <div
                          style={{
                            position: "relative",
                            background: "#FFFDF9",
                            padding: "7px",
                            boxShadow: "0 14px 28px rgba(69,21,49,.24)",
                            pointerEvents: "auto",
                          }}
                        >
                          <div style={{ aspectRatio: k.ar, overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                            <Slot src={k.src} ph={k.ph} />
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-11px",
                              width: "58px",
                              height: "20px",
                              transform: "translateX(-50%) rotate(-5deg)",
                              background: "rgba(255,179,201,.78)",
                            }}
                          ></span>
                          {k.cap ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  right: "0",
                                  bottom: "-34px",
                                  textAlign: "center",
                                  fontFamily: "var(--font-script),cursive",
                                  fontSize: "30px",
                                  lineHeight: "1",
                                  color: k.capC,
                                }}
                              >
                                {k.cap}
                              </span>
                            </>
                          ) : null}
                          {k.heart ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "-16px",
                                  bottom: "-16px",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "11px",
                                  background: "#FF3877",
                                  color: "#FFFDF9",
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 8px 18px rgba(179,9,63,.35)",
                                }}
                              >
                                <i style={{ fontSize: "22px" }} className="ph-fill ph-heart"></i>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {k.like ? (
                      <>
                        <div style={{ position: "relative", height: "110px" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "56px",
                              height: "56px",
                              borderRadius: "14px",
                              background: "#FF3877",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              boxShadow: "0 10px 22px rgba(179,9,63,.35)",
                            }}
                          >
                            <i style={{ fontSize: "30px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "-9px",
                              marginLeft: "18px",
                              width: "0",
                              height: "0",
                              borderLeft: "10px solid transparent",
                              borderRight: "10px solid transparent",
                              borderTop: "11px solid #FF3877",
                            }}
                          ></span>
                          <span
                            style={{
                              position: "absolute",
                              left: "62px",
                              bottom: "46px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "9px",
                              background: "#FFB3C9",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(12deg)",
                            }}
                          >
                            <i style={{ fontSize: "18px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "34px",
                              bottom: "88px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "#FFB3C9",
                              opacity: ".7",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(-14deg)",
                            }}
                          >
                            <i style={{ fontSize: "12px" }} className="ph-fill ph-heart"></i>
                          </span>
                        </div>
                      </>
                    ) : null}
                    {k.ticket ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            background: "#FFFDF9",
                            border: "1.5px solid #451531",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 12px 26px rgba(69,21,49,.22)",
                            color: "#451531",
                          }}
                        >
                          <div
                            style={{
                              background: "#FFB3C9",
                              padding: "12px",
                              display: "grid",
                              placeItems: "center",
                              borderRight: "1.5px dashed #451531",
                            }}
                          >
                            <i style={{ fontSize: "28px" }} className={[k.icon].join(" ")}></i>
                          </div>
                          <div style={{ padding: "8px 14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "600",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "#6B4A5C",
                              }}
                            >
                              {k.kicker}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "22px",
                                lineHeight: "1.1",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {k.label}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </>
          ) : null}
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(28px,4vw,48px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 40px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <span data-r="" style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  N° 04 · Lista de convidados
                </span>
                <h2
                  data-r=""
                  data-d="80"
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(46px,6vw,98px)",
                    lineHeight: ".94",
                    letterSpacing: "-.02em",
                  }}
                >
                  Marcas que <em style={{ color: "#B3093F" }}>já passaram</em> por aqui
                </h2>
              </div>
              <span
                data-r=""
                data-d="160"
                style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase", color: "#6B4A5C" }}
              >
                8 marcas · e contando
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(min(40%,140px),1fr))",
                gap: "clamp(24px,3vw,40px) clamp(14px,2vw,28px)",
                justifyItems: "center",
              }}
            >
              {v.logos.map((l, _i37) => (
                <Fragment key={_i37}>
                  <div data-r="" data-d={l.d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "min(100%,150px)",
                        aspectRatio: "1",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#F8F5F2",
                        boxShadow: "0 14px 30px rgba(69,21,49,.14)",
                        transition: "transform .4s cubic-bezier(.2,.8,.2,1)",
                      }}
                      className="hv15"
                    >
                      <img
                        src={l.src}
                        alt={l.t}
                        loading="lazy"
                        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <span
                      style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase", color: "#451531" }}
                    >
                      {l.t}
                    </span>
                  </div>
                </Fragment>
              ))}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={v.goContact}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    width: "min(100%,150px)",
                    aspectRatio: "1",
                    border: "1.5px dashed #B3093F",
                    borderRadius: "50%",
                    background: "transparent",
                    color: "#B3093F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-script),cursive",
                    fontSize: "38px",
                    lineHeight: ".9",
                    transition: "transform .35s cubic-bezier(.2,.8,.2,1),background .3s",
                  }}
                  className="hv16"
                >
                  sua marca aqui
                </button>
                <span
                  style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase", color: "#B3093F" }}
                >
                  Próximo convite
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="s05b"
          data-sec="4"
          data-screen-label="05b Cases"
          style={{ position: "relative", padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)", background: "#F8F5F2" }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(40px,5vw,72px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 40px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <span data-r="" style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  N° 04 · Cases
                </span>
                <h2
                  data-r=""
                  data-d="80"
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(50px,7vw,116px)",
                    lineHeight: ".92",
                    letterSpacing: "-.02em",
                  }}
                >
                  Parcerias <em style={{ color: "#B3093F" }}>que deram</em> o que falar
                </h2>
              </div>
              <div
                data-r=""
                data-d="160"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px", maxWidth: "36ch" }}
              >
                <p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5" }}>
                  Campanhas criadas junto com as marcas, com o jeito leve e bem-humorado da Tais.
                </p>
              </div>
            </div>
            {/* Visualizador de cases: abas por marca + um case por vez, sempre na mesma ordem (mídia, depois informações) */}
            <div data-r="" className="cv">
              <div className="cv-tabs" role="tablist" aria-label="Cases" onKeyDown={v.caseKeys}>
                {v.cases.map((t, i) => (
                  <button
                    key={t.brand}
                    type="button"
                    role="tab"
                    id={"case-tab-" + i}
                    aria-selected={i === v.caseIdx}
                    aria-controls="case-panel"
                    tabIndex={i === v.caseIdx ? 0 : -1}
                    className={i === v.caseIdx ? "cv-tab on" : "cv-tab"}
                    onClick={t.select}
                  >
                    <span className="cv-tab-n">{t.n}</span>
                    <span className="cv-tab-brand">{t.brand}</span>
                    <span className="cv-tab-kpi">
                      <b>{t.res[0].v}</b> {t.res[0].k}
                    </span>
                  </button>
                ))}
              </div>
              {[v.cases[v.caseIdx]].map((c) => (
                <article
                  key={c.brand}
                  id="case-panel"
                  role="tabpanel"
                  aria-labelledby={"case-tab-" + v.caseIdx}
                  className="cv-panel"
                  onTouchStart={v.caseTouchStart}
                  onTouchEnd={v.caseTouchEnd}
                >
                  <div className="cv-media">
                    <div className="cv-photo">
                      <Slot src={c.src} ph={c.ph} />
                    </div>
                    <div className="cv-reel">
                      {/* prévia sem som da publi; clique abre o vídeo completo com som */}
                      <button type="button" className="case-reel" onClick={c.play} aria-label={"Assistir à publi da " + c.brand}>
                        <video
                          data-autoplay=""
                          src={c.preview}
                          poster={c.poster}
                          muted
                          loop
                          playsInline
                          preload="none"
                          aria-hidden="true"
                          tabIndex={-1}
                        />
                        <span className="case-reel-play">
                          <i className="ph-fill ph-play"></i>
                        </span>
                        <span className="case-reel-time">{c.dur}</span>
                      </button>
                    </div>
                    <span className="cv-platform">{c.platform}</span>
                  </div>
                  <div className="cv-info">
                    <div className="cv-type">
                      <span className="cv-n">{c.n}</span>
                      <span>{c.type}</span>
                    </div>
                    <h3>{c.brand}</h3>
                    <p>{c.desc}</p>
                    <div className="cv-res">
                      {c.res.map((r) => (
                        <div key={r.k}>
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>{r.v}</span>
                          <span>{r.k}</span>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="case-watch" onClick={c.play}>
                      <span className="case-watch-icon">
                        <i className="ph-fill ph-play"></i>
                      </span>
                      Assistir à publi <span className="case-watch-dur">{c.dur}</span>
                    </button>
                    <div className="cv-nav">
                      <button type="button" onClick={v.prevCase} aria-label="Case anterior">
                        <i className="ph ph-arrow-left"></i>
                      </button>
                      <span>
                        <b>{c.n}</b> / 0{v.cases.length}
                      </span>
                      <button type="button" onClick={v.nextCase} aria-label="Próximo case">
                        <i className="ph ph-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {/* Atalho para os pacotes sem precisar rolar até o fim da página */}
            {v.showPrices ? (
              <div data-r="" className="pkg-cta">
                <div className="pkg-cta-text">
                  <span className="pkg-cta-kicker">Gostou dos resultados?</span>
                  <h3>
                    Conheça os <em>pacotes</em> e modelos de parceria
                  </h3>
                </div>
                <button ref={v.pkgTriggerRef} className="pkg-cta-btn" onClick={v.openPkg} aria-haspopup="dialog" aria-controls="pacotes">
                  Ver pacotes e formatos <i className="ph ph-arrow-up-right"></i>
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section
          id="s03-ig"
          data-sec="2"
          data-screen-label="03b Instagram"
          style={{
            position: "relative",
            padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)",
            background: "#DCE5FD",
            color: "#451531",
            overflow: "hidden",
          }}
        >
          {v.collage ? (
            <>
              {v.stk.ig.map((k, _i11) => (
                <Fragment key={_i11}>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: "6",
                      left: k.l,
                      right: k.r,
                      top: k.t,
                      bottom: k.b,
                      width: k.w,
                      transform: `rotate(${k.rot})`,
                      pointerEvents: "none",
                    }}
                  >
                    {k.photo ? (
                      <>
                        <div
                          style={{
                            position: "relative",
                            background: "#FFFDF9",
                            padding: "7px",
                            boxShadow: "0 14px 28px rgba(69,21,49,.24)",
                            pointerEvents: "auto",
                          }}
                        >
                          <div style={{ aspectRatio: k.ar, overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                            <Slot src={k.src} ph={k.ph} />
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-11px",
                              width: "58px",
                              height: "20px",
                              transform: "translateX(-50%) rotate(-5deg)",
                              background: "rgba(255,179,201,.78)",
                            }}
                          ></span>
                          {k.cap ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  right: "0",
                                  bottom: "-34px",
                                  textAlign: "center",
                                  fontFamily: "var(--font-script),cursive",
                                  fontSize: "30px",
                                  lineHeight: "1",
                                  color: k.capC,
                                }}
                              >
                                {k.cap}
                              </span>
                            </>
                          ) : null}
                          {k.heart ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "-16px",
                                  bottom: "-16px",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "11px",
                                  background: "#FF3877",
                                  color: "#FFFDF9",
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 8px 18px rgba(179,9,63,.35)",
                                }}
                              >
                                <i style={{ fontSize: "22px" }} className="ph-fill ph-heart"></i>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {k.like ? (
                      <>
                        <div style={{ position: "relative", height: "110px" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "56px",
                              height: "56px",
                              borderRadius: "14px",
                              background: "#FF3877",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              boxShadow: "0 10px 22px rgba(179,9,63,.35)",
                            }}
                          >
                            <i style={{ fontSize: "30px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "-9px",
                              marginLeft: "18px",
                              width: "0",
                              height: "0",
                              borderLeft: "10px solid transparent",
                              borderRight: "10px solid transparent",
                              borderTop: "11px solid #FF3877",
                            }}
                          ></span>
                          <span
                            style={{
                              position: "absolute",
                              left: "62px",
                              bottom: "46px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "9px",
                              background: "#FFB3C9",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(12deg)",
                            }}
                          >
                            <i style={{ fontSize: "18px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "34px",
                              bottom: "88px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "#FFB3C9",
                              opacity: ".7",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(-14deg)",
                            }}
                          >
                            <i style={{ fontSize: "12px" }} className="ph-fill ph-heart"></i>
                          </span>
                        </div>
                      </>
                    ) : null}
                    {k.ticket ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            background: "#FFFDF9",
                            border: "1.5px solid #451531",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 12px 26px rgba(69,21,49,.22)",
                            color: "#451531",
                          }}
                        >
                          <div
                            style={{
                              background: "#FFB3C9",
                              padding: "12px",
                              display: "grid",
                              placeItems: "center",
                              borderRight: "1.5px dashed #451531",
                            }}
                          >
                            <i style={{ fontSize: "28px" }} className={[k.icon].join(" ")}></i>
                          </div>
                          <div style={{ padding: "8px 14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "600",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "#6B4A5C",
                              }}
                            >
                              {k.kicker}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "22px",
                                lineHeight: "1.1",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {k.label}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </>
          ) : null}
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(40px,5vw,72px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px,2.6vw,32px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  borderTop: "1px solid #451531",
                  paddingTop: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                <span>N° 05 · Os números · A / Instagram</span>
                <span style={{ color: "#B3093F" }}>Últimos 30 dias</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
                <h2
                  data-r=""
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(54px,8vw,132px)",
                    lineHeight: ".9",
                    letterSpacing: "-.02em",
                  }}
                >
                  O <em style={{ color: "#B3093F" }}>Instagram</em> da Tais
                </h2>
                <div
                  data-r=""
                  data-d="100"
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px", maxWidth: "38ch" }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1.5px solid #451531",
                      borderRadius: "999px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: "#F8F5F2",
                      whiteSpace: "nowrap",
                      lineHeight: "1.2",
                    }}
                  >
                    <i style={{ fontSize: "20px" }} className="ph ph-instagram-logo"></i>@taisdonnaruma
                  </span>
                  <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", textWrap: "pretty" }}>
                    A vitrine da moda: looks, recebidos e bastidores que chegam muito além de quem já segue.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="kpi-grid"
              data-r=""
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
                borderTop: "1.5px solid #451531",
                borderLeft: "1.5px solid #451531",
                background: "#F8F5F2",
              }}
            >
              {v.igKpis.map((k, _i12) => (
                <Fragment key={_i12}>
                  <div
                    style={{
                      borderRight: "1.5px solid #451531",
                      borderBottom: "1.5px solid #451531",
                      containerType: "inline-size",
                      padding: "20px 22px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      transition: "background .3s",
                    }}
                    className="hv4"
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                        <i style={{ fontSize: "16px", color: "#B3093F" }} className={[k.icon].join(" ")}></i>
                        {k.k}
                      </span>
                      <span style={{ fontSize: "10.5px", color: k.tagC }}>{k.tag}</span>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontWeight: "500",
                        fontSize: "min(clamp(52px,5vw,76px),25cqi)",
                        lineHeight: ".9",
                        letterSpacing: "-.035em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {k.v}
                    </span>
                    <span style={{ fontSize: "14.5px", color: "#6B4A5C", marginTop: "auto" }}>{k.note}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
                gap: "clamp(24px,3vw,44px)",
                alignItems: "stretch",
              }}
            >
              <div
                data-r=""
                style={{
                  border: "1.5px solid #451531",
                  borderRadius: "10px",
                  background: "#F8F5F2",
                  boxShadow: "7px 7px 0 #B3093F",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#B3093F",
                    color: "#F8F5F2",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i style={{ fontSize: "16px" }} className="ph ph-eye"></i>quem vê os conteúdos
                  </span>
                  <span>4.763.894 views</span>
                </div>
                <div
                  style={{
                    flex: "1",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "clamp(20px,3vw,40px)",
                    padding: "clamp(20px,3vw,36px)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "clamp(180px,18vw,240px)",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      background: "conic-gradient(#FF3877 0 10%,#451531 10% 100%)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "72%",
                        aspectRatio: "1",
                        borderRadius: "50%",
                        background: "#F8F5F2",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontWeight: "500",
                          fontSize: "clamp(40px,3.6vw,54px)",
                          lineHeight: "1",
                          letterSpacing: "-.035em",
                        }}
                      >
                        90%
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#6B4A5C",
                        }}
                      >
                        não seguidores
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "26ch" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: "600" }}>
                      <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#451531" }}></span>Não seguidores ·
                      90%
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: "600" }}>
                      <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#FF3877" }}></span>Seguidores · 10%
                    </span>
                    <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#6B4A5C", textWrap: "pretty" }}>
                      A cada 10 pessoas que veem um post, 9 ainda não seguem a Tais: alcance real para novas audiências.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    borderTop: "1px dashed rgba(69,21,49,.4)",
                    padding: "10px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>1.401.513 espectadores únicos</span>
                  <span style={{ color: "#B3093F" }}>Dado real · 30 dias</span>
                </div>
              </div>
              <div
                data-r=""
                data-d="120"
                style={{
                  border: "1.5px solid #451531",
                  borderRadius: "10px",
                  background: "#F8F5F2",
                  boxShadow: "7px 7px 0 #451531",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#451531",
                    color: "#F8F5F2",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i style={{ fontSize: "16px" }} className="ph ph-users-three"></i>quem acompanha
                  </span>
                  <span>audiência Instagram</span>
                </div>
                <div style={{ padding: "clamp(16px,2.2vw,26px)", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span>Elas acompanham a Tais</span>
                      <span style={{ color: "#B3093F" }}>42,4% do público</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: "6px 16px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontVariantNumeric: "tabular-nums lining-nums",
                          fontWeight: "500",
                          fontSize: "clamp(64px,6vw,92px)",
                          lineHeight: ".85",
                          letterSpacing: "-.035em",
                          color: "#B3093F",
                        }}
                      >
                        109K
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni),serif",
                          fontVariationSettings: "'opsz' 28",
                          fontStyle: "italic",
                          fontSize: "clamp(22px,2vw,28px)",
                          lineHeight: "1.1",
                          paddingBottom: "4px",
                        }}
                      >
                        mulheres no Instagram
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px 14px",
                        background: "#FFE3EB",
                        border: "1.5px solid #451531",
                        borderRadius: "999px",
                        padding: "10px 16px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600" }}>
                        <i style={{ fontSize: "16px", color: "#B3093F" }} className="ph ph-eye"></i>Mulheres alcançadas em 30 dias
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: "600",
                            fontSize: "24px",
                            color: "#B3093F",
                          }}
                        >
                          594K
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>espectadoras</span>
                      </span>
                    </div>
                    <span style={{ fontSize: "12.5px", color: "#6B4A5C", lineHeight: "1.4" }}>
                      Estimativa: 42,4% dos 258K seguidores e dos 1,4M espectadores únicos do mês.
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                      Faixa etária
                    </span>
                    {v.igAge.map((a, _i13) => (
                      <Fragment key={_i13}>
                        <div style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr) 54px", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "600" }}>{a.k}</span>
                          <div style={{ height: "12px", borderRadius: "999px", background: "rgba(69,21,49,.1)" }}>
                            <div style={{ height: "100%", width: a.w, borderRadius: "999px", background: a.c }}></div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "600", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {a.v}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <span
                    style={{ fontSize: "12px", fontWeight: "600", letterSpacing: ".08em", textTransform: "uppercase", color: "#B3093F" }}
                  >
                    Dados reais · últimos 30 dias
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
                gap: "clamp(24px,3vw,44px)",
                alignItems: "start",
              }}
            >
              <div data-r="" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    paddingBottom: "8px",
                  }}
                >
                  <span>Visualizações por formato · 30 dias</span>
                  <span style={{ color: "#B3093F" }}>Dado real</span>
                </span>
                {v.igFormats.map((f, _i14) => (
                  <Fragment key={_i14}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px minmax(0,1fr) auto",
                        alignItems: "center",
                        gap: "14px",
                        padding: "16px 0",
                        borderTop: "1px solid #451531",
                      }}
                    >
                      <i style={{ fontSize: "26px", color: "#B3093F" }} className={[f.icon].join(" ")}></i>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-bodoni),serif",
                            fontVariationSettings: "'opsz' 28",
                            fontSize: "clamp(24px,2.2vw,32px)",
                            lineHeight: "1",
                          }}
                        >
                          {f.t}
                        </span>
                        <div style={{ height: "6px", borderRadius: "999px", background: "rgba(69,21,49,.12)" }}>
                          <div style={{ height: "100%", width: f.w, borderRadius: "999px", background: "#FF3877" }}></div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: "500",
                            fontSize: "clamp(26px,2.4vw,34px)",
                            lineHeight: "1",
                            letterSpacing: "-.03em",
                          }}
                        >
                          {f.v}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "#6B4A5C",
                          }}
                        >
                          {f.unit}
                        </span>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div data-r="" data-d="120" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Posts em destaque</span>
                  <span style={{ color: "#B3093F" }}>Demonstrativo</span>
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "clamp(10px,1.4vw,18px)" }}>
                  {v.igTop.map((t, _i15) => (
                    <Fragment key={_i15}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          transition: "transform .35s cubic-bezier(.2,.8,.2,1)",
                        }}
                        className="hv5"
                      >
                        <div
                          style={{
                            position: "relative",
                            aspectRatio: "4/5",
                            borderRadius: "14px",
                            overflow: "hidden",
                            border: "1.5px solid #451531",
                            background: "#F8F5F2",
                            color: "#451531",
                          }}
                        >
                          <Slot src={t.src} ph={"Capa do post"} />
                          <span
                            style={{
                              position: "absolute",
                              left: "8px",
                              top: "8px",
                              pointerEvents: "none",
                              background: "#F8F5F2",
                              color: "#451531",
                              borderRadius: "999px",
                              padding: "4px 10px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              letterSpacing: ".06em",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                              lineHeight: "1.2",
                            }}
                          >
                            {t.fmt}
                          </span>
                        </div>
                        <span style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-hanken),sans-serif",
                              fontVariantNumeric: "tabular-nums",
                              fontSize: "24px",
                              fontWeight: "600",
                            }}
                          >
                            {t.views}
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              letterSpacing: ".08em",
                              textTransform: "uppercase",
                              color: "#6B4A5C",
                            }}
                          >
                            views
                          </span>
                        </span>
                        <span style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#6B4A5C" }}>
                          <span>
                            <i className="ph ph-heart"></i> {t.likes}
                          </span>
                          <span>
                            <i className="ph ph-bookmark-simple"></i> {t.saves}
                          </span>
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="s03-ig-st"
          data-sec="2"
          data-screen-label="03c Instagram · Stories"
          style={{
            position: "relative",
            padding: "clamp(70px,9vw,120px) clamp(16px,3.5vw,48px)",
            background: "#451531",
            color: "#F8F5F2",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(90px,11vw,150px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px,3.6vw,48px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  borderTop: "1px solid rgba(248,245,242,.45)",
                  paddingTop: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                <span>N° 05 · Os números · A / Instagram · Stories diários</span>
                <span style={{ color: "#A5BEFA" }}>Views reais · 30 dias · divisão diária demonstrativa</span>
              </div>
              <h3
                data-r=""
                style={{
                  margin: "0",
                  fontFamily: "var(--font-bodoni),serif",
                  fontVariationSettings: "'opsz' 28",
                  fontWeight: "400",
                  fontSize: "clamp(48px,7vw,116px)",
                  lineHeight: ".92",
                  letterSpacing: "-.01em",
                }}
              >
                ALCANCE DOS <em style={{ color: "#A5BEFA", textTransform: "none" }}>stories</em>
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
                  gap: "clamp(28px,4vw,60px)",
                  alignItems: "stretch",
                }}
              >
                <div data-r="" style={{ display: "flex", gap: "clamp(18px,2.4vw,32px)", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div
                    style={{
                      position: "relative",
                      width: "clamp(150px,13vw,190px)",
                      flex: "none",
                      aspectRatio: "9/16",
                      borderRadius: "18px",
                      overflow: "hidden",
                      background: "#A5BEFA",
                      color: "#451531",
                      boxShadow: "6px 6px 0 #FF3877",
                    }}
                  >
                    <Slot src={"/assets/fotos/f05.webp"} ph={"Foto do story"} />
                    <div
                      style={{
                        position: "absolute",
                        left: "8px",
                        right: "8px",
                        top: "8px",
                        display: "flex",
                        gap: "3px",
                        pointerEvents: "none",
                      }}
                    >
                      <span style={{ flex: "1", height: "2px", background: "#F8F5F2" }}></span>
                      <span style={{ flex: "1", height: "2px", background: "#F8F5F2" }}></span>
                      <span style={{ flex: "1", height: "2px", background: "rgba(248,245,242,.45)" }}></span>
                      <span style={{ flex: "1", height: "2px", background: "rgba(248,245,242,.45)" }}></span>
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        left: "8px",
                        top: "16px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        color: "#F8F5F2",
                        textShadow: "0 1px 4px rgba(0,0,0,.4)",
                      }}
                    >
                      <span
                        style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#451531", border: "1.5px solid #F8F5F2" }}
                      ></span>
                      taisdonnaruma
                    </span>
                  </div>
                  <div style={{ flex: "1", minWidth: "200px", display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Views em stories · 30 dias{" "}
                      <span
                        style={{
                          background: "#FF3877",
                          color: "#F8F5F2",
                          borderRadius: "4px",
                          padding: "3px 7px",
                          fontSize: "10.5px",
                          transform: "rotate(-3deg)",
                        }}
                      >
                        Dado real
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontSize: "clamp(84px,8.4vw,136px)",
                        lineHeight: ".95",
                        letterSpacing: "-.035em",
                        padding: "6px 0 14px",
                      }}
                    >
                      932K
                    </span>
                    {v.stStats.map((x, _i16) => (
                      <Fragment key={_i16}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: "12px",
                            padding: "12px 0",
                            borderTop: "1px solid rgba(248,245,242,.3)",
                          }}
                        >
                          <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                            {x.k}
                          </span>
                          <span style={{ fontSize: "clamp(22px,2vw,28px)", fontWeight: "600", lineHeight: "1" }}>{x.v}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div
                  data-r=""
                  data-d="120"
                  style={{
                    border: "1.5px solid #F8F5F2",
                    borderRadius: "10px",
                    background: "rgba(248,245,242,.04)",
                    boxShadow: "7px 7px 0 #A5BEFA",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#FFB3C9",
                      color: "#451531",
                      padding: "8px 12px",
                      borderRadius: "9px 9px 0 0",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i style={{ fontSize: "16px" }} className="ph ph-circle-dashed"></i>stories · alcance por dia
                    </span>
                    <span style={{ display: "flex", gap: "4px" }}>
                      <span style={{ width: "10px", height: "10px", border: "1.5px solid #451531", borderRadius: "2px" }}></span>
                      <span style={{ width: "10px", height: "10px", border: "1.5px solid #451531", borderRadius: "2px" }}></span>
                      <span style={{ width: "10px", height: "10px", background: "#451531", borderRadius: "2px" }}></span>
                    </span>
                  </div>
                  <div
                    style={{
                      flex: "1",
                      display: "grid",
                      gridTemplateColumns: "repeat(7,minmax(0,1fr))",
                      gap: "clamp(6px,1vw,14px)",
                      alignItems: "end",
                      padding: "22px clamp(12px,2vw,22px) 12px",
                      minHeight: "280px",
                    }}
                  >
                    {v.stDays.map((d, _i17) => (
                      <Fragment key={_i17}>
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "clamp(12px,1.1vw,15px)", fontWeight: "600", color: d.ink }}>{d.v}</span>
                          <div
                            style={{
                              width: "100%",
                              height: d.h,
                              borderRadius: "8px",
                              background: d.c,
                              transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
                            }}
                            className="hv6"
                          ></div>
                          <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: ".06em", textTransform: "uppercase" }}>
                            {d.d}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      borderTop: "1px dashed rgba(248,245,242,.4)",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>Contas únicas alcançadas / dia</span>
                    <span style={{ color: "#FF8FB0" }}>Pico: sex · 38K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="s03-tt"
          data-sec="2"
          data-screen-label="03d TikTok"
          style={{
            position: "relative",
            padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)",
            background: "#F8F5F2",
            color: "#451531",
            overflow: "hidden",
          }}
        >
          {v.collage ? (
            <>
              {v.stk.tt.map((k, _i18) => (
                <Fragment key={_i18}>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: "6",
                      left: k.l,
                      right: k.r,
                      top: k.t,
                      bottom: k.b,
                      width: k.w,
                      transform: `rotate(${k.rot})`,
                      pointerEvents: "none",
                    }}
                  >
                    {k.photo ? (
                      <>
                        <div
                          style={{
                            position: "relative",
                            background: "#FFFDF9",
                            padding: "7px",
                            boxShadow: "0 14px 28px rgba(69,21,49,.24)",
                            pointerEvents: "auto",
                          }}
                        >
                          <div style={{ aspectRatio: k.ar, overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                            <Slot src={k.src} ph={k.ph} />
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-11px",
                              width: "58px",
                              height: "20px",
                              transform: "translateX(-50%) rotate(-5deg)",
                              background: "rgba(255,179,201,.78)",
                            }}
                          ></span>
                          {k.cap ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  right: "0",
                                  bottom: "-34px",
                                  textAlign: "center",
                                  fontFamily: "var(--font-script),cursive",
                                  fontSize: "30px",
                                  lineHeight: "1",
                                  color: k.capC,
                                }}
                              >
                                {k.cap}
                              </span>
                            </>
                          ) : null}
                          {k.heart ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "-16px",
                                  bottom: "-16px",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "11px",
                                  background: "#FF3877",
                                  color: "#FFFDF9",
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 8px 18px rgba(179,9,63,.35)",
                                }}
                              >
                                <i style={{ fontSize: "22px" }} className="ph-fill ph-heart"></i>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {k.like ? (
                      <>
                        <div style={{ position: "relative", height: "110px" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "56px",
                              height: "56px",
                              borderRadius: "14px",
                              background: "#FF3877",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              boxShadow: "0 10px 22px rgba(179,9,63,.35)",
                            }}
                          >
                            <i style={{ fontSize: "30px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "-9px",
                              marginLeft: "18px",
                              width: "0",
                              height: "0",
                              borderLeft: "10px solid transparent",
                              borderRight: "10px solid transparent",
                              borderTop: "11px solid #FF3877",
                            }}
                          ></span>
                          <span
                            style={{
                              position: "absolute",
                              left: "62px",
                              bottom: "46px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "9px",
                              background: "#FFB3C9",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(12deg)",
                            }}
                          >
                            <i style={{ fontSize: "18px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "34px",
                              bottom: "88px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "#FFB3C9",
                              opacity: ".7",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(-14deg)",
                            }}
                          >
                            <i style={{ fontSize: "12px" }} className="ph-fill ph-heart"></i>
                          </span>
                        </div>
                      </>
                    ) : null}
                    {k.ticket ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            background: "#FFFDF9",
                            border: "1.5px solid #451531",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 12px 26px rgba(69,21,49,.22)",
                            color: "#451531",
                          }}
                        >
                          <div
                            style={{
                              background: "#FFB3C9",
                              padding: "12px",
                              display: "grid",
                              placeItems: "center",
                              borderRight: "1.5px dashed #451531",
                            }}
                          >
                            <i style={{ fontSize: "28px" }} className={[k.icon].join(" ")}></i>
                          </div>
                          <div style={{ padding: "8px 14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "600",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "#6B4A5C",
                              }}
                            >
                              {k.kicker}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "22px",
                                lineHeight: "1.1",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {k.label}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </>
          ) : null}
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(40px,5vw,72px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px,2.6vw,32px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  borderTop: "1px solid #451531",
                  paddingTop: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                <span>N° 05 · Os números · B / TikTok</span>
                <span style={{ color: "#B3093F" }}>Dados provisórios · últimos 90 dias</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
                <h2
                  data-r=""
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(54px,8vw,132px)",
                    lineHeight: ".9",
                    letterSpacing: "-.02em",
                  }}
                >
                  O <em style={{ color: "#B3093F" }}>TikTok</em> da Tais
                </h2>
                <div
                  data-r=""
                  data-d="100"
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px", maxWidth: "38ch" }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1.5px solid #451531",
                      borderRadius: "999px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      lineHeight: "1.2",
                    }}
                  >
                    <i style={{ fontSize: "20px" }} className="ph ph-tiktok-logo"></i>@taisdonnaruma
                  </span>
                  <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", textWrap: "pretty" }}>
                    Onde o humor ganha escala: provadores, rotinas e trends de moda com alcance muito além dos seguidores.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="kpi-grid"
              data-r=""
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
                borderTop: "1.5px solid #451531",
                borderLeft: "1.5px solid #451531",
              }}
            >
              {v.tdKpis.map((k, _i19) => (
                <Fragment key={_i19}>
                  <div
                    style={{
                      borderRight: "1.5px solid #451531",
                      borderBottom: "1.5px solid #451531",
                      containerType: "inline-size",
                      padding: "20px 22px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      transition: "background .3s",
                    }}
                    className="hv7"
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <i style={{ fontSize: "16px", color: "#B3093F" }} className={[k.icon].join(" ")}></i>
                      {k.k}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontWeight: "500",
                        fontSize: "min(clamp(52px,5vw,76px),25cqi)",
                        lineHeight: ".9",
                        letterSpacing: "-.035em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {k.v}
                    </span>
                    <span style={{ fontSize: "14.5px", color: "#6B4A5C", marginTop: "auto" }}>{k.note}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
                gap: "clamp(24px,3vw,44px)",
                alignItems: "stretch",
              }}
            >
              <div
                data-r=""
                style={{
                  border: "1.5px solid #451531",
                  borderRadius: "10px",
                  background: "#FCFAF8",
                  boxShadow: "7px 7px 0 #64B7CC",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#64B7CC",
                    color: "#451531",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i style={{ fontSize: "16px" }} className="ph ph-chart-bar"></i>visualizações por dia · 27/10 a 02/11
                  </span>
                  <span>267K · +6%</span>
                </div>
                <div
                  style={{
                    flex: "1",
                    display: "grid",
                    gridTemplateColumns: "repeat(7,minmax(0,1fr))",
                    gap: "clamp(6px,1vw,14px)",
                    alignItems: "end",
                    padding: "24px clamp(14px,2vw,24px) 12px",
                    minHeight: "280px",
                  }}
                >
                  {v.tdGrowth.map((g, _i20) => (
                    <Fragment key={_i20}>
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{g.v}</span>
                        <div
                          style={{
                            width: "100%",
                            height: g.h,
                            borderRadius: "999px 999px 8px 8px",
                            background: g.c,
                            transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
                          }}
                          className="hv8"
                        ></div>
                        <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: ".06em", textTransform: "uppercase" }}>
                          {g.m}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    borderTop: "1px dashed rgba(69,21,49,.4)",
                    padding: "10px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Views de publicação por dia</span>
                  <span style={{ color: "#B3093F" }}>Dado real · aprox. do gráfico</span>
                </div>
              </div>
              <div
                data-r=""
                data-d="120"
                style={{
                  border: "1.5px solid #451531",
                  borderRadius: "10px",
                  background: "#FCFAF8",
                  boxShadow: "7px 7px 0 #FFB3C9",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#FFB3C9",
                    color: "#451531",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i style={{ fontSize: "16px" }} className="ph ph-users-three"></i>quem assiste
                  </span>
                  <span>audiência TikTok</span>
                </div>
                <div style={{ padding: "clamp(16px,2.2vw,26px)", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span>Elas seguem a Tais</span>
                      <span style={{ color: "#B3093F" }}>37% dos 412K</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: "6px 16px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontVariantNumeric: "tabular-nums lining-nums",
                          fontWeight: "500",
                          fontSize: "clamp(64px,6vw,92px)",
                          lineHeight: ".85",
                          letterSpacing: "-.035em",
                          color: "#B3093F",
                        }}
                      >
                        153K
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni),serif",
                          fontVariationSettings: "'opsz' 28",
                          fontStyle: "italic",
                          fontSize: "clamp(22px,2vw,28px)",
                          lineHeight: "1.1",
                          paddingBottom: "4px",
                        }}
                      >
                        mulheres no TikTok
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px 14px",
                        background: "#FFE3EB",
                        border: "1.5px solid #451531",
                        borderRadius: "999px",
                        padding: "10px 16px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600" }}>
                        <i style={{ fontSize: "16px", color: "#B3093F" }} className="ph ph-sparkle"></i>Somando as 3 plataformas
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: "600",
                            fontSize: "24px",
                            color: "#B3093F",
                          }}
                        >
                          +339K
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>seguidoras</span>
                      </span>
                    </div>
                    <span style={{ fontSize: "12.5px", color: "#6B4A5C", lineHeight: "1.4" }}>
                      Instagram ≈ 109K · TikTok ≈ 153K · YouTube ≈ 77K. Estimativa pela % feminina de cada plataforma.
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                      Faixa etária
                    </span>
                    {v.tdAge.map((a, _i21) => (
                      <Fragment key={_i21}>
                        <div style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr) 44px", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "600" }}>{a.k}</span>
                          <div style={{ height: "12px", borderRadius: "999px", background: "rgba(69,21,49,.1)" }}>
                            <div style={{ height: "100%", width: a.w, borderRadius: "999px", background: a.c }}></div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "600", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {a.v}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                      Principais países
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {v.tdCities.map((c, _i22) => (
                        <Fragment key={_i22}>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "8px",
                              border: "1px solid #451531",
                              borderRadius: "999px",
                              padding: "6px 14px",
                              fontSize: "14px",
                              fontWeight: "500",
                              whiteSpace: "nowrap",
                              lineHeight: "1.2",
                            }}
                          >
                            {c.k}
                            <span style={{ fontWeight: "700", color: "#B3093F" }}>{c.v}</span>
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
                gap: "clamp(24px,3vw,44px)",
                alignItems: "start",
              }}
            >
              <div data-r="" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase", paddingBottom: "8px" }}
                >
                  Formatos que mais performam
                </span>
                {v.tdFormats.map((f, _i23) => (
                  <Fragment key={_i23}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px minmax(0,1fr) auto",
                        alignItems: "center",
                        gap: "14px",
                        padding: "16px 0",
                        borderTop: "1px solid #451531",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni),serif",
                          fontVariationSettings: "'opsz' 28",
                          fontStyle: "italic",
                          fontSize: "24px",
                          color: "#B3093F",
                        }}
                      >
                        {f.n}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-bodoni),serif",
                            fontVariationSettings: "'opsz' 28",
                            fontSize: "clamp(24px,2.2vw,32px)",
                            lineHeight: "1",
                          }}
                        >
                          {f.t}
                        </span>
                        <div style={{ height: "6px", borderRadius: "999px", background: "rgba(69,21,49,.1)" }}>
                          <div style={{ height: "100%", width: f.w, borderRadius: "999px", background: "#64B7CC" }}></div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: "500",
                            fontSize: "clamp(26px,2.4vw,34px)",
                            lineHeight: "1",
                            letterSpacing: "-.03em",
                          }}
                        >
                          {f.v}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: "#6B4A5C",
                          }}
                        >
                          views médias
                        </span>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section
          id="s03-tt-v"
          data-sec="2"
          data-screen-label="03e TikTok · Views"
          style={{
            position: "relative",
            padding: "clamp(70px,9vw,120px) clamp(16px,3.5vw,48px)",
            background: "#451531",
            color: "#F8F5F2",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(90px,11vw,150px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px,3.6vw,48px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  borderTop: "1px solid rgba(248,245,242,.45)",
                  paddingTop: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                <span>N° 05 · Os números · B / TikTok · Curtidas e views</span>
                <span style={{ color: "#64B7CC" }}>Curtidas e views · últimos 28 dias</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
                <h3
                  data-r=""
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(48px,7vw,116px)",
                    lineHeight: ".92",
                  }}
                >
                  NO <em style={{ color: "#64B7CC" }}>TikTok</em>
                </h3>
                <div data-r="" data-d="100" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "10px 14px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-hanken),sans-serif",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      fontSize: "clamp(68px,8.4vw,136px)",
                      lineHeight: ".85",
                      letterSpacing: "-.035em",
                    }}
                  >
                    412K
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBottom: "6px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-bodoni),serif",
                        fontVariationSettings: "'opsz' 28",
                        fontStyle: "italic",
                        fontSize: "26px",
                        lineHeight: "1",
                      }}
                    >
                      seguidores
                    </span>
                    <span
                      style={{
                        border: "1px solid #F8F5F2",
                        borderRadius: "4px",
                        padding: "3px 7px",
                        fontSize: "10.5px",
                        fontWeight: "600",
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                      }}
                    >
                      + de 20M curtidas
                    </span>
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
                  gap: "clamp(24px,3vw,44px)",
                  alignItems: "stretch",
                }}
              >
                <div
                  data-r=""
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                    borderTop: "1.5px solid rgba(248,245,242,.6)",
                    borderLeft: "1.5px solid rgba(248,245,242,.6)",
                  }}
                >
                  {v.ttGrid.map((k, _i24) => (
                    <Fragment key={_i24}>
                      <div
                        style={{
                          borderRight: "1.5px solid rgba(248,245,242,.6)",
                          borderBottom: "1.5px solid rgba(248,245,242,.6)",
                          containerType: "inline-size",
                          padding: "18px 16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          transition: "background .3s",
                        }}
                        className="hv9"
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12.5px",
                            fontWeight: "600",
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                          }}
                        >
                          <i style={{ fontSize: "16px" }} className={[k.icon].join(" ")}></i>
                          {k.k}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontVariantNumeric: "tabular-nums lining-nums",
                            fontSize: "min(clamp(52px,5vw,80px),25cqi)",
                            lineHeight: ".9",
                          }}
                        >
                          {k.v}
                        </span>
                        <span style={{ fontSize: "15px", color: "#E9DDE5" }}>{k.note}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div
                  data-r=""
                  data-d="120"
                  style={{
                    border: "1.5px solid #F8F5F2",
                    borderRadius: "10px",
                    background: "rgba(248,245,242,.04)",
                    boxShadow: "7px 7px 0 #64B7CC",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#64B7CC",
                      color: "#451531",
                      padding: "8px 12px",
                      borderRadius: "9px 9px 0 0",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i style={{ fontSize: "16px" }} className="ph ph-tiktok-logo"></i>tiktok · semana vs. semana anterior
                    </span>
                    <span>27/10 a 02/11</span>
                  </div>
                  <div style={{ flex: "1", padding: "clamp(16px,2.2vw,26px)", display: "flex", flexDirection: "column", gap: "18px" }}>
                    {v.ttGrow.map((g, _i25) => (
                      <Fragment key={_i25}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600" }}>
                              <i style={{ fontSize: "16px", color: "#64B7CC" }} className={[g.icon].join(" ")}></i>
                              {g.k} <span style={{ color: "#E9DDE5", fontWeight: "500" }}>· {g.v}</span>
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-hanken),sans-serif",
                                fontVariantNumeric: "tabular-nums",
                                fontWeight: "600",
                                fontSize: "clamp(24px,2.2vw,32px)",
                                lineHeight: "1",
                                color: g.c,
                              }}
                            >
                              {g.d}
                            </span>
                          </div>
                          <div style={{ height: "10px", borderRadius: "999px", background: "rgba(248,245,242,.12)" }}>
                            <div style={{ height: "100%", width: g.w, borderRadius: "999px", background: g.c }}></div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px 18px",
                      borderTop: "1px dashed rgba(248,245,242,.4)",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>Crescimento em 7 dias</span>
                    <span style={{ marginLeft: "auto", color: "#FF8FB0" }}>Dado real</span>
                  </div>
                </div>
              </div>
              <div data-r="" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Vídeos em destaque
                </span>
                <div
                  className="tt-vids"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(46%,160px),1fr))",
                    gap: "clamp(10px,1.4vw,18px)",
                  }}
                >
                  {v.ttVids.map((v, _i26) => (
                    <Fragment key={_i26}>
                      <div
                        style={{
                          position: "relative",
                          aspectRatio: "9/16",
                          borderRadius: "14px",
                          overflow: "hidden",
                          border: "1.5px solid rgba(248,245,242,.7)",
                          background: v.bg,
                          color: "#451531",
                          transition: "transform .35s cubic-bezier(.2,.8,.2,1)",
                        }}
                        className="hv10"
                      >
                        <Slot src={v.src} ph={"Capa do vídeo"} />
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="s03-yt"
          data-sec="2"
          data-screen-label="03f YouTube Shorts"
          style={{
            position: "relative",
            padding: "clamp(70px,9vw,120px) clamp(16px,3.5vw,48px)",
            background: "#451531",
            color: "#F8F5F2",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(90px,11vw,150px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px,3.6vw,48px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  borderTop: "1px solid rgba(248,245,242,.45)",
                  paddingTop: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                <span>N° 05 · Os números · C / YouTube Shorts</span>
                <span style={{ color: "#FF8FB0" }}>Dados reais · 28 dias · top 3 e engajamento demonstrativos</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
                <h3
                  data-r=""
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(48px,7vw,116px)",
                    lineHeight: ".92",
                  }}
                >
                  YOUTUBE <em style={{ color: "#FF3877" }}>shorts</em>
                </h3>
                <span
                  data-r=""
                  data-d="100"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    border: "1.5px solid #F8F5F2",
                    borderRadius: "999px",
                    padding: "9px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <i style={{ fontSize: "20px", color: "#FF3877" }} className="ph-fill ph-youtube-logo"></i>@taisdonnaruma
                </span>
              </div>
              <div
                data-r=""
                style={{
                  display: "grid",
                  gridTemplateColumns: v.shCols,
                  borderTop: "1.5px solid rgba(248,245,242,.6)",
                  borderLeft: "1.5px solid rgba(248,245,242,.6)",
                }}
              >
                {v.shKpis.map((k, _i27) => (
                  <Fragment key={_i27}>
                    <div
                      style={{
                        borderRight: "1.5px solid rgba(248,245,242,.6)",
                        borderBottom: "1.5px solid rgba(248,245,242,.6)",
                        containerType: "inline-size",
                        padding: "16px 16px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        transition: "background .3s",
                      }}
                      className="hv11"
                    >
                      <div
                        className="kpi-head"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                        }}
                      >
                        <span>{k.k}</span>
                        <span style={{ color: "#E9DDE5" }}>{k.per}</span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontVariantNumeric: "tabular-nums lining-nums",
                          fontSize: "min(clamp(60px,5.6vw,92px),25cqi)",
                          lineHeight: ".88",
                        }}
                      >
                        {k.v}
                      </span>
                      <span style={{ fontSize: "15px", color: "#E9DDE5" }}>{k.note}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
                  gap: "clamp(24px,3vw,44px)",
                  alignItems: "start",
                }}
              >
                <div data-r="" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".1em", textTransform: "uppercase" }}>
                    Top 3 shorts do período
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "clamp(10px,1.4vw,18px)" }}>
                    {v.shTop.map((t, _i28) => (
                      <Fragment key={_i28}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            transition: "transform .35s cubic-bezier(.2,.8,.2,1)",
                          }}
                          className="hv12"
                        >
                          <div
                            style={{
                              position: "relative",
                              aspectRatio: "9/16",
                              borderRadius: "14px",
                              overflow: "hidden",
                              border: "1.5px solid rgba(248,245,242,.7)",
                              background: t.bg,
                              color: "#451531",
                            }}
                          >
                            <Slot src={t.src} ph={"Capa do short"} />
                            <span
                              style={{
                                position: "absolute",
                                left: "8px",
                                top: "8px",
                                pointerEvents: "none",
                                background: "#451531",
                                color: "#F8F5F2",
                                borderRadius: "4px",
                                padding: "3px 7px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              #{t.n}
                            </span>
                          </div>
                          <span style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                            <span style={{ fontSize: "24px", fontWeight: "600" }}>{t.views}</span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                letterSpacing: ".08em",
                                textTransform: "uppercase",
                                color: "#E9DDE5",
                              }}
                            >
                              views
                            </span>
                          </span>
                          <span style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#E9DDE5" }}>
                            <span>
                              <i className="ph ph-heart"></i> {t.likes}
                            </span>
                            <span>
                              <i className="ph ph-chat-circle"></i> {t.com}
                            </span>
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div
                  data-r=""
                  data-d="120"
                  style={{
                    border: "1.5px solid #F8F5F2",
                    borderRadius: "10px",
                    background: "rgba(248,245,242,.04)",
                    boxShadow: "7px 7px 0 #FF3877",
                    marginTop: "30px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#F8F5F2",
                      color: "#451531",
                      padding: "8px 12px",
                      borderRadius: "9px 9px 0 0",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i style={{ fontSize: "16px" }} className="ph ph-chart-bar"></i>shorts · alcance real
                    </span>
                    <span style={{ display: "flex", gap: "4px" }}>
                      <span style={{ width: "10px", height: "10px", border: "1.5px solid #451531", borderRadius: "2px" }}></span>
                      <span style={{ width: "10px", height: "10px", border: "1.5px solid #451531", borderRadius: "2px" }}></span>
                      <span style={{ width: "10px", height: "10px", background: "#451531", borderRadius: "2px" }}></span>
                    </span>
                  </div>
                  <div style={{ padding: "clamp(16px,2.2vw,26px)", display: "flex", flexDirection: "column", gap: "18px" }}>
                    {v.shEng.map((e, _i29) => (
                      <Fragment key={_i29}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "12.5px",
                                fontWeight: "600",
                                letterSpacing: ".1em",
                                textTransform: "uppercase",
                              }}
                            >
                              <i style={{ fontSize: "16px" }} className={[e.icon].join(" ")}></i>
                              {e.k}
                            </span>
                            <span style={{ fontSize: "24px", fontWeight: "600", lineHeight: "1" }}>{e.v}</span>
                          </div>
                          <div style={{ height: "10px", borderRadius: "999px", background: "rgba(248,245,242,.14)" }}>
                            <div style={{ height: "100%", width: e.w, borderRadius: "999px", background: e.c }}></div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      borderTop: "1px dashed rgba(248,245,242,.4)",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>Espectadores novos no mês · 52,7%</span>
                    <span style={{ color: "#FF8FB0" }}>Dado real · 28 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="s03-yt-d"
          data-sec="2"
          data-screen-label="03g YouTube em detalhe"
          style={{
            position: "relative",
            padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)",
            background: "#F8F5F2",
            color: "#451531",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(40px,5vw,72px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px,2.6vw,32px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  borderTop: "1px solid #451531",
                  paddingTop: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                <span>N° 05 · Os números · C / YouTube em detalhe</span>
                <span style={{ color: "#B3093F" }}>Últimos 28 dias</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
                <h2
                  data-r=""
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(54px,8vw,132px)",
                    lineHeight: ".9",
                    letterSpacing: "-.02em",
                  }}
                >
                  O <em style={{ color: "#B3093F" }}>YouTube</em> da Tais
                </h2>
                <div
                  data-r=""
                  data-d="100"
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px", maxWidth: "38ch" }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1.5px solid #451531",
                      borderRadius: "999px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      lineHeight: "1.2",
                    }}
                  >
                    <i style={{ fontSize: "20px", color: "#FF3877" }} className="ph-fill ph-youtube-logo"></i>@taisdonnaruma
                  </span>
                  <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", textWrap: "pretty" }}>
                    O canal que mais cresce: shorts de moda e humor que viram maratona no feed.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="kpi-grid"
              data-r=""
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
                borderTop: "1.5px solid #451531",
                borderLeft: "1.5px solid #451531",
              }}
            >
              {v.ytKpis.map((k, _i30) => (
                <Fragment key={_i30}>
                  <div
                    style={{
                      borderRight: "1.5px solid #451531",
                      borderBottom: "1.5px solid #451531",
                      containerType: "inline-size",
                      padding: "20px 22px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      transition: "background .3s",
                    }}
                    className="hv13"
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                        <i style={{ fontSize: "16px", color: "#B3093F" }} className={[k.icon].join(" ")}></i>
                        {k.k}
                      </span>
                      <span style={{ fontSize: "10.5px", color: k.tagC }}>{k.tag}</span>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontWeight: "500",
                        fontSize: "min(clamp(52px,5vw,76px),25cqi)",
                        lineHeight: ".9",
                        letterSpacing: "-.035em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {k.v}
                    </span>
                    <span style={{ fontSize: "14.5px", color: "#6B4A5C", marginTop: "auto" }}>{k.note}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
                gap: "clamp(24px,3vw,44px)",
                alignItems: "stretch",
              }}
            >
              <div
                data-r=""
                style={{
                  border: "1.5px solid #451531",
                  borderRadius: "10px",
                  background: "#FCFAF8",
                  boxShadow: "7px 7px 0 #FF3877",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#FF3877",
                    color: "#451531",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i style={{ fontSize: "16px" }} className="ph ph-chart-bar"></i>visualizações por semana
                  </span>
                  <span>4,3M no total</span>
                </div>
                <div
                  style={{
                    flex: "1",
                    display: "grid",
                    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                    gap: "clamp(10px,1.6vw,22px)",
                    alignItems: "end",
                    padding: "24px clamp(14px,2vw,24px) 12px",
                    minHeight: "280px",
                  }}
                >
                  {v.ytWeeks.map((w, _i31) => (
                    <Fragment key={_i31}>
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "15px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{w.v}</span>
                        <div
                          style={{
                            width: "100%",
                            height: w.h,
                            borderRadius: "999px 999px 8px 8px",
                            background: w.c,
                            transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
                          }}
                          className="hv14"
                        ></div>
                        <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: ".06em", textTransform: "uppercase" }}>
                          {w.k}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    borderTop: "1px dashed rgba(69,21,49,.4)",
                    padding: "10px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Divisão semanal</span>
                  <span style={{ color: "#B3093F" }}>Dado real · aprox. do gráfico</span>
                </div>
              </div>
              <div
                data-r=""
                data-d="120"
                style={{
                  border: "1.5px solid #451531",
                  borderRadius: "10px",
                  background: "#FCFAF8",
                  boxShadow: "7px 7px 0 #451531",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#451531",
                    color: "#F8F5F2",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i style={{ fontSize: "16px" }} className="ph ph-users-three"></i>quem assiste
                  </span>
                  <span>audiência YouTube</span>
                </div>
                <div style={{ padding: "clamp(16px,2.2vw,26px)", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span>Gênero</span>
                      <span style={{ color: "#451531" }}>Real</span>
                    </span>
                    <div
                      style={{ display: "flex", height: "40px", borderRadius: "999px", overflow: "hidden", border: "1.5px solid #451531" }}
                    >
                      <div
                        style={{
                          width: "58.4%",
                          background: "#B3093F",
                          color: "#F8F5F2",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 14px",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        Mulheres 58,4%
                      </div>
                      <div
                        style={{
                          flex: "1",
                          background: "#DCE5FD",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          padding: "0 14px",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        Homens 41,5%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span>Comportamento do público</span>
                      <span style={{ color: "#B3093F" }}>Real</span>
                    </span>
                    {v.ytSources.map((a, _i32) => (
                      <Fragment key={_i32}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(110px,150px) minmax(0,1fr) 44px",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: "600" }}>{a.k}</span>
                          <div style={{ height: "12px", borderRadius: "999px", background: "rgba(69,21,49,.1)" }}>
                            <div style={{ height: "100%", width: a.w, borderRadius: "999px", background: a.c }}></div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "600", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {a.v}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div data-r="" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  paddingBottom: "8px",
                }}
              >
                <span>Vídeos mais vistos · 28 dias</span>
                <span style={{ color: "#B3093F" }}>Dado real</span>
              </span>
              {v.ytThemes.map((f, _i33) => (
                <Fragment key={_i33}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px minmax(0,1fr) auto",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px 0",
                      borderTop: "1px solid #451531",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-bodoni),serif",
                        fontVariationSettings: "'opsz' 28",
                        fontStyle: "italic",
                        fontSize: "24px",
                        color: "#B3093F",
                      }}
                    >
                      {f.n}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni),serif",
                          fontVariationSettings: "'opsz' 28",
                          fontSize: "clamp(24px,2.2vw,32px)",
                          lineHeight: "1",
                        }}
                      >
                        {f.t}
                      </span>
                      <div style={{ height: "6px", borderRadius: "999px", background: "rgba(69,21,49,.1)" }}>
                        <div style={{ height: "100%", width: f.w, borderRadius: "999px", background: "#FF3877" }}></div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: "500",
                          fontSize: "clamp(26px,2.4vw,34px)",
                          lineHeight: "1",
                          letterSpacing: "-.03em",
                        }}
                      >
                        {f.v}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#6B4A5C",
                        }}
                      >
                        visualizações
                      </span>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Conteúdo educativo (antes era parte dos cases) */}
        <section
          id="s-edu"
          data-sec="3"
          data-screen-label="05c Conteúdo educativo"
          style={{ position: "relative", padding: "clamp(56px,7vw,100px) clamp(16px,3.5vw,48px) 0", background: "#F8F5F2" }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            <div
              className="edu-wrap"
              data-r=""
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
                gap: "clamp(24px,3.4vw,48px)",
                alignItems: "center",
                borderTop: "1.5px solid #451531",
                paddingTop: "clamp(36px,4.4vw,56px)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "44ch" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                  }}
                >
                  <i style={{ fontSize: "18px", color: "#B3093F" }} className="ph ph-graduation-cap"></i>Além das campanhas
                </span>
                <h3
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(38px,4.4vw,64px)",
                    lineHeight: ".95",
                    letterSpacing: "-.02em",
                  }}
                >
                  Conteúdo que <em style={{ color: "#B3093F" }}>ensina</em> e informa
                </h3>
                <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", textWrap: "pretty" }}>
                  Dicas de styling, rotina de beleza e moda explicada sem complicar, no tom leve de sempre. Um formato que gera salvamentos
                  e confiança para as marcas.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {v.eduTags.map((t, _i41) => (
                    <Fragment key={_i41}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          border: "1px solid #451531",
                          borderRadius: "999px",
                          padding: "6px 14px",
                          whiteSpace: "nowrap",
                          lineHeight: "1.2",
                        }}
                      >
                        {t}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="edu-grid">
                {v.edu.map((x) => (
                  <div key={x.n} className="edu-card" style={{ "--rot": x.rot }}>
                    <button type="button" className="edu-thumb" onClick={x.play} aria-label={"Assistir: " + x.t}>
                      <video
                        data-autoplay=""
                        src={x.preview}
                        poster={x.poster}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden="true"
                        tabIndex={-1}
                      />
                      <span className="edu-tag">{x.tag}</span>
                      <span className="case-reel-play">
                        <i className="ph-fill ph-play"></i>
                      </span>
                      <span className="case-reel-time">{x.dur}</span>
                    </button>
                    <span className="edu-title">{x.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="s04"
          data-sec="3"
          data-screen-label="04 O programa"
          style={{ position: "relative", padding: "clamp(80px,10vw,150px) clamp(16px,3.5vw,48px)", background: "#F8F5F2" }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 40px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <span data-r="" style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  N° 06 · O programa
                </span>
                <h2
                  data-r=""
                  data-d="80"
                  style={{
                    margin: "0",
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: "400",
                    fontSize: "clamp(50px,7vw,116px)",
                    lineHeight: ".92",
                    letterSpacing: "-.02em",
                  }}
                >
                  Do que <em style={{ color: "#B3093F" }}>eu falo</em>
                </h2>
              </div>
              <p data-r="" data-d="160" style={{ margin: "0", maxWidth: "36ch", fontSize: "18px", lineHeight: "1.5" }}>
                Quatro atos, um mesmo tom: leve, divertido e sempre bem vestido.
              </p>
            </div>
            <div
              ref={v.progRef}
              onMouseMove={v.progMove}
              onMouseLeave={v.progLeave}
              style={{ position: "relative", marginTop: "clamp(36px,5vw,64px)", borderTop: "1px solid #451531" }}
            >
              <div
                ref={v.followRef}
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  zIndex: "5",
                  width: "clamp(170px,17vw,240px)",
                  aspectRatio: "4/5",
                  pointerEvents: "none",
                  opacity: v.followOp,
                  transition: "opacity .3s",
                  willChange: "transform",
                }}
              >
                {v.program.map((p, _i34) => (
                  <Fragment key={_i34}>
                    <div
                      style={{
                        position: "absolute",
                        inset: "0",
                        borderRadius: "999px 999px 18px 18px",
                        overflow: "hidden",
                        background: "#DCE5FD",
                        opacity: p.op,
                        transform: `scale(${p.sc}) rotate(${p.rr})`,
                        transition: "opacity .35s,transform .5s cubic-bezier(.2,.8,.2,1)",
                        boxShadow: "0 24px 50px rgba(69,21,49,.25)",
                      }}
                    >
                      <Slot src={p.src} ph={p.t} />
                    </div>
                  </Fragment>
                ))}
              </div>
              {v.program.map((p, _i35) => (
                <Fragment key={_i35}>
                  <div
                    data-r=""
                    data-d={p.d}
                    style={{
                      display: "grid",
                      gridTemplateColumns: v.progCols,
                      alignItems: "baseline",
                      gap: "6px clamp(14px,3vw,48px)",
                      padding: "clamp(18px,2.4vw,30px) 0",
                      borderBottom: "1px solid #451531",
                      cursor: "default",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-bodoni),serif",
                        fontVariationSettings: "'opsz' 28",
                        fontStyle: "italic",
                        fontSize: "22px",
                        color: "#B3093F",
                      }}
                    >
                      {p.n}
                    </span>
                    {/* a foto que segue o cursor aparece só ao passar sobre o título grande */}
                    <span
                      onMouseEnter={p.enter}
                      onMouseLeave={v.progLeave}
                      style={{
                        justifySelf: "start",
                        fontFamily: "var(--font-bodoni),serif",
                        fontVariationSettings: "'opsz' 28",
                        fontWeight: "400",
                        fontSize: "clamp(54px,8vw,128px)",
                        lineHeight: ".88",
                        letterSpacing: "-.02em",
                        color: p.ink,
                        transform: `translateX(${p.x})`,
                        transition: "transform .5s cubic-bezier(.2,.8,.2,1),color .3s",
                      }}
                    >
                      {p.t}
                    </span>
                    <div style={{ gridColumn: v.progLast, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "34ch" }}>
                      <span style={{ fontSize: "17px", lineHeight: "1.55" }}>{p.desc}</span>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: "600",
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          color: "#6B4A5C",
                        }}
                      >
                        {p.formats}
                      </span>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {v.pricingPlans ? (
          <>
            <section
              id="s06"
              data-sec="5"
              data-screen-label="06 Serviços e valores"
              style={{
                position: "relative",
                padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)",
                background: "#451531",
                color: "#F8F5F2",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "0",
                  pointerEvents: "none",
                  backgroundImage: "radial-gradient(rgba(248,245,242,.09) 1px,transparent 1.2px)",
                  backgroundSize: "18px 18px",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "46%",
                  width: "min(900px,90vw)",
                  height: "620px",
                  transform: "translate(-50%,-50%)",
                  pointerEvents: "none",
                  background: "radial-gradient(closest-side,rgba(255,56,119,.32),rgba(255,56,119,0))",
                }}
              ></div>
              <div
                style={{
                  position: "relative",
                  maxWidth: "1240px",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "clamp(30px,4vw,48px)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
                  <span
                    data-r=""
                    style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".16em", textTransform: "uppercase", color: "#FFB3C9" }}
                  >
                    N° 07 · Formatos e investimento
                  </span>
                  <h2
                    data-r=""
                    data-d="80"
                    style={{
                      margin: "0",
                      fontFamily: "var(--font-bodoni),serif",
                      fontVariationSettings: "'opsz' 28",
                      fontWeight: "400",
                      fontSize: "clamp(50px,7vw,112px)",
                      lineHeight: ".92",
                      letterSpacing: "-.02em",
                    }}
                  >
                    Escolha o <em style={{ color: "#FFB3C9" }}>seu formato</em>
                  </h2>
                  <p
                    data-r=""
                    data-d="140"
                    style={{ margin: "0", maxWidth: "50ch", fontSize: "17px", lineHeight: "1.6", color: "#EFE4EA" }}
                  >
                    Valores de referência. Cada projeto pode ser ajustado ao objetivo, prazo e escopo da sua marca.
                  </p>
                </div>
                <div
                  data-r=""
                  data-d="180"
                  style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "15px", fontWeight: "600" }}
                >
                  <button
                    onClick={v.setPkg}
                    style={{
                      appearance: "none",
                      background: "transparent",
                      border: "0",
                      cursor: "pointer",
                      padding: "6px 2px",
                      fontFamily: "var(--font-hanken),sans-serif",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: v.pkgC,
                    }}
                  >
                    Pacotes
                  </button>
                  <button
                    onClick={v.togglePlan}
                    aria-label="Alternar entre pacotes e formatos"
                    style={{
                      appearance: "none",
                      cursor: "pointer",
                      position: "relative",
                      width: "52px",
                      height: "28px",
                      borderRadius: "999px",
                      border: "1px solid #FFB3C9",
                      background: "#B3093F",
                      padding: "0",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: v.knobX,
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#F8F5F2",
                        transition: "left .3s cubic-bezier(.2,.8,.2,1)",
                      }}
                    ></span>
                  </button>
                  <button
                    onClick={v.setFmt}
                    style={{
                      appearance: "none",
                      background: "transparent",
                      border: "0",
                      cursor: "pointer",
                      padding: "6px 2px",
                      fontFamily: "var(--font-hanken),sans-serif",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: v.fmtC,
                    }}
                  >
                    Por formato
                  </button>
                </div>
                <div
                  onMouseLeave={v.plansLeave}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))",
                    gap: "clamp(16px,2vw,26px)",
                    alignItems: "stretch",
                    paddingTop: "20px",
                  }}
                >
                  {v.plans.map((p, _i43) => (
                    <Fragment key={_i43}>
                      <div
                        data-plan=""
                        onMouseEnter={p.enter}
                        style={{
                          position: "relative",
                          background: p.bg,
                          color: p.fg,
                          border: `1px solid ${p.bd}`,
                          borderRadius: "22px",
                          padding: "30px 26px 32px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "18px",
                          transform: `translateY(${p.lift})`,
                          boxShadow: p.sh,
                          transition:
                            "transform .5s cubic-bezier(.2,.8,.2,1), background .45s ease, color .45s ease, border-color .45s ease, box-shadow .5s ease",
                        }}
                      >
                        {p.badge ? (
                          <>
                            <span
                              style={{
                                position: "absolute",
                                top: "-14px",
                                left: "26px",
                                background: "#FF3877",
                                color: "#FFFDF9",
                                borderRadius: "999px",
                                padding: "6px 14px",
                                fontSize: "11.5px",
                                fontWeight: "700",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                lineHeight: "1.2",
                              }}
                            >
                              {p.badge}
                            </span>
                          </>
                        ) : null}
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "12.5px",
                            fontWeight: "600",
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: p.accent,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i style={{ fontSize: "18px" }} className={[p.icon].join(" ")}></i>
                          {p.name}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              letterSpacing: ".12em",
                              textTransform: "uppercase",
                              color: p.muted,
                            }}
                          >
                            {p.from}
                          </span>
                          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 10px" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-hanken),sans-serif",
                                fontVariantNumeric: "tabular-nums lining-nums",
                                fontWeight: "500",
                                fontSize: "clamp(44px,4vw,58px)",
                                letterSpacing: "-.04em",
                                lineHeight: ".95",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.price}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "20px",
                                color: p.muted,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.unit}
                            </span>
                          </div>
                        </div>
                        <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: p.muted, minHeight: "4.65em" }}>{p.desc}</p>
                        <button
                          onClick={v.goContact}
                          style={{
                            appearance: "none",
                            cursor: "pointer",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            background: p.btnBg,
                            color: p.btnFg,
                            border: `1px solid ${p.btnBd}`,
                            borderRadius: "12px",
                            padding: "13px 18px",
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontSize: "14.5px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            transition: "transform .25s",
                          }}
                          className="hv19"
                        >
                          {p.cta} <i className="ph ph-arrow-right"></i>
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "6px" }}>
                          <span style={{ flex: "1", height: "1px", background: p.line }}></span>
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: "600",
                              letterSpacing: ".22em",
                              textTransform: "uppercase",
                              color: p.muted,
                            }}
                          >
                            Inclui
                          </span>
                          <span style={{ flex: "1", height: "1px", background: p.line }}></span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {p.feats.map((x, _i44) => (
                            <Fragment key={_i44}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "15px", lineHeight: "1.4" }}>
                                <span
                                  style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    border: `1px solid ${p.accent}`,
                                    color: p.accent,
                                    display: "grid",
                                    placeItems: "center",
                                    flex: "none",
                                    marginTop: "-1px",
                                  }}
                                >
                                  <i style={{ fontSize: "12px" }} className="ph ph-check"></i>
                                </span>
                                <span style={{ display: "flex", justifyContent: "space-between", gap: "10px", flex: "1" }}>
                                  <span>{x.t}</span>
                                  <span style={{ fontWeight: "600", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{x.v}</span>
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div
                  data-r=""
                  style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 36px", paddingTop: "12px" }}
                >
                  {v.priceNotes.map((n, _i45) => (
                    <Fragment key={_i45}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          maxWidth: "56ch",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          color: "#EFE4EA",
                        }}
                      >
                        <i style={{ fontSize: "18px", color: "#FFB3C9", flex: "none", marginTop: "1px" }} className="ph ph-info"></i>
                        {n}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}

        {v.pricingCarta ? (
          <>
            <section
              id="s06"
              data-sec="5"
              data-screen-label="06 Serviços e valores"
              style={{
                position: "relative",
                padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)",
                background: "#451531",
                color: "#F8F5F2",
                overflow: "hidden",
              }}
            >
              <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(36px,5vw,64px)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "18px" }}>
                  <span
                    data-r=""
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                      color: "#FFB3C9",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        background: "#FFB3C9",
                        clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                        flex: "none",
                      }}
                    ></span>
                    N° 07 · La carte
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        background: "#FFB3C9",
                        clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                        flex: "none",
                      }}
                    ></span>
                  </span>
                  <h2
                    data-r=""
                    data-d="80"
                    style={{
                      margin: "0",
                      fontFamily: "var(--font-bodoni),serif",
                      fontVariationSettings: "'opsz' 28",
                      fontWeight: "400",
                      fontSize: "clamp(52px,7.4vw,120px)",
                      lineHeight: ".92",
                      letterSpacing: "-.02em",
                    }}
                  >
                    Formatos e <em style={{ color: "#FFB3C9" }}>investimento</em>
                  </h2>
                  <p
                    data-r=""
                    data-d="160"
                    style={{ margin: "0", maxWidth: "52ch", fontSize: "17px", lineHeight: "1.6", color: "#EFE4EA" }}
                  >
                    Valores de referência por entrega. Cada projeto pode ser ajustado ao objetivo, prazo e escopo da sua marca.
                  </p>
                </div>
                <div
                  data-r=""
                  style={{
                    position: "relative",
                    background: "#F8F5F2",
                    color: "#451531",
                    borderRadius: "6px",
                    padding: "clamp(14px,1.6vw,20px)",
                    boxShadow: "0 40px 80px rgba(0,0,0,.28)",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #451531",
                      outline: "1px solid #451531",
                      outlineOffset: "-7px",
                      padding: "clamp(32px,5vw,72px) clamp(22px,5vw,80px)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        marginBottom: "clamp(30px,4vw,52px)",
                      }}
                    >
                      <span style={{ flex: "1", maxWidth: "160px", height: "1px", background: "#451531" }}></span>
                      <span
                        style={{
                          fontFamily: "var(--font-script),cursive",
                          fontSize: "clamp(40px,4vw,56px)",
                          lineHeight: ".8",
                          color: "#B3093F",
                        }}
                      >
                        Menu de parcerias
                      </span>
                      <span style={{ flex: "1", maxWidth: "160px", height: "1px", background: "#451531" }}></span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
                        gap: "clamp(36px,4vw,56px) clamp(40px,6vw,96px)",
                      }}
                    >
                      {v.menu.map((g, _i46) => (
                        <Fragment key={_i46}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "14px",
                                borderBottom: "1px solid #451531",
                                paddingBottom: "12px",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-bodoni),serif",
                                  fontVariationSettings: "'opsz' 28",
                                  fontStyle: "italic",
                                  fontSize: "22px",
                                  color: "#B3093F",
                                }}
                              >
                                {g.n}
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--font-bodoni),serif",
                                  fontVariationSettings: "'opsz' 28",
                                  fontSize: "clamp(32px,3vw,44px)",
                                  lineHeight: "1",
                                  letterSpacing: "-.01em",
                                }}
                              >
                                {g.t}
                              </span>
                              <i style={{ marginLeft: "auto", fontSize: "20px", color: "#B3093F" }} className={[g.icon].join(" ")}></i>
                            </div>
                            {g.items.map((i, _i47) => (
                              <Fragment key={_i47}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    padding: "6px 0",
                                    transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
                                  }}
                                  className="hv20"
                                >
                                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                    <span
                                      style={{
                                        fontFamily: "var(--font-bodoni),serif",
                                        fontVariationSettings: "'opsz' 28",
                                        fontStyle: "italic",
                                        fontSize: "clamp(22px,2vw,26px)",
                                        lineHeight: "1.15",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {i.k}
                                    </span>
                                    <span
                                      style={{
                                        flex: "1",
                                        minWidth: "24px",
                                        borderBottom: "2px dotted rgba(69,21,49,.45)",
                                        transform: "translateY(-5px)",
                                      }}
                                    ></span>
                                    <span
                                      style={{
                                        fontFamily: "var(--font-hanken),sans-serif",
                                        fontVariantNumeric: "tabular-nums lining-nums",
                                        fontWeight: "600",
                                        fontSize: "clamp(20px,1.8vw,24px)",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {i.v}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: "14.5px", lineHeight: "1.45", color: "#6B4A5C" }}>{i.desc}</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: "clamp(40px,5vw,64px)",
                        position: "relative",
                        background: "#451531",
                        color: "#F8F5F2",
                        borderRadius: "4px",
                        padding: "clamp(26px,3.4vw,44px)",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
                        gap: "24px clamp(28px,4vw,60px)",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: ".16em",
                            textTransform: "uppercase",
                            color: "#FFB3C9",
                          }}
                        >
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              background: "#FFB3C9",
                              clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                              flex: "none",
                            }}
                          ></span>
                          Sugestão da casa
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-bodoni),serif",
                            fontVariationSettings: "'opsz' 28",
                            fontSize: "clamp(38px,3.8vw,56px)",
                            lineHeight: "1",
                          }}
                        >
                          Combo <em style={{ color: "#FFB3C9" }}>completo</em>
                        </span>
                        <span style={{ fontSize: "15.5px", lineHeight: "1.55", color: "#EFE4EA" }}>
                          A presença mais completa da campanha, do feed aos stories.
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {v.comboItems.map((c, _i48) => (
                          <Fragment key={_i48}>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 0",
                                borderBottom: "1px solid rgba(248,245,242,.2)",
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "21px",
                              }}
                            >
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  background: "#FF3877",
                                  clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                                  flex: "none",
                                }}
                              ></span>
                              {c}
                            </span>
                          </Fragment>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: "#EFE4EA",
                          }}
                        >
                          Investimento
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontVariantNumeric: "tabular-nums lining-nums",
                            fontSize: "clamp(46px,4.6vw,68px)",
                            fontWeight: "500",
                            letterSpacing: "-.035em",
                            lineHeight: ".9",
                            whiteSpace: "nowrap",
                          }}
                        >
                          R$ 4.550
                        </span>
                        <button
                          onClick={v.goContact}
                          style={{
                            appearance: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            background: "transparent",
                            color: "#F8F5F2",
                            border: "1px solid #F8F5F2",
                            borderRadius: "999px",
                            padding: "12px 20px",
                            fontFamily: "var(--font-hanken),sans-serif",
                            fontSize: "14px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            transition: "background .25s,color .25s",
                          }}
                          className="hv21"
                        >
                          Reservar este combo <i className="ph ph-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    data-spin=""
                    style={{
                      position: "absolute",
                      right: "clamp(-24px,-1.5vw,-12px)",
                      top: "clamp(-40px,-3vw,-28px)",
                      width: "clamp(96px,9vw,128px)",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      background: "#FF3877",
                      color: "#FFFDF9",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 14px 30px rgba(0,0,0,.25)",
                    }}
                  >
                    <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                      <defs>
                        <path id="v7carta" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"></path>
                      </defs>
                      <text
                        style={{
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontSize: "19px",
                          fontWeight: "600",
                          letterSpacing: "4.6px",
                          textTransform: "uppercase",
                        }}
                        fill="#FFFDF9"
                      >
                        <textPath href="#v7carta">valores 2026 · fun but chic ·</textPath>
                      </text>
                    </svg>
                    <span
                      style={{
                        width: "26px",
                        height: "26px",
                        background: "#FFFDF9",
                        clipPath: "polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)",
                        flex: "none",
                      }}
                    ></span>
                  </div>
                </div>
                <div data-r="" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 36px" }}>
                  {v.priceNotes.map((n, _i49) => (
                    <Fragment key={_i49}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          maxWidth: "56ch",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          color: "#EFE4EA",
                        }}
                      >
                        <i style={{ fontSize: "18px", color: "#FFB3C9", flex: "none", marginTop: "1px" }} className="ph ph-info"></i>
                        {n}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}

        {v.pricingCards ? (
          <>
            <section
              id="s06"
              data-sec="5"
              data-screen-label="06 Serviços e valores"
              style={{ position: "relative", padding: "clamp(80px,10vw,140px) clamp(16px,3.5vw,48px)", background: "#FCFAF8" }}
            >
              <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(32px,4vw,52px)" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
                    gap: "20px 60px",
                    alignItems: "end",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <span data-r="" style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase" }}>
                      N° 07 · Serviços e valores
                    </span>
                    <h2
                      data-r=""
                      data-d="80"
                      style={{
                        margin: "0",
                        fontFamily: "var(--font-bodoni),serif",
                        fontVariationSettings: "'opsz' 28",
                        fontWeight: "400",
                        fontSize: "clamp(46px,6vw,96px)",
                        lineHeight: ".95",
                        letterSpacing: "-.02em",
                      }}
                    >
                      Formatos e <em style={{ color: "#B3093F" }}>investimento</em>
                    </h2>
                  </div>
                  <div data-r="" data-d="160" style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "52ch" }}>
                    <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6" }}>
                      Valores de referência por entrega. Cada projeto pode ser ajustado ao objetivo, prazo e escopo da sua marca.
                    </p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: "16px" }}>
                  {v.menu.map((g, _i50) => (
                    <Fragment key={_i50}>
                      <div
                        data-r=""
                        data-d={g.d}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(69,21,49,.16)",
                          borderRadius: "18px",
                          padding: "26px 24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                          transition: "transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .35s",
                        }}
                        className="hv22"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "50%",
                              background: "#DCE5FD",
                              color: "#B3093F",
                              display: "grid",
                              placeItems: "center",
                              flex: "none",
                            }}
                          >
                            <i style={{ fontSize: "20px" }} className={[g.icon].join(" ")}></i>
                          </span>
                          <span style={{ fontSize: "18px", fontWeight: "600", lineHeight: "1.2" }}>{g.t}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {g.items.map((i, _i51) => (
                            <Fragment key={_i51}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                  padding: "14px 0",
                                  borderTop: "1px solid rgba(69,21,49,.12)",
                                }}
                              >
                                <span style={{ fontSize: "15px", fontWeight: "500", lineHeight: "1.35" }}>{i.k}</span>
                                <span style={{ fontSize: "14px", lineHeight: "1.45", color: "#6B4A5C" }}>{i.desc}</span>
                                <span
                                  style={{
                                    fontSize: "26px",
                                    fontWeight: "600",
                                    letterSpacing: "-.01em",
                                    lineHeight: "1.1",
                                    marginTop: "4px",
                                    color: "#451531",
                                  }}
                                >
                                  {i.v}
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div
                  data-r=""
                  style={{
                    background: "#451531",
                    color: "#F8F5F2",
                    borderRadius: "22px",
                    padding: "clamp(26px,3.6vw,44px)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
                    gap: "28px clamp(28px,4vw,60px)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span
                      style={{
                        alignSelf: "flex-start",
                        background: "#A5BEFA",
                        color: "#451531",
                        borderRadius: "999px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        lineHeight: "1.2",
                      }}
                    >
                      Pacote recomendado
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-bodoni),serif",
                        fontVariationSettings: "'opsz' 28",
                        fontSize: "clamp(34px,3.4vw,48px)",
                        lineHeight: "1",
                      }}
                    >
                      Combo completo
                    </span>
                    <span style={{ fontSize: "16px", lineHeight: "1.55", color: "#EFE4EA" }}>
                      A presença mais completa da campanha, do feed aos stories.
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {v.comboItems.map((c, _i52) => (
                      <Fragment key={_i52}>
                        <span style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px" }}>
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "rgba(165,190,250,.18)",
                              color: "#A5BEFA",
                              display: "grid",
                              placeItems: "center",
                              flex: "none",
                            }}
                          >
                            <i style={{ fontSize: "13px" }} className="ph ph-check"></i>
                          </span>
                          {c}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px" }}>
                    <span style={{ fontSize: "13px", color: "#EFE4EA" }}>Investimento</span>
                    <span style={{ fontSize: "clamp(40px,4vw,56px)", fontWeight: "600", letterSpacing: "-.02em", lineHeight: "1" }}>
                      R$ 4.550
                    </span>
                    <button
                      onClick={v.goContact}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#F8F5F2",
                        color: "#451531",
                        border: "0",
                        borderRadius: "999px",
                        padding: "13px 20px",
                        fontFamily: "var(--font-hanken),sans-serif",
                        fontSize: "14px",
                        fontWeight: "600",
                        transition: "background .25s,color .25s",
                      }}
                      className="hv23"
                    >
                      Solicitar proposta <i className="ph ph-arrow-right"></i>
                    </button>
                  </div>
                </div>
                <div
                  data-r=""
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px 36px",
                    paddingTop: "18px",
                    borderTop: "1px solid rgba(69,21,49,.16)",
                  }}
                >
                  {v.priceNotes.map((n, _i53) => (
                    <Fragment key={_i53}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          maxWidth: "56ch",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          color: "#6B4A5C",
                        }}
                      >
                        <i style={{ fontSize: "18px", color: "#B3093F", flex: "none", marginTop: "1px" }} className="ph ph-info"></i>
                        {n}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <section
          id="s07"
          data-sec="6"
          data-screen-label="07 RSVP"
          style={{
            position: "relative",
            padding: "clamp(80px,10vw,150px) clamp(16px,3.5vw,48px) 40px",
            background: "#451531",
            color: "#F8F5F2",
            overflow: "hidden",
          }}
        >
          {v.collage ? (
            <>
              {v.stk.contato.map((k, _i54) => (
                <Fragment key={_i54}>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: "6",
                      left: k.l,
                      right: k.r,
                      top: k.t,
                      bottom: k.b,
                      width: k.w,
                      transform: `rotate(${k.rot})`,
                      pointerEvents: "none",
                    }}
                  >
                    {k.photo ? (
                      <>
                        <div
                          style={{
                            position: "relative",
                            background: "#FFFDF9",
                            padding: "7px",
                            boxShadow: "0 14px 28px rgba(69,21,49,.24)",
                            pointerEvents: "auto",
                          }}
                        >
                          <div style={{ aspectRatio: k.ar, overflow: "hidden", background: "#DCE5FD", color: "#B3093F" }}>
                            <Slot src={k.src} ph={k.ph} />
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-11px",
                              width: "58px",
                              height: "20px",
                              transform: "translateX(-50%) rotate(-5deg)",
                              background: "rgba(255,179,201,.78)",
                            }}
                          ></span>
                          {k.cap ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  right: "0",
                                  bottom: "-34px",
                                  textAlign: "center",
                                  fontFamily: "var(--font-script),cursive",
                                  fontSize: "30px",
                                  lineHeight: "1",
                                  color: k.capC,
                                }}
                              >
                                {k.cap}
                              </span>
                            </>
                          ) : null}
                          {k.heart ? (
                            <>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "-16px",
                                  bottom: "-16px",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "11px",
                                  background: "#FF3877",
                                  color: "#FFFDF9",
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 8px 18px rgba(179,9,63,.35)",
                                }}
                              >
                                <i style={{ fontSize: "22px" }} className="ph-fill ph-heart"></i>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {k.like ? (
                      <>
                        <div style={{ position: "relative", height: "110px" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "56px",
                              height: "56px",
                              borderRadius: "14px",
                              background: "#FF3877",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              boxShadow: "0 10px 22px rgba(179,9,63,.35)",
                            }}
                          >
                            <i style={{ fontSize: "30px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "-9px",
                              marginLeft: "18px",
                              width: "0",
                              height: "0",
                              borderLeft: "10px solid transparent",
                              borderRight: "10px solid transparent",
                              borderTop: "11px solid #FF3877",
                            }}
                          ></span>
                          <span
                            style={{
                              position: "absolute",
                              left: "62px",
                              bottom: "46px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "9px",
                              background: "#FFB3C9",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(12deg)",
                            }}
                          >
                            <i style={{ fontSize: "18px" }} className="ph-fill ph-heart"></i>
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              left: "34px",
                              bottom: "88px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "#FFB3C9",
                              opacity: ".7",
                              color: "#FFFDF9",
                              display: "grid",
                              placeItems: "center",
                              transform: "rotate(-14deg)",
                            }}
                          >
                            <i style={{ fontSize: "12px" }} className="ph-fill ph-heart"></i>
                          </span>
                        </div>
                      </>
                    ) : null}
                    {k.ticket ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            background: "#FFFDF9",
                            border: "1.5px solid #451531",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 12px 26px rgba(69,21,49,.22)",
                            color: "#451531",
                          }}
                        >
                          <div
                            style={{
                              background: "#FFB3C9",
                              padding: "12px",
                              display: "grid",
                              placeItems: "center",
                              borderRight: "1.5px dashed #451531",
                            }}
                          >
                            <i style={{ fontSize: "28px" }} className={[k.icon].join(" ")}></i>
                          </div>
                          <div style={{ padding: "8px 14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "600",
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "#6B4A5C",
                              }}
                            >
                              {k.kicker}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-bodoni),serif",
                                fontVariationSettings: "'opsz' 28",
                                fontStyle: "italic",
                                fontSize: "22px",
                                lineHeight: "1.1",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {k.label}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </>
          ) : null}
          <div
            style={{
              maxWidth: "1360px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
              gap: "clamp(40px,6vw,100px)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <span
                data-r=""
                style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".12em", textTransform: "uppercase", color: "#A5BEFA" }}
              >
                N° 08 · RSVP
              </span>
              <h2
                data-r=""
                data-d="80"
                style={{
                  margin: "0",
                  fontFamily: "var(--font-bodoni),serif",
                  fontVariationSettings: "'opsz' 28",
                  fontWeight: "400",
                  fontSize: "clamp(50px,7vw,116px)",
                  lineHeight: ".92",
                  letterSpacing: "-.02em",
                }}
              >
                Vamos criar <em style={{ color: "#A5BEFA" }}>algo juntos?</em>
              </h2>
              <div
                data-r=""
                data-d="160"
                style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(248,245,242,.35)" }}
              >
                {v.contacts.map((c, _i55) => (
                  <Fragment key={_i55}>
                    <a
                      href={c.href}
                      target={c.target}
                      onClick={c.click}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "15px 0",
                        borderBottom: "1px solid rgba(248,245,242,.35)",
                        color: "#F8F5F2",
                        transition: "color .25s,padding .35s cubic-bezier(.2,.8,.2,1)",
                      }}
                      className="hv24"
                    >
                      <i style={{ fontSize: "20px" }} className={[c.icon].join(" ")}></i>
                      <span style={{ flex: "1", fontSize: "clamp(16px,1.5vw,20px)", fontWeight: "400", wordBreak: "break-word" }}>
                        {c.v}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#EFE4EA",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.hint}
                      </span>
                    </a>
                  </Fragment>
                ))}
              </div>
            </div>
            <div
              data-r=""
              data-d="120"
              style={{ position: "relative", justifySelf: "center", width: "min(100%,520px)", transform: "rotate(-1.5deg)" }}
            >
              <div
                style={{
                  position: "relative",
                  background: "#F8F5F2",
                  color: "#451531",
                  padding: "clamp(28px,4vw,48px) clamp(22px,3.4vw,42px)",
                  boxShadow: "0 40px 80px rgba(0,0,0,.35)",
                }}
              >
                <div style={{ position: "absolute", inset: "10px", border: "1px solid rgba(69,21,49,.4)", pointerEvents: "none" }}></div>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: ".14em", textTransform: "uppercase" }}>
                    Você está convidada(o)
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-script),cursive",
                      fontSize: "clamp(54px,5vw,72px)",
                      lineHeight: ".9",
                      color: "#B3093F",
                    }}
                  >
                    para criar comigo
                  </span>
                  <span style={{ fontSize: "14px", lineHeight: "1.5", maxWidth: "34ch" }}>
                    Marque o que a sua marca procura e eu recebo o seu convite por e-mail.
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "22px" }}>
                  {v.rsvp.map((o, _i56) => (
                    <Fragment key={_i56}>
                      <button
                        onClick={o.toggle}
                        style={{
                          appearance: "none",
                          background: "transparent",
                          border: "0",
                          borderBottom: "1px solid rgba(69,21,49,.18)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "11px 4px",
                          textAlign: "left",
                          color: "#451531",
                          fontFamily: "var(--font-hanken),sans-serif",
                          fontSize: "15px",
                          fontWeight: "400",
                          transition: "background .25s",
                        }}
                        className="hv25"
                      >
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            flex: "none",
                            border: "1px solid #451531",
                            borderRadius: "4px",
                            display: "grid",
                            placeItems: "center",
                            background: o.bg,
                            color: "#F8F5F2",
                            transition: "background .25s",
                          }}
                        >
                          <i style={{ fontSize: "13px", opacity: o.op }} className="ph ph-check"></i>
                        </span>
                        <span style={{ flex: "1" }}>{o.t}</span>
                      </button>
                    </Fragment>
                  ))}
                </div>
                <a
                  href={v.mailto}
                  style={{
                    marginTop: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    background: "#451531",
                    color: "#F8F5F2",
                    borderRadius: "999px",
                    padding: "15px 22px",
                    fontSize: "12px",
                    fontWeight: "500",
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    transition: "background .25s",
                  }}
                  className="hv26"
                >
                  Enviar convite <i style={{ fontSize: "16px" }} className="ph ph-paper-plane-tilt"></i>
                </a>
                <span style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#6B4A5C" }}>
                  {v.rsvpNote}
                </span>
              </div>
              <div
                data-spin=""
                style={{
                  position: "absolute",
                  right: "clamp(-30px,-1.6vw,-8px)",
                  top: "-34px",
                  width: "clamp(78px,20vw,96px)",
                  height: "clamp(78px,20vw,96px)",
                  borderRadius: "50%",
                  background: "#FF3877",
                  color: "#FFFDF9",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                  <defs>
                    <path id="v5circ2" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"></path>
                  </defs>
                  <text
                    style={{
                      fontFamily: "var(--font-hanken),sans-serif",
                      fontSize: "21px",
                      fontWeight: "600",
                      letterSpacing: "5px",
                      textTransform: "uppercase",
                    }}
                    fill="#FFFDF9"
                  >
                    <textPath href="#v5circ2">rsvp · rsvp · rsvp · rsvp ·</textPath>
                  </text>
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-bodoni),serif",
                    fontVariationSettings: "'opsz' 28",
                    fontStyle: "italic",
                    fontSize: "26px",
                    lineHeight: "1",
                  }}
                >
                  T
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              maxWidth: "1360px",
              margin: "clamp(70px,9vw,130px) auto 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <span
              style={{ fontFamily: "var(--font-script),cursive", fontSize: "clamp(90px,14vw,220px)", lineHeight: ".8", color: "#A5BEFA" }}
            >
              Tais Donnaruma
            </span>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px 20px",
                marginTop: "30px",
                paddingTop: "14px",
                borderTop: "1px solid rgba(248,245,242,.3)",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#EFE4EA",
              }}
            >
              <span>Mídia kit 2026</span>
              <span>Fun but chic</span>
              <span>@taisdonnaruma</span>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
