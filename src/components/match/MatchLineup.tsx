"use client";

interface PlayerStat {
  id: string;
  name: string;
  team: number;
  position: string;
  goals: number;
  assists: number;
  shots: number;
  xg: number;
  blocks: number;
  saves: number;
  interceptions: number;
  corners: number;
  penSaves: number;
  rating: number;
  yellowCards: number;
  redCard: boolean;
}

interface MatchLineupProps {
  homePlayers: PlayerStat[];
  awayPlayers: PlayerStat[];
  homeTeamName: string;
  awayTeamName: string;
}

const POSITION_ORDER = ["GK", "VL", "ME", "MD", "CA", "RES", "COACH"];

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return "text-green-400";
  if (rating >= 7.0) return "text-green-500";
  if (rating >= 6.5) return "text-yellow-400";
  if (rating >= 6.0) return "text-yellow-500";
  if (rating >= 5.0) return "text-orange-400";
  return "text-red-400";
}

function getRatingBadgeColor(rating: number): string {
  if (rating >= 8.0) return "bg-green-500/20 border-green-500/40";
  if (rating >= 7.0) return "bg-green-600/20 border-green-600/40";
  if (rating >= 6.5) return "bg-yellow-500/20 border-yellow-500/40";
  if (rating >= 6.0) return "bg-yellow-600/20 border-yellow-600/40";
  return "bg-red-500/20 border-red-500/40";
}

function PlayerRow({ player }: { player: PlayerStat }) {
  const posLabel =
    player.position === "RES"
      ? "RES"
      : player.position === "COACH"
      ? "TEC"
      : player.position;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      {/* Rating Badge */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${getRatingBadgeColor(
          player.rating
        )}`}
      >
        <span className={getRatingColor(player.rating)}>
          {player.rating.toFixed(1)}
        </span>
      </div>

      {/* Avatar genérico (bola) */}
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
        ⚽
      </div>

      {/* Info do jogador */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
          {player.yellowCards > 0 && (
            <span className="text-xs">🟨{player.yellowCards > 1 ? "2" : ""}</span>
          )}
          {player.redCard && <span className="text-xs">🟥</span>}
        </div>
        <p className="text-[10px] text-muted">{posLabel}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs">
        {player.goals > 0 && (
          <span className="text-gold font-semibold">⚽{player.goals}</span>
        )}
        {player.assists > 0 && (
          <span className="text-blue-light font-semibold">🅰️{player.assists}</span>
        )}
        {player.saves > 0 && (
          <span className="text-green-400 font-semibold">🧤{player.saves}</span>
        )}
        {player.shots > 0 && (
          <span className="text-muted">🎯{player.shots}</span>
        )}
        {player.interceptions > 0 && (
          <span className="text-muted">🛡️{player.interceptions}</span>
        )}
      </div>
    </div>
  );
}

function TeamLineup({
  teamName,
  players,
}: {
  teamName: string;
  players: PlayerStat[];
}) {
  // Ordena por posição
  const sorted = [...players].sort((a, b) => {
    const aIdx = POSITION_ORDER.indexOf(a.position);
    const bIdx = POSITION_ORDER.indexOf(b.position);
    const aOrder = aIdx === -1 ? 99 : aIdx;
    const bOrder = bIdx === -1 ? 99 : bIdx;
    return aOrder - bOrder;
  });

  const starters = sorted.filter(
    (p) => p.position !== "RES" && p.position !== "COACH"
  );
  const reserves = sorted.filter((p) => p.position === "RES");
  const coaches = sorted.filter((p) => p.position === "COACH");

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-bold text-foreground mb-3">{teamName}</h3>

      {/* Titulares */}
      <div className="space-y-1">
        {starters.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </div>

      {/* Reservas */}
      {reserves.length > 0 && (
        <>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-3 mb-1 px-3">
            Reservas
          </p>
          <div className="space-y-1">
            {reserves.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        </>
      )}

      {/* Técnico */}
      {coaches.length > 0 && (
        <>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-3 mb-1 px-3">
            Técnico
          </p>
          <div className="space-y-1">
            {coaches.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MatchLineup({
  homePlayers,
  awayPlayers,
  homeTeamName,
  awayTeamName,
}: MatchLineupProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground text-center uppercase tracking-wider">
        Escalação
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeamLineup teamName={homeTeamName} players={homePlayers} />
        <TeamLineup teamName={awayTeamName} players={awayPlayers} />
      </div>
    </div>
  );
}
