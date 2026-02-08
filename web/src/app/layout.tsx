import type { Metadata } from "next";
// We don't import Inter anymore
import "./globals.css";
import Shell from "@/components/layout/Shell";
import { Playfair_Display, Outfit } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sri Sai Senthil Travels | Premium Bus & Van Rentals Since 1987",
  description: "Experience the trust of nearly four decades. From luxury buses to premium vans, we provide the perfect companion for your travels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable}`}>
      {/* 
         We are using CSS variables to apply these fonts globally in globals.css 
         (body { font-family: 'Outfit'... } etc)
         but relying on the class names injected here is also good practice.
       */}
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
