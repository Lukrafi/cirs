"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminTecnicos() {
  return (
    <CrudManager
      apiPath="/api/coaches"
      title="Técnicos"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "nationality", label: "Nacionalidade", type: "text" },
        { name: "age", label: "Idade", type: "number", default: 40 },
        { name: "clubId", label: "ID do Clube", type: "text" },
        { name: "overall", label: "Overall", type: "number", default: 50 },
        { name: "photo", label: "URL da Foto", type: "text" },
      ]}
      displayFields={[
        { key: "name", label: "Nome" },
        { key: "nationality", label: "Nacionalidade" },
        { key: "age", label: "Idade" },
        { key: "overall", label: "Overall" },
      ]}
    />
  );
}
