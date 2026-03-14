interface IssueListProps {
  issues: string[];
}

export function IssueList({ issues }: IssueListProps): JSX.Element {
  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
      <h3 className="text-base font-semibold text-zinc-100">Detected Issues</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {issues.length ? (
          issues.map((issue, index) => (
            <li key={`${issue}-${index}`} className="rounded-lg border border-red-500/30 bg-red-900/10 p-3">
              <p className="font-mono text-xs uppercase tracking-wider text-red-200">Issue {index + 1}</p>
              <p className="mt-1 text-zinc-200">{issue}</p>
            </li>
          ))
        ) : (
          <li className="rounded-lg border border-emerald-500/30 bg-emerald-900/10 p-3">
            No issues detected by the model.
          </li>
        )}
      </ul>
    </section>
  );
}
