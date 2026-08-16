"use client";

import { formatDate } from "@/lib/utils";

interface TeamInfo {
  name: string;
  emblem: string;
}

interface MatchHeaderProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
  status: string;
  competition: string;
  round?: string;
  matchDate?: Date | null;
  isSimulated: boolean;
  mvp?: { name: string; rating: number };
}

export default function MatchHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  competition,
  round,
  matchDate,
  isSimulated,
  mvp,
}: MatchHeaderProps) {
  const isFinished = status === "finished";
  const isLive = status === "live";
  const isScheduled = status === "scheduled";

  return (
    <div className="relative overflow-hidden">
      {/* Background gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-deep/80 via-card/60 to-card/40" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 pb-6">
        {/* Competition + Date */}
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wider text-gold font-semibold">
            {competition}
          </p>
          {round && (
            <p className="text-[11px] text-muted mt-1">{round}</p>
          )}
          {matchDate && (
            <p className="text-[11px] text-muted/60 mt-0.5">
              {formatDate(matchDate)}
            </p>
          )}
          {isSimulated && (
            <span className="inline-block mt-2 text-[10px] uppercase tracking-wider text-blue-light bg-blue-deep/60 px-2 py-0.5 rounded">
              Simulado
            </span>
          )}
        </div>

        {/* Placar */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Time da Casa */}
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-3">
              {homeTeam.emblem && (
                <img
                  src={homeTeam.emblem}
                  alt={homeTeam.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              )}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {homeTeam.name}
                </h2>
                <p className="text-[10px] text-muted uppercase">Casa</p>
              </div>
            </div>
          </div>

          {/* Placar Central */}
          <div className="flex items-center gap-3 px-4">
            <span className="text-4xl sm:text-5xl font-black gold-text">
              {homeScore}
            </span>
            <div className="flex flex-col items-center">
              {isLive ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-red-400 font-semibold">AO VIVO</span>
                </div>
              ) : isFinished ? (
                <span className="text-[10px] text-muted font-semibold">encerrado</span>
              ) : (
                <span className="text-[10px] text-muted font-semibold">vs</span>
              )}
            </div>
            <span className="text-4xl sm:text-5xl font-black gold-text">
              {awayScore}
            </span>
          </div>

          {/* Time Visitante */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {awayTeam.name}
                </h2>
                <p className="text-[10px] text-muted uppercase">Visitante</p>
              </div>
              {awayTeam.emblem && (
                <img
                  src={awayTeam.emblem}
                  alt={awayTeam.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* MVP Badge */}
        {isFinished && mvp && mvp.name && (
          <div className="mt-6 flex justify-center">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
              <span className="text-lg">👑</span>
              <div>
                <p className="text-[10px] text-muted uppercase">Melhor em Campo</p>
                <p className="text-sm font-bold text-gold">{mvp.name}</p>
              </div>
              <div className="bg-gold/20 rounded-lg px-2 py-1">
                <span className="text-lg font-black gold-text">{mvp.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
