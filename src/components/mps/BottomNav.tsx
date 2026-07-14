import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Droplets, Zap, Shield, Clock } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/water", label: "Water", icon: Droplets },
  { to: "/electricity", label: "Power", icon: Zap },
  { to: "/watchman", label: "Watchman", icon: Shield },
  { to: "/history", label: "History", icon: Clock },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(560px,calc(100%-24px))]">
      <div className="flex items-center justify-around rounded-full bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.35)] border border-white/60 px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-250 ${
                active ? "bg-primary text-white shadow-md scale-105" : "text-slate-500 hover:text-primary"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
