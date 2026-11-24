import { requireIdentity } from "../../../../cursor/identity";
import { sql } from "@/lib/db";
import { isDeskId } from "@/lib/desks";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return Response.json({ error: "person_required" }, { status: 403 });
  }

  let body: { preferredDesk?: string };
  try {
    body = (await request.json()) as { preferredDesk?: string };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isDeskId(body.preferredDesk)) {
    return Response.json({ error: "invalid_desk" }, { status: 400 });
  }

  await sql(
    `insert into member_preferences (viewer_sub, preferred_desk, updated_at)
     values ($1, $2, now())
     on conflict (viewer_sub) do update set preferred_desk = excluded.preferred_desk, updated_at = now()`,
    [identity.sub, body.preferredDesk],
  );

  return Response.json(
    { preferredDesk: body.preferredDesk },
    { headers: { "cache-control": "private, no-store" } },
  );
}
