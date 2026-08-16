"use client";

import { useState, useEffect } from "react";

type GroupStanding = {
  clubId: string | null;
  clubName: string;
  clubEmblem: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  position: number;
};

type RecentResult = {
  id: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
};

type NextMatch = {
  id: string;
  homeName: string;
  awayName: string;
  round: string | null;
};

type GroupData = {
  id: string;
  name: string;
  standings: GroupStanding[];
  recentResults: RecentResult[];
  nextMatches: NextMatch[];
};

type LiveCompetition = {
  competition: { name: string; format: string; numTeams: number; relegated: number; qualifiedLibertadores: number } | null;
  groups: GroupData[];
  topScorers: { playerId: string | null; goals: number; assists: number }[];
  progress: { total: number; finished: number; scheduled: number; percentage: number };
  timestamp: number;
  error?: boolean;
};

export default function LiveCompetitionView({ competitionId }: { competitionId: string }) {
  const [data, setData] = useState<LiveCompetition | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!competitionId) return;
    const es = new EventSource(`/api/live?competitionId=${competitionId}`);

    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as LiveCompetition;
        if (!parsed.error) setData(parsed);
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [competitionId]);

  if (!data) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-muted">Conectando ao feed em tempo real...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold gold-text">{data.competition?.name || "Competição"}</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-xs text-muted">{connected ? "AO VIVO" : "Reconectando..."}</span>
          <span className="ml-4 text-sm text-muted">
            {data.progress.finished}/{data.progress.total} jogos ({data.progress.percentage}%)
          </span>
        </div>
      </div>

      {data.progress.total > 0 && (
        <div className="w-full bg-blue-deep rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-gold to-yellow-300 h-2 rounded-full transition-all duration-500"
            style={{ width: `${data.progress.percentage}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {data.groups.map((group) => (
            <div key={group.id} className="glass rounded-2xl overflow-x-auto mb-4">
              <div className="px-4 py-2 text-xs text-muted uppercase border-b border-border">{group.name}</div>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-muted text-xs">
                    <th className="p-3">#</th>
                    <th className="p-3">Time</th>
                    <th className="p-3 text-center">J</th>
                    <th className="p-3 text-center">V</th>
                    <th className="p-3 text-center">E</th>
                    <th className="p-3 text-center">D</th>
                    <th className="p-3 text-center">GP</th>
                    <th className="p-3 text-center">GC</th>
                    <th className="p-3 text-center">SG</th>
                    <th className="p-3 text-center">%</th>
                    <th className="p-3 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((s) => {
                    const totalPoints = s.played * 3;
                    const aproveitamento = totalPoints > 0 ? Math.round((s.points / totalPoints) * 100) : 0;
                    const isQualified = data.competition?.qualifiedLibertadores && s.position <= data.competition.qualifiedLibertadores;
                    const isRelegated = data.competition?.relegated && s.position >= group.standings.length - data.competition.relegated + 1;
                    return (
                      <tr
                        key={s.clubId}
                        className={`border-b border-border last:border-0 hover:bg-white/5 ${
                          isQualified ? "bg-green-500/5" : isRelegated ? "bg-red-500/5" : ""
                        }`}
                      >
                        <td className="p-3 text-muted">
                          {isQualified && <span className="text-green-400">●</span>}
                          {isRelegated && <span className="text-red-400">●</span>}
                          {!isQualified && !isRelegated && s.position}
                        </td>
                        <td className="p-3 font-medium flex items-center gap-2">
                          {s.clubEmblem && (
                            <img src={s.clubEmblem} alt="" className="w-5 h-5 rounded object-contain" />
                          )}
                          {s.clubName}
                        </td>
                        <td className="p-3 text-center">{s.played}</td>
                        <td className="p-3 text-center">{s.wins}</td>
                        <td className="p-3 text-center">{s.draws}</td>
                        <td className="p-3 text-center">{s.losses}</td>
                        <td className="p-3 text-center">{s.goalsFor}</td>
                        <td className="p-3 text-center">{s.goalsAgainst}</td>
                        <td className="p-3 text-center">{s.goalsDiff > 0 ? "+" : ""}{s.goalsDiff}</td>
                        <td className="p-3 text-center text-xs text-muted">{aproveitamento}%</td>
                        <td className="p-3 text-center font-bold gold-text">{s.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm uppercase text-muted mb-3">Últimos Resultados</h3>
            {data.groups.flatMap((g) => g.recentResults).length === 0 ? (
              <p className="text-muted text-xs">Nenhum resultado ainda.</p>
            ) : (
              <div className="space-y-2">
                {data.groups.flatMap((g) => g.recentResults).map((r) => (
                  <div key={r.id} className="text-xs flex items-center justify-between">
                    <span className="flex-1 text-right truncate">{r.homeName}</span>
                    <span className="px-2 font-bold gold-text">{r.homeScore} - {r.awayScore}</span>
                    <span className="flex-1 truncate">{r.awayName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm uppercase text-muted mb-3">Próximos Jogos</h3>
            {data.groups.flatMap((g) => g.nextMatches).length === 0 ? (
              <p className="text-muted text-xs">Nenhum jogo agendado.</p>
            ) : (
              <div className="space-y-2">
                {data.groups.flatMap((g) => g.nextMatches).map((m) => (
                  <div key={m.id} className="text-xs flex items-center justify-between">
                    <span className="flex-1 text-right truncate">{m.homeName}</span>
                    <span className="px-3 text-muted">{m.round || "vs"}</span>
                    <span className="flex-1 truncate">{m.awayName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm uppercase text-muted mb-3">Artilharia</h3>
            {data.topScorers.length === 0 ? (
              <p className="text-muted text-xs">Sem artilheiros ainda.</p>
            ) : (
              <div className="space-y-1">
                {data.topScorers.map((s, i) => (
                  <div key={s.playerId || i} className="text-xs flex justify-between">
                    <span className={`${i === 0 ? "text-gold font-bold" : "text-muted"}`}>#{i + 1}</span>
                    <span className="font-bold gold-text">{s.goals} gols</span>
                    <span className="text-muted">{s.assists} ass</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}