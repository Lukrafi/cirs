"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminPatrocinadores() {
  return (
    <CrudManager
      apiPath="/api/sponsors"
      title="Patrocinadores"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "logo", label: "URL do Logo", type: "text" },
        { name: "category", label: "Categoria", type: "text" },
        { name: "clubId", label: "ID do Clube", type: "text" },
      ]}
      displayFields={[
        { key: "logo", label: "Logo" },
        { key: "name", label: "Nome" },
        { key: "category", label: "Categoria" },
      ]}
    />
  );
}
