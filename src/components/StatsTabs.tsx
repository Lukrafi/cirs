"use client";

import { useState } from "react";

type Tab = "season" | "history";

type SeasonOption = { id: string; year: number };

type StatCards = { label: string; value: number | string }[];

type BarData = { name: string; value: number }[];

type ClubPerfData = {
  id: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
}[];

type SummaryData = {
  goals: number;
  assists: number;
  powerShots: number;
  shots: number;
  tackles: number;
  saves: number;
  yellows: number;
  reds: number;
};

type MatchesData = {
  id: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
}[];

export type SeasonData = {
  statCards: StatCards;
  clubGoals: BarData;
  clubPerformance: ClubPerfData;
  summary: SummaryData;
  recentMatches: MatchesData;
};

export type StatsData = {
  seasons: SeasonOption[];
  bySeason: Record<string, SeasonData>;
  statCards: { season: StatCards; history: StatCards };
  clubGoals: { season: BarData; history: BarData };
  clubPerformance: { season: ClubPerfData; history: ClubPerfData };
  summary: { season: SummaryData; history: SummaryData };
  recentMatches: { season: MatchesData; history: MatchesData };
};

export default function StatsTabs({ data }: { data: StatsData }) {
  const [tab, setTab] = useState<Tab>("season");
  const [seasonId, setSeasonId] = useState<string>("all");

  const seasonData =
    seasonId !== "all" && data.bySeason[seasonId]
      ? data.bySeason[seasonId]
      : {
          statCards: data.statCards.season,
          clubGoals: data.clubGoals.season,
          clubPerformance: data.clubPerformance.season,
          summary: data.summary.season,
          recentMatches: data.recentMatches.season,
        };

  const cards = tab === "season" ? seasonData.statCards : data.statCards.history;
  const goals = tab === "season" ? seasonData.clubGoals : data.clubGoals.history;
  const perf = tab === "season" ? seasonData.clubPerformance : data.clubPerformance.history;
  const summary = tab === "season" ? seasonData.summary : data.summary.history;
  const matches = tab === "season" ? seasonData.recentMatches : data.recentMatches.history;

  const maxGoals = Math.max(...goals.map((g) => g.value), 1);

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-8 max-w-xs">
        <button
          onClick={() => setTab("season")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "season" ? "bg-gold text-blue-deep" : "text-muted hover:text-foreground"
          }`}
        >
          Temporada
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "history" ? "bg-gold text-blue-deep" : "text-muted hover:text-foreground"
          }`}
        >
          História
        </button>
      </div>

      {/* Seletor de temporada */}
      {tab === "season" && data.seasons.length > 0 && (
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="mb-6 bg-blue-deep text-foreground text-sm rounded-lg px-4 py-2 border border-border"
        >
          <option value="all">Todas as temporadas</option>
          {data.seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((s) => (
          <div key={s.label} className="glass rounded-xl p-6 text-center">
            <div className="text-4xl font-black gold-text">{s.value}</div>
            <div className="text-xs text-muted uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gols por Clube */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          <span className="gold-text">Gols por Clube</span>
        </h2>
        <div className="glass rounded-2xl p-6">
          {goals.length === 0 ? (
            <p className="text-muted text-sm">Nenhum dado ainda.</p>
          ) : (
            <div className="space-y-3">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32 truncate">{g.name}</span>
                  <div className="flex-1 bg-blue-deep rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full transition-all"
                      style={{ width: `${(g.value / maxGoals) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold gold-text w-12 text-right">{g.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* V/E/D */}
        <section>
          <h2 className="text-2xl font-bold mb-4">
            <span className="gold-text">Vitórias / Empates / Derrotas</span>
          </h2>
          <div className="glass rounded-2xl p-6 space-y-4">
            {perf.length === 0 || perf.every((c) => c.wins + c.draws + c.losses === 0) ? (
              <p className="text-muted text-sm">Nenhum dado ainda.</p>
            ) : (
              perf.map((c) => {
                const total = c.wins + c.draws + c.losses || 1;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted">
                        {c.wins}V {c.draws}E {c.losses}D
                      </span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-blue-deep">
                      <div className="bg-green-500" style={{ width: `${(c.wins / total) * 100}%` }} />
                      <div className="bg-muted" style={{ width: `${(c.draws / total) * 100}%` }} />
                      <div className="bg-red-500" style={{ width: `${(c.losses / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Resumo geral */}
        <section>
          <h2 className="text-2xl font-bold mb-4">
            <span className="gold-text">Resumo Geral</span>
          </h2>
          <div className="glass rounded-2xl p-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Gols</span>
              <b className="gold-text">{summary.goals}</b>
            </div>
            <div className="flex justify-between">
              <span>Assistências</span>
              <b className="gold-text">{summary.assists}</b>
            </div>
            <div className="flex justify-between">
              <span>Power Shots</span>
              <b className="gold-text">{summary.powerShots}</b>
            </div>
            <div className="flex justify-between">
              <span>Chutes</span>
              <b className="gold-text">{summary.shots}</b>
            </div>
            <div className="flex justify-between">
              <span>Defesas</span>
              <b className="gold-text">{summary.saves}</b>
            </div>
            <div className="flex justify-between">
              <span>Desarmes</span>
              <b>{summary.tackles}</b>
            </div>
            <div className="flex justify-between">
              <span>Amarelos</span>
              <b>{summary.yellows}</b>
            </div>
            <div className="flex justify-between">
              <span>Vermelhos</span>
              <b>{summary.reds}</b>
            </div>
          </div>
        </section>
      </div>

      {/* Últimos Resultados */}
      <section>
        <h2 className="text-2xl font-bold mb-4">
          <span className="gold-text">Últimos Resultados</span>
        </h2>
        {matches.length === 0 ? (
          <p className="text-muted text-sm">Nenhum resultado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches.slice(0, 9).map((m) => (
              <div
                key={m.id}
                className="glass rounded-xl p-4 flex items-center justify-between text-sm"
              >
                <span className="flex-1 text-right">{m.homeName}</span>
                <span className="px-3 font-black gold-text">
                  {m.homeScore} - {m.awayScore}
                </span>
                <span className="flex-1">{m.awayName}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
