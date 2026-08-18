import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Deterministic pseudo-random amplitudes so SSR and client match. */
function amplitudes(count: number, seed = 7) {
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < count; i++) {
    x = (x * 9301 + 49297) % 233280;
    const base = x / 233280;
    // Heart-beat-like envelope: two peaks per cycle.
    const phase = (i % 24) / 24;
    const envelope =
      Math.exp(-Math.pow((phase - 0.15) * 7, 2)) +
      0.65 * Math.exp(-Math.pow((phase - 0.42) * 8, 2)) +
      0.08;
    out.push(Math.min(1, envelope * (0.65 + base * 0.5)));
  }
  return out;
}

export function WaveformBars({
  bars = 64,
  active = false,
  className,
  seed = 7,
}: {
  bars?: number;
  active?: boolean;
  className?: string;
  seed?: number;
}) {
  const values = useMemo(() => amplitudes(bars, seed), [bars, seed]);
  return (
    <div aria-hidden className={cn("flex h-16 w-full items-center gap-[3px]", className)}>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-full", active ? "bg-destructive/70" : "bg-secondary/60")}
          style={{
            height: `${Math.max(6, v * 100)}%`,
            transformOrigin: "center",
            animation: active ? `ea-bar 1.1s ease-in-out ${(i % 12) * 0.06}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/** ECG-style trace line, used on the landing hero and processing screen. */
export function EcgTrace({ className, animate = true }: { className?: string; animate?: boolean }) {
  const path = useMemo(() => {
    const segments: string[] = [];
    const width = 1200;
    const cycles = 6;
    const cycle = width / cycles;
    for (let c = 0; c < cycles; c++) {
      const x = c * cycle;
      segments.push(
        `M ${x} 60 H ${x + cycle * 0.22}` +
          ` l ${cycle * 0.05} -10 l ${cycle * 0.05} 12` +
          ` l ${cycle * 0.04} 8 l ${cycle * 0.05} -46 l ${cycle * 0.05} 60 l ${cycle * 0.05} -24` +
          ` H ${x + cycle * 0.62}` +
          ` q ${cycle * 0.06} -20 ${cycle * 0.12} 0` +
          ` H ${x + cycle}`,
      );
    }
    return segments.join(" ");
  }, []);

  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={cn("h-24 w-full", className)}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.18}
      />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={1200}
        style={animate ? { animation: "ea-trace 6s linear infinite" } : undefined}
      />
    </svg>
  );
}
