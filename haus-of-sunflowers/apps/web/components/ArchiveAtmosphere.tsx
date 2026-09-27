export function ArchiveAtmosphere() {
  return (
    <div className="archive-atmosphere-scene" aria-hidden="true">
      <div className="archive-veil" />
      <div className="archive-orb archive-orb-one" />
      <div className="archive-orb archive-orb-two" />
      <div className="archive-orb archive-orb-three" />

      <svg
        className="archive-botanical archive-botanical-left"
        viewBox="0 0 340 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M54 742C94 614 92 492 135 381C174 279 232 190 288 60" />
        <path d="M111 522C72 493 48 456 30 414" />
        <path d="M133 448C177 423 204 389 224 346" />
        <path d="M164 355C127 323 103 288 86 246" />
        <path d="M198 276C238 253 266 219 287 178" />
        <path d="M93 504C65 486 48 461 39 432C72 439 96 458 111 487C107 494 101 500 93 504Z" />
        <path d="M143 433C175 402 205 389 235 391C226 425 206 447 174 458C160 454 150 446 143 433Z" />
        <path d="M151 337C119 316 100 289 94 256C128 262 151 281 165 312C163 323 158 331 151 337Z" />
        <path d="M208 267C236 239 265 228 294 233C285 266 266 287 236 297C223 292 214 282 208 267Z" />
      </svg>

      <svg
        className="archive-botanical archive-botanical-right"
        viewBox="0 0 340 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M286 742C246 614 248 492 205 381C166 279 108 190 52 60" />
        <path d="M229 522C268 493 292 456 310 414" />
        <path d="M207 448C163 423 136 389 116 346" />
        <path d="M176 355C213 323 237 288 254 246" />
        <path d="M142 276C102 253 74 219 53 178" />
        <path d="M247 504C275 486 292 461 301 432C268 439 244 458 229 487C233 494 239 500 247 504Z" />
        <path d="M197 433C165 402 135 389 105 391C114 425 134 447 166 458C180 454 190 446 197 433Z" />
        <path d="M189 337C221 316 240 289 246 256C212 262 189 281 175 312C177 323 182 331 189 337Z" />
        <path d="M132 267C104 239 75 228 46 233C55 266 74 287 104 297C117 292 126 282 132 267Z" />
      </svg>

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

      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} className={`archive-mote mote-${index + 1}`} />
      ))}
    </div>
  );
}
