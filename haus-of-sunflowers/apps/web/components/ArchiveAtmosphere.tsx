export function ArchiveAtmosphere() {
  return (
    <div className="archive-atmosphere-scene" aria-hidden="true">
      <div className="archive-veil" />
      <div className="sanctuary-light sanctuary-light-one" />
      <div className="sanctuary-light sanctuary-light-two" />
      <div className="sanctuary-shadow" />

      <div className="archive-botanical-layer botanical-leaves-left" />
      <div className="archive-botanical-layer botanical-leaves-right" />
      <div className="archive-botanical-layer botanical-sunflower" />
      <div className="archive-botanical-layer botanical-sunflower-ghost" />

      <div className="archive-sunflower-halo">
        <span className="halo-ring ring-one" />
        <span className="halo-ring ring-two" />
        <span className="halo-ring ring-three" />
        <span className="halo-seed seed-1" />
        <span className="halo-seed seed-2" />
        <span className="halo-seed seed-3" />
        <span className="halo-seed seed-4" />
        <span className="halo-seed seed-5" />
        <span className="halo-seed seed-6" />
      </div>

      <div className="sanctuary-candle-glow candle-one" />
      <div className="sanctuary-candle-glow candle-two" />

      {Array.from({ length: 20 }).map((_, index) => (
        <span key={index} className={`archive-mote mote-${index + 1}`} />
      ))}
    </div>
  );
}
