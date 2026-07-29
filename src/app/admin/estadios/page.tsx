"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminEstadios() {
  return (
    <CrudManager
      apiPath="/api/stadiums"
      title="Estádios"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "city", label: "Cidade", type: "text" },
        { name: "country", label: "País", type: "text" },
        { name: "capacity", label: "Capacidade", type: "number", default: 0 },
        { name: "image", label: "URL da Imagem", type: "text" },
        { name: "clubId", label: "ID do Clube", type: "text" },
      ]}
      displayFields={[
        { key: "name", label: "Nome" },
        { key: "city", label: "Cidade" },
        { key: "country", label: "País" },
        { key: "capacity", label: "Capacidade" },
      ]}
    />
  );
}
