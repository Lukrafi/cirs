"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminNoticias() {
  return (
    <CrudManager
      apiPath="/api/news"
      title="Notícias"
      fields={[
        { name: "title", label: "Título", type: "text" },
        { name: "content", label: "Conteúdo", type: "textarea" },
        { name: "image", label: "URL da Imagem", type: "text" },
        { name: "category", label: "Categoria", type: "text" },
        { name: "author", label: "Autor", type: "text" },
        { name: "clubId", label: "ID do Clube (opcional)", type: "text" },
        { name: "published", label: "Publicada?", type: "checkbox", default: true },
      ]}
      displayFields={[
        { key: "title", label: "Título" },
        { key: "category", label: "Categoria" },
        { key: "author", label: "Autor" },
        { key: "published", label: "Publicada" },
      ]}
    />
  );
}
