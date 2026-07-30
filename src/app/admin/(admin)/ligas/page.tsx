"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminLigas() {
  return (
    <CrudManager
      apiPath="/api/leagues"
      title="Ligas"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "logo", label: "URL do Logo", type: "text" },
      ]}
      displayFields={[
        { key: "logo", label: "Logo" },
        { key: "name", label: "Nome" },
      ]}
    />
  );
}
