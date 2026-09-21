"use client";

import dynamic from "next/dynamic";
import type { MapLocation } from "@haus/shared-types";

const ResearchMap = dynamic(() => import("@/components/map/ResearchMap"), {
  ssr: false,
  loading: () => (
    <div className="map-loading-state">
      <strong>Loading historical map…</strong>
      <span>Preparing location evidence.</span>
    </div>
  ),
});

export default function HistoricalMapCanvas({ locations }: { locations: MapLocation[] }) {
  return (
    <div className="historical-map-canvas">
      <ResearchMap locations={locations} center={[37.8, -96]} zoom={4} />
    </div>
  );
}
