"use client";

import { useRouter } from "next/navigation";

type SeasonOption = { id: string; year: number; leagueName?: string };

export default function SeasonSelector({
  currentId,
  seasons,
}: {
  currentId: string;
  seasons: SeasonOption[];
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Temporada:</span>
      <select
        onChange={(e) => e.target.value && router.push(`/temporadas/${e.target.value}`)}
        defaultValue={currentId}
        className="glass border border-border px-3 py-1.5 text-sm rounded-lg bg-card"
      >
        <option value={currentId}>Atual</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.year} — {s.leagueName || "—"}
          </option>
        ))}
      </select>
    </div>
  );
}