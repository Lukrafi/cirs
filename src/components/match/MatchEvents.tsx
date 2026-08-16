"use client";

interface MatchEvent {
  time: string;
  type: string;
  msg: string;
  team: number;
}

interface MatchEventsProps {
  events: MatchEvent[];
  homeTeamName: string;
  awayTeamName: string;
}

function getEventIcon(type: string): string {
  if (type.includes("GOL_") || type === "GOLAÇO!") return "⚽";
  if (type.includes("GC_")) return "⚽";
  if (type === "CART_AMAR") return "🟨";
  if (type === "CART_VERM") return "🟥";
  if (type === "CART_2AM") return "🟨🟥";
  if (type.includes("DEFESA_PEN")) return "🧤";
  if (type.includes("SUB")) return "🔄";
  return "📋";
}

function getEventColor(type: string, team: number): string {
  if (type.includes("GC_")) return "text-orange-400";
  if (type === "CART_VERM" || type === "CART_2AM") return "text-red-400";
  if (type === "CART_AMAR") return "text-yellow-400";
  if (team === 1) return "text-blue-light";
  return "text-red-300";
}

function parseEventMessage(msg: string): { main: string; detail?: string } {
  // Goals
  const goalMatch = msg.match(/Gol de: ([^(]+)/);
  if (goalMatch) {
    return { main: goalMatch[1].trim(), detail: "Gol" };
  }

  // Own goals
  const ownGoalMatch = msg.match(/(?:foi o bagre do:|Esses bagres estão evoluíndo\.\.\. e um deles é esse:)\s*([^\n(]+)/);
  if (ownGoalMatch) {
    return { main: ownGoalMatch[1].trim(), detail: "Gol Contra" };
  }

  // Assists
  const assistMatch = msg.match(/Assistência de:\s*([^)]+)/);
  if (assistMatch) {
    return { main: msg.split("(")[0].trim(), detail: "Assist: " + assistMatch[1].trim() };
  }

  // Cards
  const cardMatch = msg.match(/^(.+?)\s*\(/);
  if (cardMatch) {
    return { main: cardMatch[1].trim() };
  }

  return { main: msg };
}

export default function MatchEvents({
  events,
  homeTeamName,
  awayTeamName,
}: MatchEventsProps) {
  if (events.length === 0) return null;

  // Ordena por tempo (minuto)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = parseInt(a.time) || 0;
    const timeB = parseInt(b.time) || 0;
    return timeA - timeB;
  });

  // Separa eventos por time
  const homeEvents = sortedEvents.filter((e) => e.team === 1);
  const awayEvents = sortedEvents.filter((e) => e.team === 2);
  const neutralEvents = sortedEvents.filter((e) => e.team === 0);

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <h3 className="text-sm font-bold text-foreground mb-4 text-center uppercase tracking-wider">
        Eventos da Partida
      </h3>

      <div className="relative">
        {/* Linha do tempo central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/50 -translate-x-1/2" />

        <div className="space-y-3">
          {sortedEvents.map((event, index) => {
            const isHome = event.team === 1;
            const isAway = event.team === 2;
            const icon = getEventIcon(event.type);
            const color = getEventColor(event.type, event.team);
            const parsed = parseEventMessage(event.msg);

            return (
              <div
                key={index}
                className={`flex items-center gap-2 ${
                  isHome
                    ? "flex-row"
                    : isAway
                    ? "flex-row-reverse"
                    : "justify-center"
                }`}
              >
                {/* Conteúdo */}
                <div
                  className={`flex-1 ${
                    isHome ? "text-right" : isAway ? "text-left" : "text-center"
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-2 ${
                      isHome ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${color}`}>
                        {parsed.main}
                      </p>
                      {parsed.detail && (
                        <p className="text-[10px] text-muted">{parsed.detail}</p>
                      )}
                    </div>
                    <span className="text-base">{icon}</span>
                  </div>
                </div>

                {/* Minuto */}
                <div className="w-12 text-center">
                  <span className="text-[10px] font-bold text-gold bg-blue-deep/60 px-2 py-0.5 rounded">
                    {event.time}
                  </span>
                </div>

                {/* Espaço do outro lado */}
                <div className="flex-1" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
