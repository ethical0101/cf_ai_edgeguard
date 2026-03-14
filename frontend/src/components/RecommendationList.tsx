interface RecommendationListProps {
  recommendations: string[];
}

export function RecommendationList({ recommendations }: RecommendationListProps): JSX.Element {
  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
      <h3 className="text-base font-semibold text-zinc-100">Recommendations</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {recommendations.length ? (
          recommendations.map((recommendation, index) => (
            <li key={`${recommendation}-${index}`} className="rounded-lg border border-sky-500/30 bg-sky-900/10 p-3">
              <p className="font-mono text-xs uppercase tracking-wider text-sky-200">Action {index + 1}</p>
              <p className="mt-1 text-zinc-200">{recommendation}</p>
            </li>
          ))
        ) : (
          <li className="rounded-lg border border-zinc-600 bg-zinc-800/70 p-3">No recommendations returned.</li>
        )}
      </ul>
    </section>
  );
}
