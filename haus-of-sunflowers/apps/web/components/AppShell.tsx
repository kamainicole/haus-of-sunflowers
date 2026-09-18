"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", glyph: "⌂" },
  { href: "/formulary", label: "Formulary", glyph: "✦" },
  { href: "/materials", label: "Materials", glyph: "◌" },
  { href: "/formulas", label: "Formula Builder", glyph: "◇" },
  { href: "/sources", label: "Sources", glyph: "▤" },
  { href: "/historical-map", label: "Historical Map", glyph: "◎" },
  { href: "/research", label: "Historical Research", glyph: "⌕" },
];

const OWNER_NAV = [
  { href: "/import-center", label: "Import Center", glyph: "⇧" },
  { href: "/dissertation", label: "Dissertation", glyph: "□" },
];

export function AppShell({ children, isOwner = false }: { children: ReactNode; isOwner?: boolean }) {
  const pathname = usePathname();
  const navItems = isOwner ? [...NAV, ...OWNER_NAV] : NAV;

  return (
    <main className="product-shell">
      <aside className="product-sidebar">
        <Link className="product-brand" href="/dashboard">
          <div className="product-brand-seal" aria-hidden="true">
            <span>H</span>
          </div>
          <div>
            <strong>Haus of Sunflowers</strong>
            <small>The Rootworker&apos;s Formulary</small>
          </div>
        </Link>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="product-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "product-nav-item active" : "product-nav-item"}
              >
                <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-book-card">
          <div className="sidebar-book-kicker">Book-led archive</div>
          <strong>Formulation first.</strong>
          <p>
            Book content is the core experience. Historical evidence lives as the deeper
            research layer.
          </p>
        </div>

        <div className="sidebar-footer">
          <span className="status-dot" />
          {isOwner ? "Owner research workspace" : "Member formulary access"}
        </div>
      </aside>

      <section className="product-stage">
        <header className="product-topbar">
          <div>
            <div className="topbar-kicker">Haus of Sunflowers Research Archive</div>
            <div className="topbar-title">Formulate with purpose. Research with evidence.</div>
          </div>
          {isOwner ? (
            <Link href="/import-center" className="topbar-action">
              <span aria-hidden="true">＋</span>
              Import Book / Source
            </Link>
          ) : (
            <span className="topbar-kicker">Member View</span>
          )}
        </header>

        <div className="product-content">{children}</div>
      </section>
    </main>
  );
}
