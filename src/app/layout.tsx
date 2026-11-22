import type { Metadata, Viewport } from "next";
import { Archivo, Bai_Jamjuree, IBM_Plex_Mono } from "next/font/google";
import { THEME_STORAGE_KEY } from "@/lib/site";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "MiniML · Teach a tiny chip to see, think, and hear",
  description:
    "MiniML is an upcoming Hack Club YSWS. Ship a machine learning model that runs on a $5-10 microcontroller, and we ship you the board, sensors and other goodies.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1613" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable} ${baiJamjuree.variable} h-full antialiased`}
    >
      <head>
        {/* Runs before paint: a saved choice wins, otherwise follow the system theme, with no light flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
