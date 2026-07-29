import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CIRS - Confederação Internacional Real Soccer",
  description: "O maior servidor de Real Soccer X5 com PowerShot. Campeonatos, rankings, estatísticas e simulações.",
  keywords: ["CIRS", "Real Soccer", "HaxBall", "PowerShot", "X5", "Confederação", "Futebol"],
  authors: [{ name: "CIRS" }],
  openGraph: {
    title: "CIRS - Confederação Internacional Real Soccer",
    description: "O maior servidor de Real Soccer X5 com PowerShot.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CIRS - Confederação Internacional Real Soccer",
    description: "O maior servidor de Real Soccer X5 com PowerShot.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#050810",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
