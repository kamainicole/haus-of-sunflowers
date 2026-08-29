import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haus of Sunflowers Research Archive",
  description: "Private scholarly research environment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
