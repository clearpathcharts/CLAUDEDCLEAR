export function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      <div className="container">
        <span>Live chart via clearpathtrader.com</span>
        <span aria-hidden="true">·</span>
        <span className="not-brokerage">(NOT A BROKERAGE.)</span>
      </div>
    </div>
  );
}
