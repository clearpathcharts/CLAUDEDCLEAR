import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../contexts/FirebaseContext";

type Props = {
  variant?: "fixed" | "inline";
  className?: string;
};

export function SessionLogoutButton({ variant = "inline", className = "" }: Props) {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
    } catch {
      setBusy(false);
    }
  };

  const placement =
    variant === "fixed"
      ? "fixed z-[220] right-3 bottom-[5.5rem] md:bottom-auto md:top-3"
      : "inline-flex";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="Log out"
      data-session-logout
      className={`${placement} items-center gap-1.5 rounded-full border border-red-500/45 bg-black/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-600 hover:text-white disabled:opacity-60 ${className}`}
    >
      <LogOut size={12} aria-hidden="true" />
      {busy ? "Signing out…" : "Log out"}
    </button>
  );
}

export default SessionLogoutButton;
