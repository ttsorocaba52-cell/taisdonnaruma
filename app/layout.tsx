import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk, Mrs_Saint_Delafield } from "next/font/google";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/fill";
import "./globals.css";
import "./hover.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const script = Mrs_Saint_Delafield({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tais Donnaruma · Mídia Kit 2026",
  description:
    "Mídia kit de Tais Donnaruma (@taisdonnaruma): moda, lifestyle, beleza e humor. Números de Instagram, TikTok e YouTube, cases, formatos e contato comercial.",
  openGraph: {
    title: "Tais Donnaruma · Mídia Kit 2026",
    description: "Moda, lifestyle, beleza e humor, com elegância e zero tédio.",
    images: ["/assets/banner-hero.webp"],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#451531",
};

// Hides [data-r]/[data-ri] elements before first paint so they can reveal on scroll.
// Skipped when the visitor prefers reduced motion.
const revealScript = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('rv')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bodoni.variable} ${hanken.variable} ${script.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
