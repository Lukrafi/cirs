"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminTemporadas() {
  return (
    <CrudManager
      apiPath="/api/seasons"
      title="Temporadas"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "leagueId", label: "ID da Liga", type: "text" },
        { name: "startDate", label: "Data de Início", type: "text" },
        { name: "endDate", label: "Data de Fim", type: "text" },
      ]}
      displayFields={[
        { key: "name", label: "Nome" },
        { key: "startDate", label: "Início" },
        { key: "endDate", label: "Fim" },
      ]}
    />
  );
}
