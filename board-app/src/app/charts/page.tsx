import { ChartWorkspace } from "@/components/ChartWorkspace";

export const metadata = {
  title: "Charts & desks",
};

export default function ChartsPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1>Chart workspace</h1>
        <p>
          Candles with symbol search across stocks, forex, crypto, and commodities. Switch desks to
          change layout tone — Neurodivergent uses a calmer sensory profile.
        </p>
      </div>
      <ChartWorkspace />
    </div>
  );
}
