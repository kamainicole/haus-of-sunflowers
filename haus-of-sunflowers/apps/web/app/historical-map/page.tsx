import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import HistoricalMapCanvas from "@/components/map/HistoricalMapCanvas";
import { createClient } from "@/lib/supabase/server";
import type { MapLocation } from "@haus/shared-types";

export default async function HistoricalMapPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let locations: MapLocation[] = [];
  let isOwner = false;
  let errorMessage: string | null = null;

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: ownerData } = await supabase.schema("research").rpc("am_i_owner");
    isOwner = Boolean(ownerData);

    const { data, error } = await supabase
      .schema("research")
      .from("map_locations")
      .select("*")
      .order("state", { ascending: true })
      .order("location_name", { ascending: true });

    locations = (data ?? []) as MapLocation[];
    errorMessage = error?.message ?? null;
  }

  const plottableCount = locations.filter(
    (location) => location.latitude != null && location.longitude != null
  ).length;

  return (
    <AppShell isOwner={isOwner}>
      <section className="page-hero map-hero">
        <div>
          <div className="eyebrow">Where + when</div>
          <h1>Historical Map</h1>
          <p>
            Explore documented places connected to materials, practices, people, and source evidence.
            Approximate and exact locations remain grounded in the precision recorded in the archive.
          </p>
        </div>
        <aside className="hero-stat">
          <span>Mapped locations</span>
          <strong>{configured ? plottableCount : "—"}</strong>
        </aside>
      </section>

      {errorMessage && <p className="alert">Map data is temporarily unavailable. {errorMessage}</p>}

      <section className="map-toolbar">
        <div>
          <div className="eyebrow">Evidence layer</div>
          <strong>{locations.length} location records · {plottableCount} currently plottable</strong>
        </div>
        <div className="map-toolbar-note">
          Timeline, state shading, migration overlays, and advanced filters are the next map layer — not a replacement for the map itself.
        </div>
      </section>

      <HistoricalMapCanvas locations={locations} />
    </AppShell>
  );
}
