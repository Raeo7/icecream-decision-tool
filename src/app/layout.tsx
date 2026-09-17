import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { GameProvider } from "@/lib/GameProvider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#121414" },
  ],
};

export const metadata: Metadata = {
  title: "Pork & Garlic Ice Cream — Decision Tool",
  description: "Plan the seasons of the classroom simulation against the class you are playing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <div>
            <Link href="/">Year 1</Link>
            <Link href="/year2">Year 2 winter</Link>
          </div>
        </nav>
        <main>
          <GameProvider>{children}</GameProvider>
        </main>
      </body>
    </html>
  );
}
