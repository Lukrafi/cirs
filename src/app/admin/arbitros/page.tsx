"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminArbitros() {
  return (
    <CrudManager
      apiPath="/api/referees"
      title="Árbitros"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "nationality", label: "Nacionalidade", type: "text" },
        { name: "age", label: "Idade", type: "number", default: 35 },
        { name: "photo", label: "URL da Foto", type: "text" },
      ]}
      displayFields={[
        { key: "name", label: "Nome" },
        { key: "nationality", label: "Nacionalidade" },
        { key: "age", label: "Idade" },
      ]}
    />
  );
}
