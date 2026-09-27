import type { Metadata } from "next";
import "./globals.css";
import "./black-nouveau.css";
import "./contrast-fixes.css";
import "./archive-atmosphere.css";
import "./archive-cinematic.css";
import "./archive-visibility-fix.css";
import "./sanctuary-botanicals.css";
import "./sidebar-scroll.css";
import "./archive-flows.css";

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
