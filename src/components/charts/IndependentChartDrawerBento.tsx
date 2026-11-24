/**
 * Small bento that sits beside the 1H control.
 * Turns this chart's own pattern drawer on or off.
 */
export function IndependentChartDrawerBento({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-testid="independent-chart-drawer"
      title={
        on
          ? "Independent chart drawer is on. Click to hide this chart's pattern lines."
          : "Independent chart drawer is off. Click to draw this chart's pattern lines."
      }
      onClick={() => onChange(!on)}
      className="inline-flex shrink-0 flex-col items-center justify-center rounded-md border px-1.5 py-0.5 min-w-[58px] leading-none"
      style={{
        borderColor: on ? "#BF00FF" : "rgba(255,255,255,0.16)",
        background: on ? "rgba(191,0,255,0.18)" : "rgba(0,0,0,0.55)",
        color: on ? "#F0D4FF" : "#a1a1aa",
        boxShadow: on ? "0 0 12px rgba(191,0,255,0.35)" : "none",
      }}
    >
      <span className="text-[7px] font-black uppercase tracking-wide">Drawer</span>
      <span className="text-[9px] font-black uppercase">{on ? "On" : "Off"}</span>
    </button>
  );
}
