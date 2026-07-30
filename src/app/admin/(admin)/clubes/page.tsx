"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminClubes() {
  return (
    <CrudManager
      apiPath="/api/clubs"
      title="Clubes"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "city", label: "Cidade", type: "text" },
        { name: "country", label: "País", type: "text" },
        { name: "founded", label: "Fundação", type: "text" },
        { name: "emblem", label: "URL do Escudo", type: "text" },
        { name: "primaryKit", label: "Uniforme Primário", type: "text" },
        { name: "secondaryKit", label: "Uniforme Secundário", type: "text" },
        {
          name: "strength",
          label: "Força (1.0 a 10.0)",
          type: "select",
          default: "5.0",
          options: [
            { value: "1.0", label: "⭐ 1.0" },
            { value: "1.5", label: "⭐ 1.5" },
            { value: "2.0", label: "⭐ 2.0" },
            { value: "2.5", label: "⭐ 2.5" },
            { value: "3.0", label: "⭐ 3.0" },
            { value: "3.5", label: "⭐ 3.5" },
            { value: "4.0", label: "⭐ 4.0" },
            { value: "4.5", label: "⭐ 4.5" },
            { value: "5.0", label: "⭐ 5.0" },
            { value: "5.5", label: "⭐ 5.5" },
            { value: "6.0", label: "⭐ 6.0" },
            { value: "6.5", label: "⭐ 6.5" },
            { value: "7.0", label: "⭐ 7.0" },
            { value: "7.5", label: "⭐ 7.5" },
            { value: "8.0", label: "⭐ 8.0" },
            { value: "8.5", label: "⭐ 8.5" },
            { value: "9.0", label: "⭐ 9.0" },
            { value: "9.5", label: "⭐ 9.5" },
            { value: "10.0", label: "⭐ 10.0" },
          ],
        },
      ]}
      displayFields={[
        { key: "emblem", label: "Escudo" },
        { key: "name", label: "Nome" },
        { key: "city", label: "Cidade" },
        { key: "country", label: "País" },
        { key: "strength", label: "Força" },
      ]}
    />
  );
}