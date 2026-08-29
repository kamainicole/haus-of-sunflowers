"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getTileConfig } from "@/config/mapTiles";
import type { MapLocation } from "@haus/shared-types";

interface ResearchMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
}

/**
 * Renders map_locations from research.map_locations. Note that
 * location_precision (exact / approximate / county_level / etc) is
 * shown in the popup deliberately — the map never implies more
 * precision than the underlying historical record actually supports.
 */
export default function ResearchMap({
  locations,
  center = [32.3, -90.2], // rough Mississippi-ish default; adjust per your data's center of gravity
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
        <Marker key={loc.id} position={[loc.latitude!, loc.longitude!]}>
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
        </Marker>
      ))}
    </MapContainer>
  );
}
