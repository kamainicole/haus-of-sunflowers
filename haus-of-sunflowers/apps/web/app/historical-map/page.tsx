import { AppShell } from "@/components/AppShell";

export default function HistoricalMapPage() {
  return (
    <AppShell>
      <section className="page-hero map-hero">
        <div>
          <div className="eyebrow">Where + when</div>
          <h1>Historical Map</h1>
          <p>
            Map approved evidence by place, period, source, material, practice, and research status.
            The timeline layer will sit directly on this view.
          </p>
        </div>
      </section>

      <section className="map-stage-placeholder">
        <div className="map-watermark">US</div>
        <div className="map-placeholder-copy">
          <strong>Evidence map workspace</strong>
          <span>Existing map data and timeline controls will be connected here next.</span>
        </div>
      </section>
    </AppShell>
  );
}
