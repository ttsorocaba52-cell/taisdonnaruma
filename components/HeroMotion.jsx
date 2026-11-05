"use client";
// Banner da capa em motion: toca uma vez e termina parado no último frame.
// Celular (abaixo de 760px) usa a versão vertical 9:16; tablet e desktop, a horizontal 16:9.
// Quem prefere menos movimento, ou não consegue dar autoplay, vê direto a imagem final.
import { useEffect, useRef, useState } from "react";

export const MOBILE_QUERY = "(max-width: 759px)";
const SRC = {
  desktop: { webm: "/assets/banner-hero.webm", mp4: "/assets/banner-hero.mp4", still: "/assets/banner-hero-end.webp" },
  mobile: { webm: "/assets/banner-hero-mobile.webm", mp4: "/assets/banner-hero-mobile.mp4", still: "/assets/banner-hero-mobile-end.webp" },
};
const fill = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" };

export default function HeroMotion({ alt = "Tais Donnaruma · Mídia kit" }) {
  const ref = useRef(null);
  // qual vídeo usar só é decidido no navegador, para baixar apenas um deles
  const [variant, setVariant] = useState(null);
  // wait: carregando · playing: vídeo tocando · done: imagem final fixa
  const [phase, setPhase] = useState("wait");
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const mq = matchMedia(MOBILE_QUERY);
    setVariant(mq.matches ? "mobile" : "desktop");
    // girou o aparelho ou redimensionou a janela: troca para a imagem final da outra versão
    const onChange = (e) => {
      setVariant(e.matches ? "mobile" : "desktop");
      setPlayed(false);
      setPhase("done");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !variant || phase === "done") return;
    const finish = () => setPhase("done");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      finish();
      return;
    }
    // Se o vídeo não começar em até 3s (rede lenta ou autoplay bloqueado), mostra a imagem final.
    const t = setTimeout(() => {
      if (v.paused) {
        v.pause();
        finish();
      }
    }, 3000);
    v.load();
    const p = v.play();
    if (p && p.catch) p.catch(finish);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  const src = variant ? SRC[variant] : null;

  return (
    <span style={{ display: "block", position: "absolute", inset: 0 }}>
      {/* a imagem final certa para cada tela, mesmo antes do JavaScript */}
      <picture>
        <source media={MOBILE_QUERY} srcSet={SRC.mobile.still} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SRC.desktop.still}
          alt={alt}
          fetchPriority="high"
          style={{ ...fill, opacity: phase === "done" ? 1 : 0, transition: played ? "none" : "opacity .6s ease" }}
        />
      </picture>
      <video
        ref={ref}
        key={variant || "none"}
        muted
        playsInline
        preload={src ? "auto" : "none"}
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        onPlaying={() => {
          setPlayed(true);
          setPhase((ph) => (ph === "done" ? ph : "playing"));
        }}
        onEnded={() => setPhase("done")}
        style={{ ...fill, opacity: played ? 1 : 0, pointerEvents: "none" }}
      >
        {src ? <source src={src.webm} type="video/webm" /> : null}
        {src ? <source src={src.mp4} type="video/mp4" /> : null}
      </video>
      <noscript>
        <picture>
          <source media={MOBILE_QUERY} srcSet={SRC.mobile.still} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SRC.desktop.still} alt={alt} style={fill} />
        </picture>
      </noscript>
    </span>
  );
}
