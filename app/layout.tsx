import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ecclesia · Gewächshaus",
  description: "Musikerplattform der Ecclesia Church",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
