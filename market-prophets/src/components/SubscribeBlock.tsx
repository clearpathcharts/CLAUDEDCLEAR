import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

/** Replace `YOUR_FORM_ID` with Buttondown/Beehiiv embed when email DNS is ready. */
export function SubscribeBlock() {
  return (
    <section className="mp-glow rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-black p-6 space-y-4">
      <div className="flex items-center gap-2 text-violet-300">
        <Mail className="w-5 h-5" />
        <h2 className="font-semibold">Daily brief in your inbox</h2>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        Subscribe for the morning edition when email is live. For now, bookmark{" "}
        <Link to="/brief/latest" className="text-violet-300 hover:underline">
          today&apos;s brief
        </Link>{" "}
        or add{" "}
        <a href="/api/briefs/latest" className="text-violet-300 hover:underline">
          JSON feed
        </a>{" "}
        to your reader.
      </p>
      <p className="text-xs text-zinc-600">
        Tip: connect Buttondown or Beehiiv and paste their embed form here — no backend changes needed.
      </p>
    </section>
  );
}
