"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminPartidas() {
  return (
    <CrudManager
      apiPath="/api/matches"
      title="Partidas"
      fields={[
        { name: "homeTeamId", label: "ID Mandante", type: "text" },
        { name: "awayTeamId", label: "ID Visitante", type: "text" },
        { name: "groupId", label: "ID do Grupo", type: "text" },
        { name: "round", label: "Rodada", type: "text" },
        { name: "matchDate", label: "Data da Partida", type: "text" },
        { name: "status", label: "Status", type: "text", default: "scheduled" },
        { name: "homeScore", label: "Placar Mandante", type: "number" },
        { name: "awayScore", label: "Placar Visitante", type: "number" },
        { name: "isKnockout", label: "Mata-mata?", type: "checkbox", default: false },
      ]}
      displayFields={[
        { key: "round", label: "Rodada" },
        { key: "status", label: "Status" },
        { key: "homeScore", label: "Casa" },
        { key: "awayScore", label: "Fora" },
      ]}
    />
  );
}
