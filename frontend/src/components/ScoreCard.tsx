interface ScoreCardProps {
  label: string;
  value: number;
  accent: "sky" | "amber";
}

export function ScoreCard({ label, value, accent }: ScoreCardProps): JSX.Element {
  const accentClass = accent === "sky" ? "text-sky-300" : "text-amber-300";
  const barClass = accent === "sky" ? "bg-gradient-to-r from-sky-500 to-cyan-400" : "bg-gradient-to-r from-amber-500 to-orange-400";
  const percentage = Math.round(Math.min((value / 10) * 100, 100));
  const widthClass =
    percentage >= 95
      ? "w-full"
      : percentage >= 85
        ? "w-5/6"
        : percentage >= 75
          ? "w-3/4"
          : percentage >= 65
            ? "w-2/3"
            : percentage >= 55
              ? "w-7/12"
              : percentage >= 45
                ? "w-1/2"
                : percentage >= 35
                  ? "w-5/12"
                  : percentage >= 25
                    ? "w-1/3"
                    : percentage >= 15
                      ? "w-1/4"
                      : "w-1/6";

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className={`mt-2 text-5xl font-bold leading-none ${accentClass}`}>{value.toFixed(1)}</p>
      <p className="mt-1 text-xs text-zinc-400">out of 10</p>
      <div className="mt-4 h-2.5 rounded-full bg-zinc-700/80">
        <div className={`${barClass} ${widthClass} h-2 rounded-full`} />
      </div>
    </div>
  );
}
