/**
 * Map tile provider configuration.
 *
 * WHY THIS FILE EXISTS:
 * Leaflet needs a tile URL to draw the map background. Rather than
 * hardcoding one vendor into every map component, every component
 * imports `getTileConfig()` from here. Switching providers in
 * production — e.g. moving off free OSM tiles onto MapTiler or
 * Stadia once traffic grows — is a one-line env var change, not a
 * code change or a map-component rewrite.
 */

export type TileProviderKey =
  | "dev-osm"
  | "maptiler"
  | "stadia"
  | "mapbox"
  | "self-hosted";

export interface TileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
}

const providers: Record<TileProviderKey, () => TileConfig> = {
  // Free, unauthenticated, rate-limited — development only.
  // Do not point production traffic at OSM's public tile servers.
  "dev-osm": () => ({
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }),

  maptiler: () => {
    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_MAPTILER_KEY is not set");
    return {
      url: `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${key}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors',
      maxZoom: 20,
    };
  },

  stadia: () => {
    const key = process.env.NEXT_PUBLIC_STADIA_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_STADIA_KEY is not set");
    return {
      url: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${key}`,
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; OpenStreetMap contributors',
      maxZoom: 20,
    };
  },

  mapbox: () => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${token}`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
      maxZoom: 22,
    };
  },

  "self-hosted": () => {
    const url = process.env.NEXT_PUBLIC_SELF_HOSTED_TILE_URL;
    if (!url) throw new Error("NEXT_PUBLIC_SELF_HOSTED_TILE_URL is not set");
    return {
      url,
      attribution: process.env.NEXT_PUBLIC_SELF_HOSTED_TILE_ATTRIBUTION ?? "",
      maxZoom: 20,
    };
  },
};

export function getTileConfig(): TileConfig {
  const key = (process.env.NEXT_PUBLIC_TILE_PROVIDER as TileProviderKey) || "dev-osm";
  const factory = providers[key];
  if (!factory) {
    throw new Error(
      `Unknown TILE_PROVIDER "${key}". Valid options: ${Object.keys(providers).join(", ")}`
    );
  }
  return factory();
}
