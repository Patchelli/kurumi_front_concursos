type BrandLockupProps = { inverse?: boolean };

export function BrandLockup({ inverse = false }: BrandLockupProps) {
  return (
    <div className={`brand-lockup${inverse ? ' inverse' : ''}`} aria-label="Kurumí">
      <span className="brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Kurumí</span>
    </div>
  );
}
