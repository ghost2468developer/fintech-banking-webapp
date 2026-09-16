import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600", "700"],
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Saints Bank - Precision banking",
  description:
    "Person-to-person transfers, three account types, and an immutable ledger behind every line.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${plex.variable}`}
    >
      <body className="bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
