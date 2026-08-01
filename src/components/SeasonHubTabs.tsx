"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Standing = {
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
};

type MatchRow = {
  id: string;
  status: string;
  round: string | null;
  matchDate: string | null;
  homeName: string;
  awayName: string;
  homeEmblem: string;
  awayEmblem: string;
  homeScore: number | null;
  awayScore: number | null;
  isSimulated: boolean;
};

type Scorer = {
  playerId: string | null;
  playerName: string;
  clubName: string;
  clubEmblem: string;
  goals: number;
  assists: number;
  rating: number;
};

type GroupData = {
  id: string;
  name: string;
  standings: Standing[];
  matches: MatchRow[];
};

export type SeasonHubData = {
  competitionName: string;
  competitionLogo: string;
  groups: GroupData[];
  topScorers: Scorer[];
  totals: {
    matches: number;
    finished: number;
    scheduled: number;
    goals: number;
    avgRating: number;
    bestScorer: string;
  };
  liveFeedUrl: string | null;
};

type Tab = "classificacao" | "calendario" | "artilharia" | "stats";

const VALID_TABS: Tab[] = ["classificacao", "calendario", "artilharia", "stats"];

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "classificacao";
  const stored = window.localStorage.getItem("seasonHubTab");
  if (stored && VALID_TABS.includes(stored as Tab)) return stored as Tab;
  return "classificacao";
}

export default function SeasonHubTabs({ data }: { data: SeasonHubData }) {
  const [tab, setTab] = useState<Tab>(getInitialTab);

  useEffect(() => {
    window.localStorage.setItem("seasonHubTab", tab);
  }, [tab]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "classificacao", label: "Classificação", icon: "📊" },
    { key: "calendario", label: "Calendário", icon: "📅" },
    { key: "artilharia", label: "Artilharia", icon: "⚽" },
    { key: "stats", label: "Estatísticas", icon: "📈" },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
              tab === t.key
                ? "text-gold"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span className="mr-2">{t.icon}</span>
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        ))}
      </div>

      {tab === "classificacao" && <ClassificacaoTab data={data} />}
      {tab === "calendario" && <CalendarioTab data={data} />}
      {tab === "artilharia" && <ArtilhariaTab data={data} />}
      {tab === "stats" && <StatsTab data={data} />}
    </div>
  );
}

