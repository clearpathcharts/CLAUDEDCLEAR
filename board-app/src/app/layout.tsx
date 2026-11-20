import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DemoBanner } from "@/components/DemoBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClearPath Trader — Board Demo",
    template: "%s · ClearPath Trader",
  },
  description:
    "Analysis-first educational financial markets platform. Four desks. Not a brokerage. Clear Path Markets Science Corp.",
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
