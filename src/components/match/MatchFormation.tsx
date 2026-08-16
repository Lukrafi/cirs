"use client";

interface PlayerOnPitch {
  name: string;
  position: string;
  rating: number;
  goals: number;
  assists: number;
}

interface MatchFormationProps {
  homeTeamName: string;
  awayTeamName: string;
  homeFormation: string;
  awayFormation: string;
  homePlayers: PlayerOnPitch[];
  awayPlayers: PlayerOnPitch[];
}

// Posições x5 no campo (normalizado 0-100 para x e y)
// Vermelho ataca pra direita, Azul espelhado
const FORMATION_POSITIONS: Record<string, Record<string, { x: number; y: number }>> = {
  padrao: {
    GK:  { x: 8, y: 50 },
    VL:  { x: 30, y: 50 },
    ME:  { x: 55, y: 25 },
    MD:  { x: 55, y: 75 },
    CA:  { x: 78, y: 50 },
  },
  quadrado: {
    GK:  { x: 8, y: 50 },
    VL:  { x: 30, y: 30 },
    ME:  { x: 30, y: 70 },
    MD:  { x: 60, y: 30 },
    CA:  { x: 60, y: 70 },
  },
  retranca: {
    GK:  { x: 8, y: 50 },
    VL:  { x: 25, y: 50 },
    ME:  { x: 35, y: 25 },
    MD:  { x: 35, y: 75 },
    CA:  { x: 65, y: 50 },
  },
  ofensiva: {
    GK:  { x: 8, y: 50 },
    VL:  { x: 28, y: 50 },
    ME:  { x: 45, y: 50 },
    MD:  { x: 68, y: 30 },
    CA:  { x: 68, y: 70 },
  },
};

const FORMATION_LABELS: Record<string, string> = {
  padrao: "Losango 1-1-2-1",
  quadrado: "Quadrado 2-2",
  retranca: "Retranca 3-1",
  ofensiva: "Ofensiva 1-1-2",
};

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return "bg-green-500";
  if (rating >= 7.0) return "bg-green-600";
  if (rating >= 6.5) return "bg-yellow-500";
  if (rating >= 6.0) return "bg-yellow-600";
  if (rating >= 5.0) return "bg-orange-500";
  return "bg-red-500";
}

function getRatingTextColor(rating: number): string {
  if (rating >= 7.0) return "text-green-400";
  if (rating >= 6.0) return "text-yellow-400";
  return "text-red-400";
}

function PlayerDot({
  player,
  position,
  isHome,
}: {
  player: PlayerOnPitch;
  position: { x: number; y: number };
  isHome: boolean;
}) {
  // Espelha a posição pro time visitante
  const x = isHome ? position.x : 100 - position.x;
  const y = position.y;

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* Rating badge */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${getRatingColor(
          player.rating
        )} shadow-lg z-10`}
      >
        {player.rating.toFixed(1)}
      </div>

      {/* Nome */}
      <div className="mt-0.5 text-center">
        <p className="text-[9px] sm:text-[10px] font-semibold text-foreground bg-black/60 px-1 rounded whitespace-nowrap">
          {player.name}
        </p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          {player.goals > 0 && (
            <span className="text-[8px] sm:text-[9px] text-gold">⚽{player.goals}</span>
          )}
          {player.assists > 0 && (
            <span className="text-[8px] sm:text-[9px] text-blue-light">🅰️{player.assists}</span>
          )}
        </div>
      </div>

      {/* Tooltip no hover */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
        <div className="glass-pop rounded-lg px-3 py-2 text-xs whitespace-nowrap">
          <p className="font-bold text-foreground">{player.name}</p>
          <p className="text-muted">{player.position}</p>
          <p className={`font-semibold ${getRatingTextColor(player.rating)}`}>
            Nota: {player.rating.toFixed(1)}
          </p>
          {player.goals > 0 && <p className="text-gold">⚽ {player.goals} gol(s)</p>}
          {player.assists > 0 && <p className="text-blue-light">🅰️ {player.assists} assist.</p>}
        </div>
      </div>
    </div>
  );
}

export default function MatchFormation({
  homeTeamName,
  awayTeamName,
  homeFormation,
  awayFormation,
  homePlayers,
  awayPlayers,
}: MatchFormationProps) {
  const homePositions = FORMATION_POSITIONS[homeFormation] ?? FORMATION_POSITIONS.padrao;
  const awayPositions = FORMATION_POSITIONS[awayFormation] ?? FORMATION_POSITIONS.padrao;

  // Mapeia jogadores por posição
  const mapPlayers = (players: PlayerOnPitch[]) => {
    const map: Record<string, PlayerOnPitch> = {};
    for (const p of players) {
      map[p.position] = p;
    }
    return map;
  };

  const homeMap = mapPlayers(homePlayers);
  const awayMap = mapPlayers(awayPlayers);

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      {/* Títulos */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{homeTeamName}</h3>
          <p className="text-[10px] text-muted">
            {FORMATION_LABELS[homeFormation] ?? homeFormation}
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-bold text-foreground">{awayTeamName}</h3>
          <p className="text-[10px] text-muted">
            {FORMATION_LABELS[awayFormation] ?? awayFormation}
          </p>
        </div>
      </div>

      {/* Campo - Time da Casa (metade superior) */}
      <div className="relative w-full aspect-[2/1] rounded-t-xl overflow-hidden border border-b-0 border-border/30"
        style={{
          background: "linear-gradient(180deg, #1a472a 0%, #1e5631 50%, #1a472a 100%)",
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-0 opacity-30">
          {/* Linha central */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
          {/* Círculo central */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/40 rounded-full" />
          {/* Área grande */}
          <div className="absolute left-0 top-1/4 w-1/5 h-1/2 border-r border-t border-b border-white/40" />
          <div className="absolute right-0 top-1/4 w-1/5 h-1/2 border-l border-t border-b border-white/40" />
          {/* Área pequena */}
          <div className="absolute left-0 top-[35%] w-[12%] h-[30%] border-r border-t border-b border-white/40" />
          <div className="absolute right-0 top-[35%] w-[12%] h-[30%] border-l border-t border-b border-white/40" />
        </div>

        {/* Jogadores do Time da Casa */}
        {Object.entries(homePositions).map(([pos, position]) => {
          const player = homeMap[pos];
          if (!player) return null;
          return (
            <PlayerDot
              key={`home-${pos}`}
              player={player}
              position={position}
              isHome={true}
            />
          );
        })}
      </div>

      {/* Campo - Time Visitante (metade inferior) */}
      <div className="relative w-full aspect-[2/1] rounded-b-xl overflow-hidden border border-t-0 border-border/30"
        style={{
          background: "linear-gradient(0deg, #1a472a 0%, #1e5631 50%, #1a472a 100%)",
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/40 rounded-full" />
          <div className="absolute left-0 top-1/4 w-1/5 h-1/2 border-r border-t border-b border-white/40" />
          <div className="absolute right-0 top-1/4 w-1/5 h-1/2 border-l border-t border-b border-white/40" />
          <div className="absolute left-0 top-[35%] w-[12%] h-[30%] border-r border-t border-b border-white/40" />
          <div className="absolute right-0 top-[35%] w-[12%] h-[30%] border-l border-t border-b border-white/40" />
        </div>

        {/* Jogadores do Time Visitante */}
        {Object.entries(awayPositions).map(([pos, position]) => {
          const player = awayMap[pos];
          if (!player) return null;
          return (
            <PlayerDot
              key={`away-${pos}`}
              player={player}
              position={position}
              isHome={false}
            />
          );
        })}
      </div>
    </div>
  );
}
