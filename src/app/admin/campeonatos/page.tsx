"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminCampeonatos() {
  return (
    <CrudManager
      apiPath="/api/competitions"
      title="Campeonatos"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "type", label: "Tipo", type: "text" },
        { name: "logo", label: "URL do Logo", type: "text" },
        { name: "seasonId", label: "ID da Temporada", type: "text" },
        { name: "isKnockout", label: "Mata-mata?", type: "checkbox", default: false },
      ]}
      displayFields={[
        { key: "logo", label: "Logo" },
        { key: "name", label: "Nome" },
        { key: "type", label: "Tipo" },
        { key: "isKnockout", label: "Mata-mata" },
      ]}
    />
  );
}
