import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIA-like Interactive Portfolio",
  description: "Interactive desktop-first portfolio prototype."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
