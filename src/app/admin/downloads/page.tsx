"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminDownloads() {
  return (
    <CrudManager
      apiPath="/api/downloads"
      title="Downloads"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "fileUrl", label: "URL do Arquivo", type: "text" },
        { name: "category", label: "Categoria", type: "text", default: "map" },
        { name: "version", label: "Versão", type: "text", default: "1.0" },
      ]}
      displayFields={[
        { key: "name", label: "Nome" },
        { key: "category", label: "Categoria" },
        { key: "version", label: "Versão" },
        { key: "downloads", label: "Downloads" },
      ]}
    />
  );
}
