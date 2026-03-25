import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CssBaseline from "@mui/material/CssBaseline";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeUp - Options Trading Platform",
  description: "Real-time options trading with Black-Scholes pricing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CssBaseline />
        {children}
      </body>
    </html>
  );
}
