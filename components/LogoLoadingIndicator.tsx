export default function LogoLoadingIndicator() {
  return (
    <div className="olm-loading" role="status" aria-live="polite" aria-label="Cargando">
      <div className="olm-loading__mark" aria-hidden="true">
        <span className="olm-loading__ring" />
        <span className="olm-loading__wordmark">ÓPTICA OLM</span>
      </div>
      <span className="olm-loading__label">Cargando…</span>
    </div>
  );
}
