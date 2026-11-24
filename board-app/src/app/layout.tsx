import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DemoBanner } from "@/components/DemoBanner";
import "./globals.css";

const siteUrl = "https://clearpath-trader-board.vercel.app";
const ogImage = {
  url: "/og-desks.png",
  width: 1024,
  height: 534,
  alt: "ClearPath Trader desks — Institutional, Fundamental, and Retail",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Clear Path Trader",
    template: "%s · Clear Path Trader",
  },
  description:
    "Analysis-first educational financial markets platform. Four desks. Your World Connected. Education. (NOT A BROKERAGE). Clear Path Markets Science Corp.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Clear Path Trader",
    title: "Clear Path Trader",
    description:
      "One chart site with desks, education, and Your World Connected. Live via clearpathtrader.com. (NOT A BROKERAGE).",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clear Path Trader",
    description:
      "One chart site with desks, education, and Your World Connected. Live via clearpathtrader.com. (NOT A BROKERAGE).",
    images: [ogImage.url],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="shell">
          <Nav />
          <DemoBanner />
          <main className="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
