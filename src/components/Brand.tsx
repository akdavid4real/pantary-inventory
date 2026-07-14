import brandSheet from "../../assets/auth/brand-sheet.webp";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`ptp-brand${inverse ? " ptp-brand--inverse" : ""}`}>
      <span className="ptp-brand-mark" style={{ backgroundImage: `url(${brandSheet})` }} aria-hidden="true" />
      <strong>Pantry-to-Plate</strong>
    </span>
  );
}

export { brandSheet };