function ClassificacaoTab({ data }: { data: SeasonHubData }) {
  return (
    <div className="space-y-6">
      {data.groups.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhum grupo com classificação cadastrado.</p>
        </div>
      ) : (
        data.groups.map((g) => (
          <div key={g.id} className="glass rounded-2xl overflow-x-auto">
            <div className="px-4 py-2 text-xs text-muted uppercase border-b border-border">
              {g.name}
            </div>
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
                {g.standings.map((s, idx) => {
                  const totalPoints = s.played * 3;
                  const aprov = totalPoints > 0 ? Math.round((s.points / totalPoints) * 100) : 0;
                  return (
                    <tr
                      key={s.clubId || idx}
                      className="border-b border-border last:border-0 hover:bg-white/5"
                    >
                      <td className="p-3 text-muted">{idx + 1}</td>
                      <td className="p-3 font-medium flex items-center gap-2">
                        {s.clubEmblem && (
                          <img src={s.clubEmblem} alt="" className="w-5 h-5 rounded object-cover" />
                        )}
                        {s.clubName}
                      </td>
                      <td className="p-3 text-center">{s.played}</td>
                      <td className="p-3 text-center">{s.wins}</td>
                      <td className="p-3 text-center">{s.draws}</td>
                      <td className="p-3 text-center">{s.losses}</td>
                      <td className="p-3 text-center">{s.goalsFor}</td>
                      <td className="p-3 text-center">{s.goalsAgainst}</td>
                      <td className="p-3 text-center">
                        {s.goalsDiff > 0 ? "+" : ""}
                        {s.goalsDiff}
                      </td>
                      <td className="p-3 text-center text-xs text-muted">{aprov}%</td>
                      <td className="p-3 text-center font-bold gold-text">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

function CalendarioTab({ data }: { data: SeasonHubData }) {
  const allMatches = data.groups.flatMap((g) =>
    g.matches.map((m) => ({ ...m, groupName: g.name }))
  );

  if (allMatches.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-muted">Nenhuma partida cadastrada.</p>
      </div>
    );
  }

  const sorted = [...allMatches].sort((a, b) => {
    const ad = a.matchDate ? new Date(a.matchDate).getTime() : 0;
    const bd = b.matchDate ? new Date(b.matchDate).getTime() : 0;
    return bd - ad;
  });

  const recent = sorted.filter((m) => m.status === "finished").slice(0, 10);
  const upcoming = sorted.filter((m) => m.status === "scheduled").slice(0, 10);

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-sm uppercase tracking-wider text-muted mb-3">Próximos Jogos</h3>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h3 className="text-sm uppercase tracking-wider text-muted mb-3">Resultados Recentes</h3>
          <div className="space-y-2">
            {recent.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MatchRow({ m }: { m: MatchRow & { groupName?: string } }) {
  return (
    <Link
      href={`/simulacoes/match/${m.id}`}
      className="glass rounded-lg p-3 flex items-center gap-3 hover:bg-card/60 transition-colors text-sm"
    >
      <div className="flex-1 flex items-center justify-end gap-2">
        <span className="font-medium text-right">{m.homeName}</span>
        {m.homeEmblem && <img src={m.homeEmblem} alt="" className="w-6 h-6 rounded object-cover" />}
      </div>

      <div className="text-center px-3 py-1 bg-blue-deep rounded gold-border min-w-[80px]">
        {m.status === "finished" ? (
          <span className="font-bold gold-text">
            {m.homeScore} - {m.awayScore}
          </span>
        ) : (
          <span className="text-xs text-muted uppercase">vs</span>
        )}
      </div>

      <div className="flex-1 flex items-center gap-2">
        {m.awayEmblem && <img src={m.awayEmblem} alt="" className="w-6 h-6 rounded object-cover" />}
        <span className="font-medium">{m.awayName}</span>
      </div>

      <div className="text-xs text-muted min-w-[70px] text-right">
        {m.matchDate
          ? new Date(m.matchDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })
          : "—"}
        {m.round && <div className="text-[10px]">R{m.round}</div>}
      </div>
    </Link>
  );
}

function ArtilhariaTab({ data }: { data: SeasonHubData }) {
  if (data.topScorers.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-muted">Nenhum artilheiro cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-2 text-xs text-muted uppercase border-b border-border">
          ⚽ Artilharia
        </div>
        <div className="divide-y divide-border">
          {data.topScorers
            .slice()
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10)
            .map((s, idx) => (
              <Link
                key={s.playerId || idx}
                href={s.playerId ? `/jogadores/${s.playerId}` : "#"}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span
                  className={`text-lg font-bold w-8 ${
                    idx === 0 ? "text-gold" : idx === 1 ? "text-muted/80" : idx === 2 ? "text-amber-700" : "text-muted"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.playerName}</div>
                  <div className="text-xs text-muted truncate">{s.clubName}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold gold-text">{s.goals}</div>
                  <div className="text-[10px] text-muted uppercase">gols</div>
                </div>
              </Link>
            ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-2 text-xs text-muted uppercase border-b border-border">
          🎯 Assistências
        </div>
        <div className="divide-y divide-border">
          {data.topScorers
            .slice()
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 10)
            .map((s, idx) => (
              <Link
                key={s.playerId || idx}
                href={s.playerId ? `/jogadores/${s.playerId}` : "#"}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-bold w-8 text-muted">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.playerName}</div>
                  <div className="text-xs text-muted truncate">{s.clubName}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold gold-text">{s.assists}</div>
                  <div className="text-[10px] text-muted uppercase">assists</div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ data }: { data: SeasonHubData }) {
  const t = data.totals;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Partidas" value={t.matches} />
      <StatCard label="Disputadas" value={t.finished} />
      <StatCard label="Gols Marcados" value={t.goals} />
      <StatCard label="Nota Média" value={t.avgRating.toFixed(2)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass rounded-xl p-6 text-center">
      <div className="text-3xl font-black gold-text">{value}</div>
      <div className="text-xs text-muted uppercase mt-1">{label}</div>
    </div>
  );
}
