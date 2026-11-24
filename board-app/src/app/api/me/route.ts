import { getIdentity } from "../../../../cursor/identity";
import { isLiveDatabase, sql } from "@/lib/db";
import { isDeskId } from "@/lib/desks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return Response.json(
      {
        viewer: null,
        preferredDesk: "retail",
        watchlist: [],
        storage: isLiveDatabase() ? "postgres" : "memory",
        reason: identity.reason,
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  }

  if (identity.kind === "key") {
    return Response.json(
      { error: "person_required" },
      { status: 403, headers: { "cache-control": "private, no-store" } },
    );
  }

  const prefs = await sql<{ preferred_desk: string }>(
    "select preferred_desk from member_preferences where viewer_sub = $1",
    [identity.sub],
  );
  const watchlist = await sql<{ symbol: string; label: string }>(
    "select symbol, label from watchlist_items where viewer_sub = $1 order by created_at asc",
    [identity.sub],
  );

  const preferredDesk = prefs[0]?.preferred_desk;
  return Response.json(
    {
      viewer: {
        name: identity.name || "Member",
        email: identity.email,
        simulated: identity.simulated === true,
      },
      preferredDesk: isDeskId(preferredDesk) ? preferredDesk : "retail",
      watchlist,
      storage: isLiveDatabase() ? "postgres" : "memory",
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
