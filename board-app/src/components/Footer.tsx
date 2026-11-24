import { InstallAppButton } from "./InstallAppButton";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <InstallAppButton />
        <strong>Clear Path Trader</strong> · Clear Path Markets Science Corp. ·{" "}
        <a href="https://clearpathtrader.com" rel="noopener noreferrer" target="_blank">
          clearpathtrader.com
        </a>
        <p className="legal">
          Educational and analytical use only. Not investment advice. Clear Path Trader is{" "}
          <span className="not-brokerage">(NOT A BROKERAGE.)</span> Does not hold customer funds and
          does not execute trades. Past or simulated market data is not a guarantee of future results.
        </p>
      </div>
    </footer>
  );
}
