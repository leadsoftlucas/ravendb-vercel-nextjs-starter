import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "RavenDB + Next.js Starter — Vercel Deploy Template";
const description =
  "Open-source Next.js (App Router) starter wired to RavenDB Cloud. Deploy to Vercel in one click and explore document storage plus native full-text search over the Northwind sample dataset — no external search service required.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "RavenDB",
    "RavenDB Cloud",
    "Next.js",
    "Vercel",
    "Vercel Deploy Button",
    "NoSQL database",
    "document database",
    "full-text search",
    "TypeScript starter",
    "Northwind sample database",
  ],
  authors: [{ name: "Lucas R. Tavares", url: "https://github.com/leadsoftlucas" }],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "ravendb-vercel-nextjs-starter",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
