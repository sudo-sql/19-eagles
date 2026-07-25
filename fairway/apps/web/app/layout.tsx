import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fairway — GPS, scoring & real improvement. No ads, ever.",
  description:
    "Free GPS rangefinder, group scoring, WHS handicap, and strokes-gained stats. Premium is $39.99/yr — everything else is free forever.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream-100 text-charcoal-950 font-sans antialiased">{children}</body>
    </html>
  );
}
