"use client";

interface MatchStatisticsProps {
  possession: { red?: number; blue?: number };
  teamStats?: {
    red?: {
      shots?: number;
      xg?: number;
      corners?: number;
      blocks?: number;
      interceptions?: number;
      saves?: number;
      fastestShotKmh?: number;
    };
    blue?: {
      shots?: number;
      xg?: number;
      corners?: number;
      blocks?: number;
      interceptions?: number;
      saves?: number;
      fastestShotKmh?: number;
    };
  };
  homeTeamName: string;
  awayTeamName: string;
}

function StatBar({
  label,
  homeValue,
  awayValue,
  homeLabel,
  awayLabel,
  inverse,
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  homeLabel?: string;
  awayLabel?: string;
  inverse?: boolean;
}) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  const homeBetter = inverse ? homeValue < awayValue : homeValue > awayValue;
  const awayBetter = inverse ? awayValue < homeValue : awayValue > homeValue;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${homeBetter ? "text-gold" : "text-foreground"}`}>
          {homeLabel ?? homeValue}
        </span>
        <span className="text-muted text-[10px] uppercase tracking-wider">{label}</span>
        <span className={`font-semibold ${awayBetter ? "text-gold" : "text-foreground"}`}>
          {awayLabel ?? awayValue}
        </span>
      </div>
      <div className="flex h-1 rounded-full overflow-hidden bg-white/5">
        <div
          className="bg-blue-light/60 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-red-400/60 transition-all duration-500 ml-auto"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchStatistics({
  possession,
  teamStats,
  homeTeamName,
  awayTeamName,
}: MatchStatisticsProps) {
  const home = teamStats?.red ?? {};
  const away = teamStats?.blue ?? {};

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      {/* Títulos dos times */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-foreground">{homeTeamName}</h3>
        <h3 className="text-xs text-muted uppercase tracking-wider">Estatísticas</h3>
        <h3 className="text-sm font-bold text-foreground">{awayTeamName}</h3>
      </div>

      {/* Barras de estatísticas */}
      <div className="space-y-4">
        <StatBar
          label="Posse de Bola"
          homeValue={possession.red ?? 50}
          awayValue={possession.blue ?? 50}
          homeLabel={`${possession.red ?? 50}%`}
          awayLabel={`${possession.blue ?? 50}%`}
        />

        <StatBar
          label="Chutes ao Gol"
          homeValue={home.shots ?? 0}
          awayValue={away.shots ?? 0}
        />

        <StatBar
          label="xG (Gols Esperados)"
          homeValue={home.xg ?? 0}
          awayValue={away.xg ?? 0}
          homeLabel={(home.xg ?? 0).toFixed(2)}
          awayLabel={(away.xg ?? 0).toFixed(2)}
        />

        <StatBar
          label="Escanteios"
          homeValue={home.corners ?? 0}
          awayValue={away.corners ?? 0}
        />

        <StatBar
          label="Bloqueios"
          homeValue={home.blocks ?? 0}
          awayValue={away.blocks ?? 0}
        />

        <StatBar
          label="Interceptações"
          homeValue={home.interceptions ?? 0}
          awayValue={away.interceptions ?? 0}
        />

        <StatBar
          label="Defesas do Goleiro"
          homeValue={home.saves ?? 0}
          awayValue={away.saves ?? 0}
        />

        {(home.fastestShotKmh ?? 0) > 0 || (away.fastestShotKmh ?? 0) > 0 ? (
          <StatBar
            label="Chute Mais Forte (km/h)"
            homeValue={home.fastestShotKmh ?? 0}
            awayValue={away.fastestShotKmh ?? 0}
            homeLabel={`${home.fastestShotKmh ?? 0} km/h`}
            awayLabel={`${away.fastestShotKmh ?? 0} km/h`}
          />
        ) : null}
      </div>
    </div>
  );
}
