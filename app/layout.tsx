import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tic-Tac-Toe — Two-Player Studio Edition",
  description:
    "A tactile, editorial two-player Tic-Tac-Toe experience built with Next.js, React 19, Motion, and Web Audio.",
  applicationName: "Tic-Tac-Toe",
  keywords: ["Tic-Tac-Toe", "Two-Player Game", "Next.js", "React 19"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf9f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink font-sans selection:bg-blue-player/15 selection:text-ink flex flex-col">
        {children}
      </body>
    </html>
  );
}
