import type { Metadata } from "next";
import MidiaKit from "@/components/MidiaKit";

// Rota interna: mesma página do mídia kit, só com métricas e cases (sem valores e pacotes).
// Fica fora dos buscadores; compartilhe o link diretamente.
export const metadata: Metadata = {
  title: "Tais Donnaruma · Métricas e cases",
  description: "Números de Instagram, TikTok e YouTube e cases de publis de Tais Donnaruma (@taisdonnaruma).",
  robots: { index: false, follow: false },
};

export default function Metricas() {
  return <MidiaKit showPrices={false} />;
}
