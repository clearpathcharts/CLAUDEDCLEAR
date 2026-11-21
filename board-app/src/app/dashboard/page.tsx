import { MemberDashboard } from "@/components/MemberDashboard";

export const metadata = {
  title: "Member dashboard",
};

export default function DashboardPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1>Member dashboard</h1>
        <p>
          Watchlist and saved desk preference keyed to your Cursor viewer identity. Locally this uses
          a simulated viewer and in-memory Postgres (PGlite); published private/team apps use the
          provisioned database.
        </p>
      </div>
      <MemberDashboard />
    </div>
  );
}
