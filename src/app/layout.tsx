import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sri Sai Senthil Travels | Premium Bus & Van Rentals Since 1987",
  description: "Experience luxury travel with Sri Sai Senthil Travels. Providing premium bus and van rentals for tours across India for over 35 years.",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" defer />
      </body>
    </html>
  );
}
