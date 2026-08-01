"use client";

import { useState } from "react";

type Props = {
  confederations: { id: string; name: string; code: string }[];
  competitions: { id: string; name: string; season?: { league?: { name: string } } }[];
  countries: { id: string; name: string }[];
  sources: string[];
};

export default function CentralSincronizacao({ confederations, competitions, countries, sources }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [selectedConfed, setSelectedConfed] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [selectedSource, setSelectedSource] = useState("wikidata");
  const [linkUrl, setLinkUrl] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const call = async (endpoint: string, body?: any) => {
    setRunning(endpoint);
    setResult(null);
    try {
      const res = await fetch(`/api/sync/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setRunning(null);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/sync/logs");
      const data = await res.json();
      setLogs(data);
      setShowLogs(true);
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black gold-text">Central de Sincronização</h1>
          <p className="text-muted text-sm mt-1">Importar dados de fontes externas para o banco local</p>
        </div>
        <button onClick={fetchLogs} className="px-4 py-2 text-xs rounded-lg bg-blue-glow/20 text-blue-glow hover:bg-blue-glow/30 transition-all border border-blue-glow/30">
          Ver Logs
        </button>
      </div>

      {/* Fonte de dados */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Fonte de Dados
        </h2>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSource(s)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedSource === s
                  ? "bg-gold text-black"
                  : "glass text-muted hover:text-gold hover:gold-border"
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-[10px] text-muted self-center ml-2">
            (adicione providers em src/lib/dataSources.ts)
          </span>
        </div>
      </div>

      {/* Sincronização por Nível */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mundo */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">🌍</span> Sincronizar Mundo
          </h2>
          <p className="text-xs text-muted mb-4">Todas as confederações, países, bandeiras, escudos e estádios.</p>
          <button
            onClick={() => call("world", { source: selectedSource })}
            disabled={!!running}
            className="w-full py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-gold to-yellow-300 text-black hover:shadow-xl transition-all disabled:opacity-50"
          >
            {running === "world" ? "Sincronizando..." : "🌍 Sincronizar Mundo"}
          </button>
        </div>

        {/* Confederação */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Sincronizar Confederação
          </h2>
          <p className="text-xs text-muted mb-4">Apenas a confederação escolhida.</p>
          <select
            value={selectedConfed}
            onChange={(e) => setSelectedConfed(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg glass border border-border text-sm bg-blue-deep"
          >
            <option value="">Selecionar confederação...</option>
            {confederations.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
          <button
            onClick={() => call("confederation", { confederationId: selectedConfed, source: selectedSource })}
            disabled={!!running || !selectedConfed}
            className="w-full py-3 text-sm font-bold rounded-xl bg-blue-glow/30 text-blue-glow hover:bg-blue-glow/40 border border-blue-glow/20 transition-all disabled:opacity-30"
          >
            {running === "confederation" ? "Sincronizando..." : "🏆 Sincronizar Confederação"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Competição */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">⚽</span> Sincronizar Competição
          </h2>
          <p className="text-xs text-muted mb-4">Importa clubes, formato e atualiza a competição escolhida.</p>
          <select
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            className="w-full mb-3 p-3 py-2 rounded-xl border border-white/10 text-sm bg-blue-deep max-h-48"
          >
            <option value="">Selecionar competição...</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.season?.league ? `(${c.season.league.name})` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => call("competition", { competitionId: selectedCompetition, source: selectedSource })}
            disabled={!!running || !selectedCompetition}
            className="w-full py-3 text-sm font-bold rounded-xl bg-gold/20 text-gold hover:bg-gold/30 border border-gold/20 transition-all disabled:opacity-30"
          >
            {running === "competition" ? "Sincronizando..." : "⚽ Sincronizar Competição"}
          </button>
        </div>

        {/* Link */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">🔗</span> Sincronizar por Link
          </h2>
          <p className="text-xs text-muted mb-4">Informe uma URL oficial de competição/liga/copa.</p>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://exemplo.com/competicao"
            className="w-full mb-3 px-3 py-2 rounded-lg glass border border-border text-sm bg-blue-deep"
          />
          <button
            onClick={() => call("link", { url: linkUrl, source: selectedSource })}
            disabled={!!running || !linkUrl}
            className="w-full py-3 text-sm font-bold rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/20 transition-all disabled:opacity-30"
          >
            {running === "link" ? "Sincronizando..." : "🔗 Sincronizar por Link"}
          </button>
        </div>
      </div>

      {/* Botões específicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => call("flags", { source: selectedSource })}
          disabled={!!running}
          className="glass rounded-xl p-5 hover:gold-border transition-all disabled:opacity-50 group"
        >
          <div className="text-3xl mb-2">🚩</div>
          <h3 className="text-sm font-bold gold-text">Atualizar Bandeiras</h3>
          <p className="text-xs text-muted mt-1">Download local de todas as bandeiras</p>
        </button>

        <button
          onClick={() => call("emblems", { source: selectedSource })}
          disabled={!!running}
          className="glass rounded-xl p-5 hover:gold-border transition-all disabled:opacity-50 group"
        >
          <div className="text-3xl mb-2">🛡</div>
          <h3 className="text-sm font-bold gold-text">Atualizar Escudos</h3>
          <p className="text-xs text-muted mt-1">Download local de escudos (SVG primeiro)</p>
        </button>

        <button
          onClick={() => call("stadiums", { source: selectedSource })}
          disabled={!!running}
          className="glass rounded-xl p-5 hover:gold-border transition-all disabled:opacity-50 group"
        >
          <div className="text-3xl mb-2">🏟</div>
          <h3 className="text-sm font-bold gold-text">Atualizar Estádios</h3>
          <p className="text-xs text-muted mt-1">Nome, cidade, capacidade, coordenadas</p>
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
          <h3 className="text-sm font-bold gold-text mb-3">Resultado da Sincronização</h3>
          {result.error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold gold-text">{result.flagsDownloaded || 0}</div>
                <div className="text-[10px] text-muted mt-1">Bandeiras</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold gold-text">{result.emblemsDownloaded || 0}</div>
                <div className="text-[10px] text-muted mt-1">Escudos</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold gold-text">{result.stadiumsUpdated || 0}</div>
                <div className="text-[10px] text-muted mt-1">Estádios</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold gold-text">{result.competitionsUpdated || 0}</div>
                <div className="text-[10px] text-muted mt-1">Competições</div>
              </div>
            </div>
          )}
          {result.elapsedMs > 0 && (
            <p className="text-[10px] text-muted mt-4 text-center">
              Fonte: {result.source} • Tempo: {(result.elapsedMs / 1000).toFixed(1)}s
              {result.errors?.length > 0 && ` • ${result.errors.length} erro(s)`}
            </p>
          )}
        </div>
      )}

      {/* Logs */}
      {showLogs && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold gold-text">Histórico de Sincronização</h3>
            <button onClick={() => setShowLogs(false)} className="text-xs text-muted hover:text-gold transition-colors">
              Ocultar
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">Nenhum log ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted">
                    <th className="p-2">Data</th>
                    <th className="p-2">Nível</th>
                    <th className="p-2">Fonte</th>
                    <th className="p-2">Admin</th>
                    <th className="p-2 text-right">Clubes</th>
                    <th className="p-2 text-right">Escudos</th>
                    <th className="p-2 text-right">Erros</th>
                    <th className="p-2 text-right">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any, i: number) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-2">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                      <td className="p-2">
                        <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px]">
                          {log.level}
                        </span>
                      </td>
                      <td className="p-2 text-gold">{log.sourceName}</td>
                      <td className="p-2">{log.adminUsername}</td>
                      <td className="p-2 text-right">{log.clubsUpdated}</td>
                      <td className="p-2 text-right">{log.emblemsDownloaded + log.flagsDownloaded}</td>
                      <td className="p-2 text-right">
                        {(typeof log.errors === "string"
                          ? JSON.parse(log.errors || "[]").length
                          : log.errors.length) || 0}
                      </td>
                      <td className="p-2 text-right">{log.elapsedMs}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}