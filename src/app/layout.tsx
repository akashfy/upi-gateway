import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kodelyx Pay — Premium UPI Auto-Detection Gateway",
  description: "Secure, instant, self-hosted UPI payment verification system for digital products with 0% transaction fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
