"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getTileConfig } from "@/config/mapTiles";
import type { MapLocation } from "@haus/shared-types";

interface ResearchMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
}

/**
 * Renders map_locations from research.map_locations.
 * CircleMarker is used instead of Leaflet's default image-based Marker so
 * pins do not disappear when bundled marker-icon assets are unavailable.
 * location_precision is shown in the popup so the map never implies more
 * certainty than the underlying historical record supports.
 */
export default function ResearchMap({
  locations,
  center = [32.3, -90.2],
  zoom = 6,
}: ResearchMapProps) {
  const tile = getTileConfig();

  const plottable = locations.filter(
    (loc) => loc.latitude != null && loc.longitude != null
  );

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "600px", width: "100%" }}>
      <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
      {plottable.map((loc) => (
        <CircleMarker
          key={loc.id}
          center={[loc.latitude!, loc.longitude!]}
          radius={7}
          pathOptions={{ weight: 2, fillOpacity: 0.85 }}
        >
          <Popup>
            <strong>{loc.location_name}</strong>
            <br />
            Precision: {loc.location_precision}
            {loc.description && (
              <>
                <br />
                {loc.description}
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
