"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminJogadores() {
  return (
    <CrudManager
      apiPath="/api/players"
      title="Jogadores"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "age", label: "Idade", type: "number", default: 20 },
        { name: "nationality", label: "Nacionalidade", type: "text" },
        { name: "clubId", label: "ID do Clube", type: "text" },
        { name: "position", label: "Posição", type: "text" },
        { name: "number", label: "Número", type: "number", default: 1 },
        { name: "dominantFoot", label: "Pé Dominante", type: "text" },
        { name: "height", label: "Altura (m)", type: "number", default: 1.75 },
        { name: "weight", label: "Peso (kg)", type: "number", default: 70 },
        { name: "photo", label: "URL da Foto", type: "text" },
        { name: "overall", label: "Overall", type: "number", default: 50 },
        { name: "pace", label: "Pace", type: "number", default: 50 },
        { name: "shooting", label: "Shooting", type: "number", default: 50 },
        { name: "passing", label: "Passing", type: "number", default: 50 },
        { name: "dribbling", label: "Dribbling", type: "number", default: 50 },
        { name: "defending", label: "Defending", type: "number", default: 50 },
        { name: "physical", label: "Physical", type: "number", default: 50 },
        { name: "goalkeeperStats", label: "Goalkeeper", type: "number", default: 50 },
      ]}
      displayFields={[
        { key: "photo", label: "Foto" },
        { key: "name", label: "Nome" },
        { key: "position", label: "Posição" },
        { key: "number", label: "#" },
        { key: "overall", label: "OVR" },
        { key: "age", label: "Idade" },
      ]}
    />
  );
}
