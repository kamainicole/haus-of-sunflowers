"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArchiveAtmosphere } from "@/components/ArchiveAtmosphere";
import { createClient } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; glyph: string };
type NavGroup = { label: string; href?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Explore",
    href: "/explore",
    items: [
      { href: "/research", label: "Historical Research", glyph: "⌕" },
      { href: "/historical-map", label: "Historical Map", glyph: "◎" },
      { href: "/sources", label: "Sources", glyph: "▤" },
    ],
  },
  {
    label: "Formulate",
    href: "/formulate",
    items: [
      { href: "/formulary", label: "The Formulary", glyph: "✦" },
      { href: "/materials", label: "Materials", glyph: "◌" },
      { href: "/formulas", label: "Formula Builder", glyph: "◇" },
    ],
  },
  {
    label: "Practice",
    href: "/practice",
    items: [
      { href: "/practice", label: "Self-Technologies", glyph: "◐" },
    ],
  },
  {
    label: "Learn",
    href: "/learn",
    items: [
      { href: "/learn", label: "Classroom", glyph: "▧" },
      { href: "/community", label: "Study Commons", glyph: "❈" },
    ],
  },
  {
    label: "Work With Me",
    href: "/work-with-me",
    items: [
      { href: "/work-with-me", label: "Services", glyph: "✧" },
      { href: "/book/consultation", label: "Consultations", glyph: "◫" },
      { href: "/book/reading", label: "Readings", glyph: "◈" },
    ],
  },
];

const OWNER_NAV = [
  { href: "/admin", label: "Owner Dashboard", glyph: "◆" },
  { href: "/admin/students", label: "Students", glyph: "◎" },
  { href: "/import-center", label: "Import Center", glyph: "⇧" },
  { href: "/dissertation", label: "Dissertation", glyph: "□" },
];

export function AppShell({ children, isOwner = false }: { children: ReactNode; isOwner?: boolean }) {
  const pathname = usePathname();
  const [detectedOwner, setDetectedOwner] = useState(isOwner);
  const ownerMode = isOwner || detectedOwner;

  useEffect(() => {
    if (isOwner) {
      setDetectedOwner(true);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    async function detectOwner() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await supabase.schema("research").rpc("am_i_owner");
      if (!cancelled && !error && data === true) setDetectedOwner(true);
    }

    void detectOwner();
    return () => { cancelled = true; };
  }, [isOwner]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname?.startsWith(href + "/"));

  return (
    <main className="product-shell">
      <ArchiveAtmosphere />

      <aside className="product-sidebar">
        <Link className="product-brand" href="/dashboard">
          <div className="product-brand-seal" aria-hidden="true"><span>H</span></div>
          <div>
            <strong>Haus of Sunflowers</strong>
            <small>Research · Practice · Education</small>
          </div>
        </Link>

        <Link href="/dashboard" className={isActive("/dashboard") ? "product-nav-item active" : "product-nav-item"}>
          <span className="nav-glyph" aria-hidden="true">⌂</span><span>Dashboard</span>
        </Link>

        <nav className="product-nav grouped-nav" aria-label="Primary navigation">
          {NAV_GROUPS.map((group) => (
            <section className="nav-group" key={group.label}>
              {group.href ? (
                <Link href={group.href} className="sidebar-section-label nav-group-label">{group.label}</Link>
              ) : (
                <div className="sidebar-section-label nav-group-label">{group.label}</div>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={isActive(item.href) ? "product-nav-item active" : "product-nav-item"}
                >
                  <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </section>
          ))}

          {ownerMode && (
            <section className="nav-group owner-nav-group">
              <div className="sidebar-section-label nav-group-label">Private workspace</div>
              {OWNER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? "product-nav-item active" : "product-nav-item"}
                >
                  <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </section>
          )}
        </nav>

        <div className="sidebar-book-card">
          <div className="sidebar-book-kicker">Choose your path</div>
          <strong>Research, formulate, practice, learn, or work together.</strong>
          <p>Each pathway stays distinct while living inside one Haus of Sunflowers hub.</p>
        </div>

        <div className="sidebar-footer">
          <span className="status-dot" />
          {ownerMode ? "Private owner workspace" : "Haus of Sunflowers hub"}
        </div>
      </aside>

      <section className="product-stage">
        <header className="product-topbar">
          <div>
            <div className="topbar-kicker">Haus of Sunflowers</div>
            <div className="topbar-title">Spirituality, self-technologies, research, and psychology-informed education without collapsing the boundaries between them.</div>
          </div>
          {ownerMode ? (
            <Link href="/admin" className="topbar-action"><span aria-hidden="true">◆</span>Owner Dashboard</Link>
          ) : (
            <span className="archive-stars" aria-hidden="true">✦ ✧ ✦</span>
          )}
        </header>

        <div className="product-content">
          <div className="content-light" aria-hidden="true" />
          {children}
        </div>
      </section>
    </main>
  );
}
