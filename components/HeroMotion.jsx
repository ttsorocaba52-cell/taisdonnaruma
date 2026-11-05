"use client";
// Banner da capa em motion: toca uma vez e termina parado no último frame.
// Quem prefere menos movimento, ou não consegue dar autoplay, vê direto a imagem final.
import { useEffect, useRef, useState } from "react";

const WEBM = "/assets/banner-hero.webm";
const MP4 = "/assets/banner-hero.mp4";
const STILL = "/assets/banner-hero-end.webp";
const fill = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" };

export default function HeroMotion({ alt = "Tais Donnaruma · Mídia kit" }) {
  const ref = useRef(null);
  // wait: carregando · playing: vídeo tocando · done: imagem final fixa
  const [phase, setPhase] = useState("wait");
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
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
    const p = v.play();
    if (p && p.catch) p.catch(finish);
    return () => clearTimeout(t);
  }, []);

  return (
    <span style={{ display: "block", position: "absolute", inset: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STILL}
        alt={alt}
        fetchPriority="high"
        style={{ ...fill, opacity: phase === "done" ? 1 : 0, transition: played ? "none" : "opacity .6s ease" }}
      />
      <video
        ref={ref}
        muted
        playsInline
        preload="auto"
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
        <source src={WEBM} type="video/webm" />
        <source src={MP4} type="video/mp4" />
      </video>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={STILL} alt={alt} style={fill} />
      </noscript>
    </span>
  );
}
